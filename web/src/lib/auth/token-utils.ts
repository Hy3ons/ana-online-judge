import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ACCESS_TOKEN_BYTES = 32;
const REFRESH_TOKEN_BYTES = 48;
const DEVICE_CODE_BYTES = 32;

const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I, O, 0, 1 제거 (혼동 방지)

export function generateAccessToken(): string {
	return `aoj_at_${randomBytes(ACCESS_TOKEN_BYTES).toString("base64url")}`;
}

export function generateRefreshToken(): string {
	return `aoj_rt_${randomBytes(REFRESH_TOKEN_BYTES).toString("base64url")}`;
}

export function generateDeviceCode(): string {
	return randomBytes(DEVICE_CODE_BYTES).toString("base64url");
}

export function generateUserCode(): string {
	// 8자, "XXXX-XXXX" 표시. 충돌 확률 극소이나 호출 측에서 unique 보장 필요.
	const pick = (n: number) =>
		Array.from(randomBytes(n))
			.map((b) => USER_CODE_ALPHABET[b % USER_CODE_ALPHABET.length])
			.join("");
	return `${pick(4)}-${pick(4)}`;
}

export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function compareHash(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	const bufA = Buffer.from(a, "hex");
	const bufB = Buffer.from(b, "hex");
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}
