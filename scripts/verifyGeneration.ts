import { execFileSync } from "node:child_process";

export const generatedArtifactPaths = [
	"generated/PostcodesApi.ts",
	"generated/PostcodesProduction.ts",
	"generated/PostcodesFull.ts",
	"openapi/production.bundle.yaml",
] as const;

export type CommandRunner = (command: string, args: ReadonlyArray<string>) => void;

export const verifyGeneratedArtifacts = (run: CommandRunner): void => {
	run("bun", ["run", "generate"]);
	run("bun", ["run", "generate:production"]);
	run("bun", ["run", "generate:full"]);
	run("git", ["diff", "--exit-code", "HEAD", "--", ...generatedArtifactPaths]);
};

if (import.meta.main) {
	verifyGeneratedArtifacts((command, args) => {
		execFileSync(command, args, { stdio: "inherit" });
	});
}
