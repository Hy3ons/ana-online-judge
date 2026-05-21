import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LanguageMeta } from "../../src/languages/catalog";
import { LANGUAGES } from "../../src/languages/data";
import { compileIfNeeded } from "../../src/runner/runner";

let tmpDir: string;

beforeEach(async () => {
	tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "aoj-compile-test-"));
});
afterEach(async () => {
	await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("compileIfNeeded ENOENT handling", () => {
	it("returns friendly preflight message when compiler binary is missing", async () => {
		const sourcePath = path.join(tmpDir, "Main.c");
		await fs.writeFile(sourcePath, "int main(){return 0;}");

		const cDef = LANGUAGES.find((l) => l.id === "c")!;
		const fakeMeta: LanguageMeta = {
			id: "c",
			displayName: "C",
			aliases: ["c"],
			fileExtensions: ["c"],
			defaultExtension: "c",
			sourceFile: "Main.c",
			judgeVersion: "test",
			compile: { command: "nonexistent-compiler-xyz", args: ["-o", "{exe}", "{src}"] },
			run: { command: "{exe}", args: [] },
			timeMultiplier: 1,
			timeAddSec: 0,
			memoryMultiplier: 1,
			memoryAddMb: 0,
			def: cDef,
		};

		const out = await compileIfNeeded(sourcePath, fakeMeta, { timeoutMs: 5000 });
		expect(out.ok).toBe(false);
		expect(out.message).toContain("nonexistent-compiler-xyz");
		expect(out.message).toContain("aoj.compilerPaths.c");
	});
});
