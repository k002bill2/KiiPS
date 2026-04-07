# KiiPS Active Commands (24개)

> CLAUDE.md에서 분리된 커맨드 카탈로그. 커맨드는 자동 발견되므로 이 파일은 참조용입니다.

## Core — 핵심 워크플로우

| Command | 용도 |
|---------|------|
| `/plan` | 구조화된 5단계 작업 계획 (CLARIFY→EXPLORE→PLAN→VALIDATE→EXECUTE) |
| `/session-wrap` | 세션 종료 정리 (COLLECT→SUMMARIZE→LEARN→HANDOFF) |
| `/verify` | Fresh-context 독립 검증 |
| `/learn` | 교훈 기록 + 자동화 제안 |
| `/evolve` | Instinct 클러스터링 → 스킬/커맨드 진화 |
| `/diagnose` | 진단 우선 디버깅 |
| `/scope-lock` | 파일 범위 제한 모드 |

## Utility — 보조 도구

| Command | 용도 |
|---------|------|
| `/review` | 코드 리뷰 (보안, 성능, 품질) |
| `/check-health` | 프로젝트 종합 상태 점검 |
| `/deploy-with-tests` | 안전 배포 (Test→Build→Deploy→Health) |
| `/draft-commits` | 커밋 초안 생성 |
| `/simplify-code` | 코드 단순화 분석 |
| `/test-coverage` | JUnit 테스트 + JaCoCo 커버리지 |
| `/my-workflow` | 개발 워크플로우 |
| `/eval` | AI 에이전트 평가 |
| `/gemini-scan` | Gemini 보안 스캔 |
| `/service-status` | 서비스 상태 확인 |
| `/view-logs` | 로그 조회 |
| `/instinct-status` | 학습 패턴 조회 |
| `/check-rules` | 규칙 위반 코드베이스 스캔 (7개 rules 자동 검증) |
| `/periodic-cleanup` | 주기적 GC (미사용 코드, 규칙 위반, Instinct 수명 관리) |
| `/instinct-gc` | Instinct 수명 관리 (저신뢰/미사용 아카이빙) |
| `/kiips-linked-approval-template` | 연계승인 템플릿 |
