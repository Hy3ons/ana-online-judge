import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { type WorkshopDraft, workshopDrafts } from "@/db/schema";

/**
 * 워크샵 문제의 "편집 가능한 헤더"는 Phase A부터 per-user draft에 산다.
 * 이 헬퍼는 (problemId, userId) 또는 draftId로 draft 행을 읽어 헤더에 접근하게 한다.
 * draft가 없으면 null. 호출자는 보통 ensureWorkshopDraft로 먼저 draft 생성을 보장한다.
 */
export async function getDraftByUser(
	problemId: number,
	userId: number
): Promise<WorkshopDraft | null> {
	const [row] = await db
		.select()
		.from(workshopDrafts)
		.where(and(eq(workshopDrafts.workshopProblemId, problemId), eq(workshopDrafts.userId, userId)))
		.limit(1);
	return row ?? null;
}

export async function getDraftById(draftId: number): Promise<WorkshopDraft | null> {
	const [row] = await db
		.select()
		.from(workshopDrafts)
		.where(eq(workshopDrafts.id, draftId))
		.limit(1);
	return row ?? null;
}
