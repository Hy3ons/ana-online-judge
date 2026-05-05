import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import type { ProblemSet } from "@/db/schema";
import { problemSetItems, problemSetLikes, problemSets, problems, users } from "@/db/schema";
import {
	PROBLEM_SET_DESCRIPTION_MAX,
	PROBLEM_SET_LIST_PAGE_SIZE,
	PROBLEM_SET_MAX_PER_USER,
	PROBLEM_SET_TITLE_MAX,
} from "@/lib/problem-set-constants";
import { userSolvedProblemFilterSql, userSolvedProblemSql } from "@/lib/services/solved-clause";

export {
	PROBLEM_SET_DESCRIPTION_MAX,
	PROBLEM_SET_LIST_PAGE_SIZE,
	PROBLEM_SET_MAX_PER_USER,
	PROBLEM_SET_TITLE_MAX,
};

export type ListSort = "likes" | "recent" | "problemCount" | "solvedRatio";
export type ListFilter = "all" | "liked" | "mine";

export interface ProblemSetCreator {
	id: number;
	name: string;
}

export interface ProblemSetListRow {
	id: number;
	title: string;
	description: string | null;
	creator: ProblemSetCreator;
	likeCount: number;
	totalCount: number;
	solvedCount: number | null;
	likedByViewer: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ListOptions {
	page: number;
	pageSize?: number;
	sort: ListSort;
	q?: string;
	filter: ListFilter;
	viewerId?: number;
}

export async function countUserProblemSets(userId: number): Promise<number> {
	const [row] = await db
		.select({ c: count() })
		.from(problemSets)
		.where(eq(problemSets.createdBy, userId));
	return row?.c ?? 0;
}

export async function createProblemSet(
	userId: number,
	input: { title: string; description?: string | null; problemIds?: number[] }
): Promise<ProblemSet> {
	const title = input.title.trim();
	if (title.length === 0 || title.length > PROBLEM_SET_TITLE_MAX) {
		throw new Error(`제목은 1자 이상 ${PROBLEM_SET_TITLE_MAX}자 이하여야 합니다.`);
	}
	const description = input.description?.trim() || null;
	if (description && description.length > PROBLEM_SET_DESCRIPTION_MAX) {
		throw new Error(`설명은 ${PROBLEM_SET_DESCRIPTION_MAX}자 이하여야 합니다.`);
	}
	const problemIds = input.problemIds ?? [];

	return await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(problemSets)
			.values({ title, description, createdBy: userId })
			.returning();
		if (!row) throw new Error("문제집 생성에 실패했습니다.");

		if (problemIds.length > 0) {
			await tx
				.insert(problemSetItems)
				.values(
					problemIds.map((problemId, idx) => ({
						problemSetId: row.id,
						problemId,
						order: idx,
					}))
				)
				.onConflictDoNothing();
		}

		return row;
	});
}

export async function replaceProblemSetItems(
	problemSetId: number,
	problemIds: number[]
): Promise<void> {
	await db.transaction(async (tx) => {
		// Lock parent row so concurrent modifications serialize.
		await tx
			.select({ id: problemSets.id })
			.from(problemSets)
			.where(eq(problemSets.id, problemSetId))
			.for("update")
			.limit(1);

		await tx.delete(problemSetItems).where(eq(problemSetItems.problemSetId, problemSetId));

		if (problemIds.length > 0) {
			await tx.insert(problemSetItems).values(
				problemIds.map((problemId, idx) => ({
					problemSetId,
					problemId,
					order: idx,
				}))
			);
		}

		await tx
			.update(problemSets)
			.set({ updatedAt: new Date() })
			.where(eq(problemSets.id, problemSetId));
	});
}

export async function updateProblemSet(
	id: number,
	input: { title?: string; description?: string | null }
): Promise<void> {
	const patch: Partial<{ title: string; description: string | null; updatedAt: Date }> = {
		updatedAt: new Date(),
	};
	if (input.title !== undefined) {
		const t = input.title.trim();
		if (t.length === 0 || t.length > PROBLEM_SET_TITLE_MAX) {
			throw new Error(`제목은 1자 이상 ${PROBLEM_SET_TITLE_MAX}자 이하여야 합니다.`);
		}
		patch.title = t;
	}
	if (input.description !== undefined) {
		const d = input.description?.trim() || null;
		if (d && d.length > PROBLEM_SET_DESCRIPTION_MAX) {
			throw new Error(`설명은 ${PROBLEM_SET_DESCRIPTION_MAX}자 이하여야 합니다.`);
		}
		patch.description = d;
	}
	await db.update(problemSets).set(patch).where(eq(problemSets.id, id));
}

