import type { CaseRun } from "../../runner/runner";

export type WebToExt = { type: "ready" } | { type: "openDiff"; index: number };

export type ExtToWeb =
	| { type: "header"; title: string; problemId?: number }
	| { type: "case"; case: SerializedCase; index: number }
	| { type: "done"; summary: { passed: number; total: number } }
	| {
			type: "submission";
			verdict: string;
			perTestcase?: Array<{ index: number; verdict: string; timeMs?: number }>;
			finished: boolean;
	  };

export interface SerializedCase {
	index: number;
	verdict: string;
	detail: string;
	expected: string;
	actual: string;
	input: string;
	elapsedMs?: number;
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
