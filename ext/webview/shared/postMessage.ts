/**
 * Typed bridge between a Preact webview and its extension host.
 * Outgoing messages flow client → host; incoming messages flow host → client.
 *
 * The browser-side `acquireVsCodeApi()` is called once by the entry point and
 * the returned object passed to `createBridge`. In tests, inject a stub.
 */
export interface VsCodeApi<Out> {
	postMessage(msg: Out): void;
}

export interface Bridge<Out, In> {
	post(msg: Out): void;
	on(handler: (msg: In) => void): () => void;
	/** Test hook — synthetically deliver an incoming message. */
	_dispatch(msg: In): void;
}

export function createBridge<Out, In>(api: VsCodeApi<Out>): Bridge<Out, In> {
	const subs = new Set<(msg: In) => void>();

	// In a real webview, window.message events carry { data: In }.
	// We only attach the listener if `window` exists (skipped in vitest node env).
	if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
		window.addEventListener("message", (e: MessageEvent) => {
			for (const h of subs) h(e.data as In);
		});
	}

	return {
		post: (m) => api.postMessage(m),
		on: (h) => {
			subs.add(h);
			return () => {
				subs.delete(h);
			};
		},
		_dispatch: (m) => {
			for (const h of subs) h(m);
		},
	};
}
