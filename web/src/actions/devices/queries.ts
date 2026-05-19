"use server";

import { auth } from "@/auth";
import { listUserActivatedTokens } from "@/lib/services/user-tokens";

export async function listMyDevices() {
	const session = await auth();
	if (!session?.user?.id) return [];
	return listUserActivatedTokens(Number(session.user.id));
}
