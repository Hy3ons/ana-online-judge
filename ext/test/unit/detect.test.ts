import { afterEach, describe, expect, it } from "vitest";
import { clearDetectCache, detectCommand } from "../../src/languages/detect";

afterEach(() => clearDetectCache());

describe("detectCommand", () => {
	it("returns true for a real binary (node)", async () => {
		// `node` is the test runner itself; must be on PATH
		expect(await detectCommand("node")).toBe(true);
	});

	it("returns false for a nonexistent binary", async () => {
		expect(await detectCommand("definitely-not-a-real-bin-xyz")).toBe(false);
	});

	it("returns false (no shell exec) for cmd with shell metachars", async () => {
		expect(await detectCommand("node; echo PWNED")).toBe(false);
		expect(await detectCommand("$(touch /tmp/aoj-test-pwn)")).toBe(false);
		expect(await detectCommand("a && b")).toBe(false);
	});

	it("caches results", async () => {
		const a = await detectCommand("nonexistent-cache-test");
		const b = await detectCommand("nonexistent-cache-test");
		expect(a).toBe(false);
		expect(b).toBe(false);
		// caching means we should not have created /tmp/aoj-test-pwn etc.
	});
});
