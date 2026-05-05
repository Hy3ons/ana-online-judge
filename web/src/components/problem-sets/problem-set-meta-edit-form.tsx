"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProblemSetAction } from "@/actions/problem-sets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROBLEM_SET_DESCRIPTION_MAX, PROBLEM_SET_TITLE_MAX } from "@/lib/problem-set-constants";

export function ProblemSetMetaEditForm({
	id,
	initialTitle,
	initialDescription,
}: {
	id: number;
	initialTitle: string;
	initialDescription: string;
}) {
	const router = useRouter();
	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription);
	const [pending, startTransition] = useTransition();
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSave = () =>
		startTransition(async () => {
			setSaved(false);
			setError(null);
			try {
				await updateProblemSetAction(id, { title, description });
				router.refresh();
				setSaved(true);
			} catch (err) {
				setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
			}
		});

	return (
		<div className="space-y-4 rounded-md border p-4">
			<div className="space-y-2">
				<Label htmlFor="title">제목</Label>
				<Input
					id="title"
					value={title}
					maxLength={PROBLEM_SET_TITLE_MAX}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<p className="text-xs text-muted-foreground tabular-nums">
					{title.length} / {PROBLEM_SET_TITLE_MAX}
				</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">설명 (마크다운)</Label>
				<Textarea
					id="description"
					value={description}
					maxLength={PROBLEM_SET_DESCRIPTION_MAX}
					onChange={(e) => setDescription(e.target.value)}
					rows={5}
				/>
				<p className="text-xs text-muted-foreground tabular-nums">
					{description.length} / {PROBLEM_SET_DESCRIPTION_MAX}
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Button onClick={onSave} disabled={pending}>
					저장
				</Button>
				{saved && <span className="text-sm text-emerald-600">저장됨</span>}
				{error && <span className="text-sm text-destructive">{error}</span>}
			</div>
		</div>
	);
}
