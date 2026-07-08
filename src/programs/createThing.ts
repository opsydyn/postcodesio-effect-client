import { Effect } from "effect";

import { makeApiConfig, PostcodesClient } from "../index.ts";

const client = await Effect.runPromise(PostcodesClient.make(makeApiConfig()));
const result = await Effect.runPromise(client.bulkLookupPostcodes(["SW1A1AA", "EC1A1BB"]));
console.log(JSON.stringify(result, null, 2));
