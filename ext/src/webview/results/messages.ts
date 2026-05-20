import type { CaseRun } from "../../runner/runner";

export type WebToExt =
	| { type: "ready" }
	| { type: "openDiff"; index: number }
	| { type: "runAll" }
	| { type: "submit" }
	| { type: "openStatement" }
	| { type: "addCase" }
	| { type: "editCase"; index: number; input?: string; output?: string }
	| { type: "removeCase"; index: number }
	| { type: "undoRemove"; index: number };

export type ExtToWeb =
	| { type: "header"; title: string; problemId?: number; hasSidecar: boolean }
	| { type: "case"; case: SerializedCase; index: number }
	| { type: "cases"; cases: SerializedCase[] }
	| { type: "removeCase"; index: number }
	| { type: "done"; summary: { passed: number; total: number } }
	| {
			type: "submission";
			verdict: string;
			perTestcase?: Array<{ index: number; verdict: string; timeMs?: number }>;
			finished: boolean;
	  }
	| { type: "toast"; kind: "removed"; index: number; message: string }
	| { type: "saveError"; index: number; message: string };

export interface SerializedCase {
	index: number;
	verdict: string;
	detail: string;
	expected: string;
	actual: string;
	input: string;
	elapsedMs?: number;
	saving?: boolean;
}

export function serializeCase(c: CaseRun): SerializedCase {
	const v = c.verdict;
	switch (v.kind) {
		case "passed":
			return {
				index: c.testcase.index,
				verdict: "Passed",
				detail: `${v.elapsedMs}ms`,
				expected: c.expected,
				actual: c.stdout,
				input: c.input,
				elapsedMs: v.elapsedMs,
			};
		case "wrong":
			return {
				index: c.testcase.index,
				verdict: "Wrong Answer",
				detail: `${v.elapsedMs}ms · first diff @ line ${v.diff.firstDiffLine ?? "?"}`,
				expected: c.expected,
				actual: c.stdout,
				input: c.input,
				elapsedMs: v.elapsedMs,
			};
		case "timeout":
			return {
				index: c.testcase.index,
				verdict: "Timeout",
				detail: `>${v.elapsedMs}ms`,
				expected: c.expected,
				actual: c.stdout,
				input: c.input,
				elapsedMs: v.elapsedMs,
			};
		case "runtime":
			return {
				index: c.testcase.index,
				verdict: "Runtime Error",
				detail: `exit ${v.exitCode ?? "?"} · ${v.elapsedMs}ms`,
				expected: c.expected,
				actual: c.stdout,
				input: c.input,
				elapsedMs: v.elapsedMs,
			};
		case "compile_error":
			return {
				index: c.testcase.index,
				verdict: "Compile Error",
				detail: v.message.split("\n")[0] ?? "",
				expected: c.expected,
				actual: v.message,
				input: c.input,
			};
	}
}

/** Build a SerializedCase from just file contents (no run results yet). */
export function emptyCase(index: number, input: string, output: string): SerializedCase {
	return {
		index,
		verdict: "",
		detail: "",
		expected: output,
		actual: "",
		input,
	};
}
