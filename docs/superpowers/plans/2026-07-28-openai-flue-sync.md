# OpenAI Flue Sync Provider Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the scheduled upstream-spec synchronisation agent with `openai/gpt-5.5` and the GitHub `OPENAI_API_KEY` secret instead of Anthropic.

**Architecture:** Preserve the existing Flue harness, bounded tools, sandbox, sync classifier, Changeset enforcement, and PR workflow. Change only the agent model specifier and the GitHub Actions provider credential. A local Bun test inspects these checked-in configuration boundaries without invoking a live model.

**Tech Stack:** Bun, `bun:test`, Flue `@flue/runtime` 1.0.0-beta.9, GitHub Actions, OpenAI direct provider.

## Global Constraints

- Use the explicit model specifier `openai/gpt-5.5`.
- The scheduled workflow receives `OPENAI_API_KEY` only through `${{ secrets.OPENAI_API_KEY }}`.
- Do not commit an OpenAI API key or invoke OpenAI from the normal local test suite.
- Remove the active `ANTHROPIC_API_KEY` workflow reference; do not delete the repository secret until a manual OpenAI-backed workflow run succeeds.
- Do not alter the agent instructions, tool list, sandbox, release-classification policy, or generated artefacts.
- The acceptance run must use GitHub Actions `workflow_dispatch` after an administrator configures the secret.

---

### Task 1: Switch the sync harness to the OpenAI provider

**Files:**

- Create: `test/flueOpenAiSync.test.ts`
- Modify: `.flue/agents/spec-sync.ts`
- Modify: `.github/workflows/sync-upstream.yml`
- Modify: `package.json`

**Interfaces:**

- Consumes: `.flue/agents/spec-sync.ts` as the source of Flue model selection and `.github/workflows/sync-upstream.yml` as the only scheduled sync credential boundary.
- Produces: a keyless local regression test that proves the agent uses `openai/gpt-5.5`, the workflow exposes `OPENAI_API_KEY`, and no active Anthropic key reference remains.

- [ ] **Step 1: Write the failing configuration-boundary test**

Create `test/flueOpenAiSync.test.ts`:

```ts
import { expect, test } from "bun:test";

const readRepoFile = (path: string) => Bun.file(new URL(`../${path}`, import.meta.url)).text();

test("runs upstream sync through OpenAI with no Anthropic credential", async () => {
	const [agent, workflow] = await Promise.all([
		readRepoFile(".flue/agents/spec-sync.ts"),
		readRepoFile(".github/workflows/sync-upstream.yml"),
	]);

	expect(agent).toContain('model: "openai/gpt-5.5"');
	expect(agent).not.toContain("anthropic/");
	expect(workflow).toContain("OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}");
	expect(workflow).not.toContain("ANTHROPIC_API_KEY");
});
```

- [ ] **Step 2: Run the focused test and confirm the provider mismatch**

Run: `bun test test/flueOpenAiSync.test.ts`

Expected: FAIL because the agent still contains `anthropic/claude-sonnet-4-6` and the workflow still contains `ANTHROPIC_API_KEY`.

- [ ] **Step 3: Select the direct OpenAI model in the agent**

In `.flue/agents/spec-sync.ts`, replace the model declaration exactly:

```ts
model: "openai/gpt-5.5",
```

Leave the instructions, four tools, and `sandbox: local()` unchanged.

- [ ] **Step 4: Replace the workflow credential boundary**

In `.github/workflows/sync-upstream.yml`, replace the provider environment mapping with:

```yaml
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Do not add a fallback credential or a literal key.

- [ ] **Step 5: Add the focused test to the standard local suite**

Append `test/flueOpenAiSync.test.ts` to the explicit `bun test` command in `package.json` so CI and normal `bun run check` runs preserve the provider boundary.

- [ ] **Step 6: Run focused and local verification**

Run:

```bash
bun test test/flueOpenAiSync.test.ts
bun run check
bun run lint:code
bun run fmt:check
bunx --no-install flue build --target node --output /tmp/effect-postcodes-flue-openai-build
```

Expected: the focused test and the full local suite pass; Flue builds successfully; no command requires an API key or calls OpenAI.

- [ ] **Step 7: Commit the migration**

```bash
git add .flue/agents/spec-sync.ts .github/workflows/sync-upstream.yml package.json test/flueOpenAiSync.test.ts
git commit -m "feat: run Flue spec sync with OpenAI"
```

### Task 2: Prove the GitHub credential cutover

**Files:**

- Modify: no repository files expected

**Interfaces:**

- Consumes: Task 1 on `main` and the GitHub Actions manual-dispatch trigger.
- Produces: an observed OpenAI-backed sync run, or a concrete GitHub secret/configuration failure for correction.

- [ ] **Step 1: Configure the repository secret**

In the GitHub repository settings, create or update the Actions secret named `OPENAI_API_KEY` with an API key authorised to use `gpt-5.5`. Do not expose the value in workflow logs, pull-request text, or repository files.

- [ ] **Step 2: Dispatch the sync workflow manually**

Open the `Sync upstream spec` GitHub Actions workflow and select **Run workflow** on `main`. This invokes the existing `workflow_dispatch` trigger.

- [ ] **Step 3: Inspect the completed workflow result**

Expected outcomes are exactly one of:

```text
No upstream changes detected. Nothing to do.
```

or a new `spec-sync/<timestamp>` branch with a reviewable pull request. The pull request must contain only the allowed generated/full-spec paths and an optional Changeset whose existence matches the classifier output.

Any authentication, model-not-found, provider, or tool-call error is a failed acceptance result and must be retained as evidence before changing code.

- [ ] **Step 4: Retire the Anthropic secret after success**

Only after Step 3 succeeds, remove `ANTHROPIC_API_KEY` from GitHub repository Actions secrets. This is an external administration action; it is intentionally not automated by repository code.

- [ ] **Step 5: Record the acceptance evidence in the handoff**

Report the GitHub Actions run URL, conclusion, whether an upstream PR was created, and confirmation that no Anthropic workflow credential remains.
