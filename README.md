# @effect-postcodes/client

`@effect-postcodes/client` is an Effect-native TypeScript client for the
[postcodes.io](https://postcodes.io) API. It exposes the supported postcode and
place operations through one stable `PostcodesClient` service, with generated
HTTP transport kept internal to the package.

## Install

```bash
npm install @effect-postcodes/client effect
```

The package requires Effect 4 beta. `@effect/platform-node` is an optional peer
dependency, needed only when you use `PostcodesClient.layer` with
`NodeHttpClient`; `PostcodesClient.make()` and `PostcodesClient.Default` use the
built-in Fetch HTTP client.

## Quick start

```ts
import { Effect } from "effect";
import { PostcodesClient } from "@effect-postcodes/client";

const program = Effect.gen(function* () {
	const client = yield* PostcodesClient;
	const postcode = yield* client.lookupPostcode("SW1A 1AA");
	return postcode.postcode;
});

const postcode = await Effect.runPromise(program.pipe(Effect.provide(PostcodesClient.Default)));
console.log(postcode);
```

## Public API

All methods return `Effect<Success, ApiServiceError>`:

| Method                     | Input                | Success value                |
| -------------------------- | -------------------- | ---------------------------- |
| `lookupPostcode`           | `postcode`           | `PostcodeResult`             |
| `searchPostcodes`          | `PostcodeSearch`     | `readonly PostcodeResult[]`  |
| `bulkLookupPostcodes`      | `readonly string[]`  | `readonly BulkLookupItem[]`  |
| `findNearestPostcodes`     | `postcode`           | `readonly NearestPostcode[]` |
| `randomPostcode`           | none                 | `PostcodeResult`             |
| `lookupTerminatedPostcode` | `postcode`           | `TerminatedPostcode`         |
| `lookupScottishPostcode`   | `postcode`           | `ScottishPostcode`           |
| `findOutcode`              | `outcode`            | `OutcodeResult`              |
| `searchPlaces`             | `query`              | `readonly PlaceResult[]`     |
| `findPlace`                | OS Open Names `code` | `PlaceResult`                |
| `randomPlace`              | none                 | `PlaceResult`                |

`searchPostcodes` accepts exactly one search mode:

```ts
client.searchPostcodes({ query: "SW1A" });
client.searchPostcodes({ latitude: 51.501, longitude: -0.142 });
```

Do not combine the modes, and supply both coordinates together. Bulk lookup
accepts **1 to 100** postcodes. Invalid search and bulk inputs fail with the
typed `ApiValidationError` before an HTTP request is made.

The public barrel exports the result schemas and their inferred types:
`PostcodeResult`, `BulkLookupItem`, `NearestPostcode`, `TerminatedPostcode`,
`ScottishPostcode`, `OutcodeResult`, and `PlaceResult`. Use those exports rather
than importing generated modules.

## Errors and runtime boundary

`ApiServiceError` can contain a typed `ApiNotFoundError`,
`ApiValidationError`, Effect HTTP-client errors, Effect schema errors, or a rate
limiter error. Use `isApiNotFoundError` and `isApiValidationError` to narrow the
two client-owned errors.

The package owns its public service, error, and runtime-schema boundary in
`src/index.ts`. The bundled upstream OpenAPI document and
`generated/PostcodesProduction.ts` are reproducible implementation artefacts;
consumers should never import them directly.

## Verification and release evidence

`bun test` is deterministic and uses the local Elysia mock server. The separate
`bun run test:live` command calls postcodes.io with representative English,
Scottish, Welsh, and Northern Irish postcodes, so it needs network access and is
not part of the default suite.

Before release, CI verifies generated artefacts, typechecking, local tests,
linting and formatting, package build/lint, TypeDoc, Starlight, and an isolated
packed-consumer smoke test. The upstream-sync workflow classifies full-spec-only
updates separately so they do not create a package release without a public
contract change.

## Documentation

Browse the Starlight documentation locally:

```bash
bun run docs:dev
```

Node 22 or newer is required.
