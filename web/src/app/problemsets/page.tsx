import type { Metadata } from "next";
import Link from "next/link";
import { getProblemSets } from "@/actions/problem-sets";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProblemSetFilterTabs } from "@/components/problem-sets/problem-set-filter-tabs";
import { ProblemSetListTable } from "@/components/problem-sets/problem-set-list-table";
import { ProblemSetSearchInput } from "@/components/problem-sets/problem-set-search-input";
import { ProblemSetSortSelect } from "@/components/problem-sets/problem-set-sort-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationLinks } from "@/components/ui/pagination-links";
import { PROBLEM_SET_LIST_PAGE_SIZE } from "@/lib/problem-set-constants";
import type { ListFilter, ListSort } from "@/lib/services/problem-sets";

export const metadata: Metadata = {
	title: "문제집",
	description: "사용자가 만든 문제 모음을 둘러보세요",
};

const VALID_SORTS: ListSort[] = ["likes", "recent", "problemCount", "solvedRatio"];
const VALID_FILTERS: ListFilter[] = ["all", "liked", "mine"];

export default async function ProblemSetsPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		sort?: string;
		filter?: string;
		q?: string;
	}>;
}) {
	const sp = await searchParams;
	const session = await auth();
	const viewerId = session?.user?.id ? Number.parseInt(session.user.id, 10) : undefined;
	const isLoggedIn = !!viewerId;

	const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
	const sort: ListSort = (VALID_SORTS as string[]).includes(sp.sort ?? "")
		? (sp.sort as ListSort)
		: "likes";
	const filter: ListFilter = (VALID_FILTERS as string[]).includes(sp.filter ?? "")
		? (sp.filter as ListFilter)
		: "all";

	const { items, total } = await getProblemSets({
		page,
		sort,
		filter,
		q: sp.q,
		viewerId,
	});
	const totalPages = Math.max(1, Math.ceil(total / PROBLEM_SET_LIST_PAGE_SIZE));

	const buildHref = (p: number) => {
		const params = new URLSearchParams();
		if (sp.q) params.set("q", sp.q);
		if (sort !== "likes") params.set("sort", sort);
		if (filter !== "all") params.set("filter", filter);
		if (p !== 1) params.set("page", String(p));
		const qs = params.toString();
		return qs ? `/problemsets?${qs}` : "/problemsets";
	};

	return (
		<div className="page-container py-8">
			<PageBreadcrumb items={[{ label: "문제집" }]} />
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-2xl">문제집 목록</CardTitle>
					{isLoggedIn && (
						<Button asChild>
							<Link href="/problemsets/new">문제집 만들기</Link>
						</Button>
					)}
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
						<ProblemSetFilterTabs isLoggedIn={isLoggedIn} />
						<div className="flex items-center gap-2">
							<ProblemSetSearchInput />
							<ProblemSetSortSelect isLoggedIn={isLoggedIn} />
						</div>
					</div>
					<ProblemSetListTable items={items} isLoggedIn={isLoggedIn} />
					{items.length > 0 && (
						<PaginationLinks currentPage={page} totalPages={totalPages} buildHref={buildHref} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
