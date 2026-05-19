import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getUserAuth, requireUserToken } from "@/lib/services/api-auth";
import { dispatchApiRequest } from "@/lib/services/api-router";
import { userEndpoints } from "@/lib/services/user-api-registry";

const DEFAULT_PER_MINUTE = 120;
const WINDOW_MS = 60_000;

type RouteParams = { params: Promise<{ path: string[] }> };

async function handle(request: Request, segments: string[]): Promise<Response> {
	return dispatchApiRequest(request, segments, {
		endpoints: userEndpoints,
		authenticate: requireUserToken,
		beforeDispatch: async (req, endpoint) => {
			const limit = endpoint.rateLimit?.perMinute ?? DEFAULT_PER_MINUTE;
			// authenticate (requireUserToken) has already run — __userAuth is attached
			const auth = getUserAuth(req);
			const result = checkRateLimit(`user:token:${auth.tokenId}`, limit, WINDOW_MS);
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

export async function GET(request: Request, { params }: RouteParams) {
	const { path } = await params;
	return handle(request, path);
}

export async function POST(request: Request, { params }: RouteParams) {
	const { path } = await params;
	return handle(request, path);
}
