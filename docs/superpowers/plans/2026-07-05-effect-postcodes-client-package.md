# @effect-postcodes/client Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the spike into a publishable `@effect-postcodes/client` npm package with a clean Effect-native consumer API, tsdown build, typedoc docs, and quality gates.

**Architecture:** Move internal implementation to `src/internal/`, promote `ApiConfig.ts` and `Errors.ts` to `src/`, introduce `src/PostcodesClient.ts` as the public service (Context.Service tag + `.make`/`.layer`/`.Default`), expose everything through a single `src/index.ts` barrel. Build output is `.mjs` + `.d.mts` via tsdown with peer deps never bundled.

**Tech Stack:** Effect `4.0.0-beta.92` (peer dep), tsdown `^0.22.1`, typedoc `^0.28.19`, publint, `@arethetypeswrong/cli`, `@changesets/cli`.

## Global Constraints

- Package name: `@effect-postcodes/client`
- `effect` and `@effect/platform-node` are peerDependencies (`^4.0.0-beta.90` range), never bundled
- `tsdown.config.ts` uses `deps.neverBundle: ["effect", "@effect/platform-node"]`
- Build output: `dist/index.mjs` + `dist/index.d.mts` (ESM only)
- Tests import ONLY from `"../src/index.ts"` — never from `src/internal/` or individual `src/*.ts` files (except `test/rateLimiting.test.ts` which tests the internal rate limiter and may import from `src/internal/`)
- `src/programs/` and `src/server/` are excluded from the npm package `files` field; they may import from `src/internal/`

---

### Task 1: Restructure src/ — move internals, promote public files

Purely mechanical. No logic changes. All four files keep their exact content; only their locations and a handful of relative import paths change.

**Files:**
- Move: `src/client/ApiService.ts` → `src/internal/ApiService.ts`
- Move: `src/client/RateLimiting.ts` → `src/internal/RateLimiting.ts`
- Move: `src/client/ApiConfig.ts` → `src/ApiConfig.ts`
- Move: `src/client/Errors.ts` → `src/Errors.ts`
- Modify: `src/internal/ApiService.ts` (2 import paths)
- Modify: `src/Errors.ts` (1 import path)
- Modify: `src/server/handlers.ts` (4 import paths)
- Modify: `src/programs/getThing.ts`, `createThing.ts`, `failureThing.ts`, `fullClient.ts` (import paths)
- Modify: `test/contract.test.ts`, `test/fullClient.elysia.test.ts`, `test/rateLimiting.test.ts` (intermediate: keep using impl imports; Task 4 migrates to public API)

**Interfaces:**
- Produces: `src/ApiConfig.ts`, `src/Errors.ts`, `src/internal/ApiService.ts`, `src/internal/RateLimiting.ts` at their new locations with all internals intact.

- [ ] **Step 1: Create `src/internal/` and move the four files**

```bash
mkdir -p src/internal
git mv src/client/ApiService.ts src/internal/ApiService.ts
git mv src/client/RateLimiting.ts src/internal/RateLimiting.ts
git mv src/client/ApiConfig.ts src/ApiConfig.ts
git mv src/client/Errors.ts src/Errors.ts
rmdir src/client
```

- [ ] **Step 2: Fix imports in `src/internal/ApiService.ts`**

Two lines change. `RateLimiting.ts` is now a sibling (`./`) and `generated/` is still `../../` from `src/internal/`. Only `ApiConfig` and `Errors` move up one level.

Find these exact lines:
```ts
import type { ApiConfig } from "./ApiConfig.ts";
```
```ts
} from "./Errors.ts";
```
Replace with:
```ts
import type { ApiConfig } from "../ApiConfig.ts";
```
```ts
} from "../Errors.ts";
```

- [ ] **Step 3: Fix import in `src/Errors.ts`**

`Errors.ts` moved from `src/client/` to `src/`, so generated/ is now one level up instead of two.

Find:
```ts
import type * as Generated from "../../generated/PostcodesSpike.ts";
```
Replace with:
```ts
import type * as Generated from "../generated/PostcodesSpike.ts";
```

- [ ] **Step 4: Fix imports in `src/server/handlers.ts`**

