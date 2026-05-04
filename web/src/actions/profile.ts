"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { type SubmissionVisibility, submissionVisibilityEnum, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { getUserHandles as svcGetUserHandles } from "@/lib/services/external-handles";
import { getUserRanking as getUserRankingService } from "@/lib/services/ranking";
import {
	getUserHeatmap as svcGetUserHeatmap,
	getUserLanguageStats as svcGetUserLanguageStats,
	getUserStats as svcGetUserStats,
} from "@/lib/services/user-stats";
import {
	getUserByUsername as svcGetUserByUsername,
	updateUserDefaultVisibility as updateUserDefaultVisibilityService,
	updateUserProfile as updateUserProfileService,
} from "@/lib/services/users";

export async function getProfile(username: string) {
	return svcGetUserByUsername(username);
}

export async function getProfileStats(userId: number) {
	return svcGetUserStats(userId);
}

export async function getProfileHeatmap(userId: number) {
	return svcGetUserHeatmap(userId);
}

export async function getProfileLanguageStats(userId: number) {
	return svcGetUserLanguageStats(userId);
}

export async function getUserByUsername(...args: Parameters<typeof svcGetUserByUsername>) {
	return svcGetUserByUsername(...args);
}

export async function getUserHandles(...args: Parameters<typeof svcGetUserHandles>) {
	return svcGetUserHandles(...args);
}

export async function getUserStats(...args: Parameters<typeof svcGetUserStats>) {
	return svcGetUserStats(...args);
}

export async function getUserHeatmap(...args: Parameters<typeof svcGetUserHeatmap>) {
	return svcGetUserHeatmap(...args);
}

export async function getUserLanguageStats(...args: Parameters<typeof svcGetUserLanguageStats>) {
	return svcGetUserLanguageStats(...args);
}

export async function getMainExternalSite(userId: number) {
	const [row] = await db
		.select({ main: users.mainExternalSite })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return row?.main ?? null;
}

export async function updateProfile(data: {
	name?: string;
	bio?: string | null;
	avatarUrl?: string | null;
}) {
	const { session, userId } = await requireAuth();
	const result = await updateUserProfileService(userId, data);
	revalidatePath("/settings");
	const username = session.user?.username;
	if (username) {
		revalidatePath(`/profile/${username}`);
	}
	return result;
}

export async function getUserRanking(options?: { page?: number; limit?: number }) {
	return getUserRankingService(options);
}

export async function updateDefaultSubmissionVisibility(visibility: SubmissionVisibility) {
	try {
		const { session, userId } = await requireAuth();
		const allowed = submissionVisibilityEnum.enumValues as readonly SubmissionVisibility[];
		if (!allowed.includes(visibility)) {
			return { error: "잘못된 공개 설정입니다." };
		}
		await updateUserDefaultVisibilityService(userId, visibility);
		revalidatePath("/settings");
		const username = session.user?.username;
		if (username) {
			revalidatePath(`/profile/${username}`);
		}
		return { success: true };
	} catch (error) {
		console.error("updateDefaultSubmissionVisibility error", error);
		return { error: "저장 중 오류가 발생했어요." };
	}
}
