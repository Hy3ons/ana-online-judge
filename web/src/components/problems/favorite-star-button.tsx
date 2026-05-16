"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleProblemFavorite } from "@/actions/problem-favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteStarButton({
	problemId,
	initialFavorited,
	isLoggedIn,
}: {
	problemId: number;
	initialFavorited: boolean;
	isLoggedIn: boolean;
}) {
	const router = useRouter();
	const [favorited, setFavorited] = useState(initialFavorited);
	const [pending, startTransition] = useTransition();

	const onClick = () => {
		if (!isLoggedIn) {
			router.push(`/login?redirectTo=/problems/${problemId}`);
			return;
		}
		const next = !favorited;
		setFavorited(next);
		startTransition(async () => {
			try {
				const r = await toggleProblemFavorite(problemId);
				setFavorited(r.favorited);
			} catch {
				setFavorited(!next);
			}
		});
	};

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={onClick}
			disabled={pending}
			aria-label={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
			aria-pressed={favorited}
			title={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
		>
			<Star
				className={cn(
					"size-5 transition-colors",
					favorited ? "fill-accent stroke-accent" : "stroke-muted-foreground"
				)}
			/>
		</Button>
	);
}
