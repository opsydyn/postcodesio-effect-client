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
});
