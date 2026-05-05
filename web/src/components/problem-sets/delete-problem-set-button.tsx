"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProblemSetAction } from "@/actions/problem-sets";
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

export function DeleteProblemSetButton({ problemSetId }: { problemSetId: number }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const onConfirm = () =>
		startTransition(async () => {
			await deleteProblemSetAction(problemSetId);
			router.push("/problemsets");
		});

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline" size="sm" className="text-destructive">
					<Trash2 className="size-4" /> 삭제
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>문제집을 삭제하시겠습니까?</AlertDialogTitle>
					<AlertDialogDescription>
						이 작업은 되돌릴 수 없습니다. 문제집과 좋아요 기록이 모두 삭제됩니다.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>취소</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={pending}>
						삭제
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
