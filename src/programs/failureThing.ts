import { Effect } from "effect";
import { isApiNotFoundError, makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const outcome = await Effect.runPromise(
	client.lookupPostcode("ZZ99ZZ").pipe(
		Effect.match({ onFailure: (e) => e, onSuccess: (r) => r }),
	),
);
if (isApiNotFoundError(outcome)) {
	console.log(JSON.stringify(outcome, null, 2));
} else {
	console.log(JSON.stringify(outcome, null, 2));
}
