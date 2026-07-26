import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { Effect, Layer } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";

import { isApiNotFoundError, isApiValidationError, PostcodesClient } from "../src/index.ts";
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

describe("postcode operations", () => {
	test("returns an unwrapped random postcode", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { randomPostcode } = yield* PostcodesClient;
				const postcode = yield* randomPostcode();

				expect(postcode.postcode).toBe("SW1A 1AA");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns matching postcodes for a text query", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { searchPostcodes } = yield* PostcodesClient;
				const postcodes = yield* searchPostcodes({ query: "SW1A" });

				expect(postcodes.map((postcode) => postcode.postcode)).toEqual(["SW1A 1AA"]);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns matching postcodes for a latitude and longitude pair", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { searchPostcodes } = yield* PostcodesClient;
				const postcodes = yield* searchPostcodes({
					latitude: 51.501,
					longitude: -0.141,
				});

				expect(postcodes[0]?.incode).toBe("1AA");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("rejects ambiguous and incomplete postcode searches", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { searchPostcodes } = yield* PostcodesClient;
				const ambiguousError = yield* searchPostcodes({
					query: "SW1A",
					latitude: 51.501,
					longitude: -0.141,
				}).pipe(Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }));
				const incompleteError = yield* searchPostcodes({ latitude: 51.501 }).pipe(
					Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }),
				);

				expect(isApiValidationError(ambiguousError)).toBe(true);
				expect(isApiValidationError(incompleteError)).toBe(true);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns postcodes nearest to a postcode", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { findNearestPostcodes } = yield* PostcodesClient;
				const postcodes = yield* findNearestPostcodes("SW1A 1AA");

				expect(postcodes[0]?.distance).toBe(0);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns an unwrapped terminated postcode", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupTerminatedPostcode } = yield* PostcodesClient;
				const postcode = yield* lookupTerminatedPostcode("BS40 5AF");

				expect(postcode.year_terminated).toBe(2016);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns Scottish Postcode Directory data", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupScottishPostcode } = yield* PostcodesClient;
				const postcode = yield* lookupScottishPostcode("EH25 9NJ");

				expect(postcode.council_area).toBe("Midlothian");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("maps missing specialised postcode records to ApiNotFoundError", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupScottishPostcode, lookupTerminatedPostcode } = yield* PostcodesClient;
				const terminatedError = yield* lookupTerminatedPostcode("ZZ99 9ZZ").pipe(
					Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }),
				);
				const scottishError = yield* lookupScottishPostcode("ZZ99 9ZZ").pipe(
					Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }),
				);

				expect(isApiNotFoundError(terminatedError)).toBe(true);
				expect(isApiNotFoundError(scottishError)).toBe(true);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("rejects bulk lookup input outside the supported 1–100 range", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { bulkLookupPostcodes } = yield* PostcodesClient;
				const emptyError = yield* bulkLookupPostcodes([]).pipe(
					Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }),
				);
				const oversizedError = yield* bulkLookupPostcodes(
					Array.from({ length: 101 }, () => "SW1A 1AA"),
				).pipe(Effect.match({ onFailure: (error) => error, onSuccess: () => undefined }));

				expect(isApiValidationError(emptyError)).toBe(true);
				expect(isApiValidationError(oversizedError)).toBe(true);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));
});
