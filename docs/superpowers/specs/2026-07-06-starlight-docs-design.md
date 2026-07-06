# Design: Astro Starlight docs site + README slim-down

## Context

The current `README.md` mixes tutorial, reference, and how-to content into one flat
file, satisfying none of them well against the Diataxis framework. A Starlight site
in `docs/` gives each quadrant a proper home. The README becomes a short orientation
document that funnels readers to the right section.

## Scope

Two deliverables:
1. A working `docs/` Starlight Astro project with Diataxis sidebar structure and
   real initial content for every page (no Lorem Ipsum stubs).
2. A slimmed `README.md` that orients readers and links to the docs site.

Deployment is out of scope for this sprint — the site runs locally via
`bun run docs:dev`. No GitHub Actions or base-path config needed yet.

## File structure

```
docs/
  package.json            private, @effect-postcodes/docs, Astro + Starlight deps
  astro.config.mjs        Starlight config, title, sidebar
  tsconfig.json           minimal, for Astro's type-checking
  src/
    content/
      docs/
        index.mdx                              Landing page
        tutorial/
          getting-started.mdx                  Diataxis: Tutorial
        guides/
          use-with-nodejs.mdx                  Diataxis: How-to
          handle-scottish-postcodes.mdx
          configure-rate-limiting.mdx
          testing-with-mock-service.mdx
        reference/
          api.mdx                              Diataxis: Reference
          error-types.mdx
          configuration.mdx
        explanation/
          effect-layers-model.mdx              Diataxis: Explanation
          why-three-entry-points.mdx
```

`docs/` is excluded from the npm package `files` field automatically (only `dist/`
ships). `docs/` has its own private `package.json` and is not a workspace of the
root — it is self-contained.

## `docs/package.json`

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

## `docs/astro.config.mjs`

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

## `docs/tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

## Root `package.json` additions

Three new scripts added alongside `docs:api` and `docs:serve`:

```json
"docs:dev":     "bun --cwd docs run dev",
"docs:build":   "bun --cwd docs run build",
"docs:preview": "bun --cwd docs run preview"
```

## Page content — what each page must contain

### `index.mdx` (landing / overview)

One-paragraph description of the package. Links to Tutorial (for new users),
How-to guides (for specific tasks), Reference (for API lookup), Explanation
(for background context). Does NOT duplicate the README.

### `tutorial/getting-started.mdx` (Diataxis: Tutorial)

This is the highest-priority page — it must get a new user to a working, running
program from scratch. Structure:

1. **What you'll build** — "By the end of this tutorial you will have a TypeScript
   script that looks up a real UK postcode and prints structured data to your
   terminal."
2. **Prerequisites** — Node ≥22, a TypeScript project, `bun` or `tsx` for running TS.
3. **Install** — exact command with all three packages.
4. **Create `lookup.ts`** — complete file shown with every line explained inline.
5. **Run it** — exact command, expected output (show the JSON shape).
6. **Handle the 404 case** — add `Effect.catchIf(isApiNotFoundError, ...)`, re-run
   with a fake postcode, show the error output.
7. **Next steps** — links to each How-to guide by name.

The tutorial uses `PostcodesClient.make()` (the zero-boilerplate path, no Layer
knowledge required). It defers `.Default` and `.layer` to the Explanation pages.

### `guides/use-with-nodejs.mdx` (How-to)

Goal: swap `FetchHttpClient` for `NodeHttpClient` in a server-side Node.js app.
Shows the exact `PostcodesClient.layer({ baseUrl }).pipe(Layer.provide(NodeHttpClient.layer))`
pattern. Notes that `@effect/platform-node` is an optional peer dep needed only
for this path.

### `guides/handle-scottish-postcodes.mdx` (How-to)

Goal: write code that handles `region: null` correctly for Scottish, Welsh, and
Northern Irish postcodes. Shows a type-safe narrowing pattern using the
`region: string | null` type. Notes this is a known gap in postcodes.io's own
OpenAPI spec (the repo's ASSESSMENT.md has details).

### `guides/configure-rate-limiting.mdx` (How-to)

Goal: tune the rate limiter for high-volume use cases. Shows `ApiConfig.rateLimit`
field, explains the adaptive 429/Retry-After feedback behavior, gives concrete
`{ window: Duration.seconds(5), limit: 10 }` example.

### `guides/testing-with-mock-service.mdx` (How-to)

Goal: write a test without hitting postcodes.io. Shows the `Layer.succeed(PostcodesClient, {...})` 
pattern in full. Notes `Effect.die("not called")` for unused methods.

### `reference/api.mdx` (Reference)

Dry, accurate. Table of all 4 methods with signatures, parameter types, return
types. Notes that full generated TypeDoc is available at `bun run docs:api`.
Does NOT explain when to use things (that's Explanation).

### `reference/error-types.mdx` (Reference)

Table of all `ApiServiceError` union members: `ApiNotFoundError` (our type),
`HttpClientError` (network), `SchemaError` (unexpected response shape),
`RateLimiterError` (rate limit exceeded). Each has: what it means, how to catch it.

### `reference/configuration.mdx` (Reference)

`ApiConfig` interface with all fields, types, and defaults. `rateLimit` sub-object
with `window` and `limit`.

### `explanation/effect-layers-model.mdx` (Explanation)

Why Effect's layer system? Explains `Context.Service`, what `Layer.provide` does,
why services are swappable for testing. Aimed at TypeScript developers unfamiliar
with Effect. Does NOT give code you need to copy (that's Tutorial/How-to).

### `explanation/why-three-entry-points.mdx` (Explanation)

Why `.make`, `.layer`, and `.Default` — when each one exists, the design tradeoffs,
and how they compose with the broader Effect ecosystem. Explains that `.Default` is
convenience for simple programs and `.layer` is the production-grade composition path.

## Updated `README.md`

The slimmed README contains only:
- Title + one-line description
- Install badge / command
- 10-line zero-to-working code snippet (`.Default` path)
- Four links to the docs quadrants: Tutorial | How-to guides | Reference | Explanation
- One-liner on peer deps and bleeding-edge beta status
- `bun run docs:dev` to browse docs locally

Approximately 40 lines total — no more than needed for a reader to understand what
the package is and where to go next.

## Out of scope

- Deployment (GitHub Actions, Vercel, Netlify) — later sprint
- Custom Starlight theme or CSS overrides — defaults only for now
- Search integration (Starlight's built-in Pagefind search is included automatically
  on `bun run docs:build`, not available in dev mode — acceptable)
- Translations / i18n
- Blog or changelog page
