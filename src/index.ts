// Service
export { PostcodesClient } from "./PostcodesClient.ts";
export type {
	BulkLookupItem,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
	PostcodeSearch,
	ScottishPostcode,
	TerminatedPostcode,
} from "./PostcodesClient.ts";

// Config
export type { ApiConfig } from "./ApiConfig.ts";
export { defaultApiConfig, makeApiConfig } from "./ApiConfig.ts";

// Error types
export type { ApiErrorEnvelope, ApiServiceError } from "./Errors.ts";
export {
	ApiNotFoundError,
	ApiValidationError,
	isApiNotFoundError,
	isApiValidationError,
} from "./Errors.ts";

// The upstream 404 error schema remains available for consumers that need to
// inspect postcodes.io's raw error bodies.
export { ErrorEnvelope } from "../generated/PostcodesApi.ts";
