import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	listTestcases,
	nextIndex,
	removeTestcase,
	syncTestcasesFromExamples,
	writeTestcase,
} from "../../src/mapping/testcases";

let tmp: string;
let src: string;
beforeEach(async () => {
	tmp = await fs.mkdtemp(path.join(os.tmpdir(), "aoj-tc-"));
	src = path.join(tmp, "solution.cpp");
	await fs.writeFile(src, "");
});
afterEach(async () => {
	await fs.rm(tmp, { recursive: true, force: true });
});

describe("testcases", () => {
	it("lists empty when no pairs", async () => {
		expect(await listTestcases(src)).toEqual([]);
	});

	it("writes and lists", async () => {
		await writeTestcase(src, 1, "a", "b");
		const list = await listTestcases(src);
		expect(list).toHaveLength(1);
		expect(list[0]).toMatchObject({ index: 1 });
	});

	it("ignores unpaired files", async () => {
		await fs.writeFile(path.join(tmp, "solution_1.in"), "x");
		expect(await listTestcases(src)).toEqual([]);
	});

	it("nextIndex picks max+1", async () => {
		await writeTestcase(src, 1, "", "");
		await writeTestcase(src, 5, "", "");
		expect(nextIndex(await listTestcases(src))).toBe(6);
	});

	it("syncTestcasesFromExamples overwrites", async () => {
		await writeTestcase(src, 1, "old", "old");
		await writeTestcase(src, 99, "", "");
		await syncTestcasesFromExamples(src, [
			{ input: "1", output: "2" },
			{ input: "3", output: "4" },
		]);
		const list = await listTestcases(src);
		expect(list.map((p) => p.index)).toEqual([1, 2]);
		expect(await fs.readFile(list[1].inputPath, "utf-8")).toBe("3");
	});

	it("removes pair", async () => {
		const p = await writeTestcase(src, 1, "x", "y");
		await removeTestcase(p);
		expect(await listTestcases(src)).toEqual([]);
	});
});
