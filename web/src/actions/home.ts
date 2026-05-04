"use server";

import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { contests, problems, submissions, users } from "@/db/schema";

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

export async function getActiveContestsForHome() {
	const now = new Date();
	return db
		.select()
		.from(contests)
		.where(and(lte(contests.startTime, now), gte(contests.endTime, now)))
		.orderBy(desc(contests.startTime))
		.limit(3);
}

export async function getUpcomingContestsForHome() {
	const now = new Date();
	return db
		.select()
		.from(contests)
		.where(gte(contests.startTime, now))
		.orderBy(contests.startTime)
		.limit(3);
}
