import { readSidecar, type SidecarV1, sidecarPath } from "./sidecar";
import { listTestcases, type TestcasePair } from "./testcases";

export interface ResolvedFile {
	sourcePath: string;
	sidecar: SidecarV1 | null;
	testcases: TestcasePair[];
}

export async function resolveFile(
	workspaceRoot: string,
	sourcePath: string,
	sidecarDir = ".aoj"
): Promise<ResolvedFile> {
	const sidecar = await readSidecar(sidecarPath(workspaceRoot, sourcePath, sidecarDir));
	const testcases = await listTestcases(sourcePath);
	return { sourcePath, sidecar, testcases };
}
