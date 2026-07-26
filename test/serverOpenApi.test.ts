import { describe, expect, test } from "bun:test";

import * as OpenApi from "effect/unstable/httpapi/OpenApi";

import { Api } from "../src/server/Api.ts";

interface OpenApiSchema {
	readonly type?: string;
	readonly items?: OpenApiSchema;
	readonly oneOf?: ReadonlyArray<OpenApiSchema>;
	readonly properties?: Readonly<Record<string, OpenApiSchema>>;
	readonly allOf?: ReadonlyArray<{ readonly maxItems?: number }>;
}

const hasObjectSchema = (schema: OpenApiSchema | undefined): boolean =>
	schema?.type === "object" ||
	schema?.oneOf?.some((candidate) => candidate.type === "object") === true;

describe("native server OpenAPI", () => {
	test("documents concrete production result schemas", () => {
		const specification = OpenApi.fromApi(Api);
		const lookupSchema =
			specification.paths["/postcodes/{postcode}"]?.get?.responses?.["200"]?.content?.[
				"application/json"
			]?.schema;
		const outcodeSchema =
			specification.paths["/outcodes/{outcode}"]?.get?.responses?.["200"]?.content?.[
				"application/json"
			]?.schema;
		const placeSchema =
			specification.paths["/places/{code}"]?.get?.responses?.["200"]?.content?.["application/json"]
				?.schema;
		const bulkSchema =
			specification.paths["/postcodes"]?.post?.responses?.["200"]?.content?.["application/json"]
				?.schema;
		const bulkPayloadSchema =
			specification.paths["/postcodes"]?.post?.requestBody?.content?.["application/json"]?.schema;

		expect(hasObjectSchema(lookupSchema as OpenApiSchema | undefined)).toBe(true);
		expect(hasObjectSchema(outcodeSchema as OpenApiSchema | undefined)).toBe(true);
		expect(hasObjectSchema(placeSchema as OpenApiSchema | undefined)).toBe(true);
		expect(bulkSchema?.type).toBe("array");
		expect(hasObjectSchema((bulkSchema as OpenApiSchema | undefined)?.items)).toBe(true);
		expect(
			((bulkPayloadSchema as OpenApiSchema | undefined)?.properties?.postcodes?.allOf ?? []).some(
				(constraint) => constraint.maxItems === 100,
			),
		).toBe(true);
	});
});
