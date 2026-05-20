import * as path from "node:path";
import * as vscode from "vscode";
import type { PublicProblemDetail } from "../../api/endpoints";
import { renderMarkdownToHtml } from "./render";

const panels = new Map<number, vscode.WebviewPanel>();

export function showStatement(
	context: vscode.ExtensionContext,
	endpoint: string,
	problem: PublicProblemDetail
): void {
	const existing = panels.get(problem.id);
	if (existing) {
		existing.reveal(vscode.ViewColumn.Beside);
		existing.webview.html = renderHtml(context, existing.webview, endpoint, problem);
		return;
	}
	const panel = vscode.window.createWebviewPanel(
		"aoj.statement",
		`AOJ #${problem.id}`,
		vscode.ViewColumn.Beside,
		{
			enableScripts: false,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
		}
	);
	panel.webview.html = renderHtml(context, panel.webview, endpoint, problem);
	panel.onDidDispose(() => panels.delete(problem.id));
	panels.set(problem.id, panel);
}

function renderHtml(
	context: vscode.ExtensionContext,
	webview: vscode.Webview,
	endpoint: string,
	problem: PublicProblemDetail
): string {
	const cssUri = webview.asWebviewUri(
		vscode.Uri.file(path.join(context.extensionPath, "media", "statement.css"))
	);
	const cspSource = webview.cspSource;
	const origin = new URL(endpoint).origin;
	const csp = [
		`default-src 'none'`,
		`style-src ${cspSource} 'unsafe-inline'`,
		`img-src ${cspSource} ${origin} https: data:`,
		`font-src ${cspSource}`,
	].join("; ");

	const body = renderMarkdownToHtml(problem.content ?? "");
	const meta = `
    <div class="meta">
      <span class="badge">#${problem.id}</span>
      <span class="lim">${problem.timeLimit} ms · ${problem.memoryLimit} MB</span>
    </div>`;
	return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${cssUri}">
<title>${escapeHtml(problem.title)}</title>
</head>
<body>
${meta}
<h1>${escapeHtml(problem.title)}</h1>
${body}
<footer>로컬 실행은 사용자 OS에서 수행되며 AOJ 채점 환경(isolate)과 다를 수 있습니다.</footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
