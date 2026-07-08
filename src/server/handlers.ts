import { Effect, Layer } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";

import { makeApiConfig } from "../ApiConfig.ts";
import { isApiNotFoundError } from "../Errors.ts";
import { makeApiService } from "../internal/ApiService.ts";
import { RateLimiterLive } from "../internal/RateLimiting.ts";
import { Api, OutcodeNotFound, PlaceNotFound, PostcodeNotFound } from "./Api.ts";

export const PostcodesApiHandlers = HttpApiBuilder.group(
	Api,
	"postcodes",
	Effect.fn(function* (handlers) {
		const service = yield* makeApiService(makeApiConfig());

		return handlers
			.handle("lookupPostcode", ({ params }) =>
				service.lookupPostcode(params.postcode).pipe(
					Effect.catchIf(
						isApiNotFoundError,
						() => Effect.fail(new PostcodeNotFound({ postcode: params.postcode })),
						(other) => Effect.die(other),
					),
				),
			)
			.handle("bulkLookupPostcodes", ({ payload }) =>
				service.bulkLookupPostcodes(payload.postcodes).pipe(Effect.orDie),
			)
			.handle("findOutcode", ({ params }) =>
				service.findOutcode(params.outcode).pipe(
					Effect.catchIf(
						isApiNotFoundError,
						() => Effect.fail(new OutcodeNotFound({ outcode: params.outcode })),
						(other) => Effect.die(other),
					),
				),
			)
			.handle("findPlace", ({ params }) =>
				service.findPlace(params.code).pipe(
					Effect.catchIf(
						isApiNotFoundError,
						() => Effect.fail(new PlaceNotFound({ code: params.code })),
						(other) => Effect.die(other),
					),
				),
			);
	}),
).pipe(Layer.provide([FetchHttpClient.layer, RateLimiterLive]));
