import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface SidecarV1 {
	version: 1;
	problemId: number;
	contestId?: number;
	problemTitle: string;
	language: string;
	timeLimit: number; // ms
	memoryLimit: number; // MB
	examples: { input: string; output: string }[];
	syncedAt: string; // ISO
}

export function sidecarPath(
	workspaceRoot: string,
	sourcePath: string,
	sidecarDir = ".aoj"
): string {
	const fileName = path.basename(sourcePath, path.extname(sourcePath));
	return path.join(workspaceRoot, sidecarDir, `${fileName}.json`);
}

export async function readSidecar(filePath: string): Promise<SidecarV1 | null> {
	try {
		const text = await fs.readFile(filePath, "utf-8");
		const data = JSON.parse(text) as SidecarV1;
		if (data.version !== 1) return null;
		if (!data.problemId || typeof data.problemId !== "number") return null;
		return data;
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
		return null;
	}
}

export async function writeSidecar(filePath: string, data: SidecarV1): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function removeSidecar(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
	}
}
