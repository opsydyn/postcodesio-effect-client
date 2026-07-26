import { Schema } from "effect";

import * as Production from "../generated/PostcodesProduction.ts";

export const PostcodeResult = Schema.declare<Production.LookupPostcode200["result"]>(
	(input): input is Production.LookupPostcode200["result"] =>
		Schema.is(Production.LookupPostcode200)({ status: 200, result: input }),
	{
		title: "Postcode result",
		toArbitrary: () => () =>
			Schema.toArbitrary(Production.LookupPostcode200).map((response) => response.result),
	},
);

export const BulkLookupItem = Schema.declare<Production.BulkPostcodeLookup200["result"][number]>(
	(input): input is Production.BulkPostcodeLookup200["result"][number] =>
		Schema.is(Production.BulkPostcodeLookup200)({ status: 200, result: [input] }),
	{
		title: "Bulk postcode lookup item",
		toArbitrary: () => () =>
			Schema.toArbitrary(Production.BulkPostcodeLookup200)
				.filter((response) => response.result.length > 0)
				.map(
					(response) => response.result[0] as Production.BulkPostcodeLookup200["result"][number],
				),
	},
);

export const NearestPostcode = Schema.declare<Production.NearestPostcode200["result"][number]>(
	(input): input is Production.NearestPostcode200["result"][number] =>
		Schema.is(Production.NearestPostcode200)({ status: 200, result: [input] }),
	{ title: "Nearest postcode" },
);

export const TerminatedPostcode = Schema.declare<Production.LookupTerminatedPostcode200["result"]>(
	(input): input is Production.LookupTerminatedPostcode200["result"] =>
		Schema.is(Production.LookupTerminatedPostcode200)({ status: 200, result: input }),
	{ title: "Terminated postcode" },
);

export const ScottishPostcode = Schema.declare<Production.GetScottishPostcode200["result"]>(
	(input): input is Production.GetScottishPostcode200["result"] =>
		Schema.is(Production.GetScottishPostcode200)({ status: 200, result: input }),
	{ title: "Scottish postcode" },
);

export const OutcodeResult = Schema.declare<Production.FindOutcode200["result"]>(
	(input): input is Production.FindOutcode200["result"] =>
		Schema.is(Production.FindOutcode200)({ status: 200, result: input }),
	{ title: "Outcode result" },
);

export const PlaceResult = Schema.declare<Production.FindPlace200["result"]>(
	(input): input is Production.FindPlace200["result"] =>
		Schema.is(Production.FindPlace200)({ status: 200, result: input }),
	{ title: "Place result" },
);

export type PostcodeResult = typeof PostcodeResult.Type;
export type BulkLookupItem = typeof BulkLookupItem.Type;
export type NearestPostcode = typeof NearestPostcode.Type;
export type TerminatedPostcode = typeof TerminatedPostcode.Type;
export type ScottishPostcode = typeof ScottishPostcode.Type;
export type OutcodeResult = typeof OutcodeResult.Type;
export type PlaceResult = typeof PlaceResult.Type;
