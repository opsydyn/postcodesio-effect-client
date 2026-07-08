import { Effect, Match } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as RateLimiter from "effect/unstable/persistence/RateLimiter";
import * as Generated from "../../generated/PostcodesApi.ts";
import type { ApiConfig } from "../ApiConfig.ts";
import {
	ApiNotFoundError,
	type ApiServiceError,
	isGeneratedNotFoundError,
} from "../Errors.ts";
import { defaultRateLimit } from "./RateLimiting.ts";

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

const encodePathSegment = (value: string): string => encodeURIComponent(value);

export function makeApiServiceFromClient(
	client: HttpClient.HttpClient,
	config: ApiConfig,
) {
	const generated = Generated.make(configureHttpClient(client, config));

	return {
		lookupPostcode: (postcode: string) =>
			generated.lookupPostcode(encodePathSegment(postcode), undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("postcode", postcode)),
			),
		bulkLookupPostcodes: (postcodes: ReadonlyArray<string>) =>
			generated.bulkLookupPostcodes({ payload: { postcodes } }).pipe(
				Effect.map((response) => response.result),
				Effect.mapError((error) => error as ApiServiceError),
			),
		findOutcode: (outcode: string) =>
			generated.findOutcode(encodePathSegment(outcode), undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("outcode", outcode)),
			),
		findPlace: (code: string) =>
			generated.findPlace(encodePathSegment(code), undefined).pipe(
				Effect.map((response) => response.result),
				Effect.mapError(mapGeneratedError("place", code)),
			),
	};
}

export type ApiService = ReturnType<typeof makeApiServiceFromClient>;

export const makeApiService = Effect.fnUntraced(function* (config: ApiConfig) {
	const client = yield* HttpClient.HttpClient;
	const limiter = yield* RateLimiter.RateLimiter;

	const rateLimitedClient = client.pipe(
		HttpClient.withRateLimiter({
			limiter,
			key: config.baseUrl,
			window: config.rateLimit?.window ?? defaultRateLimit.window,
			limit: config.rateLimit?.limit ?? defaultRateLimit.limit,
		}),
	);

	// Generated.make only types its client param as plain HttpClientError; the
	// RateLimiterError this adds still flows through at runtime and is folded
	// back into ApiServiceError by mapGeneratedError below.
	return makeApiServiceFromClient(
		rateLimitedClient as HttpClient.HttpClient,
		config,
	);
});
