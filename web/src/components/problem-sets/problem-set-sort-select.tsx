"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const options = [
	{ value: "likes", label: "좋아요순", requiresAuth: false },
	{ value: "recent", label: "최신순", requiresAuth: false },
	{ value: "problemCount", label: "문제 수 많은순", requiresAuth: false },
	{ value: "solvedRatio", label: "내가 푼 비율 높은순", requiresAuth: true },
];

export function ProblemSetSortSelect({ isLoggedIn }: { isLoggedIn: boolean }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const current = searchParams.get("sort") || "likes";

	const visible = options.filter((o) => !o.requiresAuth || isLoggedIn);

	const onChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		if (value === "likes") params.delete("sort");
		else params.set("sort", value);
		params.set("page", "1");
		router.push(`?${params.toString()}`);
	};

	return (
		<Select value={current} onValueChange={onChange}>
			<SelectTrigger className="w-44">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{visible.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
