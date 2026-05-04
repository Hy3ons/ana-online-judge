"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { testcases } from "@/db/schema";
import { getSessionInfo } from "@/lib/auth-utils";
import * as problemsService from "@/lib/services/problems";

export async function getProblems(options?: Parameters<typeof problemsService.getProblems>[0]) {
	const { isAdmin } = await getSessionInfo();
	return problemsService.getProblems(options, { isAdmin });
}

export async function getProblemById(id: number, contestId?: number) {
	const { userId, isAdmin } = await getSessionInfo();
	return problemsService.getProblemById(id, contestId, {
		userId: userId ?? undefined,
		isAdmin,
	});
}

export async function getProblemTestcaseCount(problemId: number): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)::int` })
		.from(testcases)
		.where(eq(testcases.problemId, problemId));
	return row?.count ?? 0;
}

export type GetProblemsReturn = Awaited<ReturnType<typeof getProblems>>;
export type ProblemListItem = GetProblemsReturn["problems"][number];
export type GetProblemByIdReturn = Awaited<ReturnType<typeof getProblemById>>;
