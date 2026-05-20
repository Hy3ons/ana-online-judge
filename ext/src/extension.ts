import * as vscode from "vscode";
import { AojAuthProvider, AUTH_PROVIDER_ID, AUTH_PROVIDER_LABEL } from "./auth/authProvider";
import { DeviceFlow } from "./auth/deviceFlow";
import { TokenStore } from "./auth/tokenStore";

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
		})
	);
}

export function deactivate(): void {
	output?.dispose();
}

export function getOutput(): vscode.OutputChannel {
	return output;
}
