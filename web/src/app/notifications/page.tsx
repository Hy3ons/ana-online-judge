import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyNotifications } from "@/actions/notifications";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionInfo } from "@/lib/auth-utils";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = {
	title: "알림",
};

export default async function NotificationsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { userId } = await getSessionInfo();
	if (userId === null) redirect("/login");

	const { page } = await searchParams;
	const pageNum = Math.max(1, Number(page) || 1);
	const { items } = await getMyNotifications(pageNum);

	return (
		<div className="page-container py-8">
			<PageBreadcrumb items={[{ label: "알림" }]} />
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">알림</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<NotificationsList initial={items} />
				</CardContent>
			</Card>
		</div>
	);
}
