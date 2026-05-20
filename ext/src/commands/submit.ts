import * as fs from "node:fs/promises";
import * as vscode from "vscode";
import { UnauthorizedError } from "../api/client";
import type { Endpoints } from "../api/endpoints";
import { getConfirmSubmit, getSidecarDir } from "../config/settings";
import { readSidecar, sidecarPath } from "../mapping/sidecar";
import { beginSubmission, pumpSubmissionStream } from "../webview/results/panel";

export async function submitCmd(
	context: vscode.ExtensionContext,
	endpoints: Endpoints
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("열린 파일이 없습니다.");
		return;
	}
	const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
	if (!folder) return;
	const sourcePath = editor.document.uri.fsPath;
	const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
	if (!sc) {
		vscode.window.showErrorMessage("이 파일은 AOJ 문제와 매핑되어 있지 않습니다. Sync 먼저.");
		return;
	}
	if (getConfirmSubmit()) {
		const pick = await vscode.window.showInformationMessage(
			`#${sc.problemId} ${sc.problemTitle} 에 ${sc.language} 로 제출할까요?`,
			{ modal: true },
			"제출"
		);
		if (pick !== "제출") return;
	}
	const code = await fs.readFile(sourcePath, "utf-8");
	let submissionId: number;
	try {
		const r = await endpoints.submit({
			problemId: sc.problemId,
			code,
			language: sc.language,
			contestId: sc.contestId,
		});
		submissionId = r.submissionId;
	} catch (e) {
		if (e instanceof UnauthorizedError) {
			vscode.window.showErrorMessage("로그인이 필요합니다.");
			return;
		}
		vscode.window.showErrorMessage(`제출 실패: ${(e as Error).message}`);
		return;
	}
	beginSubmission(context, `Submission #${submissionId} — ${sc.problemTitle}`, sc.problemId);
	const ctrl = new AbortController();
	try {
		const res = await endpoints.submissionStream(submissionId, ctrl.signal);
		await pumpSubmissionStream(endpoints, submissionId, res, ctrl.signal);
	} catch (e) {
		vscode.window.showWarningMessage(`SSE 끊김: ${(e as Error).message}`);
	}
}
