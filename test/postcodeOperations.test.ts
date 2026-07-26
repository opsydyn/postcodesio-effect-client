import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { Effect, Layer } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";

import { PostcodesClient } from "../src/index.ts";
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

	test("returns matching postcodes for a query", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { searchPostcodes } = yield* PostcodesClient;
				const postcodes = yield* searchPostcodes("SW1A");

				expect(postcodes.map((postcode) => postcode.postcode)).toEqual(["SW1A 1AA"]);
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
});
