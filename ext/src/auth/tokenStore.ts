import type * as vscode from "vscode";

const KEY = "aoj.session";

export interface StoredSession {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // epoch ms
	refreshExpiresAt: number; // epoch ms
	userId: number;
	username: string;
}

export class TokenStore {
	constructor(private readonly secrets: vscode.SecretStorage) {}

	async load(): Promise<StoredSession | null> {
		const raw = await this.secrets.get(KEY);
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw) as StoredSession;
			if (!parsed.accessToken || !parsed.refreshToken) return null;
			return parsed;
		} catch {
			return null;
		}
	}

	async save(session: StoredSession): Promise<void> {
		await this.secrets.store(KEY, JSON.stringify(session));
	}

	async clear(): Promise<void> {
		await this.secrets.delete(KEY);
	}
}

export function isAccessTokenExpired(s: StoredSession, nowMs: number = Date.now()): boolean {
	// 30초 여유: 막 만료된 토큰으로 첫 호출 시도해 401 → refresh 흐름을 피한다.
	return s.expiresAt - 30_000 <= nowMs;
}

export function isRefreshTokenExpired(s: StoredSession, nowMs: number = Date.now()): boolean {
	return s.refreshExpiresAt <= nowMs;
}
