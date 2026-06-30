import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Effect, Match } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeApiConfig } from "../src/client/ApiConfig.ts";
import { makeApiService } from "../src/client/ApiService.ts";
import { isApiNotFoundError } from "../src/client/Errors.ts";
import { RateLimiterLive } from "../src/client/RateLimiting.ts";
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

describe("openapi-effect spike contract", () => {
	test("wraps generated GET, POST, and 404 error flows", async () => {
		const serviceEffect = makeApiService(makeApiConfig({ baseUrl })).pipe(
			Effect.provide(FetchHttpClient.layer),
			Effect.provide(RateLimiterLive),
		);

		const service = await Effect.runPromise(serviceEffect);

		const postcode = await Effect.runPromise(service.lookupPostcode("SW1A1AA"));
		expect(postcode.postcode).toBe("SW1A 1AA");

		const bulk = await Effect.runPromise(
			service.bulkLookupPostcodes(["SW1A1AA", "ZZ99ZZ"]),
		);
		expect(bulk).toHaveLength(2);
		expect(bulk[1]?.result).toBeNull();

		const failure = await Effect.runPromise(
			service.lookupPostcode("ZZ99ZZ").pipe(
				Effect.match({
					onFailure: (error) => error,
					onSuccess: () => undefined,
				}),
			),
		);

		const notFound = Match.value(failure).pipe(
			Match.when(isApiNotFoundError, (error) => error),
			Match.orElse(() => undefined),
		);

		expect(notFound).toBeDefined();
		expect(notFound?.resource).toBe("postcode");
		expect(notFound?.cause.status).toBe(404);
	});

	test("rejects path-segment escape attempts in outcode lookups", async () => {
		const serviceEffect = makeApiService(makeApiConfig({ baseUrl })).pipe(
			Effect.provide(FetchHttpClient.layer),
			Effect.provide(RateLimiterLive),
		);

		const service = await Effect.runPromise(serviceEffect);

		const failure = await Effect.runPromise(
			service.findOutcode("../places/osgb4000000074564391").pipe(
				Effect.match({
					onFailure: (error) => error,
					onSuccess: () => undefined,
				}),
			),
		);

		const notFound = Match.value(failure).pipe(
			Match.when(isApiNotFoundError, (error) => error),
			Match.orElse(() => undefined),
		);

		expect(notFound).toBeDefined();
		expect(notFound?.resource).toBe("outcode");
	});
});
