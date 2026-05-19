"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { revokeTokenById } from "@/lib/services/user-tokens";

export async function revokeDeviceAction(formData: FormData): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");
	const tokenId = Number(formData.get("tokenId"));
	if (!Number.isFinite(tokenId)) throw new Error("Invalid token id");
	await revokeTokenById(tokenId, Number(session.user.id));
	revalidatePath("/settings/devices");
}
