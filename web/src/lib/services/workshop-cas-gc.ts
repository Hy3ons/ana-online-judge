import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopSnapshots } from "@/db/schema";
import type { SnapshotState } from "@/lib/services/workshop-snapshots";
import { deleteFile, listObjects } from "@/lib/storage/operations";

export type CasGcResult = {
	referenced: number;
	total: number;
	orphans: string[];
	deleted: number;
};

/** 한 문제의 미참조 CAS 객체를 찾는다. dryRun=true(기본)면 삭제하지 않고 목록만 반환. */
export async function gcWorkshopObjects(
	problemId: number,
	opts: { dryRun?: boolean } = {}
): Promise<CasGcResult> {
	const dryRun = opts.dryRun ?? true;
	const snaps = await db
		.select({ stateJson: workshopSnapshots.stateJson })
		.from(workshopSnapshots)
		.where(eq(workshopSnapshots.workshopProblemId, problemId));
	const referenced = new Set<string>();
	for (const s of snaps) {
		const st = s.stateJson as SnapshotState;
		if (st.problem.checkerHash) referenced.add(st.problem.checkerHash);
		if (st.problem.validatorHash) referenced.add(st.problem.validatorHash);
		for (const t of st.testcases) {
			referenced.add(t.inputHash);
			if (t.outputHash) referenced.add(t.outputHash);
		}
		for (const g of st.generators) {
			referenced.add(g.sourceHash);
			if (g.compiledHash) referenced.add(g.compiledHash);
		}
		for (const so of st.solutions) referenced.add(so.sourceHash);
		for (const r of st.resources) referenced.add(r.hash);
		for (const im of st.images ?? []) referenced.add(im.hash);
	}
	const prefix = `workshop/${problemId}/objects/`;
	const keys = await listObjects(prefix);
	const orphans: string[] = [];
	for (const key of keys) {
		const sha = key.slice(prefix.length);
		if (!referenced.has(sha)) orphans.push(key);
	}
	let deleted = 0;
	if (!dryRun) {
		for (const key of orphans) {
			await deleteFile(key);
			deleted++;
		}
	}
	return { referenced: referenced.size, total: keys.length, orphans, deleted };
}
