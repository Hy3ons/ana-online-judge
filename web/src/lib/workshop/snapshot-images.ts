/**
 * description 마크다운에서 이 문제의 워크샵 지문 이미지 스토리지 키를 추출한다.
 * MarkdownEditor는 이미지를 인코딩된 URL로 삽입한다:
 *   /api/images/images%2FworkshopProblems%2F{id}%2F{file}
 * 반환 키는 디코딩된 스토리지 키: images/workshopProblems/{id}/{file}
 */
const WORKSHOP_IMAGE_URL_RE = /\/api\/images\/(images%2FworkshopProblems%2F\d+%2F[^\s"'<>)]+)/g;

export function extractWorkshopImageKeys(description: string, problemId: number): string[] {
	const prefix = `images/workshopProblems/${problemId}/`;
	const keys = new Set<string>();
	for (const m of description.matchAll(WORKSHOP_IMAGE_URL_RE)) {
		let key: string;
		try {
			key = decodeURIComponent(m[1]);
		} catch {
			continue;
		}
		if (key.startsWith(prefix)) keys.add(key);
	}
	return [...keys];
}
