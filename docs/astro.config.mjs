import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";

export default defineConfig({
	integrations: [
		starlight({
			title: "@effect-postcodes/client",
			description: "Effect-native TypeScript client for the postcodes.io API",
			plugins: [
				starlightOpenAPI([
					{
						base: "openapi",
						label: "HTTP endpoints",
						schema: "../openapi/spec.yaml",
					},
				]),
			],
			sidebar: [
				{ label: "Overview", link: "/" },
				{
					label: "Tutorial",
					items: [
						{ label: "Getting started", link: "/tutorial/getting-started" },
					],
				},
				{
					label: "How-to guides",
					items: [
						{
							label: "Use with Node.js or Bun",
							link: "/guides/use-with-nodejs",
						},
						{
							label: "Handle Scottish postcodes",
							link: "/guides/handle-scottish-postcodes",
						},
						{
							label: "Configure rate limiting",
							link: "/guides/configure-rate-limiting",
						},
						{
							label: "Testing with a mock service",
							link: "/guides/testing-with-mock-service",
						},
					],
				},
				{
					label: "Reference",
					items: [
						{ label: "API", link: "/reference/api" },
						{ label: "Error types", link: "/reference/error-types" },
						{ label: "Configuration", link: "/reference/configuration" },
					],
				},
				{
					label: "Explanation",
					items: [
						{
							label: "Effect layers model",
							link: "/explanation/effect-layers-model",
						},
						{
							label: "Why three entry points",
							link: "/explanation/why-three-entry-points",
						},
					],
				},
				...openAPISidebarGroups,
			],
		}),
	],
});
