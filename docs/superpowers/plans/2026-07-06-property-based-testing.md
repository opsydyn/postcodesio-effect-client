# Property-Based Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two `.property.test.ts` files — one hermetic schema-level, one behavioral with mock server — using `FastCheck` from `effect/testing` and `Schema.toArbitrary`.

**Architecture:** `FastCheck` is re-exported from `effect/testing` as a namespace wrapping fast-check (no separate dependency needed). Sync properties use `FastCheck.property` + `FastCheck.assert`; async (mock-server) properties use `FastCheck.asyncProperty` + `await FastCheck.assert(...)`. One prerequisite: the domain schema types in `src/index.ts` must become value exports (not type-only) so `Schema.toArbitrary(PostcodeResult)` works from the public barrel.

**Tech Stack:** `FastCheck` from `effect/testing`, `Schema.toArbitrary` from `effect/Schema`, Bun:test, Elysia mock server (existing `test/helpers/`).

## Global Constraints

- `FastCheck` imported from `"effect/testing"` — no `fast-check` install needed
- Schema arbitraries derived with `Schema.toArbitrary(SchemaValue)` — `SchemaValue` must be a runtime value, not a type
- Sync property tests: `FastCheck.assert(FastCheck.property(arb, predicate))`
- Async property tests: `await FastCheck.assert(FastCheck.asyncProperty(arb, async predicate), { numRuns: 25 })`
- Test files named `*.property.test.ts`; tests run with `bun test`
- All imports from `"../src/index.ts"` (public barrel) — never from `src/internal/` or `generated/` directly
- `bun run typecheck` must remain clean after every task

---

### Task 1: Promote domain schema exports to values in `src/index.ts`

`PostcodeResult`, `OutcodeResult`, etc. are currently re-exported with `export type {}` — TypeScript strips these to pure types, so `Schema.toArbitrary(PostcodeResult)` cannot work at runtime. The generated file exports each as both a `const` (Schema value) and a `type` (type alias), so a regular `export {}` carries both.

**Files:**
- Modify: `src/index.ts`

**Interfaces:**
- Produces: `PostcodeResult`, `OutcodeResult`, `PlaceResult`, `BulkLookupItem`, `ErrorEnvelope` as importable runtime Schema values from `"../src/index.ts"`, usable with `Schema.toArbitrary`.

- [ ] **Step 1: Write a compile-time guard test that will fail before the fix**

Create `.smoke_tmp/value_export_check.ts` at the repo root to confirm the current `export type` blocks runtime use:

```bash
mkdir -p .smoke_tmp
cat > .smoke_tmp/value_export_check.ts << 'EOF'
import { Schema } from "effect"
import { FastCheck } from "effect/testing"
import { PostcodeResult } from "../src/index.ts"
// This must work after Task 1: PostcodeResult must be a runtime value
const arb = Schema.toArbitrary(PostcodeResult)
const sample = FastCheck.sample(arb, 1)
console.log("PostcodeResult sample OK:", typeof sample[0]?.postcode)
EOF
bun run .smoke_tmp/value_export_check.ts
```

Expected: fails with `PostcodeResult is not defined` or `cannot use type as value` (because `export type` strips the runtime value).

- [ ] **Step 2: Update `src/index.ts` — remove `type` keyword from domain type exports**

Find this block in `src/index.ts`:

```ts
// Domain types — consumers never import generated/ directly
export type {
	BulkLookupItem,
	ErrorEnvelope,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
```

Replace with:

```ts
// Domain schemas — exported as values (Schema.Struct instances) so consumers
// can use Schema.toArbitrary, Schema.decodeUnknown etc. directly.
// TypeScript also infers the types from these same exports.
export {
	BulkLookupItem,
	ErrorEnvelope,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
```

- [ ] **Step 3: Run the guard test — confirm it now passes**

```bash
bun run .smoke_tmp/value_export_check.ts
```

Expected output:
```
PostcodeResult sample OK: string
```

```bash
rm -rf .smoke_tmp
```

- [ ] **Step 4: Typecheck and full test suite**

```bash
bun run typecheck
```
Expected: no output (clean).

