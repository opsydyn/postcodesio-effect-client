const fullSpecOnlyPrefixes = ["openapi/full-upstream/"] as const;

const fullSpecOnlyFiles = new Set([
	"generated/PostcodesFull.ts",
	"generated/PostcodesProduction.ts",
	"openapi/production.bundle.yaml",
]);

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
