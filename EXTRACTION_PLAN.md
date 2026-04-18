# Extraction plan for `openapi-effect-spike`

## Goal

Extract `apps/openapi-effect-spike/` into its own repository because it now has a distinct purpose from the parent `effect-postcodes.io` library.

The new repository should preserve the current spike workflows:

- narrowed-spec generation
- full upstream spec vendoring
- full-spec bundling
- generated client experiments
- handwritten wrapper experiments
- local Elysia-backed contract tests
- opt-in future live API testing

## Why extract now

The spike now has its own:

- `package.json`
- `bun.lock`
- `tsconfig.json`
- `scripts/`
- `openapi/`
- `gen/`
- `test/`
- documentation (`README.md`, `ASSESSMENT.md`)

It also already carries repo-specific concerns that differ from the parent project:

- assessing `@effect/openapi-generator`
- maintaining vendored upstream OpenAPI inputs
- experimenting with generated-client ergonomics
- testing against a spike-local Elysia mock

This is no longer just an app folder; it is effectively a standalone project.

## Current validated state

At the time of extraction planning, the spike is already self-contained enough to validate independently from its own root.

Validated successfully from `apps/openapi-effect-spike/`:

- `bun run typecheck`
- `bun test`

Current passing test files:

- `test/contract.test.ts`
- `test/fullClient.elysia.test.ts`

## Scope of the new repository

The extracted repository should own:

- generator experiments for `postcodes.io`
- spike-local test helpers and fixtures
- narrowed and full-spec generation pipelines
- wrapper examples around generated clients
- documentation of findings and constraints

The extracted repository should **not** own:

- the handwritten production library under the parent repo's `src/`
- the parent repo's ADR history
- the parent repo's DDD/domain model implementation
- the parent repo's root testing helpers or runtime code

## Files and folders to move

Move these from `apps/openapi-effect-spike/` to the new repo root:

- `README.md`
- `ASSESSMENT.md`
- `EXTRACTION_PLAN.md`
- `package.json`
- `bun.lock`
- `tsconfig.json`
- `scripts/`
- `openapi/`
- `gen/`
- `test/`

Do **not** move:

- `node_modules/`

## Target repository layout

```text
openapi-effect-spike/
  package.json
  bun.lock
  tsconfig.json
  README.md
  ASSESSMENT.md
  EXTRACTION_PLAN.md

  scripts/
    pullFullSpec.ts
    bundleFullSpec.ts

  openapi/
    spec.yaml
    full-upstream/

  gen/
    generated/
    client/
    programs/

  test/
    contract.test.ts
    fullClient.elysia.test.ts
    helpers/
      fixtures.ts
      mockServer.ts
```

## Repository identity

Suggested repository purpose statement:

> A focused assessment and experimentation repository for `@effect/openapi-generator` against `postcodes.io`, including narrowed and full-spec generation, wrapper experiments, and Elysia-backed contract testing.

Optional future repository names:

- `effect-postcodes-openapi-spike`
- `postcodes-openapi-effect-spike`
- `effect-openapi-postcodes-spike`

## Migration phases

### Phase 1 — Freeze the boundary

Objective:

- confirm what belongs to the extracted repo and what stays in the parent repo

Done / mostly done:

- spike-local mock server exists
- spike-local fixtures exist
- tests live under `test/`
- spike validates from its own root

### Phase 2 — Create the new repository

Objective:

- create an empty repository and copy the spike contents into its root

Steps:

1. Create the new Git repository
2. Copy all scoped spike files/folders into the new repo root
3. Ensure `node_modules/` is excluded
4. Commit the initial extracted state

### Phase 3 — Reinstall and validate

Objective:

- prove the extracted repo works independently

Run from the new repo root:

```bash
bun install
bun run typecheck
bun test
bun run generate
bun run bundle:full-spec
bun run generate:full
```

Expected outcome:

- dependencies install successfully
- typecheck passes
- tests pass
- generation scripts still work from repo root

### Phase 4 — Rebrand and clarify docs

Objective:

- make the new repo read like a first-class project rather than a copied folder

Update as needed:

- `package.json` name
- `README.md` intro and purpose statement
- any references that still imply this is nested inside `effect-postcodes.io`
- future repository URL references

### Phase 5 — Add optional live API lane

Objective:

- separate stable local tests from real API verification

Planned addition:

- `bun run test:live`
- opt-in environment gate
- only known-good endpoints initially (for example `FindOutcode("SW1A")`)

This should remain separate from the default deterministic test suite.

### Phase 6 — Clean up the parent repo

Objective:

- remove the extracted spike cleanly from `effect-postcodes.io`

Suggested steps:

1. Delete `apps/openapi-effect-spike/` from the parent repo
2. Optionally add a small note or link in the parent repo docs
3. Keep only the parent repo code that belongs to the handwritten client

## Acceptance criteria

The extraction is complete when all of the following are true:

- the new repo installs from its own root
- the new repo typechecks from its own root
- the new repo tests pass from its own root
- the generation scripts work from its own root
- no imports point back into `effect-postcodes.io`
- local test helpers are fully contained in the new repo
- the README describes the repo as a standalone project

## Risks and watchpoints

### 1. Generated file churn

Large generated files are expected. The new repo should explicitly tolerate that.

### 2. Full-client live drift

Some live `postcodes.io` responses still do not match the generated full-client schemas cleanly. Keep those concerns out of the default test suite.

### 3. Upstream spec normalization

The bundled full-spec flow currently includes normalization for upstream quirks such as `widesearch`. Preserve that behavior during extraction.

### 4. Documentation drift

`README.md` and `ASSESSMENT.md` should continue to reflect the raw-generation + wrapper + scoped-lint-exemption conclusion accurately.

## Immediate next steps

Recommended next actions in order:

1. create the new repository
2. copy the spike contents into the new repo root
3. run the validation commands
4. adjust package/repo naming if desired
5. remove the nested spike directory from the parent repo after successful validation

## Cutover checklist

- [ ] New repository created
- [ ] Spike files copied to repo root
- [ ] `node_modules/` excluded
- [ ] `bun install` passes
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes
- [ ] `bun run generate` passes
- [ ] `bun run bundle:full-spec` passes
- [ ] `bun run generate:full` passes
- [ ] README updated for standalone identity
- [ ] Parent repo cleaned up after validation
