"use server";

import { revalidatePath } from "next/cache";
import type { ExternalSite } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { ALL_SITES } from "@/lib/external-sites/registry";
import { getRedisClient } from "@/lib/redis";
import {
	getMyHandles,
	type LinkResult,
	linkHandle,
	setMainSite,
	syncOne,
	unlinkHandle,
} from "@/lib/services/external-handles";

const SYNC_COOLDOWN_SEC = 60;

function revalidateForUser(username: string | undefined | null) {
	revalidatePath("/settings");
	if (username) revalidatePath(`/profile/${username}`);
}

export async function linkHandleAction(
	provider: ExternalSite,
	handle: string
): Promise<LinkResult | { ok: false; reason: "empty" }> {
	const trimmed = handle.trim();
	if (!trimmed) return { ok: false, reason: "empty" };
	const { session, userId } = await requireAuth();
	const result = await linkHandle(userId, provider, trimmed);
	if (result.ok) revalidateForUser(session.user?.username);
	return result;
}

export async function unlinkHandleAction(provider: ExternalSite): Promise<void> {
	const { session, userId } = await requireAuth();
	await unlinkHandle(userId, provider);
	revalidateForUser(session.user?.username);
}

export async function setMainSiteAction(provider: ExternalSite | null): Promise<void> {
	const { session, userId } = await requireAuth();
	await setMainSite(userId, provider);
	revalidateForUser(session.user?.username);
}

export async function syncMyHandlesAction(): Promise<
	{ ok: true; results: Record<ExternalSite, "ok" | "failed"> } | { ok: false; reason: "cooldown" }
> {
	const { session, userId } = await requireAuth();
	const redis = await getRedisClient();
	const lockKey = `external-sync-cooldown:${userId}`;
	const acquired = await redis.set(lockKey, "1", "EX", SYNC_COOLDOWN_SEC, "NX");
	if (acquired !== "OK") return { ok: false, reason: "cooldown" };

	const handles = await getMyHandles(userId);
	const results = {} as Record<ExternalSite, "ok" | "failed">;
	for (const provider of ALL_SITES) {
		if (!handles.find((h) => h.provider === provider)) continue;
		try {
			await syncOne(userId, provider);
			results[provider] = "ok";
		} catch {
			results[provider] = "failed";
		}
	}
	revalidateForUser(session.user?.username);
	return { ok: true, results };
}
