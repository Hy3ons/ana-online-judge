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
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "dist"))],
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
	const dist = vscode.Uri.file(path.join(context.extensionPath, "dist", "webview"));
	const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "statement.js"));
	const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "styles.css"));
	const origin = new URL(endpoint).origin;
	const csp = [
		"default-src 'none'",
		`style-src ${webview.cspSource} 'unsafe-inline'`,
		`script-src ${webview.cspSource}`,
		`img-src ${webview.cspSource} ${origin} https: data:`,
		`font-src ${webview.cspSource}`,
	].join("; ");

	const body = renderMarkdownToHtml(problem.content ?? "");
	const escapedTitle = problem.title.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
	const externalUrl = `${endpoint.replace(/\/$/, "")}/problems/${problem.id}`;

	return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${cssUri}">
<title>${escapedTitle}</title>
</head>
<body>
<div id="root">
  <header class="sticky top-0 z-10 bg-bg-elev border-b border-border px-5 py-3 flex items-center gap-3">
    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-badge text-badge-fg">#${problem.id}</span>
    <h1 class="flex-1 text-base font-semibold truncate m-0">${escapedTitle}</h1>
    <span class="text-xs text-fg-muted">${problem.timeLimit} ms · ${problem.memoryLimit} MB</span>
    <a href="${externalUrl}" target="_blank" rel="noopener" class="text-xs text-accent hover:underline">Open in browser ↗</a>
  </header>
  <article class="aoj-md px-6 py-5 max-w-[920px] mx-auto">${body}</article>
  <footer class="px-6 py-4 text-xs text-fg-muted border-t border-border">
    로컬 실행은 사용자 OS에서 수행되며 AOJ 채점 환경(isolate)과 다를 수 있습니다.
  </footer>
</div>
<script src="${jsUri}"></script>
</body></html>`;
}
