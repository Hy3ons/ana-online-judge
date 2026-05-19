import { redirect } from "next/navigation";
import { listMyDevices } from "@/actions/devices/queries";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DevicesTable } from "./devices-table";

export const dynamic = "force-dynamic";

export const metadata = { title: "연결된 앱 — AOJ" };

export default async function DevicesPage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/login?callbackUrl=${encodeURIComponent("/settings/devices")}`);
	}
	const tokens = await listMyDevices();
	return (
		<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
			<PageBreadcrumb items={[{ label: "설정", href: "/settings" }, { label: "연결된 앱" }]} />
			<div>
				<h1 className="text-3xl font-bold">연결된 앱</h1>
				<p className="text-muted-foreground mt-2">
					외부 앱에서 발급된 API 토큰 목록입니다. 의심스러운 활동이 있으면 즉시 회수하세요.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>API 토큰</CardTitle>
					<CardDescription>
						활성 상태의 토큰만 표시됩니다. 회수 또는 만료된 토큰은 숨겨집니다.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DevicesTable tokens={tokens} />
				</CardContent>
			</Card>
		</div>
	);
}
