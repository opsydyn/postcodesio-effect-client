import * as Data from "effect/Data";
import * as Predicate from "effect/Predicate";
import type { SchemaError } from "effect/Schema";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";
import type * as RateLimiter from "effect/unstable/persistence/RateLimiter";
import type * as Generated from "../generated/PostcodesSpike.ts";

export interface ApiNotFoundError {
	readonly _tag: "ApiNotFoundError";
	readonly resource: string;
	readonly identifier: string;
	readonly message: string;
	readonly cause: Generated.ErrorEnvelope;
}

class ApiNotFoundErrorImpl extends Data.Error<ApiNotFoundError> {}

export const ApiNotFoundError = (
	resource: string,
	identifier: string,
	cause: Generated.ErrorEnvelope,
): ApiNotFoundError =>
	new ApiNotFoundErrorImpl({
		_tag: "ApiNotFoundError",
		resource,
		identifier,
		message: `${resource} not found: ${identifier}`,
		cause,
	}) as ApiNotFoundError;

export type GeneratedNotFoundError =
	| Generated.PostcodesSpikeError<
			"LookupPostcode404",
			Generated.LookupPostcode404
	  >
	| Generated.PostcodesSpikeError<"FindOutcode404", Generated.FindOutcode404>
	| Generated.PostcodesSpikeError<"FindPlace404", Generated.FindPlace404>;

export type ApiServiceError =
	| HttpClientError.HttpClientError
	| SchemaError
	| ApiNotFoundError
	| RateLimiter.RateLimiterError;

export const isApiNotFoundError = (input: unknown): input is ApiNotFoundError =>
	Predicate.isTagged(input, "ApiNotFoundError");

export const isGeneratedNotFoundError = (
	input: unknown,
): input is GeneratedNotFoundError =>
	Predicate.isTagged(input, "LookupPostcode404") ||
	Predicate.isTagged(input, "FindOutcode404") ||
	Predicate.isTagged(input, "FindPlace404");
