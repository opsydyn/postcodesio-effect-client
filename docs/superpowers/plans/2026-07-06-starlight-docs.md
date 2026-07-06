# Astro Starlight Docs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a working `docs/` Astro Starlight site with Diataxis-structured content and slim the README down to a short orientation document that links into it.

**Architecture:** `docs/` is a standalone private Astro project with its own `package.json`. Root `package.json` gets three `docs:*` proxy scripts. All doc content is written in `.mdx` inside `src/content/docs/`. The site runs locally via `bun run docs:dev`; deployment is out of scope.

**Tech Stack:** Astro `^7.0.6`, `@astrojs/starlight` `^0.41.3`, Bun.

## Global Constraints

- Astro version: `^7.0.6`
- Starlight version: `^0.41.3`
- `docs/package.json` is `"private": true`, name `@effect-postcodes/docs`
- `docs/` has its own `package.json` — NOT a workspace of the root, NOT included in root `files`
- Root `package.json` proxy scripts must use `bun --cwd docs run <script>`
- All `.mdx` files use Starlight frontmatter (`title`, `description`)
- No deployment config, no custom theme, no i18n — defaults only
- Verification for every task: `bun --cwd docs run build` must complete with no errors

---

### Task 1: Scaffold `docs/` — Starlight project with stub pages

Creates the complete `docs/` directory structure, installs deps, creates all `.mdx` files with minimal frontmatter (so the sidebar links resolve), and adds root proxy scripts. At the end the site builds and every nav link works, even though pages only show a title.

**Files:**
- Create: `docs/package.json`
- Create: `docs/astro.config.mjs`
- Create: `docs/tsconfig.json`
- Create: `docs/src/content/docs/index.mdx`
- Create: `docs/src/content/docs/tutorial/getting-started.mdx`
- Create: `docs/src/content/docs/guides/use-with-nodejs.mdx`
- Create: `docs/src/content/docs/guides/handle-scottish-postcodes.mdx`
- Create: `docs/src/content/docs/guides/configure-rate-limiting.mdx`
- Create: `docs/src/content/docs/guides/testing-with-mock-service.mdx`
- Create: `docs/src/content/docs/reference/api.mdx`
- Create: `docs/src/content/docs/reference/error-types.mdx`
- Create: `docs/src/content/docs/reference/configuration.mdx`
- Create: `docs/src/content/docs/explanation/effect-layers-model.mdx`
- Create: `docs/src/content/docs/explanation/why-three-entry-points.mdx`
- Modify: `package.json` (root — add three docs scripts)

- [ ] **Step 1: Create `docs/package.json`**

```json
{
  "name": "@effect-postcodes/docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev":     "astro dev",
    "build":   "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.41.3",
    "astro": "^7.0.6"
  }
}
```

- [ ] **Step 2: Create `docs/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: '@effect-postcodes/client',
      description: 'Effect-native TypeScript client for the postcodes.io API',
      sidebar: [
        { label: 'Overview', link: '/' },
        {
          label: 'Tutorial',
          items: [
            { label: 'Getting started', link: '/tutorial/getting-started' },
          ],
        },
        {
          label: 'How-to guides',
          items: [
            { label: 'Use with Node.js', link: '/guides/use-with-nodejs' },
            { label: 'Handle Scottish postcodes', link: '/guides/handle-scottish-postcodes' },
            { label: 'Configure rate limiting', link: '/guides/configure-rate-limiting' },
            { label: 'Testing with a mock service', link: '/guides/testing-with-mock-service' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', link: '/reference/api' },
            { label: 'Error types', link: '/reference/error-types' },
            { label: 'Configuration', link: '/reference/configuration' },
          ],
        },
        {
          label: 'Explanation',
          items: [
            { label: 'Effect layers model', link: '/explanation/effect-layers-model' },
            { label: 'Why three entry points', link: '/explanation/why-three-entry-points' },
          ],
        },
      ],
    }),
  ],
})
```

