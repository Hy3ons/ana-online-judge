import * as vscode from "vscode";

let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
	output = vscode.window.createOutputChannel("AOJ");
	output.appendLine("AOJ extension activated");

	context.subscriptions.push(
		output,
		vscode.commands.registerCommand("aoj.signIn", async () => {
			vscode.window.showInformationMessage("Sign-in 구현 예정 (Task 8)");
		}),
		vscode.commands.registerCommand("aoj.signOut", async () => {
			vscode.window.showInformationMessage("Sign-out 구현 예정 (Task 8)");
		})
	);
}

export function deactivate(): void {
	output?.dispose();
}

export function getOutput(): vscode.OutputChannel {
	return output;
}
