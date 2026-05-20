import { exec } from "node:child_process";

const cache = new Map<string, boolean>();

function check(cmd: string): Promise<boolean> {
	return new Promise((resolve) => {
		// POSIX: command -v; Windows: where
		const probe = process.platform === "win32" ? `where ${cmd}` : `command -v ${cmd}`;
		exec(
			probe,
			{ timeout: 2000, shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh" },
			(err) => {
				resolve(!err);
			}
		);
	});
}

export async function detectCommand(cmd: string): Promise<boolean> {
	if (cache.has(cmd)) return cache.get(cmd) as boolean;
	const ok = await check(cmd);
	cache.set(cmd, ok);
	return ok;
}

export function clearDetectCache(): void {
	cache.clear();
}
