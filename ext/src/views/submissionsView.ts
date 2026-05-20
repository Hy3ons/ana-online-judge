import * as vscode from "vscode";
import { UnauthorizedError } from "../api/client";
import type { Endpoints, SubmissionSummary } from "../api/endpoints";
import { StaticItem } from "./treeItems";

const VERDICT_ICON: Record<string, string> = {
	AC: "check",
	WA: "x",
	TLE: "watch",
	MLE: "warning",
	RTE: "bug",
	CE: "alert",
	PE: "warning",
	Pending: "loading~spin",
	Judging: "loading~spin",
};

export class SubmissionsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private readonly _change = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._change.event;

	constructor(
		private readonly endpoints: Endpoints,
		private readonly endpointUrl: () => string
	) {}

	refresh(): void {
		this._change.fire();
	}

	getTreeItem(el: vscode.TreeItem): vscode.TreeItem {
		return el;
	}

	async getChildren(): Promise<vscode.TreeItem[]> {
		try {
			const { submissions } = await this.endpoints.listMySubmissions(1, 30);
			if (submissions.length === 0) return [new StaticItem("(no submissions yet)", "circle-slash")];
			const baseUrl = this.endpointUrl().replace(/\/$/, "");
			return submissions.map((s) => toItem(s, baseUrl));
		} catch (e) {
			if (e instanceof UnauthorizedError) {
				return [new StaticItem("Sign in to view submissions", "sign-in", "aoj.signIn")];
			}
			return [new StaticItem(`(error: ${(e as Error).message})`, "error")];
		}
	}
}

function toItem(s: SubmissionSummary, baseUrl: string): vscode.TreeItem {
	const icon = VERDICT_ICON[s.verdict] ?? "circle-outline";
	const item = new vscode.TreeItem(
		`${s.verdict} — ${s.problemTitle}`,
		vscode.TreeItemCollapsibleState.None
	);
	item.iconPath = new vscode.ThemeIcon(icon);
	item.description = `${s.language} · ${new Date(s.createdAt).toLocaleString()}`;
	item.id = `sub-${s.id}`;
	item.command = {
		title: "Open",
		command: "vscode.open",
		arguments: [vscode.Uri.parse(`${baseUrl}/submissions/${s.id}`)],
	};
	item.contextValue = "aoj.submission";
	return item;
}
