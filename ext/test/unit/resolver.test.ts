import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveFile } from "../../src/mapping/resolver";
import { writeSidecar } from "../../src/mapping/sidecar";
import { writeTestcase } from "../../src/mapping/testcases";

let tmp: string;
beforeEach(async () => {
	tmp = await fs.mkdtemp(path.join(os.tmpdir(), "aoj-rv-"));
});
afterEach(async () => {
	await fs.rm(tmp, { recursive: true, force: true });
});

describe("resolveFile", () => {
	it("returns nulls when nothing", async () => {
		const src = path.join(tmp, "x.cpp");
		await fs.writeFile(src, "");
		const r = await resolveFile(tmp, src);
		expect(r.sidecar).toBeNull();
		expect(r.testcases).toEqual([]);
	});

	it("returns sidecar and testcases when present", async () => {
		const src = path.join(tmp, "x.cpp");
		await fs.writeFile(src, "");
		await writeSidecar(path.join(tmp, ".aoj/x.json"), {
			version: 1,
			problemId: 7,
			problemTitle: "t",
			language: "cpp",
			timeLimit: 1000,
			memoryLimit: 256,
			examples: [],
			syncedAt: "now",
		});
		await writeTestcase(src, 1, "i", "o");
		const r = await resolveFile(tmp, src);
		expect(r.sidecar?.problemId).toBe(7);
		expect(r.testcases).toHaveLength(1);
	});
});
