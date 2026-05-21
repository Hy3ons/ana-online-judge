import { describe, expect, it, vi } from "vitest";
import { ApiClient, UnauthorizedError } from "../../src/api/client";
import type { StoredSession } from "../../src/auth/tokenStore";

const expired: StoredSession = {
	accessToken: "expired_at",
	refreshToken: "rt",
	expiresAt: Date.now() - 60_000,
	refreshExpiresAt: Date.now() + 86400_000,
	userId: 1,
	username: "u",
};
const valid: StoredSession = {
	...expired,
	accessToken: "fresh_at",
	expiresAt: Date.now() + 3600_000,
};

function makeDF(refreshResult: {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	refresh_expires_in: number;
	token_type: "Bearer";
}) {
	return {
		refresh: vi.fn(async () => refreshResult),
	} as never;
}

describe("ApiClient", () => {
	it("throws Unauthorized when no session and auth=true", async () => {
		const client = new ApiClient({
			endpoint: "https://x",
			getSession: async () => null,
			saveSession: async () => {},
			clearSession: async () => {},
			deviceFlow: { refresh: async () => ({}) } as never,
			fetchImpl: vi.fn() as never,
		});
		await expect(client.request("/api/v1/user/me")).rejects.toThrow(UnauthorizedError);
	});

	it("proactively refreshes expired access token before request", async () => {
		let session: StoredSession = expired;
		const fetchImpl = vi.fn(async (_url: unknown, init: RequestInit) => {
			const auth = (init.headers as Record<string, string>).authorization;
			expect(auth).toBe("Bearer fresh_at");
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		});
		const client = new ApiClient({
			endpoint: "https://x",
			getSession: async () => session,
			saveSession: async (s) => {
				session = s;
			},
			clearSession: async () => {
				session = null as never;
			},
			deviceFlow: makeDF({
				access_token: "fresh_at",
				refresh_token: "rt2",
				expires_in: 3600,
				refresh_expires_in: 2592000,
				token_type: "Bearer",
			}),
			fetchImpl: fetchImpl as never,
		});
		await client.request("/api/v1/user/me");
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it("reactively refreshes on 401 once and retries", async () => {
		let session: StoredSession = valid;
		let call = 0;
		const fetchImpl = vi.fn(async (_url: unknown, init: RequestInit) => {
			call++;
			const auth = (init.headers as Record<string, string>).authorization;
			if (call === 1) {
				expect(auth).toBe("Bearer fresh_at");
				return new Response("", { status: 401 });
			}
			expect(auth).toBe("Bearer next_at");
			return new Response(JSON.stringify({ id: 1 }), { status: 200 });
		});
		const client = new ApiClient({
			endpoint: "https://x",
			getSession: async () => session,
			saveSession: async (s) => {
				session = s;
			},
			clearSession: async () => {},
			deviceFlow: makeDF({
				access_token: "next_at",
				refresh_token: "rt2",
				expires_in: 3600,
				refresh_expires_in: 2592000,
				token_type: "Bearer",
			}),
			fetchImpl: fetchImpl as never,
		});
		const out = await client.request<{ id: number }>("/api/v1/user/me");
		expect(out.id).toBe(1);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("clears session and throws when refresh token expired", async () => {
		const stale: StoredSession = { ...expired, refreshExpiresAt: Date.now() - 1000 };
		let cleared = false;
		const client = new ApiClient({
			endpoint: "https://x",
			getSession: async () => stale,
			saveSession: async () => {},
			clearSession: async () => {
				cleared = true;
			},
			deviceFlow: { refresh: vi.fn() } as never,
			fetchImpl: vi.fn() as never,
		});
		await expect(client.request("/api/v1/user/me")).rejects.toThrow(UnauthorizedError);
		expect(cleared).toBe(true);
	});
});
