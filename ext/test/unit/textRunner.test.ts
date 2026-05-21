import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runTextCase } from "../../src/languages/textRunner";
import type { TestcasePair } from "../../src/mapping/testcases";

let tmpDir: string;
async function makePair(input: string, output: string, index: number): Promise<TestcasePair> {
	const inputPath = path.join(tmpDir, `in-${index}.txt`);
	const outputPath = path.join(tmpDir, `out-${index}.txt`);
	await fs.writeFile(inputPath, input);
	await fs.writeFile(outputPath, output);
	return { index, inputPath, outputPath } as TestcasePair;
}

beforeAll(async () => {
	tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "aoj-text-test-"));
});
afterAll(async () => {
	await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("runTextCase", () => {
	it("returns AC when source content matches expected output exactly", async () => {
		const tc = await makePair("ignored", "hello\nworld\n", 1);
		const result = await runTextCase("hello\nworld\n", tc);
		expect(result.verdict.kind).toBe("passed");
	});

	it("returns WA when source content differs", async () => {
		const tc = await makePair("ignored", "hello\n", 2);
		const result = await runTextCase("HELLO\n", tc);
		expect(result.verdict.kind).toBe("wrong");
	});

	it("uses ICPC comparison (trailing whitespace tolerance)", async () => {
		const tc = await makePair("", "hello\nworld", 3);
		const result = await runTextCase("hello\nworld\n", tc);
		// compareIcpc treats trailing newlines as equal
		expect(result.verdict.kind).toBe("passed");
	});
});
