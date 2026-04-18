import { Effect } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { makeApiConfig } from "../client/ApiConfig.ts";
import * as PostcodesFull from "../generated/PostcodesFull.ts";

const configureHttpClient = (
	client: HttpClient.HttpClient,
	baseUrl: string,
): HttpClient.HttpClient =>
	client.pipe(HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)));

const program = Effect.gen(function* () {
	const httpClient = yield* HttpClient.HttpClient;
	const client = PostcodesFull.make(
		configureHttpClient(httpClient, makeApiConfig().baseUrl),
	);

	const [outcode, outcodeResponse] = yield* client.FindOutcode("SW1A", {
		config: { includeResponse: true },
	});

	return {
		outcode: {
			status: outcodeResponse.status,
			outcode: outcode.result.outcode,
			countries: outcode.result.country,
			districts: outcode.result.admin_district,
			latitude: outcode.result.latitude,
			longitude: outcode.result.longitude,
		},
	};
});

const result = await Effect.runPromise(
	program.pipe(Effect.provide(FetchHttpClient.layer)),
);

console.log(JSON.stringify(result, null, 2));
