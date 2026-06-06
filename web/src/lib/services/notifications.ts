import "server-only";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { type Notification, type NotificationType, notifications } from "@/db/schema";

export type NotificationListItem = Pick<
	Notification,
	"id" | "type" | "body" | "readAt" | "createdAt"
>;

/** 단건 알림 생성. */
export async function createNotification(
	userId: number,
	type: NotificationType,
	body: string
): Promise<void> {
	await db.insert(notifications).values({ userId, type, body });
}

/** 다건 알림 bulk 생성(공지/재채점 배치). 빈 배열이면 no-op. */
export async function createNotificationsBulk(
	rows: { userId: number; type: NotificationType; body: string }[]
): Promise<void> {
	if (rows.length === 0) return;
	await db.insert(notifications).values(rows);
}

/** 미확인 알림 개수. */
export async function getUnreadCount(userId: number): Promise<number> {
	const [row] = await db
		.select({ count: count() })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
	return row?.count ?? 0;
}

/** 알림 목록(최신순, 페이지네이션). */
export async function getNotifications(
	userId: number,
	{ page = 1, limit = 20 }: { page?: number; limit?: number } = {}
): Promise<{ items: NotificationListItem[]; total: number }> {
	const offset = (page - 1) * limit;
	const items = await db
		.select({
			id: notifications.id,
			type: notifications.type,
			body: notifications.body,
			readAt: notifications.readAt,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(limit)
		.offset(offset);
	const [row] = await db
		.select({ count: count() })
		.from(notifications)
		.where(eq(notifications.userId, userId));
	return { items, total: row?.count ?? 0 };
}

/**
 * 관리자 공지를 수신자에게 발송한다. id 중복은 제거하고, 발송한 수신자 수를 반환한다.
 * 빈 목록이면 0을 반환한다(no-op).
 */
export async function sendAnnouncement(userIds: number[], body: string): Promise<number> {
	const unique = [...new Set(userIds)];
	await createNotificationsBulk(
		unique.map((userId) => ({ userId, type: "admin_announcement" as const, body }))
	);
	return unique.length;
}

/** 지정 알림을 읽음 처리(소유자 검증 포함). 이미 읽은 것은 변화 없음. */
export async function markNotificationsRead(userId: number, ids: number[]): Promise<void> {
	if (ids.length === 0) return;
	await db
		.update(notifications)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(notifications.userId, userId),
				inArray(notifications.id, ids),
				isNull(notifications.readAt)
			)
		);
}
