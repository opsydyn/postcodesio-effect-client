import { afterAll, beforeAll, describe, test } from "bun:test";
import { Effect, Layer } from "effect";
import { FastCheck } from "effect/testing";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { isApiNotFoundError, PostcodesClient } from "../src/index.ts";
import {
	getSpikeMockServerBaseUrl,
	startSpikeMockServer,
	stopSpikeMockServer,
} from "./helpers/mockServer.ts";

let server: ReturnType<typeof startSpikeMockServer>;
let baseUrl: string;

beforeAll(() => {
	server = startSpikeMockServer();
	baseUrl = getSpikeMockServerBaseUrl(server);
});

afterAll(() => {
	stopSpikeMockServer(server);
});

describe("client behavioral properties", () => {
	test("lookupPostcode always yields ApiNotFoundError or PostcodeResult — never SchemaError", async () => {
		// Build the layer once outside the property so it is not rebuilt per iteration.
		const layer = PostcodesClient.layer({ baseUrl }).pipe(
			Layer.provide(FetchHttpClient.layer),
		);

		await FastCheck.assert(
			FastCheck.asyncProperty(
				FastCheck.string({ minLength: 1 }),
				(s) =>
					Effect.runPromise(
						PostcodesClient.pipe(
							Effect.flatMap(({ lookupPostcode }) => lookupPostcode(s)),
							Effect.match({
								onFailure: (e) => ({ ok: false as const, error: e }),
								onSuccess: () => ({ ok: true as const }),
							}),
							Effect.provide(layer),
						),
					).then(
						// A SchemaError here would mean the path encoding failed and the request
						// hit a different route whose response shape doesn't match PostcodeResult.
						// ApiNotFoundError is the only acceptable failure for unknown postcodes.
						(outcome) => outcome.ok || isApiNotFoundError(outcome.error),
					),
			),
			{ numRuns: 25 },
		);
	});

	test("bulkLookupPostcodes always returns an array for any non-empty input", async () => {
		const layer = PostcodesClient.layer({ baseUrl }).pipe(
			Layer.provide(FetchHttpClient.layer),
		);

		await FastCheck.assert(
			FastCheck.asyncProperty(
				FastCheck.array(FastCheck.string(), { minLength: 1, maxLength: 10 }),
				(postcodes) =>
					Effect.runPromise(
						PostcodesClient.pipe(
							Effect.flatMap(({ bulkLookupPostcodes }) =>
								bulkLookupPostcodes(postcodes),
							),
							Effect.provide(layer),
						),
					).then(Array.isArray),
			),
			{ numRuns: 25 },
		);
	});

	test("PostcodesClient.Default always provides all 4 required service methods", async () => {
		await FastCheck.assert(
			FastCheck.asyncProperty(
				FastCheck.constant(null),
				() =>
					Effect.runPromise(
						PostcodesClient.pipe(Effect.provide(PostcodesClient.Default)),
					).then(
						(service) =>
							typeof service.lookupPostcode === "function" &&
							typeof service.bulkLookupPostcodes === "function" &&
							typeof service.findOutcode === "function" &&
							typeof service.findPlace === "function",
					),
			),
			{ numRuns: 1 },
		);
	});
});
