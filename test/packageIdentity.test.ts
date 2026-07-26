import { expect, test } from "bun:test";

test("publishes under the Opsydyn npm scope", async () => {
	const packageJson = await Bun.file(new URL("../package.json", import.meta.url)).json();
	const changelog = await Bun.file(new URL("../CHANGELOG.md", import.meta.url)).text();

	expect(packageJson.name).toBe("@opsydyn/effect-postcodes-client");
	expect(changelog).toStartWith("# @opsydyn/effect-postcodes-client");
});
