import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { userApiTokens } from "@/db/schema";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/token-utils";

export const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1시간
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30일

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
	accessExpiresIn: number;
	refreshExpiresIn: number;
}

export async function issueTokenPair(opts: {
	userId: number;
	type: "oauth_device" | "pat";
	label?: string;
	scopes?: string[];
}): Promise<TokenPair> {
	const accessToken = generateAccessToken();
	const refreshToken = generateRefreshToken();
	const now = new Date();
	await db.insert(userApiTokens).values({
		userId: opts.userId,
		tokenHash: hashToken(accessToken),
		refreshHash: hashToken(refreshToken),
		type: opts.type,
		scopes: opts.scopes ?? ["user"],
		label: opts.label,
		expiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000),
		refreshExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
	});
	return {
		accessToken,
		refreshToken,
		accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
		refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
	};
}

/**
 * Bearer access token 검증. 유효하면 { userId, scopes, tokenId } 반환, 아니면 null.
 * 부수효과로 lastUsedAt 갱신 (fire-and-forget).
 */
export async function validateAccessToken(
	accessToken: string
): Promise<{ userId: number; scopes: string[]; tokenId: number } | null> {
	const tokenHash = hashToken(accessToken);
	const [row] = await db
		.select()
		.from(userApiTokens)
		.where(and(eq(userApiTokens.tokenHash, tokenHash), isNull(userApiTokens.revokedAt)))
		.limit(1);
	if (!row) return null;
	if (row.expiresAt.getTime() <= Date.now()) return null;
	// async 갱신 (응답 대기 안 함)
	void db.update(userApiTokens).set({ lastUsedAt: new Date() }).where(eq(userApiTokens.id, row.id));
	return { userId: row.userId, scopes: row.scopes, tokenId: row.id };
}

/**
 * Refresh token으로 새 토큰 쌍 발급. 기존 토큰은 즉시 revoke (rotation).
 */
export async function rotateRefreshToken(refreshToken: string): Promise<TokenPair | null> {
	const refreshHash = hashToken(refreshToken);
	const [row] = await db
		.select()
		.from(userApiTokens)
		.where(and(eq(userApiTokens.refreshHash, refreshHash), isNull(userApiTokens.revokedAt)))
		.limit(1);
	if (!row) return null;
	if (!row.refreshExpiresAt || row.refreshExpiresAt.getTime() <= Date.now()) return null;

	const pair = await issueTokenPair({
		userId: row.userId,
		type: row.type,
		label: row.label ?? undefined,
		scopes: row.scopes,
	});
	await db.update(userApiTokens).set({ revokedAt: new Date() }).where(eq(userApiTokens.id, row.id));
	return pair;
}

export async function revokeToken(accessToken: string): Promise<boolean> {
	const tokenHash = hashToken(accessToken);
	const result = await db
		.update(userApiTokens)
		.set({ revokedAt: new Date() })
		.where(and(eq(userApiTokens.tokenHash, tokenHash), isNull(userApiTokens.revokedAt)));
	return result.count > 0;
}

export async function revokeTokenById(tokenId: number, userId: number): Promise<boolean> {
	const result = await db
		.update(userApiTokens)
		.set({ revokedAt: new Date() })
		.where(and(eq(userApiTokens.id, tokenId), eq(userApiTokens.userId, userId)));
	return result.count > 0;
}

export async function listUserTokens(userId: number) {
	return db
		.select({
			id: userApiTokens.id,
			type: userApiTokens.type,
			label: userApiTokens.label,
			scopes: userApiTokens.scopes,
			expiresAt: userApiTokens.expiresAt,
			lastUsedAt: userApiTokens.lastUsedAt,
			createdAt: userApiTokens.createdAt,
			revokedAt: userApiTokens.revokedAt,
		})
		.from(userApiTokens)
		.where(eq(userApiTokens.userId, userId))
		.orderBy(desc(userApiTokens.createdAt));
}
