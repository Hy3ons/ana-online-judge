import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contestOperators, contests, users } from "@/db/schema";

export async function getContestOperators(contestId: number) {
	return db
		.select({
			userId: contestOperators.userId,
			createdAt: contestOperators.createdAt,
			user: {
				username: users.username,
				name: users.name,
			},
		})
		.from(contestOperators)
		.innerJoin(users, eq(contestOperators.userId, users.id))
		.where(eq(contestOperators.contestId, contestId))
		.orderBy(asc(contestOperators.createdAt));
}

export async function isContestOperator(contestId: number, userId: number) {
	const [row] = await db
		.select({ userId: contestOperators.userId })
		.from(contestOperators)
		.where(and(eq(contestOperators.contestId, contestId), eq(contestOperators.userId, userId)))
		.limit(1);
	return !!row;
}

export async function addOperatorToContest(contestId: number, userId: number) {
	const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
	if (!contest) {
		throw new Error("대회를 찾을 수 없습니다");
	}

	const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	if (!user) {
		throw new Error("사용자를 찾을 수 없습니다");
	}

	const [existing] = await db
		.select()
		.from(contestOperators)
		.where(and(eq(contestOperators.contestId, contestId), eq(contestOperators.userId, userId)))
		.limit(1);

	if (existing) {
		throw new Error("이미 운영자로 등록된 사용자입니다");
	}

	await db.insert(contestOperators).values({ contestId, userId });
	return { success: true };
}

export async function removeOperatorFromContest(contestId: number, userId: number) {
	await db
		.delete(contestOperators)
		.where(and(eq(contestOperators.contestId, contestId), eq(contestOperators.userId, userId)));
	return { success: true };
}