```bash
bun run test
```
Expected: `6 pass, 0 fail` (unchanged — this task adds no new tests).

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: export domain schemas as values to enable Schema.toArbitrary from public API"
```

---

### Task 2: Write `test/schema.property.test.ts`

Five pure hermetic properties. No HTTP, no mock server. Uses `Schema.toArbitrary` to derive arbitraries and `FastCheck.assert` to verify invariants across many generated inputs.

**Files:**
- Create: `test/schema.property.test.ts`

**Interfaces:**
- Consumes: `PostcodeResult`, `BulkLookupItem`, `ErrorEnvelope` from `"../src/index.ts"` (must be Task 1's value exports)

- [ ] **Step 1: Create `test/schema.property.test.ts`**

```ts
import { describe, test } from "bun:test";
import { Schema } from "effect";
import { FastCheck } from "effect/testing";
import {
	BulkLookupItem,
	ErrorEnvelope,
	PostcodeResult,
} from "../src/index.ts";

describe("schema properties", () => {
	test("PostcodeResult region is always string | null — never undefined", () => {
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(PostcodeResult), (value) =>
				value.region === null || typeof value.region === "string",
			),
		);
	});

	test("PostcodeResult decode is total — arbitrary and decoder are consistent", () => {
		const decode = Schema.decodeUnknownSync(PostcodeResult);
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(PostcodeResult), (value) => {
				decode(value); // throws if generated value doesn't satisfy the schema
				return true;
			}),
		);
	});

	test("BulkLookupItem result is PostcodeResult | null — never undefined", () => {
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(BulkLookupItem), (item) =>
				item.result !== undefined,
			),
		);
	});

	test("ErrorEnvelope status is always the literal 404", () => {
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(ErrorEnvelope), (envelope) =>
				envelope.status === 404,
			),
		);
	});

	test("path encoding roundtrip: decodeURIComponent(encodeURIComponent(s)) === s", () => {
		FastCheck.assert(
			FastCheck.property(FastCheck.string(), (s) => {
				const encoded = encodeURIComponent(s);
				const decoded = decodeURIComponent(encoded);
				return decoded === s;
			}),
		);
	});
});
```

- [ ] **Step 2: Run the new file alone**

```bash
bun test test/schema.property.test.ts
```

Expected:
```
bun test v1.3.14

 5 pass
 0 fail
Ran 5 tests across 1 file.
```

- [ ] **Step 3: Run full suite to confirm no regressions**

```bash
bun run test
```
Expected: `11 pass, 0 fail` (6 existing + 5 new).

- [ ] **Step 4: Commit**

```bash
git add test/schema.property.test.ts
git commit -m "test: add schema property tests for PostcodeResult, BulkLookupItem, ErrorEnvelope, and path encoding"
```

---

### Task 3: Write `test/client.property.test.ts`

Three behavioral properties verified against the existing Elysia mock server. Uses `FastCheck.asyncProperty` because each predicate runs an `Effect` through HTTP.

**The mock server behavior to be aware of:**
- `GET /postcodes/:postcode` — returns 200 for `"SW1A1AA"` and `"EH259NJ"` (after normalization), 404 for everything else
- `POST /postcodes` — always returns the 2-item fixture regardless of input payload
- `PostcodesClient.layer({ baseUrl })` bundles `RateLimiterLive`; caller provides `FetchHttpClient.layer`

**Files:**
- Create: `test/client.property.test.ts`

**Interfaces:**
- Consumes: `PostcodesClient`, `isApiNotFoundError` from `"../src/index.ts"`; mock server helpers from `"./helpers/mockServer.ts"`

- [ ] **Step 1: Create `test/client.property.test.ts`**

```ts
import { afterAll, beforeAll, describe, test } from "bun:test";
import { Effect, Layer } from "effect";
import { FastCheck } from "effect/testing";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { isApiNotFoundError, PostcodesClient } from "../src/index.ts";
import {
	getSpikeMockServerBaseUrl,
	startSpikeMockServer,
	stopSpikeMockServer,
} from "./helpers/mockServer.ts";

let server: ReturnType<typeof startSpikeMockServer>;
let baseUrl: string;

beforeAll(() => {
	server = startSpikeMockServer();
	baseUrl = getSpikeMockServerBaseUrl(server);
});

afterAll(() => {
	stopSpikeMockServer(server);
});

