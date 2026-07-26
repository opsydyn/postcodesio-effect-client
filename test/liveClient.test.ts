import { describe, expect, test } from "bun:test";

import { Effect } from "effect";

import { PostcodesClient } from "../src/index.ts";

describe("live postcodes.io compatibility", () => {
	test("decodes representative UK postcode responses", async () => {
		const results = await Effect.runPromise(
			PostcodesClient.make().pipe(
				Effect.flatMap((client) =>
					Effect.all([
						client.lookupPostcode("SW1A 1AA"),
						client.lookupPostcode("EH25 9NJ"),
						client.lookupPostcode("CF10 1AA"),
						client.lookupPostcode("BT1 5GS"),
					]),
				),
			),
		);

		expect(results.map((result) => result.country)).toEqual([
			"England",
			"Scotland",
			"Wales",
			"Northern Ireland",
		]);
		expect(results[1]?.region).toBeNull();
		expect(results[2]?.region).toBeNull();
		expect(results[3]?.msoa).toBeNull();
	});
});
