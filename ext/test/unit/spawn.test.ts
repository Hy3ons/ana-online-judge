import { describe, expect, it } from "vitest";
import { spawnWithTimeout } from "../../src/runner/spawn";

describe("spawnWithTimeout", () => {
	it("captures stdout", async () => {
		const r = await spawnWithTimeout({
			cmd: process.execPath,
			args: ["-e", "process.stdout.write('hello')"],
			cwd: process.cwd(),
			timeoutMs: 5000,
		});
		expect(r.exitCode).toBe(0);
		expect(r.stdout).toBe("hello");
		expect(r.timedOut).toBe(false);
	});

	it("pipes stdin", async () => {
		const r = await spawnWithTimeout({
			cmd: process.execPath,
			args: [
				"-e",
				"let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>process.stdout.write(s.toUpperCase()));",
			],
			cwd: process.cwd(),
			stdin: "abc",
			timeoutMs: 5000,
		});
		expect(r.stdout).toBe("ABC");
	});

	it("captures stderr and non-zero exit", async () => {
		const r = await spawnWithTimeout({
			cmd: process.execPath,
			args: ["-e", "process.stderr.write('oops'); process.exit(2);"],
			cwd: process.cwd(),
			timeoutMs: 5000,
		});
		expect(r.exitCode).toBe(2);
		expect(r.stderr).toBe("oops");
	});

	it("times out infinite loop and kills tree", async () => {
		const r = await spawnWithTimeout({
			cmd: process.execPath,
			args: ["-e", "while(true){}"],
			cwd: process.cwd(),
			timeoutMs: 300,
		});
		expect(r.timedOut).toBe(true);
		expect(r.elapsedMs).toBeLessThan(2000);
	}, 5000);

	it("emits spawn error for unknown binary", async () => {
		const r = await spawnWithTimeout({
			cmd: "/nonexistent-binary-aoj-xx",
			args: [],
			cwd: process.cwd(),
			timeoutMs: 1000,
		});
		expect(r.exitCode).toBeNull();
		expect(r.stderr).toContain("[spawn error]");
	});
});
