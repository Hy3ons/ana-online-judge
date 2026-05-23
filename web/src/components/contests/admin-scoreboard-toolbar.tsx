"use client";

import { Snowflake, Trophy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AdminScoreboardToolbarProps {
	isAwardMode: boolean;
	viewAsParticipant: boolean;
}

export function AdminScoreboardToolbar({
	isAwardMode,
	viewAsParticipant,
}: AdminScoreboardToolbarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const toggleParam = (key: string, currentlyOn: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (currentlyOn) {
			params.delete(key);
		} else {
			params.set(key, "true");
		}
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname);
	};

	return (
		<TooltipProvider delayDuration={200}>
			<div className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-md border border-border bg-background/80 px-1 py-1 shadow-sm backdrop-blur">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => toggleParam("frozen", viewAsParticipant)}
							className={cn("size-7", viewAsParticipant && "bg-accent text-accent-foreground")}
							aria-pressed={viewAsParticipant}
							aria-label="프리징 보기 전환"
						>
							<Snowflake className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{viewAsParticipant
							? "프리징 보기 끄기 (운영진 시점)"
							: "프리징 보기 켜기 (참가자 시점)"}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => toggleParam("award", isAwardMode)}
							className={cn("size-7", isAwardMode && "bg-accent text-accent-foreground")}
							aria-pressed={isAwardMode}
							aria-label="시상 모드 전환"
						>
							<Trophy className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{isAwardMode ? "시상 모드 끄기" : "시상 모드 켜기"}
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
