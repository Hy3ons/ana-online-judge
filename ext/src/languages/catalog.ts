import { LANGUAGES, type LanguageDef } from "./data";
import { resolveCmd } from "./resolve";

/**
 * OS-resolved language metadata — what callers (runner, runStream) consume.
 * Commands here are concrete Cmds (not platform maps), already picked for the host OS.
 */
export interface LanguageMeta {
	id: string;
	displayName: string;
	aliases: string[];
	fileExtensions: string[];
	defaultExtension: string;
	sourceFile: string;
	judgeVersion: string;
	compile?: { command: string; args: string[] };
	run?: { command: string; args: string[] };
	timeMultiplier: number;
	timeAddSec: number;
	memoryMultiplier: number;
	memoryAddMb: number;
	runtime?: "text";
	/** Underlying static definition — used by preflight to access installHints. */
	def: LanguageDef;
}

function resolveMeta(def: LanguageDef): LanguageMeta {
	const platform = process.platform as "linux" | "darwin" | "win32";
	return {
		id: def.id,
		displayName: def.displayName,
		aliases: def.aliases,
		fileExtensions: def.fileExtensions,
		defaultExtension: def.defaultExtension,
		sourceFile: def.sourceFile,
		judgeVersion: def.judgeVersion,
		compile: def.compile ? resolveCmd(def.compile, platform) : undefined,
		run: def.run ? resolveCmd(def.run, platform) : undefined,
		timeMultiplier: def.timeMultiplier,
		timeAddSec: def.timeAddSec,
		memoryMultiplier: def.memoryMultiplier,
		memoryAddMb: def.memoryAddMb,
		runtime: def.runtime,
		def,
	};
}

export class LanguageCatalog {
	private readonly resolved: LanguageMeta[] = LANGUAGES.map(resolveMeta);

	getAll(): LanguageMeta[] {
		return this.resolved;
	}

	get(id: string): LanguageMeta | undefined {
		return this.resolved.find((l) => l.id === id);
	}

	/** No-op retained for API compatibility (no async fetch anymore). */
	invalidate(): void {
		/* nothing to invalidate */
	}
}
