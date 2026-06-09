import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { type WorkshopDraft, workshopDrafts } from "@/db/schema";

export type UpdateStatementInput = {
	title: string;
	description: string;
};

/**
 * 호출자 draft의 title/description(markdown)을 갱신한다. (Phase A: per-draft)
 */
export async function updateStatement(
	problemId: number,
	userId: number,
	input: UpdateStatementInput
): Promise<WorkshopDraft> {
	const title = input.title.trim();
	if (!title) throw new Error("제목은 비어 있을 수 없습니다");
	if (title.length > 200) throw new Error("제목은 200자 이내여야 합니다");
	if (input.description.length > 200_000) throw new Error("지문은 200,000자 이내여야 합니다");
	const [updated] = await db
		.update(workshopDrafts)
		.set({ title, description: input.description, updatedAt: new Date() })
		.where(and(eq(workshopDrafts.workshopProblemId, problemId), eq(workshopDrafts.userId, userId)))
		.returning();
	if (!updated) throw new Error("드래프트를 찾을 수 없습니다");
	return updated;
}
