import { aliasedTable, and, eq } from "drizzle-orm";
import { userExternalHandles, users } from "@/db/schema";

/**
 * 메인 핸들만 LEFT JOIN하기 위한 alias.
 * 호출자: `.leftJoin(userDisplayJoin.table, userDisplayJoin.on)`
 */
export const userDisplayHandle = aliasedTable(userExternalHandles, "main_handle");

export const userDisplaySelect = {
	name: users.name,
	username: users.username,
	mainExternalSite: users.mainExternalSite,
	mainExternalRating: userDisplayHandle.rating,
} as const;

export const userDisplayJoin = {
	table: userDisplayHandle,
	on: and(
		eq(userDisplayHandle.userId, users.id),
		eq(userDisplayHandle.provider, users.mainExternalSite)
	),
};
