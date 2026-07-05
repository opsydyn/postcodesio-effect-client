# Design: `@effect-postcodes/client` package — identity + consumer API surface

## Context

The repo is currently a spike (`private: true`, `version: 0.0.0`, no exports map,
no build step). This spec covers the highest-impact slice toward an enterprise-grade
npm package: establishing package identity, a clean consumer-facing API, a proper
build pipeline, and complementary generated documentation.

The existing `src/client/` wrapper (4 endpoints, adaptive rate limiting, URL encoding,
typed errors) is the library core. `src/programs/`, `src/server/`, `generated/`,
`test/`, and `scripts/` remain in the repo as tooling/examples but are excluded from
what ships on npm.

## Package identity

- **Name:** `@effect-postcodes/client`
- **Version:** `0.1.0`
- **Effect position:** explicit Effect-native, no compatibility shim — peer deps, not
  runtime deps
- **`publishConfig`:** `{ "access": "public", "provenance": true }` — signed npm
  provenance for supply-chain verification

## File structure

```
src/
  index.ts                  ← public barrel — the only consumer entry point
  PostcodesClient.ts        ← new — Context.Service tag, .make, .layer, .Default
  ApiConfig.ts              ← public (consumers need the config type)
  Errors.ts                 ← public (consumers need error types)
  internal/
    ApiService.ts           ← was src/client/ApiService.ts — unexported implementation
    RateLimiting.ts         ← was src/client/RateLimiting.ts — unexported implementation
dist/                       ← tsdown build output — what npm ships
  index.mjs
  index.mjs.map
  index.d.mts
  index.d.mts.map
docs/api/                   ← typedoc output — TypeScript SDK reference
tsdown.config.ts            ← new build config
typedoc.json                ← new docs config
```

`generated/` stays at repo root (dev artifact, not shipped). `src/server/` and
`src/programs/` are excluded from the package `files` field.

## Public API (`src/index.ts` exports exactly this)

```ts
// Service tag — the primary consumer interface
export { PostcodesClient } from "./PostcodesClient.ts"

// Config
export type { ApiConfig } from "./ApiConfig.ts"
export { defaultApiConfig, makeApiConfig } from "./ApiConfig.ts"

// Error types
export type { ApiServiceError } from "./Errors.ts"
export { ApiNotFoundError, isApiNotFoundError } from "./Errors.ts"

// Domain types re-exported from generated/ — consumers never import generated/ directly
export type {
  PostcodeResult,
  OutcodeResult,
  PlaceResult,
  BulkLookupItem,
  ErrorEnvelope,
} from "../generated/PostcodesSpike.ts"
```

## `PostcodesClient` service

```ts
export class PostcodesClient extends Context.Service<PostcodesClient, {
  readonly lookupPostcode:
    (postcode: string) => Effect<PostcodeResult, ApiServiceError>
  readonly bulkLookupPostcodes:
    (postcodes: readonly string[]) => Effect<readonly BulkLookupItem[], ApiServiceError>
  readonly findOutcode:
    (outcode: string) => Effect<OutcodeResult, ApiServiceError>
  readonly findPlace:
    (code: string) => Effect<PlaceResult, ApiServiceError>
}>()("@effect-postcodes/client/PostcodesClient") {

  /** Resolves the service directly — for scripts and top-level programs. */
  static readonly make: (config?: ApiConfig) => Effect<PostcodesClient.Service>

  /** Returns a Layer — for Effect apps that compose layers. Caller can override
   *  the HTTP client by providing e.g. NodeHttpClient.layer after. */
  static readonly layer: (config?: ApiConfig) => Layer<PostcodesClient>

  /** Pre-wired with default config, FetchHttpClient, and in-memory RateLimiterStore.
   *  Zero configuration required. */
  static readonly Default: Layer<PostcodesClient>
}
```

### Consumer usage patterns

