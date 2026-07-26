const fullSpecOnlyPrefixes = ["openapi/full-upstream/"] as const;

const fullSpecOnlyFiles = new Set(["generated/PostcodesFull.ts", "openapi/production.bundle.yaml"]);

export type SpecSyncChangePolicy =
	| {
			readonly kind: "no-changes";
			readonly requiresPackageRelease: false;
	  }
	| {
			readonly kind: "full-spec-only";
			readonly requiresPackageRelease: false;
	  }
	| {
			readonly kind: "public-contract";
			readonly requiresPackageRelease: true;
	  };

export type GitDiffResult = {
	readonly error?: Error;
	readonly status?: number | null;
	readonly stderr?: string | null;
	readonly stdout?: string | null;
};

const isFullSpecOnlyPath = (path: string): boolean =>
	fullSpecOnlyFiles.has(path) || fullSpecOnlyPrefixes.some((prefix) => path.startsWith(prefix));

export const classifySpecSyncChanges = (
	changedFiles: ReadonlyArray<string>,
): SpecSyncChangePolicy => {
	if (changedFiles.length === 0) {
		return { kind: "no-changes", requiresPackageRelease: false };
	}

	if (changedFiles.every(isFullSpecOnlyPath)) {
		return { kind: "full-spec-only", requiresPackageRelease: false };
	}

	return { kind: "public-contract", requiresPackageRelease: true };
};

export const verifyRequestedReleasePolicy = (
	changedFiles: ReadonlyArray<string>,
	requiresPackageRelease: boolean,
): SpecSyncChangePolicy => {
	const policy = classifySpecSyncChanges(changedFiles);

	if (policy.requiresPackageRelease !== requiresPackageRelease) {
		throw new Error(
			`requiresPackageRelease=${requiresPackageRelease} conflicts with ${policy.kind} changes`,
		);
	}

	return policy;
};

export const changedFilesFromGitDiff = (result: GitDiffResult): ReadonlyArray<string> => {
	if (result.error !== undefined) {
		throw new Error(`Unable to run git diff: ${result.error.message}`);
	}

	if (result.status !== 0) {
		const detail = result.stderr?.trim();
		const message = detail === undefined || detail.length === 0 ? "" : `: ${detail}`;
		throw new Error(`git diff exited ${result.status}${message}`);
	}

	return (result.stdout ?? "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
};
