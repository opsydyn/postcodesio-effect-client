import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { Effect } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";

import * as PostcodesFull from "../generated/PostcodesFull.ts";
import { makeApiConfig } from "../src/ApiConfig.ts";
import {
	getSpikeMockServerBaseUrl,
	startSpikeMockServer,
	stopSpikeMockServer,
} from "./helpers/mockServer.ts";

const configureHttpClient = (
	client: HttpClient.HttpClient,
	baseUrl: string,
): HttpClient.HttpClient =>
	client.pipe(HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)));

const makeClient = (baseUrl: string) =>
	Effect.gen(function* () {
		const httpClient = yield* HttpClient.HttpClient;

		return PostcodesFull.make(configureHttpClient(httpClient, makeApiConfig({ baseUrl }).baseUrl));
	}).pipe(Effect.provide(FetchHttpClient.layer));

let server: ReturnType<typeof startSpikeMockServer>;
let baseUrl: string;

beforeAll(() => {
	server = startSpikeMockServer();
	baseUrl = getSpikeMockServerBaseUrl(server);
});

afterAll(() => {
	stopSpikeMockServer(server);
});

describe("PostcodesFull with Elysia", () => {
	test("decodes full-client responses from an Elysia mock server", async () => {
		const client = await Effect.runPromise(makeClient(baseUrl));

		const [outcode, outcodeHttpResponse] = await Effect.runPromise(
			client.FindOutcode("SW1A", {
				config: { includeResponse: true },
			}),
		);

		expect(outcodeHttpResponse.status).toBe(200);
		expect(outcode.result.outcode).toBe("SW1A");
		expect(outcode.result.country).toEqual(["England"]);
		expect(outcode.result.admin_district).toEqual(["Westminster", "Wandsworth"]);

		const randomPlace = await Effect.runPromise(client.randomPlace(undefined));

		expect(randomPlace.result.code).toBe("osgb4000000074564391");
		expect(randomPlace.result.name_1).toBe("London");
		expect(randomPlace.result.name_1_lang).toBe("eng");
		expect(randomPlace.result.district_borough).toBe("City of London");
	});
});
