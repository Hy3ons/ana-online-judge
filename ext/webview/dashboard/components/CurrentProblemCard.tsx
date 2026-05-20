import type { DashCurrentProblem, DashToHost } from "../../../src/views/dashboard/messages";

export function CurrentProblemCard({
	problem,
	onCommand,
}: {
	problem: DashCurrentProblem | null;
	onCommand: (cmd: DashToHost extends { type: "command"; cmd: infer C } ? C : never) => void;
}) {
	if (!problem) return null;
	void onCommand;
	return <div>{problem.title}</div>; // Task 8 replaces
}
