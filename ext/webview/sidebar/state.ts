import type { HostToWeb, SidebarState, TestcaseView } from "../../src/views/sidebar/messages";

export function applyEvent(prev: SidebarState, ev: HostToWeb): SidebarState {
	switch (ev.type) {
		case "state":
			return ev.payload;
		case "compile":
			return { ...prev, compile: { state: ev.state, message: ev.message } };
		case "caseStart":
			return { ...prev, cases: patchCase(prev.cases, ev.index, { verdict: "RUNNING" }) };
		case "caseDone":
			return {
				...prev,
				cases: patchCase(prev.cases, ev.index, {
					verdict: ev.verdict,
					timeMs: ev.timeMs,
					memoryKb: ev.memoryKb,
					actual: ev.actual,
					detail: ev.detail,
				}),
			};
		case "caseAppended":
			return {
				...prev,
				cases: [...prev.cases.filter((c) => c.index !== ev.tc.index), ev.tc].sort(
					(a, b) => a.index - b.index
				),
			};
		case "caseRemoved":
			return { ...prev, cases: prev.cases.filter((c) => c.index !== ev.index) };
		case "submissionStart":
			return {
				...prev,
				submission: {
					submissionId: ev.submissionId,
					problemId: ev.problemId,
					state: "running",
					pass: 0,
					total: 0,
				},
			};
		case "submissionProgress":
			return prev.submission
				? {
						...prev,
						submission: {
							...prev.submission,
							verdict: ev.verdict,
							pass: ev.pass,
							total: ev.total,
						},
					}
				: prev;
		case "submissionDone":
			return prev.submission
				? {
						...prev,
						submission: {
							...prev.submission,
							state: "done",
							verdict: ev.verdict,
							pass: ev.pass,
							total: ev.total,
							finishedAtIso: ev.finishedAtIso,
						},
					}
				: prev;
		case "toast":
		case "searchOpen":
		case "searchResults":
			return prev; // transient UI; App.tsx tracks via local state
	}
}

function patchCase(
	cases: TestcaseView[],
	index: number,
	patch: Partial<TestcaseView>
): TestcaseView[] {
	return cases.map((c) => (c.index === index ? { ...c, ...patch } : c));
}
