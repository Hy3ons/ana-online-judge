import type { LinkedProblem, SidebarState, TestcaseView } from "./messages";

export interface ComputeInputs {
	signedIn: boolean;
	username: string | null;
	dismissSignInBanner: boolean;
	supportedExtensions: string[];
	activeFile: { basename: string; ext: string } | null;
	languageLabel: string | null;
	linked: LinkedProblem | null;
	cases: TestcaseView[];
}

const DEFAULT_BLANK: Pick<SidebarState, "compile" | "submission"> = {
	compile: { state: "idle" },
	submission: null,
};

export function computeSidebarState(i: ComputeInputs): SidebarState {
	const base = {
		signedIn: i.signedIn,
		username: i.username,
		dismissSignInBanner: i.dismissSignInBanner,
		supportedExtensions: i.supportedExtensions,
		...DEFAULT_BLANK,
	};

	if (!i.activeFile) {
		return {
			...base,
			root: "no-editor",
			fileName: null,
			languageLabel: null,
			linked: null,
			cases: [],
		};
	}

	if (!i.languageLabel) {
		return {
			...base,
			root: "unsupported",
			fileName: i.activeFile.basename,
			languageLabel: null,
			linked: null,
			cases: [],
		};
	}

	return {
		...base,
		root: "ready",
		fileName: i.activeFile.basename,
		languageLabel: i.languageLabel,
		linked: i.linked,
		cases: i.cases,
	};
}
