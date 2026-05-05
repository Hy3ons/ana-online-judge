import { Pencil } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DeleteProblemSetButton } from "@/components/problem-sets/delete-problem-set-button";
import { LikeButton } from "@/components/problem-sets/like-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ProblemSetDetail } from "@/lib/services/problem-sets";

export function ProblemSetDetailHeader({
	detail,
	canEdit,
	isLoggedIn,
}: {
	detail: ProblemSetDetail;
	canEdit: boolean;
	isLoggedIn: boolean;
}) {
	const { set, creator, totalCount, solvedCount, likedByViewer } = detail;
	return (
		<Card className="p-6 space-y-4">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">{set.title}</h1>
					<p className="text-sm text-muted-foreground">by {creator.name}</p>
				</div>
				<div className="flex items-center gap-2">
					<LikeButton
						problemSetId={set.id}
						initialLiked={likedByViewer}
						initialCount={set.likeCount}
						disabled={!isLoggedIn}
					/>
					{canEdit && (
						<>
							<Button asChild variant="outline" size="sm">
								<Link href={`/problemsets/${set.id}/edit`}>
									<Pencil className="size-4" /> 편집
								</Link>
							</Button>
							<DeleteProblemSetButton problemSetId={set.id} />
						</>
					)}
				</div>
			</div>
			{set.description && (
				<div className="prose prose-sm max-w-none dark:prose-invert">
					<MarkdownRenderer content={set.description} />
				</div>
			)}
			<ProgressBar
				current={isLoggedIn ? solvedCount : 0}
				total={totalCount}
				size="lg"
				showCount
				showPercent
				label={isLoggedIn ? "내 진행률" : "전체"}
			/>
		</Card>
	);
}
