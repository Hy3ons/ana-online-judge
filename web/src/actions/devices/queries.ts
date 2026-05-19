"use server";

import { auth } from "@/auth";
import { listUserTokens } from "@/lib/services/user-tokens";

export async function listMyDevices() {
	const session = await auth();
	if (!session?.user?.id) return [];
	return listUserTokens(Number(session.user.id));
}
