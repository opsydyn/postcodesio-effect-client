import { Match } from "effect";
import { Elysia } from "elysia";

import {
	findPlaceNotFoundResponse,
	findPlaceResponse,
	lookupPostcodeNotFoundResponse,
	lookupNorthernIrishPostcodeResponse,
	lookupPostcodeResponse,
	lookupScottishPostcodeResponse,
	nearestPostcodesResponse,
	outcodeNotFoundResponse,
	outcodeResponse,
	placeResponse,
	productionBulkLookupPostcodesResponse,
	randomPostcodeResponse,
	searchPostcodesResponse,
	searchPlacesResponse,
} from "./fixtures.ts";

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

export const startSpikeMockServer = (port = 0) =>
	new Elysia()
		.get("/postcodes/:postcode/nearest", () => nearestPostcodesResponse)
		.get("/postcodes/:postcode", ({ params }) =>
			Match.value(params.postcode.replaceAll(" ", "").toUpperCase()).pipe(
				Match.when("SW1A1AA", () => lookupPostcodeResponse),
				Match.when("EH259NJ", () => lookupScottishPostcodeResponse),
				Match.when("BT15GS", () => lookupNorthernIrishPostcodeResponse),
				Match.when("ZZ99ZZ", () => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
				Match.orElse(() => jsonResponse(lookupPostcodeNotFoundResponse, 404)),
			),
		)
		.post("/postcodes", () => productionBulkLookupPostcodesResponse)
		.get("/postcodes", () => searchPostcodesResponse)
		.get("/random/postcodes", () => randomPostcodeResponse)
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
