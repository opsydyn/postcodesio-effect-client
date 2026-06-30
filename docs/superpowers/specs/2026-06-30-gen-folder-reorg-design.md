# Design: split `gen/` into `generated/` + `src/`

## Context

`gen/` currently holds both true generator output (`gen/generated/`) and three
hand-written trees (`gen/client/`, `gen/programs/`, `gen/server/`). The shared
`gen` parent name implies the whole tree is machine-generated, which it isn't —
this caused real confusion mid-conversation about whether `gen/server/` (a
hand-written `HttpApi` definition) was itself generated.

## Change

Pure move, no logic changes:

```
gen/generated/  → generated/        (top-level, sibling of src/, test/, openapi/)
gen/client/     → src/client/
gen/programs/   → src/programs/
gen/server/     → src/server/
```

`openapi/`, `scripts/`, `test/` are unchanged.

## Why this split

`generated/` at the repo root means "is this generated?" is answered by the
top-level directory listing alone — no need to look inside a folder to find
out. `src/` is the conventional, unambiguous name for hand-written application
code, grouping the wrapper, examples, and server together since they're all
"things we wrote that consume the generated client."

## What needs updating

**Cross-imports inside the moved trees** (relative paths change where files
cross from `src/*` back to `generated/`, since that's now one level further
up):

- `src/client/ApiService.ts`: `../generated/PostcodesSpike.ts` → `../../generated/PostcodesSpike.ts`
- `src/client/Errors.ts`: `../generated/PostcodesSpike.ts` → `../../generated/PostcodesSpike.ts`
- `src/programs/fullClient.ts`: `../generated/PostcodesFull.ts` → `../../generated/PostcodesFull.ts`
- `src/server/Api.ts`: `../generated/PostcodesSpike.ts` → `../../generated/PostcodesSpike.ts`

Everything else inside `src/*` (programs → client, server → client, server
internal) stays relatively the same depth, no path changes needed there.

**External references:**

- `package.json`: `generate`/`generate:full` output paths, `example:*`/`docs:serve` script paths
- `biome.json`: the `gen/generated/**` override, the `!gen/programs/**` negation
- `tsconfig.json`: `include` glob
- `test/helpers/fixtures.ts`, `test/rateLimiting.test.ts`, `test/contract.test.ts`, `test/fullClient.elysia.test.ts`: import paths into the moved trees
- `README.md`: project layout section, all path references (explicitly requested)
- `AGENTS.md`: project layout + workflow instructions reference `gen/client/`,
  `gen/generated/`, `gen/programs/` directly — left stale these would actively
  mislead future work in this repo, so included even though not explicitly
  named

## Explicitly out of scope

- `ASSESSMENT.md` and `CUTOVER_RUNBOOK.md` contain dated, point-in-time
  "Update: <date>" notes written before this reorg — those are historical
  record, not living documentation, and won't be rewritten.
- `EXTRACTION_PLAN.md` and `REPO_ROOT_RENAME_PLAN.md` describe a
  pre-extraction repo state from before this repo existed standalone —
  historical, not touched.
- `docs/superpowers/specs/2026-06-30-effect-beta92-client-enhancements-design.md`
  and the matching plan doc — historical record of work already completed
  under the old paths, not touched.

## Verification

After the move: `bun run typecheck`, full test suite, regenerate both clients
(`bun run generate`, `bun run generate:full`) to confirm the generator output
paths still work, and a live `bun run docs:serve` smoke test (same checks used
earlier in this session) to confirm the server still serves correctly from
its new location.
