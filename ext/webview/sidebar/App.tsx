import { useEffect, useState } from "preact/hooks";
import type { HostToWeb, SidebarState, WebToHost } from "../../src/views/sidebar/messages";
import { createBridge } from "../shared/postMessage";

const INITIAL: SidebarState = {
	root: "no-editor",
	signedIn: false,
	username: null,
	dismissSignInBanner: false,
	fileName: null,
	languageLabel: null,
	supportedExtensions: [],
	linked: null,
	cases: [],
	compile: { state: "idle" },
	submission: null,
};

export function App({ vscode }: { vscode: { postMessage: (m: WebToHost) => void } }) {
	const [state, setState] = useState<SidebarState>(INITIAL);
	const bridge = createBridge<WebToHost, HostToWeb>(vscode);

	useEffect(() => {
		const off = bridge.on((m) => {
			if (m.type === "state") setState(m.payload);
		});
		bridge.post({ type: "ready" });
		return off;
	}, []);

	return (
		<div class="min-h-screen p-3 text-fg">
			<p class="text-sm text-fg-muted">AOJ Sidebar — state: {state.root}</p>
		</div>
	);
}
