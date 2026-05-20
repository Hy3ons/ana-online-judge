import * as vscode from "vscode";
import type { AojSidebarProvider } from "../views/sidebar/provider";

export async function runAllCmd(sidebar: AojSidebarProvider): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("열린 파일이 없습니다.");
		return;
	}
	const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
	if (!folder) {
		vscode.window.showErrorMessage("파일이 워크스페이스 밖에 있습니다.");
		return;
	}
	await sidebar.runAll(editor.document.uri.fsPath);
}
