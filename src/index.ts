// Service
export { PostcodesClient } from "./PostcodesClient.ts";

// Config
export type { ApiConfig } from "./ApiConfig.ts";
export { defaultApiConfig, makeApiConfig } from "./ApiConfig.ts";

// Error types
export type { ApiServiceError } from "./Errors.ts";
export { ApiNotFoundError, isApiNotFoundError } from "./Errors.ts";

// Domain types — consumers never import generated/ directly
export type {
	BulkLookupItem,
	ErrorEnvelope,
	OutcodeResult,
	PlaceResult,
	PostcodeResult,
} from "../generated/PostcodesSpike.ts";
