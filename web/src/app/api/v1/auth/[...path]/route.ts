import { NextResponse } from "next/server";
import { checkRateLimit, extractClientIp, rateLimitHeaders } from "@/lib/rate-limit";
import { dispatchApiRequest } from "@/lib/services/api-router";
import { authEndpoints } from "@/lib/services/auth-api-registry";

const DEFAULT_PER_MINUTE = 30; // device flow는 폴링이라 좀 더 빡빡
const WINDOW_MS = 60_000;

type RouteParams = { params: Promise<{ path: string[] }> };

async function handle(request: Request, segments: string[]): Promise<Response> {
	return dispatchApiRequest(request, segments, {
		endpoints: authEndpoints,
		beforeDispatch: async (req, endpoint) => {
			const limit = endpoint.rateLimit?.perMinute ?? DEFAULT_PER_MINUTE;
			const ip = extractClientIp(req);
			const key = `auth:${ip}`;
			const result = checkRateLimit(key, limit, WINDOW_MS);
			const headers = rateLimitHeaders(result);
			if (!result.allowed) {
				const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
				return {
					response: NextResponse.json(
						{ error: "Rate limit exceeded" },
						{ status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
					),
				};
			}
			return { headers };
		},
	});
}

export async function POST(request: Request, { params }: RouteParams) {
	const { path } = await params;
	return handle(request, path);
}
