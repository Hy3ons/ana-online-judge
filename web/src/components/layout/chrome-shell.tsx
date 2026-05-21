"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ChromeShellProps {
	children: ReactNode;
	header: ReactNode;
	footer: ReactNode;
	floater: ReactNode;
}

function isScoreboardPath(pathname: string | null): boolean {
	if (!pathname) return false;
	return pathname.includes("/scoreboard") || pathname === "/test-scoreboard";
}

export function ChromeShell({ children, header, footer, floater }: ChromeShellProps) {
	const pathname = usePathname();
	const hideChrome = isScoreboardPath(pathname);

	return (
		<>
			{!hideChrome && header}
			<main className="flex-1">{children}</main>
			{!hideChrome && footer}
			{!hideChrome && floater}
		</>
	);
}
