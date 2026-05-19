import "server-only";
import { z } from "zod";
import {
	consumeDeviceAuth,
	createDeviceAuth,
	DEVICE_CODE_TTL_SECONDS,
	getDeviceAuth,
	getDeviceAuthByUserCode,
	POLL_MIN_INTERVAL_SECONDS,
	recordPoll,
} from "@/lib/auth/device-auth-store";
import { generateDeviceCode, generateUserCode } from "@/lib/auth/token-utils";
import { publicEnv } from "@/lib/env";
import type { Endpoint } from "./api-types";
import { issueTokenPair, revokeToken, rotateRefreshToken } from "./user-tokens";

const PUBLIC_BASE_URL = publicEnv.NEXT_PUBLIC_APP_URL;

export const authEndpoints: Endpoint[] = [
	{
		type: "json",
		method: "POST",
		path: "device/code",
		description: "RFC 8628 device authorization code 발급",
		body: z.object({}).passthrough(),
		handler: async () => {
			// user_code 충돌 방지: 최대 5번 retry
			// (충돌 가능성은 32^8 ≈ 10^12 중 1로 사실상 0이지만 방어적으로 체크)
			let deviceCode = "";
			let userCode = "";
			for (let i = 0; i < 5; i++) {
				const candidate = generateUserCode();
				const existing = await getDeviceAuthByUserCode(candidate);
				if (!existing) {
					deviceCode = generateDeviceCode();
					userCode = candidate;
					break;
				}
			}
			if (!deviceCode) {
				throw new Error("Failed to generate unique user_code");
			}
			await createDeviceAuth(deviceCode, userCode);
			return {
				device_code: deviceCode,
				user_code: userCode,
				verification_uri: `${PUBLIC_BASE_URL}/oauth/device`,
				verification_uri_complete: `${PUBLIC_BASE_URL}/oauth/device?user_code=${encodeURIComponent(userCode)}`,
				expires_in: DEVICE_CODE_TTL_SECONDS,
				interval: POLL_MIN_INTERVAL_SECONDS,
			};
		},
	},
	{
		type: "json",
		method: "POST",
		path: "device/token",
		description: "RFC 8628 polling — 사용자 승인 완료 시 토큰 발급",
		body: z.object({
			device_code: z.string().min(1),
			grant_type: z.literal("urn:ietf:params:oauth:grant-type:device_code"),
		}),
		handler: async ({ body }) => {
			const { device_code: deviceCode } = body as { device_code: string };
			const tooFast = !(await recordPoll(deviceCode));
			if (tooFast) {
				return { error: "slow_down" };
			}
			const record = await getDeviceAuth(deviceCode);
			if (!record) {
				return { error: "expired_token" };
			}
			if (record.status === "pending") {
				return { error: "authorization_pending" };
			}
			if (record.status === "denied") {
				await consumeDeviceAuth(deviceCode);
				return { error: "access_denied" };
			}
			if (record.status === "approved" && record.userId) {
				const pair = await issueTokenPair({
					userId: record.userId,
					type: "oauth_device",
					label: "VS Code Extension",
				});
				await consumeDeviceAuth(deviceCode);
				return {
					access_token: pair.accessToken,
					refresh_token: pair.refreshToken,
					token_type: "Bearer",
					expires_in: pair.accessExpiresIn,
					refresh_expires_in: pair.refreshExpiresIn,
				};
			}
			return { error: "expired_token" };
		},
	},
	{
		type: "json",
		method: "POST",
		path: "token/refresh",
		description: "Refresh token으로 새 토큰 쌍 발급 (rotation)",
		body: z.object({
			refresh_token: z.string().min(1),
		}),
		handler: async ({ body }) => {
			const { refresh_token: refreshToken } = body as { refresh_token: string };
			const pair = await rotateRefreshToken(refreshToken);
			if (!pair) {
				return { error: "invalid_grant" };
			}
			return {
				access_token: pair.accessToken,
				refresh_token: pair.refreshToken,
				token_type: "Bearer",
				expires_in: pair.accessExpiresIn,
				refresh_expires_in: pair.refreshExpiresIn,
			};
		},
	},
	{
		type: "json",
		method: "POST",
		path: "token/revoke",
		description: "Access token 무효화",
		body: z.object({
			token: z.string().min(1),
		}),
		handler: async ({ body }) => {
			const { token } = body as { token: string };
			await revokeToken(token); // ignore return — RFC 7009: response identical regardless
			return { revoked: true };
		},
	},
];
