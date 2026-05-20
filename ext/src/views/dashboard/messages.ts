/**
 * Message protocol between the dashboard webview (Preact) and its host (extension).
 */

export interface DashCurrentProblem {
	problemId: number;
	title: string;
	timeLimit: number;
	memoryLimit: number;
	fileName: string; // basename of active editor
}

export interface DashActiveContest {
	id: number;
	title: string;
	endsAtIso: string;
}

export interface DashRecentSubmission {
	id: number;
	problemId: number;
	problemTitle: string;
	verdict: string;
	createdAtIso: string;
}

export interface DashState {
	signedIn: boolean;
	username: string | null;
	currentProblem: DashCurrentProblem | null;
	activeContest: DashActiveContest | null;
	recentSubmissions: DashRecentSubmission[];
}

export type DashToHost =
	| { type: "ready" }
	| { type: "signIn" }
	| {
			type: "command";
			cmd:
				| "aoj.runAll"
				| "aoj.submit"
				| "aoj.addTestcase"
				| "aoj.openStatement"
				| "aoj.openInBrowser"
				| "aoj.searchProblems"
				| "aoj.attachProblemById";
	  }
	| { type: "openSubmission"; submissionId: number }
	| { type: "refresh" };

export type HostToDash = { type: "state"; payload: DashState };
