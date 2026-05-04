import type { ExternalSite } from "@/db/schema";

export type { ExternalSite };

export interface ExternalSiteUserInfo {
	handle: string;
	rating: number | null;
}

export interface UserNameStyle {
	color: string;
	gradient?: string;
	firstCharBlack?: boolean;
}

export interface ExternalSiteClient {
	readonly id: ExternalSite;
	/** Returns null if the handle does not exist (HTTP 404 / API "not found"). Throws on network/transport errors. */
	fetchUser(handle: string): Promise<ExternalSiteUserInfo | null>;
	/** Returns null if no color should be applied (e.g., unrated). Pure function — safe for client/server. */
	styleFor(rating: number | null): UserNameStyle | null;
	labelFor(rating: number | null): string;
	/** Site-faithful canonical URL for the given handle. Pure function — safe for client/server. */
	profileUrl(handle: string): string;
	readonly rateLimit: { requestsPerMinute: number };
}
