import * as vscode from "vscode";
import type { Endpoints, PublicProblemDetail } from "../api/endpoints";
import { getSidecarDir } from "../config/settings";
import { extToLang } from "../languages/extToLang";
import { readSidecar, sidecarPath, writeSidecar } from "../mapping/sidecar";
import { syncTestcasesFromExamples } from "../mapping/testcases";

export async function attachProblemCmd(
	endpoints: Endpoints,
	problemId?: number,
	contestId?: number
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("열린 파일이 없습니다. 먼저 소스 파일을 열어주세요.");
		return;
	}
	const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
	if (!folder) {
		vscode.window.showErrorMessage("파일이 워크스페이스 폴더 안에 있어야 합니다.");
		return;
	}
	const sourcePath = editor.document.uri.fsPath;
	const lang = extToLang(sourcePath);
	if (!lang) {
		vscode.window.showErrorMessage(
			"지원하지 않는 파일 형식입니다. (.cpp / .c / .py / .rs / .go / .java / .js 등만 가능)"
		);
		return;
	}

	let id = problemId;
	if (id === undefined || !Number.isFinite(id)) {
		const raw = await vscode.window.showInputBox({
			title: "AOJ: Attach Problem by ID",
			placeHolder: "1234",
		});
		if (!raw) return;
		id = Number(raw);
		if (!Number.isFinite(id)) {
			vscode.window.showErrorMessage("Invalid problem id");
			return;
		}
	}

	let problem: PublicProblemDetail;
	try {
		problem = await endpoints.getProblem(id);
	} catch (e) {
		vscode.window.showErrorMessage(`문제 fetch 실패: ${(e as Error).message}`);
		return;
	}

	const scPath = sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir());
	const existing = await readSidecar(scPath);
	if (existing && existing.problemId !== id) {
		const choice = await vscode.window.showInformationMessage(
			`이 파일은 이미 #${existing.problemId} ${existing.problemTitle} 에 연결되어 있습니다. #${id} ${problem.title} 로 교체할까요?`,
			{ modal: true },
			"교체"
		);
		if (choice !== "교체") return;
	}

	await syncTestcasesFromExamples(sourcePath, problem.examples);
	await writeSidecar(scPath, {
		version: 1,
		problemId: problem.id,
		contestId,
		problemTitle: problem.title,
		language: lang,
		timeLimit: problem.timeLimit,
		memoryLimit: problem.memoryLimit,
		examples: problem.examples,
		syncedAt: new Date().toISOString(),
	});

	await vscode.commands.executeCommand("aoj.sidebar.refresh");
}
