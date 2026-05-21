import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContestById } from "@/actions/contests";
import { getScoreboard, getSpotboardData } from "@/actions/scoreboard";
import { auth } from "@/auth";
import { ScoreboardPageClient } from "@/components/contests/scoreboard-page-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const contest = await getContestById(Number.parseInt(id, 10));

	if (!contest) {
		return {
			title: "대회를 찾을 수 없습니다",
		};
	}

	return {
		title: `${contest.title} - 스코어보드`,
	};
}

export default async function ScoreboardPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ award?: string }>;
}) {
	const { id } = await params;
	const { award } = await searchParams;
	const contestId = Number.parseInt(id, 10);

	const contest = await getContestById(contestId);
	if (!contest) {
		notFound();
	}

	const session = await auth();
	const isAdmin = session?.user?.role === "admin";
	const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;

	// Award mode check
	const isAwardMode = award === "true";

	const isSpotboard = contest.scoreboardType === "spotboard";

	// Load initial data
	const initialData = isSpotboard
		? await getSpotboardData(contestId)
		: await getScoreboard(contestId);

	// Award mode is admin-only until the contest is over AND the scoreboard is unfrozen.
	// Non-admins requesting ?award=true before that point get a friendly denial.
	if (isAwardMode && !isAdmin) {
		const now = new Date();
		const isFinished = now > new Date(contest.endTime);

		// Frozen-state check — basic scoreboard exposes it directly; spotboard derives it
		// from contest.isFrozen + freezeMinutes so non-admins can't peek while results are
		// still masked server-side.
		let isStillFrozen = false;
		if (!isSpotboard && "isFrozen" in initialData) {
			isStillFrozen = initialData.isFrozen === true;
		} else if (isSpotboard && contest.isFrozen && contest.freezeMinutes) {
			const freezeStart = new Date(
				new Date(contest.endTime).getTime() - contest.freezeMinutes * 60 * 1000
			);
			isStillFrozen = now >= freezeStart;
		}

		if (!isFinished || isStillFrozen) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<p className="text-lg text-muted-foreground">
							시상 모드는 대회가 종료되고 스코어보드가 공개된 후에만 접근할 수 있습니다.
						</p>
					</div>
				</div>
			);
		}
	}

	return (
		<ScoreboardPageClient
			contestId={contestId}
			contestTitle={contest.title}
			isSpotboard={isSpotboard}
			isAwardMode={isAwardMode}
			initialData={initialData}
			currentUserId={currentUserId}
			isAdmin={isAdmin}
		/>
	);
}
