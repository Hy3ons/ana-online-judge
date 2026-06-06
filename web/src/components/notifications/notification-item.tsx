"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { formatRelativeKo } from "@/lib/format-time";
import { cn } from "@/lib/utils";

export type NotificationItemData = {
	id: number;
	body: string;
	readAt: Date | string | null;
	createdAt: Date | string;
};

/** highlight=true이면 (이번 보기에서 새로 확인하는) 미확인 알림으로 강조. */
export function NotificationItem({
	data,
	highlight,
}: {
	data: NotificationItemData;
	highlight: boolean;
}) {
	return (
		<div className={cn("px-4 py-3 border-b last:border-b-0 text-sm", highlight && "bg-accent")}>
			<div className="leading-6">
				<MarkdownRenderer inline content={data.body} />
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{formatRelativeKo(data.createdAt)}</div>
		</div>
	);
}
