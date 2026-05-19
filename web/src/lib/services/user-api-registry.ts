import "server-only";

import { getUserAuth } from "./api-auth";
import type { Endpoint } from "./api-types";
import { NotFoundError } from "./api-types";
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
];
