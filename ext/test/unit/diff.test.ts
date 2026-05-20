import { describe, expect, it } from "vitest";
import { compareIcpc, normalize } from "../../src/runner/diff";

describe("normalize", () => {
	it("strips trailing whitespace per line", () => {
		expect(normalize("a   \nb\t\nc")).toBe("a\nb\nc");
	});
	it("normalizes CRLF", () => {
		expect(normalize("a\r\nb\r\n")).toBe("a\nb");
	});
	it("strips trailing newlines", () => {
		expect(normalize("x\n\n\n")).toBe("x");
	});
	it("handles empty", () => {
		expect(normalize("")).toBe("");
		expect(normalize("\n\n")).toBe("");
	});
});

describe("compareIcpc", () => {
	it("returns equal when identical", () => {
		expect(compareIcpc("1 2\n3", "1 2\n3").equal).toBe(true);
	});
	it("ignores trailing newline / whitespace", () => {
		expect(compareIcpc("1\n", "1").equal).toBe(true);
		expect(compareIcpc("1   \n", "1").equal).toBe(true);
	});
	it("reports first diff line (1-based)", () => {
		const r = compareIcpc("a\nb\nc", "a\nX\nc");
		expect(r.equal).toBe(false);
		expect(r.firstDiffLine).toBe(2);
	});
	it("reports length mismatch", () => {
		const r = compareIcpc("a\nb", "a");
		expect(r.equal).toBe(false);
		expect(r.firstDiffLine).toBe(2);
	});
});
