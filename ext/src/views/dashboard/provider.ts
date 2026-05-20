import * as path from "node:path";
import * as vscode from "vscode";
import { UnauthorizedError } from "../../api/client";
import type { Endpoints } from "../../api/endpoints";
import { getSidecarDir } from "../../config/settings";
import { readSidecar, sidecarPath } from "../../mapping/sidecar";
import type { DashState, DashToHost, HostToDash } from "./messages";

const REFRESH_CONTEST_MS = 60_000;
const REFRESH_SUBMISSIONS_MS = 30_000;

export class DashboardProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	public static readonly viewId = "aoj.dashboard";

	private view: vscode.WebviewView | null = null;
	private contestTimer: NodeJS.Timeout | null = null;
	private subsTimer: NodeJS.Timeout | null = null;
	private editorSub: vscode.Disposable | null = null;
	private saveSub: vscode.Disposable | null = null;
	private visibleSub: vscode.Disposable | null = null;
	private readonly disposed: vscode.Disposable[] = [];

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly endpoints: Endpoints,
		private readonly getUsername: () => string | null
	) {}

	dispose(): void {
		this.stopPolling();
		this.editorSub?.dispose();
		this.saveSub?.dispose();
		this.visibleSub?.dispose();
		for (const d of this.disposed) d.dispose();
	}

	resolveWebviewView(view: vscode.WebviewView): void {
		this.view = view;
		view.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "dist"))],
		};
		view.webview.html = this.renderShell(view.webview);

		view.webview.onDidReceiveMessage((m: DashToHost) => this.handle(m));

		this.editorSub = vscode.window.onDidChangeActiveTextEditor(() => void this.refresh());
		this.saveSub = vscode.workspace.onDidSaveTextDocument(() => void this.refresh());
		this.visibleSub = view.onDidChangeVisibility(() => {
			if (view.visible) {
				this.startPolling();
				void this.refresh();
			} else {
				this.stopPolling();
			}
		});

		if (view.visible) this.startPolling();
	}

	/** Called by extension.ts on auth changes / external refresh. */
	async refresh(): Promise<void> {
		if (!this.view) return;
		const state = await this.computeState();
		const msg: HostToDash = { type: "state", payload: state };
		await this.view.webview.postMessage(msg);
	}

	private async handle(m: DashToHost): Promise<void> {
		switch (m.type) {
			case "ready":
				await this.refresh();
				return;
			case "signIn":
				await vscode.commands.executeCommand("aoj.signIn");
				return;
			case "command":
				await vscode.commands.executeCommand(m.cmd);
				return;
			case "openSubmission": {
				const endpoint = vscode.workspace
					.getConfiguration("aoj")
					.get<string>("endpoint", "https://aoj.example.com");
				const url = `${endpoint.replace(/\/$/, "")}/submissions/${m.submissionId}`;
				await vscode.env.openExternal(vscode.Uri.parse(url));
				return;
			}
			case "refresh":
				await this.refresh();
				return;
		}
	}

	private async computeState(): Promise<DashState> {
		const username = this.getUsername();
		const signedIn = username !== null;

		const currentProblem = await this.resolveCurrentProblem();

		let activeContest: DashState["activeContest"] = null;
		let recentSubmissions: DashState["recentSubmissions"] = [];
		if (signedIn) {
			try {
				const { contests } = await this.endpoints.activeContests();
				const running = contests
					.filter((c) => c.status === "running")
					.sort((a, b) => Date.parse(a.endTime) - Date.parse(b.endTime));
				if (running[0]) {
					activeContest = {
						id: running[0].id,
						title: running[0].title,
						endsAtIso: running[0].endTime,
					};
				}
			} catch {
				/* tolerate */
			}
			try {
				const { submissions } = await this.endpoints.listMySubmissions(1, 10);
				recentSubmissions = submissions.map((s) => ({
					id: s.id,
					problemId: s.problemId,
					problemTitle: s.problemTitle,
					verdict: s.verdict,
					createdAtIso: s.createdAt,
				}));
			} catch (e) {
				if (!(e instanceof UnauthorizedError)) {
					/* tolerate other errors */
				}
			}
		}

		return { signedIn, username, currentProblem, activeContest, recentSubmissions };
	}

	private async resolveCurrentProblem(): Promise<DashState["currentProblem"]> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return null;
		const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
		if (!folder) return null;
		const sc = await readSidecar(
			sidecarPath(folder.uri.fsPath, editor.document.uri.fsPath, getSidecarDir())
		);
		if (!sc) return null;
		return {
			problemId: sc.problemId,
			title: sc.problemTitle,
			timeLimit: sc.timeLimit,
			memoryLimit: sc.memoryLimit,
			fileName: path.basename(editor.document.uri.fsPath),
		};
	}

	private startPolling(): void {
		if (this.contestTimer) return;
		this.contestTimer = setInterval(() => void this.refresh(), REFRESH_CONTEST_MS);
		this.subsTimer = setInterval(() => void this.refresh(), REFRESH_SUBMISSIONS_MS);
	}
	private stopPolling(): void {
		if (this.contestTimer) clearInterval(this.contestTimer);
		if (this.subsTimer) clearInterval(this.subsTimer);
		this.contestTimer = null;
		this.subsTimer = null;
	}

	private renderShell(webview: vscode.Webview): string {
		const dist = vscode.Uri.file(path.join(this.context.extensionPath, "dist", "webview"));
		const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "dashboard.js"));
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
}
