import { defineConfig } from "oxfmt";

export default defineConfig({
	useTabs: true,
	semi: true,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 100,
	sortImports: true,
	ignorePatterns: [
		"dist/**",
		"node_modules/**",
		"effect-smol-main/**",
		"generated/**",
		"openapi/full-upstream/**",
		".flue/**",
		"docs/**",
	],
});
