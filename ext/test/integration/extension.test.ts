import * as assert from "node:assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";

suite("extension smoke", () => {
	test("activates", async () => {
		const ext = vscode.extensions.getExtension("ana-online-judge.aoj-vscode");
		assert.ok(ext, "extension not found");
		await ext.activate();
		assert.ok(ext.isActive);
	});

	test("registers all aoj.* commands", async () => {
		const expected = [
			"aoj.signIn",
			"aoj.signOut",
			"aoj.searchProblems",
			"aoj.attachProblemById",
			"aoj.syncProblemById",
			"aoj.runAll",
			"aoj.runOne",
			"aoj.submit",
			"aoj.addTestcase",
			"aoj.removeTestcase",
			"aoj.openInBrowser",
			"aoj.dashboard.refresh",
		];
		const all = await vscode.commands.getCommands(true);
		for (const c of expected) assert.ok(all.includes(c), `missing command: ${c}`);
	});

	test("registers AOJ authentication provider", async () => {
		const session = await vscode.authentication.getSession("aoj", ["user"], {
			createIfNone: false,
		});
		assert.strictEqual(session, undefined);
	});
});
