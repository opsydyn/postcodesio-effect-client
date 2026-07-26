import { describe, expect, test } from "bun:test";

import { classifySpecSyncChanges } from "../scripts/specSyncPolicy.ts";

describe("classifySpecSyncChanges", () => {
	test("does not require a package release for generated full-spec artefacts only", () => {
		const policy = classifySpecSyncChanges([
			"openapi/full-upstream/openapi.yaml",
			"openapi/full-upstream/openapi.bundle.yaml",
			"openapi/production.bundle.yaml",
			"generated/PostcodesFull.ts",
			"generated/PostcodesProduction.ts",
		]);

		expect(policy).toEqual({
			kind: "full-spec-only",
			requiresPackageRelease: false,
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
});
