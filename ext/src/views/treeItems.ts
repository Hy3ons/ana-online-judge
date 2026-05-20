import * as vscode from "vscode";

export class StaticItem extends vscode.TreeItem {
	constructor(
		label: string,
		icon: string,
		public readonly action?: string,
		public readonly arg?: unknown
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon(icon);
		if (action) {
			this.command = {
				title: label,
				command: action,
				arguments: arg !== undefined ? [arg] : undefined,
			};
		}
	}
}

export class GroupItem extends vscode.TreeItem {
	constructor(label: string, icon: string, expanded = vscode.TreeItemCollapsibleState.Collapsed) {
		super(label, expanded);
		this.iconPath = new vscode.ThemeIcon(icon);
	}
}

export class ProblemItem extends vscode.TreeItem {
	constructor(
		public readonly problemId: number,
		label: string,
		description?: string,
		public readonly contestId?: number
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.description = description;
		this.iconPath = new vscode.ThemeIcon("file-code");
		this.contextValue = "aoj.problem";
		this.command = {
			title: "Sync",
			command: "aoj.syncProblemById",
			arguments: [problemId, contestId],
		};
	}
}
