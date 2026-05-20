import * as vscode from "vscode";
import { ApiClient } from "./api/client";
import { Endpoints } from "./api/endpoints";
import { AojAuthProvider, AUTH_PROVIDER_ID, AUTH_PROVIDER_LABEL } from "./auth/authProvider";
import { DeviceFlow } from "./auth/deviceFlow";
import { TokenStore } from "./auth/tokenStore";
import { addTestcaseCmd } from "./commands/addTestcase";
import { attachProblemCmd } from "./commands/attachProblem";
import { openInBrowserCmd } from "./commands/openInBrowser";
import { openStatementCmd } from "./commands/openStatement";
import { removeTestcaseCmd } from "./commands/removeTestcase";
import { runAllCmd } from "./commands/runAll";
import { runOneCmd } from "./commands/runOne";
import { searchProblemsCmd } from "./commands/searchProblems";
import { submitCmd } from "./commands/submit";
import { LanguageCatalog } from "./languages/catalog";
import { ContestCountdown } from "./status/contestCountdown";
import { AojSidebarProvider } from "./views/sidebar/provider";

let output: vscode.OutputChannel;
let signedInUsername: string | null = null;

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
	signedInUsername = existing?.username ?? null;
	await vscode.commands.executeCommand("setContext", "aoj.signedIn", existing !== null);

	const apiClient = new ApiClient({
		endpoint: getEndpoint(),
		getSession: () => tokens.load(),
		saveSession: (s) => tokens.save(s),
		clearSession: () => tokens.clear(),
		deviceFlow,
	});
	const endpoints = new Endpoints(apiClient);
	const catalog = new LanguageCatalog(endpoints);

	const sidebar = new AojSidebarProvider(context, endpoints, catalog, () => signedInUsername);
	const countdown = new ContestCountdown(endpoints);
	countdown.start();

	provider.onDidChangeSessions(async () => {
		const cur = await tokens.load();
		signedInUsername = cur?.username ?? null;
		await sidebar.refresh();
		await countdown.refresh();
	});

	context.subscriptions.push(
		output,
		provider,
		sidebar,
		countdown,
		vscode.authentication.registerAuthenticationProvider(
			AUTH_PROVIDER_ID,
			AUTH_PROVIDER_LABEL,
			provider,
			{ supportsMultipleAccounts: false }
		),
		vscode.window.registerWebviewViewProvider(AojSidebarProvider.viewId, sidebar),
		vscode.commands.registerCommand("aoj.signIn", async () => {
			await vscode.authentication.getSession(AUTH_PROVIDER_ID, ["user"], {
				createIfNone: true,
			});
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
		vscode.commands.registerCommand("aoj.searchProblems", () => searchProblemsCmd(endpoints)),
		vscode.commands.registerCommand("aoj.attachProblemById", (id?: number, contestId?: number) =>
			attachProblemCmd(endpoints, id, contestId)
		),
		// Back-compat: keep aoj.syncProblemById ID as alias.
		vscode.commands.registerCommand("aoj.syncProblemById", (id?: number, contestId?: number) =>
			attachProblemCmd(endpoints, id, contestId)
		),
		vscode.commands.registerCommand("aoj.runAll", () => runAllCmd(context, catalog)),
		vscode.commands.registerCommand("aoj.runOne", (idx?: number) =>
			runOneCmd(context, catalog, idx)
		),
		vscode.commands.registerCommand("aoj.submit", () => submitCmd(context, endpoints)),
		vscode.commands.registerCommand("aoj.addTestcase", () => addTestcaseCmd()),
		vscode.commands.registerCommand("aoj.removeTestcase", (idx?: number) => removeTestcaseCmd(idx)),
		vscode.commands.registerCommand("aoj.openStatement", () =>
			openStatementCmd(context, endpoints)
		),
		vscode.commands.registerCommand("aoj.openInBrowser", () => openInBrowserCmd()),
		vscode.commands.registerCommand("aoj.sidebar.refresh", () => sidebar.refresh())
	);
}

export function deactivate(): void {
	output?.dispose();
}

export function getOutput(): vscode.OutputChannel {
	return output;
}
