import Link from "next/link";
import { getProblemSets } from "@/actions/problem-sets";
import { auth } from "@/auth";
import { ProblemSetFilterTabs } from "@/components/problem-sets/problem-set-filter-tabs";
import { ProblemSetListTable } from "@/components/problem-sets/problem-set-list-table";
import { ProblemSetSearchInput } from "@/components/problem-sets/problem-set-search-input";
import { ProblemSetSortSelect } from "@/components/problem-sets/problem-set-sort-select";
import { Button } from "@/components/ui/button";
import { PROBLEM_SET_LIST_PAGE_SIZE } from "@/lib/problem-set-constants";
import type { ListFilter, ListSort } from "@/lib/services/problem-sets";

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
		<div className="container mx-auto max-w-5xl py-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">문제집</h1>
				{isLoggedIn && (
					<Button asChild>
						<Link href="/problemsets/new">+ 새 문제집</Link>
					</Button>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-3 justify-between">
				<ProblemSetFilterTabs isLoggedIn={isLoggedIn} />
				<div className="flex items-center gap-2">
					<ProblemSetSearchInput />
					<ProblemSetSortSelect isLoggedIn={isLoggedIn} />
				</div>
			</div>

			<ProblemSetListTable items={items} isLoggedIn={isLoggedIn} />

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button asChild variant="outline" disabled={page <= 1}>
						<Link href={buildHref(page - 1)}>이전</Link>
					</Button>
					<span className="text-sm tabular-nums">
						{page} / {totalPages}
					</span>
					<Button asChild variant="outline" disabled={page >= totalPages}>
						<Link href={buildHref(page + 1)}>다음</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
