# Design: full production `@effect-postcodes/client`

## Decision

`@effect-postcodes/client` will cover the complete supported postcodes.io
surface through a stable, handwritten Effect service. Raw generator output is an
internal transport dependency and is never imported by consumers.

The existing four operations remain supported while the full service is built.
They are corrected first, then replaced incrementally; they are not removed
until the complete public surface and consumer documentation are verified.

## Contract pipeline

The vendored upstream tree under `openapi/full-upstream/` remains an unaltered
record of the upstream contract. Its bundle is the input to a deterministic
production-normalisation step, which writes
`openapi/production.bundle.yaml`.

The normaliser contains only explicit, tested corrections for omissions or live
incompatibilities in upstream metadata: nullable response properties, missing
request bodies, query parameters, and error responses. It never edits the raw
tree. `generated/PostcodesProduction.ts` is generated from the normalised
bundle and is not hand-maintained.

`src/internal/ApiService.ts` owns HTTP configuration, path encoding, public
input validation, envelope unwrapping, and stable error mapping.
`src/PostcodesClient.ts` owns the public Effect service and `src/index.ts`
remains the only public package entry point.

## Public API

The stable methods are:

- `lookupPostcode`, `searchPostcodes`, `bulkLookupPostcodes`,
  `findNearestPostcodes`, and `randomPostcode`
- `lookupTerminatedPostcode` and `lookupScottishPostcode`
- `findOutcode`
- `searchPlaces`, `findPlace`, and `randomPlace`

The wrapper validates inputs that are missing or ambiguous upstream: bulk
requests contain 1–100 entries, and a postcode search accepts either a textual
query or a latitude/longitude pair, never both.

## Compatibility and release

Local Elysia contracts prove wrapper behaviour. A separate `test:live` command
proves representative England, Scotland, Wales, and Northern Ireland responses;
`BT1 5GS` is the first required Northern Ireland regression.

Upstream synchronisation pulls, bundles, normalises, and generates once per
run. It creates a release change only for public-contract changes. CI,
Changesets, and release workflows target `main`. Publishing remains gated on
the complete public surface, live compatibility lane, packed-consumer test, and
working release workflow.
