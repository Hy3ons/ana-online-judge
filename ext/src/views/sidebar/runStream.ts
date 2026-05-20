import * as fs from "node:fs/promises";
import type { LanguageMeta } from "../../api/endpoints";
import type { TestcasePair } from "../../mapping/testcases";
import { CompileCache } from "../../runner/compileCache";
import { compareIcpc } from "../../runner/diff";
import { type CompileOutput, compileIfNeeded, type RunOptions } from "../../runner/runner";
import { spawnWithTimeout } from "../../runner/spawn";
import type { CaseVerdictTag } from "./messages";

export interface RunStreamEvents {
	compile(state: "running" | "ok" | "error", message?: string): void;
	caseStart(index: number): void;
	caseDone(args: {
		index: number;
		verdict: CaseVerdictTag;
		timeMs: number;
		memoryKb: number;
		actual: string;
		detail?: string;
	}): void;
}

export interface RunStreamInput {
	sourcePath: string;
	lang: string;
	meta: LanguageMeta;
	pairs: TestcasePair[];
	indices?: number[]; // optional filter (run only these case indices)
	options: RunOptions;
	cache: CompileCache;
}

export async function runStream(input: RunStreamInput, ev: RunStreamEvents): Promise<void> {
	const source = await fs.readFile(input.sourcePath, "utf-8");
	const hash = CompileCache.hashContent(source);

	let compile = input.cache.get(input.sourcePath, hash);
	if (!compile) {
		ev.compile("running");
		compile = await compileIfNeeded(input.sourcePath, input.meta, input.options);
		if (!compile.ok) {
			ev.compile("error", compile.message);
			for (const p of input.pairs) {
				if (input.indices && !input.indices.includes(p.index)) continue;
				ev.caseDone({
					index: p.index,
					verdict: "CE",
					timeMs: 0,
					memoryKb: 0,
					actual: "",
					detail: compile.message.split("\n")[0],
				});
			}
			return;
		}
		input.cache.set(input.sourcePath, hash, compile);
		ev.compile("ok");
	} else {
		ev.compile("ok");
	}

	const wanted = input.indices ? new Set(input.indices) : null;
	for (const p of input.pairs) {
		if (wanted && !wanted.has(p.index)) continue;
		await runOnePair(p, input.meta, compile, input.options, ev);
	}
}

async function runOnePair(
	p: TestcasePair,
	meta: LanguageMeta,
	compile: CompileOutput,
	opts: RunOptions,
	ev: RunStreamEvents
): Promise<void> {
	ev.caseStart(p.index);
	const input = await fs.readFile(p.inputPath, "utf-8");
	const expected = await fs.readFile(p.outputPath, "utf-8");

	const runVars: Record<string, string> = {
		src: compile.sourceFile,
		exe: compile.exe ?? "",
		srcDir: compile.artifactDir,
		className: compile.sourceFile.replace(/\.[^.]+$/, ""),
	};
	const cmd = substitute(meta.run.command, runVars);
	const args = meta.run.args.map((a) => substitute(a, runVars));

	const res = await spawnWithTimeout({
		cmd,
		args,
		cwd: compile.artifactDir,
		stdin: input,
		timeoutMs: opts.timeoutMs,
	});
	const elapsed = res.elapsedMs;

	if (res.timedOut) {
		ev.caseDone({
			index: p.index,
			verdict: "TLE",
			timeMs: elapsed,
			memoryKb: 0,
			actual: "",
			detail: `>${elapsed}ms`,
		});
		return;
	}
	if ((res.exitCode ?? 0) !== 0 && !res.stdout) {
		ev.caseDone({
			index: p.index,
			verdict: "RE",
			timeMs: elapsed,
			memoryKb: 0,
			actual: res.stderr,
			detail: `exit ${res.exitCode ?? "?"}`,
		});
		return;
	}
	const diff = compareIcpc(expected, res.stdout);
	if (diff.equal) {
		ev.caseDone({
			index: p.index,
			verdict: "AC",
			timeMs: elapsed,
			memoryKb: 0,
			actual: res.stdout,
		});
	} else {
		ev.caseDone({
			index: p.index,
			verdict: "WA",
			timeMs: elapsed,
			memoryKb: 0,
			actual: res.stdout,
			detail: `first diff @ line ${diff.firstDiffLine ?? "?"}`,
		});
	}
}

function substitute(template: string, vars: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}
