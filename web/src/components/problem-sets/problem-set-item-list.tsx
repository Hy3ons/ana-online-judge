import { Check } from "lucide-react";
import Link from "next/link";
import type { ProblemSetItemRow } from "@/lib/services/problem-sets";

export function ProblemSetItemList({
	items,
	showSolved,
}: {
	items: ProblemSetItemRow[];
	showSolved: boolean;
}) {
	if (items.length === 0) {
		return (
			<div className="rounded-md border p-8 text-center text-muted-foreground">
				문제가 없습니다.
			</div>
		);
	}
	return (
		<ol className="rounded-md border divide-y">
			{items.map((it, idx) => (
				<li key={it.itemId} className="flex items-center gap-3 px-4 py-3">
					<span className="w-6 text-sm tabular-nums text-muted-foreground">{idx + 1}</span>
					{showSolved && (
						<span
							className={
								it.solvedByViewer
									? "inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
									: "inline-flex size-5 items-center justify-center rounded-full border border-muted text-transparent"
							}
							role="img"
							aria-label={it.solvedByViewer ? "푼 문제" : "풀지 않은 문제"}
						>
							<Check className="size-3.5" />
						</span>
					)}
					<Link href={`/problems/${it.problem.id}`} className="flex-1 hover:underline">
						{it.problem.title}
					</Link>
				</li>
			))}
		</ol>
	);
}
