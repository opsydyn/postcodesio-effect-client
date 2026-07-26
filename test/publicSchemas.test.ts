import { describe, expect, test } from "bun:test";

import { Schema } from "effect";

import {
	BulkLookupItem,
	NearestPostcode,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
	ScottishPostcode,
	TerminatedPostcode,
} from "../src/index.ts";
import {
	nearestPostcodesResponse,
	outcodeResponse,
	placeResponse,
	productionBulkLookupPostcodesResponse,
	productionPostcodeResult,
	scottishPostcodeDirectoryResponse,
	terminatedPostcodeResponse,
} from "./helpers/fixtures.ts";

describe("public result schemas", () => {
	test("decode representative unwrapped production method results", () => {
		expect(Schema.decodeUnknownSync(PostcodeResult)(productionPostcodeResult).incode).toBe("1AA");
		expect(
			Schema.decodeUnknownSync(BulkLookupItem)(productionBulkLookupPostcodesResponse.result[0])
				.query,
		).toBe("SW1A1AA");
		expect(
			Schema.decodeUnknownSync(NearestPostcode)(nearestPostcodesResponse.result[0]).distance,
		).toBe(0);
		expect(
			Schema.decodeUnknownSync(TerminatedPostcode)(terminatedPostcodeResponse.result).postcode,
		).toBe("BS40 5AF");
		expect(
			Schema.decodeUnknownSync(ScottishPostcode)(scottishPostcodeDirectoryResponse.result).postcode,
		).toBe("EH25 9NJ");
		expect(Schema.decodeUnknownSync(OutcodeResult)(outcodeResponse.result).outcode).toBe("SW1A");
		expect(Schema.decodeUnknownSync(PlaceResult)(placeResponse.result).code).toBe(
			"osgb4000000074564391",
		);
	});
});
