import { eq } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getUserAuth, requireUserToken } from "@/lib/services/api-auth";
import { buildSubmissionStream } from "@/lib/services/submission-stream";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
	const authErr = await requireUserToken(request);
	if (authErr) return authErr;
	const { userId } = getUserAuth(request);

	const { id: idStr } = await params;
	const id = Number.parseInt(idStr, 10);
	if (!Number.isFinite(id)) {
		return new Response("Invalid id", { status: 400 });
	}

	// 소유권 확인 + verdict 조회를 한 쿼리로 처리
	// 존재하지 않거나 본인 제출이 아니면 404 (existence leak 방지)
	const [row] = await db
		.select({ userId: submissions.userId, verdict: submissions.verdict })
		.from(submissions)
		.where(eq(submissions.id, id))
		.limit(1);

	if (!row || row.userId !== userId) {
		return new Response("Not found", { status: 404 });
	}

	return buildSubmissionStream(id, row.verdict, request);
}
