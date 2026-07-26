/**
 * A postcode search may use either a text query or a coordinate pair.
 * Invalid and ambiguous combinations are reported through ApiValidationError.
 */
export interface PostcodeSearch {
	readonly query?: string;
	readonly latitude?: number;
	readonly longitude?: number;
}
