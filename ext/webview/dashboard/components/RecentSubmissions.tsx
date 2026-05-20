import type { DashRecentSubmission } from "../../../src/views/dashboard/messages";
import { Badge } from "../../shared/components/Badge";
import { EmptyState } from "../../shared/components/EmptyState";

function age(iso: string): string {
	const ms = Date.now() - Date.parse(iso);
	if (Number.isNaN(ms) || ms < 0) return "";
	const m = Math.floor(ms / 60_000);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
}

export function RecentSubmissions({
	items,
	onOpen,
}: {
	items: DashRecentSubmission[];
	onOpen: (id: number) => void;
}) {
	if (items.length === 0) {
		return (
			<div>
				<p class="text-xs uppercase tracking-wider text-fg-muted mt-2 mb-1 px-1">
					Recent Submissions
				</p>
				<EmptyState title="아직 제출이 없습니다." />
			</div>
		);
	}
	return (
		<div>
			<p class="text-xs uppercase tracking-wider text-fg-muted mt-2 mb-1 px-1">
				Recent Submissions
			</p>
			<ul class="flex flex-col">
				{items.map((s) => (
					<li
						key={s.id}
						class="flex items-center gap-2 px-1 py-1.5 border-b border-border last:border-b-0 cursor-pointer hover:bg-bg-elev rounded"
						onClick={() => onOpen(s.id)}
					>
						<Badge verdict={s.verdict}>{s.verdict}</Badge>
						<span class="flex-1 text-sm text-fg truncate">
							#{s.problemId} {s.problemTitle}
						</span>
						<span class="text-xs text-fg-muted">{age(s.createdAtIso)}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
