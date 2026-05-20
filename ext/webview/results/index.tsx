import { render } from "preact";
import { App } from "./App";

declare global {
	function acquireVsCodeApi<T = unknown>(): { postMessage: (m: T) => void };
}

const vscode = acquireVsCodeApi();
render(<App vscode={vscode} />, document.getElementById("root")!);
