export interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete: string;
	expires_in: number; // seconds
	interval: number; // seconds
}

export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	refresh_expires_in: number;
	token_type: "Bearer";
}

export type DeviceTokenError =
	| "authorization_pending"
	| "slow_down"
	| "expired_token"
	| "access_denied";

export interface DeviceFlowAbort {
	/** Aborts the poll. Resolved deviceFlow.poll() throws DeviceFlowCanceled. */
	signal: AbortSignal;
}

export class DeviceFlowCanceled extends Error {
	constructor() {
		super("Device flow canceled");
		this.name = "DeviceFlowCanceled";
	}
}

export class DeviceFlowError extends Error {
	constructor(public readonly code: DeviceTokenError | "invalid_grant" | "network" | "server") {
		super(`Device flow error: ${code}`);
		this.name = "DeviceFlowError";
	}
}

export interface DeviceFlowOptions {
	endpoint: string; // e.g. https://aoj.anacnu.kr
	fetchImpl?: typeof fetch;
	sleepImpl?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class DeviceFlow {
	private readonly fetch: typeof fetch;
	private readonly sleep: (ms: number) => Promise<void>;

	constructor(private readonly opts: DeviceFlowOptions) {
		this.fetch = opts.fetchImpl ?? fetch;
		this.sleep = opts.sleepImpl ?? defaultSleep;
	}

	async requestCode(): Promise<DeviceCodeResponse> {
		const res = await this.fetch(`${this.opts.endpoint}/api/v1/auth/device/code`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
		});
		if (!res.ok) {
			throw new DeviceFlowError("server");
		}
		return (await res.json()) as DeviceCodeResponse;
	}

	/**
	 * Polls token endpoint until success/access_denied/expired_token or abort.
	 */
	async poll(
		deviceCode: string,
		intervalSec: number,
		abort?: DeviceFlowAbort
	): Promise<TokenResponse> {
		let interval = Math.max(1, intervalSec) * 1000;
		for (;;) {
			if (abort?.signal.aborted) throw new DeviceFlowCanceled();
			await this.sleep(interval);
			if (abort?.signal.aborted) throw new DeviceFlowCanceled();

			const res = await this.fetch(`${this.opts.endpoint}/api/v1/auth/device/token`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					device_code: deviceCode,
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				}),
			});
			const body = (await res.json().catch(() => ({}))) as
				| TokenResponse
				| { error: DeviceTokenError };

			if (res.ok && "access_token" in body) return body;
			if ("error" in body) {
				if (body.error === "authorization_pending") continue;
				if (body.error === "slow_down") {
					interval += 5_000;
					continue;
				}
				throw new DeviceFlowError(body.error);
			}
			throw new DeviceFlowError("server");
		}
	}

	async refresh(refreshToken: string): Promise<TokenResponse> {
		const res = await this.fetch(`${this.opts.endpoint}/api/v1/auth/token/refresh`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ refresh_token: refreshToken }),
		});
		if (!res.ok) throw new DeviceFlowError("server");
		const body = (await res.json().catch(() => ({}))) as TokenResponse | { error: "invalid_grant" };
		if ("error" in body) {
			throw new DeviceFlowError(body.error);
		}
		if (!("access_token" in body)) {
			throw new DeviceFlowError("server");
		}
		return body;
	}

	async revoke(accessToken: string): Promise<void> {
		await this.fetch(`${this.opts.endpoint}/api/v1/auth/token/revoke`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ token: accessToken }),
		});
	}
}
