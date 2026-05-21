"use client";

import { useEffect, useState } from "react";

interface RefreshProgressProps {
	lastUpdate: Date;
	intervalMs: number;
	isRefreshing: boolean;
}

// Top-right header element showing how much time is left until the next auto-refresh.
// The fill bar is a CSS animation keyed off `lastUpdate` so each refresh restarts it
// from 0% — the numeric countdown ticks via a 200ms interval for sub-second smoothness.
export function RefreshProgress({ lastUpdate, intervalMs, isRefreshing }: RefreshProgressProps) {
	const [remainingMs, setRemainingMs] = useState(intervalMs);

	useEffect(() => {
		const tick = () => {
			const elapsed = Date.now() - lastUpdate.getTime();
			setRemainingMs(Math.max(0, intervalMs - elapsed));
		};
		tick();
		const id = setInterval(tick, 200);
		return () => clearInterval(id);
	}, [lastUpdate, intervalMs]);

	const remainingSec = Math.ceil(remainingMs / 1000);

	return (
		<div className="spotboard-refresh-progress">
			<div className="spotboard-refresh-progress-label">
				{isRefreshing ? (
					<>
						<span className="spotboard-refresh-spinner">⟳</span>
						<span>갱신 중…</span>
					</>
				) : (
					<>
						<span>다음 갱신까지</span>
						<span className="spotboard-refresh-time">{remainingSec}초</span>
					</>
				)}
			</div>
			<div className="spotboard-refresh-progress-track">
				<div
					key={lastUpdate.getTime()}
					className="spotboard-refresh-progress-fill"
					style={{ animationDuration: `${intervalMs}ms` }}
				/>
			</div>
		</div>
	);
}
