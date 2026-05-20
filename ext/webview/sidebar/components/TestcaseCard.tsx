import type { CaseVerdictTag, TestcaseView } from "../../../src/views/sidebar/messages";
import { IconButton } from "../../shared/components/IconButton";
import { IoColumn } from "./IoColumn";

interface Props {
	tc: TestcaseView;
	onRun: () => void;
	onRemove: () => void;
	onEdit: (input: string, expected: string) => void;
}

const verdictMap: Record<CaseVerdictTag, { label: string; cls: string; border: string }> = {
	AC: { label: "Accepted", cls: "bg-verdict-ac-bg text-verdict-ac", border: "border-l-verdict-ac" },
	WA: { label: "Wrong", cls: "bg-verdict-wa-bg text-verdict-wa", border: "border-l-verdict-wa" },
	TLE: { label: "Timeout", cls: "bg-verdict-tle-bg text-verdict-tle", border: "border-l-verdict-tle" },
	MLE: { label: "Memory", cls: "bg-verdict-mle-bg text-verdict-mle", border: "border-l-verdict-mle" },
	RE: { label: "Runtime", cls: "bg-verdict-re-bg text-verdict-re", border: "border-l-verdict-re" },
	CE: { label: "Compile error", cls: "bg-verdict-ce-bg text-verdict-ce", border: "border-l-verdict-ce" },
	PENDING: {
		label: "Pending",
		cls: "bg-verdict-pending-bg text-verdict-pending",
		border: "border-l-verdict-pending",
	},
	SKIPPED: {
		label: "Skipped",
		cls: "bg-verdict-skipped-bg text-verdict-skipped",
		border: "border-l-verdict-skipped",
	},
	RUNNING: {
		label: "Running…",
		cls: "bg-verdict-pending-bg text-verdict-pending",
		border: "border-l-verdict-pending",
	},
};

export function TestcaseCard({ tc, onRun, onRemove, onEdit }: Props) {
	const v = tc.verdict ? verdictMap[tc.verdict] : null;
	const borderCls = v?.border ?? "border-l-border";

	return (
		<div class={`mx-3 mb-2 rounded border border-border border-l-4 ${borderCls} bg-bg-elev`}>
			<div class="flex items-center gap-2 px-2 py-1.5 border-b border-border">
				<span class="text-xs font-mono text-fg-muted">#{tc.index}</span>
				{v && <span class={`text-xs px-2 py-0.5 rounded ${v.cls}`}>{v.label}</span>}
				{typeof tc.timeMs === "number" && (
					<span class="text-xs text-fg-muted">{tc.timeMs}ms</span>
				)}
				{tc.detail && <span class="text-xs text-fg-muted truncate">· {tc.detail}</span>}
				<div class="flex-1" />
				<IconButton onClick={onRun} title="Run this case">
					▶
				</IconButton>
				<IconButton onClick={onRemove} title="Remove">
					×
				</IconButton>
			</div>
			<div class="p-2 space-y-2">
				<IoColumn
					label="Input"
					value={tc.input}
					editable
					onCommit={(next) => onEdit(next, tc.expected)}
				/>
				<div class="grid grid-cols-2 gap-2">
					<IoColumn
						label="Expected"
						value={tc.expected}
						editable
						onCommit={(next) => onEdit(tc.input, next)}
					/>
					<IoColumn label="Actual" value={tc.actual ?? ""} />
				</div>
			</div>
		</div>
	);
}
