import type { Cmd, PlatformCmd, PlatformKey } from "./data";

export function resolveCmd(p: PlatformCmd, platform: PlatformKey): Cmd {
	if ("command" in p) return p as Cmd;
	const map = p as Partial<Record<PlatformKey, Cmd>>;
	const picked = map[platform] ?? map.linux ?? map.darwin ?? map.win32;
	if (!picked) {
		throw new Error(`resolveCmd: no command for platform ${platform} and no fallback`);
	}
	return picked;
}

export interface Overrides {
	compilerPaths?: Record<string, string>;
	compileFlags?: Record<string, string[]>;
}

export function applyOverrides(langId: string, cmd: Cmd, overrides: Overrides): Cmd {
	const command = overrides.compilerPaths?.[langId] ?? cmd.command;
	const extra = overrides.compileFlags?.[langId] ?? [];
	return { command, args: [...cmd.args, ...extra] };
}
