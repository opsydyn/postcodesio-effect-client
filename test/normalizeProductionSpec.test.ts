import { describe, expect, test } from "bun:test";

import {
	normalizeProductionSpec,
	type ProductionSpec,
} from "../scripts/normalizeProductionSpec.ts";

const fixture: ProductionSpec = {
	openapi: "3.1.0",
	paths: {
		"/postcodes": {
			post: {
				responses: {
					"200": { description: "Success" },
				},
			},
		},
		"/places": {
			get: {
				responses: {
					"200": { description: "Success" },
				},
			},
		},
	},
	components: {
		schemas: {
			Postcode: {
				type: "string",
				nullable: true,
			},
		},
	},
};

describe("normalizeProductionSpec", () => {
	test("adds the missing bulk postcode request body without mutating the input", () => {
		const input = structuredClone(fixture);
		const output = normalizeProductionSpec(input);

		expect(output).not.toBe(input);
		expect(input.paths["/postcodes"].post.requestBody).toBeUndefined();
		expect(output.paths["/postcodes"].post.requestBody).toEqual({
			required: true,
			content: {
				"application/json": {
					schema: { $ref: "#/components/schemas/BulkLookupRequest" },
				},
			},
		});
		expect(output.components.schemas.BulkLookupRequest).toEqual({
			type: "object",
			required: ["postcodes"],
			properties: {
				postcodes: {
					type: "array",
					minItems: 1,
					maxItems: 100,
					items: { type: "string" },
				},
			},
		});
		expect(output.components.schemas.Postcode).toEqual({
			type: ["string", "null"],
		});
		expect(output.paths["/places"].get.parameters).toEqual([
			{
				name: "query",
				in: "query",
				required: true,
				schema: { type: "string" },
			},
		]);
	});
});
