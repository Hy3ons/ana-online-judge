"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function ProblemSetSearchInput() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(searchParams.get("q") ?? "");

	// biome-ignore lint/correctness/useExhaustiveDependencies: debounce only on value change
	useEffect(() => {
		const handle = setTimeout(() => {
			const params = new URLSearchParams(searchParams);
			const trimmed = value.trim();
			if (trimmed) params.set("q", trimmed);
			else params.delete("q");
			params.set("page", "1");
			router.push(`?${params.toString()}`);
		}, 350);
		return () => clearTimeout(handle);
	}, [value]);

	return (
		<Input
			value={value}
			onChange={(e) => setValue(e.target.value)}
			placeholder="제목·설명 검색"
			className="max-w-xs"
		/>
	);
}
