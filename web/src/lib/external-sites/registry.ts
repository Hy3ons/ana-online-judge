import "server-only";
import type { ExternalSite } from "@/db/schema";
import { atcoderClient, codeforcesClient } from "./clients";
import type { ExternalSiteClient } from "./types";

export const SITES: Record<ExternalSite, ExternalSiteClient> = {
	codeforces: codeforcesClient,
	atcoder: atcoderClient,
};

export function getSite(id: ExternalSite): ExternalSiteClient {
	return SITES[id];
}

export const ALL_SITES: ReadonlyArray<ExternalSite> = ["codeforces", "atcoder"];
