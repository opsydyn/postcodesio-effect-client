# Assessment: `@effect/openapi-generator` against `postcodes.io`

## Scope

This spike assessed `@effect/openapi-generator@4.0.0-beta.50` against a **narrowed subset** of the upstream `postcodes.io` OpenAPI contract.

We intentionally kept the spike small:

- 4 JSON-only endpoints
- 1 GET example
- 1 POST example
- 1 failure-path example
- 1 small contract/integration test
- generated code isolated under `gen/generated`
- handwritten wrapper isolated under `gen/client`

## What we tested

### Upstream-derived endpoint subset

- `GET /postcodes/{postcode}`
- `POST /postcodes`
- `GET /outcodes/{outcode}`
- `GET /places/{code}`

### Spike deliverables completed

- generation script
- isolated Bun/TypeScript spike app
- generated `httpclient` output
- thin handwritten `ApiService` wrapper
- config injection through wrapper
- local contract test
- runnable GET / POST / failure examples

## What worked well

### 1. Generated surface is understandable enough

The generated file is large, but not inscrutable.

Useful traits:

- schemas are emitted clearly
- operation names map cleanly from `operationId`
- success and error response types are explicit
- the generated `make(httpClient, options)` shape is simple to wrap

For the narrowed subset, the generated client was understandable after a quick read.

### 2. Base URL injection is clean in a wrapper

This worked well:

- construct the generated client once
- inject base URL in the wrapper with:
  - `HttpClient.mapRequest(...)`
  - `HttpClientRequest.prependUrl(...)`
- optionally inject auth headers in the same place

That makes the wrapper the correct seam for:

- base URL
- auth
- response unwrapping
- domain-friendly error mapping

### 3. Non-2xx responses are usable in Effect

For a simple JSON 404 response, the generated client was usable.

Observed behavior:

- the generated client emitted a typed tagged error like `LookupPostcode404`
- the handwritten wrapper successfully mapped that into a friendlier `ApiNotFoundError`
- the failure-path example and contract test both passed

So for **single-schema JSON error statuses**, the story is good enough.

### 4. Regeneration churn is contained if you isolate generated code

Generated output lands in one file:

- `gen/generated/PostcodesSpike.ts`

That means churn is noisy, but localized.

This is manageable if you keep these rules:

- never import generated code directly from app code
- keep handwritten code in a separate wrapper folder
- treat generated output as replaceable

### 5. Raw generator output is usable if generated-code lint expectations are scoped appropriately

This ended up being the most important conclusion of the spike.

Without the local postprocess step, the generator still emits a client that is
functionally close to usable for this narrowed subset, but the generated file
contains patterns that do not meet this repo's default handwritten-code lint rules.

Observed directly in raw generated output:

- `Effect.Effect<any, any>` in the `withResponse` helper
- `as any` in the optional-response helper
- `cause: any` in the generated error implementation
- another final `as any` in the error constructor
- a `transformClient!` non-null assertion

So the real answer to "what do we get without the script?" is:

- a generated client that basically works for the tiny JSON-only subset
- a generated file that trips repo lint rules aimed at handwritten code
- specifically around `any` and non-null assertions in generator-emitted helper code

However, after applying a **file-scoped Biome override** for the generated client
file, the raw generated output was validated successfully without any
postprocess script.

Observed final workable setup:

- raw `openapigen` output
- no source rewriting step
- targeted Biome override for the generated file only
  - `suspicious.noExplicitAny: off`
  - `style.noNonNullAssertion: off`
- `typecheck` passes
- spike tests pass

That is a much more conventional arrangement than rewriting generated source.
The spike conclusion should therefore be based on the raw generator output plus
a narrowly scoped generated-code lint exemption, not on a postprocess hack.

One small but useful source-level finding from the generator itself: section
comments like `// non-recursive definitions` are intentionally emitted by
`JsonSchemaGenerator` as output organization markers. They are generator-owned
formatting, not something inferred from the spec and not something introduced by
our local wrapper or Biome configuration.

## What was rough

### 1. Package ergonomics are still beta-grade