```ts
// Replace these four lines:
import { makeApiConfig } from "../client/ApiConfig.ts";
import { makeApiService } from "../client/ApiService.ts";
import { isApiNotFoundError } from "../client/Errors.ts";
import { RateLimiterLive } from "../client/RateLimiting.ts";
// With:
import { makeApiConfig } from "../ApiConfig.ts";
import { makeApiService } from "../internal/ApiService.ts";
import { isApiNotFoundError } from "../Errors.ts";
import { RateLimiterLive } from "../internal/RateLimiting.ts";
```

- [ ] **Step 5: Fix imports in example programs**

In `src/programs/getThing.ts`, `src/programs/createThing.ts`, `src/programs/failureThing.ts` — all import `makeApiConfig`, `makeApiService`, `RateLimiterLive` from `../client/...`. Update each:

```ts
// Remove these (same pattern in all three):
import { makeApiConfig } from "../client/ApiConfig.ts";
import { makeApiService } from "../client/ApiService.ts";
import { RateLimiterLive } from "../client/RateLimiting.ts";
// Replace with:
import { makeApiConfig } from "../ApiConfig.ts";
import { makeApiService } from "../internal/ApiService.ts";
import { RateLimiterLive } from "../internal/RateLimiting.ts";
```

`src/programs/failureThing.ts` also imports `isApiNotFoundError`:
```ts
import { isApiNotFoundError } from "../client/Errors.ts";
// Replace with:
import { isApiNotFoundError } from "../Errors.ts";
```

In `src/programs/fullClient.ts`:
```ts
import { makeApiConfig } from "../client/ApiConfig.ts";
// Replace with:
import { makeApiConfig } from "../ApiConfig.ts";
```

- [ ] **Step 6: Fix imports in test files**

`test/contract.test.ts` — update four import lines (Task 4 will replace these entirely, but they must compile now):
```ts
import { makeApiConfig } from "../src/client/ApiConfig.ts";
import { makeApiService } from "../src/client/ApiService.ts";
import { isApiNotFoundError } from "../src/client/Errors.ts";
import { RateLimiterLive } from "../src/client/RateLimiting.ts";
// Replace with:
import { makeApiConfig } from "../src/ApiConfig.ts";
import { makeApiService } from "../src/internal/ApiService.ts";
import { isApiNotFoundError } from "../src/Errors.ts";
import { RateLimiterLive } from "../src/internal/RateLimiting.ts";
```

`test/fullClient.elysia.test.ts`:
```ts
import { makeApiConfig } from "../src/client/ApiConfig.ts";
// Replace with:
import { makeApiConfig } from "../src/ApiConfig.ts";
```

`test/rateLimiting.test.ts`:
```ts
import { RateLimiterLive } from "../src/client/RateLimiting.ts";
// Replace with:
import { RateLimiterLive } from "../src/internal/RateLimiting.ts";
```

- [ ] **Step 7: Verify typecheck and tests pass**

Run: `bun run typecheck`
Expected: no output (clean)

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `5 pass`, `0 fail`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move ApiService+RateLimiting to src/internal/, promote ApiConfig+Errors to src/"
```

---

### Task 2: Create `src/PostcodesClient.ts`

The public service. Introduces the `PostcodesClient` `Context.Service` tag with `.make`, `.layer`, and `.Default`.

**Files:**
- Create: `src/PostcodesClient.ts`

**Interfaces:**
- Consumes: `src/ApiConfig.ts` (`ApiConfig`, `defaultApiConfig`), `src/internal/ApiService.ts` (`makeApiService`), `src/internal/RateLimiting.ts` (`RateLimiterLive`), `generated/PostcodesSpike.ts` (domain types)
- Produces:
  - `PostcodesClient` — `Context.Service` class with service interface
  - `PostcodesClient.make(config?: ApiConfig): Effect.Effect<PostcodesClient.Service>` — bundles FetchHttpClient + RateLimiterLive internally
  - `PostcodesClient.layer(config?: ApiConfig): Layer.Layer<PostcodesClient, never, HttpClient.HttpClient>` — bundles RateLimiterLive, caller provides HTTP client
  - `PostcodesClient.Default: Layer.Layer<PostcodesClient>` — fully wired, zero config

- [ ] **Step 1: Write the file**

Create `src/PostcodesClient.ts` with this exact content:

```ts
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import type { BulkLookupItem, OutcodeResult, PlaceResult, PostcodeResult } from "../generated/PostcodesSpike.ts";
import { type ApiConfig, defaultApiConfig } from "./ApiConfig.ts";
import type { ApiServiceError } from "./Errors.ts";
import { makeApiService } from "./internal/ApiService.ts";
import { RateLimiterLive } from "./internal/RateLimiting.ts";

