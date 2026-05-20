import * as path from "node:path";
import * as vscode from "vscode";
import type { Endpoints } from "../../api/endpoints";
import { iterSse } from "../../api/sse";
import type { CaseRun } from "../../runner/runner";
import { type ExtToWeb, serializeCase, type WebToExt } from "./messages";

let panel: vscode.WebviewPanel | null = null;
let lastCases = new Map<number, CaseRun>();

function ensurePanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
	if (panel) return panel;
	panel = vscode.window.createWebviewPanel(
		"aoj.results",
		"AOJ — Results",
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(context.extensionPath, "media")),
				vscode.Uri.file(path.join(context.extensionPath, "dist", "webview")),
			],
		}
	);
	panel.webview.html = renderShell(context, panel.webview);
	panel.webview.onDidReceiveMessage((m: WebToExt) => {
		if (m.type === "openDiff") openDiffInEditor(m.index);
	});
	panel.onDidDispose(() => {
		panel = null;
		lastCases = new Map();
	});
	return panel;
}

function renderShell(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	const cssUri = webview.asWebviewUri(
		vscode.Uri.file(path.join(context.extensionPath, "media", "results.css"))
	);
	const jsUri = webview.asWebviewUri(
		vscode.Uri.file(path.join(context.extensionPath, "dist", "webview", "results.js"))
	);
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

export function beginRun(
	context: vscode.ExtensionContext,
	title: string,
	problemId?: number
): void {
	const p = ensurePanel(context);
	p.reveal(vscode.ViewColumn.Beside);
	lastCases = new Map();
	post({ type: "header", title, problemId });
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

// Submit-mode interop ---------------------------------

export function beginSubmission(
	context: vscode.ExtensionContext,
	title: string,
	problemId: number
): void {
	const p = ensurePanel(context);
	p.reveal(vscode.ViewColumn.Beside);
	lastCases = new Map();
	post({ type: "header", title, problemId });
	post({ type: "submission", verdict: "Pending", finished: false });
}

/**
 * Consume the SSE stream from /api/v1/user/submissions/:id/stream.
 *
 * Server emits:
 *   - event: connected  data: {submissionId}      → "Pending"
 *   - event: progress   data: {percentage}        → "Judging…"
 *   - event: complete   data: {submissionId}      → re-fetch detail via REST, render final
 *   - heartbeat comments are silently absorbed
 *
 * Returns when the stream ends or the signal aborts.
 */
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
