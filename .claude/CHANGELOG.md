# .claude/ Configuration Changelog

> KiiPS Claude Code 설정 파일 변경 이력
> 개별 파일의 @version 주석과 연동하되, 크로스 파일 변경 주제별로 정리

## [3.5.3] - 2026-04-22 — AST Filter .sh 확장 + Registry 자동화 + Hardening 번들

본 릴리즈는 하나의 세션에서 4 개 이월 과제를 번들 해결한 기록입니다:
(B1) catalog-integrity SessionStart 훅 · (A1) `.min.js` 14 개 제거 · (Issue #2) AST 필터 `.sh` 확장 · (B2/B3) skills/commands 레지스트리 자동화.

### Fixed
- **Issue #2 — AST 필터 scope over-restriction 해소**: v3.5.1 narrowing ("AST 필터 Bash 도구 전용") 이 `.sh` 계열 파일 Edit/Write 시에도 필터 미적용을 야기하여 오늘 `catalog-integrity.sh` 작성 중 SQUOTE 내 `'...(node|bash|python3|cd)...'` alternation 이 `|bash` 로 false-positive 차단된 사례를 근본 해결. advisor 검토 결과 narrowing 의 원래 근거는 "prose 보호" 가 아닌 "extractContent 합성 시 unclosed quote state 누출 false-negative 회귀 우려" 였음이 확인됨 (ethicalValidator.js line 301-303 주석 참조).

### Changed
- `hooks/ethicalValidator.js` `@version 3.4.0 → 3.5.3`:
  - **신규 함수** `extractShellSource(toolName, toolInput)` — shellContextOnly 카테고리 매칭용 깨끗한 세그먼트 반환 (Bash: command / Write: content / Edit: new_string). file_path 와 old_string 제외 → state 누출 공격 표면 제거.
  - BLOCKED_OPERATIONS 루프: `shellContextOnly` 카테고리는 `matchContent = extractShellSource()` 로만 매칭 & AST 필터 적용. 비-shellContextOnly 는 기존 `extractContent` 합성 유지.
  - `applyAst` 조건: `toolName === "bash"` 제약 제거. `.sh` 계열 Edit/Write 도 AST 필터 적용.
  - 상단 JSDoc 에 v3.5.3 변경 이유 기록.

### Added
- `scripts/build-registries.js` **신규** — Skills/Commands 레지스트리 자동 생성 스크립트 (B2/B3). 각 SKILL.md frontmatter + skill-rules.json 병합 / commands/*.md frontmatter or H1 fallback. 실행: `node .claude/scripts/build-registries.js`.
- `skills-registry.json` **신규** (auto-generated) — 30 스킬 메타데이터 (file, description, disableModelInvocation, category, trigger).
- `commands-registry.json` **신규** (auto-generated) — 24 커맨드 메타데이터 (file, description, allowedTools).
- `tests/ethical-validator.test.js` **신규** — 14 sub-tests:
  - Bash 회귀 5건 (rm -rf / SQUOTE 내 rm / comment 내 rm / ls / mvn)
  - 비-shell 파일 보호 2건 (.md / .java 의 prose rm 허용)
  - Issue #2 핵심 6건 (오늘 사례 / DQUOTE literal / comment / 실제 rm -rf 차단 / Edit old vs new / new 에 실제 curl|bash 차단)
  - AST rollback env (KIIPS_VALIDATOR_AST=off) fail-closed 1건
- 새 테스트 파일로 ethical-validator 가 처음으로 유닛 테스트 커버리지 확보 (이전에는 hook-regression.sh 페이로드만 존재).

### Security
- **공격 표면 재평가**:
  - Edit 의 old_string 은 "제거되는 내용" 이므로 검사 제외 — 공격자가 위험 패턴을 old_string 에 넣어도 파일에 실제 존재해야 Edit 성공하므로 공격 벡터 없음.
  - Write 의 file_path 는 shell source 가 아니므로 AST 매칭 대상 외. 다만 기존 `extractContent` (WARNING/비-shellContextOnly) 에는 여전히 포함되어 production config 경고 유지.
  - new_string 단일 세그먼트는 well-formed 요구 없음 — tokenizer 가 unclosed quote 에 대해 EOF 에서 `false` 반환 (보수적), 따라서 부분 unclosed 는 차단 유지.
- **Fail-closed 정책 유지**: `KIIPS_VALIDATOR_AST=off` 로 AST 만 rollback 가능, 패턴 매칭은 regex-only 모드로 fallback 하여 더 보수적으로 차단.
- **실제 차단 유지 검증**: `.sh` 파일 new_string 에 `rm -rf /` 또는 `curl ... | bash` 는 여전히 차단됨 (테스트 6, 7 증명).

### Changed (Bundle 연동)
- `tests/catalog-integrity.sh` — skills-registry.json / commands-registry.json 의 `totalSkills` / `totalCommands` 필드를 실측과 대조하는 2 건 추가. 전체 8 → 10 check.
- `settings.json` SessionStart 체인 — `catalog-integrity.sh` 를 추가, drift 발생 시 세션 시작 시 FAIL 라인만 노출 (PASS 는 조용).
- `README.md` — Overview 단일 진실원 컬럼에 skills-registry.json / commands-registry.json 추가. Directory Structure 에 `scripts/` 디렉토리 반영. Quick Reference 에 `build-registries.js` 재실행 명령 안내.

### Removed (Bundle 연동)
- **`.min.js` 14 개 전량 제거** (A1) — `git rm .claude/hooks/*.min.js`. settings.json 에서 미연동 상태의 빌드 산출물. 미니파이 빌드 스크립트 부재 확인 후 제거. 관련 참조는 `catalog-integrity.sh` 의 exclude 필터로만 유지.

### Metrics
- Top-level 테스트 **52 → 66** (+14 신규 ethical-validator sub-tests)
- 훅 회귀 커버리지: ethicalValidator 유닛 테스트 0 → 14
- catalog-integrity check **8 → 10** (+ registry stats 2건)
- hooks/ 파일 수 **40 → 26** (.min.js 14 제거)
- Single Source of Truth: 1 (agents) → **3 (agents + skills + commands)**

### Known / Out of Scope (업데이트)
- **(해결 v3.5.3)** ~~오늘 `catalog-integrity.sh` SQUOTE alternation false-positive~~ — 본 릴리즈에서 근본 해결. 회귀 테스트 등록.
- **AST DQUOTE `$(...)` / backtick 중첩** (harness-boundaries.md §1) — **여전히 이월**. 현실 공격 표면 좁음 + 오늘 사례 무관함으로 재확인됨. 별도 이월.
- `.min.js` 14 개 미연동 — **해결됨** (v3.5.3 에서 `git rm` 으로 전량 제거).

---

## [3.5.2] - 2026-04-22 — Harness Boundaries 문서화 (Known 해결)

### Fixed (v3.5.1 Known 3건 해결)
- **`architecture.html` Permission Gate tier 분류** — 2a PreToolUse 섹션을 "7중 가드 → 8중 가드" 로 수정. `permissionGate.js` 가 잘못 2b Agents 섹션에 배치되어 있던 것을 2a 로 이동하여 "훅(강제)" vs "에이전트(요청)" 경계를 명확화. 각 가드를 **Tier A (AST-filtered, Bash-only)** 와 **Tier B (Regex/path-based, Edit|Write)** 로 재분류.
- **rollback env 세션 중간 한계 문서화** — `docs/harness-boundaries.md §2` 에 정식 기록. Unix 프로세스 env 상속 모델상 세션 재시작이 필요하다는 사실과 올바른 rollback 절차 3 가지, 그리고 "세션 중간 rollback" 을 지원할 경우의 파일 기반 override 설계안 포함.
- **AST 필터 DQUOTE 한계 문서화** — `docs/harness-boundaries.md §1` 에 정식 기록. `shellContextTokenizer.js` 상단 주석의 drift 수정 (`@version 1.0.0 → 1.0.1`) — 기존 주석은 "$() 내부를 바깥 OUTSIDE 로 간주" 로 적혀있었으나 실제 구현은 STATE_DQUOTE 를 유지하여 "안쪽 literal 로 간주" 하는 상태. 정확한 동작과 향후 stack 도입 해결 경로 명시.

### Added (신규)
- `docs/harness-boundaries.md` — 하네스 경계·한계 통합 문서. 3 개 한계(DQUOTE nested substitution · rollback env 상속 · Edit/Write AST 미적용)의 증상·회피·해결 경로 기록. `architecture.html` 2a 섹션 note 에서 링크.
- `tests/catalog-integrity.sh` — 문서(README/COMMANDS/SKILLS/registry)의 수량 주장과 실제 파일 시스템의 drift 를 자동 검증하는 회귀 테스트. 8 개 check (에이전트 수, shared 수, 스킬 수, 커맨드 수, 훅 바인딩 수, 유니크 훅 수, 커맨드 개별 파일 존재, 스킬 개별 디렉토리 존재). Exit code 1 on drift.

### Changed (수정)
- `hooks/shellContextTokenizer.js` — `@version 1.0.0 → 1.0.1`: 상단 JSDoc 의 "command substitution 내부는 바깥 OUTSIDE 로 간주" 주석을 실제 동작(STATE_DQUOTE 유지로 literal 내부 분류) 과 일치하도록 정정. 기능 동작 변경 없음.
- `docs/architecture.html` 2a 섹션 — 가드 수 "7 → 8", Tier A/B 분류, `harness-boundaries.md` 참조 링크 추가.
- `README.md` — **전면 재구성**. v2.0.0 동결 카탈로그(구식 파일 목록 6 개 `build-service.md`/`deploy-service.md`/`dev-docs.md`/`save-and-compact.md`/`resume.md`/`config-backup.md` — 모두 실존하지 않음) 제거. 단일 진실원 참조 모델로 전환 (`agents-registry.json` / `SKILLS.md` / `COMMANDS.md` / `settings.json`). Hook Events 표를 실측 17 바인딩으로 재작성. Permission Gate Tier A/B 섹션 신규.
- `COMMANDS.md` — 누락되어 있던 `/commit-push-pr` 추가 (23 → 24 목록, 제목과 일치). 헤더에 실측 동기화 일자 주석.
- `SKILLS.md` — 제목에 "(30 개)" 명시, 구성 breakdown(도메인 20 + 공통 3 + 디자인 7) 추가, 실측 동기화 일자 주석.

### Fixed (문서-실측 drift)
- README.md Overview 테이블 — 에이전트 11 → 13, 스킬 21 → 30, 훅 바인딩 14 → 17, 유니크 훅 20 → 26 (실측 기반 재계수).
- Directory Structure — 실존하지 않는 commands 파일 6 개 나열 제거, v3.5.2 실제 구조로 교체.
- Version 2.0.0 기준 "hook events 표" → v3.5.2 실측 훅 체인으로 교체, 허브 위임 관계(postToolOrchestrator → 6 sub-hooks, stopEvent → backupGc·observationsRoller) 명시.

### Security
- **기능 동작 변경 없음** — 본 릴리즈는 순수 문서화 + 주석 정정. 가드 로직·테스트·회귀 페이로드 변경 없음. AST DQUOTE 한계의 실제 해결은 tokenizer stack 확장과 테스트 추가가 필요하며, 본 릴리즈 범위 밖.

### Metrics
- 테스트 추가 없음 (기능 동작 변경 없음). Top-level 52 테스트 유지.

### Known / Out of Scope (이월)
- `ethicalValidator.min.js` orphan — **상태 업데이트**: 실제 크기 10168 bytes 로 확인 (메모리에 기록된 "0 바이트" 는 구식 정보). `.min.js` 14 개 파일이 `settings.json` 에서 활성화되지 않아 **미연동 빌드 산출물** 상태. 활용(settings 교체) 또는 제거 결정 필요.
- AST DQUOTE 한계의 **실제 해결** (tokenizer stack 확장) — 본 릴리즈에서 문서화만, 구현은 이월.
- `.claude/README.md` / `COMMANDS.md` / `SKILLS.md` 카탈로그 드리프트 — 에이전트/스킬/훅/커맨드 수량이 실측과 불일치. 자동 생성 스크립트 또는 단일 진실원 확장 필요.

---

## [3.5.1] - 2026-04-22 — permissionGate AST Filter

### Changed (수정)
- `permissionGate.js` — `@version 1.0.0 → 1.1.0 (ast-filter)`:
  - `require("./shellContextTokenizer")` 추가
  - Bash 패턴 루프를 `pattern.exec` + global 복사본 순회로 변경
  - AST 필터 Bash 도구 전용 (Edit/Write file_path 는 shell source 가 아니므로 미적용)
  - `KIIPS_PERMISSION_GATE_AST=off` 환경변수로 AST 레이어 rollback

### Added (신규)
- **페이로드 3개** (AST 필터 검증):
  - `pg-allow-svn-docstring.json` — `git commit -m "... svn commit ..."` (dquote 내부)
  - `pg-allow-heredoc-docs.json` — heredoc 내 `./start.sh`/`./stop.sh` 언급
  - `pg-allow-comment-docs.json` — shell comment 내 `kill -9` 예시
- **hook-regression.sh 섹션 2개**:
  - permissionGate (AST filter active) — 3 페이로드 허용
  - permissionGate (AST rollback) — 동일 페이로드 차단 + real attack 여전히 차단
- **permission-gate.test.js 확장**: AST 필터 시나리오 8개 sub-test (literal/comment/heredoc/real-block)

### Fixed (수정)
- **Meta-level false positive**: v3.5.0 커밋 시 permissionGate 가 `git commit -m "... svn commit ..."` 메시지의 "svn commit" 문자열을 실제 명령으로 오판하여 커밋 차단. v3.4.0 에서 ethicalValidator 가 해결한 것과 동일한 구조적 문제 — shellContextTokenizer 재사용으로 근본 해결.

### Security
- AST 필터 적용 범위는 Bash 도구로 제한. Edit/Write 의 file_path 는 shell source 가 아니므로 기존 정규식 유지 (Advisor 지적 반영).
- Fail-closed 유지, rollback 경로 2종 제공 (전체 `KIIPS_PERMISSION_GATE=off` · AST 만 `KIIPS_PERMISSION_GATE_AST=off`).

### Metrics
- Top-level 테스트 **46 → 52** (+6)
- permission-gate.test.js sub-tests **30 → 38** (+8)

### Known / Out of Scope (업데이트)
- (해결) ~~permissionGate + shellContextTokenizer 통합~~ — 본 릴리즈에서 완료
- (해결 v3.5.2) ~~`ethicalValidator.min.js` 0바이트 orphan~~ — 실제 10168B 로 확인, 메모리 드리프트였음. 단 `.min.js` 14 개 미연동 이슈는 별도 이월.
- (해결 v3.5.2) ~~`architecture.html` Permission Gate tier 분류~~ — v3.5.2 에서 2a 8중 가드 재분류 완료.
- (해결 v3.5.2) ~~rollback env 의 세션 중간 한계(훅 spawn 시점 env 상속)~~ — `docs/harness-boundaries.md §2` 문서화 완료.
- (해결 v3.5.2 — 문서화만) ~~**AST 필터 한계 (신규)**: DQUOTE 내부의 `eval "cmd"` 또는 `"$(cmd)"` 같은 command substitution 은 실제 실행되지만 tokenizer 가 문자열 내부로 분류하여 skip~~ — `docs/harness-boundaries.md §1` + `shellContextTokenizer.js v1.0.1` 주석 정정 완료. **실제 해결(stack 확장)은 v3.5.2 범위 밖, 이월**.

---

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
