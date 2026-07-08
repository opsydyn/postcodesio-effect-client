import { Effect } from "effect";

import { makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const result = await Effect.runPromise(client.lookupPostcode("SW1A1AA"));
console.log(JSON.stringify(result, null, 2));
