"use server";

import { and, count, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";

// 사용자를 특정 대회에 묶어 대회 계정으로 지정.
export async function setAccountAsContestOnly(userId: number, contestId: number) {
	await requireAdmin();

	const [updatedUser] = await db
		.update(users)
		.set({
			contestId: contestId,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	revalidatePath("/admin/users");
	revalidatePath("/admin/contests");

	return updatedUser;
}

// 대회 계정에서 일반 계정으로 환원.
export async function setAccountAsNormal(userId: number) {
	await requireAdmin();

	const [updatedUser] = await db
		.update(users)
		.set({
			contestId: null,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	revalidatePath("/admin/users");
	revalidatePath("/admin/contests");

	return updatedUser;
}

// 계정 활성/비활성 토글
export async function toggleAccountActive(userId: number) {
	await requireAdmin();

	const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

	if (!user) {
		throw new Error("User not found");
	}

	const [updatedUser] = await db
		.update(users)
		.set({
			isActive: !user.isActive,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	revalidatePath("/admin/users");

	return updatedUser;
}

// 선택한 사용자들의 contestId 를 일괄 지정.
export async function bulkSetContestAccounts(userIds: number[], contestId: number) {
	await requireAdmin();

	if (userIds.length === 0) {
		throw new Error("사용자 ID 목록이 비어있습니다");
	}

	if (!contestId || contestId <= 0) {
		throw new Error("유효하지 않은 대회 ID입니다");
	}

	await db.transaction(async (tx) => {
		for (const userId of userIds) {
			await tx
				.update(users)
				.set({
					contestId: contestId,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));
		}
	});

	revalidatePath("/admin/users");
	revalidatePath("/admin/contests");

	return { success: true, count: userIds.length };
}

// 대회 계정 목록 조회 (contestId 필터 가능)
export async function getContestAccounts(contestId?: number) {
	await requireAdmin();

	const whereConditions = [isNotNull(users.contestId)];

	if (contestId !== undefined) {
		whereConditions.push(eq(users.contestId, contestId));
	}

	const accounts = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			email: users.email,
			contestId: users.contestId,
			isActive: users.isActive,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(and(...whereConditions))
		.orderBy(users.createdAt);

	return accounts;
}

// 모든 대회 계정 조회 (contest info 포함)
export async function getAllContestAccounts() {
	await requireAdmin();

	const accounts = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			email: users.email,
			contestId: users.contestId,
			isActive: users.isActive,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(isNotNull(users.contestId))
		.orderBy(users.createdAt);

	return accounts;
}

// 특정 대회의 계정 통계
export async function getContestAccountStats(contestId: number) {
	await requireAdmin();

	const [stats] = await db
		.select({
			total: count(),
			active: sql<number>`SUM(CASE WHEN ${users.isActive} = true THEN 1 ELSE 0 END)`,
			inactive: sql<number>`SUM(CASE WHEN ${users.isActive} = false THEN 1 ELSE 0 END)`,
		})
		.from(users)
		.where(and(isNotNull(users.contestId), eq(users.contestId, contestId)));

	return {
		total: stats.total,
		active: Number(stats.active) || 0,
		inactive: Number(stats.inactive) || 0,
	};
}

// usernames 로 일괄 contestId 지정 — 못 찾은 username은 missing 에 담아 반환.
export async function bulkAssignContestByUsernames(rawInput: string, contestId: number) {
	await requireAdmin();

	const usernames = Array.from(
		new Set(
			rawInput
				.split(/[\n,]/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0)
		)
	);

	if (usernames.length === 0) {
		throw new Error("사용자명을 입력해주세요");
	}

	if (!contestId || contestId <= 0) {
		throw new Error("유효하지 않은 대회 ID입니다");
	}

	const [contest] = await db
		.select({ id: contests.id })
		.from(contests)
		.where(eq(contests.id, contestId))
		.limit(1);
	if (!contest) {
		throw new Error("대회를 찾을 수 없습니다");
	}

	const found = await db
		.select({ id: users.id, username: users.username })
		.from(users)
		.where(inArray(users.username, usernames));

	const foundUsernames = new Set(found.map((u) => u.username));
	const missing = usernames.filter((u) => !foundUsernames.has(u));

	if (found.length > 0) {
		await db
			.update(users)
			.set({ contestId, updatedAt: new Date() })
			.where(
				inArray(
					users.id,
					found.map((u) => u.id)
				)
			);
	}

	revalidatePath("/admin/users");
	revalidatePath("/admin/contests");

	return {
		assigned: found.map((u) => u.username),
		missing,
	};
}

// 활성/예정 대회 + 최근 종료 대회를 함께 선택지로 제공.
export async function listContestsForAssignment() {
	await requireAdmin();
	return db
		.select({
			id: contests.id,
			title: contests.title,
			startTime: contests.startTime,
			endTime: contests.endTime,
		})
		.from(contests)
		.orderBy(sql`${contests.startTime} DESC`)
		.limit(100);
}

export type GetContestAccountsReturn = Awaited<ReturnType<typeof getContestAccounts>>;
export type ContestAccountItem = GetContestAccountsReturn[number];
export type GetContestAccountStatsReturn = Awaited<ReturnType<typeof getContestAccountStats>>;
