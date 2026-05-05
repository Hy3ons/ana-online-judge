"use server";

import { revalidatePath } from "next/cache";
import { requireProblemSetUser } from "@/actions/problem-sets/auth";
import * as svc from "@/lib/services/problem-sets";

export async function toggleLikeAction(problemSetId: number) {
	const { userId } = await requireProblemSetUser();
	const result = await svc.toggleLike(problemSetId, userId);
	revalidatePath("/problemsets");
	revalidatePath(`/problemsets/${problemSetId}`);
	return result;
}
