import { render } from "preact";
import { App } from "./App";
import "../shared/tailwind.css"; // bundler ignores via loader; only here for IDE pathing

declare global {
	function acquireVsCodeApi<T = unknown>(): { postMessage: (m: T) => void };
}

const vscode = acquireVsCodeApi();
render(<App vscode={vscode} />, document.getElementById("root")!);
