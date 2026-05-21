import * as vscode from "vscode";
import { listTestcases } from "../mapping/testcases";
import type { AojSidebarProvider } from "../views/sidebar/provider";

export async function removeTestcaseCmd(
	sidebar: AojSidebarProvider,
	idxArg?: number
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const sourcePath = editor.document.uri.fsPath;
	const tcs = await listTestcases(sourcePath);
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
	// handleRemoveTestcase posts `caseRemoved` + the undo toast itself.
	await sidebar.handleRemoveTestcase(sourcePath, idx);
}
