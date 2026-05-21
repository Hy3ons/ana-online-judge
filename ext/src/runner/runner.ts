import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { LanguageMeta } from "../languages/catalog";
import { readTestcase, type TestcasePair } from "../mapping/testcases";
import { compareIcpc, type DiffResult } from "./diff";
import { type SpawnResult, spawnWithTimeout } from "./spawn";

export interface CompilerOverrides {
	/** lang id → command name (overrides language.compile.command). */
	compilerPaths?: Record<string, string>;
	/** lang id → extra flags appended to compile args. */
	compileFlags?: Record<string, string[]>;
}

export interface RunOptions {
	workspaceTmpDir?: string;
	timeoutMs: number;
	overrides?: CompilerOverrides;
}

export type CaseVerdict =
	| { kind: "passed"; elapsedMs: number; diff: DiffResult }
	| { kind: "wrong"; elapsedMs: number; diff: DiffResult }
	| { kind: "timeout"; elapsedMs: number }
	| { kind: "runtime"; elapsedMs: number; stderr: string; exitCode: number | null }
	| { kind: "compile_error"; message: string };

export interface CaseRun {
	testcase: TestcasePair;
	verdict: CaseVerdict;
	stdout: string;
	stderr: string;
	expected: string;
	input: string;
}

export interface CompileOutput {
	ok: boolean;
	message: string;
	artifactDir: string;
	sourceFile: string; // "Main.cpp", "Main.java", ...
	exe?: string; // for compiled languages; for interpreted, undefined
}

/** Substitute placeholders in a string template. Recognizes {src}, {exe}, {srcDir}, {className}. */
export function substitute(template: string, vars: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

export function substituteAll(arr: string[], vars: Record<string, string>): string[] {
	return arr.map((a) => substitute(a, vars));
}

function sourceFileFor(lang: LanguageMeta): string {
	// Prefer the server-provided canonical name; fall back to Main.<defaultExt>
	if (lang.sourceFile && lang.sourceFile.length > 0) return lang.sourceFile;
	const ext = lang.defaultExtension.startsWith(".")
		? lang.defaultExtension
		: `.${lang.defaultExtension}`;
	return `Main${ext}`;
}

export async function compileIfNeeded(
	sourcePath: string,
	lang: LanguageMeta,
	opts: RunOptions
): Promise<CompileOutput> {
	const tmp = opts.workspaceTmpDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "aoj-run-")));
	await fs.mkdir(tmp, { recursive: true });
	const sourceFile = sourceFileFor(lang);
	const stagedSrc = path.join(tmp, sourceFile);
	const exe = path.join(tmp, process.platform === "win32" ? "Main.exe" : "Main");
	await fs.copyFile(sourcePath, stagedSrc);

	if (!lang.compile) {
		return { ok: true, message: "(no compile step)", artifactDir: tmp, sourceFile };
	}

	const vars: Record<string, string> = {
		src: stagedSrc,
		exe,
		srcDir: tmp,
		className: path.basename(stagedSrc, path.extname(stagedSrc)),
	};
	const cmd = opts.overrides?.compilerPaths?.[lang.id] ?? lang.compile.command;
	const baseArgs = substituteAll(lang.compile.args, vars);
	const userFlags = opts.overrides?.compileFlags?.[lang.id] ?? [];
	const args = [...baseArgs, ...userFlags];

	const r = await spawnWithTimeout({ cmd, args, cwd: tmp, timeoutMs: 30_000 });

	if (r.errorCode === "ENOENT") {
		const { buildMissingCompilerMessage } = await import("../languages/preflight");
		const message = buildMissingCompilerMessage(
			lang.def,
			cmd,
			process.platform as "linux" | "darwin" | "win32"
		);
		return { ok: false, message, artifactDir: tmp, sourceFile };
	}

	if (r.exitCode === 0) {
		return { ok: true, message: r.stdout + r.stderr, artifactDir: tmp, sourceFile, exe };
	}
	return {
		ok: false,
		message: r.stderr || r.stdout || `compile failed (exit ${r.exitCode})`,
		artifactDir: tmp,
		sourceFile,
	};
}

export async function runCase(
	compile: CompileOutput,
	lang: LanguageMeta,
	tc: TestcasePair,
	opts: RunOptions
): Promise<CaseRun> {
	const { input, output } = await readTestcase(tc);
	const stagedSrc = path.join(compile.artifactDir, compile.sourceFile);
	const vars: Record<string, string> = {
		src: stagedSrc,
		exe: compile.exe ?? path.join(compile.artifactDir, "Main"),
		srcDir: compile.artifactDir,
		className: path.basename(compile.sourceFile, path.extname(compile.sourceFile)),
	};
	if (!lang.run) {
		// Special runtimes (text, csharp) should not reach runCase via the standard flow.
		return {
			testcase: tc,
			verdict: {
				kind: "runtime",
				elapsedMs: 0,
				stderr: `no run command for language ${lang.id}`,
				exitCode: -1,
			},
			stdout: "",
			stderr: `no run command for language ${lang.id}`,
			expected: output,
			input,
		};
	}
	const runCmd = substitute(lang.run.command, vars);
	const args = substituteAll(lang.run.args, vars);

	const r: SpawnResult = await spawnWithTimeout({
		cmd: runCmd,
		args,
		cwd: compile.artifactDir,
		stdin: input,
		timeoutMs: opts.timeoutMs,
	});

	const verdict: CaseVerdict = (() => {
		if (r.timedOut) return { kind: "timeout", elapsedMs: r.elapsedMs };
		if (r.exitCode !== 0) {
			return {
				kind: "runtime",
				elapsedMs: r.elapsedMs,
				stderr: r.stderr,
				exitCode: r.exitCode,
			};
		}
		const diff = compareIcpc(output, r.stdout);
		return diff.equal
			? { kind: "passed", elapsedMs: r.elapsedMs, diff }
			: { kind: "wrong", elapsedMs: r.elapsedMs, diff };
	})();

	return {
		testcase: tc,
		verdict,
		stdout: r.stdout,
		stderr: r.stderr,
		expected: output,
		input,
	};
}

export async function runAll(
	sourcePath: string,
	lang: LanguageMeta,
	testcases: TestcasePair[],
	opts: RunOptions
): Promise<{ compile: CompileOutput; cases: CaseRun[] }> {
	const compile = await compileIfNeeded(sourcePath, lang, opts);
	if (!compile.ok) {
		return {
			compile,
			cases: testcases.map((tc) => ({
				testcase: tc,
				verdict: { kind: "compile_error", message: compile.message } as CaseVerdict,
				stdout: "",
				stderr: compile.message,
				expected: "",
				input: "",
			})),
		};
	}
	const cases: CaseRun[] = [];
	for (const tc of testcases) {
		cases.push(await runCase(compile, lang, tc, opts));
	}
	return { compile, cases };
}
