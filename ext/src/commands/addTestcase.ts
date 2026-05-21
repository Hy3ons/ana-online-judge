import * as vscode from "vscode";
import { listTestcases, nextIndex, writeTestcase } from "../mapping/testcases";

export async function addTestcaseCmd(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const sourcePath = editor.document.uri.fsPath;
	const idx = nextIndex(await listTestcases(sourcePath));
	await writeTestcase(sourcePath, idx, "", "");
	await vscode.commands.executeCommand("aoj.sidebar.refresh");
}
