import { describe, expect, it } from "vitest";
import { type ComputeInputs, computeSidebarState } from "../../src/views/sidebar/compute";

const baseInputs: ComputeInputs = {
	signedIn: false,
	username: null,
	dismissSignInBanner: false,
	supportedExtensions: [".cpp", ".py"],
	activeFile: null,
	languageLabel: null,
	linked: null,
	cases: [],
};

describe("computeSidebarState", () => {
	it("returns no-editor when no active file", () => {
		expect(computeSidebarState(baseInputs).root).toBe("no-editor");
	});

	it("returns unsupported when file ext has no language", () => {
		const s = computeSidebarState({
			...baseInputs,
			activeFile: { basename: "notes.txt", ext: ".txt" },
			languageLabel: null,
		});
		expect(s.root).toBe("unsupported");
		expect(s.fileName).toBe("notes.txt");
		expect(s.linked).toBeNull();
	});

	it("returns ready when file is supported and lang resolved", () => {
		const s = computeSidebarState({
			...baseInputs,
			activeFile: { basename: "a.cpp", ext: ".cpp" },
			languageLabel: "C++",
		});
		expect(s.root).toBe("ready");
		expect(s.languageLabel).toBe("C++");
	});

	it("preserves linked + cases on ready state", () => {
		const s = computeSidebarState({
			...baseInputs,
			activeFile: { basename: "a.cpp", ext: ".cpp" },
			languageLabel: "C++",
			linked: { problemId: 1, problemTitle: "X", timeLimitMs: 1000, memoryLimitMb: 256 },
			cases: [{ index: 1, input: "1", expected: "2" }],
		});
		expect(s.linked?.problemId).toBe(1);
		expect(s.cases).toHaveLength(1);
	});

	it("does not return linked or cases on non-ready states", () => {
		const s = computeSidebarState({
			...baseInputs,
			activeFile: { basename: "x.bin", ext: ".bin" },
			languageLabel: null,
			linked: { problemId: 1, problemTitle: "X", timeLimitMs: 1000, memoryLimitMb: 256 },
			cases: [{ index: 1, input: "1", expected: "2" }],
		});
		expect(s.linked).toBeNull();
		expect(s.cases).toEqual([]);
	});

	it("propagates signedIn/username/dismiss flag", () => {
		const s = computeSidebarState({
			...baseInputs,
			signedIn: true,
			username: "tester",
			dismissSignInBanner: true,
		});
		expect(s.signedIn).toBe(true);
		expect(s.username).toBe("tester");
		expect(s.dismissSignInBanner).toBe(true);
	});
});
