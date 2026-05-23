/*
 * Based on Spotboard (https://github.com/spotboard/spotboard)
 * Copyright (c) Spotboard (Jongwook Choi, Wonha Ryu)
 * Licensed under the MIT License
 */

"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContestLogic, Run, type TeamStatus } from "@/lib/spotboard/contest";
import type { SpotboardConfig, SpotboardRun } from "@/lib/spotboard/types";
import { RefreshProgress } from "./refresh-progress";
import { TeamRow } from "./team-row";
import { hsvToRgb } from "./utils";
import "./spotboard.css";

interface SpotboardProps {
	config: SpotboardConfig;
	isAwardMode?: boolean;
	isAdmin?: boolean;
	lastUpdate?: Date;
	refreshIntervalMs?: number;
	isRefreshing?: boolean;
	adminToolbar?: ReactNode;
}

export type FlipPhase = "flip-before" | "flip-after";

export interface FlipAnimationState {
	teamId: number;
	problemId: number;
	phase: FlipPhase;
}

// Duration of each flip half (must match CSS animation-duration)
const FLIP_HALF_MS = 250;

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function Spotboard({
	config,
	isAwardMode = false,
	isAdmin = false,
	lastUpdate,
	refreshIntervalMs,
	isRefreshing = false,
	adminToolbar,
}: SpotboardProps) {
	const showRefreshProgress =
		!isAwardMode && lastUpdate !== undefined && refreshIntervalMs !== undefined;

	const [logic, setLogic] = useState<ContestLogic | null>(null);
	const [rankedTeams, setRankedTeams] = useState<{ teamId: number; status: TeamStatus }[]>([]);
	const [hiddenRuns, setHiddenRuns] = useState<SpotboardRun[]>([]);

	// Award Ceremony State
	const [finalizedTeams, setFinalizedTeams] = useState<Set<number>>(new Set());
	const [focusedTeamId, setFocusedTeamId] = useState<number | null>(null);
	const [revealedTeams, setRevealedTeams] = useState<Set<number>>(new Set());
	const [animating, setAnimating] = useState<FlipAnimationState | null>(null);
	const animatingRef = useRef(false);

	// Stable anonymous IDs for teams (used to render "User N" before reveal in award mode)
	const anonymousIds = useMemo(() => {
		const m = new Map<number, number>();
		config.teams.forEach((t, idx) => {
			m.set(t.id, idx + 1);
		});
		return m;
	}, [config.teams]);

	// Initialize logic
	useEffect(() => {
		const l = new ContestLogic(config.teams, config.problems, config.penaltyMinutes);

		let initialRuns = config.runs;
		let hidden: SpotboardRun[] = [];

		if (isAwardMode && config.freezeTime) {
			// In award mode:
			// 1. Add runs before freeze time (normal state)
			initialRuns = config.runs.filter((r) => r.time < config.freezeTime!);

			// 2. Store frozen runs as hidden (will be revealed one by one)
			hidden = config.runs.filter((r) => r.time >= config.freezeTime!);

			// 3. CRITICAL: Add frozen runs as PENDING state to mask them
			const frozenRunsAsPending = hidden.map((r) => ({
				...r,
				result: "Pending", // Mask the actual result
			}));

			// Add pending runs to initial state
			initialRuns = [...initialRuns, ...frozenRunsAsPending];
		}

		for (const run of initialRuns) {
			l.addRun(
				new Run(
					run.id,
					run.teamId,
					run.problemId,
					run.time,
					run.result,
					run.score,
					run.problemType,
					run.anigmaDetails,
					run.passedTestcases
				)
			);
		}

		setLogic(l);
		setRankedTeams(l.getRankedTeams());
		setHiddenRuns(hidden);
		setFinalizedTeams(new Set());
		setFocusedTeamId(null);
		setRevealedTeams(new Set());
		setAnimating(null);
		animatingRef.current = false;
	}, [config, isAwardMode]);

	// Animation frame or update trigger
	const updateRankings = useCallback(() => {
		if (logic) {
			setRankedTeams([...logic.getRankedTeams()]);
		}
	}, [logic]);

	// Initialize dynamic styles for problem labels (A, B, C, etc.)
	useEffect(() => {
		if (!config) return;

		const styleId = "spotboard-dynamic-styles";
		let style = document.getElementById(styleId) as HTMLStyleElement;

		if (!style) {
			style = document.createElement("style");
			style.id = styleId;
			document.head.appendChild(style);
		}

		let css = "";

		// Add problem letter labels to problem-result boxes
		config.problems.forEach((prob) => {
			css += `.problem-result.problem-${prob.id} b:before { content: "${prob.title}"; }
`;
		});

		// Add solved-count background colors for each solved level
		const solvedLevels = config.problems.length + 1;
		for (let i = 0; i <= solvedLevels; i++) {
			const ratio = i / solvedLevels;
			const h = (-2 / 360) * (1 - ratio) + (105 / 360) * ratio;
			let s = 0.96;
			let v = 0.31;

			if (i % 2 === 1) {
				s = Math.max(s - 0.15, 0);
				v = Math.min(v + 0.1, 1);
			}

			const rgb = hsvToRgb(h, s, v);
			css += `.solved-${i} .solved-count { background-color: ${rgb}; }
`;
		}

		style.textContent = css;
	}, [config]);

	// Award ceremony step (ICPC Style)
	// Each press performs ONE step:
	//   - If no focused team: pick the lowest non-finalized team and focus it (revealing its name)
	//   - Else if focused team has pending problems: reveal ONE problem (animating each run individually)
	//       After reveal: if the team's rank improved, unfocus (next step will pick a new lowest)
	//   - Else: finalize the focused team
	const revealNext = useCallback(async () => {
		if (!logic) return;
		if (animatingRef.current) return;

		// 1. No focused team: pick lowest non-finalized team and focus it
		if (focusedTeamId === null) {
			const currentStandings = logic.getRankedTeams();
			let targetTeamId: number | null = null;
			for (let i = currentStandings.length - 1; i >= 0; i--) {
				if (!finalizedTeams.has(currentStandings[i].teamId)) {
					targetTeamId = currentStandings[i].teamId;
					break;
				}
			}
			if (targetTeamId === null) return;

			setFocusedTeamId(targetTeamId);
			setRevealedTeams((prev) => {
				const next = new Set(prev);
				next.add(targetTeamId!);
				return next;
			});
			return;
		}

		// 2. Focused team: find next pending problem (in problem display order)
		const myHidden = hiddenRuns.filter((r) => r.teamId === focusedTeamId);
		if (myHidden.length === 0) {
			// No more pending problems -> finalize this team
			setFinalizedTeams((prev) => {
				const next = new Set(prev);
				next.add(focusedTeamId);
				return next;
			});
			setFocusedTeamId(null);
			return;
		}

		let targetProblemId: number | null = null;
		for (const prob of config.problems) {
			if (myHidden.some((r) => r.problemId === prob.id)) {
				targetProblemId = prob.id;
				break;
			}
		}
		if (targetProblemId === null) return;

		// 3. Reveal each run for this problem in time order with flip animations
		const runsForProblem = myHidden
			.filter((r) => r.problemId === targetProblemId)
			.sort((a, b) => a.time - b.time);

		const oldRank = logic.teamStatuses.get(focusedTeamId)?.rank ?? 0;
		const hiddenIds = new Set(runsForProblem.map((r) => r.id));

		animatingRef.current = true;

		try {
			for (let i = 0; i < runsForProblem.length; i++) {
				const run = runsForProblem[i];

				// Phase A: rotateX(0 -> 90deg)
				setAnimating({
					teamId: focusedTeamId,
					problemId: targetProblemId,
					phase: "flip-before",
				});
				await sleep(FLIP_HALF_MS);

				// At mid-flip (perpendicular to screen, invisible): apply the run.
				// On the first iteration also drop the pending placeholders for this problem
				// (and clear hiddenRuns for it) so the interim count reflects only the runs
				// revealed so far — otherwise the cell keeps showing "?" because the
				// remaining placeholders keep isPending=true.
				if (i === 0) {
					const pStatus = logic.teamStatuses
						.get(focusedTeamId)
						?.getProblemStatus(targetProblemId, run.problemType);
					if (pStatus) {
						pStatus.runs = pStatus.runs.filter((r) => !hiddenIds.has(r.id));
					}
					setHiddenRuns((prev) =>
						prev.filter((r) => !(r.teamId === focusedTeamId && r.problemId === targetProblemId))
					);
				}

				logic.addRun(
					new Run(
						run.id,
						run.teamId,
						run.problemId,
						run.time,
						run.result,
						run.score,
						run.problemType,
						run.anigmaDetails,
						run.passedTestcases
					)
				);
				updateRankings();

				// Phase B: rotateX(270 -> 360deg)
				setAnimating({
					teamId: focusedTeamId,
					problemId: targetProblemId,
					phase: "flip-after",
				});
				await sleep(FLIP_HALF_MS);
			}
		} finally {
			setAnimating(null);
			animatingRef.current = false;
		}

		// 4. If this reveal changed the team's rank, hand focus over to the next lowest
		const newRank = logic.teamStatuses.get(focusedTeamId)?.rank ?? 0;
		if (newRank < oldRank) {
			setFocusedTeamId(null);
		}
	}, [logic, hiddenRuns, focusedTeamId, finalizedTeams, updateRankings, config.problems]);

	useEffect(() => {
		if (!isAwardMode) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === "Enter") {
				void revealNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isAwardMode, revealNext]);

	if (!logic) return <div>Loading Spotboard...</div>;

	return (
		<div className="spotboard-container">
			<div id="header">
				<div className="spotboard-header-left">
					{isAdmin && <div className="spotboard-admin-badge">(admin)</div>}
					<div id="contest-title">
						{config.contestTitle}
						{(config.isFrozen || hiddenRuns.length > 0) && (
							<span className="text-muted-foreground ml-2">(Frozen)</span>
						)}
					</div>
				</div>
				<div className="spotboard-header-right">
					<div id="system-information">
						{config.systemName} {config.systemVersion}
					</div>
					{showRefreshProgress && (
						<RefreshProgress
							lastUpdate={lastUpdate as Date}
							intervalMs={refreshIntervalMs as number}
							isRefreshing={isRefreshing}
						/>
					)}
					{adminToolbar}
				</div>
			</div>

			<div id="wrapper">
				{/* Each team row is positioned via `top: i * 2.0em` where em resolves against the team's own
				    font-size (2em of team-list). That makes the actual stack height = length * 4em in
				    team-list's em-space, so the container must match — otherwise rows past the midpoint
				    overflow the wrapper and the page background shows through. */}
				<div id="team-list" style={{ height: `${rankedTeams.length * 4.0}em` }}>
					{rankedTeams.map((item, index) => {
						const team = config.teams.find((t) => t.id === item.teamId);
						if (!team) return null;

						return (
							<TeamRow
								key={team.id}
								team={team}
								status={item.status}
								index={index}
								config={config}
								hiddenRuns={hiddenRuns}
								isFinalized={finalizedTeams.has(team.id)}
								isFocused={focusedTeamId === team.id}
								isAwardMode={isAwardMode}
								isRevealed={revealedTeams.has(team.id) || finalizedTeams.has(team.id)}
								anonymousId={anonymousIds.get(team.id) ?? team.id}
								animating={animating}
								rankedTeams={rankedTeams}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
