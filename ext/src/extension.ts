import * as vscode from "vscode";
import { ApiClient } from "./api/client";
import { Endpoints } from "./api/endpoints";
import { AojAuthProvider, AUTH_PROVIDER_ID, AUTH_PROVIDER_LABEL } from "./auth/authProvider";
import { DeviceFlow } from "./auth/deviceFlow";
import { TokenStore } from "./auth/tokenStore";
import { CurrentFileTreeProvider } from "./views/currentFileView";
import { SyncTreeProvider } from "./views/syncView";

let output: vscode.OutputChannel;

function getEndpoint(): string {
	return vscode.workspace
		.getConfiguration("aoj")
		.get<string>("endpoint", "https://aoj.example.com");
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	output = vscode.window.createOutputChannel("AOJ");
	output.appendLine("AOJ extension activated");

	const tokens = new TokenStore(context.secrets);
	const deviceFlow = new DeviceFlow({ endpoint: getEndpoint() });
	const provider = new AojAuthProvider(tokens, deviceFlow, getEndpoint, output);

	const existing = await tokens.load();
	await vscode.commands.executeCommand("setContext", "aoj.signedIn", existing !== null);

	const apiClient = new ApiClient({
		endpoint: getEndpoint(),
		getSession: () => tokens.load(),
		saveSession: (s) => tokens.save(s),
		clearSession: () => tokens.clear(),
		deviceFlow,
	});
	const endpoints = new Endpoints(apiClient);
	const sync = new SyncTreeProvider(endpoints);
	const currentFile = new CurrentFileTreeProvider(() =>
		vscode.workspace.getConfiguration("aoj").get<string>("testcaseSidecarDir", ".aoj")
	);

	context.subscriptions.push(
		output,
		provider,
		vscode.authentication.registerAuthenticationProvider(
			AUTH_PROVIDER_ID,
			AUTH_PROVIDER_LABEL,
			provider,
			{
				supportsMultipleAccounts: false,
			}
		),
		vscode.commands.registerCommand("aoj.signIn", async () => {
			await vscode.authentication.getSession(AUTH_PROVIDER_ID, ["user"], { createIfNone: true });
		}),
		vscode.commands.registerCommand("aoj.signOut", async () => {
			const sessions = await provider.getSessions();
			if (sessions.length === 0) {
				vscode.window.showInformationMessage("이미 로그아웃 상태입니다.");
				return;
			}
			await provider.removeSession(sessions[0].id);
			vscode.window.showInformationMessage("로그아웃되었습니다.");
		}),
		vscode.window.registerTreeDataProvider("aoj.sync", sync),
		vscode.window.registerTreeDataProvider("aoj.currentFile", currentFile),
		vscode.commands.registerCommand("aoj.refreshContests", () => sync.refresh())
	);

	provider.onDidChangeSessions(() => sync.refresh());
}

export function deactivate(): void {
	output?.dispose();
}

export function getOutput(): vscode.OutputChannel {
	return output;
}
