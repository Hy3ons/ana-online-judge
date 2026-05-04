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
	bold?: boolean;
}

export interface ExternalSiteClient {
	readonly id: ExternalSite;
	fetchUser(handle: string): Promise<ExternalSiteUserInfo | null>;
	styleFor(rating: number | null): UserNameStyle | null;
	labelFor(rating: number | null): string;
	readonly rateLimit: { requestsPerMinute: number };
}
