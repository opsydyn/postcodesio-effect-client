import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { Effect, Layer, Match } from "effect";
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

const clientLayer = (url: string) =>
	PostcodesClient.layer({ baseUrl: url }).pipe(Layer.provide(FetchHttpClient.layer));

describe("@effect-postcodes/client contract", () => {
	test("lookupPostcode, bulkLookupPostcodes, and 404 error flow", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode, bulkLookupPostcodes } = yield* PostcodesClient;

				const postcode = yield* lookupPostcode("SW1A1AA");
				expect(postcode.postcode).toBe("SW1A 1AA");

				const bulk = yield* bulkLookupPostcodes(["SW1A1AA", "ZZ99ZZ"]);
				expect(bulk).toHaveLength(2);
				expect(bulk[1]?.result).toBeNull();

				const failure = yield* lookupPostcode("ZZ99ZZ").pipe(
					Effect.match({ onFailure: (e) => e, onSuccess: () => undefined }),
				);
				const notFound = Match.value(failure).pipe(
					Match.when(isApiNotFoundError, (e) => e),
					Match.orElse(() => undefined),
				);
				expect(notFound).toBeDefined();
				expect(notFound?.resource).toBe("postcode");
				expect(notFound?.cause.status).toBe(404);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("rejects path-segment escape attempts in outcode lookups", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { findOutcode } = yield* PostcodesClient;
				const failure = yield* findOutcode("../places/osgb4000000074564391").pipe(
					Effect.match({ onFailure: (e) => e, onSuccess: () => undefined }),
				);
				const notFound = Match.value(failure).pipe(
					Match.when(isApiNotFoundError, (e) => e),
					Match.orElse(() => undefined),
				);
				expect(notFound).toBeDefined();
				expect(notFound?.resource).toBe("outcode");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("decodes a null region for Scottish postcodes", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode } = yield* PostcodesClient;
				const postcode = yield* lookupPostcode("EH259NJ");
				expect(postcode.postcode).toBe("EH25 9NJ");
				expect(postcode.region).toBeNull();
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("decodes a null msoa for Northern Irish postcodes", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode } = yield* PostcodesClient;
				const postcode = yield* lookupPostcode("BT1 5GS");
				expect(postcode.country).toBe("Northern Ireland");
				expect(postcode.msoa).toBeNull();
				expect(postcode.pfa).toBeNull();
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("PostcodesClient is mockable via Layer.succeed", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode } = yield* PostcodesClient;
				const result = yield* lookupPostcode("anything");
				expect(result.postcode).toBe("MOCK 1AA");
			}).pipe(
				Effect.provide(
					Layer.succeed(PostcodesClient, {
						lookupPostcode: (_: string) => Effect.succeed({ postcode: "MOCK 1AA" } as any),
						bulkLookupPostcodes: (_: readonly string[]) => Effect.succeed([]),
						findOutcode: (_: string) => Effect.die("not called"),
						findPlace: (_: string) => Effect.die("not called"),
						randomPostcode: () => Effect.die("not called"),
						searchPostcodes: (_: string) => Effect.die("not called"),
						findNearestPostcodes: (_: string) => Effect.die("not called"),
					}),
				),
			),
		));
});
