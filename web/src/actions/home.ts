"use server";

import { and, count, desc, eq, gte, inArray, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { contestParticipants, contests, problems, submissions, users } from "@/db/schema";
import { getSessionInfo } from "@/lib/auth-utils";

export type HomeStats = { problems: number; users: number; submissions: number };

export async function getHomeStats(): Promise<HomeStats> {
	const [p, u, s] = await Promise.all([
		db.select({ count: count() }).from(problems).where(eq(problems.isPublic, true)),
		db.select({ count: count() }).from(users),
		db.select({ count: count() }).from(submissions),
	]);
	return {
		problems: p[0].count,
		users: u[0].count,
		submissions: s[0].count,
	};
}

// Admins see all contests; logged-in users see public + private contests where
// they're registered; logged-out users see only public.
async function getVisibleContestsClause(): Promise<SQL | undefined> {
	const { userId, isAdmin } = await getSessionInfo();
	if (isAdmin) return undefined;
	if (!userId) return eq(contests.visibility, "public");

	const registered = await db
		.select({ contestId: contestParticipants.contestId })
		.from(contestParticipants)
		.where(eq(contestParticipants.userId, userId));
	const registeredIds = registered.map((r) => r.contestId);
	if (registeredIds.length === 0) return eq(contests.visibility, "public");
	return or(
		eq(contests.visibility, "public"),
		and(eq(contests.visibility, "private"), inArray(contests.id, registeredIds))
	);
}

export async function getActiveContestsForHome() {
	const now = new Date();
	const visClause = await getVisibleContestsClause();
	const conditions: SQL[] = [lte(contests.startTime, now), gte(contests.endTime, now)];
	if (visClause) conditions.push(visClause);
	return db
		.select()
		.from(contests)
		.where(and(...conditions))
		.orderBy(desc(contests.startTime))
		.limit(3);
}

export async function getUpcomingContestsForHome() {
	const now = new Date();
	const visClause = await getVisibleContestsClause();
	const conditions: SQL[] = [gte(contests.startTime, now)];
	if (visClause) conditions.push(visClause);
	return db
		.select()
		.from(contests)
		.where(and(...conditions))
		.orderBy(contests.startTime)
		.limit(3);
}
