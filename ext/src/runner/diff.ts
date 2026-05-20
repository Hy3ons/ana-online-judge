export interface DiffResult {
	equal: boolean;
	/** 1-based line index of first difference (or first missing line). undefined if equal. */
	firstDiffLine?: number;
	/** Normalized expected/actual for display. */
	expected: string;
	actual: string;
}

/** Normalize ICPC-style: CRLF→LF, strip trailing whitespace per line, strip trailing newlines. */
export function normalize(text: string): string {
	let s = text.replace(/\r\n?/g, "\n");
	s = s
		.split("\n")
		.map((line) => line.replace(/[ \t]+$/g, ""))
		.join("\n");
	s = s.replace(/\n+$/g, "");
	return s;
}

export function compareIcpc(expected: string, actual: string): DiffResult {
	const e = normalize(expected);
	const a = normalize(actual);
	if (e === a) return { equal: true, expected: e, actual: a };
	const el = e.split("\n");
	const al = a.split("\n");
	const max = Math.max(el.length, al.length);
	let diff = max;
	for (let i = 0; i < max; i++) {
		if (el[i] !== al[i]) {
			diff = i + 1;
			break;
		}
	}
	return { equal: false, firstDiffLine: diff, expected: e, actual: a };
}
