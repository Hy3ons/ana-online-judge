import * as vscode from "vscode";
import type { AojSidebarProvider } from "../views/sidebar/provider";

export async function runOneCmd(sidebar: AojSidebarProvider, index?: number): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("열린 파일이 없습니다.");
		return;
	}
	let i = index;
	if (typeof i !== "number") {
		const text = await vscode.window.showInputBox({
			prompt: "Testcase index (1-based)",
			validateInput: (v) => (/^[1-9]\d*$/.test(v) ? null : "Enter a positive integer"),
		});
		if (!text) return;
		i = Number.parseInt(text, 10);
	}
	await sidebar.runOne(editor.document.uri.fsPath, i);
}
