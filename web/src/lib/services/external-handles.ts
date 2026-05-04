import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { type ExternalSite, userExternalHandles, users } from "@/db/schema";
import { getSite } from "@/lib/external-sites/registry";
import type { ExternalSiteUserInfo } from "@/lib/external-sites/types";

export type LinkResult =
	| { ok: true; rating: number | null }
	| { ok: false; reason: "not_found" | "duplicate" | "external_error" };

export type MyHandle = {
	provider: ExternalSite;
	handle: string;
	rating: number | null;
	updatedAt: Date;
};

export async function linkHandle(
	userId: number,
	provider: ExternalSite,
	handle: string
): Promise<LinkResult> {
	const trimmed = handle.trim();
	if (!trimmed) return { ok: false, reason: "not_found" };

	let info: ExternalSiteUserInfo | null;
	try {
		info = await getSite(provider).fetchUser(trimmed);
	} catch {
		return { ok: false, reason: "external_error" };
	}
	if (!info) return { ok: false, reason: "not_found" };

	try {
		await db.transaction(async (tx) => {
			await tx
				.insert(userExternalHandles)
				.values({
					userId,
					provider,
					handle: info!.handle,
					rating: info!.rating,
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [userExternalHandles.userId, userExternalHandles.provider],
					set: { handle: info!.handle, rating: info!.rating, updatedAt: new Date() },
				});

			const existingMain = await tx
				.select({ main: users.mainExternalSite })
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);
			if (!existingMain[0]?.main) {
				await tx.update(users).set({ mainExternalSite: provider }).where(eq(users.id, userId));
			}
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (/user_external_handles_handle_uniq/.test(msg)) {
			return { ok: false, reason: "duplicate" };
		}
		throw e;
	}

	return { ok: true, rating: info.rating };
}

export async function unlinkHandle(userId: number, provider: ExternalSite): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.delete(userExternalHandles)
			.where(
				and(eq(userExternalHandles.userId, userId), eq(userExternalHandles.provider, provider))
			);

		const userRow = await tx
			.select({ main: users.mainExternalSite })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		if (userRow[0]?.main !== provider) return;

		const remaining = await tx
			.select({ provider: userExternalHandles.provider })
			.from(userExternalHandles)
			.where(eq(userExternalHandles.userId, userId))
			.limit(1);
		await tx
			.update(users)
			.set({ mainExternalSite: remaining[0]?.provider ?? null })
			.where(eq(users.id, userId));
	});
}

export async function setMainSite(userId: number, provider: ExternalSite | null): Promise<void> {
	await db.transaction(async (tx) => {
		if (provider !== null) {
			const has = await tx
				.select({ id: userExternalHandles.id })
				.from(userExternalHandles)
				.where(
					and(eq(userExternalHandles.userId, userId), eq(userExternalHandles.provider, provider))
				)
				.limit(1);
			if (has.length === 0) {
				throw new Error("Cannot set main to an unlinked provider");
			}
		}
		await tx.update(users).set({ mainExternalSite: provider }).where(eq(users.id, userId));
	});
}

export async function syncOne(userId: number, provider: ExternalSite): Promise<void> {
	const where = and(
		eq(userExternalHandles.userId, userId),
		eq(userExternalHandles.provider, provider)
	);

	const row = await db
		.select({ handle: userExternalHandles.handle })
		.from(userExternalHandles)
		.where(where)
		.limit(1);
	const handle = row[0]?.handle;
	if (!handle) return;

	const info = await getSite(provider).fetchUser(handle);
	if (!info) {
		await db.update(userExternalHandles).set({ rating: null, updatedAt: new Date() }).where(where);
		return;
	}
	await db
		.update(userExternalHandles)
		.set({ handle: info.handle, rating: info.rating, updatedAt: new Date() })
		.where(where);
}

/**
 * Batch-syncs the oldest-updated `limit` handles for `provider`.
 * **Caller must hold a single-flight lock** (Redis lock for cron, per-user
 * cooldown for action) — this function does not claim rows. Concurrent calls
 * would re-process the same chunk and double the external-API load.
 */
export async function syncBatch(
	provider: ExternalSite,
	opts: { limit: number; minIntervalMs: number }
): Promise<{ updated: number; failed: number }> {
	const rows = await db
		.select({ userId: userExternalHandles.userId, handle: userExternalHandles.handle })
		.from(userExternalHandles)
		.where(eq(userExternalHandles.provider, provider))
		.orderBy(asc(userExternalHandles.updatedAt))
		.limit(opts.limit);

	let updated = 0;
	let failed = 0;
	for (const { userId } of rows) {
		try {
			await syncOne(userId, provider);
			updated++;
		} catch (err) {
			failed++;
			console.error("[external-handles] syncOne failed", { userId, provider, err });
		}
		if (opts.minIntervalMs > 0) {
			await new Promise((r) => setTimeout(r, opts.minIntervalMs));
		}
	}
	return { updated, failed };
}

export async function getMyHandles(userId: number): Promise<MyHandle[]> {
	return db
		.select({
			provider: userExternalHandles.provider,
			handle: userExternalHandles.handle,
			rating: userExternalHandles.rating,
			updatedAt: userExternalHandles.updatedAt,
		})
		.from(userExternalHandles)
		.where(eq(userExternalHandles.userId, userId));
}
