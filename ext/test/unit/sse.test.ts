import { describe, expect, it } from "vitest";
import { iterSse, SseParser } from "../../src/api/sse";

describe("SseParser", () => {
	it("parses a single event", () => {
		const p = new SseParser();
		const events = p.feed("data: hello\n\n");
		expect(events).toEqual([{ event: "message", data: "hello", id: undefined }]);
	});

	it("joins multi-data lines with newline", () => {
		const p = new SseParser();
		expect(p.feed("data: a\ndata: b\n\n")).toEqual([
			{ event: "message", data: "a\nb", id: undefined },
		]);
	});

	it("respects event field", () => {
		const p = new SseParser();
		expect(p.feed("event: verdict\ndata: AC\n\n")).toEqual([
			{ event: "verdict", data: "AC", id: undefined },
		]);
	});

	it("handles chunk splits mid-line", () => {
		const p = new SseParser();
		expect(p.feed("dat")).toEqual([]);
		expect(p.feed("a: x\n")).toEqual([]);
		expect(p.feed("\n")).toEqual([{ event: "message", data: "x", id: undefined }]);
	});

	it("ignores comments and unknown fields", () => {
		const p = new SseParser();
		expect(p.feed(":heartbeat\nfoo: bar\ndata: keep\n\n")).toEqual([
			{ event: "message", data: "keep", id: undefined },
		]);
	});

	it("strips trailing CR", () => {
		const p = new SseParser();
		expect(p.feed("data: x\r\n\r\n")).toEqual([{ event: "message", data: "x", id: undefined }]);
	});
});

describe("iterSse", () => {
	it("yields events from a Response stream", async () => {
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				const enc = new TextEncoder();
				controller.enqueue(enc.encode("event: v\ndata: 1\n\n"));
				controller.enqueue(enc.encode("event: v\ndata: 2\n\n"));
				controller.close();
			},
		});
		const res = new Response(body, {
			status: 200,
			headers: { "content-type": "text/event-stream" },
		});
		const out: string[] = [];
		for await (const ev of iterSse(res)) out.push(ev.data);
		expect(out).toEqual(["1", "2"]);
	});
});
