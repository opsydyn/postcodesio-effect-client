import type * as PostcodesApi from "../../generated/PostcodesApi.ts";
import type * as PostcodesFull from "../../generated/PostcodesFull.ts";
import type * as PostcodesProduction from "../../generated/PostcodesProduction.ts";

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
} satisfies PostcodesApi.LookupPostcode200["result"];

export const lookupPostcodeResponse = {
	status: 200,
	result: postcodeResult,
} satisfies PostcodesApi.LookupPostcode200;

export const productionPostcodeResult = {
	...postcodeResult,
	incode: "1AA",
	outcode: "SW1A",
	date_of_introduction: "198001",
	date_of_termination: null,
	index_of_multiple_deprivation: 14843,
	parliamentary_constituency_2024: "Cities of London and Westminster",
	senedd_constituency: null,
	senedd_constituency_no: null,
	nhs_region: "London",
	ttwa: "London",
	national_park: "England (non-National Park)",
	bua: "Westminster",
	icb: "NHS North West London Integrated Care Board",
	cancer_alliance: "North West London",
	lsoa11: "E01004736",
	msoa11: "E02000977",
	lsoa21: "E01004736",
	msoa21: "E02000977",
	oa21: "E00004185",
	ruc11: "A1",
	ruc21: "UN1",
	lep1: "E37000051",
	lep2: null,
	codes: {
		...postcodeResult.codes,
		admin_county: "E99999999",
		parliamentary_constituency_2024: "E14000639",
		nhs_region: "E40000003",
		ttwa: "E30000234",
		national_park: "E65000001",
		bua: "E63012001",
		icb: "E54000031",
		cancer_alliance: "E56000007",
		lsoa11: "E01004736",
		msoa11: "E02000977",
		lsoa21: "E01004736",
		msoa21: "E02000977",
		oa21: "E00004185",
		ruc11: "A1",
		ruc21: "UN1",
		lep1: "E37000051",
		lep2: null,
	},
} satisfies PostcodesProduction.RandomPostcode200["result"];

export const randomPostcodeResponse = {
	status: 200,
	result: productionPostcodeResult,
} satisfies PostcodesProduction.RandomPostcode200;

export const productionLookupPostcodeResponse = {
	status: 200,
	result: productionPostcodeResult,
} satisfies PostcodesProduction.LookupPostcode200;

export const productionLookupScottishPostcodeResponse = {
	status: 200,
	result: {
		...productionPostcodeResult,
		postcode: "EH25 9NJ",
		country: "Scotland",
		region: null,
	},
} satisfies PostcodesProduction.LookupPostcode200;

export const productionLookupNorthernIrishPostcodeResponse = {
	status: 200,
	result: {
		...productionPostcodeResult,
		postcode: "BT1 5GS",
		country: "Northern Ireland",
		region: null,
		msoa: null,
		pfa: null,
	},
} satisfies PostcodesProduction.LookupPostcode200;

export const searchPostcodesResponse = {
	status: 200,
	result: [productionPostcodeResult],
} satisfies PostcodesProduction.PostcodeLookup200;

export const productionBulkLookupPostcodesResponse = {
	status: 200,
	result: [
		{ query: "SW1A1AA", result: productionPostcodeResult },
		{ query: "ZZ99ZZ", result: null },
	],
} satisfies PostcodesProduction.BulkPostcodeLookup200;

export const terminatedPostcodeResponse = {
	status: 200,
	result: {
		postcode: "BS40 5AF",
		year_terminated: 2016,
		month_terminated: 1,
		eastings: 344560,
		northings: 157390,
		longitude: -2.7901,
		latitude: 51.6164,
	},
} satisfies PostcodesProduction.LookupTerminatedPostcode200;

export const scottishPostcodeDirectoryResponse = {
	status: 200,
	result: {
		postcode: "EH25 9NJ",
		longitude: -3.1717,
		latitude: 55.8644,
		council_area: "Midlothian",
		electoral_ward: "Bonnyrigg",
		scottish_parliamentary_region: "Lothian",
		scottish_parliamentary_constituency: "Midlothian North and Musselburgh",
		health_board_area: "NHS Lothian",
		output_area: "S00112345",
		data_zone: "S01012345",
		intermediate_zone: "S02001234",
		codes: {},
	},
} satisfies PostcodesProduction.GetScottishPostcode200;

export const nearestPostcodesResponse = {
	status: 200,
	result: [{ ...productionPostcodeResult, distance: 0 }],
} satisfies PostcodesProduction.NearestPostcode200;

// Scottish postcodes can return a null region — postcodes.io's own published
// spec declares it non-nullable, but live responses for e.g. EH25 9NJ violate
// that. See ASSESSMENT.md.
export const scottishPostcodeResult = {
	...postcodeResult,
	postcode: "EH25 9NJ",
	country: "Scotland",
	region: null,
} satisfies PostcodesApi.LookupPostcode200["result"];

export const lookupScottishPostcodeResponse = {
	status: 200,
	result: scottishPostcodeResult,
} satisfies PostcodesApi.LookupPostcode200;

export const northernIrishPostcodeResult = {
	...postcodeResult,
	postcode: "BT1 5GS",
	country: "Northern Ireland",
	region: null,
	msoa: null,
	pfa: null,
} satisfies PostcodesApi.LookupPostcode200["result"];

export const lookupNorthernIrishPostcodeResponse = {
	status: 200,
	result: northernIrishPostcodeResult,
} satisfies PostcodesApi.LookupPostcode200;

export const bulkLookupPostcodesResponse = {
	status: 200,
	result: [
		{ query: "SW1A1AA", result: postcodeResult },
		{ query: "ZZ99ZZ", result: null },
	],
} satisfies PostcodesApi.BulkLookupPostcodes200;

export const lookupPostcodeNotFoundResponse = {
	status: 404,
	error: "Postcode not found",
} satisfies PostcodesApi.LookupPostcode404;

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
} satisfies PostcodesApi.FindOutcode200;

export const outcodeNotFoundResponse = {
	status: 404,
	error: "Outcode not found",
} satisfies PostcodesApi.FindOutcode404;

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

export const searchPlacesResponse = {
	status: 200,
	result: [placeResponse.result],
} satisfies PostcodesProduction.PlaceQuery200;

export const findPlaceResponse = placeResponse satisfies PostcodesApi.FindPlace200;

export const findPlaceNotFoundResponse = {
	status: 404,
	error: "Place not found",
} satisfies PostcodesApi.FindPlace404;
