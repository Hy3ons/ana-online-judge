import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readSidecar, type SidecarV1, sidecarPath, writeSidecar } from "../../src/mapping/sidecar";

let tmp: string;
beforeEach(async () => {
	tmp = await fs.mkdtemp(path.join(os.tmpdir(), "aoj-sc-"));
});
afterEach(async () => {
	await fs.rm(tmp, { recursive: true, force: true });
});

const sample: SidecarV1 = {
	version: 1,
	problemId: 100,
	problemTitle: "두 수 합",
	language: "cpp",
	timeLimit: 1000,
	memoryLimit: 256,
	examples: [{ input: "1 2", output: "3" }],
	syncedAt: "2026-05-19T00:00:00.000Z",
};

describe("sidecar I/O", () => {
	it("sidecarPath builds .aoj/<base>.json", () => {
		expect(sidecarPath("/work", "/work/sub/solution.cpp")).toBe(
			path.join("/work", ".aoj", "solution.json")
		);
	});

	it("returns null when missing", async () => {
		expect(await readSidecar(path.join(tmp, "x.json"))).toBeNull();
	});

	it("round-trips", async () => {
		const p = path.join(tmp, "solution.json");
		await writeSidecar(p, sample);
		expect(await readSidecar(p)).toEqual(sample);
	});

	it("returns null on wrong version", async () => {
		const p = path.join(tmp, "x.json");
		await fs.writeFile(p, JSON.stringify({ version: 99, problemId: 1 }));
		expect(await readSidecar(p)).toBeNull();
	});
});
