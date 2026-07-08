import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import type { SchemaError } from "effect/Schema"
import * as Schema from "effect/Schema"
import type * as HttpClient from "effect/unstable/http/HttpClient"
import * as HttpClientError from "effect/unstable/http/HttpClientError"
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest"
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse"
// non-recursive definitions
export type ErrorEnvelope = { readonly "status": 404, readonly "error": string }
export const ErrorEnvelope = Schema.Struct({ "status": Schema.Literal(404), "error": Schema.String })
export type PostcodeCodes = { readonly "admin_district": string, readonly "admin_ward": string, readonly "parish": string, readonly "parliamentary_constituency": string, readonly "ccg": string, readonly "ccg_id": string, readonly "ced": string, readonly "lau2": string, readonly "lsoa": string, readonly "msoa": string, readonly "nuts": string, readonly "pfa": string }
export const PostcodeCodes = Schema.Struct({ "admin_district": Schema.String, "admin_ward": Schema.String, "parish": Schema.String, "parliamentary_constituency": Schema.String, "ccg": Schema.String, "ccg_id": Schema.String, "ced": Schema.String, "lau2": Schema.String, "lsoa": Schema.String, "msoa": Schema.String, "nuts": Schema.String, "pfa": Schema.String })
export type BulkLookupRequest = { readonly "postcodes": ReadonlyArray<string> }
export const BulkLookupRequest = Schema.Struct({ "postcodes": Schema.Array(Schema.String).check(Schema.isMinLength(1)) })
export type OutcodeResult = { readonly "outcode": string, readonly "longitude": number | null, readonly "latitude": number | null, readonly "northings": number | null, readonly "eastings": number | null, readonly "admin_county": ReadonlyArray<string>, readonly "admin_district": ReadonlyArray<string>, readonly "admin_ward": ReadonlyArray<string>, readonly "country": ReadonlyArray<string>, readonly "parish": ReadonlyArray<string>, readonly "parliamentary_constituency": ReadonlyArray<string> }
export const OutcodeResult = Schema.Struct({ "outcode": Schema.String, "longitude": Schema.Union([Schema.Number.check(Schema.isFinite()), Schema.Null]), "latitude": Schema.Union([Schema.Number.check(Schema.isFinite()), Schema.Null]), "northings": Schema.Union([Schema.Number.check(Schema.isInt()), Schema.Null]), "eastings": Schema.Union([Schema.Number.check(Schema.isInt()), Schema.Null]), "admin_county": Schema.Array(Schema.String), "admin_district": Schema.Array(Schema.String), "admin_ward": Schema.Array(Schema.String), "country": Schema.Array(Schema.String), "parish": Schema.Array(Schema.String), "parliamentary_constituency": Schema.Array(Schema.String) })
export type PlaceResult = { readonly "code": string, readonly "name_1": string, readonly "name_1_lang"?: string | null, readonly "name_2"?: string | null, readonly "name_2_lang"?: string | null, readonly "local_type": string, readonly "outcode": string, readonly "county_unitary": string, readonly "county_unitary_type": string, readonly "district_borough"?: string | null, readonly "district_borough_type"?: string | null, readonly "region": string, readonly "country": string, readonly "longitude": number, readonly "latitude": number, readonly "eastings": number, readonly "northings": number, readonly "min_eastings": number, readonly "min_northings": number, readonly "max_eastings": number, readonly "max_northings": number }
export const PlaceResult = Schema.Struct({ "code": Schema.String, "name_1": Schema.String, "name_1_lang": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "name_2": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "name_2_lang": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "local_type": Schema.String, "outcode": Schema.String, "county_unitary": Schema.String, "county_unitary_type": Schema.String, "district_borough": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "district_borough_type": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "region": Schema.String, "country": Schema.String, "longitude": Schema.Number.check(Schema.isFinite()), "latitude": Schema.Number.check(Schema.isFinite()), "eastings": Schema.Number.check(Schema.isInt()), "northings": Schema.Number.check(Schema.isInt()), "min_eastings": Schema.Number.check(Schema.isInt()), "min_northings": Schema.Number.check(Schema.isInt()), "max_eastings": Schema.Number.check(Schema.isInt()), "max_northings": Schema.Number.check(Schema.isInt()) })
export type PostcodeResult = { readonly "postcode": string, readonly "quality": 1 | 2 | 3 | 4 | 5 | 6 | 9, readonly "eastings": number, readonly "northings": number, readonly "country": string, readonly "nhs_ha": string, readonly "longitude": number, readonly "latitude": number, readonly "european_electoral_region": string, readonly "primary_care_trust": string, readonly "region": string | null, readonly "lsoa": string, readonly "msoa": string, readonly "parish"?: string | null, readonly "parliamentary_constituency": string, readonly "admin_county"?: string | null, readonly "admin_district": string, readonly "admin_ward": string, readonly "ccg": string, readonly "ced"?: string | null, readonly "nuts": string, readonly "pfa": string, readonly "codes": PostcodeCodes }
export const PostcodeResult = Schema.Struct({ "postcode": Schema.String, "quality": Schema.Literals([1, 2, 3, 4, 5, 6, 9]), "eastings": Schema.Number.check(Schema.isInt()), "northings": Schema.Number.check(Schema.isInt()), "country": Schema.String, "nhs_ha": Schema.String, "longitude": Schema.Number.check(Schema.isFinite()), "latitude": Schema.Number.check(Schema.isFinite()), "european_electoral_region": Schema.String, "primary_care_trust": Schema.String, "region": Schema.Union([Schema.String, Schema.Null]), "lsoa": Schema.String, "msoa": Schema.String, "parish": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "parliamentary_constituency": Schema.String, "admin_county": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "admin_district": Schema.String, "admin_ward": Schema.String, "ccg": Schema.String, "ced": Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])), "nuts": Schema.String, "pfa": Schema.String, "codes": PostcodeCodes })
export type OutcodeEnvelope = { readonly "status": 200, readonly "result": OutcodeResult }
export const OutcodeEnvelope = Schema.Struct({ "status": Schema.Literal(200), "result": OutcodeResult })
export type PlaceEnvelope = { readonly "status": 200, readonly "result": PlaceResult }
export const PlaceEnvelope = Schema.Struct({ "status": Schema.Literal(200), "result": PlaceResult })
export type PostcodeEnvelope = { readonly "status": 200, readonly "result": PostcodeResult }
export const PostcodeEnvelope = Schema.Struct({ "status": Schema.Literal(200), "result": PostcodeResult })
export type BulkLookupItem = { readonly "query": string, readonly "result": PostcodeResult | null }
export const BulkLookupItem = Schema.Struct({ "query": Schema.String, "result": Schema.Union([PostcodeResult, Schema.Null], { mode: "oneOf" }) })
export type BulkPostcodeEnvelope = { readonly "status": 200, readonly "result": ReadonlyArray<BulkLookupItem> }
export const BulkPostcodeEnvelope = Schema.Struct({ "status": Schema.Literal(200), "result": Schema.Array(BulkLookupItem) })
// schemas
export type LookupPostcode200 = PostcodeEnvelope
export const LookupPostcode200 = PostcodeEnvelope
export type LookupPostcode404 = ErrorEnvelope
export const LookupPostcode404 = ErrorEnvelope
export type BulkLookupPostcodesRequestJson = BulkLookupRequest
export const BulkLookupPostcodesRequestJson = BulkLookupRequest
export type BulkLookupPostcodes200 = BulkPostcodeEnvelope
export const BulkLookupPostcodes200 = BulkPostcodeEnvelope
export type FindOutcode200 = OutcodeEnvelope
export const FindOutcode200 = OutcodeEnvelope
export type FindOutcode404 = ErrorEnvelope
export const FindOutcode404 = ErrorEnvelope
export type FindPlace200 = PlaceEnvelope
export const FindPlace200 = PlaceEnvelope
export type FindPlace404 = ErrorEnvelope
export const FindPlace404 = ErrorEnvelope

