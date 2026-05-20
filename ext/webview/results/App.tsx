import { useEffect, useState } from "preact/hooks";
import { createBridge } from "../shared/postMessage";
import type {
	ExtToWeb,
	SerializedCase,
	WebToExt,
} from "../../src/webview/results/messages";
import { TestcaseCard } from "./components/TestcaseCard";
import { Toolbar } from "./components/Toolbar";
import { UndoToast } from "./components/UndoToast";

interface HeaderState {
	title: string;
	hasSidecar: boolean;
	summary?: { passed: number; total: number };
	submission?: { verdict: string; finished: boolean };
}

export function App({ vscode }: { vscode: { postMessage: (m: WebToExt) => void } }) {
	const [header, setHeader] = useState<HeaderState>({ title: "AOJ — Results", hasSidecar: false });
	const [cases, setCases] = useState<Map<number, SerializedCase>>(new Map());
	const [undoToast, setUndoToast] = useState<{ index: number; message: string } | null>(null);
	const bridge = createBridge<WebToExt, ExtToWeb>(vscode);

	useEffect(() => {
		const off = bridge.on((m) => {
			if (m.type === "header") {
				setHeader({ title: m.title, hasSidecar: m.hasSidecar });
				setCases(new Map());
			} else if (m.type === "cases") {
				const next = new Map<number, SerializedCase>();
				for (const c of m.cases) next.set(c.index, c);
				setCases(next);
			} else if (m.type === "case") {
				setCases((prev) => {
					const next = new Map(prev);
					next.set(m.index, m.case);
					return next;
				});
			} else if (m.type === "removeCase") {
				setCases((prev) => {
					const next = new Map(prev);
					next.delete(m.index);
					return next;
				});
			} else if (m.type === "done") {
				setHeader((h) => ({ ...h, summary: m.summary }));
			} else if (m.type === "submission") {
				setHeader((h) => ({ ...h, submission: { verdict: m.verdict, finished: m.finished } }));
			} else if (m.type === "toast" && m.kind === "removed") {
				setUndoToast({ index: m.index, message: m.message });
			}
		});
		bridge.post({ type: "ready" });
		return off;
	}, []);

	const sorted = [...cases.values()].sort((a, b) => a.index - b.index);

	return (
		<div class="flex flex-col min-h-screen">
			<Toolbar
				title={header.title}
				summary={header.summary}
				submission={header.submission}
				hasSidecar={header.hasSidecar}
				onRunAll={() => bridge.post({ type: "runAll" })}
				onSubmit={() => bridge.post({ type: "submit" })}
				onAddTest={() => bridge.post({ type: "addCase" })}
				onStatement={() => bridge.post({ type: "openStatement" })}
			/>
			<main class="flex-1 flex flex-col gap-2 p-3">
				{sorted.length === 0 ? (
					<p class="text-center text-fg-muted text-sm py-8">
						테스트케이스가 없습니다. "+ Add Test" 로 추가하거나 Attach Problem 으로 examples 를 가져오세요.
					</p>
				) : (
					sorted.map((c) => (
						<TestcaseCard
							key={c.index}
							c={c}
							onRemove={() => bridge.post({ type: "removeCase", index: c.index })}
							onOpenDiff={() => bridge.post({ type: "openDiff", index: c.index })}
							onEditInput={(next) => bridge.post({ type: "editCase", index: c.index, input: next })}
							onEditOutput={(next) => bridge.post({ type: "editCase", index: c.index, output: next })}
						/>
					))
				)}
			</main>
			{undoToast && (
				<UndoToast
					index={undoToast.index}
					message={undoToast.message}
					onUndo={() => bridge.post({ type: "undoRemove", index: undoToast.index })}
					onDismiss={() => setUndoToast(null)}
				/>
			)}
		</div>
	);
}
