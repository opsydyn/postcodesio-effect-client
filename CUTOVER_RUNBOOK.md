# Cutover runbook for extracting `openapi-effect-spike`

## Goal

Execute the extraction of `apps/openapi-effect-spike/` into its own standalone repository with a clear, repeatable sequence.

This runbook turns the planning docs into an operational checklist.

Related planning docs:

- `EXTRACTION_PLAN.md`
- `REPO_ROOT_RENAME_PLAN.md`
- `../../docs/openapi-effect-spike-parent-cleanup-plan.md`

## Current starting point

Already validated from the nested spike root:

- `bun run typecheck`
- `bun test`

That means the spike is already in a good state to extract.

## Choose your extraction style

There are two sensible paths.

### Path A preview — Clean copy start

Use this when you want the fastest, simplest extraction and you do **not** need to preserve folder-level git history in the new repository.

### Path B preview — Preserve history with `git subtree split`

Use this when you want the new repository to retain the commit history of `apps/openapi-effect-spike/`.

If you are undecided, Option A is the easier operational path.

## Recommended target name

Suggested new repository directory name:

- `effect-postcodes-openapi-spike`

The commands below assume the new repo is created as a sibling directory next to the current repo.

## Option A — Clean copy start

Run these from the current parent repo root.

### 1. Create the new sibling directory

```bash
mkdir -p ../effect-postcodes-openapi-spike
```

### 2. Copy the spike contents to the new repo root

```bash
rsync -av \
  --exclude 'node_modules' \
  --exclude '.DS_Store' \
  apps/openapi-effect-spike/ \
  ../effect-postcodes-openapi-spike/
```

### 3. Initialize the new repository

```bash
cd ../effect-postcodes-openapi-spike
git init -b main
```

### 4. Validate the clean-copy repo

```bash
bun install
bun run typecheck
bun test
bun run generate
bun run bundle:full-spec
bun run generate:full
```

### 5. Commit the extracted baseline

```bash
git add .
git commit -m "Initial extracted openapi-effect-spike baseline"
```

## Option B — Preserve history with `git subtree split`

Run these from the current parent repo root.

### 1. Create a history-only branch for the spike folder

```bash
git subtree split --prefix=apps/openapi-effect-spike -b openapi-effect-spike-history
```

### 2. Clone that branch into the new sibling directory

```bash
git clone --branch openapi-effect-spike-history . ../effect-postcodes-openapi-spike
```

### 3. Re-enter the new repo and normalize the branch name

```bash
cd ../effect-postcodes-openapi-spike
git branch -m main
```

### 4. Validate the history-preserved repo

```bash
bun install
bun run typecheck
bun test
bun run generate
bun run bundle:full-spec
bun run generate:full
```

### 5. Add a follow-up commit only if standalone identity changes are needed

Examples:

- package rename
- README rewrite
- repository URL update

## Post-extraction identity pass

After either extraction option, make the new repo read as a standalone project.

### 1. Update package metadata

Recommended edits:

- keep `private: true`
- optionally rename `name` to `effect-postcodes-openapi-spike`
- add a `description`

### 2. Rewrite the README intro

The new README should clearly say:

- this is the OpenAPI/generator assessment repository
- the production handwritten client remains separate
- commands run from this repo root

### 3. Re-run validation after identity edits

```bash
bun run typecheck
bun test
```

## Parent repo cleanup sequence

Only do this after the extracted repo has been validated independently.

### 1. Return to the parent repo

```bash
cd ../effect-postcodes.io
```

### 2. Add a small related-repo note to the parent README

Suggested note:

> Generator-assessment work for `@effect/openapi-generator` against `postcodes.io` now lives in a separate repository.

### 3. Remove the nested spike folder

```bash
rm -rf apps/openapi-effect-spike
```

### 4. Re-validate the parent repo

```bash
bun run typecheck
bun run test
bun run check
```

### 5. Commit the cleanup as a dedicated change

```bash
git add README.md apps
git commit -m "Remove extracted openapi-effect-spike app"
```

## Smoke-check list

Use this quick pass before you call the cutover done.

### New extracted repo

- [ ] `bun install` passes
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes
- [ ] `bun run generate` passes
- [ ] `bun run bundle:full-spec` passes
- [ ] `bun run generate:full` passes
- [ ] README reads like a standalone repository
- [ ] no imports point back into `effect-postcodes.io`

### Parent repo after cleanup

- [ ] root README points to the extracted repo
- [ ] `apps/openapi-effect-spike/` is gone
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] `bun run check` passes
- [ ] no stale references to spike-only files remain

## Watchpoints

### Lockfile expectations

The extracted repo already has its own `bun.lock`. Keep that lockfile in the new repo root.

### Generated artifact churn

The new repo contains generated code under `gen/generated/`. Large diffs are expected there.

### Full-spec generation behavior

The current working flow is:

1. pull full upstream files
2. bundle into one file
3. generate from the bundled file

Do not skip the bundling step if you want the usable full artifact.

### Rate limiter dependency

`makeApiService` requires a `RateLimiter.RateLimiter` service in scope —
provide `RateLimiterLive` from `gen/client/RateLimiting.ts` alongside
`FetchHttpClient.layer` wherever `makeApiService` is called (see
`test/contract.test.ts` and `gen/programs/*.ts` for the pattern). A freshly
extracted or cloned copy that runs the example programs or contract test
without this layer provided will fail to compile (`Type 'RateLimiter' is
not assignable to type 'never'`), not just fail at runtime.

### Parent-repo focus

After cleanup, the parent repo should remain the handwritten production client only. Do not migrate spike-only generator scripts or docs back into root-level parent workflows.

## Shortest safe path

If you want the pragmatic route, use this order:

1. copy with `rsync`
2. `git init` in the new repo
3. run install and validation there
4. rewrite package/README identity
5. add related-repo note in parent README
6. delete `apps/openapi-effect-spike/`
7. validate the parent repo

That is the lowest-drama path — fewer moving parts, fewer opportunities for git to become a performance art piece.
