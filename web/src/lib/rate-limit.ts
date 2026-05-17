import "server-only";

/**
 * In-memory fixed-window rate limiter.
 *
 * - Single Node process accuracy. Web runs as a single container.
 * - Swap to Postgres/Redis backend later if multi-instance is needed.
 * - Lazy cleanup of expired entries when store grows.
 */

interface Bucket {
	count: number;
	resetAt: number; // epoch ms
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: number; // epoch ms
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
	const now = Date.now();
	const existing = store.get(key);

	if (!existing || existing.resetAt <= now) {
		const resetAt = now + windowMs;
		store.set(key, { count: 1, resetAt });
		if (store.size > 5000) cleanup(now);
		return { allowed: true, limit, remaining: limit - 1, resetAt };
	}

	if (existing.count >= limit) {
		return { allowed: false, limit, remaining: 0, resetAt: existing.resetAt };
	}

	existing.count += 1;
	return {
		allowed: true,
		limit,
		remaining: limit - existing.count,
		resetAt: existing.resetAt,
	};
}

function cleanup(now: number) {
	for (const [k, v] of store) {
		if (v.resetAt <= now) store.delete(k);
	}
}

/**
 * Cloudflare → 일반 프록시 → request 순으로 클라이언트 IP 추정.
 * 알 수 없으면 "unknown".
 */
export function extractClientIp(request: Request): string {
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return cf.trim();
	const xff = request.headers.get("x-forwarded-for");
	if (xff) return xff.split(",")[0].trim();
	return "unknown";
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
	return {
		"X-RateLimit-Limit": String(r.limit),
		"X-RateLimit-Remaining": String(r.remaining),
		"X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
	};
}

/** Test-only: reset module state. */
export function __resetRateLimitStore() {
	store.clear();
}
