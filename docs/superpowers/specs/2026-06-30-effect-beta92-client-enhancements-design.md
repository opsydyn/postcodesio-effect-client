# Design: effect beta.92 bump + postcodes.io client enhancements

## Context

`package.json` pins `effect`, `@effect/platform-node`, and `@effect/openapi-generator`
at `4.0.0-beta.92` (up from `4.0.0-beta.50`). Compatibility was verified: clean
`bun install`, clean `tsc --noEmit`, passing `bun test`, and a no-op regeneration
of `gen/generated/PostcodesSpike.ts` (one cosmetic generic-bound change,
`Schema.Top` → `Schema.Constraint`, from the generator's own beta.86 update — not
hand-applied here, it's a byproduct of running `bun run generate` again).

Reviewing `gen/client/` against the beta.51–92 changelog surfaced three concrete,
independent improvements to the handwritten wrapper. This spec covers all three.

## 1. URL-encode path parameters

**Problem:** `gen/generated/PostcodesSpike.ts` builds request URLs by raw string
interpolation — `` `/postcodes/${postcode}` ``, `` `/outcodes/${outcode}` ``,
`` `/places/${code}` ``. A postcode containing a space (`"SW1A 1AA"`, the normal
human-typed form) goes into the URL unescaped. Only the no-space form
(`"SW1A1AA"`) is exercised today in `test/contract.test.ts`.

**Fix:** in `gen/client/ApiService.ts`, add `encodePathSegment` and apply it to
the `postcode`, `outcode`, and `code` arguments before they're passed to the
generated functions. `bulkLookupPostcodes` is untouched — postcodes travel in
the JSON body there, not the URL.

**Test:** extend `test/contract.test.ts` with a lookup using `"SW1A 1AA"`
(with the space) against the mock server, asserting success.

## 2. Adaptive rate limiting on all four operations

**Why:** postcodes.io rate-limits by IP across all endpoints (not per-endpoint),
so only guarding the bulk endpoint wouldn't protect against tripping the limit
via repeated single lookups.

**What's new since beta.50 that enables this:** beta.88 added adaptive
consume/feedback to the unstable persistent `RateLimiterStore` API
(`effect/unstable/persistence` → `RateLimiter` module) — in-memory and
Redis-backed bounded cooldown, learning, and learned-pacing behavior driven by
real `429`/`Retry-After` feedback. `effect/unstable/http/HttpClient` exposes
`withRateLimiter(client, options)`, a combinator that wraps a client's
`execute` to consult a `RateLimiter.RateLimiter` before every request, parses
`Retry-After` / `RateLimit-*` response headers, and automatically retries
`429`s while feeding learned pacing back into the limiter. Wrapping the
`HttpClient` once covers all four operations without touching each method.

**Shape:**

- New `gen/client/RateLimiting.ts`:
  - `RateLimiterLive: Layer.Layer<RateLimiter.RateLimiter>` — `RateLimiter.layer`
    provided with `RateLimiter.layerStoreMemory` (in-memory token-bucket store;
    no Redis dependency needed for this repo).
  - `defaultRateLimit: { window: Duration.Input; limit: number }` — a
    conservative starting point, explicitly commented as *not* a verified
    published postcodes.io number, tunable via config.
- `gen/client/ApiConfig.ts`: add optional
  `rateLimit?: { window: Duration.Input; limit: number }`.
- `gen/client/ApiService.ts`: `makeApiService` (the `Effect.fnUntraced`
  constructor) additionally does `yield* RateLimiter.RateLimiter` and wraps the
  resolved `HttpClient.HttpClient` with `HttpClient.withRateLimiter` (keyed on
  `config.baseUrl`) before handing off to `configureHttpClient`. This adds
  `RateLimiter.RateLimiterError` to the returned effect's error channel and
  `RateLimiter.RateLimiter` to its requirement channel — both explicit.
  `makeApiServiceFromClient` (the synchronous variant, for callers supplying
  their own already-built client) is unchanged.
- Callers add `Effect.provide(RateLimiterLive)` alongside
  `Effect.provide(FetchHttpClient.layer)`: `test/contract.test.ts`,
  `gen/programs/getThing.ts`, `gen/programs/createThing.ts`,
  `gen/programs/failureThing.ts`. (`gen/programs/fullClient.ts` builds its own
  client directly against `PostcodesFull.ts` rather than going through
  `makeApiService`, so it's unaffected.)

**Test:** new test exercising `RateLimiterLive` with a tight limit, using
`TestClock` to assert requests beyond the configured limit get delayed rather
than failing outright — no real sleeps.

## 3. `Errors.ts`: use built-in guards instead of duck-typing

**Why now:** beta.84 normalized the Schema error model — `SchemaError` now
extends `Data.TaggedError`, so it's a real `instanceof Error`, and
`Schema.isSchemaError` is an existing exported type guard for it.

**Change:** in `gen/client/Errors.ts`, replace the hand-rolled
`typeof input === "object" && input !== null && "_tag" in input && input._tag === ...`
checks in `isApiNotFoundError` and `isGeneratedNotFoundError` with
`Predicate.isTagged` (existing `effect/Predicate` export, a good fit now that
this file is being touched). Where the code needs to distinguish a schema
failure from other `ApiServiceError` members, use `Schema.isSchemaError`
instead of importing `SchemaError` as a bare type.

Behavior-preserving refactor — no new test, existing contract test continues to
cover `isApiNotFoundError`.

## Docs and runbook updates

- `README.md`: mention the rate limiter as a required layer for `makeApiService`
  consumers, and note the effect version is now `4.0.0-beta.92`.
- `ASSESSMENT.md`: append a short dated note recording the beta.50 → beta.92
  bump, the generator's `Schema.Top` → `Schema.Constraint` regeneration diff,
  and that `RateLimiterLive` was added on top of effect's beta.88
  `RateLimiterStore` adaptive consume/feedback API.
- `CUTOVER_RUNBOOK.md`: add a watchpoint noting that `makeApiService` now
  requires `RateLimiterLive` to be provided alongside `FetchHttpClient.layer`,
  so smoke-checks and example runs in a freshly extracted/cloned copy must
  supply it or they'll fail to compile/run.

## Out of scope

- No change to `gen/generated/*.ts` beyond what `bun run generate` /
  `bun run generate:full` naturally produce from the bumped generator — no
  hand-edits to generated files.
- No Redis-backed rate limiter store (no Redis dependency in this repo).
- No change to `gen/programs/fullClient.ts` or `test/fullClient.elysia.test.ts`
  (untouched code path).
