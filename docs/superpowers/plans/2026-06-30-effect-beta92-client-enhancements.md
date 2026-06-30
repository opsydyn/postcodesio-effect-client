# effect beta.92 client enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump `effect`/`@effect/platform-node`/`@effect/openapi-generator` to `4.0.0-beta.92` and ship three wrapper-layer improvements this surfaced: safe path-segment encoding, adaptive rate limiting on all four API calls, and a built-in-guards cleanup of `Errors.ts`.

**Architecture:** All changes live in `gen/client/` (the handwritten wrapper around the generated client) plus their tests and three doc files. No hand-edits to `gen/generated/*.ts`.

**Tech Stack:** TypeScript, Bun (`bun:test`), effect `4.0.0-beta.92` (`HttpClient.withRateLimiter`, `effect/unstable/persistence/RateLimiter`, `effect/testing/TestClock`).

## Global Constraints

- `effect`, `@effect/platform-node`, `@effect/openapi-generator` are pinned to `4.0.0-beta.92` in `package.json` (already done; `bun install` already run; `bun.lock` already updated).
- No hand-edits to `gen/generated/PostcodesSpike.ts` or `gen/generated/PostcodesFull.ts`.
- No Redis dependency — rate limiter store is in-memory (`RateLimiter.layerStoreMemory`).
- `gen/programs/fullClient.ts` and `test/fullClient.elysia.test.ts` are out of scope (they don't go through `makeApiService`).

---

## Important note on Task 1's original framing

The design spec assumed unencoded spaces in postcodes (`"SW1A 1AA"`) broke requests. Verified empirically: they don't — Bun's `fetch`/`URL` auto-encodes spaces. The **actual** reproducible bug is structural URL characters (`..`, `/`, `#`) in a path segment escaping the intended route entirely. Confirmed: calling `findOutcode("../places/osgb4000000074564391")` against the mock server actually reaches the unrelated `/places/:code` route and returns its (schema-mismatched) body, instead of 404ing on `/outcodes/`. `encodeURIComponent` fixes this. Task 1 below uses the traversal case as the regression test, not the space case.

---

### Task 1: Encode path segments in `ApiService.ts`

**Status: code change already applied and typechecked.** This task's steps document what was done so the test can be added/verified explicitly.

**Files:**
- Modify: `gen/client/ApiService.ts`
- Test: `test/contract.test.ts`

**Interfaces:**
- Produces: `encodePathSegment(value: string): string` (module-private helper in `ApiService.ts`).

- [ ] **Step 1: Write the failing test in `test/contract.test.ts`**

Add this test inside `describe("openapi-effect spike contract", () => { ... })`, after the existing test:

```ts
	test("rejects path-segment escape attempts in outcode lookups", async () => {
		const serviceEffect = makeApiService(makeApiConfig({ baseUrl })).pipe(
			Effect.provide(FetchHttpClient.layer),
			Effect.provide(RateLimiterLive),
		);

		const service = await Effect.runPromise(serviceEffect);

		const failure = await Effect.runPromise(
			service.findOutcode("../places/osgb4000000074564391").pipe(
				Effect.match({
					onFailure: (error) => error,
					onSuccess: () => undefined,
				}),
			),
		);

		const notFound = Match.value(failure).pipe(
			Match.when(isApiNotFoundError, (error) => error),
			Match.orElse(() => undefined),
		);

		expect(notFound).toBeDefined();
		expect(notFound?.resource).toBe("outcode");
	});
```

This references `RateLimiterLive`, which Task 2 introduces. If executing Task 1 in isolation before Task 2 exists, temporarily drop the `Effect.provide(RateLimiterLive)` line and the import; Task 2's steps restore it. Since Task 2's `RateLimiting.ts` and wiring are already applied in this working tree, write the test with the `RateLimiterLive` line included.

- [ ] **Step 2: Confirm the encoding fix is in place**

Open `gen/client/ApiService.ts` and confirm:
1. A module-level helper exists: `const encodePathSegment = (value: string): string => encodeURIComponent(value);`
2. `lookupPostcode`, `findOutcode`, and `findPlace` call `generated.<fn>(encodePathSegment(<arg>), undefined)` instead of passing the raw argument — while `mapGeneratedError("postcode", postcode)` etc. still receive the **original, unencoded** value (better error messages).
3. `bulkLookupPostcodes` is untouched (postcodes travel in the JSON body, not the URL).

If any of this is missing, apply it now:

```ts
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
```

- [ ] **Step 3: Run the test and confirm it passes**

Run: `bun test test/contract.test.ts`
Expected: `2 pass`, `0 fail` (the existing test plus the new traversal test).

- [ ] **Step 4: Commit**

```bash
git add gen/client/ApiService.ts test/contract.test.ts
git commit -m "fix: encode postcode/outcode/place path segments to prevent route escape"
```

---

### Task 2: Adaptive rate limiting via `RateLimiter` + `HttpClient.withRateLimiter`

**Status: code change already applied and typechecked.** This task documents the verified shape and adds the missing deterministic test.

**Files:**
- Create: `gen/client/RateLimiting.ts`
- Modify: `gen/client/ApiConfig.ts`
- Modify: `gen/client/ApiService.ts`
- Modify: `gen/client/Errors.ts` (add `RateLimiter.RateLimiterError` to `ApiServiceError`)
- Modify: `gen/programs/getThing.ts`, `gen/programs/createThing.ts`, `gen/programs/failureThing.ts`
- Modify: `test/contract.test.ts` (provide `RateLimiterLive`)
- Test: `test/rateLimiting.test.ts` (new)

**Interfaces:**
- Produces: `RateLimiterLive: Layer.Layer<RateLimiter.RateLimiter>`, `defaultRateLimit: { window: Duration.Duration; limit: number }` from `gen/client/RateLimiting.ts`.
- Consumes: `RateLimiter.RateLimiter` (tag), `RateLimiter.layer`, `RateLimiter.layerStoreMemory` from `effect/unstable/persistence/RateLimiter`; `HttpClient.withRateLimiter` from `effect/unstable/http/HttpClient`.

- [ ] **Step 1: Confirm `gen/client/RateLimiting.ts` exists with this content**

```ts
import * as Duration from "effect/Duration";
import * as Layer from "effect/Layer";
import * as RateLimiter from "effect/unstable/persistence/RateLimiter";

/** Conservative starting point; not a verified postcodes.io limit — tune via ApiConfig.rateLimit. */
export const defaultRateLimit: {
	readonly window: Duration.Duration;
	readonly limit: number;
} = {
	window: Duration.seconds(10),
	limit: 30,
};

/** In-memory RateLimiterStore with adaptive 429/Retry-After feedback (effect 4.0.0-beta.88). */
export const RateLimiterLive: Layer.Layer<RateLimiter.RateLimiter> =
	RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory));
```

- [ ] **Step 2: Confirm `gen/client/ApiConfig.ts` has the optional `rateLimit` field**

```ts
import type * as Duration from "effect/Duration";

export interface ApiConfig {
	readonly baseUrl: string;
	readonly authToken?: string | undefined;
	readonly rateLimit?:
		| { readonly window: Duration.Input; readonly limit: number }
		| undefined;
}

export const defaultApiConfig: ApiConfig = {
	baseUrl: "https://api.postcodes.io",
};

export const makeApiConfig = (
	overrides: Partial<ApiConfig> = {},
): ApiConfig => ({
	...defaultApiConfig,
	...overrides,
});
```

- [ ] **Step 3: Confirm `gen/client/Errors.ts` includes `RateLimiter.RateLimiterError` in `ApiServiceError`**

```ts
import type * as RateLimiter from "effect/unstable/persistence/RateLimiter";

// ...

export type ApiServiceError =
	| HttpClientError.HttpClientError
	| SchemaError
	| ApiNotFoundError
	| RateLimiter.RateLimiterError;
```

This is required for type-soundness, not optional polish: `mapGeneratedError`'s `Match.orElse((other) => other as ApiServiceError)` cast is only honest if `ApiServiceError` actually includes every error type that can reach it, and `RateLimiterError` now can.

- [ ] **Step 4: Confirm `gen/client/ApiService.ts` wires the limiter into `makeApiService`**

`configureHttpClient` and `makeApiServiceFromClient` keep their original narrow `client: HttpClient.HttpClient` signatures — `Generated.make` (generated, closed code) only accepts that exact type, so the wider-error rate-limited client must be cast back down at the one point it crosses into generated code. The cast is safe because every exported method's `Effect.mapError(mapGeneratedError(...))` re-asserts the true `ApiServiceError` return type regardless of what `Generated.make` itself believes the error type is — so callers of `service.findOutcode(...)` etc. still see `RateLimiter.RateLimiterError` as a real possible failure.

```ts
import * as RateLimiter from "effect/unstable/persistence/RateLimiter";
import { defaultRateLimit } from "./RateLimiting.ts";

// ... configureHttpClient, mapGeneratedError, encodePathSegment, makeApiServiceFromClient unchanged from Task 1 ...

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
```

- [ ] **Step 5: Confirm all `makeApiService` callers provide `RateLimiterLive`**

`test/contract.test.ts`, `gen/programs/getThing.ts`, `gen/programs/createThing.ts`, `gen/programs/failureThing.ts` each need:

```ts
import { RateLimiterLive } from "../gen/client/RateLimiting.ts"; // or "./RateLimiting.ts" depending on relative path
```

and the `serviceEffect` pipeline extended:

```ts
const serviceEffect = makeApiService(makeApiConfig(/* ... */)).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(RateLimiterLive),
);
```

- [ ] **Step 6: Write `test/rateLimiting.test.ts`**

```ts
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

			const fiber = yield* client.get("http://test/").pipe(
				Effect.andThen(client.get("http://test/")),
				Effect.forkChild,
			);

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
```

This pattern (stub `HttpClient.make`, `Ref` attempt counter, fork-then-`TestClock.adjust`-then-join) is adapted directly from effect's own `withRateLimiter` test suite (`packages/effect/test/unstable/http/HttpClient.test.ts` in the vendored `effect-smol-main` reference repo), substituting explicit `TestClock.layer()` provision for `@effect/vitest`'s implicit one since this repo uses `bun:test`. Verified to pass standalone before being added here.

- [ ] **Step 7: Run the full test suite and confirm it passes**

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `4 pass` (2 existing + 1 new contract test from Task 1 + 1 new rate limiter test), `0 fail`.

Run: `bun run typecheck`
Expected: no output (clean).

- [ ] **Step 8: Commit**

```bash
git add gen/client/RateLimiting.ts gen/client/ApiConfig.ts gen/client/ApiService.ts gen/client/Errors.ts gen/programs/getThing.ts gen/programs/createThing.ts gen/programs/failureThing.ts test/contract.test.ts test/rateLimiting.test.ts
git commit -m "feat: add adaptive rate limiting to all postcodes.io client calls"
```

---

### Task 3: Simplify `Errors.ts` duck-typing with `Predicate.isTagged`

**Files:**
- Modify: `gen/client/Errors.ts`

**Interfaces:**
- Produces: `isApiNotFoundError(input: unknown): input is ApiNotFoundError`, `isGeneratedNotFoundError(input: unknown): input is GeneratedNotFoundError` — same names and signatures as before, internals only.

**Note on scope:** the original design spec also suggested using `Schema.isSchemaError` in this file. There is no current call site in `Errors.ts` that distinguishes a `SchemaError` from other `ApiServiceError` members at runtime — the only existing duck-typing is the two `_tag`-based guards below. Introducing `Schema.isSchemaError` with no real call site would be speculative, so it's dropped from this task; `Predicate.isTagged` is the concrete, applicable simplification.

- [ ] **Step 1: Read the current file to confirm line numbers haven't shifted**

Run: `grep -n "isApiNotFoundError\|isGeneratedNotFoundError" gen/client/Errors.ts`

- [ ] **Step 2: Replace the duck-typing with `Predicate.isTagged`**

Add the import and replace both functions:

```ts
import * as Predicate from "effect/Predicate";
```

```ts
export const isApiNotFoundError = (input: unknown): input is ApiNotFoundError =>
	Predicate.isTagged(input, "ApiNotFoundError");

export const isGeneratedNotFoundError = (
	input: unknown,
): input is GeneratedNotFoundError =>
	Predicate.isTagged(input, "LookupPostcode404") ||
	Predicate.isTagged(input, "FindOutcode404") ||
	Predicate.isTagged(input, "FindPlace404");
```

Keep the explicit `input is X` return type annotations — `Predicate.isTagged` alone only narrows to `{ _tag: K }`, not the full interface, and `test/contract.test.ts` relies on the fuller narrowing (`notFound?.resource`, `notFound?.cause.status`) after `Match.when(isApiNotFoundError, ...)`.

- [ ] **Step 3: Run the full test suite to confirm no behavior change**

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `4 pass`, `0 fail` — same as Task 2's Step 7, since this is a behavior-preserving refactor.

Run: `bun run typecheck`
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add gen/client/Errors.ts
git commit -m "refactor: use Predicate.isTagged instead of hand-rolled duck-typing in Errors.ts"
```

---

### Task 4: Update docs and the cutover runbook

**Files:**
- Modify: `README.md`
- Modify: `ASSESSMENT.md`
- Modify: `CUTOVER_RUNBOOK.md`

- [ ] **Step 1: Update `README.md`**

In the "Commands" section intro or just above it, add a short paragraph after the "Full upstream workflow" section (before "## Testing"):

```markdown
## Rate limiting

`makeApiService` requires a `RateLimiter.RateLimiter` to be provided alongside
`FetchHttpClient.layer` — use the exported `RateLimiterLive` layer from
`gen/client/RateLimiting.ts`:

```ts
const serviceEffect = makeApiService(makeApiConfig()).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.provide(RateLimiterLive),
);
```

This wraps every call through `HttpClient.withRateLimiter`, backed by an
in-memory `RateLimiterStore` with adaptive 429/`Retry-After` feedback
(effect `4.0.0-beta.88`). Tune pacing via `ApiConfig.rateLimit`.
```

Also update the dependency version mentioned implicitly by `ASSESSMENT.md`'s link — no other README version strings need changes (README doesn't currently state an effect version number).

- [ ] **Step 2: Append a dated note to `ASSESSMENT.md`**

Read the file first to find the end, then append:

```markdown

## Update: 2026-06-30 — effect 4.0.0-beta.50 → beta.92

Bumped `effect`, `@effect/platform-node`, and `@effect/openapi-generator` from
`4.0.0-beta.50` to `4.0.0-beta.92`. Findings:

- clean `bun install`, clean `tsc --noEmit`, all tests passing with no source
  changes required for compatibility
- regenerating `gen/generated/PostcodesSpike.ts` with the bumped generator
  produces one cosmetic diff: the generic bound on `decodeSuccess`/`decodeError`
  narrows from `Schema.Top` to `Schema.Constraint` (generator-side change from
  beta.86's Schema type-performance work) — not hand-applied, a natural
  byproduct of `bun run generate`
- added `RateLimiterLive` (`gen/client/RateLimiting.ts`), built on effect
  beta.88's `RateLimiterStore` adaptive consume/feedback API plus
  `HttpClient.withRateLimiter`, so all four client calls now back off
  automatically on postcodes.io rate-limit responses instead of failing
  outright
- fixed a real path-segment-escape bug in `ApiService.ts`: an unencoded `..`
  in a postcode/outcode/place argument could route a request to an unrelated
  endpoint (verified: `findOutcode("../places/...")` reached `/places/:code`
  instead of 404ing); fixed with `encodeURIComponent` on path segments
- simplified `Errors.ts`'s two `_tag` duck-typing checks to use the existing
  `effect/Predicate` `isTagged` guard
```

- [ ] **Step 3: Add a watchpoint to `CUTOVER_RUNBOOK.md`**

In the "## Watchpoints" section, after "### Full-spec generation behavior" and before "### Parent-repo focus", insert:

```markdown
### Rate limiter dependency

`makeApiService` requires a `RateLimiter.RateLimiter` service in scope —
provide `RateLimiterLive` from `gen/client/RateLimiting.ts` alongside
`FetchHttpClient.layer` wherever `makeApiService` is called (see
`test/contract.test.ts` and `gen/programs/*.ts` for the pattern). A freshly
extracted or cloned copy that runs the example programs or contract test
without this layer provided will fail to compile (`Type 'RateLimiter' is
not assignable to type 'never'`), not just fail at runtime.
```

- [ ] **Step 4: Commit**

```bash
git add README.md ASSESSMENT.md CUTOVER_RUNBOOK.md
git commit -m "docs: document RateLimiterLive requirement and effect beta.92 bump findings"
```

---

### Task 5: Final full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `bun run typecheck`
Expected: no output (clean, exit code 0).

- [ ] **Step 2: Run the project's own tests (explicitly scoped — `bun test` with no args also sweeps the vendored `effect-smol-main` reference repo's own test suite and fails on its missing `@effect/vitest` devDependency; that's pre-existing and out of scope for this plan)**

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `4 pass`, `0 fail`.

- [ ] **Step 3: Confirm no unintended changes to generated artifacts or vendored upstream spec**

Run: `git status --short`
Expected: only the files touched by Tasks 1–4 plus `package.json`/`bun.lock` (already changed by the version bump) and `.gitignore` (pre-existing change from before this work started). No changes under `gen/generated/`, `openapi/full-upstream/`.

---

## Self-review notes

- **Spec coverage:** all three spec items (URL encoding, rate limiting, Errors.ts cleanup) have tasks; docs/runbook addition from the follow-up request has Task 4. The `Schema.isSchemaError` sub-item from the spec is explicitly dropped with rationale in Task 3 rather than padded with a no-op import.
- **Type consistency:** `RateLimiterLive`, `defaultRateLimit`, `encodePathSegment`, `ApiServiceError` are named identically everywhere they're referenced across tasks.
- **Deviation from spec:** the spec assumed the space-postcode case demonstrated the URL-encoding bug. Empirical testing during planning showed it doesn't (Bun's `fetch` auto-encodes spaces) — the real, verified bug is structural-character path escape. Task 1 uses the verified case.
