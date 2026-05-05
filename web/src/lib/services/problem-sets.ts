import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { ProblemSet } from "@/db/schema";
import { problemSetItems, problemSetLikes, problemSets } from "@/db/schema";

export const PROBLEM_SET_MAX_PER_USER = 20;
export const PROBLEM_SET_TITLE_MAX = 80;
export const PROBLEM_SET_DESCRIPTION_MAX = 1000;
export const PROBLEM_SET_LIST_PAGE_SIZE = 20;

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
	input: { title: string; description?: string | null }
): Promise<ProblemSet> {
	const title = input.title.trim();
	if (title.length === 0 || title.length > PROBLEM_SET_TITLE_MAX) {
		throw new Error(`제목은 1자 이상 ${PROBLEM_SET_TITLE_MAX}자 이하여야 합니다.`);
	}
	const description = input.description?.trim() || null;
	if (description && description.length > PROBLEM_SET_DESCRIPTION_MAX) {
		throw new Error(`설명은 ${PROBLEM_SET_DESCRIPTION_MAX}자 이하여야 합니다.`);
	}
	const [row] = await db
		.insert(problemSets)
		.values({ title, description, createdBy: userId })
		.returning();
	if (!row) throw new Error("문제집 생성에 실패했습니다.");
	return row;
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

export async function getProblemSetCreator(id: number): Promise<{
	id: number;
	createdBy: number;
} | null> {
	const [row] = await db
		.select({ id: problemSets.id, createdBy: problemSets.createdBy })
		.from(problemSets)
		.where(eq(problemSets.id, id));
	return row ?? null;
}

export async function addProblemToSet(problemSetId: number, problemId: number): Promise<void> {
	const [maxRow] = await db
		.select({ maxOrder: sql<number>`COALESCE(MAX(${problemSetItems.order}), -1)` })
		.from(problemSetItems)
		.where(eq(problemSetItems.problemSetId, problemSetId));
	const nextOrder = (maxRow?.maxOrder ?? -1) + 1;
	await db
		.insert(problemSetItems)
		.values({ problemSetId, problemId, order: nextOrder })
		.onConflictDoNothing();
	await db
		.update(problemSets)
		.set({ updatedAt: new Date() })
		.where(eq(problemSets.id, problemSetId));
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
