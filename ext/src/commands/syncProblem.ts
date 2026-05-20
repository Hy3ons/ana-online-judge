import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import type { Endpoints, PublicProblemDetail } from "../api/endpoints";
import { getSidecarDir } from "../config/settings";
import { langToExt } from "../languages/extToLang";
import { sidecarPath, writeSidecar } from "../mapping/sidecar";
import { syncTestcasesFromExamples } from "../mapping/testcases";

export async function syncProblemByIdCmd(
	endpoints: Endpoints,
	problemId?: number,
	contestId?: number
): Promise<void> {
	let id = problemId;
	if (id === undefined || !Number.isFinite(id)) {
		const raw = await vscode.window.showInputBox({
			title: "AOJ: Sync Problem by ID",
			placeHolder: "1234",
		});
		if (!raw) return;
		id = Number(raw);
		if (!Number.isFinite(id)) {
			vscode.window.showErrorMessage("Invalid problem id");
			return;
		}
	}

	const folder = vscode.workspace.workspaceFolders?.[0];
	if (!folder) {
		vscode.window.showErrorMessage("워크스페이스 폴더가 열려있어야 합니다.");
		return;
	}

	let problem: PublicProblemDetail;
	try {
		problem = await endpoints.getProblem(id);
	} catch (e) {
		vscode.window.showErrorMessage(`문제 fetch 실패: ${(e as Error).message}`);
		return;
	}

	const langPick = await vscode.window.showQuickPick(
		["cpp", "c", "python", "rust", "go", "java", "javascript"].map((l) => ({
			label: l,
			lang: l,
		})),
		{ title: "언어 선택" }
	);
	if (!langPick) return;
	const ext = langToExt(langPick.lang) ?? ".cpp";

	const safeTitle = problem.title.replace(/[^\w\d가-힣_-]+/g, "_").slice(0, 40);
	const fileName = `p${problem.id}_${safeTitle}${ext}`;
	const sourcePath = path.join(folder.uri.fsPath, fileName);

	// 정책: 기존 파일 prompt 없이 덮어쓰기.
	await fs.writeFile(sourcePath, makeTemplate(langPick.lang), "utf-8");

	await syncTestcasesFromExamples(sourcePath, problem.examples);
	await writeSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()), {
		version: 1,
		problemId: problem.id,
		contestId,
		problemTitle: problem.title,
		language: langPick.lang,
		timeLimit: problem.timeLimit,
		memoryLimit: problem.memoryLimit,
		examples: problem.examples,
		syncedAt: new Date().toISOString(),
	});

	await maybeAddGitignore(folder.uri.fsPath, getSidecarDir());

	await vscode.window.showTextDocument(vscode.Uri.file(sourcePath));
	await vscode.commands.executeCommand("aoj.openStatement");
}

function makeTemplate(lang: string): string {
	switch (lang) {
		case "cpp":
			return `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}\n`;
		case "c":
			return `#include <stdio.h>\n\nint main(void) {\n    return 0;\n}\n`;
		case "python":
			return `import sys\ninput = sys.stdin.readline\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`;
		case "rust":
			return `use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n}\n`;
		case "go":
			return `package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    _ = reader\n    _ = fmt.Println\n}\n`;
		case "java":
			return `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n    }\n}\n`;
		case "javascript":
			return `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');\n`;
		default:
			return "";
	}
}

async function maybeAddGitignore(root: string, dir: string): Promise<void> {
	const gi = path.join(root, ".gitignore");
	let text = "";
	try {
		text = await fs.readFile(gi, "utf-8");
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== "ENOENT") return;
	}
	const entry = `${dir}/`;
	if (text.split("\n").some((l) => l.trim() === entry || l.trim() === dir)) return;
	const next = `${text}${text.endsWith("\n") || text === "" ? "" : "\n"}${entry}\n`;
	try {
		await fs.writeFile(gi, next, "utf-8");
	} catch {
		/* best-effort */
	}
}
