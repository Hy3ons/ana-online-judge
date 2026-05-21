import { describe, expect, it } from "vitest";
import { extToLang, langToExt } from "../../src/languages/extToLang";

describe("extToLang", () => {
	it("maps common extensions", () => {
		expect(extToLang("a.cpp")).toBe("cpp");
		expect(extToLang("a.CPP")).toBe("cpp");
		expect(extToLang("/path/to/Main.java")).toBe("java");
		expect(extToLang("script.py")).toBe("python");
	});
	it("returns null for unknown / extensionless", () => {
		expect(extToLang("Makefile")).toBeNull();
		expect(extToLang("a.txt")).toBe("text");
		expect(extToLang("a.unknown")).toBeNull();
	});
});

describe("langToExt", () => {
	it("returns preferred extension", () => {
		expect(langToExt("cpp")).toBe(".cpp");
		expect(langToExt("python")).toBe(".py");
		expect(langToExt("pypy")).toBe(".py");
		expect(langToExt("nonsense")).toBeNull();
	});
});
