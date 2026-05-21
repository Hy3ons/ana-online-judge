import { describe, expect, it, vi } from "vitest";
import { DeviceFlow, DeviceFlowCanceled, DeviceFlowError } from "../../src/auth/deviceFlow";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function mockFetch(
	handlers: Array<(url: string, init?: FetchInit) => Response | Promise<Response>>
) {
	let i = 0;
	return vi.fn(async (url: FetchInput, init?: FetchInit) => {
		const h = handlers[Math.min(i, handlers.length - 1)];
		i++;
		return await h(String(url), init);
	});
}

const json = (status: number, body: unknown): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

describe("DeviceFlow.requestCode", () => {
	it("posts to /device/code and returns response", async () => {
		const fetchImpl = mockFetch([
			() =>
				json(200, {
					device_code: "DC",
					user_code: "ABCD-EFGH",
					verification_uri: "x/oauth/device",
					verification_uri_complete: "x/oauth/device?user_code=ABCD-EFGH",
					expires_in: 600,
					interval: 5,
				}),
		]);
		const df = new DeviceFlow({ endpoint: "https://x", fetchImpl: fetchImpl as never });
		const r = await df.requestCode();
		expect(r.device_code).toBe("DC");
		expect(r.user_code).toBe("ABCD-EFGH");
	});
});

describe("DeviceFlow.poll", () => {
	it("returns token after pending → success", async () => {
		const fetchImpl = mockFetch([
			() => json(200, { error: "authorization_pending" }),
			() => json(200, { error: "authorization_pending" }),
			() =>
				json(200, {
					access_token: "at",
					refresh_token: "rt",
					expires_in: 3600,
					refresh_expires_in: 2592000,
					token_type: "Bearer",
				}),
		]);
		const df = new DeviceFlow({
			endpoint: "https://x",
			fetchImpl: fetchImpl as never,
			sleepImpl: async () => {},
		});
		const tok = await df.poll("DC", 5);
		expect(tok.access_token).toBe("at");
	});

	it("increments interval on slow_down", async () => {
		let sleepCount = 0;
		const sleeps: number[] = [];
		const fetchImpl = mockFetch([
			() => json(200, { error: "slow_down" }),
			() =>
				json(200, {
					access_token: "at",
					refresh_token: "rt",
					expires_in: 3600,
					refresh_expires_in: 2592000,
					token_type: "Bearer",
				}),
		]);
		const df = new DeviceFlow({
			endpoint: "https://x",
			fetchImpl: fetchImpl as never,
			sleepImpl: async (ms) => {
				sleepCount++;
				sleeps.push(ms);
			},
		});
		await df.poll("DC", 5);
		expect(sleepCount).toBe(2);
		expect(sleeps[1]).toBe(sleeps[0] + 5000);
	});

	it("throws on access_denied", async () => {
		const fetchImpl = mockFetch([() => json(200, { error: "access_denied" })]);
		const df = new DeviceFlow({
			endpoint: "https://x",
			fetchImpl: fetchImpl as never,
			sleepImpl: async () => {},
		});
		await expect(df.poll("DC", 5)).rejects.toThrow(DeviceFlowError);
	});

	it("respects abort signal", async () => {
		const ctrl = new AbortController();
		const fetchImpl = mockFetch([() => json(200, { error: "authorization_pending" })]);
		const df = new DeviceFlow({
			endpoint: "https://x",
			fetchImpl: fetchImpl as never,
			sleepImpl: async () => {
				ctrl.abort();
			},
		});
		await expect(df.poll("DC", 5, { signal: ctrl.signal })).rejects.toThrow(DeviceFlowCanceled);
	});
});

describe("DeviceFlow.refresh", () => {
	it("returns a new token pair", async () => {
		const fetchImpl = mockFetch([
			() =>
				json(200, {
					access_token: "at2",
					refresh_token: "rt2",
					expires_in: 3600,
					refresh_expires_in: 2592000,
					token_type: "Bearer",
				}),
		]);
		const df = new DeviceFlow({ endpoint: "https://x", fetchImpl: fetchImpl as never });
		const t = await df.refresh("rt");
		expect(t.access_token).toBe("at2");
	});

	it("throws DeviceFlowError(invalid_grant) on 200+error body", async () => {
		const fetchImpl = mockFetch([() => json(200, { error: "invalid_grant" })]);
		const df = new DeviceFlow({ endpoint: "https://x", fetchImpl: fetchImpl as never });
		await expect(df.refresh("bad")).rejects.toThrow(/invalid_grant/);
	});
});