export async function deleteProblemSet(id: number): Promise<void> {
	await db.delete(problemSets).where(eq(problemSets.id, id));
}

export async function addProblemToSet(problemSetId: number, problemId: number): Promise<void> {
	await db.transaction(async (tx) => {
		// Lock parent row so concurrent inserts serialize on the MAX(order) read.
		await tx
			.select({ id: problemSets.id })
			.from(problemSets)
			.where(eq(problemSets.id, problemSetId))
			.for("update")
			.limit(1);

		const [maxRow] = await tx
			.select({ maxOrder: sql<number>`COALESCE(MAX(${problemSetItems.order}), -1)` })
			.from(problemSetItems)
			.where(eq(problemSetItems.problemSetId, problemSetId));
		const nextOrder = (maxRow?.maxOrder ?? -1) + 1;

		await tx
			.insert(problemSetItems)
			.values({ problemSetId, problemId, order: nextOrder })
			.onConflictDoNothing();

		await tx
			.update(problemSets)
			.set({ updatedAt: new Date() })
			.where(eq(problemSets.id, problemSetId));
	});
}

export async function removeProblemFromSet(problemSetId: number, problemId: number): Promise<void> {
	await db
		.delete(problemSetItems)
		.where(
			and(eq(problemSetItems.problemSetId, problemSetId), eq(problemSetItems.problemId, problemId))
		);
	await db
		.update(problemSets)
		.set({ updatedAt: new Date() })
		.where(eq(problemSets.id, problemSetId));
}

export async function reorderProblemSetItems(
	problemSetId: number,
	ordered: Array<{ id: number; order: number }>
): Promise<void> {
	if (ordered.length === 0) return;
	await db.transaction(async (tx) => {
		const ids = ordered.map((o) => o.id);
		const existing = await tx
			.select({ id: problemSetItems.id })
			.from(problemSetItems)
			.where(and(eq(problemSetItems.problemSetId, problemSetId), inArray(problemSetItems.id, ids)));
		if (existing.length !== ordered.length) {
			throw new Error("문제집에 속하지 않은 항목을 재정렬할 수 없습니다.");
		}
		const cases = sql.join(
			ordered.map((o) => sql`WHEN ${problemSetItems.id} = ${o.id} THEN ${o.order}`),
			sql` `
		);
		await tx
			.update(problemSetItems)
			.set({ order: sql`CASE ${cases} ELSE ${problemSetItems.order} END` })
			.where(inArray(problemSetItems.id, ids));
		await tx
			.update(problemSets)
			.set({ updatedAt: new Date() })
			.where(eq(problemSets.id, problemSetId));
	});
}

export async function toggleLike(
	problemSetId: number,
	userId: number
): Promise<{ liked: boolean; likeCount: number }> {
	return await db.transaction(async (tx) => {
		const inserted = await tx
			.insert(problemSetLikes)
			.values({ problemSetId, userId })
			.onConflictDoNothing()
			.returning({ problemSetId: problemSetLikes.problemSetId });
		let liked: boolean;
		if (inserted.length > 0) {
			await tx
				.update(problemSets)
				.set({ likeCount: sql`${problemSets.likeCount} + 1` })
				.where(eq(problemSets.id, problemSetId));
			liked = true;
		} else {
			await tx
				.delete(problemSetLikes)
				.where(
					and(eq(problemSetLikes.problemSetId, problemSetId), eq(problemSetLikes.userId, userId))
				);
			await tx
				.update(problemSets)
				.set({ likeCount: sql`GREATEST(${problemSets.likeCount} - 1, 0)` })
				.where(eq(problemSets.id, problemSetId));
			liked = false;
		}
		const [row] = await tx
			.select({ likeCount: problemSets.likeCount })
			.from(problemSets)
			.where(eq(problemSets.id, problemSetId));
		return { liked, likeCount: row?.likeCount ?? 0 };
	});
}

function totalCountSql() {
	return sql<number>`(
		SELECT COUNT(*)::int FROM ${problemSetItems}
		WHERE ${problemSetItems.problemSetId} = ${problemSets.id}
	)`;
}

