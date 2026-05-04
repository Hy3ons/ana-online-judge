"use server";

import {
	countProblemsInSubtree as svcCountProblemsInSubtree,
	getBreadcrumb as svcGetBreadcrumb,
	getProblemNumbersForSource as svcGetProblemNumbersForSource,
	getSource as svcGetSource,
	listChildren as svcListChildren,
	listDirectContests as svcListDirectContests,
	listProblemSourceEntries as svcListProblemSourceEntries,
	listRootSources as svcListRootSources,
} from "@/lib/services/sources";

export async function listRootSources(...args: Parameters<typeof svcListRootSources>) {
	return svcListRootSources(...args);
}

export async function countProblemsInSubtree(
	...args: Parameters<typeof svcCountProblemsInSubtree>
) {
	return svcCountProblemsInSubtree(...args);
}

export async function getBreadcrumb(...args: Parameters<typeof svcGetBreadcrumb>) {
	return svcGetBreadcrumb(...args);
}

export async function getSource(...args: Parameters<typeof svcGetSource>) {
	return svcGetSource(...args);
}

export async function listChildren(...args: Parameters<typeof svcListChildren>) {
	return svcListChildren(...args);
}

export async function listDirectContests(...args: Parameters<typeof svcListDirectContests>) {
	return svcListDirectContests(...args);
}

export async function getProblemNumbersForSource(
	...args: Parameters<typeof svcGetProblemNumbersForSource>
) {
	return svcGetProblemNumbersForSource(...args);
}

export async function listProblemSourceEntries(
	...args: Parameters<typeof svcListProblemSourceEntries>
) {
	return svcListProblemSourceEntries(...args);
}
