import "server-only";
import { randomUUID } from "node:crypto";
import { getRedisClient } from "./redis";

export type LockHandle = { key: string; token: string };

export async function acquireRedisLock(key: string, ttlSec: number): Promise<LockHandle | null> {
	const redis = await getRedisClient();
	const token = randomUUID();
	const r = await redis.set(key, token, "EX", ttlSec, "NX");
	return r === "OK" ? { key, token } : null;
}

export async function releaseRedisLock(handle: LockHandle): Promise<void> {
	const redis = await getRedisClient();
	const lua = `
		if redis.call("GET", KEYS[1]) == ARGV[1] then
			return redis.call("DEL", KEYS[1])
		else
			return 0
		end
	`;
	await redis.eval(lua, 1, handle.key, handle.token);
}
