import type { SubmissionVerdictTag, SubmissionView } from "../../../src/views/sidebar/messages";

const verdictLabel = (v: SubmissionVerdictTag | undefined): string => {
	switch (v) {
		case "accepted":
			return "정답";
		case "wrong_answer":
			return "오답";
		case "time_limit_exceeded":
			return "시간 초과";
		case "memory_limit_exceeded":
			return "메모리 초과";
		case "runtime_error":
			return "런타임 에러";
		case "compile_error":
			return "컴파일 에러";
		case "presentation_error":
			return "출력 형식 오류";
		case "partial":
			return "부분 점수";
		case "system_error":
			return "시스템 오류";
		case "skipped":
			return "건너뜀";
		case "pending":
			return "대기";
		case "judging":
			return "채점 중";
		case "fail":
			return "실패";
		default:
			return "?";
	}
};

const verdictClass = (v?: string): string => {
	const k = (v ?? "").toUpperCase();
	if (k === "AC" || k.includes("ACCEPT"))
		return "bg-verdict-ac-bg text-verdict-ac border-l-verdict-ac";
	if (k.includes("WRONG") || k === "WA")
		return "bg-verdict-wa-bg text-verdict-wa border-l-verdict-wa";
	if (k.includes("TIME") || k === "TLE")
		return "bg-verdict-tle-bg text-verdict-tle border-l-verdict-tle";
	if (k.includes("MEMORY") || k === "MLE")
		return "bg-verdict-mle-bg text-verdict-mle border-l-verdict-mle";
	if (k.includes("RUNTIME") || k === "RE")
		return "bg-verdict-re-bg text-verdict-re border-l-verdict-re";
	if (k.includes("COMPILE") || k === "CE")
		return "bg-verdict-ce-bg text-verdict-ce border-l-verdict-ce";
	return "bg-verdict-pending-bg text-verdict-pending border-l-verdict-pending";
};

interface Props {
	submission: SubmissionView;
	onOpen: () => void;
}

export function SubmissionStrip({ submission, onOpen }: Props) {
	const cls = verdictClass(submission.verdict);
	const statusText =
		submission.state === "running"
			? typeof submission.percentage === "number"
				? `채점 중 ${submission.percentage}%`
				: "채점 중…"
			: `${verdictLabel(submission.verdict)} · ${submission.pass ?? 0}/${submission.total ?? 0}`;

	return (
		<section class="border-t border-border bg-bg-elev">
			<h3 class="px-3 pt-2 text-xs text-fg-muted uppercase tracking-wide">제출</h3>
			<button
				type="button"
				class={`m-3 mt-1 w-[calc(100%-1.5rem)] text-left px-3 py-2 rounded border border-border border-l-4 ${cls} hover:opacity-90`}
				onClick={onOpen}
				title="브라우저에서 제출 결과 열기"
			>
				<div class="text-xs font-mono text-fg-muted">#{submission.submissionId}</div>
				<div class="text-sm font-medium">{statusText}</div>
			</button>
		</section>
	);
}
