import { Effect } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeApiConfig } from "../client/ApiConfig.ts";
import { makeApiService } from "../client/ApiService.ts";
import { RateLimiterLive } from "../client/RateLimiting.ts";

const serviceEffect = makeApiService(makeApiConfig()).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(RateLimiterLive),
);

const service = await Effect.runPromise(serviceEffect);

const result = await Effect.runPromise(service.lookupPostcode("SW1A1AA"));

console.log(JSON.stringify(result, null, 2));
