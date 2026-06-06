"use client";

import { useEffect, useRef, useState } from "react";
import { markNotificationsReadAction } from "@/actions/notifications";
import {
	NotificationItem,
	type NotificationItemData,
} from "@/components/notifications/notification-item";

export function NotificationsList({ initial }: { initial: NotificationItemData[] }) {
	// 진입 시점에 미확인이던 것만 하이라이트로 고정.
	const [highlightIds] = useState<Set<number>>(
		() => new Set(initial.filter((n) => n.readAt === null).map((n) => n.id))
	);
	const done = useRef(false);
	useEffect(() => {
		if (done.current) return;
		done.current = true;
		const ids = [...highlightIds];
		if (ids.length > 0) markNotificationsReadAction(ids);
	}, [highlightIds]);

	if (initial.length === 0) {
		return (
			<div className="px-4 py-16 text-center text-sm text-muted-foreground">알림이 없습니다.</div>
		);
	}
	return (
		<div>
			{initial.map((n) => (
				<NotificationItem key={n.id} data={n} highlight={highlightIds.has(n.id)} />
			))}
		</div>
	);
}
