"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleLikeAction } from "@/actions/problem-sets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({
	problemSetId,
	initialLiked,
	initialCount,
	disabled,
}: {
	problemSetId: number;
	initialLiked: boolean;
	initialCount: number;
	disabled?: boolean;
}) {
	const router = useRouter();
	const [liked, setLiked] = useState(initialLiked);
	const [count, setCount] = useState(initialCount);
	const [pending, startTransition] = useTransition();

	const onClick = () => {
		if (disabled) {
			router.push(`/login?redirectTo=/problemsets/${problemSetId}`);
			return;
		}
		const optimisticLiked = !liked;
		const prevLiked = liked;
		const prevCount = count;
		setLiked(optimisticLiked);
		setCount((c) => c + (optimisticLiked ? 1 : -1));
		startTransition(async () => {
			try {
				const r = await toggleLikeAction(problemSetId);
				setLiked(r.liked);
				setCount(r.likeCount);
			} catch {
				setLiked(prevLiked);
				setCount(prevCount);
			}
		});
	};

	return (
		<Button
			type="button"
			variant={liked ? "default" : "outline"}
			size="sm"
			onClick={onClick}
			disabled={pending}
			className="gap-1.5"
		>
			<Heart className={cn("size-4", liked && "fill-current")} />
			<span className="tabular-nums">{count}</span>
		</Button>
	);
}
