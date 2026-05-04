import "server-only";
import { labelFor, styleFor } from "./styles";
import type { ExternalSiteClient } from "./types";

const FETCH_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(url: string): Promise<Response> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, {
			signal: ctrl.signal,
			headers: { "User-Agent": "ANA-Online-Judge/1.0" },
		});
	} finally {
		clearTimeout(timer);
	}
}

export const codeforcesClient: ExternalSiteClient = {
	id: "codeforces",
	rateLimit: { requestsPerMinute: 30 },
	styleFor: (r) => styleFor("codeforces", r),
	labelFor: (r) => labelFor("codeforces", r),
	async fetchUser(handle) {
		const url = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
		const res = await fetchWithTimeout(url);
		if (!res.ok && res.status !== 400) {
			throw new Error(`CF API error: ${res.status}`);
		}
		const data = (await res.json()) as
			| { status: "OK"; result: Array<{ handle: string; rating?: number }> }
			| { status: "FAILED"; comment: string };
		if (data.status === "FAILED") {
			if (/not found/i.test(data.comment)) return null;
			throw new Error(`CF API: ${data.comment}`);
		}
		const u = data.result[0];
		if (!u) return null;
		return { handle: u.handle, rating: u.rating ?? null };
	},
};

export const atcoderClient: ExternalSiteClient = {
	id: "atcoder",
	rateLimit: { requestsPerMinute: 10 },
	styleFor: (r) => styleFor("atcoder", r),
	labelFor: (r) => labelFor("atcoder", r),
	async fetchUser(handle) {
		const url = `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`;
		const res = await fetchWithTimeout(url);
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`AtCoder error: ${res.status}`);
		const data = (await res.json()) as Array<{ NewRating: number }>;
		const last = data[data.length - 1];
		return { handle, rating: last?.NewRating ?? null };
	},
};
