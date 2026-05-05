"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerOrAdminForProblemSet } from "@/actions/problem-sets/auth";
import * as svc from "@/lib/services/problem-sets";

export async function addProblemAction(problemSetId: number, problemId: number) {
	await requireOwnerOrAdminForProblemSet(problemSetId);
	await svc.addProblemToSet(problemSetId, problemId);
	revalidatePath(`/problemsets/${problemSetId}`);
	revalidatePath(`/problemsets/${problemSetId}/edit`);
}

export async function removeProblemAction(problemSetId: number, problemId: number) {
	await requireOwnerOrAdminForProblemSet(problemSetId);
	await svc.removeProblemFromSet(problemSetId, problemId);
	revalidatePath(`/problemsets/${problemSetId}`);
	revalidatePath(`/problemsets/${problemSetId}/edit`);
}

export async function reorderItemsAction(
	problemSetId: number,
	ordered: Array<{ id: number; order: number }>
) {
	await requireOwnerOrAdminForProblemSet(problemSetId);
	await svc.reorderProblemSetItems(problemSetId, ordered);
	revalidatePath(`/problemsets/${problemSetId}`);
	revalidatePath(`/problemsets/${problemSetId}/edit`);
}

export async function replaceItemsAction(problemSetId: number, problemIds: number[]) {
	await requireOwnerOrAdminForProblemSet(problemSetId);
	await svc.replaceProblemSetItems(problemSetId, problemIds);
	revalidatePath("/problemsets");
	revalidatePath(`/problemsets/${problemSetId}`);
	revalidatePath(`/problemsets/${problemSetId}/edit`);
	revalidatePath("/profile");
}
