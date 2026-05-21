/** Message contract between AojSidebarProvider (host) and the Preact webview. */

export type RootState = "no-editor" | "unsupported" | "ready";

export type CaseVerdictTag =
	| "AC"
	| "WA"
	| "TLE"
	| "MLE"
	| "RE"
	| "CE"
	| "PENDING"
	| "SKIPPED"
	| "RUNNING";

/** Mirrors web/src/db/schema.ts verdictEnum. */
export type SubmissionVerdictTag =
	| "pending"
	| "judging"
	| "accepted"
	| "wrong_answer"
	| "time_limit_exceeded"
	| "memory_limit_exceeded"
	| "runtime_error"
	| "compile_error"
	| "system_error"
	| "skipped"
	| "presentation_error"
	| "fail"
	| "partial";

export interface LinkedProblem {
	problemId: number;
	problemTitle: string;
	timeLimitMs: number;
	memoryLimitMb: number;
	contestId?: number;
}

export interface TestcaseView {
	index: number;
	input: string;
	expected: string;
	actual?: string;
	verdict?: CaseVerdictTag;
	timeMs?: number;
	memoryKb?: number;
	detail?: string;
}

export interface SubmissionView {
	submissionId: number;
	problemId: number;
	state: "running" | "done";
	verdict?: SubmissionVerdictTag;
	pass?: number;
	total?: number;
	finishedAtIso?: string;
}

export interface SidebarState {
	root: RootState;
	signedIn: boolean;
	username: string | null;
	dismissSignInBanner: boolean;
	fileName: string | null;
	languageLabel: string | null;
	supportedExtensions: string[];
	linked: LinkedProblem | null;
	cases: TestcaseView[];
	compile: { state: "idle" | "running" | "ok" | "error"; message?: string };
	submission: SubmissionView | null;
}

export interface SearchProblemHit {
	id: number;
	title: string;
	tier?: number;
}

export type HostToWeb =
	| { type: "state"; payload: SidebarState }
	| { type: "compile"; state: "running" | "ok" | "error"; message?: string }
	| { type: "caseStart"; index: number }
	| {
			type: "caseDone";
			index: number;
			verdict: CaseVerdictTag;
			timeMs: number;
			memoryKb: number;
			actual: string;
			detail?: string;
	  }
	| { type: "caseAppended"; tc: TestcaseView }
	| { type: "caseRemoved"; index: number }
	| { type: "submissionStart"; submissionId: number; problemId: number }
	| { type: "submissionProgress"; verdict?: SubmissionVerdictTag; pass: number; total: number }
	| {
			type: "submissionDone";
			verdict: SubmissionVerdictTag;
			pass: number;
			total: number;
			finishedAtIso: string;
	  }
	| {
			type: "toast";
			level: "info" | "error";
			text: string;
			action?: { label: string; cmd: string; args?: unknown[] };
	  }
	| { type: "searchOpen" }
	| {
			type: "searchResults";
			q: string;
			problems: SearchProblemHit[];
			error?: string;
	  };

export type WebToHost =
	| { type: "ready" }
	| {
			type: "command";
			cmd:
				| "aoj.runAll"
				| "aoj.submit"
				| "aoj.addTestcase"
				| "aoj.searchProblems"
				| "aoj.signIn"
				| "aoj.signOut"
				| "aoj.attachProblemById"
				| "aoj.openInBrowser"
				| "aoj.sidebar.refresh";
	  }
	| { type: "runCase"; index: number }
	| { type: "editCase"; index: number; input: string; expected: string }
	| { type: "removeCase"; index: number }
	| { type: "undoRemove"; index: number }
	| { type: "unlink" }
	| { type: "dismissSignInBanner" }
	| { type: "openSubmission"; submissionId: number }
	| { type: "searchQuery"; q: string }
	| { type: "searchClose" }
	| { type: "attachSearchResult"; problemId: number }
	| { type: "cancelRun" };
