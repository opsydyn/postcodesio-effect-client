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

describe("location operations", () => {
	test("searches places by query", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { searchPlaces } = yield* PostcodesClient;
				const places = yield* searchPlaces("London");

				expect(places[0]?.code).toBe("osgb4000000074564391");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("returns an unwrapped random place", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { randomPlace } = yield* PostcodesClient;
				const place = yield* randomPlace();

				expect(place.name_1).toBe("London");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));
});
