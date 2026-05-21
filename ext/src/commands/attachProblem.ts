import * as vscode from "vscode";
import type { Endpoints, PublicProblemDetail } from "../api/endpoints";
import { getSidecarDir } from "../config/settings";
import { extToLang } from "../languages/extToLang";
import { readSidecar, sidecarPath, writeSidecar } from "../mapping/sidecar";
import { syncTestcasesFromExamples } from "../mapping/testcases";

function problemTypeLabel(type: string): string {
	switch (type) {
		case "anigma":
			return "Anigma (입력 추론)";
		case "interactive":
			return "인터랙티브";
		default:
			return type;
	}
}

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
			title: "AOJ: 문제 번호로 연결",
			placeHolder: "1234",
		});
		if (!raw) return;
		id = Number(raw);
		if (!Number.isFinite(id)) {
			vscode.window.showErrorMessage("올바르지 않은 문제 번호입니다.");
			return;
		}
	}

	let problem: PublicProblemDetail;
	try {
		problem = await endpoints.getProblem(id);
	} catch (e) {
		vscode.window.showErrorMessage(`문제 정보를 가져오지 못했습니다: ${(e as Error).message}`);
		return;
	}

	// Local sanity-check only supports ICPC (stdin/stdout compare) and Special Judge
	// (checker is server-side, so local stdout-vs-expected still gives a rough signal).
	// Anigma / interactive problems need server-only judging — warn the user.
	if (problem.problemType !== "icpc" && problem.problemType !== "special_judge") {
		const typeLabel = problemTypeLabel(problem.problemType);
		const choice = await vscode.window.showWarningMessage(
			`이 문제는 ${typeLabel} 형식입니다. 로컬 실행으로는 채점기와 다른 결과가 나올 수 있습니다. 계속 연결할까요?`,
			{ modal: true },
			"계속"
		);
		if (choice !== "계속") return;
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
