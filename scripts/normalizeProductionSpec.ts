import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

type OpenApiObject = Record<string, unknown>;

export type ProductionSpec = OpenApiObject & {
	readonly paths: Record<string, Record<string, OpenApiObject>>;
	readonly components: {
		readonly schemas: Record<string, OpenApiObject>;
	};
};

const inputUrl = new URL("../openapi/full-upstream/openapi.bundle.yaml", import.meta.url);
const outputUrl = new URL("../openapi/production.bundle.yaml", import.meta.url);

const isPlainObject = (value: unknown): value is OpenApiObject =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const cloneAndNormalizeNullable = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(cloneAndNormalizeNullable);
	}

	if (!isPlainObject(value)) {
		return value;
	}

	const output = Object.fromEntries(
		Object.entries(value).map(([key, nested]) => [key, cloneAndNormalizeNullable(nested)]),
	);

	if (output.nullable !== true) {
		return output;
	}

	const { nullable: _nullable, ...withoutNullable } = output;

	if (typeof output.type === "string") {
		return {
			...withoutNullable,
			type: [output.type, "null"],
		};
	}

	if (Array.isArray(output.type) && !output.type.includes("null")) {
		return {
			...withoutNullable,
			type: [...output.type, "null"],
		};
	}

	return output;
};

const requireObject = (value: unknown, context: string): OpenApiObject => {
	if (!isPlainObject(value)) {
		throw new Error(`Expected ${context} to be an object`);
	}

	return value;
};

const requireOperation = (paths: OpenApiObject, path: string, method: string): OpenApiObject => {
	const pathItem = requireObject(paths[path], `paths.${path}`);
	return requireObject(pathItem[method], `paths.${path}.${method}`);
};

const bulkLookupRequest = {
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
};

const bulkLookupRequestBody = {
	required: true,
	content: {
		"application/json": {
			schema: { $ref: "#/components/schemas/BulkLookupRequest" },
		},
	},
};

const placeQueryParameter = {
	name: "query",
	in: "query",
	required: true,
	schema: { type: "string" },
};

export const normalizeProductionSpec = (document: unknown): ProductionSpec => {
	const output = requireObject(cloneAndNormalizeNullable(document), "OpenAPI document");
	const paths = requireObject(output.paths, "paths");
	const components = requireObject(output.components ?? {}, "components");
	const schemas = requireObject(components.schemas ?? {}, "components.schemas");
	const bulkLookup = requireOperation(paths, "/postcodes", "post");
	const placeQuery = requireOperation(paths, "/places", "get");

	if (bulkLookup.requestBody === undefined) {
		bulkLookup.requestBody = bulkLookupRequestBody;
	}

	if (schemas.BulkLookupRequest === undefined) {
		schemas.BulkLookupRequest = bulkLookupRequest;
	}

	const parameters = Array.isArray(placeQuery.parameters) ? placeQuery.parameters : [];
	const hasQueryParameter = parameters.some(
		(parameter) =>
			isPlainObject(parameter) && parameter.name === "query" && parameter.in === "query",
	);
	if (!hasQueryParameter) {
		placeQuery.parameters = [...parameters, placeQueryParameter];
	}

	return {
		...output,
		paths: paths as ProductionSpec["paths"],
		components: {
			...components,
			schemas: schemas as ProductionSpec["components"]["schemas"],
		},
	};
};

const main = async (): Promise<void> => {
	const source = await readFile(inputUrl, "utf8");
	const normalized = normalizeProductionSpec(YAML.parse(source));
	await writeFile(outputUrl, YAML.stringify(normalized), "utf8");
	console.log(`Normalised ${fileURLToPath(inputUrl)} into ${fileURLToPath(outputUrl)}`);
};

if (import.meta.main) {
	await main();
}
