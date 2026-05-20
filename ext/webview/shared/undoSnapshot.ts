export interface Snapshot {
	index: number;
	input: string;
	output: string;
}

export function takeSnapshot(index: number, input: string, output: string): Snapshot {
	return { index, input, output };
}

export async function restoreSnapshot(
	snap: Snapshot,
	write: (index: number, input: string, output: string) => Promise<void>
): Promise<void> {
	await write(snap.index, snap.input, snap.output);
}
