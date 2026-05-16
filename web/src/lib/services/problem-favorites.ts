import { and, eq, type SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { problemFavorites, problems } from "@/db/schema";

export async function isFavorited(problemId: number, userId: number): Promise<boolean> {
	const [row] = await db
		.select({ problemId: problemFavorites.problemId })
		.from(problemFavorites)
		.where(and(eq(problemFavorites.problemId, problemId), eq(problemFavorites.userId, userId)))
		.limit(1);
	return !!row;
}

export async function toggleFavorite(
	problemId: number,
	userId: number
): Promise<{ favorited: boolean }> {
	return await db.transaction(async (tx) => {
		const inserted = await tx
			.insert(problemFavorites)
			.values({ problemId, userId })
			.onConflictDoNothing()
			.returning({ problemId: problemFavorites.problemId });
		if (inserted.length > 0) {
			return { favorited: true };
		}
		await tx
			.delete(problemFavorites)
			.where(and(eq(problemFavorites.problemId, problemId), eq(problemFavorites.userId, userId)));
		return { favorited: false };
	});
}

export function userFavoritedProblemFilterSql(userId: number): SQL {
	return sql`EXISTS (
		SELECT 1 FROM ${problemFavorites}
		WHERE ${problemFavorites.problemId} = ${problems.id}
		  AND ${problemFavorites.userId} = ${userId}
	)`;
}
