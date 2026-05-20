import * as vscode from "vscode";
import { listTestcases, nextIndex, writeTestcase } from "../mapping/testcases";

export async function addTestcaseCmd(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const sourcePath = editor.document.uri.fsPath;
	const input = await vscode.window.showInputBox({
		title: "Testcase Input",
		prompt: "여러 줄: \\n 로 구분",
	});
	if (input === undefined) return;
	const output = await vscode.window.showInputBox({
		title: "Testcase Expected Output",
		prompt: "여러 줄: \\n 로 구분",
	});
	if (output === undefined) return;
	const idx = nextIndex(await listTestcases(sourcePath));
	await writeTestcase(sourcePath, idx, input.replace(/\\n/g, "\n"), output.replace(/\\n/g, "\n"));
	vscode.window.showInformationMessage(`Added testcase #${idx}`);
	await vscode.commands.executeCommand("aoj.sidebar.refresh");
}
