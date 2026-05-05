"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createProblemSetAction } from "@/actions/problem-sets";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROBLEM_SET_DESCRIPTION_MAX, PROBLEM_SET_TITLE_MAX } from "@/lib/problem-set-constants";

export function ProblemSetCreateForm() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const captchaRef = useRef<TurnstileWidgetHandle>(null);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!title.trim()) {
			setError("제목을 입력해주세요.");
			return;
		}
		if (!captchaToken) {
			setError("CAPTCHA 검증을 완료해주세요.");
			return;
		}
		const token = captchaToken;
		startTransition(async () => {
			try {
				const created = await createProblemSetAction(
					{ title, description: description.trim() || undefined },
					token
				);
				router.push(`/problemsets/${created.id}/edit`);
			} catch (err) {
				setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
				captchaRef.current?.reset();
				setCaptchaToken(null);
			}
		});
	};

	return (
		<form onSubmit={onSubmit} className="space-y-5">
			<div className="space-y-2">
				<Label htmlFor="title">제목</Label>
				<Input
					id="title"
					value={title}
					maxLength={PROBLEM_SET_TITLE_MAX}
					onChange={(e) => setTitle(e.target.value)}
					required
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
					rows={6}
				/>
				<p className="text-xs text-muted-foreground tabular-nums">
					{description.length} / {PROBLEM_SET_DESCRIPTION_MAX}
				</p>
			</div>
			<TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="flex gap-2 justify-end">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					취소
				</Button>
				<Button type="submit" disabled={pending}>
					만들기
				</Button>
			</div>
		</form>
	);
}
