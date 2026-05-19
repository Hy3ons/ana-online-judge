import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeviceForm } from "./device-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ user_code?: string }>;

export default async function OAuthDevicePage({ searchParams }: { searchParams: SearchParams }) {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/login?callbackUrl=${encodeURIComponent("/oauth/device")}`);
	}

	const params = await searchParams;
	const initialUserCode = (params.user_code ?? "").toUpperCase();

	const displayName = session.user.username ?? session.user.name ?? "사용자";

	return (
		<main className="container max-w-md py-12">
			<h1 className="mb-6 text-2xl font-bold tracking-tight">디바이스 인증</h1>
			<DeviceForm initialUserCode={initialUserCode} username={displayName} />
		</main>
	);
}
