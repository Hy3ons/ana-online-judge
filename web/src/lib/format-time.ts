import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

/** "3분 전"처럼 한국어 상대 시각 문자열을 반환한다. */
export function formatRelativeKo(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}
