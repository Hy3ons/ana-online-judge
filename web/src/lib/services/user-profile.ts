import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getUserMe(userId: number) {
	const [u] = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			role: users.role,
			rating: users.rating,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return u ?? null;
}
