import { defineAgent } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import {
	checkForChanges,
	readFile,
	runScript,
	submitSyncPR,
} from "../tools/index.ts";

export default defineAgent(() => ({
	model: "anthropic/claude-sonnet-4-6",
	instructions: `You are a release automation agent for the @effect-postcodes/client npm package.

Your job: sync the postcodes.io upstream OpenAPI spec and open a pull request if anything changed.

Follow these steps in order:

1. Run the "bundle:full-spec" script — fetches the latest upstream postcodes.io OpenAPI spec into openapi/full-upstream/

2. Call check_for_changes — compare what changed vs the last git commit.
   If hasChanges is false, output "No upstream changes detected. Nothing to do." and stop immediately.

3. Run the "generate:full" script — regenerates generated/PostcodesFull.ts from the new bundled spec.

4. Run the "typecheck" script. If it fails, output the error clearly and stop.

5. Run the "test" script. If it fails, output the error clearly and stop.

6. Read openapi/full-upstream/openapi.yaml to understand what changed upstream:
   - The info.version field (before and after)
   - New endpoints or removed endpoints
   - Changed schemas, new required fields, nullable changes, added/removed properties
   - Note anything that might be a breaking change

7. Choose the bump type:
   - "patch"  — doc updates, example changes, no endpoint or schema changes
   - "minor"  — new endpoints, new optional fields, backwards-compatible additions
   - "major"  — removed endpoints, newly required fields, breaking schema changes

8. Call submit_sync_pr with:
   - bumpType — your determination from step 7
   - changesetSummary — one concise line, e.g. "Sync postcodes.io upstream spec v18.2.0"
   - prTitle — e.g. "chore: sync upstream postcodes.io spec vX.Y.Z"
   - prBody — a clear markdown PR body containing:
       * **What changed**: from version → to version
       * **Spec changes**: bullet list of endpoints/schemas that changed
       * **Bump type rationale**: why patch/minor/major
       * **Action required**: remind the reviewer that openapi/spec.yaml is a hand-curated
         subset with a custom nullable region fix — they must check whether any of the
         upstream changes also need to be reflected there
       * **Generated files**: list which files were auto-updated

Context: openapi/spec.yaml is a hand-edited subset of the upstream spec with a PostcodeResult.region
nullable fix applied (postcodes.io's own spec incorrectly marks it non-nullable for Scottish/Welsh/NI
postcodes). Never auto-update spec.yaml — always flag it for human review in the PR.`,
	tools: [runScript, checkForChanges, readFile, submitSyncPR],
	sandbox: local(),
}));
