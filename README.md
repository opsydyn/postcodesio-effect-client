# @effect-postcodes/client

Effect-native TypeScript client for the [postcodes.io](https://postcodes.io) API.

## Install

```bash
npm install @effect-postcodes/client effect
```

## Quick start

```typescript
import { Effect } from "effect";
import { PostcodesClient } from "@effect-postcodes/client";

const program = Effect.gen(function* () {
	const { lookupPostcode } = yield* PostcodesClient;
	const result = yield* lookupPostcode("SW1A1AA");
	console.log(result.postcode, result.region);
});

Effect.runPromise(program.pipe(Effect.provide(PostcodesClient.Default)));
```

## Documentation

Browse the docs locally:

```bash
bun run docs:dev   # http://localhost:4321
```

| Section                                                         | What's there                                        |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [Tutorial](/docs/src/content/docs/tutorial/getting-started.mdx) | From install to working code, step by step          |
| [How-to guides](/docs/src/content/docs/guides/)                 | Node.js, Scottish postcodes, rate limiting, testing |
| [Reference](/docs/src/content/docs/reference/)                  | API, error types, configuration                     |
| [Explanation](/docs/src/content/docs/explanation/)              | Effect layers model, why three entry points         |

## Notes

- Requires `effect ^4.0.0-beta.90` as a peer dependency — Effect v3 is not compatible
- `@effect/platform-node` is an optional peer dep — only needed when using `PostcodesClient.layer` with `NodeHttpClient`
- Scottish, Welsh, and Northern Irish postcodes may return `region: null`
- Some geography-specific fields, including Northern Irish `msoa`, may also be `null`
- Node ≥22 required

## Live compatibility checks

`bun run test:live` calls the real API with representative English, Scottish,
Welsh, and Northern Irish postcodes. It is intentionally separate from the
deterministic local test suite.

## Automation

A [Flue](https://flueframework.com) AI agent runs weekly in GitHub Actions to keep the upstream postcodes.io OpenAPI spec in sync. When the spec changes, it opens a pull request with a detailed summary of what changed and whether `openapi/spec.yaml` needs manual attention. Merging that PR triggers a changesets release PR — approve it to publish to npm.

To trigger the sync manually: **Actions → Sync upstream spec → Run workflow**.
