import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { restoreSnapshot, type Snapshot, takeSnapshot } from "../../../webview/shared/undoSnapshot";
import type { Endpoints } from "../../api/endpoints";
import { iterSse } from "../../api/sse";
import {
	listTestcases,
	nextIndex,
	readTestcase,
	removeTestcase,
	writeTestcase,
} from "../../mapping/testcases";
import type { CaseRun } from "../../runner/runner";
import {
	type ExtToWeb,
	emptyCase,
	type SerializedCase,
	serializeCase,
	type WebToExt,
} from "./messages";

let panel: vscode.WebviewPanel | null = null;
let lastCases = new Map<number, CaseRun>();
let sourceFilePath: string | null = null;
let pendingSnapshots = new Map<number, Snapshot>();

function ensurePanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
	if (panel) return panel;
	panel = vscode.window.createWebviewPanel(
		"aoj.results",
		"AOJ — Results",
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "dist"))],
		}
	);
	panel.webview.html = renderShell(context, panel.webview);
	panel.webview.onDidReceiveMessage((m: WebToExt) => handle(m));
	panel.onDidDispose(() => {
		panel = null;
		lastCases = new Map();
		sourceFilePath = null;
		pendingSnapshots = new Map();
	});
	return panel;
}

function renderShell(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	const dist = vscode.Uri.file(path.join(context.extensionPath, "dist", "webview"));
	const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "results.js"));
	const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "styles.css"));
	const csp = [
		"default-src 'none'",
		`style-src ${webview.cspSource} 'unsafe-inline'`,
		`script-src ${webview.cspSource}`,
		`font-src ${webview.cspSource}`,
	].join("; ");
	return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${cssUri}">
</head>
<body><div id="root"></div><script src="${jsUri}"></script></body>
</html>`;
}

function post(msg: ExtToWeb): void {
	panel?.webview.postMessage(msg);
}

async function handle(m: WebToExt): Promise<void> {
	if (!panel || !sourceFilePath) return;
	switch (m.type) {
		case "ready":
			void sendAllCases();
			return;
		case "openDiff":
			void openDiffInEditor(m.index);
			return;
		case "runAll":
			void vscode.commands.executeCommand("aoj.runAll");
			return;
		case "submit":
			void vscode.commands.executeCommand("aoj.submit");
			return;
		case "openStatement":
			void vscode.commands.executeCommand("aoj.openStatement");
			return;
		case "addCase":
			void addCase();
			return;
		case "editCase":
			void editCase(m.index, m.input, m.output);
			return;
		case "removeCase":
			void removeCaseWithUndo(m.index);
			return;
		case "undoRemove":
			void undoRemove(m.index);
			return;
	}
}

async function sendAllCases(): Promise<void> {
	if (!sourceFilePath) return;
	const pairs = await listTestcases(sourceFilePath);
	const cases: SerializedCase[] = [];
	for (const p of pairs) {
		const tc = await readTestcase(p);
		cases.push(emptyCase(p.index, tc.input, tc.output));
	}
	post({ type: "cases", cases });
}

async function addCase(): Promise<void> {
	if (!sourceFilePath) return;
	const pairs = await listTestcases(sourceFilePath);
	const idx = nextIndex(pairs);
	await writeTestcase(sourceFilePath, idx, "", "");
	post({ type: "case", index: idx, case: emptyCase(idx, "", "") });
}

async function editCase(index: number, input?: string, output?: string): Promise<void> {
	if (!sourceFilePath) return;
	const dir = path.dirname(sourceFilePath);
	const base = path.basename(sourceFilePath, path.extname(sourceFilePath));
	try {
		if (input !== undefined) {
			await fs.writeFile(path.join(dir, `${base}_${index}.in`), input, "utf-8");
		}
		if (output !== undefined) {
			await fs.writeFile(path.join(dir, `${base}_${index}.out`), output, "utf-8");
		}
	} catch (e) {
		post({ type: "saveError", index, message: (e as Error).message });
	}
}

async function removeCaseWithUndo(index: number): Promise<void> {
	if (!sourceFilePath) return;
	const pairs = await listTestcases(sourceFilePath);
	const pair = pairs.find((p) => p.index === index);
	if (!pair) return;
	const tc = await readTestcase(pair);
	pendingSnapshots.set(index, takeSnapshot(index, tc.input, tc.output));
	await removeTestcase(pair);
	post({ type: "removeCase", index });
	post({ type: "toast", kind: "removed", index, message: `테스트케이스 #${index} 삭제됨` });
}

async function undoRemove(index: number): Promise<void> {
	if (!sourceFilePath) return;
	const snap = pendingSnapshots.get(index);
	if (!snap) return;
	pendingSnapshots.delete(index);
	const src = sourceFilePath;
	await restoreSnapshot(snap, async (i, input, output) => {
		await writeTestcase(src, i, input, output);
	});
	post({ type: "case", index, case: emptyCase(index, snap.input, snap.output) });
}

async function openDiffInEditor(index: number): Promise<void> {
	const c = lastCases.get(index);
	if (!c) return;
	const expectedDoc = await vscode.workspace.openTextDocument({
		content: c.expected,
		language: "plaintext",
	});
	const actualDoc = await vscode.workspace.openTextDocument({
		content: c.stdout,
		language: "plaintext",
	});
	await vscode.commands.executeCommand(
		"vscode.diff",
		expectedDoc.uri,
		actualDoc.uri,
		`Diff — testcase #${index}`
	);
}

// --- exported API (callers in commands/) ---

export function beginRun(
	context: vscode.ExtensionContext,
	title: string,
	problemId?: number,
	sourcePath?: string
): void {
	const p = ensurePanel(context);
	p.reveal(vscode.ViewColumn.Beside);
	lastCases = new Map();
	sourceFilePath = sourcePath ?? sourceFilePath;
	post({ type: "header", title, problemId, hasSidecar: problemId !== undefined });
}

export function updateCase(case_: CaseRun): void {
	lastCases.set(case_.testcase.index, case_);
	post({ type: "case", case: serializeCase(case_), index: case_.testcase.index });
}

export function finishRun(): void {
	const total = lastCases.size;
	const passed = [...lastCases.values()].filter((c) => c.verdict.kind === "passed").length;
	post({ type: "done", summary: { passed, total } });
}

export function beginSubmission(
	context: vscode.ExtensionContext,
	title: string,
	problemId: number,
	sourcePath: string
): void {
	const p = ensurePanel(context);
	p.reveal(vscode.ViewColumn.Beside);
	lastCases = new Map();
	sourceFilePath = sourcePath;
	post({ type: "header", title, problemId, hasSidecar: true });
	post({ type: "submission", verdict: "Pending", finished: false });
}

export async function pumpSubmissionStream(
	endpoints: Endpoints,
	submissionId: number,
	response: Response,
	signal?: AbortSignal
): Promise<void> {
	for await (const ev of iterSse(response, signal)) {
		if (signal?.aborted) return;
		if (ev.event === "connected") {
			post({ type: "submission", verdict: "Pending", finished: false });
		} else if (ev.event === "progress") {
			post({ type: "submission", verdict: "Judging", finished: false });
		} else if (ev.event === "complete") {
			try {
				const detail = await endpoints.getMySubmission(submissionId);
				post({ type: "submission", verdict: detail.verdict, finished: true });
			} catch {
				post({ type: "submission", verdict: "Done", finished: true });
			}
			return;
		}
	}
}

/** Allow callers (commands) to set the bound source file when opening panel manually. */
export function bindSource(sourcePath: string): void {
	sourceFilePath = sourcePath;
}
