import { describe, expect, it } from "vitest";
import { LANGUAGES } from "../../src/languages/data";
import { buildMissingCompilerMessage } from "../../src/languages/preflight";

describe("buildMissingCompilerMessage", () => {
	const cpp = LANGUAGES.find((l) => l.id === "cpp")!;
	const text = LANGUAGES.find((l) => l.id === "text")!;

	it("includes the language displayName and command name", () => {
		const msg = buildMissingCompilerMessage(cpp, "g++", "linux");
		expect(msg).toContain("C++");
		expect(msg).toContain("g++");
	});

	it("includes the install hint matching the platform", () => {
		const linux = buildMissingCompilerMessage(cpp, "g++", "linux");
		expect(linux).toContain("apt install");

		const mac = buildMissingCompilerMessage(cpp, "g++", "darwin");
		expect(mac).toContain("xcode-select");

		const win = buildMissingCompilerMessage(cpp, "g++", "win32");
		expect(win).toContain("MSYS2");
	});

	it("includes the settings override hint with the correct lang id", () => {
		const msg = buildMissingCompilerMessage(cpp, "g++", "linux");
		expect(msg).toContain("aoj.compilerPaths.cpp");
	});

	it("provides a generic fallback when no installHints exist", () => {
		const msg = buildMissingCompilerMessage(text, "cat", "win32");
		expect(msg).toContain("Text");
		expect(msg).toContain("cat");
		// Generic fallback rather than crashing
		expect(msg.length).toBeGreaterThan(0);
	});
});
