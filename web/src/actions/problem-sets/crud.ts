"use server";

import { revalidatePath } from "next/cache";
import {
	requireOwnerOrAdminForProblemSet,
	requireProblemSetUser,
} from "@/actions/problem-sets/auth";
import * as svc from "@/lib/services/problem-sets";
import { assertTurnstile } from "@/lib/turnstile-guard";

export async function createProblemSetAction(
	input: { title: string; description?: string },
	turnstileToken: string
) {
	await assertTurnstile(turnstileToken);
	const { userId, isAdmin } = await requireProblemSetUser();
	if (!isAdmin) {
		const c = await svc.countUserProblemSets(userId);
		if (c >= svc.PROBLEM_SET_MAX_PER_USER) {
			throw new Error(`최대 ${svc.PROBLEM_SET_MAX_PER_USER}개까지 만들 수 있습니다.`);
		}
	}
	const set = await svc.createProblemSet(userId, input);
	revalidatePath("/problemsets");
	return set;
}

export async function updateProblemSetAction(
	id: number,
	input: { title?: string; description?: string }
) {
	await requireOwnerOrAdminForProblemSet(id);
	await svc.updateProblemSet(id, input);
	revalidatePath("/problemsets");
	revalidatePath(`/problemsets/${id}`);
}

export async function deleteProblemSetAction(id: number) {
	await requireOwnerOrAdminForProblemSet(id);
	await svc.deleteProblemSet(id);
	revalidatePath("/problemsets");
}
