"use server";

import { getUserRanking as svcGetUserRanking } from "@/lib/services/ranking";

export async function getUserRanking(...args: Parameters<typeof svcGetUserRanking>) {
	return svcGetUserRanking(...args);
}