export interface OperationConfig {
  /**
   * Whether or not the response should be included in the value returned from
   * an operation.
   *
   * If set to `true`, a tuple of `[A, HttpClientResponse]` will be returned,
   * where `A` is the success type of the operation.
   *
   * If set to `false`, only the success type of the operation will be returned.
   */
  readonly includeResponse?: boolean | undefined
}

/**
 * A utility type which optionally includes the response in the return result
 * of an operation based upon the value of the `includeResponse` configuration
 * option.
 */
export type WithOptionalResponse<A, Config extends OperationConfig> = Config extends {
  readonly includeResponse: true
} ? [A, HttpClientResponse.HttpClientResponse] : A

export const make = (
  httpClient: HttpClient.HttpClient,
  options: {
    readonly transformClient?: ((client: HttpClient.HttpClient) => Effect.Effect<HttpClient.HttpClient>) | undefined
  } = {}
): PostcodesApi => {
  const unexpectedStatus = (response: HttpClientResponse.HttpClientResponse) =>
    Effect.flatMap(
      Effect.orElseSucceed(response.json, () => "Unexpected status code"),
      (description) =>
        Effect.fail(
          new HttpClientError.HttpClientError({
            reason: new HttpClientError.StatusCodeError({
              request: response.request,
              response,
              description: typeof description === "string" ? description : JSON.stringify(description),
            }),
          }),
        ),
    )
  const withResponse = <Config extends OperationConfig>(config: Config | undefined) => (
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<any, any>,
  ): (request: HttpClientRequest.HttpClientRequest) => Effect.Effect<any, any> => {
    const withOptionalResponse = (
      config?.includeResponse
        ? (response: HttpClientResponse.HttpClientResponse) => Effect.map(f(response), (a) => [a, response])
        : (response: HttpClientResponse.HttpClientResponse) => f(response)
    ) as any
    return options?.transformClient
      ? (request) =>
          Effect.flatMap(
            Effect.flatMap(options.transformClient!(httpClient), (client) => client.execute(request)),
            withOptionalResponse
          )
      : (request) => Effect.flatMap(httpClient.execute(request), withOptionalResponse)
  }
  const decodeSuccess =
    <Schema extends Schema.Constraint>(schema: Schema) =>
    (response: HttpClientResponse.HttpClientResponse) =>
      HttpClientResponse.schemaBodyJson(schema)(response)
  const decodeError =
    <const Tag extends string, Schema extends Schema.Constraint>(tag: Tag, schema: Schema) =>
    (response: HttpClientResponse.HttpClientResponse) =>
      Effect.flatMap(
        HttpClientResponse.schemaBodyJson(schema)(response),
        (cause) => Effect.fail(PostcodesApiError(tag, cause, response)),
      )
  return {
    httpClient,
    "lookupPostcode": (postcode, options) => HttpClientRequest.get(`/postcodes/${postcode}`).pipe(
    withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(LookupPostcode200),
      "404": decodeError("LookupPostcode404", LookupPostcode404),
      orElse: unexpectedStatus
    }))
  ),
    "bulkLookupPostcodes": (options) => HttpClientRequest.post(`/postcodes`).pipe(
    HttpClientRequest.bodyJsonUnsafe(options.payload),
    withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(BulkLookupPostcodes200),
      orElse: unexpectedStatus
    }))
  ),
    "findOutcode": (outcode, options) => HttpClientRequest.get(`/outcodes/${outcode}`).pipe(
    withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(FindOutcode200),
      "404": decodeError("FindOutcode404", FindOutcode404),
      orElse: unexpectedStatus
    }))
  ),
    "findPlace": (code, options) => HttpClientRequest.get(`/places/${code}`).pipe(
    withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(FindPlace200),
      "404": decodeError("FindPlace404", FindPlace404),
      orElse: unexpectedStatus
    }))
  )
  }
}

