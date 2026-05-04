"use server";

import { getBreadcrumb, listProblemSourceEntries } from "@/actions/sources";
import { requireAdmin } from "@/lib/auth-utils";

export async function getProblemSourcesAction(problemId: number) {
	await requireAdmin();
	return listProblemSourceEntries(problemId);
}

export async function getSourceBreadcrumbAction(sourceId: number) {
	await requireAdmin();
	const chain = await getBreadcrumb(sourceId);
	return chain.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}