```ts
// 1. Script / quick test — minimal boilerplate
const client = await Effect.runPromise(PostcodesClient.make())
const result = await Effect.runPromise(client.lookupPostcode("SW1A1AA"))

// 2. Effect app — proper layer composition
const program = Effect.gen(function*() {
  const { lookupPostcode, bulkLookupPostcodes } = yield* PostcodesClient
  return yield* lookupPostcode("EH25 9NJ")
}).pipe(Effect.provide(PostcodesClient.Default))

// 3. Custom HTTP client (e.g. NodeHttpClient in a Node.js server)
program.pipe(
  Effect.provide(PostcodesClient.layer({ baseUrl: "https://api.postcodes.io" })),
  Effect.provide(NodeHttpClient.layer)
)

// 4. Test double — swap the whole service
program.pipe(
  Effect.provide(
    Layer.succeed(PostcodesClient, {
      lookupPostcode: () => Effect.succeed(mockResult),
      bulkLookupPostcodes: () => Effect.succeed([]),
      findOutcode: () => Effect.succeed(mockOutcode),
      findPlace: () => Effect.succeed(mockPlace),
    })
  )
)
```

## Error types

`ApiServiceError` exposes Effect's own types directly — idiomatic for Effect-native
packages, and consumers already know these types if they use Effect elsewhere:

```ts
export type ApiServiceError =
  | HttpClientError.HttpClientError   // network failures
  | SchemaError                       // unexpected response shape
  | ApiNotFoundError                  // typed 404 — package-owned, stable
  | RateLimiterError                  // only surfaces if consumer replaces .Default
```

`ApiNotFoundError` is the only error type this package owns fully. The rest are
pass-through Effect types. This is honest — if Effect changes these between betas,
that's a package update, not a design flaw.

## Build — `tsdown.config.ts`

```ts
import { defineConfig } from "tsdown"

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
})
```

`deps.neverBundle` externalises peer deps — the output `.mjs` will contain
`import { ... } from "effect"` rather than inlining Effect's code, preserving
tree-shaking for consumers.

## `package.json` changes

```json
{
  "name": "@effect-postcodes/client",
  "version": "0.1.0",
  "description": "Effect-native TypeScript client for the postcodes.io API",
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
  "peerDependencies": {
    "effect": "^4.0.0-beta.90",
    "@effect/platform-node": "^4.0.0-beta.90"
  },
  "publishConfig": { "access": "public", "provenance": true }
}
```

`effect` and `@effect/platform-node` move from `dependencies` to `peerDependencies`.
`elysia`, `swagger2openapi`, `yaml`, `bun-types` remain devDependencies (tooling only).

## Scripts

```json
"build":          "tsdown",
"dev":            "tsdown --watch",
"typecheck":      "tsc --noEmit",
"test":           "bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts",
"check":          "bun run typecheck && bun run test",
"docs:api":       "typedoc",
"docs:api:check": "typedoc --emit none",
"lint":           "publint && attw --pack . --ignore-rules cjs-resolves-to-esm",
"changeset":      "changeset",
"version":        "changeset version",
"release":        "bun run build && changeset publish",
"prepublishOnly": "bun run build",
"pack:dry-run":   "npm pack --dry-run"
```

New devDependencies: `tsdown`, `typedoc`, `publint`, `@arethetypeswrong/cli`,
`@changesets/cli`.

## Documentation: TypeDoc

`typedoc.json` pointing at `src/index.ts` with output to `docs/api/`. Sits alongside
the existing Scalar HTTP docs (`bun run docs:serve`): two complementary views of the
same package — Scalar for live HTTP exploration, TypeDoc for TypeScript SDK integration.

`docs:api:check` runs as part of CI to catch undocumented exports before publish.

## Testing discipline

All existing contract tests must be migrated to use the **public API only** —
`PostcodesClient.Default` or `PostcodesClient.layer(config)`, not direct imports
from `src/internal/`. If a test needs `src/internal/`, that's a signal the public
API is missing something.

One new test: verify `Layer.succeed(PostcodesClient, mock)` works as a test double —
confirms the service interface is correctly mockable.

## Out of scope for this slice

- Endpoint expansion (4 → 11) — next sprint
- CI pipeline (GitHub Actions, automated publish on changeset)
- `@effect-postcodes/server` (the `src/server/` HttpApi server as a separate package)
- README rewrite — a minimal consumer-facing README replaces the assessment-focused
  one as part of this slice
- Property-based testing, exhaustive live API coverage beyond the current 5 tests
