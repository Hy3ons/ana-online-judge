import { describe, expect, it } from "vitest";
import type { SidebarState } from "../../src/views/sidebar/messages";
import { applyEvent } from "../../webview/sidebar/state";

const base: SidebarState = {
	root: "ready",
	signedIn: true,
	username: "u",
	dismissSignInBanner: false,
	fileName: "a.cpp",
	languageLabel: "C++",
	supportedExtensions: [".cpp"],
	linked: null,
	cases: [
		{ index: 1, input: "1", expected: "1" },
		{ index: 2, input: "2", expected: "2" },
	],
	compile: { state: "idle" },
	submission: null,
};

describe("sidebar reducer", () => {
	it("caseStart marks the matching case RUNNING", () => {
		const next = applyEvent(base, { type: "caseStart", index: 2 });
		expect(next.cases[1].verdict).toBe("RUNNING");
		expect(next.cases[0].verdict).toBeUndefined();
	});

	it("caseDone patches verdict + timing on the matching case", () => {
		const next = applyEvent(base, {
			type: "caseDone",
			index: 1,
			verdict: "AC",
			timeMs: 12,
			memoryKb: 0,
			actual: "1",
		});
		expect(next.cases[0]).toMatchObject({ verdict: "AC", timeMs: 12, actual: "1" });
		expect(next.cases[1].verdict).toBeUndefined();
	});

	it("compile sets banner state", () => {
		const next = applyEvent(base, { type: "compile", state: "error", message: "oops" });
		expect(next.compile).toEqual({ state: "error", message: "oops" });
	});

	it("caseRemoved drops the matching case", () => {
		const next = applyEvent(base, { type: "caseRemoved", index: 1 });
		expect(next.cases.map((c) => c.index)).toEqual([2]);
	});

	it("caseAppended inserts in sorted order", () => {
		const next = applyEvent(
			{ ...base, cases: [{ index: 1, input: "1", expected: "1" }] },
			{ type: "caseAppended", tc: { index: 3, input: "3", expected: "3" } }
		);
		expect(next.cases.map((c) => c.index)).toEqual([1, 3]);
	});

	it("submissionStart seeds running state", () => {
		const next = applyEvent(base, { type: "submissionStart", submissionId: 99, problemId: 1 });
		expect(next.submission).toMatchObject({ submissionId: 99, state: "running" });
	});

	it("submissionProgress updates percentage", () => {
		const seeded = applyEvent(base, { type: "submissionStart", submissionId: 99, problemId: 1 });
		const next = applyEvent(seeded, { type: "submissionProgress", percentage: 42 });
		expect(next.submission).toMatchObject({
			percentage: 42,
			state: "running",
		});
	});

	it("submissionDone flips to done", () => {
		const seeded = applyEvent(base, { type: "submissionStart", submissionId: 99, problemId: 1 });
		const next = applyEvent(seeded, {
			type: "submissionDone",
			verdict: "accepted",
			pass: 10,
			total: 10,
			finishedAtIso: "2026-05-20T00:00:00Z",
		});
		expect(next.submission?.state).toBe("done");
		expect(next.submission?.verdict).toBe("accepted");
	});

	it("state event replaces wholesale", () => {
		const overlay = { ...base, fileName: "b.py", languageLabel: "Python" };
		const next = applyEvent(base, { type: "state", payload: overlay });
		expect(next.fileName).toBe("b.py");
		expect(next.languageLabel).toBe("Python");
	});
});
