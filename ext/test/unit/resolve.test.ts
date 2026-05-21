import { describe, expect, it } from "vitest";
import type { Cmd, PlatformCmd } from "../../src/languages/data";
import { applyOverrides, resolveCmd } from "../../src/languages/resolve";

describe("resolveCmd", () => {
	it("returns the Cmd directly when input is platform-agnostic", () => {
		const cmd: Cmd = { command: "gcc", args: ["-O2"] };
		expect(resolveCmd(cmd, "linux")).toEqual(cmd);
		expect(resolveCmd(cmd, "darwin")).toEqual(cmd);
		expect(resolveCmd(cmd, "win32")).toEqual(cmd);
	});

	it("picks the matching platform from a platform map", () => {
		const cmd: PlatformCmd = {
			linux: { command: "python3", args: ["{src}"] },
			darwin: { command: "python3", args: ["{src}"] },
			win32: { command: "python", args: ["{src}"] },
		};
		expect(resolveCmd(cmd, "win32")).toEqual({ command: "python", args: ["{src}"] });
		expect(resolveCmd(cmd, "linux")).toEqual({ command: "python3", args: ["{src}"] });
	});

	it("falls back to linux when current platform missing from map", () => {
		const cmd: PlatformCmd = {
			linux: { command: "pypy3", args: [] },
		};
		expect(resolveCmd(cmd, "win32")).toEqual({ command: "pypy3", args: [] });
	});

	it("throws when no platform entry can satisfy the request", () => {
		expect(() => resolveCmd({} as PlatformCmd, "linux")).toThrow();
	});
});

describe("applyOverrides", () => {
	const baseCmd: Cmd = { command: "gcc", args: ["-O2", "{src}"] };

	it("returns the same Cmd when no overrides exist", () => {
		expect(applyOverrides("c", baseCmd, {})).toEqual(baseCmd);
	});

	it("replaces the command with compilerPaths override", () => {
		const out = applyOverrides("c", baseCmd, { compilerPaths: { c: "/opt/gcc-13/bin/gcc" } });
		expect(out.command).toBe("/opt/gcc-13/bin/gcc");
		expect(out.args).toEqual(["-O2", "{src}"]);
	});

	it("appends compileFlags after base args", () => {
		const out = applyOverrides("c", baseCmd, { compileFlags: { c: ["-Wextra", "-g"] } });
		expect(out.args).toEqual(["-O2", "{src}", "-Wextra", "-g"]);
	});

	it("ignores override entries for other languages", () => {
		const out = applyOverrides("c", baseCmd, {
			compilerPaths: { cpp: "/opt/g++-13" },
			compileFlags: { cpp: ["-std=c++23"] },
		});
		expect(out).toEqual(baseCmd);
	});
});
