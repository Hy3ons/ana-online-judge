import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listUserTokens } from "@/lib/services/user-tokens";
import { DevicesTable } from "./devices-table";

export const dynamic = "force-dynamic";

export const metadata = { title: "연결된 디바이스 — AOJ" };

export default async function DevicesPage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/login?callbackUrl=${encodeURIComponent("/settings/devices")}`);
	}
	const tokens = await listUserTokens(Number(session.user.id));
	return (
		<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
			<PageBreadcrumb
				items={[{ label: "설정", href: "/settings" }, { label: "연결된 디바이스" }]}
			/>
			<div>
				<h1 className="text-3xl font-bold">연결된 디바이스</h1>
				<p className="text-muted-foreground mt-2">
					VS Code 확장 등에서 발급된 API 토큰 목록입니다. 의심스러운 활동이 있으면 즉시 회수하세요.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>API 토큰</CardTitle>
					<CardDescription>현재 발급된 토큰 목록입니다.</CardDescription>
				</CardHeader>
				<CardContent className="p-0 overflow-x-auto">
					<div className="p-6 pt-0">
						<DevicesTable tokens={tokens} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
