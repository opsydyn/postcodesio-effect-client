import { describe, test } from "bun:test";

import { Schema } from "effect";
import { FastCheck } from "effect/testing";

import { BulkLookupItem, ErrorEnvelope, PostcodeResult } from "../src/index.ts";

describe("schema properties", () => {
	test("PostcodeResult region is always string | null — never undefined", () => {
		FastCheck.assert(
			FastCheck.property(
				Schema.toArbitrary(PostcodeResult),
				(value) => value.region === null || typeof value.region === "string",
			),
		);
	});

	test("PostcodeResult decode is total — arbitrary and decoder are consistent", () => {
		const decode = Schema.decodeUnknownSync(PostcodeResult);
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(PostcodeResult), (value) => {
				decode(value); // throws if generated value doesn't satisfy the schema
				return true;
			}),
		);
	});

	test("BulkLookupItem result is PostcodeResult | null — never undefined", () => {
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(BulkLookupItem), (item) => item.result !== undefined),
		);
	});

	test("ErrorEnvelope status is always the literal 404", () => {
		FastCheck.assert(
			FastCheck.property(Schema.toArbitrary(ErrorEnvelope), (envelope) => envelope.status === 404),
		);
	});

	test("path encoding roundtrip: decodeURIComponent(encodeURIComponent(s)) === s", () => {
		FastCheck.assert(
			FastCheck.property(FastCheck.string(), (s) => {
				const encoded = encodeURIComponent(s);
				const decoded = decodeURIComponent(encoded);
				return decoded === s;
			}),
		);
	});
});
