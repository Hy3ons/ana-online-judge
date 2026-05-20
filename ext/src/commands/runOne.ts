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
import { compileIfNeeded, runCase } from "../runner/runner";
import { beginRun, finishRun, updateCase } from "../webview/results/panel";

export async function runOneCmd(
	context: vscode.ExtensionContext,
	catalog: LanguageCatalog,
	indexArg?: number
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;
	const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
	if (!folder) return;
	const sourcePath = editor.document.uri.fsPath;
	const lang = extToLang(sourcePath);
	if (!lang) return;
	const meta = await catalog.get(lang);
	if (!meta) return;
	const tcs = await listTestcases(sourcePath);
	let idx = indexArg;
	if (idx == null) {
		const pick = await vscode.window.showQuickPick(
			tcs.map((t) => ({ label: `#${t.index}`, idx: t.index })),
			{ title: "테스트케이스 선택" }
		);
		if (!pick) return;
		idx = pick.idx;
	}
	const tc = tcs.find((t) => t.index === idx);
	if (!tc) return;
	const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
	const timeoutMs = Math.floor((sc?.timeLimit ?? 2000) * getTimeoutMultiplier());

	beginRun(context, `Run #${idx} — ${vscode.workspace.asRelativePath(sourcePath)}`, sc?.problemId);
	const compile = await compileIfNeeded(sourcePath, meta, {
		timeoutMs,
		overrides: {
			compilerPaths: { [lang]: getCompilerPath(lang) ?? meta.compile?.command ?? meta.run.command },
			compileFlags: { [lang]: getCompileFlags(lang) },
		},
	});
	if (!compile.ok) {
		updateCase({
			testcase: tc,
			verdict: { kind: "compile_error", message: compile.message },
			stdout: "",
			stderr: compile.message,
			expected: "",
			input: "",
		});
		finishRun();
		return;
	}
	const c = await runCase(compile, meta, tc, { timeoutMs });
	updateCase(c);
	finishRun();
}
