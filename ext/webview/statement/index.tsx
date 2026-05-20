/**
 * Statement webview client — minimal. The HTML body is already rendered by
 * markdown-it on the host side and injected into <article class="aoj-md">.
 * This script ensures any future client-side enhancements (image lazy-load,
 * theme reactivity) have an entry point.
 */
export {};

declare global {
	function acquireVsCodeApi<T = unknown>(): { postMessage: (m: T) => void };
}

acquireVsCodeApi();
// No interactive elements in v0.2.0 — script kept to reserve the slot.
