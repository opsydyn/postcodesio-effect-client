import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type * as HttpClient from "effect/unstable/http/HttpClient";

import type {
	BulkLookupItem,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesApi.ts";
import type { PostcodeLookup200, RandomPostcode200 } from "../generated/PostcodesProduction.ts";
import { type ApiConfig, defaultApiConfig } from "./ApiConfig.ts";
import type { ApiServiceError } from "./Errors.ts";
import { makeApiService } from "./internal/ApiService.ts";
import { RateLimiterLive } from "./internal/RateLimiting.ts";

export class PostcodesClient extends Context.Service<
	PostcodesClient,
	{
		readonly lookupPostcode: (postcode: string) => Effect.Effect<PostcodeResult, ApiServiceError>;
		readonly bulkLookupPostcodes: (
			postcodes: readonly string[],
		) => Effect.Effect<readonly BulkLookupItem[], ApiServiceError>;
		readonly findOutcode: (outcode: string) => Effect.Effect<OutcodeResult, ApiServiceError>;
		readonly findPlace: (code: string) => Effect.Effect<PlaceResult, ApiServiceError>;
		readonly randomPostcode: () => Effect.Effect<RandomPostcode200["result"], ApiServiceError>;
		readonly searchPostcodes: (
			query: string,
		) => Effect.Effect<PostcodeLookup200["result"], ApiServiceError>;
	}
>()("@effect-postcodes/client/PostcodesClient") {
	/** Resolves the service directly — for scripts and top-level programs.
	 * Bundles FetchHttpClient and an in-memory RateLimiterStore internally. */
	static readonly make = (config: ApiConfig = defaultApiConfig) =>
		makeApiService(config).pipe(
			Effect.provide(RateLimiterLive),
			Effect.provide(FetchHttpClient.layer),
		);

	/** Returns a Layer that requires the caller to provide an HttpClient.
	 * Use this when you want to supply NodeHttpClient or a custom implementation.
	 * Bundles an in-memory RateLimiterStore; override via Effect.provide if needed. */
	static readonly layer = (
		config: ApiConfig = defaultApiConfig,
	): Layer.Layer<PostcodesClient, never, HttpClient.HttpClient> =>
		Layer.effect(PostcodesClient, makeApiService(config).pipe(Effect.provide(RateLimiterLive)));

	/** Pre-wired layer with default config, FetchHttpClient, and in-memory rate limiting.
	 * Zero configuration required. */
	static readonly Default: Layer.Layer<PostcodesClient> = PostcodesClient.layer().pipe(
		Layer.provide(FetchHttpClient.layer),
	);
}
