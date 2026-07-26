# Full Production Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready `@effect-postcodes/client` covering the full supported postcodes.io API through a stable Effect service.

**Architecture:** Keep the upstream specification immutable, build a deterministic normalised production bundle, generate an internal full transport client, and expose it through `PostcodesClient`. Correct the current four-operation contract before expanding endpoint groups.

**Tech Stack:** Bun, TypeScript, Effect v4 beta, `@effect/openapi-generator`, Elysia, YAML, Oxlint, Oxfmt, tsdown, and Changesets.

## Global Constraints

- Raw upstream files in `openapi/full-upstream/` are never manually corrected.
- `openapi/production.bundle.yaml` and `generated/PostcodesProduction.ts` are generated artefacts.
- Consumers import only from `src/index.ts`.
- The public methods are `lookupPostcode`, `searchPostcodes`, `bulkLookupPostcodes`, `findNearestPostcodes`, `randomPostcode`, `lookupTerminatedPostcode`, `lookupScottishPostcode`, `findOutcode`, `searchPlaces`, `findPlace`, and `randomPlace`.
- Default tests remain local. `bun run test:live` is network-only and opt-in.
- Every public behaviour change starts with a failing `bun:test` test.
- CI, Changesets, and release workflows use `main`.

---

### Task 1: Correct the transitional postcode contract

**Files:**

- Modify: `openapi/spec.yaml`
- Modify: `test/helpers/fixtures.ts`
- Modify: `test/helpers/mockServer.ts`
- Modify: `test/contract.test.ts`
- Regenerate: `generated/PostcodesApi.ts`

**Interfaces:**

- Produces: `PostcodeResult.msoa: string | null` through the existing `lookupPostcode` service.
- Proves: `lookupPostcode("BT1 5GS")` decodes rather than failing with `SchemaError`.

- [ ] **Step 1: Add a Northern Ireland mock fixture**

```ts
export const northernIrishPostcodeResult = {
  ...postcodeResult,
  postcode: "BT1 5GS",
  country: "Northern Ireland",
  region: null,
  msoa: null,
} satisfies PostcodesApi.LookupPostcode200["result"];
```

- [ ] **Step 2: Route `BT15GS` through the Elysia mock and add the public contract test**

```ts
const postcode = yield* lookupPostcode("BT1 5GS");
expect(postcode.country).toBe("Northern Ireland");
expect(postcode.msoa).toBeNull();
```

- [ ] **Step 3: Run `bun test test/contract.test.ts` and observe the expected type failure**

- [ ] **Step 4: Change `PostcodeResult.msoa` to `type: [string, "null"]` in `openapi/spec.yaml`**

- [ ] **Step 5: Run `bun run generate`, `bun test test/contract.test.ts`, and `bun run check`**

- [ ] **Step 6: Commit**

```bash
git add openapi/spec.yaml generated/PostcodesApi.ts test/helpers/fixtures.ts test/helpers/mockServer.ts test/contract.test.ts
git commit -m "fix: decode nullable msoa for Northern Irish postcodes"
```

### Task 2: Add the opt-in live compatibility lane

**Files:**

- Create: `test/liveClient.test.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/src/content/docs/guides/handle-scottish-postcodes.mdx`

**Interfaces:**

- Produces: `bun run test:live`.
- Proves: England `SW1A 1AA`, Scotland `EH25 9NJ`, Wales `CF10 1AA`, and Northern Ireland `BT1 5GS` decode through `PostcodesClient.make()`.

- [ ] **Step 1: Write the failing live test**

```ts
const results = await Effect.runPromise(
  Effect.all([
    client.lookupPostcode("SW1A 1AA"),
    client.lookupPostcode("EH25 9NJ"),
    client.lookupPostcode("CF10 1AA"),
    client.lookupPostcode("BT1 5GS"),
  ]),
);
expect(results.map((result) => result.country)).toEqual([
  "England", "Scotland", "Wales", "Northern Ireland",
]);
```

- [ ] **Step 2: Add `"test:live": "bun test test/liveClient.test.ts"` without changing `bun test`**

- [ ] **Step 3: Run `bun run test:live`, document its network requirement, then run `bun run check`**

- [ ] **Step 4: Commit**

```bash
git add package.json README.md docs/src/content/docs/guides/handle-scottish-postcodes.mdx test/liveClient.test.ts
git commit -m "test: add opt-in UK live compatibility lane"
```

### Task 3: Create a deterministic production-spec normaliser

**Files:**

- Create: `scripts/normalizeProductionSpec.ts`
- Create: `test/normalizeProductionSpec.test.ts`
- Modify: `package.json`
- Generate: `openapi/production.bundle.yaml`

**Interfaces:**

- Produces: `normalizeProductionSpec(document: unknown): Record<string, unknown>` and `bun run normalize:production-spec`.
- Consumes: `openapi/full-upstream/openapi.bundle.yaml`.

- [ ] **Step 1: Write the failing pure-function test**

