import { recommended } from "@opsydyn/oxlint-effect";
import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: ["typescript"],
	jsPlugins: [...recommended.jsPlugins],
	ignorePatterns: [
		"dist/**",
		"node_modules/**",
		"effect-smol-main/**",
		"generated/**",
		"openapi/full-upstream/**",
		".flue/**",
		"docs/**",
	],
	rules: {
		...recommended.rules,
		// Conflicts with HttpApiBuilder.group and similar Effect platform patterns
		// that legitimately use generator functions via Effect.fn
		"linteffect/no-effect-fn-generator": "off",
		"linteffect/no-nested-effect-gen": "off",
	},
	overrides: [
		{
			files: ["src/programs/**", "test/helpers/**"],
			rules: { "linteffect/no-naked-object-state-update": "off" },
		},
		{
			// Programs are the runtime boundary — Effect.runPromise belongs here
			files: ["src/programs/**"],
			rules: {
				"linteffect/no-run-effect-outside-boundary": "off",
				"linteffect/no-inline-runtime-provide": "off",
				"linteffect/no-if-statement": "off",
			},
		},
		{
			// Library public API and internal modules need explicit Effect channel types
			files: ["src/PostcodesClient.ts", "src/internal/**"],
			rules: {
				"linteffect/no-manual-effect-channels": "off",
				"linteffect/no-inline-runtime-provide": "off",
			},
		},
		{
			// HTTP handlers are a legitimate orDie boundary; server is a demo
			files: ["src/server/**"],
			rules: {
				"linteffect/no-or-die-outside-boundary": "off",
				"linteffect/no-effect-wrapper-alias": "off",
			},
		},
		{
			// Tests are the runtime boundary; relaxed pattern rules for test code
			files: ["test/**"],
			rules: {
				"linteffect/no-run-effect-outside-boundary": "off",
				"linteffect/no-inline-runtime-provide": "off",
				"linteffect/no-return-in-arrow": "off",
				"linteffect/no-effect-wrapper-alias": "off",
				"linteffect/no-adhoc-domain-error": "off",
				"linteffect/no-magic-domain-string": "off",
			},
		},
		{
			// Utility build scripts — not Effect application code
			files: ["scripts/**"],
			rules: {
				"linteffect/no-naked-object-state-update": "off",
				"linteffect/no-run-effect-outside-boundary": "off",
				"linteffect/no-string-sentinel-const": "off",
			},
		},
	],
});
