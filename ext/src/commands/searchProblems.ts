import * as vscode from "vscode";
import type { Endpoints } from "../api/endpoints";

export async function searchProblemsCmd(endpoints: Endpoints): Promise<void> {
	const q = await vscode.window.showInputBox({
		title: "AOJ: Search Problems",
		placeHolder: "키워드 또는 문제 번호",
	});
	if (!q) return;
	let items: { id: number; title: string }[];
	try {
		const r = await endpoints.searchProblems(q, 30);
		items = r.problems.map((p) => ({ id: p.id, title: p.title }));
	} catch (e) {
		vscode.window.showErrorMessage(`검색 실패: ${(e as Error).message}`);
		return;
	}
	if (items.length === 0) {
		vscode.window.showInformationMessage("결과 없음");
		return;
	}
	const pick = await vscode.window.showQuickPick(
		items.map((it) => ({ label: `#${it.id} ${it.title}`, id: it.id })),
		{ title: `${items.length}개 결과 — 클릭해 sync` }
	);
	if (pick) await vscode.commands.executeCommand("aoj.attachProblemById", pick.id);
}
