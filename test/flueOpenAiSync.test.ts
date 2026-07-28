import { expect, test } from "bun:test";

const readRepoFile = (path: string) => Bun.file(new URL(`../${path}`, import.meta.url)).text();

test("runs upstream sync through OpenAI with no Anthropic credential", async () => {
	const [agent, workflow] = await Promise.all([
		readRepoFile(".flue/agents/spec-sync.ts"),
		readRepoFile(".github/workflows/sync-upstream.yml"),
	]);

	expect(agent).toContain('model: "openai/gpt-5.5"');
	expect(agent).not.toContain("anthropic/");
	expect(workflow).toContain("OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}");
	expect(workflow).not.toContain("ANTHROPIC_API_KEY");
});
