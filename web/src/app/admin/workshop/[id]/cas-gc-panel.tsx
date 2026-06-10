"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { CasGcReturn } from "@/actions/admin/workshop";
import { runWorkshopCasGc } from "@/actions/admin/workshop";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
	workshopProblemId: number;
};

export function CasGcPanel({ workshopProblemId }: Props) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [dryRunResult, setDryRunResult] = useState<CasGcReturn | null>(null);
	const [deleteResult, setDeleteResult] = useState<CasGcReturn | null>(null);

	const handleDryRun = () => {
		setError(null);
		setDryRunResult(null);
		setDeleteResult(null);
		startTransition(async () => {
			try {
				const r = await runWorkshopCasGc(workshopProblemId, true);
				setDryRunResult(r);
			} catch (e) {
				setError(e instanceof Error ? e.message : String(e));
			}
		});
	};

	const handleDelete = () => {
		setError(null);
		setDeleteResult(null);
		startTransition(async () => {
			try {
				const r = await runWorkshopCasGc(workshopProblemId, false);
				setDeleteResult(r);
				setDryRunResult(null);
			} catch (e) {
				setError(e instanceof Error ? e.message : String(e));
			}
		});
	};

	return (
		<div className="space-y-4">
			{error && (
				<div className="rounded-[2px] border border-border border-l-4 border-l-destructive p-3 text-sm text-foreground">
					{error}
				</div>
			)}

			{dryRunResult && (
				<div className="rounded-[2px] border border-border p-3 space-y-1 text-sm">
					<p>
						<span className="text-muted-foreground">전체 객체:</span>{" "}
						<span className="font-mono">{dryRunResult.total}</span>
					</p>
					<p>
						<span className="text-muted-foreground">참조됨:</span>{" "}
						<span className="font-mono">{dryRunResult.referenced}</span>
					</p>
					<p>
						<span className="text-muted-foreground">미참조(고아):</span>{" "}
						<span className="font-mono font-semibold">{dryRunResult.orphans.length}</span>
					</p>
					{dryRunResult.orphans.length > 0 && (
						<details className="mt-2">
							<summary className="cursor-pointer text-xs text-muted-foreground select-none">
								고아 객체 목록 ({dryRunResult.orphans.length}개)
							</summary>
							<ul className="mt-1 space-y-0.5 font-mono text-xs text-muted-foreground break-all">
								{dryRunResult.orphans.map((key) => (
									<li key={key}>{key}</li>
								))}
							</ul>
						</details>
					)}
				</div>
			)}

			{deleteResult && (
				<div className="rounded-[2px] border border-border border-l-4 border-l-accent p-3 text-sm text-foreground">
					삭제 완료: <span className="font-mono font-semibold">{deleteResult.deleted}</span>개 객체
					삭제됨.
				</div>
			)}

			<div className="flex gap-2">
				<Button variant="outline" onClick={handleDryRun} disabled={isPending}>
					미참조 객체 검사 (dry-run)
				</Button>

				{dryRunResult && dryRunResult.orphans.length > 0 && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" disabled={isPending}>
								<Trash2 className="h-4 w-4 mr-2" />
								삭제 ({dryRunResult.orphans.length}개)
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>미참조 객체를 삭제하시겠습니까?</AlertDialogTitle>
								<AlertDialogDescription>
									어떤 스냅샷에도 참조되지 않은 CAS 객체{" "}
									<span className="font-semibold">{dryRunResult.orphans.length}개</span>를 영구
									삭제합니다. 이 작업은 되돌릴 수 없습니다.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>취소</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									삭제
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>
		</div>
	);
}
