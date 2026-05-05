import { notFound, redirect } from "next/navigation";
import { getProblemSet } from "@/actions/problem-sets";
import { auth } from "@/auth";
import { ProblemSetAddProblemButton } from "@/components/problem-sets/problem-set-add-problem-button";
import { ProblemSetEditor } from "@/components/problem-sets/problem-set-editor";
import { ProblemSetMetaEditForm } from "@/components/problem-sets/problem-set-meta-edit-form";

export default async function EditProblemSetPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const numId = Number.parseInt(id, 10);
	if (Number.isNaN(numId)) notFound();

	const session = await auth();
	if (!session?.user?.id) redirect(`/login?redirectTo=/problemsets/${id}/edit`);

	const viewerId = Number.parseInt(session.user.id, 10);
	const role = (session.user as { role?: "user" | "admin" }).role;

	const detail = await getProblemSet(numId, viewerId);
	if (!detail) notFound();
	if (detail.creator.id !== viewerId && role !== "admin") {
		redirect(`/problemsets/${id}`);
	}

	return (
		<div className="container mx-auto max-w-3xl py-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">문제집 편집</h1>
				<ProblemSetAddProblemButton
					problemSetId={detail.set.id}
					excludeIds={detail.items.map((i) => i.problem.id)}
				/>
			</div>
			<ProblemSetMetaEditForm
				id={detail.set.id}
				initialTitle={detail.set.title}
				initialDescription={detail.set.description ?? ""}
			/>
			<ProblemSetEditor problemSetId={detail.set.id} initialItems={detail.items} />
		</div>
	);
}
