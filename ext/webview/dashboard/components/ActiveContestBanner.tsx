import type { DashActiveContest } from "../../../src/views/dashboard/messages";

export function ActiveContestBanner({ contest }: { contest: DashActiveContest | null }) {
	if (!contest) return null;
	return <div>{contest.title}</div>; // Task 9 replaces
}
