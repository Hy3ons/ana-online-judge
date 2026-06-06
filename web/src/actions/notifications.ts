"use server";

import { getSessionInfo, requireAdmin } from "@/lib/auth-utils";
import * as svc from "@/lib/services/notifications";
import { type AdminUsersFilter, listAdminUserIds } from "@/lib/services/users";

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

/** 선택한 사용자 id 목록에 공지를 발송한다(관리자 전용). 발송한 수신자 수를 반환. */
export async function sendAnnouncementByIdsAction(
	userIds: number[],
	body: string
): Promise<number> {
	await requireAdmin();
	if (body.trim().length === 0) throw new Error("본문을 입력하세요.");
	return svc.sendAnnouncement(userIds, body);
}

/** 사용자 필터에 매칭되는 모든 사용자에게 공지를 발송한다(관리자 전용). 발송한 수신자 수를 반환. */
export async function sendAnnouncementByFilterAction(
	filter: AdminUsersFilter,
	body: string
): Promise<number> {
	await requireAdmin();
	if (body.trim().length === 0) throw new Error("본문을 입력하세요.");
	const ids = await listAdminUserIds(filter);
	return svc.sendAnnouncement(ids, body);
}
