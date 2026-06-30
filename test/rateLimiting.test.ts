import { describe, expect, test } from "bun:test";
import { Effect, Fiber, Ref } from "effect";
import { TestClock } from "effect/testing";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import * as RateLimiter from "effect/unstable/persistence/RateLimiter";
import { RateLimiterLive } from "../gen/client/RateLimiting.ts";

describe("RateLimiterLive", () => {
	test("delays requests beyond the configured limit", async () => {
		const program = Effect.gen(function* () {
			const attempts = yield* Ref.make(0);
			const limiter = yield* RateLimiter.RateLimiter;

			const client = HttpClient.make((request) =>
				Effect.gen(function* () {
					yield* Ref.update(attempts, (n) => n + 1);
					return HttpClientResponse.fromWeb(
						request,
						new Response(null, { status: 200 }),
					);
				}),
			).pipe(
				HttpClient.withRateLimiter({
					limiter,
					key: "test",
					limit: 1,
					window: "1 minute",
				}),
			);

			const fiber = yield* client
				.get("http://test/")
				.pipe(Effect.andThen(client.get("http://test/")), Effect.forkChild);

			yield* TestClock.adjust("59 seconds");
			expect(yield* Ref.get(attempts)).toBe(1);

			yield* TestClock.adjust("1 second");
			yield* Fiber.join(fiber);

			expect(yield* Ref.get(attempts)).toBe(2);
		});

		await Effect.runPromise(
			program.pipe(
				Effect.provide(RateLimiterLive),
				Effect.provide(TestClock.layer()),
			),
		);
	});
});
