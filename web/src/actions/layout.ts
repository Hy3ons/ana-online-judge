"use server";

import { getRunningContestPracticeCounts as svcGetRunningContestPracticeCounts } from "@/lib/services/active-counts";

export async function getRunningContestPracticeCounts() {
	return svcGetRunningContestPracticeCounts();
}
