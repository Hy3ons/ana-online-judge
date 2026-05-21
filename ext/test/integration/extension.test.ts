import * as assert from "node:assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";

suite("extension smoke", () => {
	test("activates without creating a WebviewPanel", async () => {
		const ext = vscode.extensions.getExtension("ana-online-judge.aoj-vscode");
		assert.ok(ext, "extension not found");

		let panelCount = 0;
		const origCreate = vscode.window.createWebviewPanel;
		// biome-ignore lint/suspicious/noExplicitAny: monkey-patching for test instrumentation
		(vscode.window as any).createWebviewPanel = (...args: unknown[]) => {
			panelCount++;
			return origCreate.apply(vscode.window, args as never);
		};
		try {
			await ext.activate();
			assert.ok(ext.isActive);
			assert.strictEqual(panelCount, 0, "no WebviewPanel should be created at activation");
		} finally {
			// biome-ignore lint/suspicious/noExplicitAny: restore patched reference
			(vscode.window as any).createWebviewPanel = origCreate;
		}
	});

	test("registers all aoj.* commands (sidebar pivot)", async () => {
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
			"aoj.sidebar.refresh",
		];
		const all = await vscode.commands.getCommands(true);
		for (const c of expected) assert.ok(all.includes(c), `missing command: ${c}`);
	});

	test("does not register legacy dashboard/openStatement commands", async () => {
		const all = await vscode.commands.getCommands(true);
		assert.ok(
			!all.includes("aoj.dashboard.refresh"),
			"legacy aoj.dashboard.refresh should not be registered"
		);
		assert.ok(
			!all.includes("aoj.openStatement"),
			"legacy aoj.openStatement should not be registered"
		);
	});

	test("registers AOJ authentication provider", async () => {
		const session = await vscode.authentication.getSession("aoj", ["user"], {
			createIfNone: false,
		});
		assert.strictEqual(session, undefined);
	});
});
