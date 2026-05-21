import * as vscode from "vscode";
import { getSidecarDir } from "../config/settings";
import { listTestcases, nextIndex, writeTestcase } from "../mapping/testcases";

export async function addTestcaseCmd(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const sourcePath = editor.document.uri.fsPath;
	const sidecarDir = getSidecarDir();
	const idx = nextIndex(await listTestcases(sourcePath, sidecarDir));
	await writeTestcase(sourcePath, idx, "", "", sidecarDir);
	await vscode.commands.executeCommand("aoj.sidebar.refresh");
}
