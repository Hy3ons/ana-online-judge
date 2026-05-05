import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProblemSet } from "@/actions/problem-sets";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import type { PickerProblem } from "@/components/practices/problem-picker-dialog";
import { DeleteProblemSetButton } from "@/components/problem-sets/delete-problem-set-button";
import { ProblemSetForm } from "@/components/problem-sets/problem-set-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProblemType } from "@/db/schema";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const numId = Number.parseInt(id, 10);
	if (Number.isNaN(numId)) return { title: "문제집을 찾을 수 없습니다" };
	const detail = await getProblemSet(numId);
	if (!detail) return { title: "문제집을 찾을 수 없습니다" };
	return { title: `${detail.set.title} - 편집` };
}

export default async function EditProblemSetPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const numId = Number.parseInt(id, 10);
	if (Number.isNaN(numId)) notFound();

	const session = await auth();
	if (!session?.user?.id) redirect(`/login?redirectTo=/problemsets/${id}/edit`);

	const viewerId = Number.parseInt(session.user.id, 10);
	const role = (session.user as { role?: "user" | "admin" }).role;

	const detail = await getProblemSet(numId);
	if (!detail) notFound();
	if (detail.creator.id !== viewerId && role !== "admin") {
		redirect(`/problemsets/${id}`);
	}

	const initial = {
		id: detail.set.id,
		title: detail.set.title,
		description: detail.set.description,
		problems: detail.items.map<PickerProblem>((it) => ({
			id: it.problem.id,
			title: it.problem.title,
			problemType: it.problem.problemType as ProblemType,
			judgeAvailable: it.problem.judgeAvailable,
			languageRestricted: it.problem.languageRestricted,
			hasSubtasks: it.problem.hasSubtasks,
			useFullJudge: it.problem.useFullJudge,
			isPublic: it.problem.isPublic,
			tier: it.problem.tier,
		})),
	};

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
			<PageBreadcrumb
				items={[
					{ label: "문제집", href: "/problemsets" },
					{ label: detail.set.title, href: `/problemsets/${id}` },
					{ label: "편집" },
				]}
			/>
			<Card>
				<CardHeader>
					<CardTitle>문제집 편집</CardTitle>
				</CardHeader>
				<CardContent>
					<ProblemSetForm mode="edit" initial={initial} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>위험 영역</CardTitle>
				</CardHeader>
				<CardContent>
					<DeleteProblemSetButton problemSetId={detail.set.id} />
				</CardContent>
			</Card>
		</div>
	);
}
