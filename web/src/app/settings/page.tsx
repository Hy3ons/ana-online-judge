import { redirect } from "next/navigation";
import { getMainExternalSite, getUserByUsername, getUserHandles } from "@/actions/profile";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		</div>
	);
}
