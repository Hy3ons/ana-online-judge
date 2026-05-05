"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { addProblemAction } from "@/actions/problem-sets";
import {
	type PickerProblem,
	ProblemPickerDialog,
} from "@/components/practices/problem-picker-dialog";
import { Button } from "@/components/ui/button";

export function ProblemSetAddProblemButton({
	problemSetId,
	excludeIds,
}: {
	problemSetId: number;
	excludeIds: number[];
}) {
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const onConfirm = (selected: PickerProblem[]) =>
		new Promise<void>((resolve) => {
			startTransition(async () => {
				try {
					for (const p of selected) {
						await addProblemAction(problemSetId, p.id);
					}
				} finally {
					resolve();
				}
			});
		});

	return (
		<>
			<Button size="sm" onClick={() => setOpen(true)} disabled={pending}>
				<Plus className="size-4" /> 문제 추가
			</Button>
			<ProblemPickerDialog
				open={open}
				onOpenChange={setOpen}
				mode="multi"
				excludeIds={excludeIds}
				onConfirm={onConfirm}
				confirmLabel="추가"
				title="문제 추가"
				description="문제집에 추가할 문제를 선택하세요. 이미 추가된 문제는 회색 처리됩니다."
			/>
		</>
	);
}
