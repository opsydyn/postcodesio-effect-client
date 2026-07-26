import { Schema } from "effect";
import * as HttpApi from "effect/unstable/httpapi/HttpApi";
import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";

import {
	BulkLookupRequest,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../../generated/PostcodesApi.ts";

const ProductionBulkLookupItem = Schema.Struct({
	query: Schema.String,
	result: Schema.Unknown,
});

export class PostcodeNotFound extends Schema.TaggedErrorClass<PostcodeNotFound>()(
	"PostcodeNotFound",
	{ postcode: Schema.String },
	{ httpApiStatus: 404 },
) {}

export class OutcodeNotFound extends Schema.TaggedErrorClass<OutcodeNotFound>()(
	"OutcodeNotFound",
	{ outcode: Schema.String },
	{ httpApiStatus: 404 },
) {}

export class PlaceNotFound extends Schema.TaggedErrorClass<PlaceNotFound>()(
	"PlaceNotFound",
	{ code: Schema.String },
	{ httpApiStatus: 404 },
) {}

export class PostcodesApiGroup extends HttpApiGroup.make("postcodes")
	.add(
		HttpApiEndpoint.get("lookupPostcode", "/postcodes/:postcode", {
			params: { postcode: Schema.String },
			success: PostcodeResult,
			error: PostcodeNotFound,
		}),
	)
	.add(
		HttpApiEndpoint.post("bulkLookupPostcodes", "/postcodes", {
			payload: BulkLookupRequest,
			success: Schema.Array(ProductionBulkLookupItem),
		}),
	)
	.add(
		HttpApiEndpoint.get("findOutcode", "/outcodes/:outcode", {
			params: { outcode: Schema.String },
			success: OutcodeResult,
			error: OutcodeNotFound,
		}),
	)
	.add(
		HttpApiEndpoint.get("findPlace", "/places/:code", {
			params: { code: Schema.String },
			success: PlaceResult,
			error: PlaceNotFound,
		}),
	) {}

export class Api extends HttpApi.make("postcodes-spike-api").add(PostcodesApiGroup) {}
