"use client";

import { useActionState, useRef, useState } from "react";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveDeviceAction, type DeviceFormState } from "./actions";

interface Props {
	initialUserCode: string;
	username: string;
}

export function DeviceForm({ initialUserCode, username }: Props) {
	const [state, formAction, pending] = useActionState<DeviceFormState, FormData>(
		approveDeviceAction,
		{}
	);
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const captchaRef = useRef<TurnstileWidgetHandle>(null);

	if (state.success) {
		return (
			<div className="rounded-[2px] border border-border bg-secondary p-4 text-sm text-foreground">
				{state.success}
			</div>
		);
	}

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="user_code">디바이스 코드</Label>
				<Input
					id="user_code"
					name="user_code"
					defaultValue={initialUserCode}
					placeholder="XXXX-XXXX"
					required
					autoComplete="off"
					className="font-mono uppercase tracking-widest"
				/>
			</div>
			<p className="text-sm text-muted-foreground">
				이 디바이스를 <span className="font-semibold text-foreground">{username}</span> 계정으로
				인증하시겠습니까? 승인 후 해당 디바이스는 회원님 대신 제출/조회를 수행할 수 있습니다.
			</p>
			<TurnstileWidget
				ref={captchaRef}
				onVerify={(token) => setCaptchaToken(token)}
				onExpire={() => setCaptchaToken(null)}
				onError={() => setCaptchaToken(null)}
			/>
			{/* Hidden input so the server action can read cf-turnstile-response from FormData */}
			<input type="hidden" name="cf-turnstile-response" value={captchaToken ?? ""} />
			{state.error && <p className="text-sm text-destructive">{state.error}</p>}
			<div className="flex gap-2">
				<Button type="submit" name="decision" value="approve" disabled={pending}>
					{pending ? "처리 중..." : "승인"}
				</Button>
				<Button type="submit" name="decision" value="deny" variant="outline" disabled={pending}>
					거부
				</Button>
			</div>
		</form>
	);
}
