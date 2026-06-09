"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateWorkshopProblemType } from "@/actions/workshop/problems";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function WorkshopProblemTypeEditor({
	problemId,
	problemType: initialProblemType,
	hasChecker,
}: {
	problemId: number;
	problemType: "icpc" | "special_judge";
	hasChecker: boolean;
}) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [problemType, setProblemType] = useState<"icpc" | "special_judge">(initialProblemType);

	const dirty = problemType !== initialProblemType;
	const showCheckerHint = problemType === "special_judge" && !hasChecker;

	function onSave() {
		startTransition(async () => {
			try {
				await updateWorkshopProblemType(problemId, problemType);
				toast.success("문제 형식이 저장되었습니다");
				router.refresh();
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "저장에 실패했습니다");
			}
		});
	}

	function onReset() {
		setProblemType(initialProblemType);
	}

	return (
		<div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
			<div className="space-y-1">
				<Label htmlFor="ws-problem-type" className="text-xs">
					문제 형식
				</Label>
				<Select
					value={problemType}
					onValueChange={(v) => setProblemType(v as "icpc" | "special_judge")}
					disabled={pending}
				>
					<SelectTrigger id="ws-problem-type" className="h-8 w-64">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="icpc">ICPC (표준 입출력 비교)</SelectItem>
						<SelectItem value="special_judge">스페셜 저지 (커스텀 체커)</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{showCheckerHint && (
				<p className="text-xs text-muted-foreground">
					스페셜 저지는 커스텀 체커가 필요합니다 — 체커 탭에서 작성하세요.
				</p>
			)}
			<div className="ml-auto flex items-center gap-2">
				{dirty && (
					<Button variant="ghost" size="sm" onClick={onReset} disabled={pending}>
						되돌리기
					</Button>
				)}
				<Button size="sm" onClick={onSave} disabled={!dirty || pending}>
					{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
				</Button>
			</div>
		</div>
	);
}