export interface PostcodesApi {
  readonly httpClient: HttpClient.HttpClient
  /**
* Lookup a postcode
*/
readonly "lookupPostcode": <Config extends OperationConfig>(postcode: string, options: { readonly config?: Config | undefined } | undefined) => Effect.Effect<WithOptionalResponse<typeof LookupPostcode200.Type, Config>, HttpClientError.HttpClientError | SchemaError | PostcodesApiError<"LookupPostcode404", typeof LookupPostcode404.Type>>
  /**
* Bulk postcode lookup
*/
readonly "bulkLookupPostcodes": <Config extends OperationConfig>(options: { readonly payload: typeof BulkLookupPostcodesRequestJson.Encoded; readonly config?: Config | undefined }) => Effect.Effect<WithOptionalResponse<typeof BulkLookupPostcodes200.Type, Config>, HttpClientError.HttpClientError | SchemaError>
  /**
* Find an outward code
*/
readonly "findOutcode": <Config extends OperationConfig>(outcode: string, options: { readonly config?: Config | undefined } | undefined) => Effect.Effect<WithOptionalResponse<typeof FindOutcode200.Type, Config>, HttpClientError.HttpClientError | SchemaError | PostcodesApiError<"FindOutcode404", typeof FindOutcode404.Type>>
  /**
* Find a place by ID
*/
readonly "findPlace": <Config extends OperationConfig>(code: string, options: { readonly config?: Config | undefined } | undefined) => Effect.Effect<WithOptionalResponse<typeof FindPlace200.Type, Config>, HttpClientError.HttpClientError | SchemaError | PostcodesApiError<"FindPlace404", typeof FindPlace404.Type>>
}

export interface PostcodesApiError<Tag extends string, E> {
  readonly _tag: Tag
  readonly request: HttpClientRequest.HttpClientRequest
  readonly response: HttpClientResponse.HttpClientResponse
  readonly cause: E
}

class PostcodesApiErrorImpl extends Data.Error<{
  _tag: string
  cause: any
  request: HttpClientRequest.HttpClientRequest
  response: HttpClientResponse.HttpClientResponse
}> {}

export const PostcodesApiError = <Tag extends string, E>(
  tag: Tag,
  cause: E,
  response: HttpClientResponse.HttpClientResponse,
): PostcodesApiError<Tag, E> =>
  new PostcodesApiErrorImpl({
    _tag: tag,
    cause,
    response,
    request: response.request,
  }) as any
