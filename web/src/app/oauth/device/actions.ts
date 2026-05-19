"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
	approveDeviceAuth,
	denyDeviceAuth,
	getDeviceAuthByUserCode,
} from "@/lib/auth/device-auth-store";
import { assertTurnstile } from "@/lib/turnstile-guard";

export interface DeviceFormState {
	error?: string;
	success?: string;
}

export async function approveDeviceAction(
	_prev: DeviceFormState,
	formData: FormData
): Promise<DeviceFormState> {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/login?callbackUrl=${encodeURIComponent("/oauth/device")}`);
	}

	const userCode = String(formData.get("user_code") ?? "")
		.trim()
		.toUpperCase();
	const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
	const decision = String(formData.get("decision") ?? "");

	try {
		await assertTurnstile(turnstileToken);
	} catch {
		return { error: "CAPTCHA 검증 실패. 새로고침 후 다시 시도해주세요." };
	}

	if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(userCode)) {
		return { error: "코드 형식이 올바르지 않습니다. (예: KQNT-XBRJ)" };
	}

	const found = await getDeviceAuthByUserCode(userCode);
	if (!found) {
		return { error: "코드를 찾을 수 없거나 만료되었습니다." };
	}
	if (found.record.status !== "pending") {
		return { error: "이미 처리된 코드입니다." };
	}

	const userId = Number(session.user.id);

	if (decision === "approve") {
		const ok = await approveDeviceAuth(found.deviceCode, userId);
		if (!ok) return { error: "승인 처리 실패. 코드가 만료되었을 수 있습니다." };
		return { success: "디바이스가 승인되었습니다. VS Code로 돌아가서 확인하세요." };
	}
	if (decision === "deny") {
		await denyDeviceAuth(found.deviceCode);
		return { success: "디바이스 요청이 거부되었습니다." };
	}

	return { error: "잘못된 요청." };
}
