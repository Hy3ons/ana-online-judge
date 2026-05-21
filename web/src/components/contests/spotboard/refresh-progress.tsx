"use client";

interface RefreshProgressProps {
	lastUpdate: Date;
	intervalMs: number;
	isRefreshing: boolean;
}

// Top-right progress bar showing how close the next auto-refresh is.
// The fill bar is driven by a CSS animation keyed off `lastUpdate` so each refresh
// restarts the animation from 0% — no per-frame timers needed.
export function RefreshProgress({ lastUpdate, intervalMs, isRefreshing }: RefreshProgressProps) {
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
						<span className="spotboard-refresh-time">
							{lastUpdate.toLocaleTimeString("ko-KR", { hour12: false })}
						</span>
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
