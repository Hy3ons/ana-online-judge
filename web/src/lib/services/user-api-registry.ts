import "server-only";

import { z } from "zod";
import { getUserAuth } from "./api-auth";
import type { Endpoint } from "./api-types";
import { ForbiddenError, NotFoundError } from "./api-types";
import { listActiveContestsForUser } from "./contests";
import { getSubmissionById, getSubmissions, submitCode } from "./submissions";
import { getUserMe } from "./user-profile";

export const userEndpoints: Endpoint[] = [
	{
		type: "json",
		method: "GET",
		path: "me",
		description: "현재 토큰 소유자의 프로필",
		handler: async ({ request }) => {
			const { userId } = getUserAuth(request);
			const me = await getUserMe(userId);
			if (!me) throw new NotFoundError("User not found");
			return me;
		},
	},
	{
		type: "json",
		method: "POST",
		path: "submissions",
		description: "코드 제출 (토큰 인증)",
		body: z.object({
			problemId: z.number().int(),
			code: z.string().min(1).max(1_000_000),
			language: z.string(),
			contestId: z.number().int().optional(),
		}),
		handler: async ({ request, body }) => {
			const { userId } = getUserAuth(request);
			const data = body as {
				problemId: number;
				code: string;
				language: string;
				contestId?: number;
			};
			const result = await submitCode({ ...data, userId });
			if (result.error) {
				const msg = result.error;
				// 404: 문제 또는 대회를 찾을 수 없음
				if (msg.includes("문제를 찾을 수 없") || msg.includes("대회를 찾을 수 없")) {
					throw new NotFoundError(msg);
				}
				// 404: 대회에 해당 문제가 없음
				if (msg.includes("대회에 포함되어 있지 않")) {
					throw new NotFoundError(msg);
				}
				// 403: 대회 참가 자격 / 대회 시간 외 제출
				if (
					msg.includes("등록된 참가자") ||
					msg.includes("시작되지 않았") ||
					msg.includes("종료되었습니다")
				) {
					throw new ForbiddenError(msg);
				}
				// 그 외 (언어 미지원, 코드 비어있음/너무 김 등) → 400
				throw new Error(msg);
			}
			return { submissionId: result.submissionId };
		},
		rateLimit: { perMinute: 30 },
	},
	{
		type: "json",
		method: "GET",
		path: "submissions",
		description: "내 제출 목록 (paginated)",
		query: z.object({
			page: z.coerce.number().int().min(1).default(1),
			limit: z.coerce.number().int().min(1).max(100).default(20),
			contestId: z.coerce.number().int().optional(),
			problemId: z.coerce.number().int().optional(),
		}),
		handler: async ({ request, query }) => {
			const { userId } = getUserAuth(request);
			const q = query as { page: number; limit: number; contestId?: number; problemId?: number };
			const result = await getSubmissions({
				userId,
				page: q.page,
				limit: q.limit,
				contestId: q.contestId,
				problemId: q.problemId,
			});
			return { submissions: result.submissions, total: result.total, page: q.page, limit: q.limit };
		},
	},
	{
		type: "json",
		method: "GET",
		path: "contests/active",
		description: "참여 중이거나 예정된 대회 (now < endTime)",
		handler: async ({ request }) => {
			const { userId } = getUserAuth(request);
			return listActiveContestsForUser(userId);
		},
	},
	{
		type: "json",
		method: "GET",
		path: "submissions/:id",
		description: "내 제출 상세",
		handler: async ({ request, pathParams }) => {
			const { userId } = getUserAuth(request);
			const id = Number.parseInt(pathParams.id, 10);
			if (!Number.isFinite(id)) throw new NotFoundError("Invalid submission id");
			const sub = await getSubmissionById(id);
			if (!sub || sub.userId !== userId) throw new NotFoundError("Submission not found");
			return sub;
		},
	},
];
