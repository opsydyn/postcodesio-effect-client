import { defineWorkflow } from "@flue/runtime";
import agent from "../agents/spec-sync.ts";

export default defineWorkflow({
	agent,
	async run({ harness }) {
		const session = await harness.session();
		return await session.prompt(
			"Sync the postcodes.io upstream OpenAPI spec and open a pull request if anything changed.",
		);
	},
});
