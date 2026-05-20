import type { SerializedCase } from "../../../src/webview/results/messages";
import { Badge } from "../../shared/components/Badge";
import { IconButton } from "../../shared/components/IconButton";
import { IoColumn } from "./IoColumn";

export function TestcaseCard({
	c,
	onRemove,
	onOpenDiff,
	onEditInput,
	onEditOutput,
}: {
	c: SerializedCase;
	onRemove: () => void;
	onOpenDiff: () => void;
	onEditInput: (next: string) => void;
	onEditOutput: (next: string) => void;
}) {
	const isWrong = c.verdict === "Wrong Answer";
	const showOpenDiff = isWrong && c.actual && c.expected;
	return (
		<section class="border border-border rounded-md overflow-hidden bg-bg-card">
			<header class="flex items-center gap-2 px-3 py-1.5 bg-bg-elev border-b border-border">
				<span class="text-xs font-semibold text-fg-muted tabular-nums w-8">
					#{c.index}
				</span>
				{c.verdict ? (
					<Badge verdict={c.verdict}>{c.verdict}</Badge>
				) : (
					<Badge variant="neutral">Empty</Badge>
				)}
				<span class="flex-1 text-xs text-fg-muted">{c.detail}</span>
				{showOpenDiff && (
					<button
						type="button"
						class="text-xs text-accent hover:underline"
						onClick={onOpenDiff}
					>
						Open Diff
					</button>
				)}
				<IconButton title="삭제" onClick={onRemove}>
					✕
				</IconButton>
			</header>
			<div class="flex">
				<IoColumn label="Input" value={c.input} editable onCommit={onEditInput} />
				<IoColumn label="Expected" value={c.expected} editable onCommit={onEditOutput} />
				<IoColumn label="Actual" value={c.actual} diff={isWrong} />
			</div>
		</section>
	);
}
