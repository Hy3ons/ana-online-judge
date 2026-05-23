"use server";

import { revalidatePath } from "next/cache";
import { getSessionInfo, requireAdmin } from "@/lib/auth-utils";
import * as adminContestOperators from "@/lib/services/contest-operators";

export async function getContestOperators(contestId: number) {
	return adminContestOperators.getContestOperators(contestId);
}

export async function isUserContestOperator(contestId: number, userId?: number) {
	const { userId: sessionUserId } = await getSessionInfo();
	const targetUserId = userId ?? sessionUserId;
	if (!targetUserId) {
		return false;
	}
	return adminContestOperators.isContestOperator(contestId, targetUserId);
}

export async function addOperatorToContest(contestId: number, userId: number) {
	await requireAdmin();
	const result = await adminContestOperators.addOperatorToContest(contestId, userId);
	revalidatePath(`/admin/contests/${contestId}/operators`);
	revalidatePath(`/admin/contests/${contestId}`);
	revalidatePath(`/contests/${contestId}`);
	return result;
}

export async function removeOperatorFromContest(contestId: number, userId: number) {
	await requireAdmin();
	const result = await adminContestOperators.removeOperatorFromContest(contestId, userId);
	revalidatePath(`/admin/contests/${contestId}/operators`);
	revalidatePath(`/admin/contests/${contestId}`);
	revalidatePath(`/contests/${contestId}`);
	return result;
}

export type GetContestOperatorsReturn = Awaited<ReturnType<typeof getContestOperators>>;
export type ContestOperatorItem = GetContestOperatorsReturn[number];