export class PostcodesClient extends Context.Service<PostcodesClient, {
	readonly lookupPostcode: (postcode: string) => Effect.Effect<PostcodeResult, ApiServiceError>
	readonly bulkLookupPostcodes: (postcodes: readonly string[]) => Effect.Effect<readonly BulkLookupItem[], ApiServiceError>
	readonly findOutcode: (outcode: string) => Effect.Effect<OutcodeResult, ApiServiceError>
	readonly findPlace: (code: string) => Effect.Effect<PlaceResult, ApiServiceError>
}>()("@effect-postcodes/client/PostcodesClient") {
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
		Layer.effect(
			PostcodesClient,
			makeApiService(config).pipe(Effect.provide(RateLimiterLive)),
		);

	/** Pre-wired layer with default config, FetchHttpClient, and in-memory rate limiting.
	 * Zero configuration required. */
	static readonly Default: Layer.Layer<PostcodesClient> =
		PostcodesClient.layer().pipe(Layer.provide(FetchHttpClient.layer));
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no output (clean)

- [ ] **Step 3: Commit**

```bash
git add src/PostcodesClient.ts
git commit -m "feat: add PostcodesClient Context.Service with .make, .layer, and .Default"
```

---

### Task 3: Create `src/index.ts` barrel

The single consumer entry point. Nothing ships in the package that isn't re-exported here.

**Files:**
- Create: `src/index.ts`

**Interfaces:**
- Produces: the complete public API of `@effect-postcodes/client` as named exports

- [ ] **Step 1: Write `src/index.ts`**

```ts
// Service
export { PostcodesClient } from "./PostcodesClient.ts";

// Config
export type { ApiConfig } from "./ApiConfig.ts";
export { defaultApiConfig, makeApiConfig } from "./ApiConfig.ts";

// Error types
export type { ApiServiceError } from "./Errors.ts";
export { ApiNotFoundError, isApiNotFoundError } from "./Errors.ts";

// Domain types — consumers never import generated/ directly
export type {
	BulkLookupItem,
	ErrorEnvelope,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
```

- [ ] **Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: no output (clean)

- [ ] **Step 3: Verify all public names resolve correctly**

Run this smoke check to confirm every named export is accessible:

```bash
cat > /tmp/smoke_index.ts << 'EOF'
import {
  PostcodesClient,
  type ApiConfig,
  defaultApiConfig,
  makeApiConfig,
  type ApiServiceError,
  ApiNotFoundError,
  isApiNotFoundError,
  type PostcodeResult,
  type OutcodeResult,
  type PlaceResult,
  type BulkLookupItem,
  type ErrorEnvelope,
} from "./src/index.ts";

console.log(typeof PostcodesClient, typeof PostcodesClient.make, typeof PostcodesClient.layer, typeof PostcodesClient.Default);
console.log(typeof defaultApiConfig, typeof makeApiConfig);
console.log(typeof isApiNotFoundError);
EOF
bun run /tmp/smoke_index.ts
rm /tmp/smoke_index.ts
```

Expected: `function function function object object function function`

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add src/index.ts public API barrel"
```

---

### Task 4: Migrate tests and programs to the public API

Tests must import exclusively from `"../src/index.ts"`. Example programs use `PostcodesClient.make` to demonstrate zero-boilerplate consumer usage.

**Files:**
- Modify: `test/contract.test.ts` (full rewrite to use PostcodesClient service)
- Modify: `src/programs/getThing.ts`, `createThing.ts`, `failureThing.ts` (use PostcodesClient.make)
- No change to `test/rateLimiting.test.ts` (internal implementation test, acceptable to import from `src/internal/`)
- No change to `test/fullClient.elysia.test.ts` (uses PostcodesFull, not our client service)

**Interfaces:**
- Consumes: `PostcodesClient`, `isApiNotFoundError` from `"../src/index.ts"`

- [ ] **Step 1: Rewrite `test/contract.test.ts`**

Replace the entire file with:

```ts
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Effect, Layer, Match } from "effect";
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

