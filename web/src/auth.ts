import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { userExternalHandles, users } from "@/db/schema";
import { isGoogleRegistrationOpen } from "@/lib/auth-utils";
import { serverEnv } from "@/lib/env";
import { clearImpersonationCookie, getImpersonationTarget } from "@/lib/impersonation";

/**
 * 사용자의 메인 외부 핸들 rating 을 조회. 메인 사이트 또는 핸들 row 가 없으면 null.
 */
async function getMainExternalRating(
	userId: number,
	mainSite: (typeof users.$inferSelect)["mainExternalSite"]
): Promise<number | null> {
	if (!mainSite) return null;
	const [row] = await db
		.select({ rating: userExternalHandles.rating })
		.from(userExternalHandles)
		.where(and(eq(userExternalHandles.userId, userId), eq(userExternalHandles.provider, mainSite)))
		.limit(1);
	return row?.rating ?? null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Google({
			clientId: serverEnv.GOOGLE_CLIENT_ID,
			clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
		}),
		Credentials({
			name: "credentials",
			credentials: {
				username: { label: "아이디", type: "text" },
				password: { label: "비밀번호", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					return null;
				}

				const username = credentials.username as string;
				const password = credentials.password as string;

				const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

				if (user.length === 0) {
					return null;
				}

				// Check if account is active
				if (!user[0].isActive) {
					return null;
				}

				// OAuth users don't have passwords
				if (!user[0].password) {
					return null;
				}

				const isValidPassword = await compare(password, user[0].password);

				if (!isValidPassword) {
					return null;
				}

				const mainExternalRating = await getMainExternalRating(
					user[0].id,
					user[0].mainExternalSite
				);
				return {
					id: user[0].id.toString(),
					email: user[0].email ?? undefined,
					name: user[0].name,
					username: user[0].username,
					role: user[0].role,
					contestAccountOnly: user[0].contestAccountOnly ?? undefined,
					contestId: user[0].contestId ?? undefined,
					mustChangePassword: user[0].mustChangePassword ?? false,
					avatarUrl: user[0].avatarUrl ?? null,
					mainExternalSite: user[0].mainExternalSite ?? null,
					mainExternalRating,
				};
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			// Google OAuth 로그인 처리
			if (account?.provider === "google") {
				const googleId = account.providerAccountId;
				const email = user.email;
				// authId로 기존 사용자 찾기
				const existingUser = await db
					.select()
					.from(users)
					.where(eq(users.authId, googleId))
					.limit(1);

				// 기존 사용자가 있으면 로그인 허용 (회원가입 설정 체크 안 함)
				if (existingUser.length > 0) {
					return true;
				}

				// 신규 사용자인 경우: 구글 회원가입이 열려있는지 확인
				const googleRegistrationOpen = await isGoogleRegistrationOpen();
				if (!googleRegistrationOpen) {
					return false;
				}

				// 이메일 중복 체크 (이메일이 있는 경우)
				if (email) {
					const existingEmail = await db
						.select()
						.from(users)
						.where(eq(users.email, email))
						.limit(1);

					if (existingEmail.length > 0) {
						// 이미 해당 이메일로 가입된 계정이 있음 (PII 보호 위해 이메일 마스킹)
						const maskedEmail = email.replace(/^(.).*(@.*)$/, "$1***$2");
						console.error(`Email ${maskedEmail} is already registered`);
						return false;
					}
				}

				// 신규 사용자 생성
				const username = `google_${googleId}`;

				// username 중복 체크 (만약을 위해)
				const usernameExists = await db
					.select()
					.from(users)
					.where(eq(users.username, username))
					.limit(1);

				if (usernameExists.length > 0) {
					// 매우 드문 경우지만, 타임스탬프 추가
					const timestamp = Date.now();
					await db.insert(users).values({
						username: `google_${googleId}_${timestamp}`,
						name: user.name || "Google User",
						email: email || null,
						password: null,
						role: "user",
						authId: googleId,
						authProvider: "google",
					});
				} else {
					await db.insert(users).values({
						username,
						name: user.name || "Google User",
						email: email || null,
						password: null,
						role: "user",
						authId: googleId,
						authProvider: "google",
					});
				}
			}

			return true;
		},
		async jwt({ token, user, account, trigger, session }) {
			if (user) {
				// Credentials 로그인 또는 초기 OAuth 로그인
				if (account?.provider === "google") {
					// Google 로그인: DB에서 사용자 정보 가져오기
					const googleId = account.providerAccountId;
					const dbUser = await db.select().from(users).where(eq(users.authId, googleId)).limit(1);

					if (dbUser.length > 0) {
						const mainExternalRating = await getMainExternalRating(
							dbUser[0].id,
							dbUser[0].mainExternalSite
						);
						token.id = dbUser[0].id.toString();
						token.username = dbUser[0].username;
						token.name = dbUser[0].name;
						token.role = dbUser[0].role;
						token.contestAccountOnly = dbUser[0].contestAccountOnly;
						token.contestId = dbUser[0].contestId;
						token.mustChangePassword = false; // OAuth 계정은 비밀번호 없음
						token.avatarUrl = dbUser[0].avatarUrl ?? null;
						token.mainExternalSite = dbUser[0].mainExternalSite ?? null;
						token.mainExternalRating = mainExternalRating;
					}
				} else {
					// Credentials 로그인
					token.id = user.id;
					token.username = user.username;
					token.name = user.name;
					token.role = user.role;
					token.contestAccountOnly = user.contestAccountOnly;
					token.contestId = user.contestId;
					token.mustChangePassword = user.mustChangePassword ?? false;
					token.avatarUrl = user.avatarUrl ?? null;
					token.mainExternalSite = user.mainExternalSite ?? null;
					token.mainExternalRating = user.mainExternalRating ?? null;
				}
			}
			// 클라이언트에서 update() 호출 시 세션 페이로드 반영
			if (trigger === "update" && session && typeof session === "object") {
				const next = session as {
					mustChangePassword?: boolean;
					name?: string | null;
					avatarUrl?: string | null;
				};
				if (typeof next.mustChangePassword === "boolean") {
					token.mustChangePassword = next.mustChangePassword;
				}
				if (typeof next.name === "string") {
					token.name = next.name;
				}
				if (next.avatarUrl === null || typeof next.avatarUrl === "string") {
					token.avatarUrl = next.avatarUrl;
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.username = token.username as string;
				session.user.name = (token.name as string | null | undefined) ?? session.user.name;
				session.user.role = token.role as string;
				session.user.contestAccountOnly = token.contestAccountOnly as boolean;
				session.user.contestId = token.contestId as number | null;
				session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
				session.user.avatarUrl = (token.avatarUrl as string | null | undefined) ?? null;
				session.user.mainExternalSite =
					(token.mainExternalSite as (typeof users.$inferSelect)["mainExternalSite"]) ?? null;
				session.user.mainExternalRating = (token.mainExternalRating as number | null) ?? null;

				// 대리 로그인 처리
				if (token.role === "admin") {
					const targetUserId = await getImpersonationTarget();
					if (targetUserId) {
						const [targetUser] = await db
							.select()
							.from(users)
							.where(eq(users.id, targetUserId))
							.limit(1);

						if (targetUser) {
							const targetMainExternalRating = await getMainExternalRating(
								targetUser.id,
								targetUser.mainExternalSite
							);
							session.user.impersonator = {
								id: token.id as string,
								username: token.username as string,
							};
							session.user.id = targetUser.id.toString();
							session.user.username = targetUser.username;
							session.user.name = targetUser.name;
							session.user.email = targetUser.email ?? "";
							session.user.role = targetUser.role;
							session.user.contestAccountOnly = targetUser.contestAccountOnly ?? false;
							session.user.contestId = targetUser.contestId ?? null;
							session.user.mustChangePassword = targetUser.mustChangePassword ?? false;
							session.user.avatarUrl = targetUser.avatarUrl ?? null;
							session.user.mainExternalSite = targetUser.mainExternalSite ?? null;
							session.user.mainExternalRating = targetMainExternalRating;
						}
					}
				}
			}
			return session;
		},
	},
	events: {
		async signOut() {
			await clearImpersonationCookie();
		},
	},
	pages: {
		signIn: "/login",
	},
	session: {
		strategy: "jwt",
	},
});
