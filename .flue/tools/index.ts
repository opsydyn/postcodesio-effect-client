import { defineTool } from "@flue/runtime";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as v from "valibot";

import { classifySpecSyncChanges } from "../../scripts/specSyncPolicy.ts";

const repoRoot = process.cwd();

export const runScript = defineTool({
	name: "run_script",
	description:
		"Run a bun script from package.json. Returns stdout and stderr. Throws on non-zero exit.",
	input: v.object({
		script: v.pipe(
			v.string(),
			v.description(
				"The package.json script name to run, e.g. 'typecheck', 'test', 'bundle:full-spec', 'generate:full'",
			),
		),
	}),
	output: v.object({
		stdout: v.string(),
		stderr: v.string(),
	}),
	async run({ input }) {
		const result = spawnSync("bun", ["run", input.script], {
			cwd: repoRoot,
			encoding: "utf-8",
			timeout: 5 * 60 * 1000,
		});
		if (result.status !== 0) {
			throw new Error(
				`Script '${input.script}' exited ${result.status}\n${result.stderr}`,
			);
		}
		return { stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
	},
});

export const checkForChanges = defineTool({
	name: "check_for_changes",
	description:
		"Classify changes compared to the last git commit. Full-spec-only artefacts do not require a package release; public-contract changes do.",
	output: v.object({
		hasChanges: v.boolean(),
		changedFiles: v.array(v.string()),
		changeKind: v.picklist(["no-changes", "full-spec-only", "public-contract"]),
		requiresPackageRelease: v.boolean(),
	}),
	async run() {
		const result = spawnSync(
			"git",
			["diff", "--name-only", "HEAD", "--"],
			{ cwd: repoRoot, encoding: "utf-8" },
		);
		const changedFiles = (result.stdout ?? "")
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean);
		const policy = classifySpecSyncChanges(changedFiles);
		return {
			hasChanges: changedFiles.length > 0,
			changedFiles,
			changeKind: policy.kind,
			requiresPackageRelease: policy.requiresPackageRelease,
		};
	},
});

export const readFile = defineTool({
	name: "read_file",
	description:
		"Read a text file from the repo. Path is relative to the repo root. Content is truncated at maxBytes.",
	input: v.object({
		path: v.pipe(
			v.string(),
			v.description("Repo-relative file path, e.g. 'openapi/full-upstream/openapi.yaml'"),
		),
		maxBytes: v.optional(v.number(), 10_000),
	}),
	output: v.object({ content: v.string(), truncated: v.boolean() }),
	async run({ input }) {
		const content = readFileSync(join(repoRoot, input.path), "utf-8");
		const limit = input.maxBytes ?? 10_000;
		if (content.length > limit) {
			return { content: content.slice(0, limit), truncated: true };
		}
		return { content, truncated: false };
	},
});

export const submitSyncPR = defineTool({
	name: "submit_sync_pr",
	description:
		"Create a git branch, write a changeset file, commit all upstream-sync changes, push, and open a GitHub pull request. Only call this after the spec has changed and all checks pass.",
	input: v.object({
		requiresPackageRelease: v.boolean(),
		bumpType: v.picklist(
			["patch", "minor", "major"],
			"Semver bump: patch for doc/minor fixes, minor for new endpoints or non-breaking additions, major for breaking schema changes",
		),
		changesetSummary: v.pipe(
			v.string(),
			v.description("One-line plain-text summary for the changeset file"),
		),
		prTitle: v.pipe(v.string(), v.description("GitHub PR title")),
		prBody: v.pipe(
			v.string(),
			v.description("Full PR description in GitHub-flavoured markdown"),
		),
	}),
	output: v.object({ prUrl: v.string() }),
	async run({ input }) {
		const ts = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, 16); // YYYY-MM-DDTHH-mm
		const branch = `spec-sync/${ts}`;

		execFileSync("git", ["checkout", "-b", branch], { cwd: repoRoot, stdio: "pipe" });

		if (input.requiresPackageRelease) {
			mkdirSync(join(repoRoot, ".changeset"), { recursive: true });
			writeFileSync(
				join(repoRoot, ".changeset", `spec-sync-${ts}.md`),
				`---\n"@effect-postcodes/client": ${input.bumpType}\n---\n\n${input.changesetSummary}\n`,
				"utf-8",
			);
		}

		execFileSync(
			"git",
			[
				"add",
				"openapi/full-upstream/",
				"openapi/production.bundle.yaml",
				"generated/PostcodesFull.ts",
				"generated/PostcodesProduction.ts",
				".changeset/",
			],
			{ cwd: repoRoot, stdio: "pipe" },
		);
		execFileSync("git", ["commit", "-m", `chore: sync upstream postcodes.io spec (${ts})`], {
			cwd: repoRoot,
			stdio: "pipe",
		});
		execFileSync("git", ["push", "-u", "origin", branch], {
			cwd: repoRoot,
			stdio: "pipe",
		});

		const pr = spawnSync(
			"gh",
			[
				"pr",
				"create",
				"--base",
				"main",
				"--title",
				input.prTitle,
				"--body",
				input.prBody,
				"--head",
				branch,
			],
			{ cwd: repoRoot, encoding: "utf-8" },
		);
		if (pr.status !== 0) {
			throw new Error(`gh pr create failed: ${pr.stderr}`);
		}
		return { prUrl: (pr.stdout ?? "").trim() };
	},
});
