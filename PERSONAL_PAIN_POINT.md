개인적으로 AOJ를 개발하면서 막혔던 부분과 해결 방법 (기록용)


1. 아침까지 잘 동작하던 Judge가 배포 후 갑자기 동작하지 않는 문제 
- Docker 확인 결과 라이브러리의 버전을 고정하지 않아서 어제는 됐는데 오늘은 안되는 문제였음.
- isolate가 2.2에서 2.3으로 올라가면서 Debian 패키지가 직접 isolate 시스템 유저와 sub 유저 id 범위를 만드는 변경이 추가되었다.
- judge/Dockerfile에서 직접 유저 id를 할당해줘야 한다.
- 이때 isolate, rust, debian 등의 버전을 pin하기로 했다.

2. CLI를 이용한 문제 업로드 속도가 형편없었다
- 원인이 네 개 겹쳐 있었다.
- CLI 자체 병목: 매 호출마다 /meta/endpoints 재조회 + testcase 쌍마다 단건 업로드. contracts를 ~/.aoj-cache.json에 1h TTL로 캐싱하고, testcases/bulk 엔드포인트 + testcases-bulk-upload 명령으로 multipart 한 번에 올리도록 변경. client.ts에는 fetch 재시도(3회 backoff)와 업로드 5분 타임아웃 추가.
- WSL2 NAT 업로드 throttle: curl 직접 업로드도 100KB/s 수준. 브라우저는 같은 망에서 20MB/s. .wslconfig에 networkingMode=mirrored 추가 → AOJ 10MB 업로드가 1.47s로 복귀.
- Mirrored 전환 후 DNS 회귀: 매 쿼리 0.7~1s로 느려져 작은 호출이 5~12s. /etc/systemd/resolved.conf.d/fast-dns.conf에 DNS=1.1.1.1, Cache=yes 설정하고 systemd-resolved 재시작 → 17ms(첫) / 1ms(캐시).
- Hyper V Firewall로 인한 TCP 연결 Drop -> .wslconfig에 firewall=false 추가
- 결과: 전체 파이프라인 1.54s로 안정화, 48문제 시즌 import이 39분 → 약 1분으로 단축.

3. 같은 코드가 메모리 제한에 따라 다른 메모리 사용량을 보고하는 문제
- 워크샵 invocation에서 동일 sol.cpp(카운팅 정렬, 실제 수요 ~1-2MB)가 마지막 TC(N = 천만)에서 메모리 제한이 16MB일때는 16MB, 20MB일때는 20MB, 128MB일때는 60MB로 보고됨. 한계값이 그대로 측정값이 되거나, 한계가 클수록 보고값이 커지는 식.
- 원인 두 가지:
  - (a) judge가 isolate에서 `cg-mem`(=cgroups v2 `memory.peak`)을 사용하고 있었는데, 이 값은 cgroup이 만진 anonymous heap뿐 아니라 file page cache(stdin 파일 read의 캐시), kernel slab까지 합산함. 80MB stdin을 읽으면 그 page cache가 cgroup에 누적 귀속되어 측정값이 부풀려짐.
  - (b) `--cg-mem=<user_limit>`을 그대로 `memory.max`로 넘기는 구조라 cgroup이 `memory.peak`가 한계값 근처에서 클리핑되어 한계와 거의 같은 값으로 보고됨.
- 해결:
  - meta 파서가 `max-rss`(=`getrusage().ru_maxrss`)만 reported memory로 사용하도록 변경. ru_maxrss는 프로세스 주소공간에 매핑된 resident page만 셈해서 read(2)로 들어오는 stdin page cache가 끼지 않음.
  - isolate의 `--cg-mem`을 `user_limit + 128MB`로 설정. cgroup이 측정값을 클리핑하지 않도록 헤드룸 확보. MLE 판정은 여전히 `max-rss > user_limit`으로 user limit 기준 유지(`executer.rs`의 비교에서 `spec.limits.memory_mb`를 그대로 씀).
  - `cg_oom_killed`는 헤드룸을 다 쓴 진짜 memory abuse 케이스에 대한 안전망으로 남김.
- 트레이드오프: 멀티 프로세스 솔루션에서 `ru_maxrss`가 자식들의 max만 가져오는 함정이 남아있음(향후 false negative 발견 시 cgroup `memory.stat:anon` 직접 read로 보완 예정).