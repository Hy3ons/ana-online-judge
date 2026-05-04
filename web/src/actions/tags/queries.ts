"use server";

import {
	getTag as svcGetTag,
	listAllTagsWithProblemCount as svcListAllTagsWithProblemCount,
	listChildren as svcListChildren,
	listRootTags as svcListRootTags,
	searchTags as svcSearchTags,
} from "@/lib/services/algorithm-tags";
import { listProblemsByTag as svcListProblemsByTag } from "@/lib/services/problem-vote-tags";

export async function searchTagsAction(query: string) {
	return svcSearchTags(query, 30);
}

export async function getTagsByIdsAction(ids: number[]) {
	const results = await Promise.all(ids.map((id) => svcGetTag(id)));
	return results.filter((t): t is NonNullable<typeof t> => t !== null);
}

export async function listAllTagsWithProblemCount(
	...args: Parameters<typeof svcListAllTagsWithProblemCount>
) {
	return svcListAllTagsWithProblemCount(...args);
}

export async function getTag(...args: Parameters<typeof svcGetTag>) {
	return svcGetTag(...args);
}

export async function listChildren(...args: Parameters<typeof svcListChildren>) {
	return svcListChildren(...args);
}

export async function listRootTags(...args: Parameters<typeof svcListRootTags>) {
	return svcListRootTags(...args);
}

export async function listProblemsByTag(...args: Parameters<typeof svcListProblemsByTag>) {
	return svcListProblemsByTag(...args);
}
