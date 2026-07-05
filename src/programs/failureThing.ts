import { Effect } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeApiConfig } from "../ApiConfig.ts";
import { isApiNotFoundError } from "../Errors.ts";
import { makeApiService } from "../internal/ApiService.ts";
import { RateLimiterLive } from "../internal/RateLimiting.ts";

const serviceEffect = makeApiService(makeApiConfig()).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(RateLimiterLive),
);

const service = await Effect.runPromise(serviceEffect);

const outcome = await Effect.runPromise(
	service.lookupPostcode("ZZ99ZZ").pipe(
		Effect.match({
			onFailure: (error) => error,
			onSuccess: (result) => result,
		}),
	),
);

if (isApiNotFoundError(outcome)) {
	console.log(JSON.stringify(outcome, null, 2));
} else {
	console.log(JSON.stringify(outcome, null, 2));
}
