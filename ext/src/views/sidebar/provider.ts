import * as path from "node:path";
import * as vscode from "vscode";
import type { Endpoints } from "../../api/endpoints";
import {
	getCompileFlags,
	getCompilerPath,
	getSidecarDir,
	getTimeoutMultiplier,
} from "../../config/settings";
import type { LanguageCatalog } from "../../languages/catalog";
import { extToLang } from "../../languages/extToLang";
import { readSidecar, sidecarPath } from "../../mapping/sidecar";
import { listTestcases, readTestcase } from "../../mapping/testcases";
import { CompileCache } from "../../runner/compileCache";
import { type ComputeInputs, computeSidebarState } from "./compute";
import type { HostToWeb, SidebarState, TestcaseView, WebToHost } from "./messages";
import { runStream } from "./runStream";

const SUPPORTED_EXTS = [".c", ".cpp", ".cc", ".cxx", ".h", ".py", ".java", ".go", ".rs", ".js"];

export class AojSidebarProvider implements vscode.WebviewViewProvider, vscode.Disposable {
	public static readonly viewId = "aoj.sidebar";

	private view: vscode.WebviewView | null = null;
	private readonly subs: vscode.Disposable[] = [];

	private readonly perFile = new Map<
		string,
		{
			cases: TestcaseView[];
			submission: SidebarState["submission"];
			compile: SidebarState["compile"];
		}
	>();

	private readonly compileCache = new CompileCache();

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
		this.subs.push(
			vscode.workspace.onDidSaveTextDocument((doc) => {
				this.compileCache.invalidate(doc.uri.fsPath);
				void this.refresh();
			})
		);
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
			if (stored) stored.cases = inputs.cases;
		}

		const state = computeSidebarState(inputs);
		state.submission = stored?.submission ?? null;
		state.compile = stored?.compile ?? { state: "idle" };
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

	async runAll(sourcePath: string): Promise<void> {
		await this.runInternal(sourcePath, undefined);
	}

	async runOne(sourcePath: string, index: number): Promise<void> {
		await this.runInternal(sourcePath, [index]);
	}

	private async runInternal(sourcePath: string, indices: number[] | undefined): Promise<void> {
		const lang = extToLang(sourcePath);
		if (!lang) {
			vscode.window.showErrorMessage("지원하지 않는 파일 형식입니다.");
			return;
		}
		const meta = await this.catalog.get(lang).catch(() => null);
		if (!meta) {
			vscode.window.showErrorMessage(`언어 메타 누락: ${lang}`);
			return;
		}
		const pairs = await listTestcases(sourcePath);
		if (pairs.length === 0) {
			vscode.window.showInformationMessage("실행할 테스트케이스가 없습니다. ＋ 으로 추가하세요.");
			return;
		}

		const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(sourcePath));
		let baseTimeout = 2000;
		if (folder) {
			const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
			if (sc?.timeLimit) baseTimeout = sc.timeLimit;
		}
		const defaultMs = vscode.workspace
			.getConfiguration("aoj")
			.get<number>("defaultRunTimeoutMs", 2000);
		const timeoutMs = Math.floor((baseTimeout || defaultMs) * getTimeoutMultiplier());

		const overrides = {
			compilerPaths: { [lang]: getCompilerPath(lang) ?? meta.compile?.command ?? meta.run.command },
			compileFlags: { [lang]: getCompileFlags(lang) },
		};

		const slot = this.ensureSlot(sourcePath);

		try {
			await runStream(
				{
					sourcePath,
					lang,
					meta,
					pairs,
					indices,
					options: { timeoutMs, overrides },
					cache: this.compileCache,
				},
				{
					compile: (state, message) => {
						slot.compile = { state, message };
						void this.post({ type: "compile", state, message });
					},
					caseStart: (index) => {
						this.updateCase(slot, index, { verdict: "RUNNING" });
						void this.post({ type: "caseStart", index });
					},
					caseDone: (args) => {
						this.updateCase(slot, args.index, {
							verdict: args.verdict,
							actual: args.actual,
							timeMs: args.timeMs,
							memoryKb: args.memoryKb,
							detail: args.detail,
						});
						void this.post({ type: "caseDone", ...args });
					},
				}
			);
		} catch (e) {
			const message = (e as Error).message;
			slot.compile = { state: "error", message };
			void this.post({ type: "compile", state: "error", message });
			vscode.window.showErrorMessage(`Run failed: ${message}`);
		} finally {
			if (slot.compile.state !== "error") slot.compile = { state: "idle" };
		}
	}

	private ensureSlot(sourcePath: string) {
		let slot = this.perFile.get(sourcePath);
		if (!slot) {
			slot = { cases: [], submission: null, compile: { state: "idle" } };
			this.perFile.set(sourcePath, slot);
		}
		return slot;
	}

	private updateCase(
		slot: { cases: TestcaseView[] },
		index: number,
		patch: Partial<TestcaseView>
	): void {
		const i = slot.cases.findIndex((c) => c.index === index);
		if (i >= 0) slot.cases[i] = { ...slot.cases[i], ...patch };
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
