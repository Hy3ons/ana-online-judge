import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { spawn } from "node:child_process";

export interface SpawnOptions {
	cmd: string;
	args: string[];
	cwd: string;
	stdin?: string;
	/** Hard limit in milliseconds. */
	timeoutMs: number;
	env?: NodeJS.ProcessEnv;
	/** Aborting the signal kills the process tree. */
	signal?: AbortSignal;
}

export interface SpawnResult {
	stdout: string;
	stderr: string;
	exitCode: number | null;
	signal: NodeJS.Signals | null;
	elapsedMs: number;
	timedOut: boolean;
	aborted: boolean;
}

/** Kill a process group. POSIX uses negative PID; Windows uses taskkill /T /F. */
export function killTree(child: ChildProcessWithoutNullStreams): void {
	if (child.pid === undefined) return;
	if (process.platform === "win32") {
		spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"]).on("error", () => {
			/* ignore */
		});
	} else {
		try {
			process.kill(-child.pid, "SIGKILL");
		} catch {
			try {
				child.kill("SIGKILL");
			} catch {
				/* ignore */
			}
		}
	}
}

export function spawnWithTimeout(opts: SpawnOptions): Promise<SpawnResult> {
	return new Promise((resolve) => {
		const start = Date.now();
		// Refuse early if the caller's signal is already aborted.
		if (opts.signal?.aborted) {
			resolve({
				stdout: "",
				stderr: "",
				exitCode: null,
				signal: null,
				elapsedMs: 0,
				timedOut: false,
				aborted: true,
			});
			return;
		}
		const child = spawn(opts.cmd, opts.args, {
			cwd: opts.cwd,
			env: opts.env,
			detached: process.platform !== "win32",
			windowsHide: true,
		});
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		let aborted = false;
		let settled = false;

		const timer = setTimeout(() => {
			timedOut = true;
			killTree(child);
		}, opts.timeoutMs);

		const onAbort = () => {
			aborted = true;
			killTree(child);
		};
		opts.signal?.addEventListener("abort", onAbort);

		const cleanup = () => {
			clearTimeout(timer);
			opts.signal?.removeEventListener("abort", onAbort);
		};

		child.stdout.setEncoding("utf-8");
		child.stderr.setEncoding("utf-8");
		child.stdout.on("data", (d) => {
			stdout += d;
		});
		child.stderr.on("data", (d) => {
			stderr += d;
		});
		// Swallow EPIPE/ECONNRESET on stdin when the child exits before consuming input.
		child.stdin.on("error", () => {
			/* ignore */
		});
		child.on("error", (err) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve({
				stdout,
				stderr: `${stderr}\n[spawn error] ${err.message}`,
				exitCode: null,
				signal: null,
				elapsedMs: Date.now() - start,
				timedOut,
				aborted,
			});
		});
		child.on("close", (code, signal) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve({
				stdout,
				stderr,
				exitCode: code,
				signal,
				elapsedMs: Date.now() - start,
				timedOut,
				aborted,
			});
		});

		try {
			if (opts.stdin !== undefined) child.stdin.write(opts.stdin);
			child.stdin.end();
		} catch {
			/* child may have already exited; close handler will resolve */
		}
	});
}