function solvedCountSql(viewerId: number) {
	return sql<number>`(
		SELECT COUNT(*)::int
		FROM ${problemSetItems} psi
		JOIN ${problems} p ON p.id = psi.problem_id
		WHERE psi.problem_set_id = ${problemSets.id}
		  AND ${userSolvedProblemSql(viewerId)}
	)`;
}

function likedByViewerSql(viewerId: number) {
	return sql<boolean>`EXISTS (
		SELECT 1 FROM ${problemSetLikes}
		WHERE ${problemSetLikes.problemSetId} = ${problemSets.id}
		  AND ${problemSetLikes.userId} = ${viewerId}
	)`;
}

export async function listProblemSets(
	opts: ListOptions
): Promise<{ items: ProblemSetListRow[]; total: number }> {
	const pageSize = opts.pageSize ?? PROBLEM_SET_LIST_PAGE_SIZE;
	const page = Math.max(1, opts.page);
	const viewerId = opts.viewerId;

	const conditions = [];
	if (opts.q && opts.q.trim().length > 0) {
		const qLike = `%${opts.q.trim()}%`;
		conditions.push(or(ilike(problemSets.title, qLike), ilike(problemSets.description, qLike)));
	}
	if (opts.filter === "mine") {
		if (!viewerId) return { items: [], total: 0 };
		conditions.push(eq(problemSets.createdBy, viewerId));
	}
	if (opts.filter === "liked") {
		if (!viewerId) return { items: [], total: 0 };
		conditions.push(
			sql`EXISTS (
				SELECT 1 FROM ${problemSetLikes}
				WHERE ${problemSetLikes.problemSetId} = ${problemSets.id}
				  AND ${problemSetLikes.userId} = ${viewerId}
			)`
		);
	}
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalRow] = await db.select({ c: count() }).from(problemSets).where(whereClause);
	const total = totalRow?.c ?? 0;
	if (total === 0) return { items: [], total: 0 };

	const totalCountExpr = totalCountSql();
	const solvedCountExpr = viewerId ? solvedCountSql(viewerId) : sql<number | null>`NULL`;
	const likedExpr = viewerId ? likedByViewerSql(viewerId) : sql<boolean>`FALSE`;

	let orderBy: unknown;
	switch (opts.sort) {
		case "likes":
			orderBy = desc(problemSets.likeCount);
			break;
		case "recent":
			orderBy = desc(problemSets.createdAt);
			break;
		case "problemCount":
			orderBy = sql`${totalCountExpr} DESC`;
			break;
		case "solvedRatio":
			if (viewerId) {
				orderBy = sql`(${solvedCountExpr})::float / NULLIF(${totalCountExpr}, 0) DESC NULLS LAST`;
			} else {
				orderBy = desc(problemSets.likeCount);
			}
			break;
		default:
			orderBy = desc(problemSets.likeCount);
	}

	const rows = await db
		.select({
			id: problemSets.id,
			title: problemSets.title,
			description: problemSets.description,
			likeCount: problemSets.likeCount,
			createdAt: problemSets.createdAt,
			updatedAt: problemSets.updatedAt,
			creatorId: users.id,
			creatorName: users.name,
			totalCount: totalCountExpr,
			solvedCount: solvedCountExpr,
			likedByViewer: likedExpr,
		})
		.from(problemSets)
		.innerJoin(users, eq(users.id, problemSets.createdBy))
		.where(whereClause)
		// biome-ignore lint/suspicious/noExplicitAny: drizzle orderBy heterogeneous type
		.orderBy(orderBy as any, desc(problemSets.id))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const items: ProblemSetListRow[] = rows.map((r) => ({
		id: r.id,
		title: r.title,
		description: r.description,
		creator: { id: r.creatorId, name: r.creatorName },
		likeCount: r.likeCount,
		totalCount: r.totalCount,
		solvedCount: viewerId ? (r.solvedCount ?? 0) : null,
		likedByViewer: !!r.likedByViewer,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt,
	}));

	return { items, total };
}

