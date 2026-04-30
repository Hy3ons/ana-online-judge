import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblemForEdit } from "@/actions/admin";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { db } from "@/db";
import { testcases } from "@/db/schema";
import { ProblemForm } from "../problem-form";
import { ProblemSourcesSection } from "./problem-sources-section";
import { ProblemStaffSection } from "./problem-staff-section";
import { ProblemTabs } from "./problem-tabs";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const problem = await getProblemForEdit(parseInt(id, 10));

	if (!problem) {
		return { title: "문제를 찾을 수 없음" };
	}

	return {
		title: `${problem.displayTitle} 수정`,
	};
}

export default async function EditProblemPage({ params }: Props) {
	const { id } = await params;
	const problemId = parseInt(id, 10);
	const [problem, tcResult] = await Promise.all([
		getProblemForEdit(problemId),
		db
			.select({ count: sql<number>`COUNT(*)::int` })
			.from(testcases)
			.where(eq(testcases.problemId, problemId)),
	]);

	if (!problem) {
		notFound();
	}

	const testcaseCount = tcResult[0]?.count ?? 0;

	return (
		<div className="space-y-6">
			<PageBreadcrumb
				items={[
					{ label: "관리자", href: "/admin" },
					{ label: "문제", href: "/admin/problems" },
					{ label: problem.displayTitle },
				]}
			/>
			<div>
				<h1 className="text-3xl font-bold">문제 수정</h1>
				<p className="text-muted-foreground mt-2">
					#{problem.id} {problem.displayTitle}
				</p>
			</div>

			<ProblemTabs problemId={problem.id} />

			<ProblemForm problem={problem} testcaseCount={testcaseCount} />

			<ProblemSourcesSection problemId={problem.id} />

			<ProblemStaffSection problemId={problem.id} />
		</div>
	);
}
