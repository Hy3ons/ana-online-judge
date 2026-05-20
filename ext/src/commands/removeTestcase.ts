import * as vscode from "vscode";
import { listTestcases, removeTestcase } from "../mapping/testcases";

export async function removeTestcaseCmd(idxArg?: number): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const tcs = await listTestcases(editor.document.uri.fsPath);
	if (tcs.length === 0) return;
	let idx = idxArg;
	if (idx == null) {
		const pick = await vscode.window.showQuickPick(
			tcs.map((t) => ({ label: `#${t.index}`, idx: t.index })),
			{ title: "삭제할 테스트케이스" }
		);
		if (!pick) return;
		idx = pick.idx;
	}
	const tc = tcs.find((t) => t.index === idx);
	if (!tc) return;
	await removeTestcase(tc);
	await vscode.commands.executeCommand("aoj.dashboard.refresh");
}
