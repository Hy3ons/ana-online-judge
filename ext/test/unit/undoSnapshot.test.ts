import { describe, expect, it } from "vitest";
import { restoreSnapshot, type Snapshot, takeSnapshot } from "../../webview/shared/undoSnapshot";

describe("undoSnapshot", () => {
	it("captures input + output strings keyed by index", () => {
		const snap = takeSnapshot(3, "hello", "world");
		expect(snap).toEqual({ index: 3, input: "hello", output: "world" });
	});

	it("restoreSnapshot calls write with the captured values", async () => {
		const snap: Snapshot = { index: 5, input: "i", output: "o" };
		const calls: Array<{ index: number; input: string; output: string }> = [];
		await restoreSnapshot(snap, async (index, input, output) => {
			calls.push({ index, input, output });
		});
		expect(calls).toEqual([{ index: 5, input: "i", output: "o" }]);
	});
});
