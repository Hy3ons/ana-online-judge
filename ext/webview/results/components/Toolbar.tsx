import { Button } from "../../shared/components/Button";
import { Badge } from "../../shared/components/Badge";

export function Toolbar({
	title,
	summary,
	submission,
	hasSidecar,
	onRunAll,
	onSubmit,
	onAddTest,
	onStatement,
}: {
	title: string;
	summary?: { passed: number; total: number };
	submission?: { verdict: string; finished: boolean };
	hasSidecar: boolean;
	onRunAll: () => void;
	onSubmit: () => void;
	onAddTest: () => void;
	onStatement: () => void;
}) {
	const submitting = submission !== undefined && !submission.finished;
	return (
		<header class="border-b border-border bg-bg-elev">
			<div class="px-4 py-3 flex items-center gap-3">
				<h2 class="flex-1 text-base font-semibold text-fg truncate">{title}</h2>
				{summary && (
					<span class="text-xs text-fg-muted">
						{summary.passed} / {summary.total} passed
					</span>
				)}
				{submission && <Badge verdict={submission.verdict}>{submission.verdict}</Badge>}
			</div>
			<div class="px-4 pb-3 flex gap-2 flex-wrap">
				<Button onClick={onRunAll} disabled={submitting}>
					▶ Run All
				</Button>
				<Button onClick={onSubmit} disabled={!hasSidecar || submitting}>
					⬆ Submit
				</Button>
				<Button variant="secondary" onClick={onAddTest} disabled={submitting}>
					+ Add Test
				</Button>
				<Button variant="secondary" onClick={onStatement} disabled={!hasSidecar}>
					📄 Statement
				</Button>
			</div>
		</header>
	);
}
