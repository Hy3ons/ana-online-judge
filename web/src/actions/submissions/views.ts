"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { type ExternalSite, submissions, submissionViews, users } from "@/db/schema";
import { getSessionInfo } from "@/lib/auth-utils";
import { userDisplayHandle, userDisplayJoin } from "@/lib/db/user-display";
import { createNotification } from "@/lib/services/notifications";
import { isLegitimateCodeView } from "@/lib/submission-access";

/**
 * 제출 상세 페이지가 마운트될 때 1회 호출. 정당한 타인 최초 열람만 기록하고,
 * 그 경우에만 소유자에게 알림을 보낸다. 멱등(ON CONFLICT DO NOTHING).
 */
export async function recordSubmissionView(submissionId: number): Promise<void> {
	const { userId } = await getSessionInfo();
	if (userId === null) return;

	const [sub] = await db
		.select({
			userId: submissions.userId,
			problemId: submissions.problemId,
			contestId: submissions.contestId,
			visibility: submissions.visibility,
			verdict: submissions.verdict,
		})
		.from(submissions)
		.where(eq(submissions.id, submissionId))
		.limit(1);
	if (!sub) return;
	if (sub.userId === userId) return; // 본인 열람 제외

	const legit = await isLegitimateCodeView({
		submission: sub,
		viewerUserId: userId,
	});
	if (!legit) return; // 관리자 권한 우회 등 비정당 열람: 기록·알림 안 함

	const inserted = await db
		.insert(submissionViews)
		.values({ submissionId, viewerId: userId })
		.onConflictDoNothing({
			target: [submissionViews.submissionId, submissionViews.viewerId],
		})
		.returning({ id: submissionViews.id });

	if (inserted.length === 0) return; // 재방문: 알림 없음

	const [viewer] = await db
		.select({ name: users.name, username: users.username })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	const viewerName = viewer?.name || viewer?.username || "누군가";
	const body = `[${viewerName}](/profile/${viewer?.username ?? ""})님이 회원님의 [제출 #${submissionId}](/submissions/${submissionId})을 확인했습니다.`;
	await createNotification(sub.userId, "submission_viewed", body);
}

export type ViewerRow = {
	viewerId: number;
	name: string;
	username: string;
	mainExternalSite: ExternalSite | null;
	mainExternalRating: number | null;
	createdAt: Date;
};

/** 제출 코드를 본 사용자 목록(최초 열람순 desc). 소유자/관리자만 호출하도록 페이지에서 가드. */
export async function getSubmissionViewers(submissionId: number): Promise<ViewerRow[]> {
	const { userId, isAdmin } = await getSessionInfo();
	if (userId === null) return [];
	const [sub] = await db
		.select({ userId: submissions.userId })
		.from(submissions)
		.where(eq(submissions.id, submissionId))
		.limit(1);
	if (!sub) return [];
	if (!isAdmin && sub.userId !== userId) return []; // 소유자/관리자만

	return db
		.select({
			viewerId: submissionViews.viewerId,
			name: users.name,
			username: users.username,
			mainExternalSite: users.mainExternalSite,
			mainExternalRating: userDisplayHandle.rating,
			createdAt: submissionViews.createdAt,
		})
		.from(submissionViews)
		.innerJoin(users, eq(users.id, submissionViews.viewerId))
		.leftJoin(userDisplayJoin.table, userDisplayJoin.on)
		.where(eq(submissionViews.submissionId, submissionId))
		.orderBy(desc(submissionViews.createdAt));
}
