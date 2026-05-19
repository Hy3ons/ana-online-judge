import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { buildSubmissionStream } from "@/lib/services/submission-stream";
import { checkContestSubmissionAccess } from "@/lib/submission-access";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const submissionId = parseInt(id, 10);

	if (Number.isNaN(submissionId)) {
		return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
	}

	// Check if submission exists
	const [submission] = await db
		.select({
			id: submissions.id,
			verdict: submissions.verdict,
			userId: submissions.userId,
			contestId: submissions.contestId,
		})
		.from(submissions)
		.where(eq(submissions.id, submissionId))
		.limit(1);

	if (!submission) {
		return NextResponse.json({ error: "Submission not found" }, { status: 404 });
	}

	const forbidden = await checkContestSubmissionAccess(submission);
	if (forbidden) return forbidden;

	return buildSubmissionStream(submissionId, submission.verdict, _request);
}
