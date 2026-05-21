import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { restoreSnapshot, type Snapshot, takeSnapshot } from "../../../webview/shared/undoSnapshot";
import { UnauthorizedError } from "../../api/client";
import type { Endpoints } from "../../api/endpoints";
import {
	getCompileFlags,
	getCompilerPath,
	getConfirmSubmit,
	getSidecarDir,
	getTimeoutMultiplier,
} from "../../config/settings";
import type { LanguageCatalog } from "../../languages/catalog";
import { extToLang } from "../../languages/extToLang";
import { readSidecar, removeSidecar, sidecarPath } from "../../mapping/sidecar";
import {
	removeTestcase as fsRemoveTestcase,
	listTestcases,
	readTestcase,
	writeTestcase,
} from "../../mapping/testcases";
import { CompileCache } from "../../runner/compileCache";
import { type ComputeInputs, computeSidebarState } from "./compute";
import type { HostToWeb, SidebarState, TestcaseView, WebToHost } from "./messages";
import { runStream } from "./runStream";
import { submitStream } from "./submitStream";

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
	private submitController: AbortController | null = null;
	private readonly pendingRemoves = new Map<string, Map<number, Snapshot>>();

	private pendingFor(sourcePath: string): Map<number, Snapshot> {
		let m = this.pendingRemoves.get(sourcePath);
		if (!m) {
			m = new Map();
			this.pendingRemoves.set(sourcePath, m);
		}
		return m;
	}

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly endpoints: Endpoints,
		private readonly catalog: LanguageCatalog,
		private readonly getUsername: () => string | null
	) {}

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
		const editor = vscode.window.activeTextEditor;
		const sourcePath = editor?.document.uri.fsPath ?? null;
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
			case "runCase":
				if (sourcePath) await this.runOne(sourcePath, m.index);
				return;
			case "editCase":
				if (sourcePath) await this.editCase(sourcePath, m.index, m.input, m.expected);
				return;
			case "removeCase":
				if (sourcePath) await this.removeCaseWithUndo(sourcePath, m.index);
				return;
			case "undoRemove":
				if (sourcePath) await this.undoRemove(sourcePath, m.index);
				return;
			case "unlink":
				if (sourcePath) await this.unlinkProblem(sourcePath);
				return;
			case "openSubmission": {
				const endpoint = vscode.workspace
					.getConfiguration("aoj")
					.get<string>("endpoint", "https://aoj.example.com");
				const url = `${endpoint.replace(/\/$/, "")}/submissions/${m.submissionId}`;
				await vscode.env.openExternal(vscode.Uri.parse(url));
				return;
			}
			case "searchQuery":
				await this.runSearch(m.q);
				return;
			case "searchClose":
				return;
			case "attachSearchResult":
				await vscode.commands.executeCommand("aoj.attachProblemById", m.problemId);
				return;
		}
	}

	openSearch(): void {
		void this.post({ type: "searchOpen" });
	}

	private searchSeq = 0;

	private async runSearch(q: string): Promise<void> {
		const seq = ++this.searchSeq;
		const query = q.trim();
		if (!query) {
			await this.post({ type: "searchResults", q: query, problems: [] });
			return;
		}
		try {
			const r = await this.endpoints.searchProblems(query, 30);
			if (seq !== this.searchSeq) return;
			await this.post({
				type: "searchResults",
				q: query,
				problems: r.problems.map((p) => ({ id: p.id, title: p.title, tier: p.tier })),
			});
		} catch (e) {
			if (seq !== this.searchSeq) return;
			await this.post({
				type: "searchResults",
				q: query,
				problems: [],
				error: (e as Error).message,
			});
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

	async startSubmit(sourcePath: string): Promise<void> {
		const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(sourcePath));
		if (!folder) {
			vscode.window.showErrorMessage("파일이 워크스페이스 밖에 있습니다.");
			return;
		}
		const sc = await readSidecar(sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir()));
		if (!sc) {
			vscode.window.showErrorMessage("이 파일은 AOJ 문제와 연결되지 않았습니다. Attach 먼저.");
			return;
		}
		if (getConfirmSubmit()) {
			const pick = await vscode.window.showInformationMessage(
				`#${sc.problemId} ${sc.problemTitle} 에 ${sc.language} 로 제출할까요?`,
				{ modal: true },
				"제출"
			);
			if (pick !== "제출") return;
		}
		const code = await fs.readFile(sourcePath, "utf-8");
		let submissionId: number;
		try {
			const r = await this.endpoints.submit({
				problemId: sc.problemId,
				code,
				language: sc.language,
				contestId: sc.contestId,
			});
			submissionId = r.submissionId;
		} catch (e) {
			if (e instanceof UnauthorizedError) {
				vscode.window.showErrorMessage("로그인이 필요합니다.");
				return;
			}
			vscode.window.showErrorMessage(`제출 실패: ${(e as Error).message}`);
			return;
		}

		const slot = this.ensureSlot(sourcePath);
		slot.submission = {
			submissionId,
			problemId: sc.problemId,
			state: "running",
			pass: 0,
			total: 0,
		};
		await this.post({ type: "submissionStart", submissionId, problemId: sc.problemId });

		this.submitController = new AbortController();
		try {
			const res = await this.endpoints.submissionStream(submissionId, this.submitController.signal);
			await submitStream(res, this.submitController.signal, {
				progress: ({ verdict, pass, total }) => {
					if (slot.submission) {
						slot.submission.verdict = verdict;
						slot.submission.pass = pass;
						slot.submission.total = total;
					}
					void this.post({ type: "submissionProgress", verdict, pass, total });
				},
				done: ({ verdict, pass, total }) => {
					const iso = new Date().toISOString();
					if (slot.submission) {
						slot.submission.state = "done";
						slot.submission.verdict = verdict;
						slot.submission.pass = pass;
						slot.submission.total = total;
						slot.submission.finishedAtIso = iso;
					}
					void this.post({ type: "submissionDone", verdict, pass, total, finishedAtIso: iso });
				},
				error: (m) => vscode.window.showErrorMessage(`Submission stream error: ${m}`),
			});
		} finally {
			this.submitController = null;
		}
	}

	private async editCase(
		sourcePath: string,
		index: number,
		input: string,
		expected: string
	): Promise<void> {
		try {
			await writeTestcase(sourcePath, index, input, expected);
			const slot = this.ensureSlot(sourcePath);
			this.updateCase(slot, index, { input, expected });
			await this.refresh();
		} catch (e) {
			vscode.window.showErrorMessage(`Save failed: ${(e as Error).message}`);
		}
	}

	private async removeCaseWithUndo(sourcePath: string, index: number): Promise<void> {
		const pairs = await listTestcases(sourcePath);
		const pair = pairs.find((p) => p.index === index);
		if (!pair) return;
		const content = await readTestcase(pair);
		this.pendingFor(sourcePath).set(index, takeSnapshot(index, content.input, content.output));
		await fsRemoveTestcase(pair);
		const slot = this.ensureSlot(sourcePath);
		slot.cases = slot.cases.filter((c) => c.index !== index);
		await this.post({ type: "caseRemoved", index });
		await this.post({
			type: "toast",
			level: "info",
			text: `#${index} 삭제됨`,
			action: { label: "Undo", cmd: "aoj.sidebar.undoRemove", args: [index] },
		});
		setTimeout(() => this.pendingFor(sourcePath).delete(index), 5000);
	}

	private async undoRemove(sourcePath: string, index: number): Promise<void> {
		const snap = this.pendingFor(sourcePath).get(index);
		if (!snap) return;
		await restoreSnapshot(snap, (i, inp, out) =>
			writeTestcase(sourcePath, i, inp, out).then(() => undefined)
		);
		this.pendingFor(sourcePath).delete(index);
		const slot = this.ensureSlot(sourcePath);
		const pairs = await listTestcases(sourcePath);
		const pair = pairs.find((p) => p.index === index);
		if (pair) {
			const tc = await readTestcase(pair);
			slot.cases.push({ index, input: tc.input, expected: tc.output });
			slot.cases.sort((a, b) => a.index - b.index);
			const appended = slot.cases.find((c) => c.index === index);
			if (appended) await this.post({ type: "caseAppended", tc: appended });
		}
	}

	async handleUndoRemove(sourcePath: string, index: number): Promise<void> {
		await this.undoRemove(sourcePath, index);
	}

	async handleRemoveTestcase(sourcePath: string, index: number): Promise<void> {
		await this.removeCaseWithUndo(sourcePath, index);
	}

	private async unlinkProblem(sourcePath: string): Promise<void> {
		const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(sourcePath));
		if (!folder) return;
		const p = sidecarPath(folder.uri.fsPath, sourcePath, getSidecarDir());
		await removeSidecar(p);
		const slot = this.ensureSlot(sourcePath);
		slot.submission = null;
		await this.refresh();
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
