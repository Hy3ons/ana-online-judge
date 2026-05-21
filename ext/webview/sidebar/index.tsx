import { render } from "preact";
import "../shared/tailwind.css";
import { App } from "./App";

declare global {
	interface Window {
		acquireVsCodeApi: () => { postMessage: (m: unknown) => void };
	}
}

const vscode = window.acquireVsCodeApi();
render(<App vscode={vscode} />, document.getElementById("root")!);
