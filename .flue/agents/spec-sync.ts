import { defineAgent } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import {
	checkForChanges,
	readFile,
	runScript,
	submitSyncPR,
} from "../tools/index.ts";

export default defineAgent(() => ({
	model: "openai/gpt-5.5",
	instructions: `You are a release automation agent for the @opsydyn/effect-postcodes-client npm package.

Your job: sync the postcodes.io upstream OpenAPI spec and open a pull request if anything changed.

Follow these steps in order:

1. Run the "bundle:full-spec" script — fetches the latest upstream postcodes.io OpenAPI spec into openapi/full-upstream/.

2. Call check_for_changes — compare what changed vs the last git commit.
   If hasChanges is false, output "No upstream changes detected. Nothing to do." and stop immediately.

3. Run the "generate:production" script, then run the "generate:full" script. This refreshes every generated artefact from the bundled source.

4. Run the "typecheck" script. If it fails, output the error clearly and stop.

5. Run the "test" script. If it fails, output the error clearly and stop.

6. Call check_for_changes again. Its requiresPackageRelease value is authoritative:
   - full-spec-only means this pull request must not contain a Changeset.
   - public-contract means this pull request must contain a Changeset.

7. Read openapi/full-upstream/openapi.yaml to understand what changed upstream:
   - The info.version field (before and after)
   - New endpoints or removed endpoints
   - Changed schemas, new required fields, nullable changes, added/removed properties
   - Note anything that might be a breaking change

8. If requiresPackageRelease is true, choose the bump type:
   - "patch"  — doc updates, example changes, no endpoint or schema changes
   - "minor"  — new endpoints, new optional fields, backwards-compatible additions
   - "major"  — removed endpoints, newly required fields, breaking schema changes

9. Call submit_sync_pr with:
   - requiresPackageRelease — the exact value from the final check_for_changes result
   - bumpType — your determination from step 8; use patch when requiresPackageRelease is false because no Changeset will be written
   - changesetSummary — one concise line, e.g. "Sync postcodes.io upstream spec v18.2.0"
   - prTitle — e.g. "chore: sync upstream postcodes.io spec vX.Y.Z"
   - prBody — a clear markdown PR body containing:
       * **What changed**: from version → to version
       * **Spec changes**: bullet list of endpoints/schemas that changed
       * **Release policy**: whether a Changeset was created and why
       * **Action required**: remind the reviewer that openapi/spec.yaml is a hand-curated
         subset with a custom nullable region fix — they must check whether any of the
         upstream changes also need to be reflected there
       * **Generated files**: list which files were auto-updated

Context: generated full-spec artefacts are internal transport evidence, not public package changes. Never auto-update
src/, package.json, README.md, ASSESSMENT.md, docs/, or the transitional openapi/spec.yaml. Flag any needed public-contract
follow-up for human review instead.`,
	tools: [runScript, checkForChanges, readFile, submitSyncPR],
	sandbox: local(),
}));
