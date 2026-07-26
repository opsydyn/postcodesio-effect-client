import { describe, expect, test } from "bun:test";

import packageJson from "../package.json" with { type: "json" };
import {
	changedFilesFromGitDiff,
	classifySpecSyncChanges,
	verifyRequestedReleasePolicy,
} from "../scripts/specSyncPolicy.ts";
import { generatedArtifactPaths, verifyGeneratedArtifacts } from "../scripts/verifyGeneration.ts";

describe("classifySpecSyncChanges", () => {
	test("does not require a package release for generated full-spec artefacts only", () => {
		const policy = classifySpecSyncChanges([
			"openapi/full-upstream/openapi.yaml",
			"openapi/full-upstream/openapi.bundle.yaml",
			"openapi/production.bundle.yaml",
			"generated/PostcodesFull.ts",
		]);

		expect(policy).toEqual({
			kind: "full-spec-only",
			requiresPackageRelease: false,
		});
	});

	test("requires a package release when the production transport changes", () => {
		const policy = classifySpecSyncChanges(["generated/PostcodesProduction.ts"]);

		expect(policy).toEqual({
			kind: "public-contract",
			requiresPackageRelease: true,
		});
	});

	test("requires a package release when public-contract or package files change", () => {
		const policy = classifySpecSyncChanges([
			"generated/PostcodesProduction.ts",
			"src/PostcodesClient.ts",
			"package.json",
		]);

		expect(policy).toEqual({
			kind: "public-contract",
			requiresPackageRelease: true,
		});
	});

	test("rejects an agent attempt to override the computed release policy", () => {
		expect(() => verifyRequestedReleasePolicy(["generated/PostcodesProduction.ts"], false)).toThrow(
			"requiresPackageRelease=false conflicts with public-contract changes",
		);
		expect(() => verifyRequestedReleasePolicy(["generated/PostcodesFull.ts"], true)).toThrow(
			"requiresPackageRelease=true conflicts with full-spec-only changes",
		);
	});

	test("reports git diff command failures instead of treating them as no changes", () => {
		expect(() =>
			changedFilesFromGitDiff({ error: new Error("git executable missing"), status: null }),
		).toThrow("Unable to run git diff: git executable missing");
		expect(() =>
			changedFilesFromGitDiff({ status: 128, stderr: "fatal: not a git repository" }),
		).toThrow("git diff exited 128: fatal: not a git repository");
	});

	test("verifies every generated transport artefact from the committed bundle", () => {
		const commands: Array<ReadonlyArray<string>> = [];
		const run = (command: string, args: ReadonlyArray<string>): void => {
			commands.push([command, ...args]);
		};

		verifyGeneratedArtifacts(run);

		expect(packageJson.scripts["verify:generation"]).toBe("bun run scripts/verifyGeneration.ts");
		expect(generatedArtifactPaths).toContain("generated/PostcodesFull.ts");
		expect(commands).toContainEqual(["bun", "run", "generate:full"]);
		expect(commands).toContainEqual([
			"git",
			"diff",
			"--exit-code",
			"HEAD",
			"--",
			...generatedArtifactPaths,
		]);
	});

	test("fails when generated artefacts drift from HEAD", () => {
		const run = (command: string): void => {
			if (command === "git") {
				throw new Error("generated/PostcodesFull.ts differs from HEAD");
			}
		};

		expect(() => verifyGeneratedArtifacts(run)).toThrow(
			"generated/PostcodesFull.ts differs from HEAD",
		);
	});
});
