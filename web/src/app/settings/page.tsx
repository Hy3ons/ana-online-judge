import Link from "next/link";
import { redirect } from "next/navigation";
import { getMainExternalSite, getUserByUsername, getUserHandles } from "@/actions/profile";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectedHandlesForm } from "./connected-handles-form";
import { ProfileForm } from "./profile-form";
import { VisibilityForm } from "./visibility-form";

export const metadata = { title: "설정 — AOJ" };

export default async function SettingsPage() {
	const session = await auth();
	const username = session?.user?.username;
	if (!username) redirect("/login");

	const user = await getUserByUsername(username);
	if (!user) redirect("/login");

	const [handles, mainExternalSite] = await Promise.all([
		getUserHandles(user.id),
		getMainExternalSite(user.id),
	]);

	return (
		<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
			<PageBreadcrumb items={[{ label: "설정" }]} />
			<Card>
				<CardHeader>
					<CardTitle>프로필</CardTitle>
				</CardHeader>
				<CardContent>
					<ProfileForm initial={{ name: user.name, bio: user.bio, avatarUrl: user.avatarUrl }} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>외부 핸들 연동</CardTitle>
				</CardHeader>
				<CardContent>
					<ConnectedHandlesForm initialHandles={handles} initialMainSite={mainExternalSite} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>기본 제출 공개 설정</CardTitle>
				</CardHeader>
				<CardContent>
					<VisibilityForm initial={user.defaultSubmissionVisibility ?? "public"} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>연결된 디바이스</CardTitle>
					<CardDescription>VS Code 확장 등에서 발급된 API 토큰을 관리합니다</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						여러 디바이스에서 발급된 API 토큰을 확인하고 관리할 수 있습니다.
					</p>
					<Link href="/settings/devices">
						<Button variant="outline">디바이스 관리</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
