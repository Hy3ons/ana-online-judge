import { NextResponse } from "next/server";
import type { Endpoint } from "./api-types";
import { NotFoundError } from "./api-types";

function matchPath(pattern: string, segments: string[]): Record<string, string> | null {
	const parts = pattern.split("/");
	if (parts.length !== segments.length) return null;

	const params: Record<string, string> = {};
	for (let i = 0; i < parts.length; i++) {
		if (parts[i].startsWith(":")) {
			params[parts[i].slice(1)] = segments[i];
		} else if (parts[i] !== segments[i]) {
			return null;
		}
	}
	return params;
}

function parseSearchParams(url: string): Record<string, string> {
	const { searchParams } = new URL(url);
	const result: Record<string, string> = {};
	searchParams.forEach((value, key) => {
		result[key] = value;
	});
	return result;
}

function findEndpoint(
	endpoints: Endpoint[],
	method: string,
	segments: string[]
): { endpoint: Endpoint; pathParams: Record<string, string> } | null {
	for (const endpoint of endpoints) {
		if (endpoint.method !== method) continue;
		const pathParams = matchPath(endpoint.path, segments);
		if (pathParams) return { endpoint, pathParams };
	}
	return null;
}

export interface ApiHandlerOptions {
	endpoints: Endpoint[];
	authenticate?: (request: Request) => Promise<Response | null>;
	beforeDispatch?: (
		request: Request,
		endpoint: Endpoint
	) => Promise<{ response?: Response; headers?: Record<string, string> } | null>;
}

export async function dispatchApiRequest(
	request: Request,
	segments: string[],
	options: ApiHandlerOptions
): Promise<Response> {
	if (options.authenticate) {
		const authErr = await options.authenticate(request);
		if (authErr) return authErr;
	}

	const method = request.method;
	const match = findEndpoint(options.endpoints, method, segments);

	if (!match) {
		return NextResponse.json(
			{ error: `No endpoint found: ${method} ${segments.join("/")}` },
			{ status: 404 }
		);
	}

	const { endpoint, pathParams } = match;

	let extraHeaders: Record<string, string> | undefined;
	if (options.beforeDispatch) {
		const hook = await options.beforeDispatch(request, endpoint);
		if (hook?.response) return hook.response;
		if (hook?.headers) extraHeaders = hook.headers;
	}

	try {
		let response: Response;

		if (endpoint.type === "custom") {
			response = await endpoint.handler(request, pathParams);
		} else {
			const rawQuery = parseSearchParams(request.url);
			const query = endpoint.query ? endpoint.query.parse(rawQuery) : {};

			let body = {};
			if ((method === "POST" || method === "PUT") && endpoint.body) {
				const rawBody = await request.json().catch(() => ({}));
				body = endpoint.body.parse(rawBody);
			}

			const result = await endpoint.handler({ request, pathParams, query, body });
			response = NextResponse.json(result);
		}

		if (extraHeaders) {
			return mergeResponseHeaders(response, extraHeaders);
		}
		return response;
	} catch (error) {
		if (error instanceof NotFoundError) {
			return NextResponse.json({ error: error.message }, { status: 404 });
		}
		if (error && typeof error === "object" && "issues" in error) {
			return NextResponse.json(
				{ error: "Validation error", details: (error as { issues: unknown }).issues },
				{ status: 400 }
			);
		}
		const message = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

function mergeResponseHeaders(response: Response, extra: Record<string, string>): Response {
	try {
		for (const [k, v] of Object.entries(extra)) {
			response.headers.set(k, v);
		}
		return response;
	} catch {
		// Headers are immutable (e.g., cloned from fetch). Rebuild the response.
		const headers = new Headers(response.headers);
		for (const [k, v] of Object.entries(extra)) {
			headers.set(k, v);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}
}

/** Backwards-compat wrapper used by admin route. */
export async function handleApiRequest(request: Request, segments: string[]): Promise<Response> {
	const { endpoints } = await import("./api-registry");
	const { requireApiKey } = await import("./api-auth");
	return dispatchApiRequest(request, segments, {
		endpoints,
		authenticate: requireApiKey,
	});
}