export async function listUserProblemSets(
	userId: number,
	viewerId?: number
): Promise<ProblemSetListRow[]> {
	const totalCountExpr = totalCountSql();
	const solvedCountExpr = viewerId ? solvedCountSql(viewerId) : sql<number | null>`NULL`;
	const likedExpr = viewerId ? likedByViewerSql(viewerId) : sql<boolean>`FALSE`;

	const rows = await db
		.select({
			id: problemSets.id,
			title: problemSets.title,
			description: problemSets.description,
			likeCount: problemSets.likeCount,
			createdAt: problemSets.createdAt,
			updatedAt: problemSets.updatedAt,
			creatorId: users.id,
			creatorName: users.name,
			totalCount: totalCountExpr,
			solvedCount: solvedCountExpr,
			likedByViewer: likedExpr,
		})
		.from(problemSets)
		.innerJoin(users, eq(users.id, problemSets.createdBy))
		.where(eq(problemSets.createdBy, userId))
		.orderBy(desc(problemSets.createdAt))
		.limit(50);

	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		description: r.description,
		creator: { id: r.creatorId, name: r.creatorName },
		likeCount: r.likeCount,
		totalCount: r.totalCount,
		solvedCount: viewerId ? (r.solvedCount ?? 0) : null,
		likedByViewer: !!r.likedByViewer,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt,
	}));
}

export interface ProblemSetItemRow {
	itemId: number;
	problem: {
		id: number;
		title: string;
		problemType: string;
		judgeAvailable: boolean;
		languageRestricted: boolean;
		hasSubtasks: boolean;
		useFullJudge: boolean;
		isPublic: boolean;
		tier: number;
	};
	order: number;
	solvedByViewer: boolean;
}

export interface ProblemSetDetail {
	set: ProblemSet;
	creator: ProblemSetCreator;
	items: ProblemSetItemRow[];
	likedByViewer: boolean;
	totalCount: number;
	solvedCount: number;
}

export async function getProblemSet(
	id: number,
	viewerId?: number
): Promise<ProblemSetDetail | null> {
	const [setRow] = await db
		.select({
			set: problemSets,
			creatorId: users.id,
			creatorName: users.name,
		})
		.from(problemSets)
		.innerJoin(users, eq(users.id, problemSets.createdBy))
		.where(eq(problemSets.id, id));
	if (!setRow) return null;

	// `problems` is the drizzle FROM-table here, so use the filter variant
	// (which references the default `problems` alias rather than `p`).
	const solvedExpr = viewerId
		? sql<boolean>`${userSolvedProblemFilterSql(viewerId)}`
		: sql<boolean>`FALSE`;

	const itemRows = await db
		.select({
			itemId: problemSetItems.id,
			order: problemSetItems.order,
			problemId: problems.id,
			problemTitle: problems.displayTitle,
			problemType: problems.problemType,
			judgeAvailable: problems.judgeAvailable,
			languageRestricted: sql<boolean>`${problems.allowedLanguages} IS NOT NULL`,
			hasSubtasks: problems.hasSubtasks,
			useFullJudge: problems.useFullJudge,
			isPublic: problems.isPublic,
			tier: problems.tier,
			solvedByViewer: solvedExpr,
		})
		.from(problemSetItems)
		.innerJoin(problems, eq(problems.id, problemSetItems.problemId))
		.where(eq(problemSetItems.problemSetId, id))
		.orderBy(asc(problemSetItems.order), asc(problemSetItems.id));

	let likedByViewer = false;
	if (viewerId) {
		const [likeRow] = await db
			.select({ p: problemSetLikes.problemSetId })
			.from(problemSetLikes)
			.where(and(eq(problemSetLikes.problemSetId, id), eq(problemSetLikes.userId, viewerId)));
		likedByViewer = !!likeRow;
	}

	const totalCount = itemRows.length;
	const solvedCount = viewerId ? itemRows.filter((r) => r.solvedByViewer).length : 0;

	return {
		set: setRow.set,
		creator: { id: setRow.creatorId, name: setRow.creatorName },
		items: itemRows.map((r) => ({
			itemId: r.itemId,
			order: r.order,
			problem: {
				id: r.problemId,
				title: r.problemTitle,
				problemType: r.problemType,
				judgeAvailable: r.judgeAvailable,
				languageRestricted: r.languageRestricted,
				hasSubtasks: r.hasSubtasks,
				useFullJudge: r.useFullJudge,
				isPublic: r.isPublic,
				tier: r.tier,
			},
			solvedByViewer: !!r.solvedByViewer,
		})),
		likedByViewer,
		totalCount,
		solvedCount,
	};
}
