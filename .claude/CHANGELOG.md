# .claude/ Configuration Changelog

> KiiPS Claude Code 설정 파일 변경 이력
> 개별 파일의 @version 주석과 연동하되, 크로스 파일 변경 주제별로 정리

## [3.5.0] - 2026-04-22 — Permission Gate & Primary Coordinator Cleanup

### Added (신규)
- **훅 1개**:
  - `permissionGate.js` — 서비스 제어(start.sh/stop.sh/kill -9/pkill/systemctl), 공유 빌드 파일(pom.xml), 프로덕션 설정(app-kiips/stg/production.properties), SVN commit 명령에 대한 User Approval 게이트. 의존성 0. 환경변수 `KIIPS_PERMISSION_GATE=off` 로 롤백.
- **단위 테스트**:
  - `.claude/tests/permission-gate.test.js` — 30 sub-test (Bash service control · VCS commit · protected paths · allowed paths · boundary)
- **회귀 페이로드 6개**:
  - 허용: `pg-allow-java-edit.json`, `pg-allow-mapper.json`, `pg-allow-ls.json`
  - 차단: `pg-block-start-sh.json`, `pg-block-pom-edit.json`, `pg-block-svn-commit.json`
- **hook-regression.sh 섹션 2개**:
  - permissionGate (default active) — 허용 3 + 차단 3
  - permissionGate (rollback) — 차단 3건이 gate off 시 허용됨 확인

### Changed (수정) — primary-coordinator 잔해 정리
- `.claude/README.md` — 디렉토리 트리에서 `primary-coordinator.md` 라인 제거
- `.claude/docs/architecture.html` — "Coordination / primary-coordinator" 섹션을 "Permission Gate (hook-based) / permissionGate.js" 로 대체
- `agents/managers/build-manager.md` (6곳) — Escalation·Workflow·Communication Protocols·Coordination Scripts 섹션 정합
- `agents/managers/deployment-manager.md` (10곳) — Purpose·Service Control·Pipeline 다이어그램·Stage 2/3 Owner·Communication Protocols 섹션 정합. "Primary Coordinator exclusive permission" → "user-approved via permissionGate"
- `agents/managers/feature-manager.md` (4곳) — Escalation·Sequential Handoff 패턴(`agent: 'primary-coordinator'` → `'verify-agent'`)·Communication Protocols·Coordination Scripts 섹션 정합
- `agents/managers/ui-manager.md` (4곳) — Escalation·Communication Protocols·Coordination Scripts 섹션 정합
- `agents/kiips-developer.md` — Secondary Agent Permissions/Restrictions 섹션을 "User via permissionGate + impactAnalyzer hooks" 로 정합
- `agents/kiips-architect.md` — Strategic Advisor Unique Responsibilities + Advisory Restrictions 정합
- `.claude/settings.json` — PreToolUse 훅 체인에 permissionGate 등록 (ethicalValidator 뒤)

### Removed (제거)
- **Dead script references** — 모든 매니저 파일 하단의 `Coordination Scripts: task-allocator.js, manager-coordinator.js, file-lock-manager.js, checkpoint-manager.js` (4개 스크립트 모두 실존하지 않음) → `Permission Gate: .claude/hooks/permissionGate.js` 로 교체

### Security
- **권한 체계의 훅 이관**: primary-coordinator 에이전트(부탁 수준)가 담당하던 "배타적 권한" 역할을 훅(강제 수준)으로 이관. 에이전트는 알림자·제안자, 훅+사용자가 의사결정자.
- **네 번째 권한 게이트 편입**: 서비스 제어(start.sh/stop.sh/kill/pkill/systemctl) + pom.xml + svn commit 은 permissionGate 단독 커버. `app-kiips/stg/production.properties` 는 기존 settings.json inline python 훅과 **부분 중복** — 중복은 허용(둘 다 차단)하되 permissionGate 가 먼저 실행되어 더 풍부한 User Approval 메시지를 제공. Dead-code가 아닌 의도적 UX 개선.
- **Fail-closed 정책 유지**: 훅 예외 시 block.

### Metrics
- Top-level 테스트 **35 → 46** (+11)
- 실제 체크 **153+ → 183+** (+30 permissionGate sub-tests)
- primary-coordinator 참조 잔존 **25 → 0** (코드 변경 이력 기록용 ethicalValidator/permissionGate 주석 제외)

