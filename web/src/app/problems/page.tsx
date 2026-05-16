import type { Metadata } from "next";
import { Suspense } from "react";
import { getProblems } from "@/actions/problems";
import { getUserProblemStatuses } from "@/actions/submissions";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProblemFilterTabs } from "@/components/problems/problem-filter-tabs";
import { ProblemListTable } from "@/components/problems/problem-list-table";
import { ProblemSearch } from "@/components/problems/problem-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationLinks } from "@/components/ui/pagination-links";
import type { GetProblemsSort } from "@/lib/services/problems";

export const metadata: Metadata = {
	title: "문제 목록",
	description: "풀어볼 수 있는 문제들을 확인하세요",
};

type Sort = GetProblemsSort;
type Filter = "all" | "unsolved" | "solved" | "wrong" | "new" | "favorite";

export default async function ProblemsPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		search?: string;
		sort?: Sort;
		order?: "asc" | "desc";
		filter?: Filter;
	}>;
}) {
	const params = await searchParams;
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;

	const page = parseInt(params.page || "1", 10);
	const filter = params.filter || "all";

	const LIMIT = 100;
	const { problems, total } = await getProblems({
		page,
		limit: LIMIT,
		search: params.search,
		sort: params.sort,
		order: params.order,
		filter,
		userId,
		includeUnavailable: true,
	});
	const totalPages = Math.ceil(total / LIMIT);

	const userProblemStatuses = userId
		? await getUserProblemStatuses(
				problems.map((p) => p.id),
				userId
			)
		: new Map<number, { solved: boolean; score: number | null }>();

	const buildPageUrl = (targetPage: number) => {
		const p = new URLSearchParams();
		p.set("page", String(targetPage));
		if (params.search) p.set("search", params.search);
		if (params.sort) p.set("sort", params.sort);
		if (params.order) p.set("order", params.order);
		if (params.filter) p.set("filter", params.filter);
		return `/problems?${p.toString()}`;
	};

	return (
		<div className="page-container py-8">
			<PageBreadcrumb items={[{ label: "문제" }]} />
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
					<CardTitle className="text-2xl">문제 목록</CardTitle>
					<Suspense>
						<ProblemSearch />
					</Suspense>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex items-center justify-between gap-2">
						<Suspense>
							<ProblemFilterTabs isLoggedIn={!!userId} />
						</Suspense>
					</div>

					<ProblemListTable
						problems={problems}
						userProblemStatuses={userProblemStatuses}
						sortable
						emptyLabel={
							filter !== "all" && filter !== "new"
								? "조건에 맞는 문제가 없습니다."
								: "등록된 문제가 없습니다."
						}
					/>

					{problems.length > 0 && (
						<PaginationLinks currentPage={page} totalPages={totalPages} buildHref={buildPageUrl} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
