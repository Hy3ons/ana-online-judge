import "server-only";

import { z } from "zod";
import { getUserAuth } from "./api-auth";
import type { Endpoint } from "./api-types";
import { NotFoundError } from "./api-types";
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
				throw new Error(result.error);
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
			return { items: result.submissions, total: result.total, page: q.page, limit: q.limit };
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
