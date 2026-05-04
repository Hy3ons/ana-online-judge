"use server";

import { isProxyConfigured as svcIsProxyConfigured } from "@/lib/services/docker-logs";

export async function isProxyConfigured(): Promise<boolean> {
	return svcIsProxyConfigured();
}
