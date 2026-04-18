import type * as PostcodesFull from "../../gen/generated/PostcodesFull.ts";
import type * as PostcodesSpike from "../../gen/generated/PostcodesSpike.ts";

export const postcodeResult = {
	postcode: "SW1A 1AA",
	quality: 1,
	eastings: 529090,
	northings: 179645,
	country: "England",
	nhs_ha: "London",
	longitude: -0.141588,
	latitude: 51.501009,
	european_electoral_region: "London",
	primary_care_trust: "Westminster",
	region: "London",
	lsoa: "Westminster 018C",
	msoa: "Westminster 018",
	parish: null,
	parliamentary_constituency: "Cities of London and Westminster",
	admin_county: null,
	admin_district: "Westminster",
	admin_ward: "St James's",
	ccg: "NHS North West London",
	ced: null,
	nuts: "Westminster",
	pfa: "Metropolitan Police",
	codes: {
		admin_district: "E09000033",
		admin_ward: "E05013806",
		parish: "E43000236",
		parliamentary_constituency: "E14001172",
		ccg: "QRV",
		ccg_id: "W2U3Z",
		ced: "E99999999",
		lau2: "E09000033",
		lsoa: "E01004736",
		msoa: "E02000977",
		nuts: "TLI32",
		pfa: "E23000001",
	},
} satisfies PostcodesSpike.LookupPostcode200["result"];

export const lookupPostcodeResponse = {
	status: 200,
	result: postcodeResult,
} satisfies PostcodesSpike.LookupPostcode200;

export const bulkLookupPostcodesResponse = {
	status: 200,
	result: [
		{ query: "SW1A1AA", result: postcodeResult },
		{ query: "ZZ99ZZ", result: null },
	],
} satisfies PostcodesSpike.BulkLookupPostcodes200;

export const lookupPostcodeNotFoundResponse = {
	status: 404,
	error: "Postcode not found",
} satisfies PostcodesSpike.LookupPostcode404;

export const outcodeResponse = {
	status: 200,
	result: {
		outcode: "SW1A",
		longitude: -0.13222562937062937,
		latitude: 51.504521769230756,
		northings: 179645,
		eastings: 529090,
		admin_county: ["Greater London"],
		admin_district: ["Westminster", "Wandsworth"],
		admin_ward: ["St James's"],
		country: ["England"],
		parish: ["Westminster, unparished area"],
		parliamentary_constituency: ["Cities of London and Westminster"],
	},
} satisfies PostcodesSpike.FindOutcode200;

export const outcodeNotFoundResponse = {
	status: 404,
	error: "Outcode not found",
} satisfies PostcodesSpike.FindOutcode404;

export const placeResponse = {
	status: 200,
	result: {
		code: "osgb4000000074564391",
		name_1: "London",
		name_1_lang: "eng",
		name_2: "Llundain",
		name_2_lang: "cym",
		local_type: "City",
		outcode: "EC1A",
		county_unitary: "Greater London",
		county_unitary_type: "Greater London Authority",
		district_borough: "City of London",
		district_borough_type: "London Borough",
		region: "London",
		country: "England",
		longitude: -0.1198,
		latitude: 51.5085,
		eastings: 531585,
		northings: 180805,
		min_eastings: 503565,
		min_northings: 155850,
		max_eastings: 561957,
		max_northings: 200183,
	},
} satisfies PostcodesFull.RandomPlace200;

export const findPlaceResponse =
	placeResponse satisfies PostcodesSpike.FindPlace200;

export const findPlaceNotFoundResponse = {
	status: 404,
	error: "Place not found",
} satisfies PostcodesSpike.FindPlace404;
