import { useEffect, useState } from "preact/hooks";
import type { HostToWeb, SidebarState, WebToHost } from "../../src/views/sidebar/messages";
import { EmptyState } from "../shared/components/EmptyState";
import { createBridge } from "../shared/postMessage";
import { ActionBar } from "./components/ActionBar";
import { CompileBanner } from "./components/CompileBanner";
import { FileRow } from "./components/FileRow";
import { Header } from "./components/Header";
import { LinkedProblemCard } from "./components/LinkedProblemCard";
import { SignInBanner } from "./components/SignInBanner";
import { SubmissionStrip } from "./components/SubmissionStrip";
import { TestList } from "./components/TestList";

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
	const bridge = createBridge<WebToHost, HostToWeb>(vscode);

	useEffect(() => {
		const off = bridge.on((m) => {
			if (m.type === "state") setState(m.payload);
		});
		bridge.post({ type: "ready" });
		return off;
	}, []);

	const cmd = (c: Extract<WebToHost, { type: "command" }>["cmd"]) =>
		bridge.post({ type: "command", cmd: c });

	const showSignInBanner = !state.signedIn && !state.dismissSignInBanner;

	return (
		<div class="min-h-screen flex flex-col">
			<Header
				signedIn={state.signedIn}
				username={state.username}
				onSignIn={() => cmd("aoj.signIn")}
				onSignOut={() => cmd("aoj.signOut")}
				onRefresh={() => cmd("aoj.sidebar.refresh")}
			/>
			{showSignInBanner && (
				<SignInBanner
					onSignIn={() => cmd("aoj.signIn")}
					onDismiss={() => bridge.post({ type: "dismissSignInBanner" })}
				/>
			)}
			{state.root === "no-editor" && (
				<div class="flex-1 flex items-center justify-center p-4">
					<EmptyState
						title="Open a source file to start"
						hint={`Supported: ${state.supportedExtensions.join(", ")}`}
					/>
				</div>
			)}
			{state.root === "unsupported" && state.fileName && (
				<div class="flex-1 flex items-center justify-center p-4">
					<EmptyState
						title="This file type isn't supported"
						hint={`${state.fileName} — supported: ${state.supportedExtensions.join(", ")}`}
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
						compileRunning={state.compile.state === "running"}
						submissionRunning={state.submission?.state === "running"}
						onRun={() => cmd("aoj.runAll")}
						onSubmit={() => cmd("aoj.submit")}
						onAdd={() => cmd("aoj.addTestcase")}
						onSearch={() => cmd("aoj.searchProblems")}
					/>
					{(state.compile.state === "running" || state.compile.state === "error") && (
						<CompileBanner state={state.compile.state} message={state.compile.message} />
					)}
					<TestList
						cases={state.cases}
						onRunCase={(index) => bridge.post({ type: "runCase", index })}
						onRemoveCase={(index) => bridge.post({ type: "removeCase", index })}
						onEditCase={(index, input, expected) =>
							bridge.post({ type: "editCase", index, input, expected })
						}
					/>
					{state.submission && (
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
		</div>
	);
}
