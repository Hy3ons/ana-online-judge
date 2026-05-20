import { describe, expect, it, vi } from "vitest";
import { type Bridge, createBridge } from "../../webview/shared/postMessage";

interface OutMsg {
	type: "click";
	target: string;
}
interface InMsg {
	type: "state";
	value: number;
}

function fakeVsCode() {
	const sent: OutMsg[] = [];
	return {
		api: { postMessage: (m: OutMsg) => sent.push(m) },
		sent,
	};
}

describe("createBridge", () => {
	it("posts outgoing messages via the injected vscode API", () => {
		const { api, sent } = fakeVsCode();
		const bridge: Bridge<OutMsg, InMsg> = createBridge(api);
		bridge.post({ type: "click", target: "Run" });
		expect(sent).toEqual([{ type: "click", target: "Run" }]);
	});

	it("delivers incoming messages to subscribers", () => {
		const { api } = fakeVsCode();
		const bridge: Bridge<OutMsg, InMsg> = createBridge(api);
		const handler = vi.fn<(m: InMsg) => void>();
		bridge.on(handler);
		bridge._dispatch({ type: "state", value: 7 });
		expect(handler).toHaveBeenCalledWith({ type: "state", value: 7 });
	});

	it("unsubscribes via the returned dispose function", () => {
		const { api } = fakeVsCode();
		const bridge: Bridge<OutMsg, InMsg> = createBridge(api);
		const handler = vi.fn<(m: InMsg) => void>();
		const dispose = bridge.on(handler);
		dispose();
		bridge._dispatch({ type: "state", value: 1 });
		expect(handler).not.toHaveBeenCalled();
	});
});
