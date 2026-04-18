# effect-postcodes-openapi-spike

A standalone assessment and experimentation repository for `@effect/openapi-generator`
against `postcodes.io`.

This repository is intentionally **not** the production client.
The production `effect-postcodes.io` library remains a separate handwritten,
DDD-oriented client with stricter domain and schema-boundary rules.

## Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Core**: Effect v4 beta (`effect@4.0.0-beta.50`)
- **Generator**: `@effect/openapi-generator@4.0.0-beta.50`
- **Runtime HTTP integration**: `@effect/platform-node`
- **Server/tests**: Elysia
- **Spec tooling**: `swagger2openapi`, `yaml`
- **Linting/formatting**: Biome via `@catenarycloud/linteffect`

## Project layout

- `openapi/` — narrowed spec plus vendored full upstream inputs
- `scripts/` — helpers for pulling and bundling the full upstream spec
- `gen/generated/` — raw generated client artifacts
- `gen/client/` — handwritten wrapper layer over generated code
- `gen/programs/` — runnable examples and smoke programs
- `test/` — Elysia-backed contract tests and helpers

## What this repo is for

Keep work here focused on answering questions like:

- how usable is the generated `httpclient` surface?
- where should handwritten wrapper seams live?
- what breaks when using the real upstream multi-file spec?
- what needs bundling, normalization, or tooling support?
- is the generator mature enough to replace the handwritten client yet?

## Non-negotiables

- **This is a spike, not the production library** — do not present this repo as the default client for consumers.
- **Generated code is replaceable** — treat files under `gen/generated/` as generated artifacts, not hand-maintained source.
- **Do not hand-edit generated output as the default fix** — prefer changing the spec input, generation command, wrapper layer, or bundling script. If generator output itself is the subject of investigation, document the finding in `ASSESSMENT.md`.
- **The wrapper layer is the main handwritten seam** — base URL injection, auth, ergonomic error mapping, and response shaping belong in `gen/client/`, not in generated files.
- **Keep the fast test lane local** — default tests should stay deterministic and use the local Elysia mock server, not live `postcodes.io` HTTP.
- **Bundle the full upstream spec before full generation** — in this repo, generating directly from the raw multi-file upstream entrypoint is a known dead end. The supported path is `pull:full-spec` -> `bundle:full-spec` -> `generate:full`.
- **Keep generated-code noise isolated** — if linting rules and generator output disagree, prefer a narrowly scoped generated-file exemption over rewriting emitted code just to appease lint.
- **Keep conclusions current** — if the spike’s recommendation changes, update `README.md` and `ASSESSMENT.md` in the same change.

## Working rules

### Narrowed-spec workflow

When changing the small self-contained assessment slice:

1. Update `openapi/spec.yaml`
2. Regenerate with `bun run generate`
3. Adjust the handwritten wrapper in `gen/client/` if needed
4. Update or add tests in `test/`
5. Update example programs in `gen/programs/` if relevant
6. Update `README.md` or `ASSESSMENT.md` if the findings changed

### Full upstream workflow

When changing the exhaustive upstream path:

1. Update the fetch or bundling logic in `scripts/` as needed
2. Run `bun run pull:full-spec`
3. Run `bun run bundle:full-spec`
4. Run `bun run generate:full`
5. Re-run validation
6. Record any upstream spec quirks or generator limitations in `ASSESSMENT.md`

## Testing rules

- **TDD for behaviour changes** — start with a failing test or reproducer when fixing a bug or changing behaviour.
- **Use `bun:test`** — `describe`, `test`, and `expect` from `bun:test`.
- **Prefer local contract coverage over internal mocking** — use the Elysia mock server to validate wrapper behaviour and generated client integration.
- **Test boundaries, not internals** — focus on generated client behaviour, wrapper seams, bundling outcomes, and observable error mapping.
- **Keep live network access out of the default suite** — any future live checks should stay isolated from the normal fast lane.

## Validation

Use the existing scripts from `package.json`:

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
```

Minimum expectations before calling work complete:

- run `bun run check` for normal code changes
- run `bun run generate` when the narrowed spec or wrapper contract changed
- run the full-spec workflow when `scripts/` or `openapi/full-upstream/` behavior changed
- update the assessment docs if the project recommendation or generator findings changed

## Relationship to the parent repo

- `effect-postcodes.io` remains the handwritten production client
- `effect-postcodes-openapi-spike` exists to isolate generator experimentation and generated-code churn
- changes here should not silently imply a production migration recommendation unless `README.md` and `ASSESSMENT.md` explicitly say so