- [ ] **Step 3: Create `docs/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 4: Install Astro + Starlight inside `docs/`**

```bash
bun install --cwd docs
```

Expected: `node_modules` created inside `docs/`, no errors.

- [ ] **Step 5: Create all `.mdx` stub files**

Create each file listed below. Every file needs only the frontmatter — the body can be a single sentence for now. Starlight requires `title` and optionally `description`.

`docs/src/content/docs/index.mdx`:
```mdx
---
title: "@effect-postcodes/client"
description: Effect-native TypeScript client for the postcodes.io API.
---

Effect-native TypeScript client for the [postcodes.io](https://postcodes.io) API.
```

`docs/src/content/docs/tutorial/getting-started.mdx`:
```mdx
---
title: Getting started
description: Build a working postcode lookup script from scratch.
---

Coming soon.
```

`docs/src/content/docs/guides/use-with-nodejs.mdx`:
```mdx
---
title: Use with Node.js
description: Swap to Node.js's native HTTP client in a server-side application.
---

Coming soon.
```

`docs/src/content/docs/guides/handle-scottish-postcodes.mdx`:
```mdx
---
title: Handle Scottish postcodes
description: Work safely with postcodes that return null for the region field.
---

Coming soon.
```

`docs/src/content/docs/guides/configure-rate-limiting.mdx`:
```mdx
---
title: Configure rate limiting
description: Tune the adaptive rate limiter for your use case.
---

Coming soon.
```

`docs/src/content/docs/guides/testing-with-mock-service.mdx`:
```mdx
---
title: Testing with a mock service
description: Write tests without hitting the real postcodes.io API.
---

Coming soon.
```

`docs/src/content/docs/reference/api.mdx`:
```mdx
---
title: API reference
description: Full method signatures for PostcodesClient.
---

Coming soon.
```

`docs/src/content/docs/reference/error-types.mdx`:
```mdx
---
title: Error types
description: All possible errors from ApiServiceError.
---

Coming soon.
```

`docs/src/content/docs/reference/configuration.mdx`:
```mdx
---
title: Configuration
description: ApiConfig fields and defaults.
---

Coming soon.
```

`docs/src/content/docs/explanation/effect-layers-model.mdx`:
```mdx
---
title: Effect layers model
description: How Context.Service and Layer compose in @effect-postcodes/client.
---

Coming soon.
```

`docs/src/content/docs/explanation/why-three-entry-points.mdx`:
```mdx
---
title: Why three entry points
description: The design rationale behind .Default, .layer, and .make.
---

Coming soon.
```

- [ ] **Step 6: Add proxy scripts to root `package.json`**

Add these three lines to the `"scripts"` block, after `"docs:serve"`:

```json
"docs:dev":     "bun --cwd docs run dev",
"docs:build":   "bun --cwd docs run build",
"docs:preview": "bun --cwd docs run preview"
```

- [ ] **Step 7: Verify the site builds**

```bash
bun run docs:build
```

Expected: Astro build completes. Output is something like:
```
 building...
 ✓ Completed in X.XXs
```

No `[ERROR]` lines. If Starlight warns about missing content, that is acceptable as long as the build succeeds.

- [ ] **Step 8: Commit**

```bash
git add docs/ package.json
git commit -m "feat: scaffold Astro Starlight docs site with Diataxis sidebar structure"
```

---

### Task 2: Write Tutorial + Landing page content

Fills in the two highest-priority pages: the landing page (`index.mdx`) that funnels readers to the right quadrant, and the full Tutorial — the page that gets a reader from install to working code.

**Files:**
- Modify: `docs/src/content/docs/index.mdx`
- Modify: `docs/src/content/docs/tutorial/getting-started.mdx`

- [ ] **Step 1: Replace `docs/src/content/docs/index.mdx`**

```mdx
---
title: "@effect-postcodes/client"
description: Effect-native TypeScript client for the postcodes.io API.
---

import { LinkCard, CardGrid } from '@astrojs/starlight/components'

Effect-native TypeScript client for the [postcodes.io](https://postcodes.io) API.
Adaptive rate limiting, typed errors, and full [Effect](https://effect.website) layer
composition built in.

<CardGrid>
  <LinkCard
    title="Tutorial"
    href="/tutorial/getting-started"
    description="Get from install to working code in five minutes."
  />
  <LinkCard
    title="How-to guides"
    href="/guides/use-with-nodejs"
    description="Step-by-step for specific tasks: Node.js, Scottish postcodes, rate limiting, testing."
  />
  <LinkCard
    title="Reference"
    href="/reference/api"
    description="API signatures, error types, and configuration fields."
  />
  <LinkCard
    title="Explanation"
    href="/explanation/effect-layers-model"
    description="Why Effect layers, why three entry points, what Context.Service gives you."
  />
</CardGrid>
```

- [ ] **Step 2: Replace `docs/src/content/docs/tutorial/getting-started.mdx`**

```mdx
---
title: Getting started
description: Build a working postcode lookup script from scratch.
---

By the end of this tutorial you will have a TypeScript script that looks up a real
UK postcode and prints structured data to your terminal — including handling the
case where a postcode doesn't exist.

## Prerequisites

- Node.js ≥22 or [Bun](https://bun.sh)
- A TypeScript project (or create a fresh directory with `bun init`)

## 1. Install

```bash
npm install @effect-postcodes/client effect
```

`@effect/platform-node` is only needed if you later swap to Node.js's native HTTP
client. The default `FetchHttpClient` works without it.

## 2. Create `lookup.ts`

```typescript
import { Effect } from "effect"
import { PostcodesClient } from "@effect-postcodes/client"

const program = Effect.gen(function*() {
  // yield* PostcodesClient gives you the four service methods
  const { lookupPostcode } = yield* PostcodesClient

  // Calls the real postcodes.io API
  const result = yield* lookupPostcode("SW1A1AA")

  console.log(JSON.stringify(result, null, 2))
})

// PostcodesClient.Default bundles everything:
//   - FetchHttpClient for HTTP
//   - In-memory rate limiter with adaptive 429/Retry-After backoff
Effect.runPromise(
  program.pipe(Effect.provide(PostcodesClient.Default))
)
```

## 3. Run it

```bash
bun run lookup.ts
# or: npx tsx lookup.ts
```

You should see output like:

```json
{
  "postcode": "SW1A 1AA",
  "country": "England",
  "region": "London",
  "longitude": -0.141588,
  "latitude": 51.501009,
  "parliamentary_constituency": "Cities of London and Westminster",
  ...
}
```

## 4. Handle a postcode that doesn't exist

```typescript
import { Effect } from "effect"
import { PostcodesClient, isApiNotFoundError } from "@effect-postcodes/client"

const program = Effect.gen(function*() {
  const { lookupPostcode } = yield* PostcodesClient

  const result = yield* lookupPostcode("ZZ99ZZ").pipe(
    Effect.catchIf(isApiNotFoundError, (err) =>
      Effect.sync(() => {
        console.log(`Not found: ${err.identifier}`)
        return null
      })
    )
  )

  if (result) {
    console.log(JSON.stringify(result, null, 2))
  }
})

Effect.runPromise(
  program.pipe(Effect.provide(PostcodesClient.Default))
)
```

Run it:

```bash
bun run lookup.ts
# Not found: ZZ99ZZ
```

`isApiNotFoundError` is a typed guard — TypeScript narrows `err` to `ApiNotFoundError`,
which carries the resource name, the identifier that wasn't found, and the raw API
error message.

## What you built

You looked up a real postcode, saw structured data, and handled the 404 case with
a typed guard. `PostcodesClient.Default` wired the HTTP client and rate limiter for
you automatically.

## Next steps

- [Use with Node.js](/guides/use-with-nodejs) — swap to a Node-native HTTP client
- [Handle Scottish postcodes](/guides/handle-scottish-postcodes) — work with `region: null`
- [Testing with a mock service](/guides/testing-with-mock-service) — write tests without hitting postcodes.io
```

- [ ] **Step 3: Verify the site builds**

```bash
bun run docs:build
```

Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add docs/src/content/docs/index.mdx docs/src/content/docs/tutorial/
git commit -m "docs: write Tutorial and landing page content"
```

---

### Task 3: Write How-to guides content

Fills in the four goal-oriented how-to pages.

**Files:**
- Modify: `docs/src/content/docs/guides/use-with-nodejs.mdx`
- Modify: `docs/src/content/docs/guides/handle-scottish-postcodes.mdx`
- Modify: `docs/src/content/docs/guides/configure-rate-limiting.mdx`
- Modify: `docs/src/content/docs/guides/testing-with-mock-service.mdx`

- [ ] **Step 1: Replace `guides/use-with-nodejs.mdx`**

```mdx
---
title: Use with Node.js
description: Swap to Node.js's native HTTP client in a server-side application.
---

By default, `PostcodesClient.Default` uses `FetchHttpClient` (the browser-compatible
Fetch API). In a Node.js server you may prefer the platform-native HTTP client.

## When to use this

Use `PostcodesClient.layer` — not `.Default` — when you want to supply your own HTTP
client implementation.

## Install the optional peer dependency

```bash
npm install @effect/platform-node
```

## Wire it up

```typescript
import { Effect, Layer } from "effect"
import { NodeHttpClient } from "@effect/platform-node"
import { PostcodesClient, makeApiConfig } from "@effect-postcodes/client"

const AppLayer = PostcodesClient.layer(
  makeApiConfig({ baseUrl: "https://api.postcodes.io" })
).pipe(
  Layer.provide(NodeHttpClient.layer)
)

const program = Effect.gen(function*() {
  const { lookupPostcode } = yield* PostcodesClient
  return yield* lookupPostcode("EC1A1BB")
}).pipe(
  Effect.provide(AppLayer)
)
```

`PostcodesClient.layer` bundles the in-memory rate limiter but requires you to supply
the HTTP client — that is why `Layer.provide(NodeHttpClient.layer)` is chained after.

## Using in an Effect application

If your application already has a `Layer` composition, merge `AppLayer` into your
existing layer graph:

```typescript
const MainLayer = Layer.mergeAll(
  AppLayer,
  DatabaseLayer,
  // ...
)
```
```

- [ ] **Step 2: Replace `guides/handle-scottish-postcodes.mdx`**

```mdx
---
title: Handle Scottish postcodes
description: Work safely with postcodes that return null for the region field.
---

Postcodes in Scotland, Wales, and Northern Ireland may return `region: null`.
`region` is an England-specific NHS administrative concept; postcodes.io returns
`null` rather than an empty string for postcodes outside the English regional system.

`PostcodeResult.region` is typed `string | null` — not `string` — so TypeScript will
remind you to handle both cases.

## Type-safe handling

```typescript
import { Effect } from "effect"
import { PostcodesClient } from "@effect-postcodes/client"

const program = Effect.gen(function*() {
  const { lookupPostcode } = yield* PostcodesClient
  const result = yield* lookupPostcode("EH25 9NJ") // Midlothian, Scotland

  const regionDisplay = result.region ?? "Not applicable"
  console.log(`Region: ${regionDisplay}`)
  // Region: Not applicable
})

Effect.runPromise(
  program.pipe(Effect.provide(PostcodesClient.Default))
)
```

## Background

This nullability is not documented in postcodes.io's own published OpenAPI spec —
both their upstream spec and a naively generated client declare `region` as a
non-nullable `string`. The `@effect-postcodes/client` schema was corrected from
the upstream spec after live testing revealed the real API behaviour with
`EH25 9NJ`.

If you hit a `SchemaError` on a field you expect to be non-null, check whether
the postcode is outside England — the same pattern may apply to other
geography-specific fields.
```

- [ ] **Step 3: Replace `guides/configure-rate-limiting.mdx`**

```mdx
---
title: Configure rate limiting
description: Tune the adaptive rate limiter for your use case.
---

`PostcodesClient.Default` and `PostcodesClient.layer` both include an in-memory
rate limiter with adaptive 429/`Retry-After` feedback. When postcodes.io returns
a `429 Too Many Requests` response the limiter automatically backs off, then
resumes at a pace it learned from the server's `Retry-After` header.

The default pacing is conservative: 30 requests per 10 seconds. Tune it via
`ApiConfig.rateLimit`.

## Adjust the pacing

```typescript
import { Duration, Effect, Layer } from "effect"
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient"
import { PostcodesClient, makeApiConfig } from "@effect-postcodes/client"

const layer = PostcodesClient.layer(
  makeApiConfig({
    rateLimit: {
      window: Duration.seconds(5),
      limit: 50,
    },
  })
).pipe(Layer.provide(FetchHttpClient.layer))

const program = Effect.gen(function*() {
  const { bulkLookupPostcodes } = yield* PostcodesClient
  return yield* bulkLookupPostcodes(["SW1A1AA", "EC1A1BB", "EH25 9NJ"])
}).pipe(Effect.provide(layer))
```

## How the adaptive feedback works

The limiter cycles through four phases:

1. **Inactive** — no 429 received yet; requests are not throttled by the adaptive system
2. **Cooldown** — a 429 was received; the limiter waits for the `Retry-After` duration
3. **Learning** — the cooldown expired; the limiter measures the successful request rate
4. **Learned** — the limiter maintains the measured pace automatically

This is powered by Effect's `RateLimiterStore` adaptive consume/feedback API
introduced in `4.0.0-beta.88`.
```

- [ ] **Step 4: Replace `guides/testing-with-mock-service.mdx`**

```mdx
---
title: Testing with a mock service
description: Write tests without hitting the real postcodes.io API.
---

Because `PostcodesClient` is a `Context.Service`, you can replace the entire
implementation with a test double using `Layer.succeed`. No HTTP mocking library
or network interception needed.

## Basic test double

```typescript
import { Effect, Layer } from "effect"
import { PostcodesClient } from "@effect-postcodes/client"

const mockResult = {
  postcode: "SW1A 1AA",
  country: "England",
  region: "London",
  // fill in the fields your code under test actually reads
} as any

const MockClient = Layer.succeed(PostcodesClient, {
  lookupPostcode: (_postcode) => Effect.succeed(mockResult),
  bulkLookupPostcodes: (_postcodes) => Effect.succeed([]),
  findOutcode: (_outcode) => Effect.die("not called in this test"),
  findPlace: (_code) => Effect.die("not called in this test"),
})

// In your test (example uses bun:test):
import { expect, test } from "bun:test"

test("looks up a postcode", async () => {
  const result = await Effect.runPromise(
    Effect.gen(function*() {
      const { lookupPostcode } = yield* PostcodesClient
      return yield* lookupPostcode("SW1A1AA")
    }).pipe(Effect.provide(MockClient))
  )
  expect(result.postcode).toBe("SW1A 1AA")
})
```

## Testing 404 paths

```typescript
import { ApiNotFoundError, isApiNotFoundError } from "@effect-postcodes/client"

const NotFoundClient = Layer.succeed(PostcodesClient, {
  lookupPostcode: (postcode) =>
    Effect.fail(new ApiNotFoundError(
      "postcode",
      postcode,
      { status: 404, error: "Postcode not found" }
    )),
  bulkLookupPostcodes: (_) => Effect.die("not called"),
  findOutcode: (_) => Effect.die("not called"),
  findPlace: (_) => Effect.die("not called"),
})
```

## Why `Effect.die` for unused methods

`Effect.die` converts an unexpected call into a defect — a failing test will tell
you exactly which method was called unexpectedly, rather than silently returning
an undefined value that masks the problem.
```

- [ ] **Step 5: Verify the site builds**

```bash
bun run docs:build
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add docs/src/content/docs/guides/
git commit -m "docs: write How-to guides content"
```

---

### Task 4: Write Reference + Explanation content

Fills in the three reference pages and two explanation pages.

**Files:**
- Modify: `docs/src/content/docs/reference/api.mdx`
- Modify: `docs/src/content/docs/reference/error-types.mdx`
- Modify: `docs/src/content/docs/reference/configuration.mdx`
- Modify: `docs/src/content/docs/explanation/effect-layers-model.mdx`
- Modify: `docs/src/content/docs/explanation/why-three-entry-points.mdx`

- [ ] **Step 1: Replace `reference/api.mdx`**

```mdx
---
title: API reference
description: Full method signatures for PostcodesClient.
---

## `PostcodesClient`

A `Context.Service` providing four methods for the postcodes.io API.

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `lookupPostcode` | `postcode: string` | `Effect<PostcodeResult, ApiServiceError>` |
| `bulkLookupPostcodes` | `postcodes: readonly string[]` | `Effect<readonly BulkLookupItem[], ApiServiceError>` |
| `findOutcode` | `outcode: string` | `Effect<OutcodeResult, ApiServiceError>` |
| `findPlace` | `code: string` — OS Open Names ID | `Effect<PlaceResult, ApiServiceError>` |

### Static members

| Member | Type | Description |
|--------|------|-------------|
| `.Default` | `Layer<PostcodesClient>` | Pre-wired: FetchHttpClient + in-memory rate limiter |
| `.layer(config?)` | `(config?: ApiConfig) => Layer<PostcodesClient, never, HttpClient>` | Bundles rate limiter; requires you to provide an HttpClient |
| `.make(config?)` | `(config?: ApiConfig) => Effect<PostcodesClient.Service>` | Resolves the service directly — for scripts and top-level programs |

## Domain types

Imported from `@effect-postcodes/client`:

- `PostcodeResult` — single postcode lookup result; `region` is `string | null`
- `OutcodeResult` — outward code data
- `PlaceResult` — OS Open Names place record; place codes are opaque IDs like `osgb4000000074564391`
- `BulkLookupItem` — `{ query: string; result: PostcodeResult | null }` — `result` is null for unknown postcodes
- `ErrorEnvelope` — `{ status: 404; error: string }` — raw postcodes.io error body

## Full TypeDoc

For full type signatures of every exported field, run:

```bash
bun run docs:api
# opens docs/api/index.html
```
```

- [ ] **Step 2: Replace `reference/error-types.mdx`**

```mdx
---
title: Error types
description: All possible errors from ApiServiceError.
---

All service methods return `Effect<Result, ApiServiceError>` where:

```typescript
type ApiServiceError =
  | ApiNotFoundError      // typed 404
  | HttpClientError       // network / transport failure
  | SchemaError           // unexpected response shape
  | RateLimiterError      // rate limiter store error
```

## `ApiNotFoundError`

The postcode, outcode, or place code was not found.

```typescript
interface ApiNotFoundError {
  readonly _tag: "ApiNotFoundError"
  readonly resource: string       // "postcode" | "outcode" | "place"
  readonly identifier: string     // the value that was not found
  readonly message: string
  readonly cause: ErrorEnvelope   // { status: 404, error: string }
}
```

Catch with the exported `isApiNotFoundError` guard:

```typescript
import { isApiNotFoundError } from "@effect-postcodes/client"

yield* lookupPostcode("ZZ99ZZ").pipe(
  Effect.catchIf(isApiNotFoundError, (err) =>
    Effect.succeed(`${err.resource} not found: ${err.identifier}`)
  )
)
```

## `HttpClientError`

Network or transport failure from `effect/unstable/http/HttpClientError`.
Catch with `HttpClientError.isHttpClientError` from that module.

## `SchemaError`

The postcodes.io API returned a shape that does not match the expected schema.
This is rare in production but can indicate a breaking API change upstream.

## `RateLimiterError`

The rate limiter store returned an error. Only surfaces if you replace `.Default`
with a custom `RateLimiterStore` that can fail.
```

- [ ] **Step 3: Replace `reference/configuration.mdx`**

```mdx
---
title: Configuration
description: ApiConfig fields and defaults.
---

```typescript
interface ApiConfig {
  readonly baseUrl: string
  readonly authToken?: string | undefined
  readonly rateLimit?: {
    readonly window: Duration.Input
    readonly limit: number
  } | undefined
}
```

## Default values

```typescript
const defaultApiConfig: ApiConfig = {
  baseUrl: "https://api.postcodes.io",
}
```

The default rate limit is 30 requests per 10 seconds.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | `string` | `"https://api.postcodes.io"` | Base URL for all API requests |
| `authToken` | `string \| undefined` | `undefined` | Adds `Authorization: Bearer <token>` header if set |
| `rateLimit.window` | `Duration.Input` | `Duration.seconds(10)` | Time window for the rate limiter |
| `rateLimit.limit` | `number` | `30` | Maximum requests per window |

`Duration.Input` accepts strings like `"5 seconds"` or `"1 minute"`, numbers (milliseconds), or a `Duration` value.

## Create a config

```typescript
import { makeApiConfig } from "@effect-postcodes/client"

const config = makeApiConfig({
  rateLimit: { window: "5 seconds", limit: 50 }
})
```

`makeApiConfig` shallow-merges your overrides with `defaultApiConfig`.
```

- [ ] **Step 4: Replace `explanation/effect-layers-model.mdx`**

```mdx
---
title: Effect layers model
description: How Context.Service and Layer compose in @effect-postcodes/client.
---

If you're new to Effect, `yield* PostcodesClient` and `Effect.provide(PostcodesClient.Default)`
can look unfamiliar. This page explains what's happening and why.

## Services are typed dependencies

`PostcodesClient` is a `Context.Service` — a typed dependency that your Effect
programs can declare they need. When your program writes:

```typescript
const { lookupPostcode } = yield* PostcodesClient
```

it is saying: "I need the `PostcodesClient` service to be in context." Effect
enforces this at compile time. If you forget `Effect.provide(...)`, TypeScript
will tell you the program's `R` channel still contains `PostcodesClient` and
cannot be run.

## Layers are providers

A `Layer` is a description of how to build one or more services. `PostcodesClient.Default`
is a `Layer<PostcodesClient>` — it knows how to construct a `PostcodesClient` instance
(using `FetchHttpClient` and an in-memory rate limiter) and registers it in the
program's context.

```typescript
// "wire this program to the Default layer"
program.pipe(Effect.provide(PostcodesClient.Default))
```

## Why this matters for testing

Because the service lives in context — not as a global or an imported module —
you can replace it entirely in tests without any mocking framework:

```typescript
Layer.succeed(PostcodesClient, {
  lookupPostcode: (_) => Effect.succeed(mockResult),
  // ...
})
```

TypeScript checks that your mock satisfies the same interface as the real
implementation. No monkey-patching, no module interception, no hidden coupling.

## Further reading

The Effect documentation at [effect.website](https://effect.website) covers
`Context`, `Layer`, and service composition in depth. The concepts transfer
directly — `PostcodesClient` uses the same primitives as any other Effect service.
```

- [ ] **Step 5: Replace `explanation/why-three-entry-points.mdx`**

```mdx
---
title: Why three entry points
description: The design rationale behind .Default, .layer, and .make.
---

`PostcodesClient` exposes three ways to access the service. They exist to serve
different contexts without compromising composability.

## `.Default`

A fully wired `Layer<PostcodesClient>` — no configuration needed.

```typescript
program.pipe(Effect.provide(PostcodesClient.Default))
```

Use `.Default` for scripts, examples, quick integrations, and any program that
does not need to customise the HTTP client. It bundles both `FetchHttpClient`
and the in-memory rate limiter.

## `.layer(config?)`

A `Layer<PostcodesClient, never, HttpClient.HttpClient>` — it bundles the rate
limiter but requires you to supply an HTTP client.

```typescript
PostcodesClient.layer({ baseUrl: "..." }).pipe(
  Layer.provide(NodeHttpClient.layer)
)
```

Use `.layer` when you have an existing `HttpClient` in your layer graph, or when
you want `NodeHttpClient` for Node.js-native performance. This is the production-grade
composition path for Effect applications.

## `.make(config?)`

An `Effect<PostcodesClient.Service>` — builds the service directly, bundling
everything internally.

```typescript
const client = await Effect.runPromise(PostcodesClient.make())
const result = await Effect.runPromise(client.lookupPostcode("SW1A1AA"))
```

Use `.make` in top-level scripts or programs that call `Effect.runPromise` once.
It avoids any layer composition at all.

## The tradeoff in one sentence

`.Default` and `.make` are the easiest paths; `.layer` is the most composable.
All three produce identical service behaviour — only the wiring style differs.
```

- [ ] **Step 6: Verify the site builds**

```bash
bun run docs:build
```

Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add docs/src/content/docs/reference/ docs/src/content/docs/explanation/
git commit -m "docs: write Reference and Explanation content"
```

---

### Task 5: Slim down `README.md`

Replaces the current 110-line reference-heavy README with a ~40-line orientation
document. Readers land here, get a minimal working example, and then follow links
into the Diataxis docs site.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` entirely**

```markdown
# @effect-postcodes/client

Effect-native TypeScript client for the [postcodes.io](https://postcodes.io) API.

## Install

```bash
npm install @effect-postcodes/client effect
```

## Quick start

```typescript
import { Effect } from "effect"
import { PostcodesClient } from "@effect-postcodes/client"

const program = Effect.gen(function*() {
  const { lookupPostcode } = yield* PostcodesClient
  const result = yield* lookupPostcode("SW1A1AA")
  console.log(result.postcode, result.region)
})

Effect.runPromise(program.pipe(Effect.provide(PostcodesClient.Default)))
```

## Documentation

Browse the docs locally:

```bash
bun run docs:dev   # http://localhost:4321
```

| Section | What's there |
|---------|-------------|
| [Tutorial](/docs/src/content/docs/tutorial/getting-started.mdx) | From install to working code, step by step |
| [How-to guides](/docs/src/content/docs/guides/) | Node.js, Scottish postcodes, rate limiting, testing |
| [Reference](/docs/src/content/docs/reference/) | API, error types, configuration |
| [Explanation](/docs/src/content/docs/explanation/) | Effect layers model, why three entry points |

## Notes

- Requires `effect ^4.0.0-beta.90` as a peer dependency — Effect v3 is not compatible
- `@effect/platform-node` is an optional peer dep — only needed when using `PostcodesClient.layer` with `NodeHttpClient`
- Scottish, Welsh, and Northern Irish postcodes may return `region: null`
- Node ≥22 required
```

- [ ] **Step 2: Verify the package check still passes**

```bash
bun run check
```

Expected: `14 pass, 0 fail`, typecheck clean. (The README change does not affect the package.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: slim README to orientation page pointing to Starlight docs"
```

---

## Self-review

**Spec coverage:**
- `docs/package.json`, `astro.config.mjs`, `tsconfig.json` — Task 1 ✓
- All 10 `.mdx` files created — Task 1 (stubs), Tasks 2–4 (real content) ✓
- Starlight sidebar matching Diataxis structure — Task 1 ✓
- Root proxy scripts `docs:dev`, `docs:build`, `docs:preview` — Task 1 ✓
- Tutorial page: install → create file → run → handle 404 → next steps — Task 2 ✓
- Landing page with `CardGrid` linking to all four quadrants — Task 2 ✓
- Four how-to guides — Task 3 ✓
- Three reference pages — Task 4 ✓
- Two explanation pages — Task 4 ✓
- Slimmed README — Task 5 ✓

**No placeholders.** All page content is written in full. "Coming soon" stubs in Task 1 are replaced in Tasks 2–4.

**Consistency:** `PostcodesClient.Default`, `.layer`, `.make` are described consistently across all pages that reference them. `ApiConfig.rateLimit` field names (`window`, `limit`) match the actual `src/ApiConfig.ts` interface. `isApiNotFoundError` import matches the actual barrel export.
