import { useEffect, useState } from "preact/hooks";
import type { DashActiveContest } from "../../../src/views/dashboard/messages";

function fmt(ms: number): string {
	if (ms <= 0) return "ended";
	const total = Math.floor(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
	if (h > 0) return `${h}h ${pad(m)}:${pad(s)}`;
	return `${pad(m)}:${pad(s)}`;
}

export function ActiveContestBanner({ contest }: { contest: DashActiveContest | null }) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (!contest) return;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [contest]);

	if (!contest) return null;

	const left = Date.parse(contest.endsAtIso) - now;

	return (
		<div class="flex items-center gap-2 px-3 py-2 bg-bg-elev border border-warn/40 border-l-2 border-l-warn rounded-md">
			<span class="text-base" aria-hidden="true">
				🏆
			</span>
			<span class="flex-1 text-sm text-fg truncate">{contest.title}</span>
			<span class="text-xs font-semibold text-warn tabular-nums">{fmt(left)}</span>
		</div>
	);
}