describe("client behavioral properties", () => {
	test("lookupPostcode always yields ApiNotFoundError or PostcodeResult — never SchemaError", async () => {
		// Build the layer once outside the property so it is not rebuilt per iteration.
		const layer = PostcodesClient.layer({ baseUrl }).pipe(
			Layer.provide(FetchHttpClient.layer),
		);

		await FastCheck.assert(
			FastCheck.asyncProperty(FastCheck.string(), async (s) => {
				const outcome = await Effect.runPromise(
					Effect.gen(function* () {
						const { lookupPostcode } = yield* PostcodesClient;
						return yield* lookupPostcode(s).pipe(
							Effect.match({
								onFailure: (e) => ({ ok: false as const, error: e }),
								onSuccess: () => ({ ok: true as const }),
							}),
						);
					}).pipe(Effect.provide(layer)),
				);

				if (outcome.ok) return true;
				// A SchemaError here would mean the path encoding failed and the request
				// hit a different route whose response shape doesn't match PostcodeResult.
				// ApiNotFoundError is the only acceptable failure for unknown postcodes.
				return isApiNotFoundError(outcome.error);
			}),
			{ numRuns: 25 },
		);
	});

	test("bulkLookupPostcodes always returns an array for any non-empty input", async () => {
		const layer = PostcodesClient.layer({ baseUrl }).pipe(
			Layer.provide(FetchHttpClient.layer),
		);

		await FastCheck.assert(
			FastCheck.asyncProperty(
				FastCheck.array(FastCheck.string(), { minLength: 1, maxLength: 10 }),
				async (postcodes) => {
					const result = await Effect.runPromise(
						Effect.gen(function* () {
							const { bulkLookupPostcodes } = yield* PostcodesClient;
							return yield* bulkLookupPostcodes(postcodes);
						}).pipe(Effect.provide(layer)),
					);
					return Array.isArray(result);
				},
			),
			{ numRuns: 25 },
		);
	});

	test("PostcodesClient.Default always provides all 4 required service methods", async () => {
		await FastCheck.assert(
			FastCheck.asyncProperty(FastCheck.constant(null), async () => {
				const service = await Effect.runPromise(
					Effect.gen(function* () {
						return yield* PostcodesClient;
					}).pipe(Effect.provide(PostcodesClient.Default)),
				);
				return (
					typeof service.lookupPostcode === "function" &&
					typeof service.bulkLookupPostcodes === "function" &&
					typeof service.findOutcode === "function" &&
					typeof service.findPlace === "function"
				);
			}),
			{ numRuns: 1 },
		);
	});
});
```

- [ ] **Step 2: Run the new file alone**

```bash
bun test test/client.property.test.ts
```

Expected:
```
bun test v1.3.14

 3 pass
 0 fail
Ran 3 tests across 1 file.
```

- [ ] **Step 3: Run full suite to confirm no regressions**

```bash
bun run test
```
Expected: `14 pass, 0 fail` (11 from Task 2 + 3 new).

- [ ] **Step 4: Commit**

```bash
git add test/client.property.test.ts
git commit -m "test: add client behavioral property tests for error types, bulk lookup, and service completeness"
```

---

### Task 4: Update `package.json` test script

The `test` script currently lists files explicitly. Add both new property test files.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the `test` script**

Find in `package.json`:
```json
"test": "bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts",
```

Replace with:
```json
"test": "bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts test/schema.property.test.ts test/client.property.test.ts",
```

- [ ] **Step 2: Run `bun run test` through the script (not direct `bun test`) to confirm the script works**

```bash
bun run test
```
Expected: `14 pass, 0 fail`.

- [ ] **Step 3: Run `bun run check`**

```bash
bun run check
```
Expected: clean typecheck + `14 pass, 0 fail`.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build: add property test files to test script"
```

---

## Self-review

**Spec coverage:**
- `src/index.ts` value exports enabling `Schema.toArbitrary` — Task 1 ✓
- `test/schema.property.test.ts` with 5 properties — Task 2 ✓
- `test/client.property.test.ts` with 3 async properties — Task 3 ✓
- `package.json` test script updated — Task 4 ✓
- `FastCheck` from `effect/testing`, no separate install — all tasks ✓
- `numRuns: 25` cap on network properties — Task 3 ✓

**No placeholders found.**

**Type consistency:** `PostcodeResult`, `BulkLookupItem`, `ErrorEnvelope` imported identically in Tasks 1 and 2. `PostcodesClient`, `isApiNotFoundError` imported identically in Task 3 and the existing contract tests. ✓

**One note on the decode-roundtrip property (Task 2, test 2):** `Schema.decodeUnknownSync` throws on failure; the property wraps it in a `try/catch`-free way (throws propagate as fast-check failures and are reported as counterexamples). If the property fails, fast-check will print the specific generated value that caused the decode failure — exactly what we want for debugging.
