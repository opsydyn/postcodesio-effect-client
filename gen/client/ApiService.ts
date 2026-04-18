import { Effect, Match } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as Generated from "../generated/PostcodesSpike.ts";
import type { ApiConfig } from "./ApiConfig.ts";
import {
	ApiNotFoundError,
	type ApiServiceError,
	isGeneratedNotFoundError,
} from "./Errors.ts";

const configureHttpClient = (
	client: HttpClient.HttpClient,
	config: ApiConfig,
): HttpClient.HttpClient => {
	const prependBaseUrl = HttpClientRequest.prependUrl(config.baseUrl);
	const configureRequest = Match.value(config.authToken).pipe(
		Match.when(
			undefined,
			(): ((
				request: HttpClientRequest.HttpClientRequest,
			) => HttpClientRequest.HttpClientRequest) => prependBaseUrl,
		),
		Match.orElse(
			(
				authToken,
			): ((
				request: HttpClientRequest.HttpClientRequest,
			) => HttpClientRequest.HttpClientRequest) =>
				(request) =>
					HttpClientRequest.setHeader(
						"authorization",
						`Bearer ${authToken}`,
					)(prependBaseUrl(request)),
		),
	);

	return client.pipe(HttpClient.mapRequest(configureRequest));
};

const mapGeneratedError =
	(resource: string, identifier: string) =>
	(error: unknown): ApiServiceError =>
		Match.value(error).pipe(
			Match.when(isGeneratedNotFoundError, (notFoundError) =>
				ApiNotFoundError(resource, identifier, notFoundError.cause),
			),
			Match.orElse((other) => other as ApiServiceError),
		);

export function makeApiServiceFromClient(
	client: HttpClient.HttpClient,
	config: ApiConfig,
) {
	const generated = Generated.make(configureHttpClient(client, config));

	return {
		lookupPostcode: (postcode: string) =>
			generated.lookupPostcode(postcode, undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("postcode", postcode)),
			),
		bulkLookupPostcodes: (postcodes: ReadonlyArray<string>) =>
			generated.bulkLookupPostcodes({ payload: { postcodes } }).pipe(
				Effect.map((response) => response.result),
				Effect.mapError((error) => error as ApiServiceError),
			),
		findOutcode: (outcode: string) =>
			generated.findOutcode(outcode, undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("outcode", outcode)),
			),
		findPlace: (code: string) =>
			generated.findPlace(code, undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("place", code)),
			),
	};
}

export type ApiService = ReturnType<typeof makeApiServiceFromClient>;

export const makeApiService = Effect.fnUntraced(function* (config: ApiConfig) {
	const client = yield* HttpClient.HttpClient;

	return makeApiServiceFromClient(client, config);
});
