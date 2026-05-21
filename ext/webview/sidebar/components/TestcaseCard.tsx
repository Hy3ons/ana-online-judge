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
	AC: { label: "정답", cls: "bg-verdict-ac-bg text-verdict-ac", border: "border-l-verdict-ac" },
	WA: { label: "오답", cls: "bg-verdict-wa-bg text-verdict-wa", border: "border-l-verdict-wa" },
	TLE: {
		label: "시간 초과",
		cls: "bg-verdict-tle-bg text-verdict-tle",
		border: "border-l-verdict-tle",
	},
	MLE: {
		label: "메모리 초과",
		cls: "bg-verdict-mle-bg text-verdict-mle",
		border: "border-l-verdict-mle",
	},
	RE: {
		label: "런타임 에러",
		cls: "bg-verdict-re-bg text-verdict-re",
		border: "border-l-verdict-re",
	},
	CE: {
		label: "컴파일 에러",
		cls: "bg-verdict-ce-bg text-verdict-ce",
		border: "border-l-verdict-ce",
	},
	PENDING: {
		label: "대기",
		cls: "bg-verdict-pending-bg text-verdict-pending",
		border: "border-l-verdict-pending",
	},
	SKIPPED: {
		label: "건너뜀",
		cls: "bg-verdict-skipped-bg text-verdict-skipped",
		border: "border-l-verdict-skipped",
	},
	RUNNING: {
		label: "실행 중…",
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
				<IconButton onClick={onRun} title="이 케이스만 실행">
					▶
				</IconButton>
				<IconButton onClick={onRemove} title="삭제">
					×
				</IconButton>
			</div>
			<div class="p-2 space-y-2">
				<IoColumn
					label="입력"
					value={tc.input}
					editable
					onCommit={(next) => onEdit(next, tc.expected)}
				/>
				<IoColumn
					label="기댓값"
					value={tc.expected}
					editable
					onCommit={(next) => onEdit(tc.input, next)}
				/>
				<IoColumn label="실제 출력" value={tc.actual ?? ""} />
			</div>
		</div>
	);
}
