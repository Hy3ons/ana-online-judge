import { type DeviceFlow, DeviceFlowError } from "../auth/deviceFlow";
import {
	isAccessTokenExpired,
	isRefreshTokenExpired,
	type StoredSession,
} from "../auth/tokenStore";

export interface ApiClientOptions {
	endpoint: string;
	getSession: () => Promise<StoredSession | null>;
	saveSession: (s: StoredSession) => Promise<void>;
	clearSession: () => Promise<void>;
	deviceFlow: DeviceFlow;
	fetchImpl?: typeof fetch;
}

export class UnauthorizedError extends Error {
	constructor() {
		super("Not signed in");
		this.name = "UnauthorizedError";
	}
}

export class ApiError extends Error {
	constructor(
		public status: number,
		public body: unknown
	) {
		super(`API ${status}`);
		this.name = "ApiError";
	}
}

export interface RequestOptions {
	method?: string;
	body?: unknown;
	query?: Record<string, string | number | boolean | undefined>;
	/** If false, do not attach Authorization header (used for public endpoints). */
	auth?: boolean;
	signal?: AbortSignal;
}

export class ApiClient {
	private refreshing: Promise<StoredSession> | null = null;

	constructor(private readonly opts: ApiClientOptions) {}

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const { method = "GET", body, query, auth = true, signal } = options;
		const url = this.buildUrl(path, query);
		const fetchImpl = this.opts.fetchImpl ?? fetch;

		const doFetch = async (token: string | null): Promise<Response> => {
			const headers: Record<string, string> = { accept: "application/json" };
			if (body !== undefined) headers["content-type"] = "application/json";
			if (token) headers.authorization = `Bearer ${token}`;
			return await fetchImpl(url, {
				method,
				headers,
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal,
			});
		};

		let session = auth ? await this.opts.getSession() : null;
		if (auth && !session) throw new UnauthorizedError();

		// Proactive refresh if known-expired.
		if (auth && session && isAccessTokenExpired(session)) {
			session = await this.refreshOrFail(session);
		}

		let res = await doFetch(session?.accessToken ?? null);
		if (auth && res.status === 401 && session) {
			// Reactive refresh once.
			session = await this.refreshOrFail(session);
			res = await doFetch(session.accessToken);
		}

		if (res.status === 204) return undefined as T;
		const text = await res.text();
		const parsed = text ? this.tryParse(text) : undefined;
		if (!res.ok) throw new ApiError(res.status, parsed ?? text);
		return parsed as T;
	}

	/** Stream a response body line-by-line (for SSE). Yields raw chunks. */
	async stream(path: string, options: RequestOptions = {}): Promise<Response> {
		const url = this.buildUrl(path, options.query);
		const fetchImpl = this.opts.fetchImpl ?? fetch;
		let session = options.auth === false ? null : await this.opts.getSession();
		if (options.auth !== false && !session) throw new UnauthorizedError();
		if (session && isAccessTokenExpired(session)) {
			session = await this.refreshOrFail(session);
		}
		const headers: Record<string, string> = { accept: "text/event-stream" };
		if (session) headers.authorization = `Bearer ${session.accessToken}`;
		const res = await fetchImpl(url, { method: "GET", headers, signal: options.signal });
		if (res.status === 401 && session) {
			session = await this.refreshOrFail(session);
			headers.authorization = `Bearer ${session.accessToken}`;
			return await fetchImpl(url, { method: "GET", headers, signal: options.signal });
		}
		if (!res.ok) throw new ApiError(res.status, await res.text());
		return res;
	}

	private async refreshOrFail(session: StoredSession): Promise<StoredSession> {
		if (isRefreshTokenExpired(session)) {
			await this.opts.clearSession();
			throw new UnauthorizedError();
		}
		if (!this.refreshing) {
			this.refreshing = (async () => {
				try {
					const t = await this.opts.deviceFlow.refresh(session.refreshToken);
					const next: StoredSession = {
						...session,
						accessToken: t.access_token,
						refreshToken: t.refresh_token,
						expiresAt: Date.now() + t.expires_in * 1000,
						refreshExpiresAt: Date.now() + t.refresh_expires_in * 1000,
					};
					await this.opts.saveSession(next);
					return next;
				} catch (e) {
					await this.opts.clearSession();
					if (e instanceof DeviceFlowError) throw new UnauthorizedError();
					throw e;
				} finally {
					this.refreshing = null;
				}
			})();
		}
		return await this.refreshing;
	}

	private buildUrl(path: string, query?: RequestOptions["query"]): string {
		const base = this.opts.endpoint.replace(/\/$/, "");
		const qs = query
			? `?${Object.entries(query)
					.filter(([, v]) => v !== undefined)
					.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
					.join("&")}`
			: "";
		return `${base}${path}${qs}`;
	}

	private tryParse(text: string): unknown {
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}
}
