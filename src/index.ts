// Service
export { PostcodesClient } from "./PostcodesClient.ts";

// Config
export type { ApiConfig } from "./ApiConfig.ts";
export { defaultApiConfig, makeApiConfig } from "./ApiConfig.ts";

// Error types
export type { ApiServiceError } from "./Errors.ts";
export { ApiNotFoundError, isApiNotFoundError } from "./Errors.ts";

// Domain schemas — exported as values (Schema.Struct instances) so consumers
// can use Schema.toArbitrary, Schema.decodeUnknown etc. directly.
// TypeScript also infers the types from these same exports.
export {
	BulkLookupItem,
	ErrorEnvelope,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
