import { readTestcase, type TestcasePair } from "../mapping/testcases";
import { compareIcpc } from "../runner/diff";
import type { CaseRun } from "../runner/runner";

/**
 * Text-language sanity check — no spawn, no compile.
 * Source content IS the program's stdout, so compare directly with the expected file.
 */
export async function runTextCase(sourceContent: string, tc: TestcasePair): Promise<CaseRun> {
	const { input, output } = await readTestcase(tc);
	const diff = compareIcpc(output, sourceContent);
	return {
		testcase: tc,
		verdict: diff.equal
			? { kind: "passed", elapsedMs: 0, diff }
			: { kind: "wrong", elapsedMs: 0, diff },
		stdout: sourceContent,
		stderr: "",
		expected: output,
		input,
	};
}
