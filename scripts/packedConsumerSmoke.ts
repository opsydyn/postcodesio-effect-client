import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

type PackedPackage = {
	readonly filename: string;
};

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
	readonly devDependencies: { readonly effect: string };
};

const packed = JSON.parse(
	execFileSync("npm", ["pack", "--json"], {
		cwd: repoRoot,
		encoding: "utf-8",
	}),
) as ReadonlyArray<PackedPackage>;
const packageFilename = packed.at(0)?.filename;

if (packageFilename === undefined || packageFilename !== basename(packageFilename)) {
	throw new Error("npm pack did not report a package filename in the repository root");
}

const packageTarball = join(repoRoot, packageFilename);
const consumerRoot = mkdtempSync(join(tmpdir(), "effect-postcodes-consumer-"));

const cleanUp = (): void => {
	rmSync(consumerRoot, { recursive: true, force: true });
	rmSync(packageTarball, { force: true });
};

process.once("exit", cleanUp);

writeFileSync(
	join(consumerRoot, "package.json"),
	JSON.stringify(
		{
			name: "effect-postcodes-packed-consumer-smoke",
			private: true,
			type: "module",
			dependencies: {
				"@effect-postcodes/client": `file:${packageTarball}`,
				effect: packageJson.devDependencies.effect,
			},
		},
		null,
		2,
	),
);
writeFileSync(
	join(consumerRoot, "smoke.ts"),
	[
		'import { PostcodesClient, makeApiConfig } from "@effect-postcodes/client";',
		"",
		'if (typeof PostcodesClient.make !== "function") {',
		'\tthrow new Error("PostcodesClient.make is not available from the packed package");',
		"}",
		"",
		'if (makeApiConfig().baseUrl !== "https://api.postcodes.io") {',
		'\tthrow new Error("makeApiConfig is not available from the packed package");',
		"}",
	].join("\n"),
);

execFileSync("bun", ["install"], { cwd: consumerRoot, stdio: "inherit" });
execFileSync("bun", ["run", "smoke.ts"], { cwd: consumerRoot, stdio: "inherit" });
