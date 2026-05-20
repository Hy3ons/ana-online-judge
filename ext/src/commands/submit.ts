import * as vscode from "vscode";
import type { AojSidebarProvider } from "../views/sidebar/provider";

export async function submitCmd(sidebar: AojSidebarProvider): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("열린 파일이 없습니다.");
		return;
	}
	await sidebar.startSubmit(editor.document.uri.fsPath);
}