```ts
const input = structuredClone(fixture);
const output = normalizeProductionSpec(input);
expect(output).not.toBe(input);
expect(input.paths["/postcodes"].post.requestBody).toBeUndefined();
expect(output.paths["/postcodes"].post.requestBody).toEqual({
  required: true,
  content: { "application/json": { schema: { $ref: "#/components/schemas/BulkLookupRequest" } } },
});
```

- [ ] **Step 2: Run `bun test test/normalizeProductionSpec.test.ts` and confirm module-not-found**

- [ ] **Step 3: Implement the pure clone-and-correct function and file-writing entry point**

- [ ] **Step 4: Add `"normalize:production-spec": "bun run scripts/normalizeProductionSpec.ts"`**

- [ ] **Step 5: Run the normaliser twice and verify the second run leaves no diff in `openapi/production.bundle.yaml`**

- [ ] **Step 6: Run the focused test and `bun run check`, then commit**

```bash
git add scripts/normalizeProductionSpec.ts test/normalizeProductionSpec.test.ts package.json openapi/production.bundle.yaml
git commit -m "feat: add production OpenAPI normalisation"
```

### Task 4: Generate the production transport client

**Files:**

- Modify: `package.json`
- Generate: `generated/PostcodesProduction.ts`
- Create: `test/productionGeneration.test.ts`

**Interfaces:**

- Produces: `bun run generate:production` and `PostcodesProduction.make(httpClient)`.

- [ ] **Step 1: Write the failing generated-surface test**

```ts
const operations = [
  "LookupPostcode", "PostcodeLookup", "BulkPostcodeLookup",
  "NearestPostcode", "randomPostcode", "LookupTerminatedPostcode",
  "getScottishPostcode", "FindOutcode", "PlaceQuery", "FindPlace", "randomPlace",
] as const satisfies ReadonlyArray<keyof Production.PostcodesProduction>;
```

- [ ] **Step 2: Run the focused test and confirm the artifact is absent**

- [ ] **Step 3: Add and run the generation command**

```json
"generate:production": "bun run normalize:production-spec && openapigen --spec openapi/production.bundle.yaml --name PostcodesProduction --format httpclient > generated/PostcodesProduction.ts"
```

- [ ] **Step 4: Run the focused test and `bun run check`, then commit**

### Task 5: Expand the public wrapper by endpoint group

**Files:**

- Modify: `src/internal/ApiService.ts`
- Modify: `src/PostcodesClient.ts`
- Modify: `src/Errors.ts`
- Modify: `src/index.ts`
- Modify: `test/helpers/fixtures.ts`
- Modify: `test/helpers/mockServer.ts`
- Create: `test/postcodeOperations.test.ts`
- Create: `test/locationOperations.test.ts`

**Interfaces:**

- Produces all eleven public methods from the global constraints, each returning unwrapped success data and `ApiServiceError`.

- [ ] **Step 1: Add failing contracts for `searchPostcodes`, `bulkLookupPostcodes`, `findNearestPostcodes`, and `randomPostcode`**

- [ ] **Step 2: Implement the postcode group with path encoding and 1–100 bulk validation**

- [ ] **Step 3: Add failing contracts for terminated, Scottish, outcode, and place methods**

- [ ] **Step 4: Implement those methods and update service mocks and public exports**

- [ ] **Step 5: Run `bun run check`, `bun run lint:code`, and `bun run docs:build`**

- [ ] **Step 6: Commit postcode and location groups separately**

### Task 6: Make sync and release automation production-safe

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/sync-upstream.yml`
- Modify: `.changeset/config.json`
- Modify: `.flue/agents/spec-sync.ts`
- Modify: `.flue/tools/index.ts`
- Create: `test/specSyncPolicy.test.ts`

**Interfaces:**

- CI, release, and Changesets target `main`.
- Full-spec-only changes do not create package releases; public-contract changes do.

- [ ] **Step 1: Write a failing classifier test for full-spec-only and public-contract diffs**

- [ ] **Step 2: Implement pure changed-file classification and use it in sync tooling**

- [ ] **Step 3: Switch branch settings to `main`, freeze installs, and call the pinned local Flue script**

- [ ] **Step 4: Add CI checks for deterministic generation, package build/lint, docs, and packed-consumer smoke testing**

- [ ] **Step 5: Run all local automation tests and commit**

### Task 7: Release candidate evidence

**Files:**

- Modify: `README.md`
- Modify: `ASSESSMENT.md`
- Modify: `docs/src/content/docs/index.mdx`
- Create: `.changeset/<generated-name>.md`

- [ ] **Step 1: Run `bun run test:live`**

- [ ] **Step 2: Run generation, typecheck, tests, lint, formatting, build, package lint, TypeDoc, docs build, and a packed-consumer smoke test**

- [ ] **Step 3: Update install and endpoint documentation to the final public API**

- [ ] **Step 4: Add the release Changeset and commit**
