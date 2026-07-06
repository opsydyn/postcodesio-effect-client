import { afterAll, beforeAll, describe, expect, test } from "bun:test";
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
	test("lookupPostcode always yields PostcodeResult or ApiNotFoundError for any string input — path encoding never escapes the postcodes route", async () => {
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
						// A SchemaError would indicate path encoding failed and the request hit a
						// different route (e.g., wrong endpoint) whose response shape doesn't match
						// PostcodeResult. This check verifies that doesn't happen — all requests
						// succeed as PostcodeResult or fail with ApiNotFoundError (404 for unknown).
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
		const service = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* PostcodesClient;
			}).pipe(Effect.provide(PostcodesClient.Default)),
		);
		expect(typeof service.lookupPostcode).toBe("function");
		expect(typeof service.bulkLookupPostcodes).toBe("function");
		expect(typeof service.findOutcode).toBe("function");
		expect(typeof service.findPlace).toBe("function");
	});
});
