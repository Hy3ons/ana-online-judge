import * as vscode from "vscode";
import type { Endpoints } from "../api/endpoints";

const REFRESH_LIST_MS = 60_000;
const TICK_MS = 1000;

export class ContestCountdown implements vscode.Disposable {
	private readonly item: vscode.StatusBarItem;
	private nearestEnd: { name: string; endMs: number; id: number } | null = null;
	private tickHandle: NodeJS.Timeout | null = null;
	private refreshHandle: NodeJS.Timeout | null = null;

	constructor(private readonly endpoints: Endpoints) {
		this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.item.command = "aoj.openInBrowser";
	}

	start(): void {
		void this.refresh();
		this.refreshHandle = setInterval(() => void this.refresh(), REFRESH_LIST_MS);
		this.tickHandle = setInterval(() => this.tick(), TICK_MS);
	}

	dispose(): void {
		if (this.tickHandle) clearInterval(this.tickHandle);
		if (this.refreshHandle) clearInterval(this.refreshHandle);
		this.item.dispose();
	}

	async refresh(): Promise<void> {
		try {
			const { contests } = await this.endpoints.activeContests();
			const now = Date.now();
			const running = contests
				.filter((c) => c.status === "running")
				.map((c) => ({ id: c.id, name: c.title, endMs: Date.parse(c.endTime) }))
				.filter((c) => c.endMs > now)
				.sort((a, b) => a.endMs - b.endMs);
			this.nearestEnd = running[0] ?? null;
			this.render();
		} catch {
			this.nearestEnd = null;
			this.item.hide();
		}
	}

	private tick(): void {
		if (this.nearestEnd && this.nearestEnd.endMs <= Date.now()) {
			this.nearestEnd = null;
			void this.refresh();
		}
		this.render();
	}

	private render(): void {
		if (!this.nearestEnd) {
			this.item.hide();
			return;
		}
		const left = Math.max(0, this.nearestEnd.endMs - Date.now());
		this.item.text = `$(trophy) ${this.nearestEnd.name} — ${fmt(left)}`;
		this.item.tooltip = `Contest ends at ${new Date(this.nearestEnd.endMs).toLocaleString()}`;
		this.item.show();
	}
}

function fmt(ms: number): string {
	const total = Math.floor(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) return `${h}h ${pad(m)}:${pad(s)}`;
	return `${pad(m)}:${pad(s)}`;
}
function pad(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}
