"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
	createProblemSetAction,
	replaceItemsAction,
	updateProblemSetAction,
} from "@/actions/problem-sets";
import {
	type PickerProblem,
	ProblemPickerDialog,
} from "@/components/practices/problem-picker-dialog";
import { ProblemTitleCell } from "@/components/problems/problem-title-cell";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROBLEM_SET_DESCRIPTION_MAX, PROBLEM_SET_TITLE_MAX } from "@/lib/problem-set-constants";

// TODO: drag-and-drop reorder (cf. practice-form pattern; intentional parity).
// Order is currently insertion order; remove + re-add to rearrange, matching practice-form.

type Props =
	| { mode: "create" }
	| {
			mode: "edit";
			initial: {
				id: number;
				title: string;
				description: string | null;
				problems: PickerProblem[];
			};
	  };

export function ProblemSetForm(props: Props) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const initialTitle = props.mode === "edit" ? props.initial.title : "";
	const initialDescription = props.mode === "edit" ? (props.initial.description ?? "") : "";
	const initialProblems = props.mode === "edit" ? props.initial.problems : [];

	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription);
	const [selectedProblems, setSelectedProblems] = useState<PickerProblem[]>(initialProblems);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const captchaRef = useRef<TurnstileWidgetHandle>(null);

	function removeProblem(id: number) {
		setSelectedProblems((prev) => prev.filter((p) => p.id !== id));
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!title.trim()) {
			setError("제목을 입력해주세요.");
			return;
		}
		if (props.mode === "create" && !captchaToken) {
			setError("CAPTCHA 검증을 완료해주세요.");
			return;
		}

		if (props.mode === "create") {
			const token = captchaToken as string;
			startTransition(async () => {
				try {
					const created = await createProblemSetAction(
						{
							title,
							description: description.trim() || undefined,
							problemIds: selectedProblems.map((p) => p.id),
						},
						token
					);
					router.push(`/problemsets/${created.id}`);
				} catch (err) {
					captchaRef.current?.reset();
					setCaptchaToken(null);
					setError(err instanceof Error ? err.message : "문제집 생성 중 오류가 발생했습니다.");
				}
			});
			return;
		}

		// edit mode
		const editProps = props;
		startTransition(async () => {
			try {
				await updateProblemSetAction(editProps.initial.id, {
					title,
					description: description.trim() || undefined,
				});

				const initialIds = editProps.initial.problems.map((p) => p.id);
				const currentIds = selectedProblems.map((p) => p.id);
				const changed =
					initialIds.length !== currentIds.length ||
					initialIds.some((id, idx) => id !== currentIds[idx]);
				if (changed) {
					await replaceItemsAction(editProps.initial.id, currentIds);
				}

				router.push(`/problemsets/${editProps.initial.id}`);
			} catch (err) {
				setError(err instanceof Error ? err.message : "문제집 수정 중 오류가 발생했습니다.");
			}
		});
	}

	const cancelHref = props.mode === "create" ? "/problemsets" : `/problemsets/${props.initial.id}`;
	const submitDisabled = pending || !title.trim() || (props.mode === "create" && !captchaToken);
	const submitLabel = props.mode === "create" ? "생성" : "저장";
	const submitPendingLabel = props.mode === "create" ? "생성 중..." : "저장 중...";

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			{error && (
				<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
					{error}
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="title">제목 *</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					maxLength={PROBLEM_SET_TITLE_MAX}
					placeholder="문제집 제목"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">설명 (마크다운, 선택)</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					maxLength={PROBLEM_SET_DESCRIPTION_MAX}
				/>
				<p className="text-xs text-muted-foreground tabular-nums">
					{description.length} / {PROBLEM_SET_DESCRIPTION_MAX}
				</p>
			</div>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>문제 ({selectedProblems.length})</Label>
					<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						문제 추가
					</Button>
				</div>
				{selectedProblems.length === 0 ? (
					<div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
						아직 선택된 문제가 없습니다. "문제 추가"를 눌러 문제를 검색하고 선택하세요.
					</div>
				) : (
					<div className="rounded-md border divide-y">
						{selectedProblems.map((p, idx) => (
							<div key={p.id} className="flex items-center gap-2 px-3 py-2">
								<span className="font-mono text-xs text-muted-foreground w-6">
									{String.fromCharCode(65 + (idx % 26))}
								</span>
								<span className="font-mono text-xs text-muted-foreground w-12">{p.id}</span>
								<div className="flex-1 min-w-0">
									<ProblemTitleCell
										title={p.title}
										problemType={p.problemType}
										judgeAvailable={p.judgeAvailable}
										languageRestricted={p.languageRestricted}
										hasSubtasks={p.hasSubtasks}
										useFullJudge={p.useFullJudge}
										isPublic={p.isPublic}
										tier={p.tier}
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => removeProblem(p.id)}
									aria-label="제거"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
			{props.mode === "create" && (
				<div className="flex justify-center pt-1">
					<TurnstileWidget
						ref={captchaRef}
						onVerify={(token) => setCaptchaToken(token)}
						onExpire={() => setCaptchaToken(null)}
						onError={() => setCaptchaToken(null)}
					/>
				</div>
			)}
			<div className="flex justify-end gap-2">
				<Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
					취소
				</Button>
				<Button type="submit" disabled={submitDisabled}>
					{pending ? submitPendingLabel : submitLabel}
				</Button>
			</div>

			<ProblemPickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode="multi"
				excludeIds={selectedProblems.map((p) => p.id)}
				onConfirm={(picked) => {
					setSelectedProblems((prev) => [...prev, ...picked]);
				}}
				confirmLabel="추가"
			/>
		</form>
	);
}