This was the sharpest paper cut.

Observed issues:

- npm package page has effectively no README guidance
- peer/runtime expectations are not obvious from docs
- the generator required careful version alignment with `effect` and `@effect/platform-node`
- we had to explicitly install `swagger2openapi` and `yaml` because the generator imports them at runtime

That is workable for a spike, but not yet smooth enough for low-friction adoption.

### 2. Full upstream spec usage is not yet the easy path

The real upstream `postcodes.io` OpenAPI spec is split across many `$ref` files.

For this spike, the fastest path was:

- extract a narrowed subset
- inline it into a self-contained `spec.yaml`

For a real adoption path, we would likely need one of:

- vendor the full upstream OpenAPI tree locally
- or prebundle the spec before generation

That is not a blocker, but it is real setup work.

Follow-up result from the exhaustive full-spec pass:

- we successfully vendored the full upstream `openapi/` tree locally
- the vendored tree contained 33 files
- generating directly from the multi-file entrypoint produced an effectively
  empty client surface in this spike
- bundling the vendored tree into a single self-contained OpenAPI document was
  required to get a meaningful full generated artifact
- one upstream schema annotation also needed normalization during bundling:
  `widesearch` is typed as boolean but used string `default` / `example` values

After bundling and that tiny normalization step, full generation succeeded and
the complete generated artifact typechecked.

### 3. Upstream generator response-model work is still in flight

Relevant upstream context:

- `#1911` documents JSON-compatible / binary response handling gaps
- `#1978` documents response representation loss per status
- `#1979` is the follow-up PR to preserve response representations per status

At assessment time, that PR is still open.

Implication:

- this spike worked for simple postcode-style JSON responses
- I would still be cautious around specs that use:
  - multiple JSON media types on one status
  - `application/problem+json`
  - mixed representations on the same status
  - binary success + JSON error combos

## Evaluation questions

### Is the generated client surface understandable?

**Yes, with caveats.**

It is understandable for a small subset, but you do not want app code coupled directly to it.
The wrapper pattern is not optional; it is what makes the surface pleasant.

### Can config like base URL and auth be injected cleanly?

**Yes.**

This was one of the stronger outcomes of the spike.
A thin wrapper around the generated `make(...)` API is enough.

### Are non-2xx responses usable in Effect?

**Yes for simple JSON error statuses.**

The 404 flow worked and was easy to map into a domain-specific wrapper error.
I would still withhold judgment on more complex mixed-representation error cases until `#1979` lands.

### Does regeneration create manageable churn?

**Mostly yes, if isolated.**

The generated file is big, but churn is manageable when:

- generated code is quarantined
- wrapper code is tiny
- consumers never import generated modules directly

### Would we trust this for a larger first-party JSON API?

**Not yet as a default.**

The spike shows real promise, but the current beta still asks the adopter to absorb too much friction:

- weak docs
- runtime packaging rough edges
- strict version alignment
- open response-model issues

## No-go for replacing the handwritten client today

That is the clearest recommendation for this repository right now.

Why:

- the spike succeeded technically
- the raw generated output still requires a generated-code-specific lint exemption
- but the ergonomics are still too beta-shaped
- the current handwritten client is already aligned with this repo's DDD and schema-boundary rules
- migrating now would increase toolchain risk without enough payoff yet

## Conditional go for continued experimentation

I **would** keep this spike and revisit later if these conditions improve:

- `@effect/openapi-generator` publishes clearer docs
- runtime packaging becomes smoother
- response representation work like `#1979` lands and ships
- we bundle/vendor the full upstream `postcodes.io` spec cleanly

## Bottom line

- **For this repo today:** no-go for migration
- **For future evaluation:** yes, worth tracking and re-testing
- **For small internal JSON APIs:** promising enough to keep exploring behind a wrapper
- **Without source rewriting:** the raw generated output can work here if generated-code lint exceptions are scoped narrowly

## Evidence from this spike

Validated successfully:

- code generation
- wrapper-based base URL injection
- typed GET success path
- typed POST success path
- typed 404 failure mapping
- local contract/integration test
- runnable examples

