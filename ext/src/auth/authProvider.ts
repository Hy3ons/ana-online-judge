import * as vscode from "vscode";
import { type DeviceFlow, DeviceFlowCanceled, DeviceFlowError } from "./deviceFlow";
import type { StoredSession, TokenStore } from "./tokenStore";

export const AUTH_PROVIDER_ID = "aoj";
export const AUTH_PROVIDER_LABEL = "ANA Online Judge";

interface FetchedUser {
	id: number;
	username: string;
}

export class AojAuthProvider implements vscode.AuthenticationProvider, vscode.Disposable {
	private readonly _onDidChange =
		new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
	readonly onDidChangeSessions = this._onDidChange.event;

	constructor(
		private readonly tokens: TokenStore,
		private readonly deviceFlow: DeviceFlow,
		private readonly endpoint: () => string,
		private readonly logger: vscode.OutputChannel
	) {}

	dispose(): void {
		this._onDidChange.dispose();
	}

	async getSessions(_scopes?: readonly string[]): Promise<vscode.AuthenticationSession[]> {
		const s = await this.tokens.load();
		if (!s) return [];
		return [this.toSession(s)];
	}

	async createSession(scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
		return await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "AOJ: 로그인 진행 중",
				cancellable: true,
			},
			async (progress, cancel) => {
				const code = await this.deviceFlow.requestCode();
				progress.report({ message: `브라우저에서 ${code.user_code} 입력` });

				const open = "브라우저에서 열기";
				const copy = "코드 복사";
				const pick = await vscode.window.showInformationMessage(
					`AOJ 로그인: 코드 ${code.user_code} 를 ${code.verification_uri} 에 입력하세요.`,
					open,
					copy
				);
				if (pick === open) {
					await vscode.env.openExternal(vscode.Uri.parse(code.verification_uri_complete));
				} else if (pick === copy) {
					await vscode.env.clipboard.writeText(code.user_code);
					await vscode.env.openExternal(vscode.Uri.parse(code.verification_uri));
				}

				const ctrl = new AbortController();
				cancel.onCancellationRequested(() => ctrl.abort());

				let token: Awaited<ReturnType<typeof this.deviceFlow.poll>>;
				try {
					token = await this.deviceFlow.poll(code.device_code, code.interval, {
						signal: ctrl.signal,
					});
				} catch (e) {
					if (e instanceof DeviceFlowCanceled) {
						throw new Error("로그인이 취소되었습니다.");
					}
					if (e instanceof DeviceFlowError) {
						throw new Error(`로그인 실패: ${e.code}`);
					}
					throw e;
				}

				const user = await this.fetchMe(token.access_token);
				const session: StoredSession = {
					accessToken: token.access_token,
					refreshToken: token.refresh_token,
					expiresAt: Date.now() + token.expires_in * 1000,
					refreshExpiresAt: Date.now() + token.refresh_expires_in * 1000,
					userId: user.id,
					username: user.username,
				};
				await this.tokens.save(session);
				const vsSession = this.toSession(session, scopes);
				this._onDidChange.fire({ added: [vsSession], removed: [], changed: [] });
				await vscode.commands.executeCommand("setContext", "aoj.signedIn", true);
				this.logger.appendLine(`Signed in as @${user.username}`);
				return vsSession;
			}
		);
	}

	async removeSession(_sessionId: string): Promise<void> {
		const s = await this.tokens.load();
		await this.tokens.clear();
		if (s) {
			try {
				await this.deviceFlow.revoke(s.accessToken);
			} catch {
				/* best-effort */
			}
			this._onDidChange.fire({ added: [], removed: [this.toSession(s)], changed: [] });
		}
		await vscode.commands.executeCommand("setContext", "aoj.signedIn", false);
		this.logger.appendLine("Signed out");
	}

	private async fetchMe(token: string): Promise<FetchedUser> {
		const res = await fetch(`${this.endpoint().replace(/\/$/, "")}/api/v1/user/me`, {
			headers: { authorization: `Bearer ${token}` },
		});
		if (!res.ok) throw new Error(`/me failed: ${res.status}`);
		const data = (await res.json()) as { id: number; username: string };
		return { id: data.id, username: data.username };
	}

	private toSession(
		s: StoredSession,
		scopes: readonly string[] = ["user"]
	): vscode.AuthenticationSession {
		return {
			id: `aoj:${s.userId}`,
			accessToken: s.accessToken,
			account: { id: String(s.userId), label: s.username },
			scopes: [...scopes],
		};
	}
}
