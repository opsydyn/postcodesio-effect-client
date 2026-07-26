# Production assessment: `@opsydyn/effect-postcodes-client`

> **Current direction — 2026-07-26:** the generator spike is complete. This
> repository owns the production-bound `@opsydyn/effect-postcodes-client` package.

## Decision

Use the generated client as an internal HTTP transport, not as the consumer
API. `PostcodesClient`, the public runtime schemas, and the typed error union
are handwritten and exported only through `src/index.ts`.

The implementation covers the eleven supported public operations:

- postcode lookup, text-or-coordinate search, bulk lookup, nearest lookup, and
  random postcode
- terminated and Scottish postcode lookup
- outcode lookup
- place search, place lookup, and random place

Bulk lookup validates 1–100 input postcodes. `PostcodeSearch` accepts either a
text query or a complete latitude/longitude pair, never both. These invalid
inputs become `ApiValidationError` before transport is invoked.

## Contract and generation findings

The immutable vendored upstream tree must be bundled before full generation;
direct multi-file generation is not a supported path in this repository. The
production pipeline is:

```text
pull:full-spec -> bundle:full-spec -> normalize:production-spec -> generate:production
```

`normalize:production-spec` makes explicit, tested compatibility corrections
to a clone of the bundle. In particular it retains nullable postcode geography
fields and derives the production bulk-request/response contract. The resulting
`openapi/production.bundle.yaml` and `generated/PostcodesProduction.ts` are
generated artefacts and must not be hand-edited.

The generator is suitable here because its replaceable output is isolated:

- handwritten code owns URL configuration, path encoding, input validation,
  response unwrapping, error mapping, and rate limiting
- consumer code imports only `@opsydyn/effect-postcodes-client`
- generated-code lint exceptions remain scoped to generated files

There are still upstream-contract caveats. `postcodes.io` has returned nullable
geography fields that its published schemas did not always model, so the client
keeps representative local fixtures and an opt-in live compatibility lane.

## Release evidence

The release gate is deliberately broader than a source test run:

- deterministic local contracts run against Elysia through `bun test`
- `bun run test:live` is opt-in network coverage for England (`SW1A 1AA`),
  Scotland (`EH25 9NJ`), Wales (`CF10 1AA`), and Northern Ireland (`BT1 5GS`)
- generation verification detects stale generated artefacts
- package build/lint, API docs, Starlight docs, and a packed-consumer smoke test
  validate the published boundary
- CI/release/Changesets target `main`; sync policy prevents full-spec-only
  refreshes from being released as public API changes

The live lane proves only the representative lookup compatibility above. It is
not a claim that every upstream response variant has been exercised. Publishing
remains a separate registry operation after CI and Changesets approval.

## Historical note

This repository began as an `@effect/openapi-generator` assessment against a
narrowed four-endpoint contract. Its central conclusion remains: generated
transport is useful, but it should not define consumer compatibility. The
production package therefore preserves a small handwritten boundary and keeps
the generator output replaceable.
