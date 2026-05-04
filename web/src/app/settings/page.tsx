import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getMyHandles } from "@/lib/services/external-handles";
import { getUserByUsername } from "@/lib/services/users";
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

	const [handles, mainRow] = await Promise.all([
		getMyHandles(user.id),
		db.select({ main: users.mainExternalSite }).from(users).where(eq(users.id, user.id)).limit(1),
	]);
	const mainExternalSite = mainRow[0]?.main ?? null;

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
