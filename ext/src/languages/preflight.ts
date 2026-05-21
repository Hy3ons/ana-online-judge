import type { LanguageDef, PlatformKey } from "./data";

export function buildMissingCompilerMessage(
	lang: LanguageDef,
	commandName: string,
	platform: PlatformKey
): string {
	const hint = lang.installHints?.[platform];
	const lines = [
		`❌ ${lang.displayName} 컴파일러(${commandName})를 찾을 수 없습니다.`,
		"",
		"설치 방법:",
		hint ? `  • ${hint}` : "  • 사용 중인 OS의 패키지 매니저로 설치",
		"",
		"또는 설정에서 경로 지정:",
		`  aoj.compilerPaths.${lang.id} = "/path/to/${commandName}"`,
	];
	return lines.join("\n");
}
