"use server";

import { getSessionInfo } from "@/lib/auth-utils";
import * as svc from "@/lib/services/problem-sets";

export async function getProblemSets(opts: Omit<svc.ListOptions, "viewerId">) {
	const { userId } = await getSessionInfo();
	return svc.listProblemSets({ ...opts, viewerId: userId ?? undefined });
}

export async function getProblemSet(id: number) {
	const { userId } = await getSessionInfo();
	return svc.getProblemSet(id, userId ?? undefined);
}

export async function getUserProblemSets(userId: number) {
	const { userId: viewerId } = await getSessionInfo();
	return svc.listUserProblemSets(userId, viewerId ?? undefined);
}
