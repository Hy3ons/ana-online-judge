"use server";

import * as svc from "@/lib/services/problem-sets";

export async function getProblemSets(opts: Parameters<typeof svc.listProblemSets>[0]) {
	return svc.listProblemSets(opts);
}

export async function getProblemSet(...args: Parameters<typeof svc.getProblemSet>) {
	return svc.getProblemSet(...args);
}

export async function getUserProblemSets(...args: Parameters<typeof svc.listUserProblemSets>) {
	return svc.listUserProblemSets(...args);
}
