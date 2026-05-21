import { useEffect, useState } from "preact/hooks";
import type {
	HostToWeb,
	SearchProblemHit,
	SidebarState,
	WebToHost,
} from "../../src/views/sidebar/messages";
import { EmptyState } from "../shared/components/EmptyState";
import { Toast } from "../shared/components/Toast";
import { createBridge } from "../shared/postMessage";
import { ActionBar } from "./components/ActionBar";
import { CompileBanner } from "./components/CompileBanner";
import { FileRow } from "./components/FileRow";
import { Header } from "./components/Header";
import { LinkedProblemCard } from "./components/LinkedProblemCard";
import { SearchPanel } from "./components/SearchPanel";
import { SubmissionStrip } from "./components/SubmissionStrip";
import { TestList } from "./components/TestList";
import { applyEvent } from "./state";

interface ToastUi {
	text: string;
	actionLabel?: string;
	undoIndex?: number;
}

interface SearchUi {
	open: boolean;
	query: string;
	results: SearchProblemHit[] | null;
	loading: boolean;
	error: string | null;
}

const SEARCH_INITIAL: SearchUi = {
	open: false,
	query: "",
	results: null,
	loading: false,
	error: null,
};

const INITIAL: SidebarState = {
	root: "no-editor",
	signedIn: false,
	username: null,
	dismissSignInBanner: false,
	fileName: null,
	languageLabel: null,
	supportedExtensions: [],
	linked: null,
	cases: [],
	compile: { state: "idle" },
	submission: null,
};

export function App({ vscode }: { vscode: { postMessage: (m: WebToHost) => void } }) {
	const [state, setState] = useState<SidebarState>(INITIAL);
	const [toast, setToast] = useState<ToastUi | null>(null);
	const [search, setSearch] = useState<SearchUi>(SEARCH_INITIAL);
	const bridge = createBridge<WebToHost, HostToWeb>(vscode);

	useEffect(() => {
		const off = bridge.on((m) => {
			if (m.type === "toast") {
				const undoIndex =
					m.action?.cmd === "aoj.sidebar.undoRemove" && typeof m.action.args?.[0] === "number"
						? (m.action.args[0] as number)
						: undefined;
				setToast({ text: m.text, actionLabel: m.action?.label, undoIndex });
				return;
			}
			if (m.type === "searchOpen") {
				setSearch({ ...SEARCH_INITIAL, open: true });
				return;
			}
			if (m.type === "searchResults") {
				setSearch((prev) =>
					prev.open && prev.query === m.q
						? { ...prev, loading: false, results: m.problems, error: m.error ?? null }
						: prev
				);
				return;
			}
			setState((prev) => applyEvent(prev, m));
		});
		bridge.post({ type: "ready" });
		return off;
	}, []);

	const cmd = (c: Extract<WebToHost, { type: "command" }>["cmd"]) =>
		bridge.post({ type: "command", cmd: c });

	return (
		<div class="min-h-screen flex flex-col">
			<Header
				signedIn={state.signedIn}
				username={state.username}
				onSignIn={() => cmd("aoj.signIn")}
				onSignOut={() => cmd("aoj.signOut")}
				onRefresh={() => cmd("aoj.sidebar.refresh")}
			/>
			{state.root === "no-editor" && (
				<div class="flex-1 flex items-center justify-center p-4">
					<EmptyState
						title="소스 파일을 열어주세요"
						hint={`지원 확장자: ${state.supportedExtensions.join(", ")}`}
					/>
				</div>
			)}
			{state.root === "unsupported" && state.fileName && (
				<div class="flex-1 flex items-center justify-center p-4">
					<EmptyState
						title="지원하지 않는 파일 형식입니다"
						hint={`${state.fileName} — 지원: ${state.supportedExtensions.join(", ")}`}
					/>
				</div>
			)}
			{state.root === "ready" && state.fileName && state.languageLabel && (
				<>
					<FileRow fileName={state.fileName} languageLabel={state.languageLabel} />
					{state.linked && (
						<LinkedProblemCard
							problem={state.linked}
							onUnlink={() => bridge.post({ type: "unlink" })}
							onOpenInBrowser={() => cmd("aoj.openInBrowser")}
						/>
					)}
					<ActionBar
						signedIn={state.signedIn}
						linked={state.linked !== null}
						caseCount={state.cases.length}
						running={
							state.compile.state === "running" ||
							state.cases.some((c) => c.verdict === "RUNNING")
						}
						submissionRunning={state.submission?.state === "running"}
						onRun={() => cmd("aoj.runAll")}
						onStop={() => bridge.post({ type: "cancelRun" })}
						onSubmit={() => cmd("aoj.submit")}
						onAdd={() => cmd("aoj.addTestcase")}
						onSearch={() => setSearch({ ...SEARCH_INITIAL, open: true })}
					/>
					{(state.compile.state === "running" || state.compile.state === "error") && (
						<CompileBanner state={state.compile.state} message={state.compile.message} />
					)}
					{search.open ? (
						<SearchPanel
							query={search.query}
							results={search.results}
							loading={search.loading}
							error={search.error}
							onQuery={(q) => {
								setSearch((prev) => ({ ...prev, query: q, loading: q.trim() !== "", error: null }));
								bridge.post({ type: "searchQuery", q });
							}}
							onPick={(id) => {
								bridge.post({ type: "attachSearchResult", problemId: id });
								setSearch(SEARCH_INITIAL);
							}}
							onClose={() => {
								bridge.post({ type: "searchClose" });
								setSearch(SEARCH_INITIAL);
							}}
						/>
					) : (
						<TestList
							cases={state.cases}
							onRunCase={(index) => bridge.post({ type: "runCase", index })}
							onRemoveCase={(index) => bridge.post({ type: "removeCase", index })}
							onEditCase={(index, input, expected) =>
								bridge.post({ type: "editCase", index, input, expected })
							}
						/>
					)}
					{state.submission && !search.open && (
						<SubmissionStrip
							submission={state.submission}
							onOpen={() =>
								// biome-ignore lint/style/noNonNullAssertion: guarded by the truthy check above
								bridge.post({ type: "openSubmission", submissionId: state.submission!.submissionId })
							}
						/>
					)}
				</>
			)}
			{toast && (
				<Toast
					message={toast.text}
					actionLabel={toast.actionLabel}
					onAction={
						toast.undoIndex !== undefined
							? () => bridge.post({ type: "undoRemove", index: toast.undoIndex as number })
							: undefined
					}
					onDismiss={() => setToast(null)}
				/>
			)}
		</div>
	);
}
