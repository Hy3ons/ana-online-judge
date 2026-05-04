import "server-only";
import { labelFor, profileUrlFor, styleFor } from "./styles";
import type { ExternalSiteClient } from "./types";

const FETCH_TIMEOUT_MS = 5_000;
const USER_AGENT = "ANA-Online-Judge/1.0";

async function fetchWithTimeout(url: string): Promise<Response> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, {
			signal: ctrl.signal,
			headers: { "User-Agent": USER_AGENT },
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
	profileUrl: (handle) => profileUrlFor("codeforces", handle),
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
	profileUrl: (handle) => profileUrlFor("atcoder", handle),
	async fetchUser(handle) {
		const url = `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`;
		const res = await fetchWithTimeout(url);
		// AtC currently returns 200 + [] for unknown handles (indistinguishable from
		// "registered but never rated"), but historically used 404. Keep the guard.
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`AtCoder error: ${res.status}`);
		const data = (await res.json()) as Array<{ IsRated: boolean; NewRating: number }>;
		// AtC fills NewRating with the previous rating for unrated contests (open
		// rounds), so the latest entry can lie. Filter to IsRated entries to mirror
		// the AtCoder profile UI's display rating.
		const lastRated = [...data].reverse().find((e) => e.IsRated);
		return { handle, rating: lastRated?.NewRating ?? null };
	},
};
