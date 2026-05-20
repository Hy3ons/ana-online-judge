import * as vscode from "vscode";
import { getEndpoint, getSidecarDir } from "../config/settings";
import { readSidecar, sidecarPath } from "../mapping/sidecar";

export async function openInBrowserCmd(): Promise<void> {
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
	const url = `${getEndpoint().replace(/\/$/, "")}/problems/${sc.problemId}`;
	await vscode.env.openExternal(vscode.Uri.parse(url));
}
