import * as Duration from "effect/Duration";
import * as Layer from "effect/Layer";
import * as RateLimiter from "effect/unstable/persistence/RateLimiter";

export const defaultRateLimit: {
	readonly window: Duration.Duration;
	readonly limit: number;
} = {
	window: Duration.seconds(10),
	limit: 30,
};

export const RateLimiterLive: Layer.Layer<RateLimiter.RateLimiter> =
	RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory));
