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
