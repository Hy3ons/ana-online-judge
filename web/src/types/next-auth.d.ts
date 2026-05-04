import { DefaultSession } from "next-auth";
import type { ExternalSite } from "@/db/schema";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			username: string;
			role: string;
			contestAccountOnly: boolean;
			contestId: number | null;
			mustChangePassword: boolean;
			avatarUrl: string | null;
			mainExternalSite: ExternalSite | null;
			mainExternalRating: number | null;
			impersonator?: { id: string; username: string };
		} & DefaultSession["user"];
	}

	interface User {
		username?: string;
		role?: string;
		contestAccountOnly?: boolean;
		contestId?: number | null;
		mustChangePassword?: boolean;
		avatarUrl?: string | null;
		mainExternalSite?: ExternalSite | null;
		mainExternalRating?: number | null;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id?: string;
		username?: string;
		role?: string;
		contestAccountOnly?: boolean;
		contestId?: number | null;
		mustChangePassword?: boolean;
		avatarUrl?: string | null;
		mainExternalSite?: ExternalSite | null;
		mainExternalRating?: number | null;
	}
}
