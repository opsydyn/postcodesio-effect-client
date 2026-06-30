# gen/ -> generated/ + src/ reorg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `gen/` into a top-level `generated/` (true machine output only) and `src/` (all hand-written application code: `client/`, `programs/`, `server/`), so the repo root answers "is this generated?" without opening a folder.

**Architecture:** Pure file move (`git mv`) plus mechanical import-path and config-path updates. No logic changes, no behavior changes.

**Tech Stack:** Bun, TypeScript, Biome.

## Global Constraints

- Pure move only — no edits to the logic inside any moved file, only import paths.
- `openapi/`, `scripts/`, `test/` directories themselves stay in place (only the imports inside `test/*.ts` that point into the moved trees change).
- `ASSESSMENT.md`, `CUTOVER_RUNBOOK.md`, `EXTRACTION_PLAN.md`, `REPO_ROOT_RENAME_PLAN.md`, and the two existing `docs/superpowers/{specs,plans}/2026-06-30-effect-beta92-*` files are historical record and are NOT edited.
- `README.md` and `AGENTS.md` ARE updated — both are living docs that would actively mislead if left stale.

This is one atomic task: nothing typechecks or runs correctly mid-move (e.g. `src/client/ApiService.ts` imports from `generated/` which doesn't exist at its new path until the move completes), so it's structured as one task with many small steps rather than several independently-testable tasks.

---

### Task 1: Move `gen/` into `generated/` + `src/`, fix every reference

**Files:**
- Move: `gen/generated/PostcodesSpike.ts` → `generated/PostcodesSpike.ts`
- Move: `gen/generated/PostcodesFull.ts` → `generated/PostcodesFull.ts`
- Move: `gen/client/ApiConfig.ts` → `src/client/ApiConfig.ts`
- Move: `gen/client/ApiService.ts` → `src/client/ApiService.ts`
- Move: `gen/client/Errors.ts` → `src/client/Errors.ts`
- Move: `gen/client/RateLimiting.ts` → `src/client/RateLimiting.ts`
- Move: `gen/programs/getThing.ts` → `src/programs/getThing.ts`
- Move: `gen/programs/createThing.ts` → `src/programs/createThing.ts`
- Move: `gen/programs/failureThing.ts` → `src/programs/failureThing.ts`
- Move: `gen/programs/fullClient.ts` → `src/programs/fullClient.ts`
- Move: `gen/server/Api.ts` → `src/server/Api.ts`
- Move: `gen/server/handlers.ts` → `src/server/handlers.ts`
- Move: `gen/server/serve.ts` → `src/server/serve.ts`
- Modify: `package.json`, `biome.json`, `tsconfig.json`
- Modify: `src/client/ApiService.ts`, `src/client/Errors.ts`, `src/programs/fullClient.ts`, `src/server/Api.ts` (import paths only)
- Modify: `test/helpers/fixtures.ts`, `test/rateLimiting.test.ts`, `test/contract.test.ts`, `test/fullClient.elysia.test.ts`
- Modify: `README.md`, `AGENTS.md`

- [ ] **Step 1: Move the directories with git mv**

```bash
git mv gen/generated generated
git mv gen/client src/client
git mv gen/programs src/programs
git mv gen/server src/server
rmdir gen 2>/dev/null || true
```

- [ ] **Step 2: Fix the four cross-tree imports that now need an extra `../`**

In `src/client/ApiService.ts`, change:
```ts
import * as Generated from "../generated/PostcodesSpike.ts";
```
to:
```ts
import * as Generated from "../../generated/PostcodesSpike.ts";
```

In `src/client/Errors.ts`, change:
```ts
import type * as Generated from "../generated/PostcodesSpike.ts";
```
to:
```ts
import type * as Generated from "../../generated/PostcodesSpike.ts";
```

In `src/programs/fullClient.ts`, change:
```ts
import * as PostcodesFull from "../generated/PostcodesFull.ts";
```
to:
```ts
import * as PostcodesFull from "../../generated/PostcodesFull.ts";
```

In `src/server/Api.ts`, change:
```ts
import {
	BulkLookupItem,
	BulkLookupRequest,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
```
to:
```ts
import {
	BulkLookupItem,
	BulkLookupRequest,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../../generated/PostcodesSpike.ts";
```

All other imports inside the moved trees (`src/programs/*.ts` → `../client/...`, `src/server/handlers.ts` → `../client/...`, `src/server/serve.ts` → `./Api.ts`/`./handlers.ts`) are unchanged — those pairs are still siblings at the same relative depth.

- [ ] **Step 3: Update `package.json` script paths**

Change:
```json
		"generate": "openapigen --spec openapi/spec.yaml --name PostcodesSpike --format httpclient > gen/generated/PostcodesSpike.ts",
		"pull:full-spec": "bun run scripts/pullFullSpec.ts",
		"bundle:full-spec": "bun run pull:full-spec && bun run scripts/bundleFullSpec.ts",
		"generate:full": "bun run bundle:full-spec && openapigen --spec openapi/full-upstream/openapi.bundle.yaml --name PostcodesFull --format httpclient > gen/generated/PostcodesFull.ts",
		"typecheck": "tsc --noEmit",
		"test": "bun test",
		"check": "bun run typecheck && bun test",
		"example:get": "bun run gen/programs/getThing.ts",
		"example:create": "bun run gen/programs/createThing.ts",
		"example:fail": "bun run gen/programs/failureThing.ts",
		"example:full": "bun run gen/programs/fullClient.ts",
		"docs:serve": "bun run gen/server/serve.ts"
```
to:
```json
		"generate": "openapigen --spec openapi/spec.yaml --name PostcodesSpike --format httpclient > generated/PostcodesSpike.ts",
		"pull:full-spec": "bun run scripts/pullFullSpec.ts",
		"bundle:full-spec": "bun run pull:full-spec && bun run scripts/bundleFullSpec.ts",
		"generate:full": "bun run bundle:full-spec && openapigen --spec openapi/full-upstream/openapi.bundle.yaml --name PostcodesFull --format httpclient > generated/PostcodesFull.ts",
		"typecheck": "tsc --noEmit",
		"test": "bun test",
		"check": "bun run typecheck && bun test",
		"example:get": "bun run src/programs/getThing.ts",
		"example:create": "bun run src/programs/createThing.ts",
		"example:fail": "bun run src/programs/failureThing.ts",
		"example:full": "bun run src/programs/fullClient.ts",
		"docs:serve": "bun run src/server/serve.ts"
```

- [ ] **Step 4: Update `biome.json` path patterns**

Change:
```json
		{
			"includes": ["gen/generated/**"],
			"linter": { "enabled": false },
			"formatter": { "enabled": false }
		},
		{
			"includes": ["**", "!gen/programs/**", "!test/helpers/**"],
```
to:
```json
		{
			"includes": ["generated/**"],
			"linter": { "enabled": false },
			"formatter": { "enabled": false }
		},
		{
			"includes": ["**", "!src/programs/**", "!test/helpers/**"],
```

- [ ] **Step 5: Update `tsconfig.json` include glob**

Change:
```json
	"include": ["gen/**/*.ts", "scripts/**/*.ts", "test/**/*.ts"]
```
to:
```json
	"include": ["generated/**/*.ts", "src/**/*.ts", "scripts/**/*.ts", "test/**/*.ts"]
```

- [ ] **Step 6: Update test imports**

In `test/helpers/fixtures.ts`, change:
```ts
import type * as PostcodesFull from "../../gen/generated/PostcodesFull.ts";
import type * as PostcodesSpike from "../../gen/generated/PostcodesSpike.ts";
```
to:
```ts
import type * as PostcodesFull from "../../generated/PostcodesFull.ts";
import type * as PostcodesSpike from "../../generated/PostcodesSpike.ts";
```

In `test/rateLimiting.test.ts`, change:
```ts
import { RateLimiterLive } from "../gen/client/RateLimiting.ts";
```
to:
```ts
import { RateLimiterLive } from "../src/client/RateLimiting.ts";
```

In `test/contract.test.ts`, change:
```ts
import { makeApiConfig } from "../gen/client/ApiConfig.ts";
import { makeApiService } from "../gen/client/ApiService.ts";
import { isApiNotFoundError } from "../gen/client/Errors.ts";
import { RateLimiterLive } from "../gen/client/RateLimiting.ts";
```
to:
```ts
import { makeApiConfig } from "../src/client/ApiConfig.ts";
import { makeApiService } from "../src/client/ApiService.ts";
import { isApiNotFoundError } from "../src/client/Errors.ts";
import { RateLimiterLive } from "../src/client/RateLimiting.ts";
```

In `test/fullClient.elysia.test.ts`, change:
```ts
import { makeApiConfig } from "../gen/client/ApiConfig.ts";
import * as PostcodesFull from "../gen/generated/PostcodesFull.ts";
```
to:
```ts
import { makeApiConfig } from "../src/client/ApiConfig.ts";
import * as PostcodesFull from "../generated/PostcodesFull.ts";
```

- [ ] **Step 7: Update `README.md`**

Replace every `gen/generated/` reference with `generated/`, every `gen/client/` reference with `src/client/`, every `gen/programs/` reference with `src/programs/`, every `gen/server/` reference with `src/server/`. This touches the "Project layout" list, the "Where `@effect/openapi-generator` is actually used" section, the "Full upstream workflow" section, the "Rate limiting" section, and the "Native OpenAPI docs" section. Also update the Project layout list to show `generated/` and `src/` as their own top-level bullets instead of one `gen/` tree:

```markdown
## Project layout

- `openapi/` — narrowed spec plus vendored full upstream spec inputs
- `scripts/` — fetch and bundle helpers for the full upstream workflow
- `generated/` — raw generated client artifacts (the only machine-generated tree)
- `src/client/` — handwritten wrapper layer over generated code
- `src/programs/` — runnable examples and tiny smoke programs
- `src/server/` — native `HttpApi` definition + server, generating OpenAPI
  docs from code instead of consuming an upstream spec
- `test/` — Elysia-backed contract tests and local helpers
```

- [ ] **Step 8: Update `AGENTS.md`**

Replace every `gen/generated/` reference with `generated/`, every `gen/client/` reference with `src/client/`, every `gen/programs/` reference with `src/programs/` in the project layout list (lines 25-27), the "Generated code is replaceable" / "wrapper layer" guidance (lines 43, 45), and the workflow steps (lines 59, 61).

- [ ] **Step 9: Typecheck**

Run: `bun run typecheck`
Expected: no output (clean, exit code 0).

- [ ] **Step 10: Run the test suite**

Run: `bun test test/contract.test.ts test/fullClient.elysia.test.ts test/rateLimiting.test.ts`
Expected: `4 pass`, `0 fail`.

- [ ] **Step 11: Regenerate both clients to confirm the generator output paths work**

Run: `bun run generate`
Expected: writes `generated/PostcodesSpike.ts`, no errors.

Run: `bun run generate:full`
Expected: writes `generated/PostcodesFull.ts`, no errors. (This also re-pulls and re-bundles the upstream spec — check `git status` after for unrelated upstream-drift noise the same way earlier in this session, and revert `openapi/full-upstream/*` if it's just live spec drift unrelated to this reorg.)

Run: `bun run typecheck` and the test suite again after regenerating, to confirm no drift broke anything:
Expected: clean typecheck, `4 pass`, `0 fail`.

- [ ] **Step 12: Smoke-test the moved server**

```bash
nohup bun run docs:serve > /tmp/server-reorg.log 2>&1 &
disown
sleep 2
curl -s -o /dev/null -w "openapi.json: %{http_code}\n" http://localhost:3000/openapi.json
curl -s -o /dev/null -w "200 lookup: %{http_code}\n" http://localhost:3000/postcodes/SW1A1AA
curl -s -o /dev/null -w "404 lookup: %{http_code}\n" http://localhost:3000/postcodes/ZZ99ZZ
kill $(lsof -ti:3000) 2>/dev/null
```
Expected: `openapi.json: 200`, `200 lookup: 200`, `404 lookup: 404`.

- [ ] **Step 13: Biome check**

Run: `bunx biome check .`
Expected: same as before the move — `Found 1 info` only (the pre-existing, accepted `no-return-in-arrow` note on `test/rateLimiting.test.ts`), no new errors.

- [ ] **Step 14: Commit**

```bash
git add -A
git status --short
```
Confirm the status shows only the expected renames (`R` for moved files) plus modifications to `package.json`, `biome.json`, `tsconfig.json`, the four `src/*` files with fixed cross-imports, the four `test/*.ts` files, `README.md`, `AGENTS.md` — and, separately, revert any incidental `openapi/full-upstream/*` upstream-drift changes from Step 11 if present, same as earlier in this session.

```bash
git commit -m "$(cat <<'EOF'
refactor: split gen/ into generated/ (machine output) and src/ (hand-written code)

gen/ implied the whole tree was generator output when only one of its
four subfolders actually was. generated/ is now a standalone top-level
directory containing only true @effect/openapi-generator output;
src/client, src/programs, and src/server hold everything hand-written.
Pure move - only import paths, script paths, and docs changed.
EOF
)"
```