const clientLayer = (url: string) =>
	PostcodesClient.layer({ baseUrl: url }).pipe(
		Layer.provide(FetchHttpClient.layer),
	);

describe("@effect-postcodes/client contract", () => {
	test("lookupPostcode, bulkLookupPostcodes, and 404 error flow", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode, bulkLookupPostcodes } = yield* PostcodesClient;

				const postcode = yield* lookupPostcode("SW1A1AA");
				expect(postcode.postcode).toBe("SW1A 1AA");

				const bulk = yield* bulkLookupPostcodes(["SW1A1AA", "ZZ99ZZ"]);
				expect(bulk).toHaveLength(2);
				expect(bulk[1]?.result).toBeNull();

				const failure = yield* lookupPostcode("ZZ99ZZ").pipe(
					Effect.match({ onFailure: (e) => e, onSuccess: () => undefined }),
				);
				const notFound = Match.value(failure).pipe(
					Match.when(isApiNotFoundError, (e) => e),
					Match.orElse(() => undefined),
				);
				expect(notFound).toBeDefined();
				expect(notFound?.resource).toBe("postcode");
				expect(notFound?.cause.status).toBe(404);
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("rejects path-segment escape attempts in outcode lookups", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { findOutcode } = yield* PostcodesClient;
				const failure = yield* findOutcode("../places/osgb4000000074564391").pipe(
					Effect.match({ onFailure: (e) => e, onSuccess: () => undefined }),
				);
				const notFound = Match.value(failure).pipe(
					Match.when(isApiNotFoundError, (e) => e),
					Match.orElse(() => undefined),
				);
				expect(notFound).toBeDefined();
				expect(notFound?.resource).toBe("outcode");
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("decodes a null region for Scottish postcodes", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode } = yield* PostcodesClient;
				const postcode = yield* lookupPostcode("EH259NJ");
				expect(postcode.postcode).toBe("EH25 9NJ");
				expect(postcode.region).toBeNull();
			}).pipe(Effect.provide(clientLayer(baseUrl))),
		));

	test("PostcodesClient is mockable via Layer.succeed", () =>
		Effect.runPromise(
			Effect.gen(function* () {
				const { lookupPostcode } = yield* PostcodesClient;
				const result = yield* lookupPostcode("anything");
				expect(result.postcode).toBe("MOCK 1AA");
			}).pipe(
				Effect.provide(
					Layer.succeed(PostcodesClient, {
						lookupPostcode: (_: string) =>
							Effect.succeed({ postcode: "MOCK 1AA" } as any),
						bulkLookupPostcodes: (_: readonly string[]) =>
							Effect.succeed([]),
						findOutcode: (_: string) => Effect.die("not called"),
						findPlace: (_: string) => Effect.die("not called"),
					}),
				),
			),
		));
});
```

- [ ] **Step 2: Run tests — confirm all pass**

Run: `bun test test/contract.test.ts`
Expected: `4 pass`, `0 fail`

- [ ] **Step 3: Update example programs to use `PostcodesClient.make`**

Replace `src/programs/getThing.ts` entirely:
```ts
import { Effect } from "effect";
import { makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const result = await Effect.runPromise(client.lookupPostcode("SW1A1AA"));
console.log(JSON.stringify(result, null, 2));
```

Replace `src/programs/createThing.ts` entirely:
```ts
import { Effect } from "effect";
import { makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const result = await Effect.runPromise(
	client.bulkLookupPostcodes(["SW1A1AA", "EC1A1BB"]),
);
console.log(JSON.stringify(result, null, 2));
```

Replace `src/programs/failureThing.ts` entirely:
```ts
import { Effect, Match } from "effect";
import { isApiNotFoundError, makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const outcome = await Effect.runPromise(
	client.lookupPostcode("ZZ99ZZ").pipe(
		Effect.match({ onFailure: (e) => e, onSuccess: (r) => r }),
	),
);
if (isApiNotFoundError(outcome)) {
	console.log(JSON.stringify(outcome, null, 2));
} else {
	console.log(JSON.stringify(outcome, null, 2));
}
```

- [ ] **Step 4: Typecheck + full test suite**

Run: `bun run typecheck`
Expected: no output (clean)

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `5 pass`, `0 fail` (4 contract + 1 rate-limiter)

- [ ] **Step 5: Commit**

```bash
git add test/contract.test.ts src/programs/getThing.ts src/programs/createThing.ts src/programs/failureThing.ts
git commit -m "refactor: migrate tests and programs to PostcodesClient public API"
```

---

### Task 5: Build tooling + package.json + quality gates

Everything needed to actually publish the package.

**Files:**
- Create: `tsdown.config.ts`
- Create: `typedoc.json`
- Modify: `package.json` (name, version, private, exports, files, peer deps, scripts, devDeps, publishConfig)
- Modify: `tsconfig.json` (add `src/index.ts` path awareness for build; the same file covers typecheck)

**Interfaces:**
- Produces: `dist/index.mjs`, `dist/index.d.mts` after `bun run build`; `docs/api/` after `bun run docs:api`

- [ ] **Step 1: Create `tsdown.config.ts`**

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: ["esm"],
	dts: true,
	clean: true,
	sourcemap: true,
	target: "node22",
	outDir: "dist",
	deps: {
		neverBundle: ["effect", "@effect/platform-node"],
	},
});
```

- [ ] **Step 2: Create `typedoc.json`**

```json
{
	"entryPoints": ["src/index.ts"],
	"out": "docs/api",
	"name": "@effect-postcodes/client",
	"includeVersion": true,
	"readme": "README.md",
	"excludeInternal": true,
	"plugin": []
}
```

- [ ] **Step 3: Install new devDependencies**

```bash
bun add -d tsdown typedoc publint @arethetypeswrong/cli @changesets/cli
```

Expected: lockfile updated, packages installed.

- [ ] **Step 4: Update `package.json`**

Replace the full file with:

```json
{
	"name": "@effect-postcodes/client",
	"version": "0.1.0",
	"description": "Effect-native TypeScript client for the postcodes.io API",
	"author": "Alan Currie",
	"license": "MIT",
	"type": "module",
	"sideEffects": false,
	"main": "./dist/index.mjs",
	"exports": {
		".": {
			"import": {
				"types": "./dist/index.d.mts",
				"default": "./dist/index.mjs"
			}
		},
		"./package.json": "./package.json"
	},
	"files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"],
	"scripts": {
		"build": "tsdown",
		"dev": "tsdown --watch",
		"generate": "openapigen --spec openapi/spec.yaml --name PostcodesSpike --format httpclient > generated/PostcodesSpike.ts",
		"pull:full-spec": "bun run scripts/pullFullSpec.ts",
		"bundle:full-spec": "bun run pull:full-spec && bun run scripts/bundleFullSpec.ts",
		"generate:full": "bun run bundle:full-spec && openapigen --spec openapi/full-upstream/openapi.bundle.yaml --name PostcodesFull --format httpclient > generated/PostcodesFull.ts",
		"typecheck": "tsc --noEmit",
		"test": "bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts",
		"check": "bun run typecheck && bun run test",
		"docs:api": "typedoc",
		"docs:api:check": "typedoc --emit none",
		"lint": "publint && attw --pack . --ignore-rules cjs-resolves-to-esm",
		"example:get": "bun run src/programs/getThing.ts",
		"example:create": "bun run src/programs/createThing.ts",
		"example:fail": "bun run src/programs/failureThing.ts",
		"example:full": "bun run src/programs/fullClient.ts",
		"docs:serve": "bun run src/server/serve.ts",
		"changeset": "changeset",
		"version": "changeset version",
		"release": "bun run build && changeset publish",
		"prepublishOnly": "bun run build",
		"pack:dry-run": "npm pack --dry-run"
	},
	"peerDependencies": {
		"effect": "^4.0.0-beta.90",
		"@effect/platform-node": "^4.0.0-beta.90"
	},
	"devDependencies": {
		"@arethetypeswrong/cli": "^0.18.3",
		"@biomejs/biome": "2.4.7",
		"@catenarycloud/linteffect": "^0.0.4-0",
		"@changesets/cli": "^2.31.0",
		"@effect/language-service": "0.80.0",
		"@effect/openapi-generator": "4.0.0-beta.92",
		"@effect/platform-node": "4.0.0-beta.92",
		"@types/node": "24.5.2",
		"bun-types": "^1.3.11",
		"effect": "4.0.0-beta.92",
		"elysia": "^1.3.0",
		"publint": "^0.3.21",
		"swagger2openapi": "^7.0.8",
		"tsdown": "^0.22.1",
		"typedoc": "^0.28.19",
		"typescript": "6.0.0-beta",
		"yaml": "^2.8.3"
	},
	"publishConfig": {
		"access": "public",
		"provenance": true
	}
}
```

Note: `effect` and `@effect/platform-node` appear in BOTH `peerDependencies` (for consumers) and `devDependencies` (for local development/testing). This is the correct pattern — peer deps tell consumers what to install, dev deps ensure the local build and test suite have them.

- [ ] **Step 5: Run the build**

Run: `bun run build`
Expected: tsdown outputs `dist/index.mjs`, `dist/index.mjs.map`, `dist/index.d.mts`, `dist/index.d.mts.map` with no errors.

```bash
ls dist/
```
Expected: `index.mjs  index.mjs.map  index.d.mts  index.d.mts.map`

- [ ] **Step 6: Run typecheck and tests**

Run: `bun run check`
Expected: clean typecheck, `5 pass`, `0 fail`

- [ ] **Step 7: Run quality gates**

Run: `bun run lint`

`publint` validates the exports map. `attw` (`--pack .`) packs the package and checks that TypeScript resolves types correctly for different moduleResolution strategies.

Expected: both pass with no errors. If `attw` flags any issues with the `.d.mts` / `.mts` extension resolution, check that `tsconfig.json` has `"moduleResolution": "Bundler"` (it does) and that the exports map `types` field points at `.d.mts` (it does).

- [ ] **Step 8: Run typedoc**

Run: `bun run docs:api`
Expected: `docs/api/` created with HTML documentation. Open `docs/api/index.html` to verify `PostcodesClient`, `ApiConfig`, `ApiNotFoundError`, and the domain types all appear.

- [ ] **Step 9: Add `dist/` and `docs/api/` to `.gitignore`**

Add these lines to `.gitignore`:
```
dist/
docs/api/
```

- [ ] **Step 10: Initialize changeset config**

```bash
bunx changeset init
```

Expected: creates `.changeset/config.json`. Commit the config:
```bash
git add .changeset/
git commit -m "chore: init changeset config"
```

- [ ] **Step 11: Commit build tooling**

```bash
git add tsdown.config.ts typedoc.json package.json bun.lock .gitignore
git commit -m "build: add tsdown, typedoc, publint, attw, changeset; move effect to peer deps"
```

---

### Task 6: Consumer-facing README

Replace the assessment-focused README with one that reads as a standalone npm package homepage.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

Replace the entire file with:

```markdown
# @effect-postcodes/client

Effect-native TypeScript client for the [postcodes.io](https://postcodes.io) API.

## Installation

```bash
npm install @effect-postcodes/client effect @effect/platform-node
```

## Quick start

```ts
import { Effect } from "effect"
import { PostcodesClient } from "@effect-postcodes/client"

// Zero-config — uses FetchHttpClient and in-memory rate limiting
const program = Effect.gen(function*() {
  const { lookupPostcode, bulkLookupPostcodes } = yield* PostcodesClient
  const postcode = yield* lookupPostcode("SW1A1AA")
  console.log(postcode.region) // "London" or null for Scottish postcodes
})

Effect.runPromise(program.pipe(Effect.provide(PostcodesClient.Default)))
```

## API

### `PostcodesClient.Default`

Pre-wired layer. Includes `FetchHttpClient` and an in-memory rate limiter with adaptive
429/`Retry-After` feedback ([effect 4.0.0-beta.88 RateLimiterStore](https://effect.website)).

```ts
program.pipe(Effect.provide(PostcodesClient.Default))
```

### `PostcodesClient.layer(config?)`

Layer that requires you to provide an `HttpClient`. Use this to supply
`NodeHttpClient` or any other Effect HTTP client implementation.

```ts
import { NodeHttpClient } from "@effect/platform-node"

program.pipe(
  Effect.provide(PostcodesClient.layer({ baseUrl: "https://api.postcodes.io" })),
  Effect.provide(NodeHttpClient.layer)
)
```

### `PostcodesClient.make(config?)`

Returns an `Effect` that resolves to the service directly — useful for scripts
and top-level programs that don't compose layers.

```ts
const client = await Effect.runPromise(PostcodesClient.make())
const postcode = await Effect.runPromise(client.lookupPostcode("EH25 9NJ"))
```

## Methods

| Method | Description |
|--------|-------------|
| `lookupPostcode(postcode)` | Single postcode lookup |
| `bulkLookupPostcodes(postcodes)` | Batch lookup, up to 100 per call |
| `findOutcode(outcode)` | Outward code lookup |
| `findPlace(code)` | OS Open Names place lookup by code |

## Error handling

```ts
import { isApiNotFoundError } from "@effect-postcodes/client"

yield* client.lookupPostcode("ZZ99ZZ").pipe(
  Effect.catchIf(isApiNotFoundError, (err) =>
    Effect.succeed(`not found: ${err.identifier}`)
  )
)
```

Errors: `ApiNotFoundError` (typed 404), `HttpClientError` (network), `SchemaError` (unexpected shape).

## Testing

Swap the service with a test double via `Layer.succeed`:

```ts
Layer.succeed(PostcodesClient, {
  lookupPostcode: (_) => Effect.succeed(mockResult),
  bulkLookupPostcodes: (_) => Effect.succeed([]),
  findOutcode: (_) => Effect.die("not called"),
  findPlace: (_) => Effect.die("not called"),
})
```

## Interactive docs

```bash
bun run docs:serve   # Scalar API reference at http://localhost:3000/docs
bun run docs:api     # TypeDoc SDK reference in docs/api/
```

## Notes

- Requires Effect `^4.0.0-beta.90` and `@effect/platform-node` as peer dependencies
- Scottish, Welsh, and Northern Irish postcodes may return `region: null`
- Place codes are OS Open Names IDs (e.g. `osgb4000000074564391`)
```

- [ ] **Step 2: Verify build + tests still pass**

Run: `bun run check`
Expected: clean typecheck, `5 pass`, `0 fail`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: replace assessment README with consumer-facing npm package documentation"
```

---

## Self-review

**Spec coverage:**
- Package identity (`@effect-postcodes/client`, `0.1.0`, no `private`) — Task 5 ✓
- File structure (`src/internal/`, `src/index.ts`, `src/PostcodesClient.ts`) — Tasks 1-3 ✓
- `PostcodesClient.make / .layer / .Default` — Task 2 ✓
- Error types exposed, Effect types pass-through — Task 3 barrel ✓
- Domain types re-exported from `src/index.ts` — Task 3 ✓
- `tsdown` build with `neverBundle` peer deps — Task 5 ✓
- `dist/index.mjs` + `dist/index.d.mts` output — Task 5 ✓
- Exports map with `types`/`default` — Task 5 ✓
- `effect` + `@effect/platform-node` as peer deps — Task 5 ✓
- `publint` + `attw` quality gates — Task 5 ✓
- `typedoc` API docs — Task 5 ✓
- changeset release tooling — Task 5 ✓
- Tests use public API only — Task 4 ✓
- Mock test via `Layer.succeed` — Task 4 ✓
- Consumer README — Task 6 ✓

**No placeholders found.**

**Type consistency:** `PostcodesClient.Service` interface declared in Task 2 matches exactly what Task 4's tests destructure from `yield* PostcodesClient`. `clientLayer` helper in Task 4 calls `PostcodesClient.layer(config)` which is produced in Task 2. ✓
