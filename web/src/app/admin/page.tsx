import { CheckCircle, FileText, Send, Users } from "lucide-react";
import type { Metadata } from "next";
import { getAdminDashboardStats } from "@/actions/admin/queries";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
	title: "관리자 대시보드",
};

export default async function AdminDashboardPage() {
	const counts = await getAdminDashboardStats();

	const stats = [
		{ title: "총 사용자", value: counts.users, icon: Users, color: "text-blue-500" },
		{ title: "총 문제", value: counts.problems, icon: FileText, color: "text-emerald-500" },
		{ title: "총 제출", value: counts.submissions, icon: Send, color: "text-amber-500" },
		{ title: "정답 제출", value: counts.accepted, icon: CheckCircle, color: "text-green-500" },
	];

	return (
		<div className="space-y-6">
			<PageBreadcrumb items={[{ label: "관리자" }]} />
			<div>
				<h1 className="text-3xl font-bold">대시보드</h1>
				<p className="text-muted-foreground mt-2">AOJ 관리자 대시보드입니다.</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
							<stat.icon className={`h-5 w-5 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{stat.value}</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
