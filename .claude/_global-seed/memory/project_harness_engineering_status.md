---
name: Harness Engineering 통합 상태 (2026-04-22, v3.5.2)
description: KiiPS 의 하네스 엔지니어링 5 게이트 체계 현재 상태와 이월 과제
type: project
originSessionId: 78ed29e5-b7c9-4acd-899f-0149edb4aecd
---
KiiPS 는 5 개 권한/안전 게이트 + AST 필터 공유로 구성된 하네스 체계를 운용 중 (v3.5.2 기준):
- ethicalValidator v3.4.0 (AST 필터 Bash-only): rm/DROP/curl|bash
- permissionGate v3.5.1 (AST 필터 Bash-only): service control / pom.xml / SVN-commit / prod properties
- multiFileGate: 3+ 파일
- impactAnalyzer: COMMON/UTILS 의미 영향
- jspXssGuard: JSP scriptlet XSS
- shellContextTokenizer v1.0.1: 위 두 AST 가드의 공유 context 판정기

**Why:** primary-coordinator 에이전트 삭제(2026-04-21) 후 권한 주체 공백을 "훅+사용자" 로 이관. 에이전트는 부탁(prompt), 훅은 강제(runtime).

**How to apply:** 향후 권한 관련 작업 시 새 에이전트 생성이 아닌 기존 훅 확장 또는 신규 훅 추가 방향.

**v3.5.2 Known 해결 (2026-04-22):**
- architecture.html Permission Gate tier 분류 → 2a 8중 가드 + Tier A/B 재분류 완료
- rollback env 세션 중간 한계 → docs/harness-boundaries.md §2 문서화 완료
- AST DQUOTE `$()` 한계 → docs/harness-boundaries.md §1 + tokenizer 주석 drift 정정 완료 (stack 확장 구현은 이월)
- ethicalValidator.min.js "0B orphan" 기록은 **오정보** — 실제 10168 bytes. 단 `.min.js` 14 개 전체가 settings.json 미연동 (빌드 산출물 상태), 이는 별도 이월.

**남은 이월:**
- `.min.js` 14 개 활용 전략 결정 (활용 or 제거)
- AST DQUOTE stack 확장 실제 구현 + 테스트 추가
- README/COMMANDS/SKILLS.md 카탈로그 드리프트 (v2.0 → v3.5 동기화 또는 자동 생성)
