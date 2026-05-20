import type { LinkedProblem } from "../../../src/views/sidebar/messages";

interface Props {
	problem: LinkedProblem;
	onUnlink: () => void;
	onOpenInBrowser: () => void;
}

export function LinkedProblemCard({ problem, onUnlink, onOpenInBrowser }: Props) {
	return (
		<div class="mx-3 mb-2 p-2 rounded border border-border bg-bg-elev">
			<div class="flex items-start gap-2">
				<div class="flex-1 min-w-0">
					<button
						type="button"
						class="text-sm text-fg hover:text-accent text-left truncate w-full"
						onClick={onOpenInBrowser}
						title="Open in browser"
					>
						#{problem.problemId} · {problem.problemTitle}
					</button>
					<div class="text-xs text-fg-muted mt-1">
						{(problem.timeLimitMs / 1000).toFixed(1)}s · {problem.memoryLimitMb}MB
					</div>
				</div>
				<button
					type="button"
					class="text-fg-muted hover:text-bad text-xs px-2 py-1 rounded border border-border"
					onClick={onUnlink}
					title="Unlink problem (testcases kept)"
				>
					Unlink
				</button>
			</div>
		</div>
	);
}
