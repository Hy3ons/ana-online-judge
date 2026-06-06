"use server";

import { getSessionInfo } from "@/lib/auth-utils";
import * as svc from "@/lib/services/notifications";

export async function getUnreadNotificationCount(): Promise<number> {
	const { userId } = await getSessionInfo();
	if (userId === null) return 0;
	return svc.getUnreadCount(userId);
}

export async function getMyNotifications(page = 1) {
	const { userId } = await getSessionInfo();
	if (userId === null) return { items: [], total: 0 };
	return svc.getNotifications(userId, { page });
}

export async function markNotificationsReadAction(ids: number[]): Promise<void> {
	const { userId } = await getSessionInfo();
	if (userId === null) return;
	await svc.markNotificationsRead(userId, ids);
}
