import { ProblemTitleCell } from "@/components/problems/problem-title-cell";
import type { ProblemType } from "@/db/schema";
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
					<span className="w-6 text-sm tabular-nums text-muted-foreground shrink-0">{idx + 1}</span>
					<div className="flex-1 min-w-0">
						<ProblemTitleCell
							href={`/problems/${it.problem.id}`}
							title={it.problem.title}
							problemType={it.problem.problemType as ProblemType}
							judgeAvailable={it.problem.judgeAvailable}
							languageRestricted={it.problem.languageRestricted}
							hasSubtasks={it.problem.hasSubtasks}
							useFullJudge={it.problem.useFullJudge}
							isPublic={it.problem.isPublic}
							tier={it.problem.tier}
							isSolved={showSolved && it.solvedByViewer}
						/>
					</div>
				</li>
			))}
		</ol>
	);
}
