import { Schema, SchemaAST } from "effect";

import * as Production from "../generated/PostcodesProduction.ts";

const resultAst = (schema: Schema.Constraint): SchemaAST.AST =>
	(schema.ast as SchemaAST.Objects).propertySignatures[1]!.type;

const resultArrayElementAst = (schema: Schema.Constraint): SchemaAST.AST =>
	(resultAst(schema) as SchemaAST.Arrays).rest[0]!;

export const PostcodeResult = Schema.make<Schema.Codec<Production.LookupPostcode200["result"]>>(
	resultAst(Production.LookupPostcode200),
);

export const BulkLookupItem = Schema.make<
	Schema.Codec<Production.BulkPostcodeLookup200["result"][number]>
>(resultArrayElementAst(Production.BulkPostcodeLookup200));

export const NearestPostcode = Schema.make<
	Schema.Codec<Production.NearestPostcode200["result"][number]>
>(resultArrayElementAst(Production.NearestPostcode200));

export const TerminatedPostcode = Schema.make<
	Schema.Codec<Production.LookupTerminatedPostcode200["result"]>
>(resultAst(Production.LookupTerminatedPostcode200));

export const ScottishPostcode = Schema.make<
	Schema.Codec<Production.GetScottishPostcode200["result"]>
>(resultAst(Production.GetScottishPostcode200));

export const OutcodeResult = Schema.make<Schema.Codec<Production.FindOutcode200["result"]>>(
	resultAst(Production.FindOutcode200),
);

export const PlaceResult = Schema.make<Schema.Codec<Production.FindPlace200["result"]>>(
	resultAst(Production.FindPlace200),
);

export type PostcodeResult = typeof PostcodeResult.Type;
export type BulkLookupItem = typeof BulkLookupItem.Type;
export type NearestPostcode = typeof NearestPostcode.Type;
export type TerminatedPostcode = typeof TerminatedPostcode.Type;
export type ScottishPostcode = typeof ScottishPostcode.Type;
export type OutcodeResult = typeof OutcodeResult.Type;
export type PlaceResult = typeof PlaceResult.Type;
