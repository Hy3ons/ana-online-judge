import * as crypto from "node:crypto";
import type { CompileOutput } from "./runner";

interface Entry {
	hash: string;
	output: CompileOutput;
}

/**
 * In-memory cache of compile artifacts keyed by source path + content hash.
 * The same source file can be compiled once and reused across all testcase runs
 * within Run All, and across subsequent Run One invocations until the file changes.
 *
 * No TTL — entries live until invalidate() is called (typically from
 * onDidSaveTextDocument). Memory cost is bounded by the number of source files
 * the user runs.
 */
export class CompileCache {
	private readonly store = new Map<string, Entry>();

	get(sourcePath: string, hash: string): CompileOutput | null {
		const e = this.store.get(sourcePath);
		if (!e || e.hash !== hash) return null;
		return e.output;
	}

	set(sourcePath: string, hash: string, output: CompileOutput): void {
		this.store.set(sourcePath, { hash, output });
	}

	invalidate(sourcePath: string): void {
		this.store.delete(sourcePath);
	}

	clear(): void {
		this.store.clear();
	}

	static hashContent(content: string): string {
		return crypto.createHash("sha1").update(content).digest("hex");
	}
}
