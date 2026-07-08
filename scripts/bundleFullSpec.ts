import { readFile, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const specRootUrl = new URL("../openapi/full-upstream/", import.meta.url);
const entryRelativePath = "openapi.yaml";
const bundleRelativePath = "openapi.bundle.yaml";

type ReferenceTarget = {
	readonly relativePath: string;
	readonly fragment: string | undefined;
};

type ResolvedLocalReference = {
	readonly targetRelativePath: string;
	readonly value: unknown;
};

const structuredCache = new Map<string, unknown>();
const textCache = new Map<string, string>();

const isRemoteReference = (value: string): boolean => /^[a-z][a-z0-9+.-]*:/iu.test(value);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const parseBooleanLiteral = (value: unknown): boolean | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	if (value === "true") {
		return true;
	}

	if (value === "false") {
		return false;
	}

	return undefined;
};

const splitReference = (reference: string): ReferenceTarget => {
	const [pathPart, fragment] = reference.split("#", 2);
	return {
		relativePath: pathPart,
		fragment,
	};
};

const normalizeRelativePath = (fromRelativePath: string, targetRelativePath: string): string =>
	posix.normalize(posix.join(posix.dirname(fromRelativePath), targetRelativePath));

const readStructured = async (relativePath: string): Promise<unknown> => {
	const cached = structuredCache.get(relativePath);
	if (cached !== undefined) {
		return cached;
	}

	const contents = await readFile(new URL(relativePath, specRootUrl), "utf8");
	const parsed = relativePath.endsWith(".json") ? JSON.parse(contents) : YAML.parse(contents);
	structuredCache.set(relativePath, parsed);
	return parsed;
};

const readText = async (relativePath: string): Promise<string> => {
	const cached = textCache.get(relativePath);
	if (cached !== undefined) {
		return cached;
	}

	const contents = await readFile(new URL(relativePath, specRootUrl), "utf8");
	textCache.set(relativePath, contents);
	return contents;
};

const decodeJsonPointerToken = (token: string): string =>
	token.replaceAll("~1", "/").replaceAll("~0", "~");

const resolvePointer = (
	document: unknown,
	fragment: string | undefined,
	sourcePath: string,
): unknown => {
	if (fragment === undefined || fragment.length === 0) {
		return document;
	}

	if (!fragment.startsWith("/")) {
		throw new Error(`Unsupported fragment in ${sourcePath}: #${fragment}`);
	}

	let current: unknown = document;
	for (const token of fragment.slice(1).split("/").map(decodeJsonPointerToken)) {
		if (Array.isArray(current)) {
			const index = Number(token);
			current = current[index];
			continue;
		}
		if (isPlainObject(current)) {
			current = current[token];
			continue;
		}
		throw new Error(`Could not resolve fragment #${fragment} in ${sourcePath}`);
	}

	return current;
};

const resolveLocalReference = async (
	fromRelativePath: string,
	reference: string,
): Promise<ResolvedLocalReference> => {
	const { relativePath: targetPathPart, fragment } = splitReference(reference);
	if (!targetPathPart) {
		throw new Error(
			`Fragment-only local refs are not supported in ${fromRelativePath}: ${reference}`,
		);
	}

	const targetRelativePath = normalizeRelativePath(fromRelativePath, targetPathPart);
	if (targetRelativePath.endsWith(".md")) {
		if (fragment !== undefined) {
			throw new Error(`Markdown refs do not support fragments: ${reference}`);
		}
		return {
			targetRelativePath,
			value: await readText(targetRelativePath),
		};
	}

	const document = await readStructured(targetRelativePath);
	return {
		targetRelativePath,
		value: resolvePointer(document, fragment, targetRelativePath),
	};
};

const bundleNode = async (currentRelativePath: string, value: unknown): Promise<unknown> => {
	if (Array.isArray(value)) {
		return Promise.all(value.map((item) => bundleNode(currentRelativePath, item)));
	}

	if (!isPlainObject(value)) {
		return value;
	}

	if (
		typeof value.$ref === "string" &&
		!value.$ref.startsWith("#") &&
		!isRemoteReference(value.$ref)
	) {
		const resolved = await resolveLocalReference(currentRelativePath, value.$ref);
		const bundled = await bundleNode(resolved.targetRelativePath, resolved.value);

		const siblingEntries = Object.entries(value).filter(([key]) => key !== "$ref");
		if (siblingEntries.length === 0) {
			return bundled;
		}

		if (!isPlainObject(bundled)) {
			throw new Error(`Cannot merge sibling keys with non-object ref target for ${value.$ref}`);
		}

		const siblingObject = Object.fromEntries(siblingEntries);
		const bundledSiblings = await bundleNode(currentRelativePath, siblingObject);
		if (!isPlainObject(bundledSiblings)) {
			throw new Error(`Unexpected non-object sibling bundle for ${value.$ref}`);
		}
		return { ...bundled, ...bundledSiblings };
	}

	const outputEntries = await Promise.all(
		Object.entries(value).map(
			async ([key, nested]) => [key, await bundleNode(currentRelativePath, nested)] as const,
		),
	);
	const output = Object.fromEntries(outputEntries);

	if (output.type === "boolean") {
		const normalizedDefault = parseBooleanLiteral(output.default);
		if (normalizedDefault !== undefined) {
			output.default = normalizedDefault;
		}

		const normalizedExample = parseBooleanLiteral(output.example);
		if (normalizedExample !== undefined) {
			output.example = normalizedExample;
		}

		if (Array.isArray(output.examples)) {
			output.examples = output.examples.map((example) => parseBooleanLiteral(example) ?? example);
		}
	}

	return output;
};

const main = async (): Promise<void> => {
	const entryDocument = await readStructured(entryRelativePath);
	const bundledDocument = await bundleNode(entryRelativePath, entryDocument);
	const bundleUrl = new URL(bundleRelativePath, specRootUrl);
	await writeFile(bundleUrl, YAML.stringify(bundledDocument), "utf8");
	console.log(`Bundled ${entryRelativePath} into ${fileURLToPath(bundleUrl)}`);
};

await main();
