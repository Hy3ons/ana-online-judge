import "server-only";

export interface Example {
	input: string;
	output: string;
}

/**
 * AOJ 문제 지문 markdown에서 "## 예제 입력 N" / "## 예제 출력 N" 블록을 짝지어 추출.
 *
 * 입력/출력은 fenced code block(``` ... ```) 안에 있다고 가정. 코드 펜스가 없는 경우
 * 다음 ## 헤더 또는 문서 끝까지의 텍스트를 사용.
 */
export function parseExamples(markdown: string): Example[] {
	if (!markdown) return [];
	const inputs = new Map<number, string>();
	const outputs = new Map<number, string>();
	const headerRe = /^##\s+예제\s+(입력|출력)\s+(\d+)\s*$/gm;
	const matches: Array<{ kind: "input" | "output"; n: number; start: number; end: number }> = [];
	for (;;) {
		const m = headerRe.exec(markdown);
		if (m === null) break;
		matches.push({
			kind: m[1] === "입력" ? "input" : "output",
			n: Number.parseInt(m[2], 10),
			start: m.index,
			end: m.index + m[0].length,
		});
	}
	for (let i = 0; i < matches.length; i++) {
		const cur = matches[i];
		const nextStart = matches[i + 1]?.start ?? markdown.length;
		const section = markdown.slice(cur.end, nextStart);
		const fence = /```[\w]*\n([\s\S]*?)\n```/.exec(section);
		const content = fence ? fence[1] : section.trim();
		if (cur.kind === "input") inputs.set(cur.n, content);
		else outputs.set(cur.n, content);
	}
	const nums = Array.from(new Set([...inputs.keys(), ...outputs.keys()])).sort((a, b) => a - b);
	return nums
		.filter((n) => inputs.has(n) && outputs.has(n))
		.map((n) => ({ input: inputs.get(n)!, output: outputs.get(n)! }));
}
