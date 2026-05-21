interface Props {
	signedIn: boolean;
	linked: boolean;
	caseCount: number;
	running: boolean;
	submissionRunning: boolean;
	onRun: () => void;
	onStop: () => void;
	onSubmit: () => void;
	onAdd: () => void;
	onSearch: () => void;
}

export function ActionBar({
	signedIn,
	linked,
	caseCount,
	running,
	submissionRunning,
	onRun,
	onStop,
	onSubmit,
	onAdd,
	onSearch,
}: Props) {
	const runDisabled = !running && caseCount === 0;
	const submitDisabled = !signedIn || !linked || submissionRunning;
	const submitTooltip = !signedIn
		? "로그인 후 제출할 수 있습니다"
		: !linked
			? "문제를 먼저 연결해주세요"
			: submissionRunning
				? "제출 진행 중입니다"
				: "";

	return (
		<div class="flex items-center gap-2 px-3 py-2 border-y border-border bg-bg-elev">
			{running ? (
				<button
					type="button"
					class="flex-1 h-8 rounded bg-bad text-white font-medium hover:opacity-90"
					onClick={onStop}
					title="실행 중인 테스트 중단"
				>
					■ 중단
				</button>
			) : (
				<button
					type="button"
					class="flex-1 h-8 rounded bg-ok text-white font-medium hover:opacity-90 disabled:bg-bg-elev disabled:text-fg-muted disabled:border disabled:border-border"
					onClick={onRun}
					disabled={runDisabled}
					title={caseCount === 0 ? "먼저 테스트케이스를 추가하세요" : "모든 테스트케이스 실행"}
				>
					▶ 전체 실행
				</button>
			)}
			<button
				type="button"
				class="flex-1 h-8 rounded bg-primary text-primary-fg font-medium hover:opacity-90 disabled:bg-bg-elev disabled:text-fg-muted disabled:border disabled:border-border"
				onClick={onSubmit}
				disabled={submitDisabled}
				title={submitTooltip || "현재 파일 제출"}
			>
				↑ 제출
			</button>
			<button
				type="button"
				class="h-8 px-3 rounded border border-border text-fg hover:bg-bg-card"
				onClick={onAdd}
				title="테스트케이스 추가"
			>
				＋
			</button>
			{signedIn && (
				<button
					type="button"
					class="h-8 px-3 rounded border border-border text-fg hover:bg-bg-card"
					onClick={onSearch}
					title="문제 검색 및 연결"
				>
					🔎
				</button>
			)}
		</div>
	);
}
