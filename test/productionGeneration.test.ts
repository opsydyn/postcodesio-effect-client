import { expect, test } from "bun:test";

import * as Production from "../generated/PostcodesProduction.ts";

const operations = [
	"LookupPostcode",
	"PostcodeLookup",
	"BulkPostcodeLookup",
	"NearestPostcode",
	"randomPostcode",
	"LookupTerminatedPostcode",
	"getScottishPostcode",
	"FindOutcode",
	"PlaceQuery",
	"FindPlace",
	"randomPlace",
] as const satisfies ReadonlyArray<keyof Production.PostcodesProduction>;

test("production transport exposes every supported upstream operation", () => {
	expect(operations).toHaveLength(11);
	expect(Production.make).toBeFunction();
});
