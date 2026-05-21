import { describe, expect, it } from "vitest";
import {
	isAccessTokenExpired,
	isRefreshTokenExpired,
	type StoredSession,
	TokenStore,
} from "../../src/auth/tokenStore";

// Minimal SecretStorage stub (the real one uses OS keychain via vscode API).
class MemSecrets {
	private map = new Map<string, string>();
	async get(k: string) {
		return this.map.get(k);
	}
	async store(k: string, v: string) {
		this.map.set(k, v);
	}
	async delete(k: string) {
		this.map.delete(k);
	}
	onDidChange = () => ({ dispose: () => {} });
}

const sample: StoredSession = {
	accessToken: "aoj_at_x",
	refreshToken: "aoj_rt_y",
	expiresAt: Date.now() + 3600_000,
	refreshExpiresAt: Date.now() + 30 * 86400_000,
	userId: 42,
	username: "alice",
};

describe("TokenStore", () => {
	it("returns null when nothing stored", async () => {
		const s = new TokenStore(new MemSecrets() as never);
		expect(await s.load()).toBeNull();
	});

	it("round-trips a session", async () => {
		const s = new TokenStore(new MemSecrets() as never);
		await s.save(sample);
		const loaded = await s.load();
		expect(loaded).toEqual(sample);
	});

	it("returns null on corrupted payload", async () => {
		const secrets = new MemSecrets();
		await secrets.store("aoj.session", "not-json");
		const s = new TokenStore(secrets as never);
		expect(await s.load()).toBeNull();
	});

	it("clears", async () => {
		const s = new TokenStore(new MemSecrets() as never);
		await s.save(sample);
		await s.clear();
		expect(await s.load()).toBeNull();
	});
});

describe("expiry helpers", () => {
	it("flags expired access token with 30s buffer", () => {
		expect(isAccessTokenExpired(sample, sample.expiresAt - 20_000)).toBe(true);
		expect(isAccessTokenExpired(sample, sample.expiresAt - 60_000)).toBe(false);
	});
	it("flags expired refresh token", () => {
		expect(isRefreshTokenExpired(sample, sample.refreshExpiresAt + 1)).toBe(true);
		expect(isRefreshTokenExpired(sample, sample.refreshExpiresAt - 1)).toBe(false);
	});
});
