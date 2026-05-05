import { notFound } from "next/navigation";
import { getProblemSet } from "@/actions/problem-sets";
import { auth } from "@/auth";
import { ProblemSetDetailHeader } from "@/components/problem-sets/problem-set-detail-header";
import { ProblemSetItemList } from "@/components/problem-sets/problem-set-item-list";

export default async function ProblemSetDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const numId = Number.parseInt(id, 10);
	if (Number.isNaN(numId)) notFound();

	const session = await auth();
	const viewerId = session?.user?.id ? Number.parseInt(session.user.id, 10) : undefined;
	const role = (session?.user as { role?: "user" | "admin" } | undefined)?.role;
	const isLoggedIn = !!viewerId;

	const detail = await getProblemSet(numId, viewerId);
	if (!detail) notFound();

	const canEdit = !!viewerId && (viewerId === detail.creator.id || role === "admin");

	return (
		<div className="container mx-auto max-w-4xl py-8 space-y-6">
			<ProblemSetDetailHeader detail={detail} canEdit={canEdit} isLoggedIn={isLoggedIn} />
			<ProblemSetItemList items={detail.items} showSolved={isLoggedIn} />
		</div>
	);
}
