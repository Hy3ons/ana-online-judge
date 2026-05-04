"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopGroups, workshopProblemMembers } from "@/db/schema";
import {
	getUserQuotas as svcGetUserQuotas,
	getWorkshopUsage as svcGetWorkshopUsage,
} from "@/lib/services/quota";
import { listAllGroups as svcListAllGroups } from "@/lib/services/workshop-groups";

export async function getUserQuotas(...args: Parameters<typeof svcGetUserQuotas>) {
	return svcGetUserQuotas(...args);
}

export async function getWorkshopUsage(...args: Parameters<typeof svcGetWorkshopUsage>) {
	return svcGetWorkshopUsage(...args);
}

export async function listAllGroups(...args: Parameters<typeof svcListAllGroups>) {
	return svcListAllGroups(...args);
}

export async function getGroupName(groupId: number): Promise<string | null> {
	const [g] = await db
		.select({ name: workshopGroups.name })
		.from(workshopGroups)
		.where(eq(workshopGroups.id, groupId))
		.limit(1);
	return g?.name ?? null;
}

export async function getMyWorkshopProblemRole(
	workshopProblemId: number,
	userId: number
): Promise<"owner" | "member" | null> {
	const [m] = await db
		.select({ role: workshopProblemMembers.role })
		.from(workshopProblemMembers)
		.where(
			and(
				eq(workshopProblemMembers.workshopProblemId, workshopProblemId),
				eq(workshopProblemMembers.userId, userId)
			)
		)
		.limit(1);
	return (m?.role as "owner" | "member" | null) ?? null;
}
