import { Match } from "effect";
import { Elysia } from "elysia";

import {
	findPlaceNotFoundResponse,
	findPlaceResponse,
	lookupPostcodeNotFoundResponse,
	nearestPostcodesResponse,
	outcodeNotFoundResponse,
	outcodeResponse,
	placeResponse,
	productionBulkLookupPostcodesResponse,
	productionLookupNorthernIrishPostcodeResponse,
	productionLookupPostcodeResponse,
	productionLookupScottishPostcodeResponse,
	randomPostcodeResponse,
	searchPostcodesResponse,
	searchPlacesResponse,
	scottishPostcodeDirectoryResponse,
	terminatedPostcodeResponse,
} from "./fixtures.ts";

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const isTextPostcodeSearch = (query: { readonly query?: string }): boolean =>
	query.query === "SW1A";

const isCoordinatePostcodeSearch = (query: {
	readonly latitude?: string;
	readonly longitude?: string;
}): boolean => query.latitude === "51.501" && query.longitude === "-0.141";

export const startSpikeMockServer = (port = 0) =>
	new Elysia()
		.get("/postcodes/:postcode/nearest", () => nearestPostcodesResponse)
		.get("/postcodes/:postcode", ({ params }) =>
			Match.value(params.postcode.replaceAll(" ", "").toUpperCase()).pipe(
				Match.when("SW1A1AA", () => productionLookupPostcodeResponse),
				Match.when("EH259NJ", () => productionLookupScottishPostcodeResponse),
				Match.when("BT15GS", () => productionLookupNorthernIrishPostcodeResponse),
				Match.when("ZZ99ZZ", () => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
				Match.orElse(() => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
			),
		)
		.post("/postcodes", () => productionBulkLookupPostcodesResponse)
		.get("/postcodes", ({ query }) =>
			Match.value(query).pipe(
				Match.when(isTextPostcodeSearch, () => searchPostcodesResponse),
				Match.when(isCoordinatePostcodeSearch, () => searchPostcodesResponse),
				Match.orElse(() => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
			),
		)
		.get("/random/postcodes", () => randomPostcodeResponse)
		.get("/terminated_postcodes/:postcode", ({ params }) =>
			Match.value(params.postcode.replaceAll(" ", "").toUpperCase()).pipe(
				Match.when("BS405AF", () => terminatedPostcodeResponse),
				Match.orElse(() => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
			),
		)
		.get("/scotland/postcodes/:postcode", ({ params }) =>
			Match.value(params.postcode.replaceAll(" ", "").toUpperCase()).pipe(
				Match.when("EH259NJ", () => scottishPostcodeDirectoryResponse),
				Match.orElse(() => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
			),
		)
		.get("/places", () => searchPlacesResponse)
		.get("/outcodes/:outcode", ({ params }) =>
			Match.value(params.outcode.toUpperCase()).pipe(
				Match.when("SW1A", () => outcodeResponse),
				Match.orElse(() => jsonResponse(outcodeNotFoundResponse, 404)),
			),
		)
		.get("/places/:code", ({ params }) =>
			Match.value(params.code).pipe(
				Match.when("osgb4000000074564391", () => findPlaceResponse),
				Match.orElse(() => jsonResponse(findPlaceNotFoundResponse, 404)),
			),
		)
		.get("/random/places", () => placeResponse)
		.listen(port);

export const getSpikeMockServerBaseUrl = (server: ReturnType<typeof startSpikeMockServer>) =>
	Match.value(server.server?.port).pipe(
		Match.when(undefined, () => {
			throw new Error("Failed to determine Elysia mock server port");
		}),
		Match.orElse((resolvedPort) => `http://127.0.0.1:${resolvedPort}`),
	);

export const stopSpikeMockServer = (server: ReturnType<typeof startSpikeMockServer>) => {
	server.stop();
};
