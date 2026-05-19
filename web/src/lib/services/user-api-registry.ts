import "server-only";

import { z } from "zod";
import { getUserAuth } from "./api-auth";
import type { Endpoint } from "./api-types";
import { NotFoundError } from "./api-types";
import { submitCode } from "./submissions";
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
];
