# Repo root rename plan for the extracted spike

## Goal

After extraction, make the new repository read like a first-class standalone project instead of a copied nested app folder.

This plan focuses on:

- repository naming
- package metadata
- README positioning
- command presentation
- path and wording cleanups

It does **not** cover the file-copy extraction itself. That is already documented in `EXTRACTION_PLAN.md`.

## Naming recommendation

Recommended repository name:

- `effect-postcodes-openapi-spike`

Why this is the best default:

- keeps the `effect-postcodes` association visible
- makes the OpenAPI/generator focus explicit
- preserves the fact that this is a spike, not a production client package

Acceptable alternatives:

- `postcodes-openapi-effect-spike`
- `effect-openapi-postcodes-spike`

## Package metadata changes

Current package identity:

- name: `openapi-effect-spike`
- version: `0.0.0`
- private: `true`

Recommended post-extraction root metadata:

- keep `private: true`
- optionally rename package to `effect-postcodes-openapi-spike`
- keep version at `0.0.0` unless publishing is intended
- add a short `description` that states the repo is an assessment/experimentation project

Suggested `description`:

> Assessment and experimentation repo for `@effect/openapi-generator` against `postcodes.io`, including narrowed and full-spec generation, wrapper experiments, and local contract testing.

## README rewrite goals

The extracted repo README should answer these questions immediately:

1. What is this repo?
2. Why does it exist separately from `effect-postcodes.io`?
3. What can I run here?
4. What worked, what failed, and what remains experimental?

Recommended top-of-file framing:

- this is an assessment repo, not the production library
- the production library remains handwritten
- this repo captures generator experiments and supporting tooling

## README outline recommendation

Suggested standalone README structure:

```text
# effect-postcodes-openapi-spike

## What this repo is
## Why it exists separately
## Project layout
## Narrowed-spec workflow
## Full upstream workflow
## Testing
## Live API notes
## Findings summary
## Commands
## Related repos
```

## Specific wording changes after extraction

Once extracted, remove wording that implies nesting under another repo.

Examples of wording to rewrite:

- "spike app"
- "nested inside `effect-postcodes.io`"
- "the parent repo"

Replace with explicit standalone phrasing such as:

- "this repository"
- "the production handwritten client lives in a separate repository"
- "the extracted spike repository"

## Command presentation

Keep the repo-root command story simple and copyable.

Recommended default commands section:

```bash
bun install
bun run typecheck
bun test
bun run generate
bun run bundle:full-spec
bun run generate:full
bun run example:full
```

Optional future additions:

- `bun run test:live`
- `bun run check:full`

## Directory descriptions to add to README

Document these directories explicitly:

- `gen/generated/` — generator output
- `gen/client/` — handwritten wrapper experiments
- `gen/programs/` — runnable examples
- `openapi/` — narrowed and vendored full upstream specs
- `scripts/` — fetch/bundle helpers
- `test/` — contract tests and spike-local Elysia mock helpers

## Related-repo note

Once extraction is complete, add a short related-repo note like:

- production handwritten client repository: `effect-postcodes.io`
- this repository: generator assessment and experimentation

## Acceptance criteria for the rename pass

The rename/root pass is complete when:

- the repository name is chosen
- `package.json` metadata reflects the standalone identity
- `README.md` no longer reads like a nested app folder
- commands in the README work from repo root
- repo purpose is obvious within the first screenful of the README

## Recommended execution order

1. Choose final repository name
2. Update `package.json` name/description if desired
3. Rewrite the README intro and layout sections
4. Add a short related-repo note
5. Re-run `bun run typecheck` and `bun test`
