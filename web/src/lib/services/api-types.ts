import type { z } from "zod";

export interface HandlerContext {
	request: Request;
	pathParams: Record<string, string>;
	query: Record<string, unknown>;
	body: Record<string, unknown>;
}

export interface JsonEndpoint {
	type: "json";
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	description: string;
	query?: z.ZodObject<z.ZodRawShape>;
	body?: z.ZodObject<z.ZodRawShape>;
	handler: (ctx: HandlerContext) => Promise<unknown>;
	rateLimit?: { perMinute: number };
}

export interface CustomEndpoint {
	type: "custom";
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	description: string;
	handler: (request: Request, pathParams: Record<string, string>) => Promise<Response>;
	rateLimit?: { perMinute: number };
}

export type Endpoint = JsonEndpoint | CustomEndpoint;

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}

export class ForbiddenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ForbiddenError";
	}
}