Observed in raw generated output without postprocessing:

- two `as any` casts
- `any`-typed helper signatures
- `cause: any` in the generated error implementation
- a non-null assertion in the generated client helper

Validated successfully after replacing source rewriting with a targeted Biome override:

- raw generation with no postprocess script
- editor diagnostics cleared for the generated file
- `bun run typecheck`
- `bun test`

Validated successfully for the exhaustive full upstream pass:

- vendored full upstream `openapi/` tree locally
- captured a fetch manifest covering 33 files
- bundled the multi-file upstream spec into `openapi/full-upstream/openapi.bundle.yaml`
- generated a complete `PostcodesFull.ts` artifact from the bundled spec
- full artifact typechecked after boolean annotation normalization during bundling

Observed during the exhaustive pass:

- direct generation from the raw multi-file upstream entrypoint produced an
  effectively empty client in this setup
- bundling was not optional for a meaningful full artifact here

Observed directly in generator-emitted file structure:

- section headers such as `// non-recursive definitions` come from the generator
  itself and are part of its normal output layout

The tool is real.
It is just not yet boring enough, or polished enough out of the box, to trust as the default foundation for this library.

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

## Update: 2026-06-30 — live-tested narrowed spec gap: nullable `region`

Live-tested the `src/server/` demo against the real postcodes.io API via its
Scalar docs UI. Looking up a Scottish postcode (`EH25 9NJ`) failed with
`SchemaError: Expected string, got null at ["result"]["region"]` — a real
`postcodes.io` response, not a malformed request.

This is not a transcription error against postcodes.io's own spec: their
published OpenAPI document declares `region: { type: string }` too (see
`openapi/full-upstream/components/schemas/Postcode.yaml`), with no
`nullable: true`. "Region" appears to be an England-specific NHS
administrative concept; postcodes.io's own documentation doesn't capture that
it returns `null` for Scottish (and likely Welsh/Northern Irish) postcodes.

Fixed in our narrowed spec: `openapi/spec.yaml`'s `PostcodeResult.region` is
now `type: [string, 'null']`, matching the pattern already used for
`parish`/`admin_county`/`ced`. Regenerated, added a regression test
(`test/contract.test.ts`: "decodes a null region for Scottish postcodes",
backed by a mock fixture in `test/helpers/fixtures.ts`), and verified against
the live API. Not fixed upstream — `openapi/full-upstream/` mirrors
postcodes.io's actual published spec, so changing it there would
misrepresent what they publish, even though it's also wrong in practice.

## Update: 2026-06-30 — synced vendored full upstream spec

`openapi/full-upstream/` was badly stale: postcodes.io's own `info.version`
jumped `3.5.1` → `18.0.0` on re-pull (`bun run generate:full`). Notable
changes that flowed into `generated/PostcodesFull.ts`:

- `Postcode.yaml` gained new fields (`date_of_termination`,
  `index_of_multiple_deprivation`, `senedd_constituency`,
  `senedd_constituency_no`) and promoted ~17 previously-optional fields
  (`pfa`, `nhs_region`, `ttwa`, `lep1`/`lep2`, etc.) to `required`
- confirmed the `region: string` non-nullable gap from the entry above is
  still present in postcodes.io's published spec at v18.0.0 — not something
  they've since fixed upstream
- `TerminatedPostcode.yaml`'s `eastings`/`northings`/`longitude`/`latitude`
  are now correctly nullable
- `ScottishPostcodeResponse.yaml` and `TerminatedPostcodeResponse.yaml`: a
  real shape correction — `result` was documented as an array, is now
  correctly a single object
- `ScottishPostcodes.yaml` went from a 27-line stub to a fully-documented
  Scottish Postcode Directory model (~50 fields)

Regenerated `generated/PostcodesFull.ts` against the refreshed bundle: clean
`tsc --noEmit`, all tests still pass. None of this touches the narrowed
spec/client — `src/client/`, `src/server/` only use the four narrowed
operations, not the full client's extra surface.