### Known / Out of Scope (이월)
- `ethicalValidator.min.js` 0바이트 orphan 파일 — 별도 세션 처리
- 매니저 4개 registry triggers 실제 동작 관찰 — 사용 패턴에 따라 향후 축소 검토
- `.claude/docs/architecture.html` 의 "Permission Gate" tier 는 현재 **Agents** layer(`l2b`) 안에 배치되어 카테고리 경계가 모호. permissionGate 는 에이전트가 아닌 훅. 별도 세션에서 hooks layer 로 이전 또는 삭제 결정 (advisor flagged 2026-04-22).

---

## [3.4.0] - 2026-04-22 — AST-based Shell Context Validation

### Added (신규)
- **훅 1개**:
  - `shellContextTokenizer.js` — offset-based state scanner (의존성 0, 28 단위 테스트). literal/comment/heredoc 컨텍스트 판정 공개 함수 `isInsideShellLiteralOrComment(source, offset)`.
- **테스트 인프라**:
  - `.claude/tests/shell-context-tokenizer.test.js` — 28 sub-test 단위 검증 (입력 validation · OUTSIDE · SQUOTE · DQUOTE · COMMENT · HEREDOC · FP 재현 · 편의 함수)
  - `.claude/tests/hook-regression.sh` 확장 — `run_test_env` 헬퍼, AST active 4건 + AST rollback 4건 섹션, tokenizer 유닛 섹션
  - `.claude/tests/baselines/validator-baseline-20260422.log` — Phase 0 snapshot (향후 회귀 비교 기준)
