import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProblemSetForm } from "@/components/problem-sets/problem-set-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "문제집 만들기" };

export default async function NewProblemSetPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login?redirectTo=/problemsets/new");

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			<PageBreadcrumb items={[{ label: "문제집", href: "/problemsets" }, { label: "만들기" }]} />
			<Card>
				<CardHeader>
					<CardTitle>문제집 만들기</CardTitle>
				</CardHeader>
				<CardContent>
					<ProblemSetForm mode="create" />
				</CardContent>
			</Card>
		</div>
	);
}
