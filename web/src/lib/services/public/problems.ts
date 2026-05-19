import "server-only";

import { type Example, parseExamples } from "@/lib/services/parse-examples";
import { getProblemById, getProblems } from "@/lib/services/problems";

export interface PublicProblemListItem {
	id: number;
	title: string;
	tier: number;
	problemType: string;
	timeLimit: number;
	memoryLimit: number;
}

export interface PublicProblemListResult {
	problems: PublicProblemListItem[];
	total: number;
	page: number;
	limit: number;
}

export async function listPublicProblems(input: {
	page?: number;
	limit?: number;
	search?: string;
	sort?: "id" | "tier" | "createdAt";
	order?: "asc" | "desc";
}): Promise<PublicProblemListResult> {
	const page = input.page ?? 1;
	const limit = Math.min(input.limit ?? 20, 100);

	const result = await getProblems(
		{
			page,
			limit,
			publicOnly: true,
			search: input.search,
			sort: input.sort,
			order: input.order,
		},
		{ isAdmin: false }
	);

	const problems: PublicProblemListItem[] = result.problems.map((p) => ({
		id: p.id,
		// getProblems selects displayTitle aliased as `title`
		title: p.title,
		tier: p.tier ?? 0,
		problemType: p.problemType,
		timeLimit: p.timeLimit,
		memoryLimit: p.memoryLimit,
	}));

	return { problems, total: result.total, page, limit };
}

export interface PublicProblemDetail {
	id: number;
	title: string;
	content: string;
	tier: number;
	problemType: string;
	timeLimit: number;
	memoryLimit: number;
	allowedLanguages: string[] | null;
	hasSubtasks: boolean;
	maxScore: number;
	authors: { username: string; name: string }[];
	createdAt: string;
	examples: Example[];
}

export async function getPublicProblem(id: number): Promise<PublicProblemDetail | null> {
	// getProblemById already calls resolveDisplay internally and returns `title` and `content`
	// as top-level fields alongside `translations`.
	const p = await getProblemById(id, undefined, { userId: undefined, isAdmin: false });
	if (!p) return null;

	return {
		id: p.id,
		title: p.title,
		content: p.content,
		tier: p.tier ?? 0,
		problemType: p.problemType,
		timeLimit: p.timeLimit,
		memoryLimit: p.memoryLimit,
		allowedLanguages: p.allowedLanguages ?? null,
		hasSubtasks: p.hasSubtasks,
		maxScore: p.maxScore,
		authors: (p.authors ?? []).map((a) => ({ username: a.username, name: a.name })),
		createdAt: p.createdAt.toISOString(),
		examples: parseExamples(p.content ?? ""),
	};
}
