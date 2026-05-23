"use client";

import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	const router = useRouter();

	const handleBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push("/");
		}
	};

	return (
		<div className="page-container py-20 sm:py-28">
			<div className="flex max-w-xl flex-col items-start gap-6">
				<div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
					Error · Not Found
				</div>
				<div className="font-mulmaru text-7xl font-extrabold leading-none tracking-tight text-primary sm:text-8xl">
					<span className="text-[#02CDB7]">4</span>
					<span className="text-[#EA4C5A]">0</span>
					<span className="text-[#455D8D]">4</span>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
					<p className="text-sm text-muted-foreground">
						요청하신 페이지가 존재하지 않거나, 이동되었거나 삭제되었을 수 있습니다.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Button onClick={handleBack} variant="outline">
						<ArrowLeft className="h-4 w-4" />
						이전 페이지로
					</Button>
					<Link href="/">
						<Button>
							<Home className="h-4 w-4" />
							홈으로
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
