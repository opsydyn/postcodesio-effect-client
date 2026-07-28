# OpenAI Flue Sync Provider Migration

## Status

Approved design. Implementation remains approval-gated by the accompanying
plan.

## Context

The scheduled upstream OpenAPI synchronisation runs a Flue agent in GitHub
Actions. It currently selects `anthropic/claude-sonnet-4-6` and receives
`ANTHROPIC_API_KEY`. Flue's installed runtime supports direct OpenAI model
specifiers and uses `OPENAI_API_KEY` for that provider.

The agent already has tightly scoped tools for script execution, change
classification, file inspection, and PR submission. Its policy determines
whether a Changeset is required independently of the model provider. The
migration must preserve those boundaries.

## Decision

Use the direct OpenAI provider with the explicit model specifier
`openai/gpt-5.5`.

The GitHub Actions sync workflow will provide `OPENAI_API_KEY` from a
repository secret. It will no longer provide `ANTHROPIC_API_KEY`.

No model fallback, provider abstraction, or custom provider registration will
be added. The Flue runtime's built-in `openai` provider is the only provider
used by this agent.

## Architecture

```text
GitHub schedule or manual dispatch
  -> sync-upstream workflow
     -> OPENAI_API_KEY secret
     -> Flue sync-upstream workflow
        -> spec-sync agent (openai/gpt-5.5)
           -> existing bounded tools
              -> generated artefacts and optional Changeset
              -> Git branch and pull request
```

Only the provider-selection and credential edge changes. The agent
instructions, local sandbox, allowed tools, deterministic generators,
classifier, Changeset enforcement, and PR creation remain unchanged.

## Implementation Requirements

1. Change the agent model in `.flue/agents/spec-sync.ts` to
   `openai/gpt-5.5`.
2. Change `.github/workflows/sync-upstream.yml` to pass
   `${{ secrets.OPENAI_API_KEY }}` as `OPENAI_API_KEY` and remove the
   Anthropic variable.
3. Add focused regression coverage that proves the checked-in Flue agent uses
   the chosen model and CI provides only the matching secret name.
4. Keep the normal local suite keyless and deterministic. It must inspect
   configuration only; it must not invoke OpenAI.
5. Retain a manual `workflow_dispatch` acceptance gate. After merging, a
   repository administrator adds `OPENAI_API_KEY`, dispatches the workflow,
   and verifies the run either reports no upstream changes or creates the
   expected reviewable sync PR.
6. Retire `ANTHROPIC_API_KEY` from repository secrets only after the manual
   OpenAI-backed run succeeds.

## Acceptance Criteria

- The agent model is exactly `openai/gpt-5.5`.
- No active sync workflow reference to `ANTHROPIC_API_KEY` remains.
- `OPENAI_API_KEY` is never committed; only its GitHub secret reference is
  present.
- Configuration tests fail if the model or secret wiring regresses.
- `bun run check`, `bun run lint:code`, and `bun run fmt:check` pass.
- `bunx --no-install flue build --target node --output <temporary-directory>`
  succeeds.
- A manually dispatched GitHub workflow completes successfully after secret
  configuration.

## Non-goals

- Changing the model's instructions, tool permissions, sandbox mode, or
  release-classification policy.
- Adding provider fallback or routing.
- Sending live OpenAI requests from the local test suite.
- Removing the Anthropic repository secret before the OpenAI acceptance run.
