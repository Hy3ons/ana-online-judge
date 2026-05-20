import * as vscode from "vscode";
import {
	getCompileFlags,
	getCompilerPath,
	getSidecarDir,
	getTimeoutMultiplier,
} from "../config/settings";
import type { LanguageCatalog } from "../languages/catalog";
import { extToLang } from "../languages/extToLang";
import { readSidecar, sidecarPath } from "../mapping/sidecar";
import { listTestcases } from "../mapping/testcases";
import { runAll } from "../runner/runner";
import { beginRun, finishRun, updateCase } from "../webview/results/panel";

export async function runAllCmd(
	context: vscode.ExtensionContext,
	catalog: LanguageCatalog
): Promise<void> {
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
	const sourcePath = editor.document.uri.fsPath;
	const lang = extToLang(sourcePath);
	if (!lang) {
		vscode.window.showErrorMessage("지원하지 않는 파일 형식입니다.");
		return;
	}
	const meta = await catalog.get(lang);
	if (!meta) {
		vscode.window.showErrorMessage(`언어 메타 누락: ${lang}`);
		return;
	}
	const tcs = await listTestcases(sourcePath);
	if (tcs.length === 0) {
		vscode.window.showInformationMessage(
			"실행할 테스트케이스가 없습니다. Add Testcase 로 추가하세요."
		);
		return;
	}
	const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
	const baseTimeout = sc?.timeLimit ?? 2000;
	const timeoutMs = Math.floor(baseTimeout * getTimeoutMultiplier());

	beginRun(context, `Run All — ${vscode.workspace.asRelativePath(sourcePath)}`, sc?.problemId);

	const overrides = {
		compilerPaths: { [lang]: getCompilerPath(lang) ?? meta.compile?.command ?? meta.run.command },
		compileFlags: { [lang]: getCompileFlags(lang) },
	};
	const { compile, cases } = await runAll(sourcePath, meta, tcs, { timeoutMs, overrides });
	for (const c of cases) updateCase(c);
	finishRun();
	if (!compile.ok) {
		vscode.window.showErrorMessage(`Compile error: ${compile.message.split("\n")[0]}`);
	}
}
