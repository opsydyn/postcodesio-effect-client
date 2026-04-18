export interface ApiConfig {
	readonly baseUrl: string;
	readonly authToken?: string | undefined;
}

export const defaultApiConfig: ApiConfig = {
	baseUrl: "https://api.postcodes.io",
};

export const makeApiConfig = (
	overrides: Partial<ApiConfig> = {},
): ApiConfig => ({
	...defaultApiConfig,
	...overrides,
});
