import { Effect } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeApiConfig } from "../ApiConfig.ts";
import { makeApiService } from "../internal/ApiService.ts";
import { RateLimiterLive } from "../internal/RateLimiting.ts";

const serviceEffect = makeApiService(makeApiConfig()).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(RateLimiterLive),
);

const service = await Effect.runPromise(serviceEffect);

const result = await Effect.runPromise(
	service.bulkLookupPostcodes(["SW1A1AA", "EC1A1BB"]),
);

console.log(JSON.stringify(result, null, 2));
