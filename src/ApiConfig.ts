import type * as Duration from "effect/Duration";

export interface ApiConfig {
	readonly baseUrl: string;
	readonly authToken?: string | undefined;
	readonly rateLimit?: { readonly window: Duration.Input; readonly limit: number } | undefined;
}

export const defaultApiConfig: ApiConfig = {
	baseUrl: "https://api.postcodes.io",
};

export const makeApiConfig = (overrides: Partial<ApiConfig> = {}): ApiConfig => ({
	...defaultApiConfig,
	...overrides,
});
