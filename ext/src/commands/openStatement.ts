import * as vscode from "vscode";
import type { Endpoints } from "../api/endpoints";
import { getEndpoint, getSidecarDir } from "../config/settings";
import { readSidecar, sidecarPath } from "../mapping/sidecar";
import { showStatement } from "../webview/statement/panel";

export async function openStatementCmd(
	context: vscode.ExtensionContext,
	endpoints: Endpoints
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
	if (!folder) return;
	const sc = await readSidecar(
		sidecarPath(folder.uri.fsPath, editor.document.uri.fsPath, getSidecarDir())
	);
	if (!sc) {
		vscode.window.showErrorMessage("Sync 된 파일이 아닙니다.");
		return;
	}
	try {
		const problem = await endpoints.getProblem(sc.problemId);
		showStatement(context, getEndpoint(), problem);
	} catch (e) {
		vscode.window.showErrorMessage(`문제 fetch 실패: ${(e as Error).message}`);
	}
}
