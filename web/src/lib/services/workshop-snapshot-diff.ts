import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopSnapshots } from "@/db/schema";
import type { SnapshotState } from "@/lib/services/workshop-snapshots";

export type FieldChange = { field: string; from: string; to: string };
export type ListDiff = { added: string[]; removed: string[]; changed: string[] };

export type SnapshotDiff = {
	header: FieldChange[];
	testcases: ListDiff;
	solutions: ListDiff;
	generators: ListDiff;
	resources: ListDiff;
	images: ListDiff;
};

function headerDiff(a: SnapshotState["problem"], b: SnapshotState["problem"]): FieldChange[] {
	const fields: (keyof SnapshotState["problem"])[] = [
		"title",
		"problemType",
		"timeLimit",
		"memoryLimit",
		"seed",
		"checkerLanguage",
		"checkerHash",
		"validatorLanguage",
		"validatorHash",
		"generatorScript",
	];
	const out: FieldChange[] = [];
	for (const f of fields) {
		const from = String(a[f] ?? "");
		const to = String(b[f] ?? "");
		if (from !== to) out.push({ field: f, from, to });
	}
	if (a.description !== b.description)
		out.push({ field: "description", from: "(변경됨)", to: "(변경됨)" });
	return out;
}

function listDiff<T>(a: T[], b: T[], key: (x: T) => string, sig: (x: T) => string): ListDiff {
	const am = new Map(a.map((x) => [key(x), sig(x)]));
	const bm = new Map(b.map((x) => [key(x), sig(x)]));
	const added: string[] = [];
	const removed: string[] = [];
	const changed: string[] = [];
	for (const k of bm.keys()) if (!am.has(k)) added.push(k);
	for (const k of am.keys()) if (!bm.has(k)) removed.push(k);
	for (const k of am.keys()) if (bm.has(k) && am.get(k) !== bm.get(k)) changed.push(k);
	return { added, removed, changed };
}

export async function diffSnapshots(
	problemId: number,
	fromId: number,
	toId: number
): Promise<SnapshotDiff> {
	const rows = await db
		.select()
		.from(workshopSnapshots)
		.where(eq(workshopSnapshots.workshopProblemId, problemId));
	const from = rows.find((r) => r.id === fromId);
	const to = rows.find((r) => r.id === toId);
	if (!from || !to) throw new Error("스냅샷을 찾을 수 없습니다");
	const A = from.stateJson as SnapshotState;
	const B = to.stateJson as SnapshotState;
	return {
		header: headerDiff(A.problem, B.problem),
		testcases: listDiff(
			A.testcases,
			B.testcases,
			(t) => `#${t.index}`,
			(t) => `${t.inputHash}|${t.outputHash}|${t.score}|${t.validationStatus ?? ""}`
		),
		solutions: listDiff(
			A.solutions,
			B.solutions,
			(s) => s.name,
			(s) => `${s.sourceHash}|${s.expectedVerdict}|${s.isMain}`
		),
		generators: listDiff(
			A.generators,
			B.generators,
			(g) => g.name,
			(g) => g.sourceHash
		),
		resources: listDiff(
			A.resources,
			B.resources,
			(r) => r.name,
			(r) => r.hash
		),
		images: listDiff(
			A.images ?? [],
			B.images ?? [],
			(i) => i.key,
			(i) => i.hash
		),
	};
}
