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

export function NotificationItem({
	data,
	alreadyRead,
}: {
	data: NotificationItemData;
	alreadyRead: boolean;
}) {
	return (
		<div
			className={cn(
				"px-4 py-3 border-b last:border-b-0 text-sm",
				alreadyRead && "text-muted-foreground"
			)}
		>
			<div className="leading-6">
				<MarkdownRenderer inline content={data.body} />
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{formatRelativeKo(data.createdAt)}</div>
		</div>
	);
}
