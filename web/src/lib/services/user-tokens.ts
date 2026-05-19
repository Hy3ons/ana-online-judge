import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { userApiTokens, users } from "@/db/schema";
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
		.select({
			tokenId: userApiTokens.id,
			userId: userApiTokens.userId,
			scopes: userApiTokens.scopes,
			expiresAt: userApiTokens.expiresAt,
		})
		.from(userApiTokens)
		.innerJoin(users, eq(users.id, userApiTokens.userId))
		.where(
			and(
				eq(userApiTokens.tokenHash, tokenHash),
				isNull(userApiTokens.revokedAt),
				eq(users.isActive, true),
				eq(users.contestAccountOnly, false)
			)
		)
		.limit(1);
	if (!row) return null;
	if (row.expiresAt.getTime() <= Date.now()) return null;
	// async 갱신 (응답 대기 안 함, 오류 무시)
	db.update(userApiTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(userApiTokens.id, row.tokenId))
		.catch(() => {});
	return { userId: row.userId, scopes: row.scopes, tokenId: row.tokenId };
}

/**
 * Refresh token으로 새 토큰 쌍 발급. 기존 토큰은 즉시 revoke (rotation).
 * 조건부 UPDATE-RETURNING으로 row를 원자적으로 점유해 동시 rotation race를 방지.
 * revokedAt IS NULL 인 row만 UPDATE되므로 두 번째 호출자는 0건 반환 → null.
 */
export async function rotateRefreshToken(refreshToken: string): Promise<TokenPair | null> {
	const refreshHash = hashToken(refreshToken);
	return await db.transaction(async (tx) => {
		// 원자적 점유: 이미 revoked면 row 0건 반환 → null
		const [claimed] = await tx
			.update(userApiTokens)
			.set({ revokedAt: new Date() })
			.where(and(eq(userApiTokens.refreshHash, refreshHash), isNull(userApiTokens.revokedAt)))
			.returning({
				userId: userApiTokens.userId,
				type: userApiTokens.type,
				scopes: userApiTokens.scopes,
				label: userApiTokens.label,
				refreshExpiresAt: userApiTokens.refreshExpiresAt,
			});
		if (!claimed) return null;
		if (!claimed.refreshExpiresAt || claimed.refreshExpiresAt.getTime() <= Date.now()) {
			// 만료된 refresh를 우연히 점유 — 새 쌍은 발급하지 않음
			return null;
		}

		// 새 토큰 쌍 생성 및 INSERT (트랜잭션 내)
		const accessToken = generateAccessToken();
		const newRefreshToken = generateRefreshToken();
		const now = new Date();
		await tx.insert(userApiTokens).values({
			userId: claimed.userId,
			tokenHash: hashToken(accessToken),
			refreshHash: hashToken(newRefreshToken),
			type: claimed.type,
			scopes: claimed.scopes ?? ["user"],
			label: claimed.label,
			expiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000),
			refreshExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
		});

		return {
			accessToken,
			refreshToken: newRefreshToken,
			accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
			refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
		};
	});
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
