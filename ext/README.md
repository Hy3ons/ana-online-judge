# ANA Online Judge — VS Code Extension

VS Code 안에서 ANA Online Judge (AOJ) 문제를 풀고 제출한다. cph 호환 사이드카 구조, RFC 8628 device-flow 인증.

## 기능

- 문제 검색 / sync → 워크스페이스에 코드 템플릿 + 예제 testcase 자동 생성
- 사이드바: Active Contests · Recently Synced · My Submissions
- ▶ Run All / Run This: 로컬 컴파일 + 실행 + ICPC-규칙 비교
- ⬆ Submit: REST 제출 + SSE 실시간 verdict
- 상태바: contest 카운트다운
- Command Palette / 키바인딩 (Ctrl+Alt+B, Ctrl+Alt+S, Ctrl+Alt+D)

## 시작

1. 워크스페이스 폴더 열기.
2. AOJ 사이드바 → Sign in → 브라우저에서 코드 입력 후 승인.
3. Search Problems → 문제 선택 → 언어 → 자동 생성된 파일에서 코딩 시작.

## 설정

- `aoj.endpoint`: AOJ 인스턴스 URL
- `aoj.compilerPaths`: 언어별 컴파일러/런타임 경로
- `aoj.compileFlags`: 언어별 컴파일 플래그
- `aoj.timeoutMultiplier`: 로컬 실행 timeout 배수 (기본 2.0)
- `aoj.confirmSubmit`: 제출 전 확인 (기본 true)

## 로컬 실행 vs 서버 채점

로컬 실행은 사용자 OS 환경에서 직접 수행됩니다. AOJ 서버는 isolate 샌드박스 + cgroups v2 환경이므로 시간/메모리 측정 및 system call 동작이 다를 수 있습니다. 최종 검증은 항상 Submit 으로.

## 알려진 한계 (v1)

- Playground 세션 동기화 미지원
- Scoreboard 표시 미지원
- Anigma 문제 제출 미지원

## 라이선스

MIT
