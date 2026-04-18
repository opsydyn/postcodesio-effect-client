import { mkdir, rm, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const entryRelativePath = "openapi.yaml";
const sourceBaseUrl =
	"https://raw.githubusercontent.com/ideal-postcodes/postcodes.io/main/openapi/";
const outputRoot = fileURLToPath(
	new URL("../openapi/full-upstream/", import.meta.url),
);
const outputRootUrl = new URL("../openapi/full-upstream/", import.meta.url);

type ManifestEntry = {
	readonly relativePath: string;
	readonly sourceUrl: string;
	readonly bytes: number;
	readonly localRefs: ReadonlyArray<string>;
};

const isRemoteReference = (value: string): boolean =>
	/^[a-z][a-z0-9+.-]*:/iu.test(value);

const isStructuredDocument = (relativePath: string): boolean =>
	relativePath.endsWith(".yaml") ||
	relativePath.endsWith(".yml") ||
	relativePath.endsWith(".json");

const parseStructuredDocument = (
	relativePath: string,
	contents: string,
): unknown => {
	if (relativePath.endsWith(".json")) {
		return JSON.parse(contents) as unknown;
	}

	return YAML.parse(contents) as unknown;
};

const collectLocalReferences = (value: unknown): ReadonlyArray<string> => {
	const references = new Set<string>();

	const visit = (current: unknown): void => {
		if (Array.isArray(current)) {
			for (const item of current) {
				visit(item);
			}
			return;
		}

		if (current === null || typeof current !== "object") {
			return;
		}

		for (const [key, nested] of Object.entries(current)) {
			if (
				key === "$ref" &&
				typeof nested === "string" &&
				!nested.startsWith("#") &&
				!isRemoteReference(nested)
			) {
				references.add(nested);
				continue;
			}
			visit(nested);
		}
	};

	visit(value);
	return [...references].sort();
};

const normalizeReference = (
	fromRelativePath: string,
	reference: string,
): string => {
	const [pathPart] = reference.split("#", 1);
	if (!pathPart) {
		throw new Error(
			`Unsupported local fragment-only reference in ${fromRelativePath}: ${reference}`,
		);
	}
	return posix.normalize(posix.join(posix.dirname(fromRelativePath), pathPart));
};

const writeOutputFile = async (
	relativePath: string,
	contents: string,
): Promise<void> => {
	const fileUrl = new URL(relativePath, outputRootUrl);
	await mkdir(fileURLToPath(new URL(".", fileUrl)), { recursive: true });
	await writeFile(fileUrl, contents, "utf8");
};

const fetchText = async (relativePath: string): Promise<string> => {
	const sourceUrl = new URL(relativePath, sourceBaseUrl);
	const response = await fetch(sourceUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch ${sourceUrl.toString()}: ${response.status} ${response.statusText}`,
		);
	}
	return response.text();
};

const main = async (): Promise<void> => {
	await rm(outputRoot, { recursive: true, force: true });
	await mkdir(outputRoot, { recursive: true });

	const queue = [entryRelativePath];
	const seen = new Set<string>();
	const manifestEntries: Array<ManifestEntry> = [];

	while (queue.length > 0) {
		const relativePath = queue.shift();
		if (relativePath === undefined || seen.has(relativePath)) {
			continue;
		}
		seen.add(relativePath);

		const contents = await fetchText(relativePath);
		await writeOutputFile(relativePath, contents);

		const localRefs = isStructuredDocument(relativePath)
			? collectLocalReferences(parseStructuredDocument(relativePath, contents))
			: [];

		for (const localRef of localRefs) {
			const normalized = normalizeReference(relativePath, localRef);
			if (!seen.has(normalized)) {
				queue.push(normalized);
			}
		}

		manifestEntries.push({
			relativePath,
			sourceUrl: new URL(relativePath, sourceBaseUrl).toString(),
			bytes: Buffer.byteLength(contents, "utf8"),
			localRefs,
		});
	}

	manifestEntries.sort((left, right) =>
		left.relativePath.localeCompare(right.relativePath),
	);

	const manifest = {
		sourceBaseUrl,
		entryRelativePath,
		fileCount: manifestEntries.length,
		files: manifestEntries,
	};

	const manifestPath = new URL("manifest.json", outputRootUrl);
	await writeFile(
		manifestPath,
		`${JSON.stringify(manifest, null, 2)}\n`,
		"utf8",
	);

	console.log(
		`Fetched ${manifestEntries.length} upstream spec files into ${outputRoot}`,
	);
};

await main();
