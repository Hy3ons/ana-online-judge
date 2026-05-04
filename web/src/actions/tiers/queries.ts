"use server";

import {
	countPublicProblemsByTier as svcCountPublicProblemsByTier,
	listProblemsByTier as svcListProblemsByTier,
	readProblemTier as svcReadProblemTier,
} from "@/lib/services/problem-tier";

export async function countPublicProblemsByTier(
	...args: Parameters<typeof svcCountPublicProblemsByTier>
) {
	return svcCountPublicProblemsByTier(...args);
}

export async function listProblemsByTier(...args: Parameters<typeof svcListProblemsByTier>) {
	return svcListProblemsByTier(...args);
}

export async function readProblemTier(...args: Parameters<typeof svcReadProblemTier>) {
	return svcReadProblemTier(...args);
}
