import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface TestcasePair {
	index: number; // 1-based
	inputPath: string;
	outputPath: string;
}

export interface TestcaseContent extends TestcasePair {
	input: string;
	output: string;
}

const PAT = /^(.+)_(\d+)\.(in|out)$/;

async function readPairsIn(dir: string, base: string): Promise<TestcasePair[]> {
	let entries: string[];
	try {
		entries = await fs.readdir(dir);
	} catch {
		return [];
	}
	const ins = new Map<number, string>();
	const outs = new Map<number, string>();
	for (const e of entries) {
		const m = PAT.exec(e);
		if (!m || m[1] !== base) continue;
		const n = Number.parseInt(m[2], 10);
		const full = path.join(dir, e);
		if (m[3] === "in") ins.set(n, full);
		else outs.set(n, full);
	}
	const out: TestcasePair[] = [];
	for (const n of [...ins.keys()].sort((a, b) => a - b)) {
		if (outs.has(n)) out.push({ index: n, inputPath: ins.get(n)!, outputPath: outs.get(n)! });
	}
	return out;
}

/**
 * List existing pairs for a given source file. Pairs in `<sourceDir>/<sidecarDir>/`
 * take precedence; entries at the legacy `<sourceDir>/` location fill in any
 * indices not present in the sidecar dir (natural migration path — newly added
 * pairs land in the sidecar dir, old ones keep working until the user moves them).
 */
export async function listTestcases(
	sourcePath: string,
	sidecarDir = ".aoj"
): Promise<TestcasePair[]> {
	const sourceDir = path.dirname(sourcePath);
	const base = path.basename(sourcePath, path.extname(sourcePath));
	const sidecar = await readPairsIn(path.join(sourceDir, sidecarDir), base);
	const legacy = await readPairsIn(sourceDir, base);
	const byIndex = new Map<number, TestcasePair>();
	for (const p of legacy) byIndex.set(p.index, p);
	for (const p of sidecar) byIndex.set(p.index, p);
	return [...byIndex.values()].sort((a, b) => a.index - b.index);
}

export async function readTestcase(pair: TestcasePair): Promise<TestcaseContent> {
	const [input, output] = await Promise.all([
		fs.readFile(pair.inputPath, "utf-8"),
		fs.readFile(pair.outputPath, "utf-8"),
	]);
	return { ...pair, input, output };
}

export async function writeTestcase(
	sourcePath: string,
	index: number,
	input: string,
	output: string,
	sidecarDir = ".aoj"
): Promise<TestcasePair> {
	const dir = path.join(path.dirname(sourcePath), sidecarDir);
	const base = path.basename(sourcePath, path.extname(sourcePath));
	const inputPath = path.join(dir, `${base}_${index}.in`);
	const outputPath = path.join(dir, `${base}_${index}.out`);
	await fs.mkdir(dir, { recursive: true });
	await Promise.all([
		fs.writeFile(inputPath, input, "utf-8"),
		fs.writeFile(outputPath, output, "utf-8"),
	]);
	return { index, inputPath, outputPath };
}

export async function removeTestcase(pair: TestcasePair): Promise<void> {
	await Promise.allSettled([fs.unlink(pair.inputPath), fs.unlink(pair.outputPath)]);
}

export function nextIndex(existing: TestcasePair[]): number {
	if (existing.length === 0) return 1;
	return Math.max(...existing.map((p) => p.index)) + 1;
}

/** Overwrite-style: replace all existing pairs with the given examples (1-indexed). */
export async function syncTestcasesFromExamples(
	sourcePath: string,
	examples: { input: string; output: string }[],
	sidecarDir = ".aoj"
): Promise<TestcasePair[]> {
	const existing = await listTestcases(sourcePath, sidecarDir);
	for (const p of existing) await removeTestcase(p);
	const written: TestcasePair[] = [];
	for (let i = 0; i < examples.length; i++) {
		written.push(
			await writeTestcase(sourcePath, i + 1, examples[i].input, examples[i].output, sidecarDir)
		);
	}
	return written;
}
