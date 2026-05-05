import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProblemSetCreateForm } from "@/components/problem-sets/problem-set-create-form";

export default async function NewProblemSetPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login?redirectTo=/problemsets/new");

	return (
		<div className="container mx-auto max-w-2xl py-8 space-y-6">
			<h1 className="text-2xl font-semibold">새 문제집</h1>
			<ProblemSetCreateForm />
		</div>
	);
}
