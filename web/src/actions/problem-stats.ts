"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problems } from "@/db/schema";
import {
	getProblemRanking as getProblemRankingService,
	getProblemStats as getProblemStatsService,
} from "@/lib/services/problem-stats";

export async function getProblemStats(problemId: number, contestId?: number) {
	return getProblemStatsService(problemId, contestId);
}

export async function getProblemRanking(
	problemId: number,
	options?: {
		sortBy?: "executionTime" | "codeLength";
		language?: string;
		page?: number;
		limit?: number;
		contestId?: number;
	}
) {
	// Derive useFullJudge server-side — never trust the client to set the
	// sort mode, otherwise the bestPassedSum tiebreaker can be bypassed by
	// forging useFullJudge=false.
	const [problem] = await db
		.select({ useFullJudge: problems.useFullJudge })
		.from(problems)
		.where(eq(problems.id, problemId))
		.limit(1);
	return getProblemRankingService(problemId, {
		...options,
		useFullJudge: problem?.useFullJudge ?? false,
	});
}
