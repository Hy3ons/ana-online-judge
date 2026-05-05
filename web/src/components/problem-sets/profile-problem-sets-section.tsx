import Link from "next/link";
import { getUserProblemSets } from "@/actions/problem-sets";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export async function ProfileProblemSetsSection({
	userId,
	viewerId,
	isOwner,
}: {
	userId: number;
	viewerId?: number | null;
	isOwner: boolean;
}) {
	const items = await getUserProblemSets(userId, viewerId ?? undefined);

	if (items.length === 0 && !isOwner) {
		// 다른 사용자 프로필이고 문제집이 없으면 섹션 자체를 숨김
		return null;
	}

	return (
		<Card className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">문제집</h2>
				<div className="flex items-center gap-2">
					{isOwner && (
						<Link className="text-sm text-primary hover:underline" href="/problemsets/new">
							+ 새 문제집
						</Link>
					)}
					{items.length > 0 && (
						<Link
							className="text-sm text-muted-foreground hover:underline"
							href={isOwner ? "/problemsets?filter=mine" : "/problemsets"}
						>
							전체 보기
						</Link>
					)}
				</div>
			</div>
			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">아직 만든 문제집이 없습니다.</p>
			) : (
				<ul className="divide-y">
					{items.slice(0, 5).map((it) => (
						<li key={it.id} className="py-3 flex items-center gap-4">
							<Link
								href={`/problemsets/${it.id}`}
								className="flex-1 hover:underline font-medium truncate"
							>
								{it.title}
							</Link>
							<div className="w-44 shrink-0">
								<ProgressBar
									current={viewerId ? (it.solvedCount ?? 0) : 0}
									total={it.totalCount}
									size="sm"
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
