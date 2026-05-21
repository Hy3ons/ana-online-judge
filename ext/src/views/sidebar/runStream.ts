import * as fs from "node:fs/promises";
import type { LanguageMeta } from "../../languages/catalog";
import { runTextCase } from "../../languages/textRunner";
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
	/** When aborted, the in-flight case is killed and remaining cases are emitted as SKIPPED. */
	signal?: AbortSignal;
}

export async function runStream(input: RunStreamInput, ev: RunStreamEvents): Promise<void> {
	if (input.meta.runtime === "text") {
		const source = await fs.readFile(input.sourcePath, "utf-8");
		ev.compile("ok");
		const wanted = input.indices ? new Set(input.indices) : null;
		for (const p of input.pairs) {
			if (wanted && !wanted.has(p.index)) continue;
			if (input.signal?.aborted) {
				ev.caseDone({
					index: p.index,
					verdict: "SKIPPED",
					timeMs: 0,
					memoryKb: 0,
					actual: "",
					detail: "canceled",
				});
				continue;
			}
			ev.caseStart(p.index);
			const result = await runTextCase(source, p);
			if (result.verdict.kind === "passed") {
				ev.caseDone({
					index: p.index,
					verdict: "AC",
					timeMs: 0,
					memoryKb: 0,
					actual: result.stdout,
				});
			} else {
				ev.caseDone({
					index: p.index,
					verdict: "WA",
					timeMs: 0,
					memoryKb: 0,
					actual: result.stdout,
					detail:
						"diff" in result.verdict && result.verdict.diff.firstDiffLine !== undefined
							? `first diff @ line ${result.verdict.diff.firstDiffLine}`
							: undefined,
				});
			}
		}
		return;
	}

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
		if (input.signal?.aborted) {
			ev.caseDone({
				index: p.index,
				verdict: "SKIPPED",
				timeMs: 0,
				memoryKb: 0,
				actual: "",
				detail: "canceled",
			});
			continue;
		}
		await runOnePair(p, input.meta, compile, input.options, ev, input.signal);
	}
}

async function runOnePair(
	p: TestcasePair,
	meta: LanguageMeta,
	compile: CompileOutput,
	opts: RunOptions,
	ev: RunStreamEvents,
	signal?: AbortSignal
): Promise<void> {
	ev.caseStart(p.index);
	const input = await fs.readFile(p.inputPath, "utf-8");
	const expected = await fs.readFile(p.outputPath, "utf-8");

	if (!meta.run) {
		// Special runtimes (text) should not reach here via runStream.
		ev.caseDone({
			index: p.index,
			verdict: "RE",
			timeMs: 0,
			memoryKb: 0,
			actual: "",
			detail: `no run command for language ${meta.id}`,
		});
		return;
	}
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
		signal,
	});
	const elapsed = res.elapsedMs;

	if (res.aborted) {
		ev.caseDone({
			index: p.index,
			verdict: "SKIPPED",
			timeMs: elapsed,
			memoryKb: 0,
			actual: "",
			detail: "canceled",
		});
		return;
	}

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
	if ((res.exitCode ?? 0) !== 0) {
		const signalNote = res.signal ? ` (${res.signal})` : "";
		ev.caseDone({
			index: p.index,
			verdict: "RE",
			timeMs: elapsed,
			memoryKb: 0,
			actual: res.stdout,
			detail: `exit ${res.exitCode ?? "?"}${signalNote}${res.stderr ? ` — ${res.stderr.split("\n")[0]}` : ""}`,
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
