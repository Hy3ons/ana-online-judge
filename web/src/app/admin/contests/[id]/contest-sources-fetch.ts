"use server";
import { listContestProblemLabels } from "@/actions/admin/queries";

export async function listContestProblemsAction(contestId: number) {
	return listContestProblemLabels(contestId);
}
