import { useEffect, useState } from "preact/hooks";
import { createBridge } from "../shared/postMessage";
import type { DashState, DashToHost, HostToDash } from "../../src/views/dashboard/messages";
import { Header } from "./components/Header";
import { CurrentProblemCard } from "./components/CurrentProblemCard";
import { ActiveContestBanner } from "./components/ActiveContestBanner";
import { RecentSubmissions } from "./components/RecentSubmissions";
import { EmptyState } from "../shared/components/EmptyState";
import { Button } from "../shared/components/Button";

const initialState: DashState = {
	signedIn: false,
	username: null,
	currentProblem: null,
	activeContest: null,
	recentSubmissions: [],
};

export function App({ vscode }: { vscode: { postMessage: (m: DashToHost) => void } }) {
	const [state, setState] = useState<DashState>(initialState);
	const bridge = createBridge<DashToHost, HostToDash>(vscode);

	useEffect(() => {
		const off = bridge.on((m) => {
			if (m.type === "state") setState(m.payload);
		});
		bridge.post({ type: "ready" });
		return off;
	}, []);

	if (!state.signedIn) {
		return (
			<div class="min-h-screen flex flex-col">
				<Header username={null} onRefresh={() => bridge.post({ type: "refresh" })} />
				<div class="flex-1 flex items-center justify-center p-4">
					<EmptyState
						title="AOJ에 로그인하면 dashboard가 표시됩니다."
						action={<Button onClick={() => bridge.post({ type: "signIn" })}>Sign in</Button>}
					/>
				</div>
			</div>
		);
	}

	return (
		<div class="min-h-screen flex flex-col gap-3 p-3">
			<Header username={state.username} onRefresh={() => bridge.post({ type: "refresh" })} />
			<CurrentProblemCard
				problem={state.currentProblem}
				onCommand={(cmd) => bridge.post({ type: "command", cmd })}
			/>
			<ActiveContestBanner contest={state.activeContest} />
			<RecentSubmissions
				items={state.recentSubmissions}
				onOpen={(id) => bridge.post({ type: "openSubmission", submissionId: id })}
			/>
		</div>
	);
}
