import * as path from "node:path";
import * as vscode from "vscode";
import type { Endpoints } from "../../api/endpoints";
import { getSidecarDir } from "../../config/settings";
import type { LanguageCatalog } from "../../languages/catalog";
import { extToLang } from "../../languages/extToLang";
import { readSidecar, sidecarPath } from "../../mapping/sidecar";
import { listTestcases, readTestcase } from "../../mapping/testcases";
import { type ComputeInputs, computeSidebarState } from "./compute";
import type { HostToWeb, SidebarState, TestcaseView, WebToHost } from "./messages";

const SUPPORTED_EXTS = [".c", ".cpp", ".cc", ".cxx", ".h", ".py", ".java", ".go", ".rs", ".js"];

export class AojSidebarProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	public static readonly viewId = "aoj.sidebar";

	private view: vscode.WebviewView | null = null;
	private readonly subs: vscode.Disposable[] = [];

	private readonly perFile = new Map<
		string,
		{ cases: TestcaseView[]; submission: SidebarState["submission"] }
	>();

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly endpoints: Endpoints,
		private readonly catalog: LanguageCatalog,
		private readonly getUsername: () => string | null
	) {
		// endpoints is used by Tasks 8-10 (run/submit). Reference here keeps the
		// field from being flagged as unused while scaffolding.
		void this.endpoints;
	}

	dispose(): void {
		for (const d of this.subs) d.dispose();
	}

	resolveWebviewView(view: vscode.WebviewView): void {
		this.view = view;
		view.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "dist"))],
		};
		view.webview.html = this.renderShell(view.webview);
		this.subs.push(view.webview.onDidReceiveMessage((m: WebToHost) => this.handle(m)));
		this.subs.push(vscode.window.onDidChangeActiveTextEditor(() => void this.refresh()));
		this.subs.push(vscode.workspace.onDidSaveTextDocument(() => void this.refresh()));
		this.subs.push(view.onDidChangeVisibility(() => view.visible && void this.refresh()));
	}

	async refresh(): Promise<void> {
		if (!this.view) return;
		const state = await this.computeState();
		await this.post({ type: "state", payload: state });
	}

	private async post(msg: HostToWeb): Promise<void> {
		if (!this.view) return;
		await this.view.webview.postMessage(msg);
	}

	private async handle(m: WebToHost): Promise<void> {
		switch (m.type) {
			case "ready":
				await this.refresh();
				return;
			case "command":
				await vscode.commands.executeCommand(m.cmd);
				return;
			case "dismissSignInBanner":
				await this.context.globalState.update("aoj.dismissSignInBanner", true);
				await this.refresh();
				return;
			default:
				return;
		}
	}

	private async computeState(): Promise<SidebarState> {
		const editor = vscode.window.activeTextEditor;
		const username = this.getUsername();
		const signedIn = username !== null;
		const dismissSignInBanner =
			this.context.globalState.get<boolean>("aoj.dismissSignInBanner", false) ||
			vscode.workspace.getConfiguration("aoj").get<boolean>("dismissSignInBanner", false);

		const inputs: ComputeInputs = {
			signedIn,
			username,
			dismissSignInBanner,
			supportedExtensions: SUPPORTED_EXTS,
			activeFile: null,
			languageLabel: null,
			linked: null,
			cases: [],
		};

		if (!editor) return computeSidebarState(inputs);

		const sourcePath = editor.document.uri.fsPath;
		const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
		const ext = path.extname(sourcePath).toLowerCase();
		inputs.activeFile = { basename: path.basename(sourcePath), ext };

		const lang = extToLang(sourcePath);
		if (!lang) return computeSidebarState(inputs);

		const meta = await this.catalog.get(lang).catch(() => null);
		inputs.languageLabel = meta?.displayName ?? lang;

		if (folder) {
			const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
			if (sc) {
				inputs.linked = {
					problemId: sc.problemId,
					problemTitle: sc.problemTitle,
					timeLimitMs: sc.timeLimit,
					memoryLimitMb: sc.memoryLimit,
					contestId: sc.contestId,
				};
			}
		}

		const stored = this.perFile.get(sourcePath);
		if (stored?.cases?.length) {
			inputs.cases = stored.cases;
		} else {
			inputs.cases = await this.loadCasesFromDisk(sourcePath);
		}

		const state = computeSidebarState(inputs);
		state.submission = stored?.submission ?? null;
		return state;
	}

	private async loadCasesFromDisk(sourcePath: string): Promise<TestcaseView[]> {
		const pairs = await listTestcases(sourcePath);
		const out: TestcaseView[] = [];
		for (const p of pairs) {
			const tc = await readTestcase(p);
			out.push({ index: p.index, input: tc.input, expected: tc.output });
		}
		return out;
	}

	private renderShell(webview: vscode.Webview): string {
		const dist = vscode.Uri.file(path.join(this.context.extensionPath, "dist", "webview"));
		const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "sidebar.js"));
		const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(dist, "styles.css"));
		const csp = [
			"default-src 'none'",
			`style-src ${webview.cspSource} 'unsafe-inline'`,
			`script-src ${webview.cspSource}`,
			`font-src ${webview.cspSource}`,
		].join("; ");
		return `<!doctype html><html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${cssUri}">
</head><body><div id="root"></div><script src="${jsUri}"></script></body></html>`;
	}
}
