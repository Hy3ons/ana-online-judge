interface Props {
	signedIn: boolean;
	linked: boolean;
	caseCount: number;
	compileRunning: boolean;
	submissionRunning: boolean;
	onRun: () => void;
	onSubmit: () => void;
	onAdd: () => void;
	onSearch: () => void;
}

export function ActionBar({
	signedIn,
	linked,
	caseCount,
	compileRunning,
	submissionRunning,
	onRun,
	onSubmit,
	onAdd,
	onSearch,
}: Props) {
	const runDisabled = compileRunning || caseCount === 0;
	const submitDisabled = !signedIn || !linked || submissionRunning;
	const submitTooltip = !signedIn
		? "Sign in to submit"
		: !linked
			? "Attach a problem to submit"
			: submissionRunning
				? "Submission in progress"
				: "";

	return (
		<div class="flex items-center gap-2 px-3 py-2 border-y border-border bg-bg-elev">
			<button
				type="button"
				class="flex-1 h-8 rounded bg-ok text-white font-medium hover:opacity-90 disabled:bg-bg-elev disabled:text-fg-muted disabled:border disabled:border-border"
				onClick={onRun}
				disabled={runDisabled}
				title={caseCount === 0 ? "Add a testcase first" : "Run all testcases"}
			>
				▶ Run All
			</button>
			<button
				type="button"
				class="flex-1 h-8 rounded bg-primary text-primary-fg font-medium hover:opacity-90 disabled:bg-bg-elev disabled:text-fg-muted disabled:border disabled:border-border"
				onClick={onSubmit}
				disabled={submitDisabled}
				title={submitTooltip || "Submit current file"}
			>
				↑ Submit
			</button>
			<button
				type="button"
				class="h-8 px-3 rounded border border-border text-fg hover:bg-bg-card"
				onClick={onAdd}
				title="Add a new testcase"
			>
				＋
			</button>
			{signedIn && (
				<button
					type="button"
					class="h-8 px-3 rounded border border-border text-fg hover:bg-bg-card"
					onClick={onSearch}
					title="Search and attach a problem"
				>
					🔎
				</button>
			)}
		</div>
	);
}
