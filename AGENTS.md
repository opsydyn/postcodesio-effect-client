# @effect-postcodes/client

The production-bound Effect-native TypeScript client for `postcodes.io`.

This repository began as an `@effect/openapi-generator` assessment. That phase is
complete. Generator experiments and generated artefacts remain part of the
implementation, but the repository now owns the production package, public API,
documentation, tests, and release workflow.

## Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Core**: Effect v4 beta (`effect@4.0.0-beta.98`)
- **Generator**: `@effect/openapi-generator@4.0.0-beta.98`
- **Runtime HTTP integration**: Effect Fetch HTTP client by default; optional `@effect/platform-node`
- **Server/tests**: Elysia
- **Spec tooling**: `swagger2openapi`, `yaml`
- **Linting/formatting**: Oxlint, Oxfmt, and `@opsydyn/oxlint-effect`

## Project layout

- `openapi/` — transitional narrowed spec plus vendored and bundled full upstream inputs
- `scripts/` — helpers for pulling and bundling the full upstream spec
- `generated/` — raw generated client artifacts (the only machine-generated tree)
- `src/PostcodesClient.ts` — public Effect service façade
- `src/internal/` — handwritten wrapper and rate-limiting implementation
- `src/programs/` — runnable examples and smoke programs
- `src/server/` — native `HttpApi` definition + server, generating OpenAPI docs from code
- `test/` — Elysia-backed contract tests and helpers
- `docs/` — Starlight consumer documentation

## What this repo is for

Keep work here focused on delivering a production client that:

- covers the full supported `postcodes.io` endpoint set
- exposes a stable Effect-native public API through `src/index.ts`
- isolates replaceable generated transport code behind a small wrapper
- validates upstream schemas against representative live UK responses
- keeps generation, packaging, documentation, and release workflows reproducible

## Non-negotiables

- **This is the production-bound package** — public API, compatibility, documentation, and release changes require production-level evidence.
- **The current four-endpoint surface is transitional** — the production target is the full supported `postcodes.io` endpoint set.
- **Generated code is replaceable** — treat files under `generated/` as generated artifacts, not hand-maintained source.
- **Do not hand-edit generated output as the default fix** — prefer changing the spec input, generation command, wrapper layer, or bundling script. If generator output itself is the subject of investigation, document the finding in `ASSESSMENT.md`.
- **The wrapper is the stable production seam** — base URL injection, auth, input validation, ergonomic error mapping, and response shaping belong in `src/internal/ApiService.ts` and `src/PostcodesClient.ts`, not in generated files.
- **The full bundled upstream contract is the source input for endpoint expansion** — any verified corrections must be explicit, reviewable, and covered by tests.
- **Consumers use the public barrel only** — production code imports from `@effect-postcodes/client`, represented locally by `src/index.ts`, never directly from `generated/`.
- **Keep the fast test lane local** — default tests should stay deterministic and use the local Elysia mock server, not live `postcodes.io` HTTP.
- **Keep live compatibility checks separate** — opt-in live checks should cover representative postcodes from England, Scotland, Wales, and Northern Ireland without making the default suite depend on the network.
- **Bundle the full upstream spec before full generation** — in this repo, generating directly from the raw multi-file upstream entrypoint is a known dead end. The supported path is `pull:full-spec` -> `bundle:full-spec` -> `generate:full`.
- **Keep generated-code noise isolated** — if linting rules and generator output disagree, prefer a narrowly scoped generated-file exemption over rewriting emitted code just to appease lint.
- **Keep conclusions current** — when production readiness, generator findings, or supported endpoints change, update `README.md`, consumer docs, and `ASSESSMENT.md` in the same change.
- **Do not claim release readiness without release evidence** — verify package build, package lint, packed-consumer smoke tests, CI, and registry publication separately.

## Working rules

### Public-contract workflow

When changing a public endpoint, schema, or wrapper behaviour:

1. Start with a failing local contract test or focused reproducer
2. Update the full-contract derivation or explicit correction that owns the schema
3. Regenerate the affected client artefact
4. Adjust `src/internal/ApiService.ts` and `src/PostcodesClient.ts`
5. Update local contract tests and any opt-in live compatibility coverage
6. Update examples and consumer documentation
7. Update `ASSESSMENT.md` when the generator finding or production recommendation changes

### Full upstream workflow

When changing the upstream ingestion path:

1. Update the fetch or bundling logic in `scripts/` as needed
2. Run `bun run pull:full-spec`
3. Run `bun run bundle:full-spec`
4. Run `bun run generate:full`
5. Reconcile public-contract implications rather than updating only `PostcodesFull.ts`
6. Re-run validation
7. Record upstream quirks, explicit corrections, and generator limitations in `ASSESSMENT.md`

## Testing rules

- **TDD for behaviour changes** — start with a failing test or reproducer when fixing a bug or changing behaviour.
- **Use `bun:test`** — `describe`, `test`, and `expect` from `bun:test`.
- **Prefer local contract coverage over internal mocking** — use the Elysia mock server to validate wrapper behaviour and generated client integration.
- **Test boundaries, not internals** — focus on generated client behaviour, public wrapper seams, bundling outcomes, response decoding, and observable error mapping.
- **Keep live network access out of the default suite** — any future live checks should stay isolated from the normal fast lane.

## Validation

Use the existing scripts from `package.json`:

```bash
bun install --frozen-lockfile
bun run typecheck
bun test
bun run check
bun run lint:code
bun run fmt:check
bun run generate
bun run bundle:full-spec
bun run generate:full
bun run build
bun run lint
bun run docs:api:check
bun run docs:build
bun run example:get
bun run example:create
bun run example:fail
bun run example:full
```

Minimum expectations before calling work complete:

- run `bun run check`, `bun run lint:code`, and `bun run fmt:check` for normal code changes
- run `bun run generate` when the narrowed spec or wrapper contract changed
- run the full-spec workflow when `scripts/` or `openapi/full-upstream/` behavior changed
- run `bun run build` and `bun run lint` for public package changes
- run documentation checks when public APIs, examples, or consumer guidance changed
- update the assessment docs when production readiness or generator findings changed
