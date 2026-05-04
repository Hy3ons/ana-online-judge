import "server-only";
import { ALL_SITES, getSite } from "@/lib/external-sites/registry";
import { acquireRedisLock, releaseRedisLock } from "@/lib/redis-lock";
import { syncBatch } from "@/lib/services/external-handles";

const LOCK_KEY = "external-sync-lock";
const LOCK_TTL_SEC = 6 * 60 * 60;
const CHUNK_LIMIT = 100;
const MAX_CHUNKS = 200;

export async function runWeeklyHandleSync(): Promise<void> {
	const lock = await acquireRedisLock(LOCK_KEY, LOCK_TTL_SEC);
	if (!lock) {
		console.info("[external-handle-sync] another worker holds lock; skip");
		return;
	}
	try {
		for (const provider of ALL_SITES) {
			const client = getSite(provider);
			const minIntervalMs = Math.ceil(60_000 / client.rateLimit.requestsPerMinute);
			let totalUpdated = 0;
			let totalFailed = 0;
			let chunks = 0;
			while (chunks < MAX_CHUNKS) {
				const { updated, failed } = await syncBatch(provider, {
					limit: CHUNK_LIMIT,
					minIntervalMs,
				});
				totalUpdated += updated;
				totalFailed += failed;
				chunks++;
				if (updated + failed === 0 || updated + failed < CHUNK_LIMIT) break;
			}
			console.info(
				`[external-handle-sync] ${provider}: updated=${totalUpdated} failed=${totalFailed}`
			);
		}
	} finally {
		await releaseRedisLock(lock);
	}
}
