import { Heart } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ProblemSetListRow } from "@/lib/services/problem-sets";

export function ProblemSetListTable({
	items,
	isLoggedIn,
}: {
	items: ProblemSetListRow[];
	isLoggedIn: boolean;
}) {
	if (items.length === 0) {
		return (
			<div className="rounded-md border p-12 text-center text-muted-foreground">
				문제집이 없습니다.
			</div>
		);
	}
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/2">제목</TableHead>
					<TableHead>작성자</TableHead>
					<TableHead className="w-44">진행률</TableHead>
					<TableHead className="w-20 text-right">좋아요</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map((row) => (
					<TableRow key={row.id}>
						<TableCell>
							<Link href={`/problemsets/${row.id}`} className="hover:underline font-medium">
								{row.title}
							</Link>
						</TableCell>
						<TableCell className="text-sm">{row.creator.name}</TableCell>
						<TableCell>
							<ProgressBar
								current={isLoggedIn ? (row.solvedCount ?? 0) : 0}
								total={row.totalCount}
								size="sm"
								showCount
							/>
						</TableCell>
						<TableCell className="text-right tabular-nums">
							<span className="inline-flex items-center gap-1 text-sm">
								<Heart
									className={
										row.likedByViewer
											? "size-3.5 fill-red-500 text-red-500"
											: "size-3.5 text-muted-foreground"
									}
								/>
								{row.likeCount}
							</span>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
