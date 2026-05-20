const path = require("node:path");
const { runTests } = require("@vscode/test-electron");

async function main() {
	const extensionDevelopmentPath = path.resolve(__dirname, "..", "..");
	const extensionTestsPath = path.resolve(__dirname, "..", "..", "dist", "test", "integration", "index.js");
	try {
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ["--disable-extensions"],
		});
	} catch (err) {
		console.error("Failed to run tests:", err);
		process.exit(1);
	}
}
main();
