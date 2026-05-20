import * as vscode from "vscode";
import { UnauthorizedError } from "../api/client";
import type { Endpoints } from "../api/endpoints";
import { readSidecar } from "../mapping/sidecar";
import { GroupItem, ProblemItem, StaticItem } from "./treeItems";

const RECENT_LIMIT = 20;

export class SyncTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private readonly _change = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._change.event;

	constructor(private readonly endpoints: Endpoints) {}

	refresh(): void {
		this._change.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		if (!element) {
			return [
				new StaticItem("Search Problems...", "search", "aoj.searchProblems"),
				new GroupItem("Active Contests", "trophy"),
				new GroupItem("Recently Synced", "history"),
			];
		}
		if (element.label === "Active Contests") return await this.activeContests();
		if (element.label === "Recently Synced") return await this.recent();
		if (element instanceof ContestGroupItem) return element.children;
		return [];
	}

	private async activeContests(): Promise<vscode.TreeItem[]> {
		try {
			const { contests } = await this.endpoints.activeContests();
			if (contests.length === 0) {
				return [new StaticItem("(no active contests)", "circle-slash")];
			}
			const now = Date.now();
			return contests.map((c) => {
				const start = Date.parse(c.startTime);
				const end = Date.parse(c.endTime);
				const before = c.status === "upcoming";
				const label = before ? `⏳ ${c.title}` : c.title;
				const desc = before
					? `starts in ${humanDelta(start - now)}`
					: `${humanDelta(end - now)} left`;
				return new ContestGroupItem(
					label,
					desc,
					c.problems.map(
						(p) => new ProblemItem(p.id, `${p.label} ${p.title}`.trim(), `#${p.id}`, c.id)
					),
					before
				);
			});
		} catch (e) {
			if (e instanceof UnauthorizedError) {
				return [new StaticItem("Sign in to see contests", "sign-in", "aoj.signIn")];
			}
			return [new StaticItem(`(error: ${(e as Error).message})`, "error")];
		}
	}

	private async recent(): Promise<vscode.TreeItem[]> {
		const folders = vscode.workspace.workspaceFolders ?? [];
		if (folders.length === 0) return [new StaticItem("(open a folder)", "info")];
		const pattern = new vscode.RelativePattern(folders[0], ".aoj/*.json");
		const uris = await vscode.workspace.findFiles(pattern, undefined, RECENT_LIMIT);
		const items: ProblemItem[] = [];
		for (const u of uris) {
			const sc = await readSidecar(u.fsPath);
			if (!sc) continue;
			items.push(new ProblemItem(sc.problemId, sc.problemTitle, `#${sc.problemId}`));
		}
		if (items.length === 0) return [new StaticItem("(no synced problems yet)", "circle-slash")];
		return items;
	}
}

class ContestGroupItem extends GroupItem {
	constructor(
		label: string,
		description: string,
		public readonly children: vscode.TreeItem[],
		pendingStart: boolean
	) {
		super(label, pendingStart ? "watch" : "play-circle", vscode.TreeItemCollapsibleState.Collapsed);
		this.description = description;
	}
}

function humanDelta(ms: number): string {
	if (ms < 0) return "ended";
	const s = Math.floor(ms / 1000);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${sec}s`;
	return `${sec}s`;
}
