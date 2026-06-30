# effect-postcodes-openapi-spike

A focused assessment and experimentation repository for `@effect/openapi-generator`
against `postcodes.io`, including narrowed-spec generation, full upstream spec
vendoring, wrapper experiments, and Elysia-backed contract tests.

This repository is intentionally **not** the production client.
The production `effect-postcodes.io` library remains a separate, handwritten,
DDD-oriented client with strict schema boundaries.

## What this repository is

This project exists to answer a narrow question:

> How far can `@effect/openapi-generator` take us for `postcodes.io` before we
> hit generator ergonomics, schema drift, or integration friction?

It keeps that evaluation isolated from the handwritten production library by
placing generator output, wrapper code, scripts, and contract tests in one
contained repo-shaped workspace.

## Why it exists separately

This repo has a different purpose from the production library:

- evaluate `@effect/openapi-generator`
- vendor and bundle upstream OpenAPI inputs
- compare raw generated clients with thin handwritten wrappers
- keep generated-code churn isolated
- run local contract tests against a spike-local Elysia mock server

In other words: this is where we let the generator be noisy so the production
library does not have to.

## Project layout

- `openapi/` — narrowed spec plus vendored full upstream spec inputs
- `scripts/` — fetch and bundle helpers for the full upstream workflow
- `gen/generated/` — raw generated client artifacts
- `gen/client/` — handwritten wrapper layer over generated code
- `gen/programs/` — runnable examples and tiny smoke programs
- `gen/server/` — native `HttpApi` definition + server, generating OpenAPI
  docs from code instead of consuming an upstream spec
- `test/` — Elysia-backed contract tests and local helpers

## Where `@effect/openapi-generator` is actually used

The generator package is used in this repo as a **CLI tool**, not as a direct
runtime import from handwritten source files.

Concretely:

- `package.json` depends on `@effect/openapi-generator`
- `bun run generate` runs `openapigen` against `openapi/spec.yaml`
- `bun run generate:full` runs `openapigen` against
  `openapi/full-upstream/openapi.bundle.yaml`
- those commands write committed generated artifacts to:
  - `gen/generated/PostcodesSpike.ts`
  - `gen/generated/PostcodesFull.ts`

After generation, the rest of the repo imports the generated files rather than
`@effect/openapi-generator` itself:

- `gen/client/ApiService.ts` wraps `PostcodesSpike.ts`
- `test/contract.test.ts` exercises the handwritten wrapper over
  `PostcodesSpike.ts`
- `test/fullClient.elysia.test.ts` and `gen/programs/fullClient.ts` use
  `PostcodesFull.ts`

So if you grep for `@effect/openapi-generator` in handwritten runtime code, you
should not expect to find direct imports. The dependency is generation-time
only; the checked-in generated `.ts` files are what the runtime wrapper,
examples, and tests consume.

## Narrowed-spec workflow

The smallest useful assessment path uses a self-contained subset of the upstream
`postcodes.io` contract.

Included endpoints:

- `GET /postcodes/{postcode}`
- `POST /postcodes`
- `GET /outcodes/{outcode}`
- `GET /places/{code}`

This narrowed slice lets the repo validate:

- typed GET success paths
- typed POST success paths
- typed 404 failure handling
- wrapper-based base URL injection
- local contract testing without live HTTP dependency

## Full upstream workflow

The repository also supports vendoring the full upstream multi-file OpenAPI tree
and generating a complete client artifact from that bundled input.

Run:

```bash
bun run pull:full-spec
bun run bundle:full-spec
bun run generate:full
```

This writes:

- vendored upstream spec tree under `openapi/full-upstream/`
- fetch manifest under `openapi/full-upstream/manifest.json`
- bundled single-file spec at `openapi/full-upstream/openapi.bundle.yaml`
- full generated client artifact at `gen/generated/PostcodesFull.ts`

Important current finding:

- generating directly from the raw multi-file upstream entrypoint was not enough
  in this setup and produced an effectively empty client
- bundling the vendored tree into one OpenAPI document was required to get a
  meaningful full artifact
- the bundling step also normalizes one upstream boolean annotation quirk where
  `widesearch` used string `default` and `example` values

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

## Native OpenAPI docs

`gen/server/` defines a small `HttpApi` (`effect/unstable/httpapi`) mirroring
the narrowed-spec endpoints, reusing the same `Schema`s already generated into
`gen/generated/PostcodesSpike.ts`. Its handlers proxy real requests to
postcodes.io through the existing `ApiService` wrapper. Run:

```bash
bun run docs:serve
```

This serves:

- `GET /openapi.json` — the OpenAPI document generated natively from the
  `HttpApi` definition via `OpenApi.fromApi`, no upstream spec file involved
- `GET /docs` — an interactive Scalar reference page rendering that document
- the live, working endpoints themselves (`/postcodes/:postcode`,
  `/postcodes`, `/outcodes/:outcode`, `/places/:code`)

This is the reverse direction from the generator workflow above: instead of
spec → generated client, it's effect-native code → generated spec.

## Testing

The default test lane is local and deterministic.

It uses:

- `bun:test`
- a spike-local Elysia mock server under `test/helpers/`
- contract coverage for both the thin wrapper path and the full generated client

Recently validated from this project root:

- `bun run typecheck`
- `bun test`

## Findings summary

Current readout from the spike:

- the generated `httpclient` surface is understandable for a small JSON-only slice
- a thin handwritten wrapper is the right seam for base URL injection, response
  shaping, and friendlier error mapping
- simple JSON non-2xx flows are usable in Effect
- the full upstream path works better from a bundled spec than from the raw
  multi-file upstream entrypoint
- the tool is promising, but still beta-shaped enough that the production
  library should remain handwritten for now

For the fuller assessment and rationale, see `ASSESSMENT.md`.

## Commands

```bash
bun install
bun run typecheck
bun test
bun run check
bun run generate
bun run bundle:full-spec
bun run generate:full
bun run example:get
bun run example:create
bun run example:fail
bun run example:full
bun run docs:serve
```

## Related repositories

- `effect-postcodes.io` — handwritten production client
- `effect-postcodes-openapi-spike` — generator assessment and experimentation
