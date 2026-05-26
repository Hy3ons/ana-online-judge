import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
	const session = await auth();
	const { pathname } = request.nextUrl;

	// Add pathname to headers for use in layouts
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-pathname", pathname);

	// If user is not logged in, allow normal flow
	if (!session?.user) {
		return NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		});
	}

	// Force password reset if flagged
	if (session.user.mustChangePassword) {
		const allowed = ["/reset-password", "/logout", "/api/auth"];
		const isAllowed = allowed.some((p) => pathname.startsWith(p));
		if (!isAllowed) {
			return NextResponse.redirect(new URL("/reset-password", request.url));
		}
		return NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		});
	}

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
	// 대회 계정 라우팅 제거됨 (임시)
}

// Configure which routes to run proxy on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files
		 */
		"/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
	],
};
