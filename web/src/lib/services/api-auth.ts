import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, extractClientIp, rateLimitHeaders } from "@/lib/rate-limit";
import { getSiteSetting } from "./settings";
import { validateAccessToken } from "./user-tokens";

export const API_KEY_SETTING_KEY = "admin_api_key";

const AUTH_FAIL_PER_MINUTE = 30;
const AUTH_FAIL_WINDOW_MS = 60_000;

async function authFailure(request: Request, message: string): Promise<NextResponse> {
	const ip = extractClientIp(request);
	const result = checkRateLimit(`user:auth_fail:${ip}`, AUTH_FAIL_PER_MINUTE, AUTH_FAIL_WINDOW_MS);
	if (!result.allowed) {
		const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
		return NextResponse.json(
			{ error: "Too many authentication failures" },
			{
				status: 429,
				headers: { "Retry-After": String(retryAfter), ...rateLimitHeaders(result) },
			}
		);
	}
	return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireApiKey(request: Request): Promise<NextResponse | null> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return NextResponse.json({ error: "Missing API key" }, { status: 401 });
	}

	const apiKey = authHeader.slice(7);
	const storedKey = await getSiteSetting(API_KEY_SETTING_KEY);

	if (!storedKey) {
		return NextResponse.json(
			{ error: "API key not configured. Set it in admin settings." },
			{ status: 503 }
		);
	}

	const apiKeyBuf = Buffer.from(apiKey, "utf-8");
	const storedKeyBuf = Buffer.from(storedKey, "utf-8");
	if (apiKeyBuf.length !== storedKeyBuf.length || !timingSafeEqual(apiKeyBuf, storedKeyBuf)) {
		return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
	}

	return null; // auth passed
}

export function jsonError(message: string, status: number = 400) {
	return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status: number = 200) {
	return NextResponse.json(data, { status });
}

export interface UserTokenAuth {
	userId: number;
	scopes: string[];
	tokenId: number;
}

/**
 * Bearer access token 검증. 통과 시 globalThis에 매달지 않고
 * 호출 측이 결과를 직접 사용하도록 별도 함수로 제공.
 *
 * dispatchApiRequest의 authenticate hook과 호환되는 형태로도 쓰기 위해
 * 검증 실패 시 NextResponse를, 통과 시 null을 반환하고
 * 통과한 userAuth 결과는 (request as any).__userAuth 로 첨부.
 *
 * 이는 단일 request 객체에서 endpoint handler가 userId를 받을 수 있게 하기 위함.
 */
export async function requireUserToken(request: Request): Promise<NextResponse | null> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return authFailure(request, "Missing access token");
	}
	const accessToken = authHeader.slice(7);
	const auth = await validateAccessToken(accessToken);
	if (!auth) {
		return authFailure(request, "Invalid or expired token");
	}
	// request에 attach — handler에서 getUserAuth(request)로 조회
	(request as Request & { __userAuth?: UserTokenAuth }).__userAuth = auth;
	return null;
}

export function getUserAuth(request: Request): UserTokenAuth {
	const auth = (request as Request & { __userAuth?: UserTokenAuth }).__userAuth;
	if (!auth) {
		throw new Error("getUserAuth called without prior requireUserToken pass");
	}
	return auth;
}
