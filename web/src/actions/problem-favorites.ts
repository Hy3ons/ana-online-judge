"use server";

import { revalidatePath } from "next/cache";
import { getSessionInfo, requireAuth } from "@/lib/auth-utils";
import * as favoritesService from "@/lib/services/problem-favorites";

export async function toggleProblemFavorite(problemId: number) {
	const { userId } = await requireAuth();
	const result = await favoritesService.toggleFavorite(problemId, userId);
	revalidatePath(`/problems/${problemId}`);
	revalidatePath("/problems");
	return result;
}

export async function isProblemFavorited(problemId: number): Promise<boolean> {
	const { userId } = await getSessionInfo();
	if (userId === null) return false;
	return favoritesService.isFavorited(problemId, userId);
}
