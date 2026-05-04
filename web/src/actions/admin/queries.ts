"use server";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { contestProblems, problems, submissions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";

export type AdminDashboardStats = {
	users: number;
	problems: number;
	submissions: number;
	accepted: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
	await requireAdmin();
	const [u, p, s, a] = await Promise.all([
		db.select({ count: count() }).from(users),
		db.select({ count: count() }).from(problems),
		db.select({ count: count() }).from(submissions),
		db.select({ count: count() }).from(submissions).where(eq(submissions.verdict, "accepted")),
	]);
	return {
		users: u[0].count,
		problems: p[0].count,
		submissions: s[0].count,
		accepted: a[0].count,
	};
}

export async function listContestProblemLabels(contestId: number) {
	await requireAdmin();
	return db
		.select({
			problemId: contestProblems.problemId,
			label: contestProblems.label,
		})
		.from(contestProblems)
		.where(eq(contestProblems.contestId, contestId))
		.orderBy(asc(contestProblems.order));
}