- **테스트 페이로드 4개**:
  - `fs-grep-literal.json` — grep 정규식 리터럴 내부 `|bash` (FP #3)
  - `fs-comment-docs.json` — 주석 내부 `curl ... | bash` (FP #2)
  - `fs-heredoc-docs.json` — heredoc 본문 내부 `rm -rf` 참조
  - `sh-edit-unclosed-quote-regression.json` — **advisor 발견 회귀 방어** (unclosed quote로 인한 false negative 차단)

### Changed (수정)
- `ethicalValidator.js` — `@version 3.3.0 → 3.4.0 (ast-filter)`:
  - `require("./shellContextTokenizer")` 추가
  - `BLOCKED_OPERATIONS` 패턴 루프를 `pattern.exec` + global 복사본 순회로 변경 (여러 매치 중 실 코드 매치 우선)
  - AST 필터 적용 조건: `shellContextOnly && toolName === "bash"` 로 제한 (Edit/Write 합성 문자열엔 미적용)
  - `KIIPS_VALIDATOR_AST=off` 환경변수로 AST 레이어 즉시 rollback

### Fixed (수정)
- **False positive 3건** (AST 필터로 근본 해결):
  - `grep -E "pattern|bash"` 리터럴 내부 `|bash` 오판
  - `# curl install.sh | bash` 주석 내부 오판
  - heredoc body 내 `rm -rf` 텍스트 오판
- **회귀 방어 1건** (advisor 발견, Bash-only 게이트로 차단):
  - `.sh` 파일 Edit의 new_string에 unclosed quote 포함 시 뒤 따르는 old_string의 실제 공격이 literal로 오분류되는 silent security downgrade

### Security
- AST 필터 적용 범위를 Bash 도구로 제한 — 데이터 타입 보증 가능한 영역에만 state scan 실행
- Fail-closed 정책 유지 (토크나이저 예외 시 상위 차단 정책 보존)
- Rollback 경로 환경변수 제공 (긴급 시 AST 즉시 비활성 가능)
- 회귀 방어 페이로드가 pre-commit + SessionStart 24h 게이트에 편입 — 동일 취약점 재발 시 머지 차단

### Metrics
- Top-level 테스트 **25 → 35** (+10)
- 실제 체크 **125+ → 153+** (+28 tokenizer sub-tests, +10 top-level)
- 새 모듈 shellContextTokenizer 의존성 **0** (순수 JS)

### Known / Out of Scope
- `ethicalValidator.min.js` 0바이트 orphan 파일 (`a37f275` 이후) — 별도 세션에서 regen 또는 삭제 결정
- 이전 세션 잔존 과제 #2 (primary-coordinator 권한 시스템) — 사용자 정책 결정 대기

---

## [3.0.0] - 2026-04-22 — Harness Engineering 적용

### Added (신규)
- **훅 5개**:
  - `backupGc.sh` — 30일 경과 백업 디렉토리 후보 알림
  - `observationsRoller.js` — observations.jsonl 90일 롤링 아카이브
  - `jspXssGuard.js` — JSP XSS 패턴 차단 (scriptlet/EL)
  - `impactAnalyzer.js` — KiiPS-COMMON/UTILS 의미적 영향 분석
  - `regressionGuard.sh` — SessionStart 24h 자동 회귀 테스트
- **테스트 인프라**:
  - `.claude/tests/hook-regression.sh` — 통합 회귀 러너 (24 top-level)
  - `.claude/tests/ralph-loop-signature.test.js` — Ralph Loop 시그니처 합성 테스트 (13)
  - `.claude/tests/registry-integrity.test.js` — agents-registry drift 감지 (38)
  - `.claude/tests/extract-build-errors.test.js` — Maven 파싱 회귀 (18)
  - `.claude/tests/skills-integrity.test.js` — SKILL.md frontmatter 검증 (32)
- **컨텍스트 파일**:
  - `.claude/PORTS.md` — 서비스 포트 매핑
  - `.claude/rules/ralph-loop-detection.md` — 감지 로직 상세
  - `KiiPS-{UI,FD,COMMON,UTILS,AC,SY,LP,EL}/CLAUDE.md` + `KIIPS-{BATCH,HELP}/CLAUDE.md` — 10개 모듈 가이드
- **Git hook**:
  - `.git/hooks/pre-commit` — `.claude/` 변경 시 hook-regression.sh 강제 실행

### Changed (수정)
- `CLAUDE.md` — 91줄 → 48줄 (Catalogs/Ports 외부화)
- `.claude/README.md` — stale 정보 정리, 13개 훅 매트릭스 정확 반영
- `.claude/rules/anti-rationalization.md` — 105줄 → 60줄 (Ralph Loop 상세 분리)
- `.claude/hooks/ethicalValidator.js` — `shellContextOnly` 플래그 도입, primary-coordinator dead code 제거, 컨벤션 문서화
- `.claude/hooks/buildChecker.js` — `errorSignatureHistory` 추적 + Ralph Loop A→B→C 감지 + 환경변수 차등화 (RALPH_LOOP_ATTEMPTS, RALPH_LOOP_SHIFTS)
- `.claude/hooks/stopEvent.js` — `gcWeeklyCleanup()` 추가 (7일 인터벌 백업/롤링/알림)
- `.claude/hooks/autoFormatter.js` — tests/test-payloads/rules 경로 skip
- `.claude/settings.json` — jspXssGuard, impactAnalyzer, regressionGuard 훅 등록

### Fixed (수정)
- **False positive 2건**:
  - `ethicalValidator` remoteExecution 정규식이 마크다운 테이블 `\| Bash\|Edit\|Write` 차단 → shellContextOnly 가드
  - `ethicalValidator` filesystem 정규식이 `rm ... 2>/dev/null` 정상 코드 차단 → shellContextOnly 가드
- **Drift 1건**:
  - `react-components/SKILL.md` frontmatter `name: reactcomponents` → `name: react-components` (디렉토리명 일치)

### Removed (제거)
- `.claude.backup-ace-20260421-105813/` (13MB) — ACE rollback 자료
- `.claude.backup-ace-removed-20260421-110149/` (132KB)

---

## [2.0.0] - 2026-03-27 (이전 기록)

- ACE Framework 제거 (2026-04-21)
- primary-coordinator 에이전트 삭제

---

## 변경 이력 작성 컨벤션

- **Added / Changed / Fixed / Removed / Deprecated** 카테고리 사용
- 각 항목에 파일 경로 포함 (추적 가능성)
- 수치 변경 시 before/after 명시 (예: "91줄 → 48줄")
- Breaking change는 ⚠️ 표시
- 릴리즈 번호: 하네스 엔지니어링 메이저 변경은 3.x, 이전 2.x
