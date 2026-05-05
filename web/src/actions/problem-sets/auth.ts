import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemSets } from "@/db/schema";
import { getSessionInfo, requireAuth } from "@/lib/auth-utils";

/**
 * 작성자 본인 또는 관리자만 통과시킨다. 그렇지 않으면 throw.
 * - 작성자가 아닌 일반 사용자는 권한 없음 에러
 * - 문제집이 존재하지 않으면 별도 에러
 */
export async function requireOwnerOrAdminForProblemSet(
	problemSetId: number
): Promise<{ userId: number; isAdmin: boolean }> {
	const { userId, isAdmin } = await getSessionInfo();
	if (userId === null) throw new Error("로그인이 필요합니다.");
	if (isAdmin) return { userId, isAdmin: true };

	const [row] = await db
		.select({ createdBy: problemSets.createdBy })
		.from(problemSets)
		.where(eq(problemSets.id, problemSetId));
	if (!row) throw new Error("문제집을 찾을 수 없습니다.");
	if (row.createdBy !== userId) throw new Error("권한이 없습니다.");
	return { userId, isAdmin: false };
}

/** 단순 로그인 강제 (좋아요 등). */
export async function requireProblemSetUser(): Promise<{ userId: number; isAdmin: boolean }> {
	const { userId } = await requireAuth();
	const { isAdmin } = await getSessionInfo();
	return { userId, isAdmin };
}
