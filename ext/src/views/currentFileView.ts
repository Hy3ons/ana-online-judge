import * as vscode from "vscode";
import { resolveFile } from "../mapping/resolver";
import { GroupItem, StaticItem } from "./treeItems";

export class CurrentFileTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private readonly _change = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._change.event;

	constructor(private readonly sidecarDir: () => string) {
		vscode.window.onDidChangeActiveTextEditor(() => this._change.fire());
		vscode.workspace.onDidSaveTextDocument(() => this._change.fire());
	}

	refresh(): void {
		this._change.fire();
	}

	getTreeItem(el: vscode.TreeItem): vscode.TreeItem {
		return el;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		if (!element) return await this.rootChildren();
		if (element instanceof TestcaseGroup) return element.kids;
		return [];
	}

	private async rootChildren(): Promise<vscode.TreeItem[]> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return [new StaticItem("(no active editor)", "info")];
		const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
		if (!folder) return [new StaticItem("(file outside workspace)", "info")];
		const r = await resolveFile(folder.uri.fsPath, editor.document.uri.fsPath, this.sidecarDir());
		const out: vscode.TreeItem[] = [];

		if (r.sidecar) {
			const head = new StaticItem(
				`#${r.sidecar.problemId} ${r.sidecar.problemTitle}`,
				"file-code",
				"aoj.openStatement"
			);
			head.description = `${r.sidecar.timeLimit}ms · ${r.sidecar.memoryLimit}MB`;
			out.push(head);
			out.push(new StaticItem("Submit", "rocket", "aoj.submit"));
		} else {
			out.push(new StaticItem("(not synced — Run still works locally)", "info"));
		}

		out.push(new StaticItem("Run All", "play", "aoj.runAll"));
		out.push(new StaticItem("Add Testcase", "add", "aoj.addTestcase"));

		if (r.testcases.length > 0) {
			const grp = new TestcaseGroup(`Testcases (${r.testcases.length})`, "list-unordered");
			grp.kids = r.testcases.map((tc) => {
				const it = new StaticItem(`#${tc.index}`, "circle-outline", "aoj.runOne", tc.index);
				it.contextValue = "aoj.testcase";
				return it;
			});
			out.push(grp);
		}
		return out;
	}
}

class TestcaseGroup extends GroupItem {
	kids: vscode.TreeItem[] = [];
}
