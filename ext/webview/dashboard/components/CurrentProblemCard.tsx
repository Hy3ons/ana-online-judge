import type { DashCurrentProblem } from "../../../src/views/dashboard/messages";
import { Card, CardBody, CardHeader } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { Badge } from "../../shared/components/Badge";

type DashCmd =
	| "aoj.runAll"
	| "aoj.submit"
	| "aoj.addTestcase"
	| "aoj.openStatement"
	| "aoj.openInBrowser"
	| "aoj.searchProblems"
	| "aoj.attachProblemById";

export function CurrentProblemCard({
	problem,
	onCommand,
}: {
	problem: DashCurrentProblem | null;
	onCommand: (cmd: DashCmd) => void;
}) {
	if (!problem) {
		return (
			<Card>
				<CardBody>
					<p class="text-xs text-fg-muted mb-2">파일에 연결된 문제가 없습니다.</p>
					<Button variant="secondary" onClick={() => onCommand("aoj.searchProblems")}>
						🔍 문제 검색
					</Button>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<Badge variant="info">#{problem.problemId}</Badge>
				<span class="text-sm font-semibold text-fg truncate">{problem.title}</span>
			</CardHeader>
			<CardBody>
				<p class="text-xs text-fg-muted mb-3">
					{problem.fileName} · {problem.timeLimit}ms · {problem.memoryLimit}MB
				</p>
				<div class="grid grid-cols-2 gap-1.5">
					<Button onClick={() => onCommand("aoj.runAll")}>▶ Run</Button>
					<Button onClick={() => onCommand("aoj.submit")}>⬆ Submit</Button>
					<Button variant="secondary" onClick={() => onCommand("aoj.addTestcase")}>
						+ Test
					</Button>
					<Button variant="secondary" onClick={() => onCommand("aoj.openStatement")}>
						📄 Doc
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
