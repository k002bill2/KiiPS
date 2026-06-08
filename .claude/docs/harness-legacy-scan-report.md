# 🩺 harness-legacy-scan — AI 코딩 하네스 감사 리포트

> **읽기 전용 감사**. 이 리포트는 분석만 수행했으며 어떤 파일/설정/hook/MCP/권한도 변경하지 않았습니다.
> 모든 조치(KEEP/SHRINK/MOVE/SPLIT/CONVERT/DELETE)는 **후보 분류**이며, 실제 적용은 별도 단계에서 사람 승인 후 진행합니다.

| 항목 | 값 |
|------|-----|
| 워크플로우 | `harness-legacy-scan` (Dynamic Workflow, read-only) |
| 에이전트 | 77 (Inventory 1 · Analysis 31 · Planner 1 · Adversarial 44) |
| raw findings | 125 → dedup 후 **61 항목** (placeholder 2건 제외) |
| Adversarial 검토 | 44건 (uphold 12 · downgrade 25 · reject 7) |
| 읽기 전용 보장 | Explore/Plan 에이전트 타입(Edit/Write 도구 차단) + deny `rm`/`rm -rf` |

> ## ⛔ 사후 검증 정정 (POST-AUDIT CORRECTION) — 먼저 읽으세요
> 
> 인벤토리 단계(단일 스캐너)가 **추론을 증거로** 삼은 오판 2건을 grep 으로 검증해 정정했습니다. 원 주장을 지우지 않고 보존하되, 아래 정정이 우선합니다. (이것이 읽기 전용 감사 + adversarial + 검증 게이트의 핵심 가치입니다.)
> 
> **정정 1. ‘orphaned hooks 10개 = likely dead code’ → 전원 생존 (0 dead)**
> - 원 주장: Inventory anomaly #2 / category 'orphaned-hooks(10)': .claude/hooks/ 의 10개 훅이 settings.json 에 미와이어 → likely dead code.
> - 검증: `grep -nE "buildChecker|impactAnalyzer|observe|shellContextTokenizer|..." .claude/hooks/postToolOrchestrator.js .claude/hooks/stopEvent.js  +  ethicalValidator.js/permissionGate.js 의 require`
> - 증거: postToolOrchestrator.js(wired)가 autoFormatter(L28,148)·buildChecker(L29,158)·observe(L30,197)·agentStateManager(L31)·outputSecretFilter(L35,189)·themeCssVerGuard.sh(L171)·geminiAutoTrigger(L178)를 require/dispatch. stopEvent.js(wired)가 backupGc.sh(L154)·observationsRoller(L167) dispatch. shellContextTokenizer.js는 ethicalValidator.js(L49)+permissionGate.js(L42)가 require하는 공유 AST 라이브러리(isRealCodeMatch/isWellFormed 핵심).
> - ✅ 결론: 10개 전원 LIVE. ‘settings.json 직접 미등재 ≠ dead’ — KiiPS 훅은 통합 디스패처(postToolOrchestrator/stopEvent) 패턴. **이 10개는 삭제·축소 후보가 아니라 KEEP.** Adversarial 레이어가 해당 항목(P63)을 이미 SHRINK→KEEP 으로 자동 반전했고(‘orphan classification is a scanner artifact’), advisor 검토 + grep 으로 최종 확정.
> 
> **정정 2. ‘.min.js 4종 = 소스/미니파이 둘 다 미와이어’ → 소스 .js 는 와이어/생존, .min.js 만 미사용 중복**
> - 원 주장: Inventory anomaly #3: 4개 .min.js 목적 불명, 소스/미니파이 모두 미와이어.
> - 검증: `settings.json hooks 블록 파싱 + grep "\.min\.js" .claude/settings.json`
> - 증거: settings.json 은 소스 `.js`(ethicalValidator.js·permissionGate.js·postToolOrchestrator.js 등)를 와이어. `.min.js` 는 settings.json 어디에서도 참조되지 않고, 와이어된 `.js` 들은 `shellContextTokenizer`(=.js)를 require.
> - ✅ 결론: 소스 `.js` 4종은 **와이어/생존**(원 주장 일부 오류). `.min.js` 4종(ethicalValidator/permissionGate/postToolOrchestrator/shellContextTokenizer)은 **미사용 미니파이 중복** — 저위험 정리 후보. 단 외부 빌드 스텝이 재생성/소비하지 않는지 1회 확인 후 처리.
> 
> ⚠️ **‘stale fact’ 주장 주의**: 섹션 1·3·5의 일부 근거(포트 8301/8501, RealGrid 버전, 디렉토리명, 줄 수, 특정 클래스 존재 여부 등)는 27개 per-skill 에이전트(sonnet)의 회상에 기반합니다. MyBatis-XML-부재처럼 프로젝트 메모리와 일치하는 항목도 있으나 **전부 검증된 것은 아닙니다**. 적용(apply) 단계에서 각 ‘stale fact’를 대상 파일로 스폿체크한 뒤에만 조치하세요 — sonnet 회상을 ground truth 로 취급 금지.

_(planner dedup 추적용 placeholder 2건 [P25, P31] 은 렌더링에서 제외 — 실제 항목 수 61.)_

### 조치 분포 (planner 분류)

| 조치 | 개수 | 의미 |
|------|------|------|
| KEEP | 9 | 현행 유지 |
| SHRINK | 28 | 길이/중복 축소 |
| MOVE | 7 | 전역→on-demand Skill 등으로 이동 |
| SPLIT | 10 | SKILL.md → reference.md/examples.md 분리 |
| CONVERT | 6 | 커스텀 → 제품 네이티브 기능으로 대체 |
| DELETE | 1 | 삭제 후보 |
| **합계** | **61** | |

- **사람 승인 필요(위험)**: 45건
- **/harness-diet 자동 처리 가능(low-risk)**: 1건

### 인벤토리 스냅샷 + 이상 징후

| 카테고리 | 개수 | 비고 |
|----------|------|------|
| user-authored-rules | 9 | Core decision rules for KiiPS development: dark-theme.md, editing.md, error-handling.md… |
| user-authored-skills | 27 | 27 skill directories: 21 domain (kiips-backend, kiips-build, kiips-button-guide, kiips-… |
| user-authored-hooks-wired | 17 | Active hooks wired in settings.json: ethicalValidator.js, gemini-bridge.js, geminiRevie… |
| ~~orphaned-hooks~~ → **indirectly-wired-hooks** | 10 | ❌ 오판 정정: 10개 전원 LIVE (postToolOrchestrator/stopEvent dispatch + shellContextTokenizer는 보안훅이 require). ‘정정 1’ 참조. |
| hook-minified-duplicates | 4 | ⚠️ .min.js 4종만 미사용 중복(저위험 정리 후보). 소스 .js 는 와이어/생존. ‘정정 2’ 참조. |
| user-authored-commands | 24 | All 24 commands in .claude/commands/ are registered in commands-registry.json and prope… |
| user-authored-agents | 13 | 13 agents registered in agents-registry.json: build-manager, checklist-generator, code-… |
| user-authored-workflows | 1 | Single workflow: .claude/workflows/deep-research.js |
| harness-configuration | 3 | Core config files: settings.json (559 lines, active), settings.local.json (local overri… |
| product-default-cursor-plugin | 1 | .cursor/skills/agentation/SKILL.md is the only Cursor-specific harness element. Full .c… |
| operational-logs | 8 | Generated runtime artifacts (safe to delete): hook-debug.log, hook-errors.log, security… |
| learning-and-memory | 14 | Observational data: .claude/memory/ (7 pattern files), .claude/learning/ (7 files + ins… |
| registries | 3 | Auto-generated catalogs: skills-registry.json (26 entries), commands-registry.json (24 … |
| documentation | 7 | Reference docs: CLAUDE.md (root), SKILLS.md, README.md, COMMANDS.md, CHANGELOG.md, PORT… |

**🚨 이상 징후 (Inventory Agent 탐지):**

1. CRITICAL: kiips-operator-onboarding skill exists in .claude/skills/ directory but is NOT registered in .claude/skills-registry.json (26 registered vs 27 on disk). Skill will not be discovered by harness.
2. ORPHANED HOOKS: 10 hook files (.claude/hooks/) are not wired in settings.json: agentStateManager.js, autoFormatter.js, backupGc.sh, buildChecker.js, geminiAutoTrigger.js, observationsRoller.js, observe.js, outputSecretFilter.js, shellContextTokenizer.js, themeCssVerGuard.sh. These are likely dead code. — ❌ **정정됨: 위 ‘정정 1’ 참조. 10개 전원 LIVE(통합 디스패처 경유). dead code 아님 → 삭제 금지.**
3. MINIFIED DUPLICATES: 4 .min.js files in hooks/ have no clear purpose; neither minified nor source versions are wired: ethicalValidator.min.js, permissionGate.min.js, postToolOrchestrator.min.js, shellContextTokenizer.min.js. — ⚠️ **부분 정정: 위 ‘정정 2’ 참조. 소스 .js 는 와이어/생존; .min.js 만 미사용 중복.**
4. MCP CONFIG SPLIT: Two MCP config files exist - empty .mcp.json at root and populated .claude/mcp.json (filesystem+obsidian). Active config is in .claude/mcp.json.
5. .CURSOR SKEW: .cursor/skills/agentation/SKILL.md exists (Cursor-specific skill) but .cursor lacks the 27 skills and 9 rules present in .claude/. No .cursor/rules/ directory exists.
6. DOCUMENTATION DRIFT: SKILLS.md header claims sync as of 2026-05-11, registry.json also dated 2026-05-11, but kiips-operator-onboarding is missing from registry. Integrity test should have caught this.
7. OPERATIONAL LOGS (8 files): Hook logs, gemini-bridge logs, and test baselines accumulate in .claude/. These are generated artifacts, safe to clean periodically.

---

## 1. 전체 요약

하네스는 풍부하지만 과적재 상태다: 9개 always-on rules 중 다수가 작업 한정 규칙이거나 hook이 이미 기계적으로 강제하는 내용을 산문으로 재서술해 verification/anti-rationalization/editing/ralph-loop 4중 중복의 허브를 형성한다. 27개 skill 중 상당수가 실재하지 않는 기술 전제(MyBatis XML, BusinessException, StringUtils 커스텀 클래스)나 stale fact(포트 8301/8501, 디렉토리명, RealGrid 버전, 줄 수 테이블)를 담고 있어 정확성 위험이 크며, 다수가 300줄 SPLIT 임계를 초과한다. 가장 큰 단일 절감 기회는 2026-06-18 sunset 예정인 Gemini CLI 스택(gemini-bridge.js 781L + geminiAutoTrigger.js 547L + geminiReviewGate.js + gemini-scan 커맨드 + settings.json allow 패턴 3개, 호출량 8/900으로 사실상 미사용)을 네이티브 Subagent/code-review/security-review로 대체하며 통째로 제거하는 것이다. 두 번째는 always-on 컨텍스트 세금 절감(CLAUDE.md가 Dark Theme/Validation/Power Stack 등 작업 한정 규칙을 항상 주입)이고, 세 번째는 규칙군의 중복 제거(검증·반합리화·편집·Ralph 게이트가 hook 코드 + 룰 문서 + 상호 cross-link로 3~4중 표현)다. 권한/hook/MCP/보안 항목은 모두 harness_diet_auto=false로 두어 사람 승인 게이트를 유지했다.

---

## 2. 유지해야 할 항목 (KEEP)

#### P3 · `.claude/hooks/buildChecker.js`

- **현재 목적**: 동일 파일 3회 편집/연속 빌드 3회 실패/에러 시그니처 3회 변경(A→B→C) 감지 후 HALT+자동 롤백. errorSignatureHistory 카운터, computeErrorSignature.
- **발견한 문제**: 문제 아님 — 네이티브 대응 기능 없음. Claude Code는 반복편집/빌드실패 연쇄/에러시그니처 변동 감지+자동 롤백 메커니즘을 제공하지 않음. '반복되는 실제 실수'를 막는 정당한 안전망. 임계값은 env로 이미 튜닝 가능. (다만 현재 settings.json에 wire되지 않은 orphaned hook으로 보고됨 — 와이어링 확인 필요.)
- **근거**: buildChecker.js L40-41 RALPH_LOOP_ATTEMPTS/SHIFTS env 튜닝, L49 computeErrorSignature 고유 로직. 관측된 네이티브 기능 목록에 반복편집/롤백 감지 없음. 인벤토리: orphaned-hooks 목록에 buildChecker.js 포함(미와이어 의심).
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 안전망 메커니즘 유지; 단 orphaned 보고와 postToolOrchestrator 통합 주장이 충돌하니 실제 wire 경로만 사람이 확인.

#### P18 · `.claude/skills/kiips-quality/SKILL.md`

- **현재 목적**: 웹 접근성(WCAG 2.1 AA) + 반응형 디자인 검증 통합 스킬(disable-model-invocation, 67L). kiips-a11y-checker+kiips-responsive-validator 병합본.
- **발견한 문제**: 문제 없음 — 4기준 통과. verify 그룹과는 키워드 충돌일 뿐 커버리지 비교차(a11y/반응형 vs 빌드/테스트/보안). JSP/Bootstrap/WCAG 기준 현용, 트리거 도메인 한정, 67줄로 SPLIT 불필요, disable-model-invocation 적절.
- **근거**: 67줄. disable-model-invocation: true(line 4). 트리거 '접근성, WCAG, ARIA, 반응형, responsive, 모바일, 브레이크포인트, 터치 타겟, a11y'. verify와 겹치는 항목 0.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 변경 불필요.

#### P19 · `.claude/skills/kiips-page-harness/SKILL.md`

- **현재 목적**: 신규 JSP 페이지 자동 생성 3-agent 파이프라인(Plan→Generate→Evaluate) 오케스트레이터. 310L.
- **발견한 문제**: 문제 없음 — 4기준 통과. page-harness/page-pattern-guide/ui-component-builder/stitch-bridge 4종은 'NOT for:' 상호배제 + SoT 위임으로 경계가 명시 해소된 모범 사례. 310줄이나 reference.md(169L) 이미 분리, 프롬프트 템플릿(126L)은 런타임 운영 지시문이라 추가 SPLIT은 위험>실익. 참조 항목 전부 현존. disable-model-invocation 미설정도 오케스트레이터로서 적절. 단 description의 '신규 화면' 단축형이 약간 넓음(skills-registry는 '신규 화면 자동 생성'으로 교정됨).
- **근거**: 310줄. reference.md 169줄 존재(line 307-310 링크). description line 3 '신규 화면' 단독 vs registry line 655 '신규 화면 자동 생성'. NOT for: 명시. kiips-evaluation-criteria.md·Part 10-A 현존.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. (선택) SKILL.md line 3 '신규 화면'을 registry와 동일하게 '신규 화면 자동 생성'으로 동기화하는 미세 조정만.

#### P27 · `.claude/commands/kiips-linked-approval-template.md`

- **현재 목적**: 결재 연계 문서 HTML 템플릿 생성 슬래시 커맨드(14L) — 동명 스킬(208L) 로드 thin wrapper.
- **발견한 문제**: 문제 없음 — 모범적 thin entry. 커맨드 전문이 스킬 Step 0~5 절차를 가리키기만 하고 본문 복제 없음. 정찰 의심 대비 실제 중복 거의 없음.
- **근거**: 커맨드 전문이 '스킬 로드하여 가이드라인 참조 + 입력 확인 + Step 0~5 절차 위임'. 본문 복제 없음.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 모범 패턴.

#### P29 · `.claude/commands/periodic-cleanup.md`

- **현재 목적**: 주기적 코드 위생 GC 스캔/리포트 커맨드(152L).
- **발견한 문제**: instinct-gc(183L, instinct archive)와 'garbage collection' 키워드 공유하나 대상 도메인 상이(코드 위생 vs instinct GC). 실제 커버리지 중복 미미 — 경계 명확화(NOT for 추가) 수준 권장. 낮은 신뢰도.
- **근거**: periodic-cleanup 'scan and report code hygiene'. instinct-gc 'archive stale/low-confidence'. 키워드 공유, 도메인 상이.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 낮음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 유지. (선택) description에 'NOT for: instinct GC(use instinct-gc)' 한 줄 추가로 혼동 방지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 조치 자체는 KEEP 유지가 타당(파일 변경 없음, no-op). 단 harness_diet_auto=true 자동 처리는 해제해야 한다. 이유: (1) 항목의 기록된 근거('도메인 상이/중복 미미')가 파일 실독으로 반증됨 — 거짓 근거가 자동 통과 레인을 타선 안 된다. (2) plan_note의 'NOT for: instinct GC(use instinct-gc)' 경계 문구도 부정확하다 — periodic-cleanup은 Phase 3에서 실제로 instinct GC를 한다. 정확한 경계 문구는 'Phase 3/4는 instinct-gc 로직과 중복 — 심층 instinct GC는 /instinct-gc 직접 사용'이다. (3) 중복에 대한 올바른 정리는 DELETE/병합이 아니라 SHRINK-to-delegate, 즉 Phase 3/4 본문에서 archiving 규칙·요약 파일명을 재기술하지 말고 '/instinct-gc 위임'으로 바꿔 단일 진실원천(SSOT)을 instinct-gc로 두는 것이다. 이는 사람 검토가 필요한 리팩토링 제안이지 자동 조치가 아니다. defense-in-depth 관점: Phase 1-2(코드 위생/규칙 스캔)는 instinct-gc가 제공하지 않는 보장이므로 제거 시 재발 위험(미사용 import/빈 catch/방치 TODO 누락)이 생긴다 — 따라서 보수적으로 둘 다 보존.

#### P41 · `.claude/hooks/ethicalValidator.js (PreToolUse Bash|Edit|Write, settings.json L3-12)`

- **현재 목적**: rm -rf/DROP/curl|bash/하드코딩 자격증명 등 파괴적·위험 작업을 PreToolUse에서 차단(fail-closed).
- **발견한 문제**: 문제 없음. Bash|Edit|Write 광범위 matcher는 '변형 도구 전체 커버'로 적절. shellContextOnly+isShellContext로 Edit/Write false positive 좁힘, AST 토크나이저로 literal/comment 오탐 제거. 반복 사고(파괴 명령)를 차단하는 핵심 안전망.
- **근거**: ethicalValidator.js L73-138 BLOCKED_OPERATIONS, isShellContext(L141+), exit(2) 차단. shellContextTokenizer AST 적용.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 핵심 안전망.

#### P42 · `.claude/hooks/postToolOrchestrator.js (PostToolUse Bash|Edit|Write, settings.json L88-97)`

- **현재 목적**: PostToolUse 검증 6종(autoFormatter/buildChecker/scss/geminiAutoTrigger/observe/outputSecretFilter)을 단일 Node 프로세스에서 순차 실행.
- **발견한 문제**: 문제 없음. Bash|Edit|Write 광범위 matcher는 6개 spawn을 1개로 통합한 의도된 오케스트레이터로 마찰 저감 목적. 단 scssValidator 이중실행(P40)만 정리 필요.
- **근거**: postToolOrchestrator.js 헤더 L4-19 통합 목록, '6 프로세스 → 1 프로세스'. settings.json PostToolUse Bash|Edit|Write 등록.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. P40의 scssValidator 이중실행만 정리.

#### P43 · `.claude/settings.local.json (permissions.allow WebFetch domain entries, L37-44)`

- **현재 목적**: api.anthropic.com/registry.npmjs.org/github.com/api.github.com/downloads.claude.ai/datadog/mcp-proxy 도메인 한정 WebFetch 허용.
- **발견한 문제**: 문제 없음. WebFetch가 domain: 스코프로 한정되어 광범위 권한 아님. 임의 호스트 fetch가 아니라 명시 도메인만 허용 — 적정 범위.
- **근거**: settings.local.json L37-44 모두 WebFetch(domain:...) 형태. 와일드카드/임의 도메인 없음.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 도메인 한정 적정.

#### P62 · `.claude/skills/kiips-search-filter-guide/SKILL.md`

- **현재 목적**: 검색필터 종합 가이드(MainComponent, Constant, inc_filter_main.jsp, 탭 동적 필터). 275L, reference.md(152L)+examples.md(70L) 분리됨.
- **발견한 문제**: 문제 없음 — 4기준 통과. 참조 파일(MainComponent.java/Constant.java/inc_filter_main.jsp/search_condition_main.jsp) 전부 실존, 트리거 KiiPS 특화 한정, 275줄로 임계 미만+사전 SPLIT 완료, disable-model-invocation 미표시 적절(가이드형).
- **근거**: find: MainComponent.java/Constant.java/inc_filter_main.jsp/search_condition_main.jsp 실존. wc -l 275. reference.md 152L, examples.md 70L. 트리거 '검색조건, 검색필터, SEARCH_CONDITION, MainComponent, 필터, inc_filter_main'.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 변경 불필요.

---

## 3. 줄여야 할 항목 (SHRINK)

#### P2 · `.claude/rules/ralph-loop-detection.md`

- **현재 목적**: Ralph Loop(반복편집/빌드실패/에러시그니처 변경) 임계값과 5단계 롤백 프로토콜을 산문으로 문서화.
- **발견한 문제**: 여기 적힌 로직은 전부 buildChecker.js/multiFileGate.js가 이미 기계적으로 강제 — 산문은 hook 동작의 중복 문서일 뿐 모델 행동을 바꾸지 않음. anti-rationalization.md line 49-52가 같은 3트리거를 또 요약해 3중 표현(hook 코드+이 파일+anti-rat 요약).
- **근거**: 57줄. line 9/14/21 임계값 3 = buildChecker.js(RALPH_LOOP_ATTEMPTS default 3, errorSignatureHistory)·multiFileGate.js(THRESHOLD=3). 트리거 매트릭스 line 33-39 = anti-rationalization.md line 49-52 중복. line 48-53는 hook 파일명 나열.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: hook 동작 중복 산문 제거, '자동 강제는 buildChecker.js 참조' 한 줄로 축약; 메커니즘 자체는 P3에서 KEEP.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Downgrade, not reject: trimming IS warranted, but NOT as the plan_note scopes it. A naive executor following "hook 동작 중복 산문 제거, buildChecker.js 참조 한 줄로 축약" would delete load-bearing content. Restrict the SHRINK to ONLY the genuinely duplicated trigger matrix (lines 33-39) and the redundant hook-filename inventory (lines 48-53). KEEP: trigger #1-3 descriptions (lines 6-21) — #1 has no hook backing at all; the 5-step rollback protocol (23-31) — exists nowhere else and is cited by buildChecker.js line 139 at runtime; the 절대 금지 recovery discipline (41-46) — behavioral, not hook-enforced. This preserves audit principle (1) block real recurring mistakes and (4) prefer SHRINK over DELETE when unsure, while preventing a circular dangling reference. Risk is medium, not the claimed low: the file is a hard runtime dependency of buildChecker.js (line 139), so a wrong edit breaks the model's cited recovery path during an active Ralph Loop — the worst possible moment.

#### P4 · `.claude/rules/verification.md`

- **현재 목적**: 증거 기반 완료(실행 증거 없이 완료 선언 금지) + IDENTIFY/RUN/READ/VERIFY/CLAIM 게이트 + KiiPS 검증 체크리스트 표. CLAUDE.md Key Rules #4(line 21) 라이브 링크.
- **발견한 문제**: 동일 검증 게이트를 4가지 포맷으로 반복(함수형 5단계+체크리스트표+금지표현표+적용시점) — 9개 rules 중 최장 82줄. 금지표현표는 anti-rationalization.md 합리화표 및 superpowers:verification-before-completion과 의미 중복. line 43 다크테마 항목은 dark-theme.md 중복. 단 KiiPS 특화 검증표(mvn package=BUILD SUCCESS, grep '${' *.xml, SCSS 컴파일, 포트 curl)는 플러그인에 없는 고유 도메인 지식이라 가산적 → KEEP. 별개 안전망 레이어라 verify command/agent와는 중복 아님.
- **근거**: 82줄. 검증 게이트 line 19-29/33-43/49-59/63-71 4중 반복. red-flag표(49-59) = anti-rationalization.md line 7-17. KiiPS 검증표 line 31-44는 프로젝트 고유. superpowers:verification-before-completion 존재.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 범용 서문/금지표현표는 superpowers:verification-before-completion 참조로 대체, 4중 반복을 1포맷으로, KiiPS 검증표만 유지. 안전망이라 자동처리 금지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 자체는 유지하되 범위를 좁힌다. 안전: 4중 반복 게이트 게이트(line 19-29/33-43/49-59/63-71)를 1포맷으로 축약, KiiPS 검증표(line 31-44, mvn=BUILD SUCCESS/grep '${'/SCSS/curl)는 KEEP — 이것은 superpowers에 없는 고유 도메인 지식이자 /check-rules·stopEvent 훅의 참조 대상이라 절대 제거 금지. 변경: 원안의 '범용 서문/금지표현표를 superpowers 참조로 대체'는 채택하지 말 것. 대신 compact한 self-contained 인라인 게이트(IDENTIFY/RUN/READ/VERIFY/CLAIM 5단계 핵심 + red-flag 최소 essence)를 파일 내에 유지하라. 이유: Stop 훅이 이 파일을 경로로 직접 가리키므로(구조 파싱이 아닌 path 참조라 파일 존재+실행 가능 게이트만 있으면 훅은 안 깨짐) 착지 지점은 즉시 실행 가능한 deterministic 내용이어야 한다. superpowers 참조는 '추가 심화 자료' 링크로만 부기. 결과: 82줄 → 약 35-45줄, 안전망(deterministic 인라인 게이트+KiiPS표) 보존, 진짜 중복(4중 포맷 반복)만 제거. 자동처리 절대 금지(harness_diet_auto는 false 유지가 필수).

#### P5 · `.claude/rules/anti-rationalization.md`

- **현재 목적**: 합리화 표현 차단 + 수술적 변경(요청 범위만 수정) 원칙. CLAUDE.md Key Rules #5(line 22) 링크.
- **발견한 문제**: 삼중 중복의 허브. (1) line 49-52 Ralph 요약 = ralph-loop-detection.md 재서술(line 4·52·56·57 cross-link 4회). (2) line 32-37 수술적 변경 = editing.md line 14-20 동일 지시. (3) line 7-17 합리화표 = verification.md red-flag표 중복. (4) line 19-30 HARD-GATE는 multiFileGate.js·permissionGate.js가 이미 강제하는 산문 재서술. KiiPS표 MyBatis ${} 항목은 mybatisBindingGuard.js가 이미 차단.
- **근거**: 60줄. line 49-52 Ralph 3트리거 = ralph-loop-detection.md line 33-39. line 32-37 = editing.md line 19. line 24 'multiFileGate.js 자동 강제' 명시. line 39-47 KiiPS표.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: Ralph 요약·HARD-GATE·MyBatis 항목(hook 중복) 제거, 수술적 변경은 editing.md로 단일화, 합리화표는 verification.md와 1곳만 유지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Keep SHRINK but narrow it to only the empirically hook-redundant parts. Safe to remove: the pom.xml and app-properties rows of the high-risk gate, since permissionGate.js confirms a hard block, and the surgical-change principles at lines 32 to 37 which duplicate editing.md and can be reduced to a pointer. Must preserve: the multi-file change gate prose because multiFileGate.js is WARN only and fail-open so the prose is the only real enforcement layer; the KiiPS-COMMON and UTILS and MyBatis mapper SQL rows because impactAnalyzer and the binding guard are WARN only or fail-open so the hooks give no equivalent guarantee; the binding table row kept as a one-line pointer because the guard is fail-open plus whitelisted and the prose carries follow-up guidance. The rationalization table may be deduped to one location with verification.md, but since this file is the canonical Key Rule five link target, moving the table requires repointing the CLAUDE.md link or the entry point breaks. The triple-duplication-hub diagnosis is overstated; much of the apparent overlap is defense in depth over fail-open or warn-only hooks. harness_diet_auto false is correct and an uncritical harness-diet pass would strip live safety nets.

#### P6 · `.claude/rules/editing.md`

- **현재 목적**: 편집 범위 제한 + Revert/변경관리 + Golden Principles(불변성, 비밀값 환경변수) + 파일유형별 주의표.
- **발견한 문제**: anti-rationalization.md 수술적 변경 원칙과 같은 지시를 다른 말로 반복(line 7-12, 14-20). 파일유형표(line 36-42 JSP/SCSS/MyBatis #{} vs ${})는 anti-rationalization.md line 41-47 및 verification.md 체크리스트와 겹침. 자체 내부도 '관심사 분리'·'최소 편집'을 line 1-12와 14-20에서 두 번 말함.
- **근거**: 42줄. line 19 '버그+리팩토링 혼합 금지' = anti-rationalization.md line 37. line 9 '벌크 편집(10+)' = anti-rat HARD-GATE(3+)와 임계값만 다른 같은 취지. line 36-42 = anti-rat line 41-47.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 수술적 변경 원칙을 이 파일을 단일 정본으로 통합(anti-rat에서 제거), 내부 중복 2섹션→1, 파일유형표는 verification 검증표와 1곳만.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 방향 자체는 유지하되 범위를 대폭 축소한다. 안전한 SHRINK는 editing.md '내부' 중복만이다: line 7-12(Editing Rules)와 line 14-20(Revert & Change Management)에 두 번 나오는 '범위 제한/최소 편집/관심사 분리'를 1개 섹션으로 통합. 단, 다음은 절대 금지: (a) anti-rationalization.md에서 수술적 변경 원칙 제거 — 참조 토폴로지가 anti-rat를 정본으로 고정하고 있어 제거하면 CLAUDE.md/훅/4개 규칙파일 참조가 깨진다. (b) '벌크 편집(10+)'과 'HARD-GATE(3+)' 통합 — 점진적 롤아웃과 기계강제 승인게이트는 별개 동작이라 병합 시 안전망 손실. (c) 파일유형표 1곳 통합 — 편집전/주장전/발견시 3개 결정 시점에 대한 의도된 다층 방어라 제거하면 그 시점의 가드가 사라진다. 즉 cross-file 병합(원안)→내부 중복만 정리(보수안)로 다운그레이드. harness_diet_auto=false라 무비판적 자동처리 위험은 낮지만, 원안 plan_note의 임계값 동일성 주장이 사실오류이므로 자동 실행 금지가 마땅하다.

#### P10 · `.claude/rules/svn-workflow.md`

- **현재 목적**: KiiPS는 Git 아닌 SVN — 명령어 매핑과 커밋 메시지 규칙. CLAUDE.md Key Rules #3(line 20) 링크.
- **발견한 문제**: 'SVN 사용' 한 줄 사실은 Claude의 반복되는 git 명령 실수를 막는 고가치 KEEP. 다만 line 13-21 SVN 명령어 표(up/status/diff/commit/revert/add/log)는 표준 SVN 일반지식이라 장황 — 매 세션 전역 보유 불필요. 핵심 한 줄(Git 아닌 SVN, app-local.properties 커밋 금지)만 유지하면 됨.
- **근거**: 38줄. line 13-21 명령어표 7줄은 저비용 일반지식. 핵심은 line 1 'Git 아닌 SVN' + line 37 'app-local.properties 커밋 금지'. CLAUDE.md line 20이 이미 한 줄 요약 보유.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 명령어 표 제거, 'Git 아닌 SVN + app-local.properties 커밋 금지' 핵심만 유지.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the conservative action. KEEP line 3 (Git not SVN), line 37 (app-local ban - sole enforcement, permissionGate.js does not cover app-local), line 38 (production confirm). REMOVE lines 11-21 table and lines 23-32 commit-message rules.

#### P11 · `CLAUDE.md`

- **현재 목적**: 항상 로드되는 프로젝트 루트 가이드 — Quick Reference, Key Rules Top5, Rules 카탈로그(always-on 링크 5개), Tech Stack.
- **발견한 문제**: Rules 카탈로그(line 24-32)가 작업 한정 규칙(Dark Theme line 28/Validation line 31/Power Stack line 32)까지 always-on 노출 — 이들은 on-demand Skill로 가야 함(P1/P7/P8). 본문 자체는 이미 경량(48줄)이라 KEEP 가치 높음. 추가로 line 9에 ':KiiPS-SERVICE' placeholder 모듈명이 남아 있어 실재 모듈(KiiPS-FD/IL 등)과 불일치.
- **근거**: 48줄. line 24-32 카탈로그 5행 중 Dark Theme/Validation/Power Stack 작업 한정. line 16-22 Key Rules Top5는 고가치 유지. git 85eac0c: 231→91줄 경량화 이력. line 9 ':KiiPS-SERVICE' placeholder.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 카탈로그에서 Dark Theme/Validation/Power Stack 행 제거, line 9 ':KiiPS-SERVICE' placeholder를 실제 모듈명으로 교정.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SPLIT` · 사람승인필요
  - 반박근거: Not uphold: the prescription orphans Power Stack (no skill, no scan coverage, sole discovery surface = CLAUDE.md line 32) and mis-fixes the build line (no single correct module; line 9 was an intentional per-developer template, marked [빌드담당자] and commented, that b4e354e wrongly uncommented). Not reject: the Dark Theme row trim is genuinely safe (kiips-scss skill covers discovery; /check-rules reads dark-theme.md directly so the scan and the scss-dark-theme-selector instinct survive the catalog-link removal), and the placeholder IS a real defect. Therefore SPLIT into independent dispositions: (a) Dark Theme row removal = safe to apply; (b) Validation row removal = borderline, /check-rules still fires on validation.md but skill overlap (legacy-compliance-checker) is weak on Boundary validation, so keep unless P7 skill confirmed; (c) Power Stack row = KEEP until P8 actually ships a triggering skill, since it is the only always-on pointer to power-stack.md; (d) placeholder = fix as a TEMPLATE (restore ':<your-module>' or the [빌드담당자] marker), NOT a hardcoded module name. Note: the audit's stated risk 'scan breaks' would be a factual error — the scan does not break; the real risk is silent loss of Power Stack discoverability.

#### P13 · `.claude/commands/simplify-code.md + .claude/skills/code-simplifier/SKILL.md + .claude/agents/code-simplifier.md`

- **현재 목적**: Java 코드 복잡도 분석/단순화. 커맨드(231L, Boris Cherny 스타일) + 스킬(52L) + 에이전트(555L, tools+model) 3중 구조.
- **발견한 문제**: 동일 기능이 커맨드+스킬+에이전트 3중 존재하며 복잡도 임계값(Cyclomatic>10, Nesting>3, Method>50)·리팩토링 전략(Extract Method/Guard Clauses/DRY)·안전보장을 각자 재정의. 에이전트(555L, 실행 정본)가 정본이어야 하고 스킬은 트리거+포인터, 커맨드는 thin wrapper면 충분. 추가로 스킬 description 트리거 '개선'/'improve'가 과도하게 포괄적이라 코드 단순화와 무관한 개선 요청에도 오발동.
- **근거**: 커맨드 헤더가 '서브에이전트와 동일 기능' 자인. 임계값 표가 skill·agent·command 3번 반복. SKILL.md line 3 'Use when: ...개선, improve'. kiips-button-guide·kiips-page-harness도 '개선' 키워드 보유 → 동시 트리거 충돌.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 에이전트를 단일 정본으로 두고 스킬/커맨드는 임계값·전략 본문 제거 후 포인터화; 스킬 트리거에서 '개선'/'improve' 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 핵심 관찰(임계값표 Cyclomatic>10/Nesting>3/Method>50 + Extract Method/Guard Clauses/DRY 전략 본문 3파일 실제 중복; 커맨드 line9 '서브에이전트와 동일 기능' 자인)은 사실이라 통합 자체는 타당. 다만 원본 action 그대로는 위험 → 범위 축소+사람 게이트: (A) 에이전트를 단일 정본 유지. (B) 커맨드/스킬에서 임계값표·전략 예시 코드 중복 본문만 제거하고 에이전트로 포인터화, 커맨드 인자 UX(파일/디렉토리/--recent/--apply) 보존. (C) Safety Guarantees(동작 보존·적용 전 승인·테스트 통과·SVN 롤백)는 실제 Write/Edit 수행 autonomous haiku 에이전트 표면에 유지(반복 실수 방지 가드, 안전망 보수적). (D) '개선/improve 트리거 제거' 하위 액션 폐기: 근거 반증됐고 disable-model-invocation:true 라 실효 0, 명시 호출 해소만 깨뜨림. (E) harness_diet_auto=false 로 자동 다이어트 제외. 확신 부분적이라 DELETE 아닌 SHRINK 선호.

#### P15 · `.claude/commands/diagnose.md`

- **현재 목적**: 진단 우선 디버깅 커맨드 - 코드 변경 전 근본 원인 파악(Phase1 READ ONLY).
- **발견한 문제**: error-handling.md(P9) 디버깅 프로토콜과 동일 원칙(근본원인 우선, 한 번에 하나, 악화 시 되돌리기)을 재진술. rule↔command 경계 중복. (P9에서 error-handling을 diagnose로 흡수하기로 했으므로 여기는 정본 수용처가 됨.)
- **근거**: diagnose: '코드 변경 전 진단 보고서 먼저', 'Phase 1 READ ONLY'. error-handling.md: 근본원인 우선/한 번에 하나/악화 시 중단 6단계.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: error-handling.md 흡수 후 단일 정본화; 중복 절차 문구 정리하고 KiiPS 캐시 삭제 금지 항목만 추가.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) · 사람승인필요
  - 반박근거: 절차 문구(근본원인 우선/한 번에 하나/악화 시 되돌리기)의 텍스트 중복은 실재하지만, 그것이 자동 SHRINK-흡수를 정당화하지 못한다. error-handling.md는 사용자 개입 없이 어느 세션에서나 발동하는 상시 rule 가드레일이고 /diagnose는 명시 호출형 커맨드다 — 계층이 다르다. 흡수하면 '/diagnose 미호출 세션'에서 근본원인-우선 가드레일과 특히 '캐시 삭제 금지'라는 파괴적-행동 안전망이 사라진다. 따라서 두 파일을 모두 KEEP(none)하고 자동 흡수를 막는다. 정 통합한다면 값싼 rule을 정본으로 두고 diagnose가 참조하는 방향으로, 사람 감독하에만 진행해야 한다. harness_diet_auto=true 는 즉시 false 로 내려야 할 위험 신호다(파괴적-행동 안전망 건드림). uphold는 불가, reject도 방어 가능하나 '절차 중복은 실재'한다는 관찰은 유지되므로 downgrade가 더 정확하다.

#### P16 · `.claude/commands/verify.md + .claude/agents/verify-agent.md`

- **현재 목적**: Fresh-Context 검증 커맨드(60L) - verify-agent(187L)를 별도 컨텍스트로 소환하는 진입점.
- **발견한 문제**: 진입점/실행자의 의도된 계층 분리이나, 검증 파이프라인 순서(Compile→Build→Test→Security)·Read-Only·증거 필수·mvn compile -pl 명령이 커맨드와 에이전트 양쪽에 정의되어 일부 중복. verification.md(P4)는 별개 안전망이라 역할 구분됨(중복 아님).
- **근거**: command와 verify-agent 모두 'Compile→Build→Test→Security 고정', Read-Only, 증거 필수, mvn compile -pl 각자 기술.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 파이프라인 순서 정의를 verify-agent에 단일화, 커맨드는 thin wrapper(에이전트 소환만)로 축소.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 중복 전제는 유효하므로 reject는 아니지만, 명세된 SHRINK('에이전트 소환만')는 dedup이 아니라 회귀다. command의 $ARGUMENTS 파싱과 파라미터화된 에이전트 프롬프트(라인 18-22, 30-53)는 수동 /verify 경로의 load-bearing 글루이며 agent는 module/effort/steps를 바로 이 프롬프트에서 공급받는다 — 자동 축소 시 인자 전달이 끊겨 /verify가 깨진다. 라인 55-60의 Read-Only/증거 필수/순서 고정은 이 시스템이 막으려는 반복 실수를 사용자 진입점에서 재강화하는 defense-in-depth라 보존해야 한다. 진짜 결함은 중복이 아니라 단계 수 drift(command 5단계 vs agent 6단계 DISCOVER)이며, 자동 도구가 한쪽을 임의 폐기할 게 아니라 사람이 단일 source of truth를 선택해 해결할 사안이다. 또한 _global-seed/global/commands/verify.md에 동일 텍스트가 있어 프로젝트 사본만 자동 편집하면 canonical seed와 desync된다. enum에 '프롬프트 내 단순화된 mvn compile(라인 51-53)만 정리' 같은 정밀 옵션이 없고 그 유일한 진짜-dead 중복은 가치 대비 자동 위험이 커, 보수적 착지는 KEEP + drift는 사람 조정으로 플래그한다. harness_diet_auto=true이므로 human approval 없이는 /harness-diet에 휩쓸려 회귀가 자동 적용될 수 있다.

#### P21 · `.claude/agents/kiips-realgrid-generator.md`

- **현재 목적**: RealGrid 2.6.3 테이블 코드 자동 생성 전문 에이전트(615L, Write/Edit 보유).
- **발견한 문제**: RealGrid 생성 커버리지가 realgrid-guide(skill,467L)/realgrid-generator(agent,615L)/ui-designer(agent,1540L) 3중 보유. generator(생성 전담)와 guide(참조)는 역할 구분되나 ui-designer가 RealGrid 생성까지 포괄해 generator와 겹침.
- **근거**: realgrid-guide 'createMainGrid', generator '그리드 생성/컬럼정의/멀티레벨헤더/엑셀', ui-designer 'RealGrid 2.6.3'. ui-component-builder도 단건추가 보유(guide 참조).
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 생성 정본을 realgrid-generator로 고정하고 ui-designer의 RealGrid 생성 부분은 generator 위임으로 축소.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 방향(generator를 생성 정본으로 고정, ui-designer의 RealGrid 생성부 축소)은 코드베이스 검증으로 타당함이 확인됨: 정본은 common_grid.js의 createMainGrid(1626행)+RealGrid. 네임스페이스이며 generator·guide skill이 이에 일치, ui-designer만 RealGridJS 네임스페이스로 off-standard. 그러나 harness_diet_auto는 반드시 false로 강등해야 한다 — (1) 1540L 다중도메인 에이전트에서 RealGrid 부분만 분리하는 것은 단순 토큰 다이어트가 아닌 correctness 정합성 편집이고, (2) ui-designer 내부에 generator 위임 포인터가 전혀 없어 자동 축소 시 위임처 없는 capability gap이 발생하기 때문. 안전한 실행: SHRINK를 유지하되 사람 승인 하에, ui-designer의 RealGrid 생성 예제(RealGridJS 코드)를 제거/축소하면서 동시에 '생성은 kiips-realgrid-generator에 위임, RealGrid 참조는 kiips-realgrid-guide' 라는 명시 포인터를 ui-designer에 추가하라. 단, ui-designer의 RealGrid CSS 변수/SCSS 토큰/접근성(role/aria) 부분은 ui-designer 고유 역량이므로 보존(이 부분까지 삭제 금지). 확신 낮을 땐 DELETE보다 SHRINK 선호 원칙에 부합. 추가 권고: ui-designer의 잘못된 RealGridJS 예제는 별도 finding으로 'API 네임스페이스 수정 후보'로도 분류 가능(본 감사 범위 외, 읽기전용이므로 미수정).

#### P22 · `.claude/commands/deploy-with-tests.md`

- **현재 목적**: 안전 배포 파이프라인 커맨드(Test→Build→Deploy→Health Check, 547L).
- **발견한 문제**: kiips-build 스킬(108L, 빌드/배포/기동 통합, maven-builder+service-deployer+build-deploy+startup 4종 병합본)과 배포 파이프라인 커버리지 중복. 두 곳 모두 Maven 빌드→테스트→배포→헬스체크 흐름·명령(curl actuator/health) 정의.
- **근거**: deploy-with-tests '[1/7]Run Tests [2/7]Build [4/7]Deploy [6/7]Health Check'. kiips-build 'Pre-flight→빌드→테스트→배포→헬스체크'.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 정본을 kiips-build 스킬로 두고 커맨드는 thin entry(스킬 호출)로 축소.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 제안 조치(스킬을 정본으로, 커맨드를 thin entry로 축소)는 세 가지 독립 근거 각각으로 무효다. 결정적 근거: kiips-build 스킬에는 rollback/backup/abort-on-test-failure/health-check-failure recovery/graceful-shutdown-force-kill 폴백이 전혀 없다(grep 0건). 커맨드를 스킬 호출 shim으로 축소하면 실행 가능한 안전 배포 파이프라인이 그 안전 단계를 수행할 수 없는 치트시트를 가리키는 껍데기로 퇴화한다 — 교과서적 safety-net 제거다. '중복'은 라벨(build/test/deploy/healthcheck) 수준일 뿐 동작 수준이 아니다. 보강 근거: (a) disable-model-invocation:true는 스킬이 수동 참조용으로 작성됐음을 보여줘 '스킬=배포 엔진' 전제를 약화시킨다. (b) 포트 데이터 충돌(PG 8201 vs 8301, Gateway 8000 vs 8088)로 클린 머지가 불가하며 사람의 재조정이 필요하다. 공정성을 위해 별도 사실 하나를 명시한다: 커맨드 내 ~150L는 비실행 산문(Boris Cherny 인용 섹션, Before/After 비교, Example 블록)이라 독립적으로 다듬을 여지는 있다 — 그러나 이는 별개 finding이며 '스킬로 병합' 조치를 정당화하지 못한다. SHRINK가 필요하다면 그것은 동작 로직 보존 전제 하의 prose 다이어트지, canonical 이전이 아니다. 따라서 KEEP 유지. 안전망 제거는 보수적으로.

#### P23 · `.claude/skills/kiips-test-runner/SKILL.md`

- **현재 목적**: KiiPS JUnit 테스트 자동 실행+결과 분석(disable-model-invocation).
- **발견한 문제**: test-coverage 커맨드(JUnit+JaCoCo)와 'mvn test' 실행 커버리지 중복. 더 심각하게, SKILL.md 핵심 기능(stopEvent Hook 자동 테스트 실행)이 stopEvent.js v4.0에서 명시 제거됨 — 약 60줄이 더 이상 존재하지 않는 동작을 묘사하는 dead content('자동 테스트 실행율 100%'는 실제 0%).
- **근거**: stopEvent.js L9 '- runAutoTests (Stop 이벤트 Maven 자동 실행은 과도)' 제거. SKILL.md L39-53/102-139/158-163/179-203 dead 자동실행 코드. test-coverage 커맨드 JaCoCo 리포트와 mvn test 중복.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: dead stopEvent 자동실행 섹션 60줄 삭제, 실행 정본=test-runner/커버리지 리포트=test-coverage로 mvn test 중복 정리.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 조치 자체 타당(확인된 dead content, low risk, 손실 안전망 없음, DELETE 아닌 SHRINK 로 수동실행 역할 보존). 단 harness_diet_auto:true 거부. (a) 동일 죽은 Hook 계약이 SKILL.md 외 skills-registry.json L1001-1007 trigger 블록과 kiips-orchestration L50 체인에도 존재 - SKILL.md 60줄만 자동삭제하면 레지스트리/오케스트레이션이 존재하지 않는 critical hook 검증을 계속 광고하는 불일치 발생. (b) 스킬 정본역할 재정의(실행 vs 커버리지 경계)는 사람 판단 필요. action 은 SHRINK 유지하되 범위를 3파일 동기화(SKILL.md dead 자동실행 60줄 정리 + registry trigger 의 hook/stopEvent 메타 갱신 + orchestration 체인 참조 점검)로 확장, 무비판적 /harness-diet 자동실행 금지.

#### P24 · `.claude/agents/security-reviewer.md`

- **현재 목적**: KiiPS 보안 전문 리뷰어 에이전트(SQL Injection/XSS/인증인가/민감정보).
- **발견한 문제**: security 커버리지가 security-reviewer(agent)/kiips-security-guide(skill,280L)/gemini-scan(command)/review(command) 4곳 분산. 동일 취약점 항목(SQLi/XSS/CSRF/하드코딩 시크릿/@PreAuthorize)을 각자 점검. 가이드=참조 정본, 리뷰어=실행으로 역할은 다르나 점검 항목 정의가 4중 반복. 보안 항목이라 보수적 처리.
- **근거**: security-reviewer 'SQLi 검증'. gemini-scan 'SQLi/XSS/CSRF/Auth bypass/Hardcoded secrets'. review Security 섹션 'Injection/Auth/Secrets/XSS(Lucy)'. security-guide 동일 영역.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 높음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 점검 항목 정의를 kiips-security-guide reference로 단일화하고 reviewer/review는 참조; 보안이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `MOVE` · 사람승인필요
  - 반박근거: Downgrade from SHRINK to a narrower MOVE: keep all executable detection logic and category definitions IN the agent (the auto-triggered, fresh-context execution layer must stay self-contained because dispatched sub-agents do not reliably load Skills on-demand, and the guide's triggers don't even match the agent's). Only MOVE/consolidate the verbose REMEDIATION prose/code samples to kiips-security-guide as the single 정본, and add a one-line 'remediation depth: see kiips-security-guide' pointer from the agent and the review command. Do NOT thin the agent's scan-item definitions or grep patterns, and do NOT make the agent depend on the guide for its core checklist. This preserves the security net and the live invocation path (userPromptSubmit.js:225, verify-agent.md:90) while still removing genuine prose duplication. The diagnosis that the guide is the reference 정본 is correct; only the direction of the cut must be inverted toward conservatism.

#### P28 · `.claude/skills/kiips-learning/SKILL.md + .claude/commands/learn.md/evolve.md/instinct-status.md/instinct-gc.md`

- **현재 목적**: KiiPS 학습 시스템 통합 스킬(65L, disable-model-invocation) + observe→learn→evolve 파이프라인 커맨드군.
- **발견한 문제**: 스킬 자체는 4기준 통과(참조 아티팩트 13개 instinct 실존, 65줄, disable-model-invocation 적절). 단 스킬이 learn/evolve 커맨드 파이프라인(observe→패턴감지→instinct 생성→진화, instincts/personal/*.md 경로, 80% 유사 중복검사)을 요약 재기술해 절차 본문이 스킬과 커맨드군에 중복. 능동 학습 루프 자체는 네이티브 Memory와 다른 고유 기능이라 KEEP.
- **근거**: 스킬 '관찰→패턴감지→Instinct생성→진화 /observe.js /learn /evolve'. learn.md --from-observations 동일 경로·중복검사 재기술. evolve.md 수집·중복감지·클러스터링. observe.js/instinct 13개/커맨드 모두 실존.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 스킬은 오케스트레이션 포인터로 두고 절차 본문(경로·중복검사)은 각 커맨드 정본으로 위임; 파이프라인 자체는 KEEP.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: No passive context cost exists to reclaim: disable-model-invocation:true plus absence from the skill roster means the body is never in always-on context, so the harness-diet rationale for SHRINK is moot. The 'duplication' is intentional orchestration summary at a higher altitude than the per-step commands — the only end-to-end pipeline map in the system — and removing the path/dedup lines degrades discoverability without saving meaningful tokens. With harness_diet_auto=true and medium confidence, a mechanical pass cannot tell the cross-reference map from a redundant copy and will over-strip the overview; it also targets the wrong content (path/dedup) while the real staleness (hardcoded 13-instinct snapshot, lines 39-46) is left untouched. Keep the skill as-is; the snapshot drift is the only legitimate touch and should be a separate human-reviewed micro-edit, not this auto SHRINK.

#### P34 · `.claude/hooks/userPromptSubmit.js (activateSkills 경로, L160-178)`

- **현재 목적**: UserPromptSubmit에서 skill-rules.json 기반 프롬프트 매칭→스킬 활성화 메시지 주입(activateSkills) + complexity gate.
- **발견한 문제**: 네이티브 Skills가 이미 description 기반 on-demand 확률적 로딩 제공 → 커스텀 skill-rules.json 매칭/주입은 네이티브 트리거와 중복. kiips-* 스킬 20+개가 네이티브로 등록되어 수동 주입 레이어가 이중화.
- **근거**: userPromptSubmit.js L162-164 activateSkills() + L20-34 skill-rules.json 로드. 시스템에 kiips-* 스킬 다수 네이티브 등록.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 스킬 활성화/주입 로직 제거하고 네이티브 확률적 로딩 위임; captureScope/complexity gate 등 비중복 기능만 유지. hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 부분 타당: 9개 suggest-tier 스킬은 네이티브 description 로딩과 실제 중복이고 네이티브 스킬이 이제 등록됨(실재 신호). 그러나 remedy(activateSkills 전체 제거)는 과대 — 15개 require+critical 가드레일의 결정적 surfacing까지 상실. skill-rules.json은 integrity 테스트+회귀테스트로 잠긴 유지 계약이지 잔재 아님. 안전망 제거는 보수적으로 KEEP. reject가 아닌 downgrade인 이유: suggest-tier 한정 일부 중복은 사실이라 zero-merit 단언은 부정확. 향후 정밀 다이어트가 필요하면 activateSkills 통삭이 아니라 suggest-tier만 skill-rules.json에서 솎는 별도 항목으로 분리할 것.

#### P35 · `.claude/mcp.json (mcpServers.filesystem, args[2]=".")`

- **현재 목적**: filesystem MCP 서버를 프로젝트 루트 '.'에 바인딩하여 read/write 접근 제공.
- **발견한 문제**: 루트 '.' 전체에 광범위 read/write 권한. 단 enabledMcpjsonServers(context7/playwright/serena/obsidian)에 filesystem 부재로 현재 비활성(latent) — 활성 위협이 아닌 잠재 지뢰/죽은 설정.
- **근거**: settings.local.json enabledMcpjsonServers에 filesystem 부재. mcp.json args=['-y','@modelcontextprotocol/server-filesystem','.']. obsidian만 양쪽 등재(비대칭).
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 활성화 필요 시 '.' 대신 실제 작업 하위경로로 한정; 사용 이력 없으면 mcp.json에서 항목 제거 검토. 사람 승인 필수.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 비활성 루트 바인딩을 좁히거나 제거; MCP 설정이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 원래 SHRINK가 옳다. 다만 근거를 강화: 이 항목의 실질 위험은 'low'보다 높다. settings.json의 deny permissionRules는 전부 tool-scoped(Bash/Read/Edit/Write/Grep)라 mcp__filesystem__* 를 전혀 막지 못하고, Edit|Write 시크릿 차단 훅도 MCP 툴콜을 우회한다. filesystem 서버가 latent라 지금은 비활성이지만, git-tracked인 settings.local.json의 enabledMcpjsonServers에 'filesystem' 한 줄만 추가되면 '.'(모노레포 전체)에 대한 read/write가 시크릿 방어벽을 통째로 우회한다. 따라서 KEEP은 지뢰를 그대로 둠 → 부적절. SHRINK('.'→실제 작업 하위경로)는 활성화 여부와 무관하게 유효한 항구적 완화책이라 채택. DELETE로의 격상은 보수성 원칙상 보류(사용 이력 0이므로 사람 검토 하 제거는 별도 옵션). MCP 설정 변경 + Claude Code 재시작 + 시크릿 노출 영향 때문에 사람 명시 승인 필수이며, 무비판 자동 다이어트 금지(harness_diet_auto=false).

#### P36 · `.claude/settings.local.json (permissions.allow: Bash(node:*), Bash(python3:*), Bash(bash:*), Bash(claude:*))`

- **현재 목적**: node/python3/bash/claude CLI 실행을 프롬프트 없이 허용 — 빌드/훅/서브에이전트/serena 구동.
- **발견한 문제**: 사실상 임의 코드 실행 allowlist. PreToolUse 훅은 셸 명령 문자열 패턴만 스캔하므로 node/python 스크립트 내부 임의 로직은 미검사 → 프롬프트 없이 미검사 코드 실행 가능. sandbox가 write/network 부분 제약하나 의존성 높음. settings.local.json이 git-tracked라 팀 전체 공유.
- **근거**: settings.local.json L36 Bash(node:*), L14 Bash(python3:*), L25 Bash(bash:*), L28 Bash(claude:*). sandbox L55-58. git ls-files 추적 확인.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 가능 범위에서 구체 서브커맨드로 좁히기(node ./.claude/hooks/*는 별도 allow 존재; python3 -m serena 등). 전면 좁힘은 hook/serena/subagent 구동을 깨뜨릴 수 있어 사람 검증 필수.
- **변경 시 위험도**: 높음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 광범위 코드실행 allow를 구체 경로로 좁히되 핵심 구동 의존 확인; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the correct direction and the conservative posture (harness_diet_auto=false, human approval) is right for a git-tracked permission file. The blanket interpreter allowlist genuinely defeats the regex-only Bash hooks, so it does block a real recurring risk (unreviewed code execution) rather than preserving a habit — meeting the harness principle. But the audit must be corrected/sharpened, not auto-applied: (a) narrowing node/bash does NOT break hooks (they run via the hook runner), so the agent-facing node/bash deps are small and enumerable — node .claude/evals/eval-runner.js, node .claude/hooks/gemini-bridge.js; bash had zero agent-run scripts found; (b) Bash(claude:*) has no found dependency and is the strongest removal candidate (recursive spawn / cost+privilege amplification); (c) Bash(python3:*) is the one truly entangled with serena/LSP via a brittle hashed uv path and must be narrowed carefully, never dropped blind. Net: keep SHRINK, do not downgrade to KEEP (the hole is real) and do not escalate to a blind DELETE (python3/node carry live deps). Verify serena, eval, and gemini-bridge still run after any narrowing.

#### P40 · `.claude/hooks/scssValidator.sh (settings.json PostToolUse L98-106) vs postToolOrchestrator.js (execSync L166)`

- **현재 목적**: SCSS 다크테마 검증을 PostToolUse에서 수행.
- **발견한 문제**: 이중 와이어링: settings.json PostToolUse가 scssValidator.sh를 독립 실행(L103)하는 동시에 postToolOrchestrator.js가 runShellHook('scssValidator.sh')로 execSync(L166) — .scss 편집 시 동일 검증 2회 실행. orchestrator 설계 목적(6프로세스→1)과 모순.
- **근거**: settings.json PostToolUse L99-104 bash scssValidator.sh 등록. postToolOrchestrator.js L10/11 헤더에 scssValidator/themeCssVerGuard 통합 명시, L166 runShellHook('scssValidator.sh'), L171 themeCssVerGuard.sh execSync.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: settings.json의 독립 scssValidator.sh 와이어 제거하고 orchestrator 단일 경로로 통일; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Uphold the SHRINK: remove the standalone scssValidator.sh wire in settings.json PostToolUse (L98-106) and rely on the orchestrator's single path (postToolOrchestrator.js L165-167). Evidence is strong/high-confidence: (a) git proves the duplicate is an accidental re-introduction of a wire that consolidation had intentionally deleted, directly contradicting the orchestrator's stated '6 processes -> 1' purpose (L17); (b) both paths are non-blocking (scssValidator.sh exits 0 at L94; themeCssVerGuard.sh exits 0 at L63), so the duplicate never blocks work and removing it cannot regress blocking behavior; (c) coverage is preserved because the orchestrator already invokes scssValidator.sh AND themeCssVerGuard.sh on the identical isEditWrite && isScss condition (L165-172), so the dark-theme lint and sass compile check still run on every .scss edit. CONDITION on the SHRINK (do not ship bare): before/while removing the standalone wire, raise the orchestrator's scssValidator timeout above the 5000ms default at L166 (e.g. pass an explicit larger timeout) so the `sass` compile catch on wide-import theme.scss is not weakened, and ensure the swallowed-error branch (L126-129) does not silently hide compile failures. This conditions but does not flip the verdict — the duplicate is genuine accidental redundancy and the surviving orchestrator path retains the recurring-mistake guard.

#### P44 · `.claude/settings.local.json (permissions.allow Bash(brew install:*), Bash(chmod:*))`

- **현재 목적**: brew install 패키지 설치 및 chmod 권한 변경을 프롬프트 없이 허용.
- **발견한 문제**: brew install:*는 임의 패키지 설치(시스템 상태 변경), chmod:*는 임의 파일 권한 변경 허용. 개발 셋업 1회성 흔적으로 추정 — 상시 allow 불필요. node/python처럼 핵심 의존 아님.
- **근거**: settings.local.json L31 Bash(brew install:*), L8 Bash(chmod:*). 다른 setup 성격 allow(java -version, jdtls, java_home)와 함께 위치.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 상시 allowlist에서 제거하여 필요 시 프롬프트 승인으로 전환. 제거해도 핵심 워크플로 영향 없음. 권한이라 사람 승인.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 1회성 셋업 권한을 상시 allow에서 제거; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `SPLIT` · 사람승인필요
  - 반박근거: The two permissions have opposite usage profiles and must not share one action. KEEP Bash(chmod:*): 15 recurring observations through 2026-06-05 prove it is a live workflow staple (chmod +x on user-authored hooks/scripts/git-hooks), not a stale setup trace — removing it adds recurring friction with no security gain (it is the user's own repo scripts, no deny rule, in-context low risk). Only Bash(brew install:*) is a plausible SHRINK candidate (1 genuine one-time use ~3 months old), but it still has a latent trigger via .claude/scripts/setup.sh and the reinstall/migration guides, and as a system-state-changing install permission it requires human approval before removal. Net: SPLIT the item first; do not apply the bundled SHRINK as written. harness_diet_auto is correctly false and must stay false — auto-processing this would silently break the user's hook-development loop.

#### P45 · `.claude/skills/kiips-backend/SKILL.md`

- **현재 목적**: Controller/Service/DAO 패턴, 공통 코드(COMMON/UTILS), API 설계, 예외 처리 가이드.
- **발견한 문제**: 실재하지 않는 클래스/형식을 표준으로 제시(stale·오류 3건). (1) BusinessException 클래스가 코드베이스에 0건이나 예외 처리 예시가 참조 → 따라 하면 컴파일 오류. (2) StringUtils/DateUtils/NumberUtils를 KiiPS 자체 클래스처럼 열거하나 0건(실제는 org.apache.commons.lang3 + Utils/CheckUtil/FileUtil). (3) API 응답 형식을 ResponseEntity<Map<String,Object>>로 명시하나 실제 표준은 ResponseEntity<ApiResultBean<Object>>(GlobalExceptionHandler도 동일).
- **근거**: grep 'BusinessException' 0건, GlobalExceptionHandler.java NPE/IAE/RuntimeException/Exception 처리. find StringUtils/DateUtils/NumberUtils.java 0건, LoginAPIController import org.apache.commons.lang3.StringUtils. GlobalExceptionHandler L45 ResponseEntity<ApiResultBean<Object>>, ApiResultBean.java 4개 파일.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 예외 처리(BusinessException→실제 핸들러), 유틸 목록(commons-lang3+Utils/CheckUtil/FileUtil), API 응답(ApiResultBean)을 실제 코드 기준으로 교정.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: All three stale/wrong standards are verified against real code (only nuance: BusinessException appears once, in a comment, with no usable class — so "follow it = compile error" still holds). SHRINK is the right and appropriately conservative call: it removes/trims the incorrect standardized examples without deleting a useful skill, and it is far safer than DELETE. The standard adversarial objection (removing a guardrail causes regression) does not apply because this skill is the cause of the error, not a protection against one — keeping it as-is is the actively harmful option. Note the verb mismatch the plan_note reveals: the real remedy is CORRECTION (BusinessException→real GlobalExceptionHandler/NPE-IAE-RuntimeException-Exception flow; util list→commons-lang3 + DateUtil/CheckUtil/FileUtil; response→ApiResultBean<Object>), which is more than a mechanical volume trim. Because the fix requires codebase-accurate rewrites of a .claude/skills/ file (judgment, not auto-trim), it must not be run through unattended /harness-diet — keep harness_diet_auto=false and gate on human approval.

#### P46 · `.claude/skills/kiips-build/SKILL.md`

- **현재 목적**: 빌드/배포/기동 통합 스킬(108L, disable-model-invocation). maven-builder+service-deployer+build-deploy+startup 4종 병합본.
- **발견한 문제**: stale fact 다수. (1) -pl :KiiPS-SERVICE는 존재하지 않는 artifactId(실제 KiiPS-FD/IL 등) → 복사 시 빌드 실패. (2) PG 포트를 8301로 오기(실제 8501; 8301은 SY). (3) 로그 패턴 log.DATE-0.log는 APIGateway/Infra-Admin에만 존재(주요 서비스는 logback.log/err_log/api_time 형식). 트리거·길이·disable-model-invocation 자체는 적절(그 facet은 KEEP).
- **근거**: L16-17 -pl :KiiPS-SERVICE, grep artifactId KiiPS-SERVICE 0건(CLAUDE.md L9 동일 placeholder). KiiPS-PG/app-local.properties server.port=8501, KiiPS-SY=8301, SKILL L47 PG(8301). find log.*.log: APIGateway/Infra-Admin만 매칭.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: placeholder 모듈명 실제값으로, PG 포트 8301→8501, 로그 패턴을 서비스별 실제 형식(logback.log/err_log/api_time)으로 교정. 빌드/배포 도메인이라 사람 검증.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 진단 3건 전부 소스 검증 통과. SHRINK(사실 교정+구조/트리거/disable-model-invocation 유지)는 올바른 altitude — DELETE도 MOVE도 아님. 단 교정은 blanket find/replace가 위험: 8301은 SY의 실제 포트라 전역 치환 시 SY 설정 손상, 로그 패턴은 서비스 tier별로 다름(APIGateway/Infra-Admin의 log.DATE-N.log는 정확)이라 일괄 치환하면 정상 패턴까지 오염. 따라서 이 파일 1개로 scope 한정 + 서비스별 실제 형식(active=logback.log, rolled=log.DATE-N.gz/err_log/sql/api_time)으로 교정해야 함. harness_diet_auto=false 유지 필수(자동 적용 절대 금지).

#### P48 · `.claude/skills/kiips-feature-planner/SKILL.md (+ plan-template-kiips.md)`

- **현재 목적**: 신규 기능 기획/구현 전략 스킬(322L, disable-model-invocation).
- **발견한 문제**: stale 경로/형식 + 중복. (1) API Gateway 라우팅을 application.yml YAML 블록으로 안내하나 해당 파일 부재 — 실제는 app-local.properties의 spring.cloud.gateway.routes[N] properties 인덱스 방식. (2) JSP 위치를 src/main/resources/templates/로 안내하나 실제는 src/main/webapp/(templates엔 template.html 1개). (3) Related Skills에서 kiips-build를 3줄 복붙(Build/Deploy/Test, Test는 실제 kiips-test-runner). (4) Quality Gate/SVN/Testing Strategy 약 100줄이 plan-template-kiips.md와 중복 → 322줄 초과. disable-model-invocation·트리거 자체는 적절.
- **근거**: L185-195 application.yml YAML(find *.yml in src 0건), app-local.properties L25-27 routes[0].id=kiipslogin. L203-204 templates/(jsp 0건), webapp jsp 다수. L318-320 kiips-build 3행. SKILL L82-115≈template L91-133, L209-240≈L396-438.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: plan-template-kiips.md (Quality Gate/Testing Strategy 중복 단일화)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 라우팅(properties routes[N])·JSP 경로(webapp)·Related(kiips-test-runner) 교정, 중복 100줄을 template로 단일화.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the right action class — the defect is over-staleness plus verbatim duplication, both warranting reduction, and SHRINK is already moderate (not a safety-net removal). Verdict is uphold WITH amended plan, because the finding's plan_note is incomplete/misdirected: (1) Stale refs must be corrected in BOTH SKILL.md AND plan-template-kiips.md — the template is NOT a clean canonical source; specifically routing should reference spring.cloud.gateway.routes[N] properties indices in KIIPS-APIGateway/app-local.properties (not application.yml YAML), and JSP location should be KiiPS-UI/src/main/webapp/ (not src/main/resources/templates/, which holds only template.html). (2) Related Skills must replace the duplicate kiips-build entries with kiips-test-runner (verified to exist) and keep kiips-logs/checklist-generator. (3) Dedup ONLY truly-verbatim prose; retain a concise Quality-Gate/Testing summary in SKILL.md because it is planner-facing guidance distinct from the artifact checklist in the template — do not fully gut it. Net: corrections are zero-risk; consolidation is medium-risk and must not designate the template as authoritative without first fixing it.

#### P50 · `.claude/skills/kiips-logs/SKILL.md`

- **현재 목적**: 로그 파일 위치 테이블 + grep/tail Quick Reference(log-analyzer+log-reader 통합본).
- **발견한 문제**: stale·불완전·트리거. (1) 디렉토리명 오류: 'KiiPS-COMMON-SERVICE'(실제 KiiPS-COMMON), 'KiiPS-APIGateway'(실제 KIIPS-APIGateway 대문자). (2) 서비스 목록 5개만 나열하나 실제 logs 보유 서비스 24개. (3) 트리거 '분석' 단독이 로그 무관 분석 세션에 오발동. (4) .gz 압축 로그 처리(zcat/zgrep) 명령 누락(IL/UI에 .gz 실존).
- **근거**: find: /KiiPS-COMMON/logs, /KIIPS-APIGateway/logs 존재. SKILL L38-44 'KiiPS-COMMON-SERVICE'/'KiiPS-APIGateway'. 24개 서비스 logs 확인 vs 5개 기재. L3 '분석' 단독. IL/UI에 log.*.gz 실존, Quick Ref에 zcat/zgrep 없음.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 디렉토리명 대소문자/접미사 교정, 서비스 목록 보강(또는 패턴 일반화), '분석'→'로그 분석', zcat/zgrep 추가.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK`
  - 반박근거: SHRINK stands, but the plan must be sharpened, not executed as written. Strongest coherent form: DELETE the stale L37-44 service table and rely on the already-present general pattern at L34 — this single reduction simultaneously removes the hard-wrong path 'KiiPS-COMMON-SERVICE', the Gateway casing drift, and the '5 vs 24' incompleteness, without growing the skill. DROP the trigger change ('분석'→'로그 분석'): it is inert because disable-model-invocation:true means trigger words never auto-fire, so sub-claim (3) is invalid. KEEP the zcat/zgrep addition — .gz logs are live as of this week (the only non-shrink element, minor). Reject/KEEP is off the table because L41 ships a non-existent directory path. Downgrade to a more conservative action is unnecessary since the corrected SHRINK is net-reductive and removes a real bug. harness_diet_auto stays false so this will not be blindly auto-applied; risk is doc-accuracy, not safety-net removal.

#### P53 · `.claude/skills/kiips-orchestration/SKILL.md`

- **현재 목적**: 병렬 에이전트 조정, ACE 가드레일, 스킬 체이닝 파이프라인 참조(66L, disable-model-invocation).
- **발견한 문제**: 스킬 체이닝 파이프라인 섹션(L49-62)이 참조하는 kiips-build/test-runner/feature-planner/backend/logs가 '등록된 스킬 목록에 부재'로 보고됨(단, 디스크에는 존재 — 정찰 시점 등록 누락 또는 stale 가능). 파이프라인 예시가 미등록 스킬을 가리키는 stale 우려. ACE 가드레일(L13-25)·병렬 프로토콜·66줄·disable-model-invocation 자체는 KEEP.
- **근거**: SKILL L49-62 3개 파이프라인이 kiips-build/test-runner/feature-planner/backend/logs 포함. 정찰: 등록 목록에 부재. (주의: 동일 보고서 다른 finding은 이들 스킬이 디스크 존재로 확인됨 — 등록/명명 동기화 필요.)
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 파이프라인 예시의 스킬명을 실제 등록명과 동기화(또는 일반화); ACE 가드레일은 유지.
- **🔴 Adversarial 반박**: ⛔ 반려(reject)
  - 반박근거: Premise is empirically false. All 6 referenced kiips-* skills exist on disk with name: frontmatter matching the pipeline tokens exactly; /check-health, /verify, /diagnose all resolve. The 'absent from registered list' recon signal is fully explained by disable-model-invocation: true on every referenced skill, which excludes them from the model-invocable registry recon sampled — not a stale or misnamed reference. SHRINK provides no benefit: name-sync is a no-op, and generalization is actively harmful because this doc is the only discovery surface for these explicit-invocation-only skills (defense-in-depth for hidden skills). Do not touch the SKILL.md text; KEEP as-is (ACE guardrails, parallel protocol, 66L, disable-model-invocation already slated KEEP). Out of scope but worth a separate finding: the registration/naming-sync concern (why these skills do not surface in the auto-invocable registry) is a registration matter, not a SKILL.md-text matter, and does not justify editing this file. NOTE: this item was tagged harness_diet_auto=false, correctly — it must not be auto-applied; reject confirms it should never reach /harness-diet.

#### P58 · `.claude/skills/kiips-stitch-bridge/SKILL.md`

- **현재 목적**: Stitch/Pencil 디자인(.pen, .stitch)을 KiiPS JSP/Bootstrap/RealGrid로 변환(136L).
- **발견한 문제**: stale 도구명/구조(트리거·길이·disable-model-invocation은 적절). (1) 진입점으로 mcp__pencil__open_document 명시하나 Pencil MCP에 부재 — 실제 진입점 get_editor_state(include_schema:true), 트리거 시 즉시 실패. (2) .stitch/ 디렉토리 구조를 designs/·metadata.json·*.pen 포함으로 문서화하나 실제는 SITE.md·DESIGN.md 두 파일만 존재.
- **근거**: SKILL L25 mcp__pencil__open_document(deferred-tools 목록에 없음; 실제 get_editor_state/batch_design/export_nodes 등). MCP 지침 'get_editor_state(include_schema:true) 진입점'. ls .stitch/: DESIGN.md, SITE.md만. SKILL L116-121 designs/PG0500.* 부재.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 진입점을 mcp__pencil__get_editor_state(include_schema:true)로 교정, .stitch/ 구조 예시를 실제(SITE.md/DESIGN.md)와 정합.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK`
  - 반박근거: 원 SHRINK은 (a)진입점 교정 + (b).stitch/ 구조 예시 재작성 두 변경을 묶었다. (a)만 유효하고 (b)는 해롭다 → 범위를 (a)로만 좁힌 더 보수적 SHRINK로 downgrade. 구체적으로: L25의 mcp__pencil__open_document 를 mcp__pencil__get_editor_state(include_schema:true)로 교정(이는 스키마 로드용 '첫' 호출이며, 실제 디자인 노드 읽기는 이후 batch_get/export_nodes 사용 — get_editor_state 단독으로 디자인을 읽는다고 함의하지 말 것). .stitch/ 디렉토리 예시(L113-120) 및 L50 템플릿 주석은 '(선택)' optional·forward-looking 예시이므로 손대지 말 것 — '실제와 정합' 재작성 금지. plan_note의 후반('.stitch/ 구조 예시를 실제와 정합')은 폐기. 하위 reader가 이 항목을 무비판적으로 돌릴 때 디렉토리 예시까지 덮어쓰지 않도록 명시. harness_diet_auto=false 유지가 적절(자동 처리 대상 아님).

#### P60 · `.claude/skills/legacy-compliance-checker/SKILL.md`

- **현재 목적**: KiiPS 레거시 준수 가드레일(Java 8 차단, Boot 2.4.x, jQuery/JSP, MyBatis 안전, SCSS) 정적 룰 테이블(127L, user-invocable: false).
- **발견한 문제**: 트리거 과넓음 + 비표준 플래그. (1) 트리거 'Java, 코드 작성, 구현, implement, 클래스, 메서드'가 위반 위험 없는 일반 작업(테스트 작성, 리팩터 설명, README)에도 오발동 — 진짜 필요 시점은 '신규 Java/JSP/SCSS 파일 생성·의존성 추가'로 훨씬 좁아야 함. (2) 검증이 전부 정적 정규식인데 disable-model-invocation 미명시(user-invocable:false 비표준 키만) → 불필요 LLM 추론 유발 가능. 127줄·reference.md(335L) 분리 자체는 적절(그 facet KEEP).
- **근거**: SKILL L3 'Use when: Java, 코드 작성, 구현, implement, 클래스, 메서드'. L34-38 동일 광범위. frontmatter user-invocable:false만, disable-model-invocation 없음. reference.md L319-329 정규식 테이블. wc -l 127.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 트리거를 '신규 파일 생성/의존성 추가'로 한정, user-invocable→disable-model-invocation 표준 키로 통일.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Downgrade to a much more conservative SHRINK than proposed, and drop Part B entirely. (1) NEVER swap user-invocable:false → disable-model-invocation:true. disable-model-invocation:true is functional (build-registries.js consumes it) and would block the only path (Skill-tool model-load) by which the Java 8 / Spring Boot 2.4.x / ES-module rules reach the model — these have no PreToolUse/PostToolUse backstop. This is exactly the "전역→Skill on-demand 로딩이라 정작 필요한 순간 트리거 안 됨" risk the audit warns about, realized as a kill switch. user-invocable:false is inert (no consumer) so it is harmless to leave; if standardization is wanted, the only safe normalization is to make the skill model-invocable on edits, not to disable it. (2) Do NOT narrow triggers to "신규 파일 생성/의존성 추가". The dominant Java-8 violation is editing an EXISTING .java file; that wording excludes the main case and lets var/record/List.of/Stream.toList ship uncaught. The fileTriggers (**/*.java/.jsp/.xml/.scss) and intentPatterns must keep firing on edits. (3) The only defensible SHRINK is a narrow prompt-keyword trim that PROVABLY preserves edit-path activation: drop pure-documentation false-fires (README, plain "test 작성" with no code-gen, refactor-explanation) by tightening promptTriggers.keywords, while KEEPING the fileTriggers and intentPatterns that fire on Java/JSP/SCSS edits. The body split (SKILL 127L + reference 335L) is correct — KEEP. If a trim that provably preserves edit-path activation cannot be specified with confidence, the safe residual is KEEP (none): this is a critical:block guardrail with a single delivery layer for Java 8, so per the audit principle (안전망 제거는 보수적으로) prefer leaving it over a risky narrowing.

#### P61 · `.claude/skills/kiips-regist-modal-guide/SKILL.md`

- **현재 목적**: 등록/수정 모달 표준 패턴(HTML, 폼필드, 편집그리드, 데이터 바인딩, 저장, 이벤트). 253L.
- **발견한 문제**: Part 번호 불연속(1,2,3→6,7,8; Part 4,5 누락)으로 내부 목차 혼란. 내용·참조 JSP(IL0927/IL0903/SY0208) 현용, 253줄로 300줄 미만(SPLIT 불필요), reference.md/examples.md 분리 완료, disable-model-invocation 미설정 적절, 트리거도 KiiPS 용어로 충분히 좁음.
- **근거**: SKILL L12 Part 1, L64 Part 2, L102 Part 3, L146 Part 6 — Part 4,5 누락. wc -l 253. reference.md 304L, examples.md 122L. IL0927.jsp createEditGrid/gatherComponent/modal-confirm 현존.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: Part 번호를 1~6 연속으로 재정렬(4,5 누락 수정); 내용은 유지.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 자동(harness_diet_auto) 적용 시 위험: cross-file 불완전 진단에 근거한 cosmetic 단일파일 재정렬을 현용 중인 스킬에 가하는데, 다이어트 이득은 0이고 reference.md의 'Part 11'을 더 고립시켜 불일치를 증가시킬 수 있다. Part 번호는 내부 참조 앵커가 아니므로(grep 매칭 0) '목차 혼란' 문제 자체가 과대평가다. 올바른 수정은 3개 파일 번호 체계를 함께 재조정하는 인간 편집 판단이지 자동 단일파일 renumber가 아니다. 스킬 콘텐츠/참조 JSP는 모두 현용이므로 KEEP가 정직한 매핑이다.

#### P63 · `.claude/hooks/ (orphaned: agentStateManager.js, autoFormatter.js, backupGc.sh, geminiAutoTrigger.js, observationsRoller.js, observe.js, outputSecretFilter.js, shellContextTokenizer.js, themeCssVerGuard.sh) + .min.js 4종`

- **현재 목적**: settings.json에 미와이어된 hook 파일 10종 + 사용되지 않는 .min.js 4종(ethicalValidator/permissionGate/postToolOrchestrator/shellContextTokenizer).
- **발견한 문제**: 인벤토리 anomaly: 10개 hook이 settings.json에 미와이어(dead code 또는 superseded 의심). 단 일부(autoFormatter/observe/outputSecretFilter/shellContextTokenizer/themeCssVerGuard)는 postToolOrchestrator.js가 내부 require/execSync로 호출하는 통합 대상일 수 있어 진짜 orphan과 구분 필요. .min.js 4종은 와이어도 사용도 안 됨(목적 불명). 보수적으로 즉시 DELETE 대신 와이어 경로 확인 후 정리.
- **근거**: 인벤토리 orphaned-hooks 10종 + hook-minified-duplicates 4종. postToolOrchestrator.js 헤더가 autoFormatter/buildChecker/scss/geminiAutoTrigger/observe/outputSecretFilter 통합 명시 — 일부는 orchestrator 경유라 진짜 dead 아님.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: orchestrator 경유 호출 여부를 확인해 진짜 dead(.min.js 4종, backupGc/observationsRoller/agentStateManager 미참조분)만 정리; orchestrator 의존분은 유지. hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: All 9 listed hook files are live hub-delegated dependencies (require/execSync from the wired postToolOrchestrator.js, stopEvent.js, ethicalValidator.js, permissionGate.js) — verified at file:line. The 'orphan' classification is a scanner artifact that only inspected direct settings.json wiring and missed sub-hook delegation; these are KEEP, not SHRINK, because removing them deletes active safety hooks. The only genuinely unwired items are the 4 .min.js, but they are git-recoverable and CHANGELOG-documented as candidate performance drop-in replacements (one corrupted) — i.e. an unfinished human use-vs-remove optimization decision, not an automatable cleanup. With harness_diet_auto=false and the SHRINK premise factually wrong for 9 of the items, the conservative correct move is KEEP, with the min.js use-or-remove call deferred to explicit human review.

---

## 4. 전역 지침에서 Skill로 옮길 항목 (MOVE)

#### P1 · `.claude/rules/power-stack.md`

- **현재 목적**: 모든 작업에 4단계 프레임워크 파이프라인(Gstack→GSD→Superpowers TDD→Gemini QA)을 always-on으로 강제하는 전역 워크플로우 규칙. CLAUDE.md line 32에 always-on 링크.
- **발견한 문제**: 참조 인프라가 실재하지 않음(.gstack/personas, .gsd/states/current_state.md, .superpowers/specs 모두 부재). 단순 편집/조회까지 무거운 4-Phase를 전 작업에 강제해 비용 대비 가치 최악. 네이티브 plan mode + TodoWrite + superpowers 플러그인(brainstorming/TDD/verification)과 정면 중복. Phase 4는 sunset 예정 Gemini CLI 의존. *.test.ts 등 Java8/JSP 무관 예시 포함.
- **근거**: 21줄. line 5 '반드시 4단계 파이프라인 준수', line 8 .gstack/personas/(부재), line 13 .gsd/states/current_state.md(부재), line 17 .superpowers/specs(부재), line 21 Phase 4 Gemini CLI. CLAUDE.md line 32 always-on 링크. 네이티브 EnterPlanMode/ExitPlanMode+TodoWrite+superpowers:test-driven-development/verification-before-completion이 동일 보장 제공.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/kiips-power-stack(신규 on-demand Skill) 또는 기존 superpowers:* 스킬로 흡수. 부재 디렉토리 참조 전부 제거, '무거운 신규 기능 착수 시에만' 트리거. CLAUDE.md line 32 always-on 링크 삭제.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: always-on에서 빼서 on-demand 스킬화; 죽은 .gstack/.gsd/.superpowers 경로 제거 후 superpowers 플러그인으로 위임.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 핵심 결함은 always-on 비용이 아니라 (a) 죽은 참조 인프라(.gstack/personas, .gsd/states/current_state.md, .superpowers/specs 전부 부재), (b) 레포 무관 예시(*.test.ts → Java8/JSP 레포), (c) sunset 위험 Gemini CLI 의존(Phase4), (d) 실존하는 superpowers:test-driven-development / verification-before-completion / brainstorming 으로 이미 대체됨. 이 깨진/낡은 내용을 제자리에서 제거·갱신하는 것이 어느 verdict 에서도 수행되어야 할 비논란 코어 작업이다. 원래 MOVE 를 downgrade 하는 이유: 신규 kiips-power-stack 스킬을 만들면 superpowers 플러그인을 그대로 중복 재생산할 뿐이고, 확률적 on-demand 트리거라 정작 무거운 신규 기능 착수 순간 발동 실패 위험(규율 파이프라인 발견성을 도박에 거는 안전망 제거)이 있다. 또한 problem 의 '전 작업 always-on 강제 비용 최악' 프레이밍은 과장 — line 32 는 Rules 카탈로그 표의 한 행이며 Top-5 강제 규칙이 아니다(always-on 비용 약 1줄, 본문은 링크 추적 시에만 로드). 따라서 더 보수적이고 방어 가능한 조치는 SHRINK: power-stack.md 를 제자리에서 재작성해 부재 디렉토리 참조·Gemini 의존·잘못된 기술스택 예시를 모두 제거하고, 4개 Phase 를 실존 superpowers 스킬에 재지정하며, CLAUDE.md 카탈로그의 1줄 넛지는 발견성 유지를 위해 보존한다. 신규 스킬 신설은 하지 않는다(superpowers 중복 방지). 죽은 참조+잘못된 예시 제거는 양쪽 verdict 공통의 논란 없는 코어이고, 스킬 전환 대 제자리 재작성 여부가 사람의 판단이 필요한 부분이다.

#### P7 · `.claude/rules/dark-theme.md`

- **현재 목적**: 다크테마 SCSS 작업 규칙([data-theme=dark] 셀렉터, 색상 속성만 변경, 레이아웃 변경 금지). CLAUDE.md 카탈로그(line 28) always-on 링크.
- **발견한 문제**: 특정 작업(다크테마 SCSS 편집)에서만 관련된 규칙인데 매 세션 전역 카탈로그에 노출. 빌드·Java·MyBatis·결재 등 대다수 작업과 무관. themeCssVerGuard.sh 훅도 별도 존재. 내용 자체는 유효한 안전망이라 DELETE 아님.
- **근거**: 37줄. CLAUDE.md line 28 always-on 링크. line 14 참조 themes/default/_dark.scss·layouts/_dark.scss는 SCSS 전용. verification.md line 43에서도 중복 언급.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/kiips-scss(기존 SCSS 스킬)에 흡수 또는 on-demand Skill. description 트리거 '다크테마, data-theme, _dark.scss, SCSS 색상'. CLAUDE.md line 28 always-on 링크 제거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: kiips-scss 스킬로 흡수하고 always-on 카탈로그에서 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: MOVE 는 (a) 메커니즘이 작동 불가(kiips-scss 는 disable-model-invocation:true 라 키워드 자동 트리거 안 됨)이고, (b) live 경로를 끊는다 — scssValidator.sh(settings.json 에 등록된 PostToolUse, 모든 .scss 편집마다 실행)의 위반 안내가 line 90 에서 'CLAUDE.md > Dark Theme Rules' 를 가리키므로 always-on 링크를 지우면 적발 순간 사용자가 dangling pointer 로 간다. 규칙 본문은 이미 kiips-scss SKILL.md line 167-189 에 사본이 있어 '흡수'는 이미 완료 상태이고, dormant 사본(스킬)을 승격하려 live 사본(rules+훅 안내 타깃)을 제거하는 역전이다. check-rules.md/architecture.html/workflow.html/instinct 4곳이 dark-theme.md 를 이름으로 참조해 추가 dangling 도 발생. 상시 비용은 표 1행(~15단어)에 불과해 제거 편익이 거의 없다. 진짜 중복은 비활성 스킬 섹션(line 167-189)이며 이는 다른 경로로 P7 범위 밖이라 dark-theme.md 자체는 SHRINK 도 부적절(이쪽이 live 사본). 결론: always-on 링크 유지(KEEP).

#### P8 · `.claude/rules/validation.md`

- **현재 목적**: Controller 계층 입력 검증(Boundary Validation) 원칙 + KiiPS Java 패턴 예시. CLAUDE.md 카탈로그(line 31) always-on 링크.
- **발견한 문제**: Java/Spring Controller 작성·수정 작업에서만 관련된 도메인 한정 규칙인데 always-on. JSP/SCSS/MyBatis-only/문서 작업과 무관. line 22-40의 19줄 Java 코드 예시는 컨텍스트 비용이 큰데 검증 로직 작성 시에만 필요. ecc:java-coding-standards/springboot-patterns와 주제 중복 가능.
- **근거**: 47줄. CLAUDE.md line 31 always-on. line 22-40 @PostMapping save() 19줄. line 17-18 XSS/SQL Injection은 jspXssGuard.js·mybatisBindingGuard.js와 주제 겹침.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/legacy-compliance-checker 또는 신규 kiips-controller-validation on-demand Skill에 흡수. CLAUDE.md line 31 always-on 링크 제거, Controller 작업 시 트리거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: on-demand 스킬화, always-on 제거; 코드 예시는 reference로.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: MOVE는 거부(over-reach)하되 제안이 짚은 단 하나의 실질 비용은 인정해 SHRINK로 강등한다. MOVE가 위험한 이유: 파일을 현 경로에서 이동/흡수하고 always-on 링크를 제거하면 jspXssGuard.js:113과 check-rules.md의 reference가 dangling 되고, 결정론적 차단 훅이 발동하는 바로 그 순간(JSP 편집)에 설명 규칙은 확률적 스킬 트리거(Controller 작업) 뒤에 있어 로드 안 될 위험이 있다 — 노이즈 감소가 아니라 방어 layer 약화. 동시에 제안의 유일한 정당한 지적은 line 22-40의 19줄 @PostMapping save() Java 예시가 always-on 규칙치고 컨텍스트 비용이 크다는 점이다. SHRINK 범위는 그 코드 예시(line 22-40)만 몇 줄 또는 reference 포인터로 압축하는 것으로 한정한다. 반드시 보존: (a) 파일 현 경로 .claude/rules/validation.md(훅+커맨드 reference 유지), (b) always-on / CLAUDE.md line 31(JSP 편집 시 동시 로딩 유지), (c) line 17-18 XSS/SQLi 체크리스트 행(가드 앵커 텍스트). 이렇게 하면 컨텍스트 절감이라는 실익은 챙기되 load-bearing 부분은 손대지 않는다.

#### P9 · `.claude/rules/error-handling.md`

- **현재 목적**: 디버깅 프로토콜(근본 원인 우선, 한 번에 하나, 악화 시 중단, 캐시 임의 삭제 금지). CLAUDE.md 카탈로그(line 30) always-on.
- **발견한 문제**: 디버깅/에러 대응 작업에서만 관련된 규칙인데 always-on. /diagnose 커맨드 + superpowers:systematic-debugging가 같은 영역을 더 풍부하게 다뤄 중복. line 13-22 디버깅 프로토콜은 ralph-loop-detection.md 롤백 프로토콜과 '악화 시 되돌리기' 중복. line 7 캐시 삭제 금지(.m2/node_modules)만 KiiPS 특화 고가치.
- **근거**: 29줄. line 13-22 6단계 = /diagnose·superpowers:systematic-debugging 중복. line 9 = ralph-loop 롤백. line 7만 KiiPS 특화.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: /diagnose 스킬 또는 superpowers:systematic-debugging으로 흡수하고 KiiPS 특화(line 7 캐시 삭제 금지)만 해당 스킬에 통합. CLAUDE.md line 30 always-on 링크 제거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: diagnose 스킬로 흡수, 캐시 삭제 금지 한 줄만 보존, always-on 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 중복(debugging protocol line 13-22 6단계 = /diagnose 4-phase + error-diagnose-first instinct, conf 0.85/45obs)은 실재하므로 줄일 여지는 맞다. 그러나 MOVE 대신 SHRINK가 안전하다: line 13-22 6단계 프로토콜과 중복 롤백 문구만 제거하고, 파일은 always-on 유지하되 KiiPS 특화 캐시 삭제 금지(line 8)+다른 곳에 없는 1-2줄만 남긴다. 핵심 tie-breaker: 캐시 삭제는 이미 settings.json deny 'rm:*' / 'rm -rf:*'(line 170/176)로 퍼미션 레이어에서 하드 차단되므로 마크다운 rule은 enforcement가 아닌 설명이다 — 따라서 always-on에 남겨도 토큰 비용은 1-2줄로 최소화되고, on-demand 미로딩 리스크를 피한다. MOVE의 진짜 이득(중복 제거)은 SHRINK로 동일하게 달성되며, 고가치 라인을 편집 불가한 플러그인 캐시로 잃거나 확률적 로딩에 맡기는 리스크는 제거된다.

#### P32 · `.claude/checklists/ (code-review.md, deployment.md, testing.md, jsp-spring-specific.md)`

- **현재 목적**: KiiPS 특화 정적 체크리스트 템플릿(-am 플래그, 포트 8000, COMMON/UTILS 의존, /actuator/health).
- **발견한 문제**: 네이티브 TodoWrite와 중복되는 건 '동적 추적'이지 이 '정적 도메인 지식'이 아님. 그러나 .claude/checklists/ 별도 디렉토리에 고립되어 발견성 낮고, 네이티브 /code-review·/security-review·ecc:security-review와 일부 항목 중복.
- **근거**: 4개 정적 파일. KiiPS 고유 참조지식(빌드/포트/모듈) — ephemeral task 아님. 네이티브 /code-review가 동일 리뷰 카테고리 커버.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/memory/ 또는 도메인 스킬(kiips-frontend-guidelines/legacy-compliance-checker)의 reference로 통합. 동적 추적은 TodoWrite 담당.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 정적 KiiPS 참조지식을 발견성 높은 메모리/도메인 스킬 reference로 이관.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 발견성-고립과 중복이라는 두 전제가 모두 실측으로 반증됨. checklist-generator 에이전트(.md:98-101 상대경로 표)+SKILL(line 42)+3개 매니저(feature/ui/build-manager)가 이 4개 파일을 reference로 실제 사용 중이라 MOVE 시 상대경로 링크가 깨진다. KiiPS 고유 빌드/포트/모듈/다크테마 지식은 네이티브 /code-review 가 커버하지 않는 유일 자산이므로 defense-in-depth가 아니라 unique 도메인 지식이다. harness_diet_auto 자동 패스가 링크를 깨고, MOVE 타겟 memory가 이미 충돌 포트(8000 vs 8088)를 가져 자동 병합 시 오류 전파 위험까지 있어 KEEP 유지가 타당. 별도 content-quality 플래그(8088/8000 포트 불일치)는 verdict와 무관하게 사람이 정정할 후속 항목으로만 남김.

#### P38 · `.claude/hooks/multiFileGate.js (PreToolUse Edit|Write, settings.json L40-48)`

- **현재 목적**: 3개 이상 파일 동시 변경 시 경고하려는 advisory 게이트.
- **발견한 문제**: 헤더·코드 모두 'exit(0) always: WARN gate, never blocks' — 절대 차단하지 않는 advisory인데 차단 위치인 PreToolUse에 와이어되어 매 Edit/Write마다 Node 프로세스 spawn. 사고를 막지 못하면서 마찰/오버헤드만 추가('반복 실수 방지' 원칙 미부합, 차단력 0).
- **근거**: multiFileGate.js L6-7 'exit(0) always: WARN gate, never blocks / Fail-open'. grep exit(2)=0건, decision block=0건. settings.json PreToolUse Edit|Write 등록.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: PreToolUse(차단 위치)에서 제거하고 PostToolUse orchestrator(postToolOrchestrator.js)로 통합하거나 advisory 출력만 유지.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 차단 게이트 아니므로 PreToolUse 슬롯에서 PostToolUse orchestrator로 이전; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: Keep multiFileGate.js wired at PreToolUse Edit|Write. The finding's core observation (advisory hook, exit 0 always, zero blocking) is factually correct, but MOVE is the wrong remedy: PostToolUse fires the threshold warning after the 3rd file is already written, breaking the BEFORE-approval edge that anti-rationalization.md explicitly delegates to this hook, and relocating one of eight PreToolUse spawns does not solve the per-edit overhead it cites. The real overhead remedy is a PreToolUse orchestrator mirroring the existing postToolOrchestrator.js — consolidating the exit(0)-WARN hooks (multiFileGate + impactAnalyzer, same pattern) into one process while preserving Pre-edit timing. Two genuine defects to repair IN PLACE rather than by moving: (a) wire the 'approve multi-file' suppression (no hook currently sets approved:true, so the documented suppression/approval path is dead and the approved-branch is unreachable), and (b) confirm whether the exit(0) stderr box actually surfaces to agent vs user — the regression suite only does load_test, with no behavioral threshold assertion, so there is no evidence the warning ever fires. Record these as repair findings; do not DELETE (it is a documented member of the 5-gate safety set) and do not MOVE.

#### P39 · `.claude/hooks/impactAnalyzer.js (PreToolUse Edit|Write, settings.json L67-75)`

- **현재 목적**: KIIPS-COMMON/UTILS 등 공용 모듈 변경의 의미적 영향을 경고하는 advisory 게이트.
- **발견한 문제**: multiFileGate와 동일하게 'exit(0) always: WARN gate, never blocks' advisory인데 PreToolUse 차단 위치에 등록되어 매 Edit/Write마다 Node 프로세스 spawn. 차단력 없이 PreToolUse 게이트 수만 늘려 마찰 증가.
- **근거**: impactAnalyzer.js L8-9 'exit(0) always: WARN gate, never blocks / Fail-open'. grep exit(2)=0건. settings.json PreToolUse Edit|Write 등록.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: PostToolUse orchestrator로 통합하여 advisory 유지. PreToolUse 차단 슬롯에서 제외.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: advisory를 PostToolUse로 이전; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: MOVE는 단순 잉여 제거가 아니라 가드를 능동적으로 퇴화시킨다. PostToolUse는 write 이후에만 실행되므로 결정-시점 권고가 사후-변이 통보로 바뀐다(순서 논거, stderr 라우팅 무관). finding의 multiFileGate 패리티 논거는 반대로 작동한다: 동급 pre-action advisory인 multiFileGate은 PreToolUse에 정당하게 남아 있고 아무도 Post로 옮기자 하지 않으므로, PreToolUse advisory는 의도된 패턴이다. permissionGate+impactAnalyzer는 kiips-developer.md L31에 강제 쌍으로 문서화된 defense-in-depth이며 트리거(의미적 참조 5+ vs 파일 개수)·목적이 multiFileGate과 다르다. 비용 주장도 과장됨(SHARED_MODULE_PATTERN+.java+30분 throttle 통과 시에만 grep 실행). 따라서 현 위치 유지(KEEP)가 안전하다. 줄일 여지가 있다면 advisory 출력의 verbosity 축소 같은 SHRINK 후보만 별도 검토.

---

## 5. Skill에서 reference.md / examples.md로 분리할 항목 (SPLIT)

#### P17 · `.claude/skills/kiips-checklist-list-popup/SKILL.md`

- **현재 목적**: KiiPS 체크리스트 목록 조회 팝업(아이콘버튼바+RealGrid+셀 더블클릭 분기) JSP UI 표준 패턴. 기준 COMM_POPUP_CHECKLIST_AF_IMM.jsp.
- **발견한 문제**: checklist-generator와는 이름 충돌일 뿐 커버리지 중복 아님(JSP UI 팝업 vs 작업 체크리스트 생성, false collision). 패턴은 현용(동일 패턴 45개 파일 실존). 단 407줄로 300줄 초과(SPLIT 대상)이고 description 트리거 '목록 팝업'/'list popup'이 체크리스트 무관 일반 목록 팝업에도 오발동.
- **근거**: 기준 파일 + IACHK/DD/ESG/LAW/AA 등 45개 파일 실존. 총 407줄. 섹션3 HTML(48-98)·섹션4 컬럼(130-172)·섹션5 핸들러5종(179-339)=약 210줄 코드. description '목록 팝업, list popup' 단독.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: examples.md (섹션3~5: HTML 템플릿·RealGrid 컬럼·이벤트핸들러), reference.md (섹션6~8: API 네이밍·결재상태 매트릭스·유형 카탈로그)
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 코드/참조 분리로 본문≈150줄; 트리거 '목록 팝업'/'list popup'을 '체크리스트 목록 팝업'으로 한정. 패턴 자체는 KEEP.

#### P20 · `.claude/skills/kiips-button-guide/SKILL.md (+ reference.md)`

- **현재 목적**: 버튼 영역 종합 가이드(inc_main_button.jsp, 도메인별 버튼, 권한, 아이콘 클래스). SKILL.md 426L.
- **발견한 문제**: 426줄로 300줄 초과. reference.md/examples.md가 이미 존재해 SPLIT 구조 절반만 적용. Part 3.1/3.2 표준 버튼 HTML(약 70L)은 examples.md에 이미 있어 중복, Part 4 아이콘 목록(약 25L)은 reference.md 이관 가능. icon_filter는 button JSP에서 미사용(stale 1건). reference.md 줄수 테이블이 실제와 수백 줄 불일치(stale). frontend-guidelines/ui-component-builder는 button-guide를 참조만 하므로 커버리지 중복 아님. 트리거 '권한'/'AUTH'가 약간 넓으나 KiiPS 고유 식별자 동반으로 오탐 낮음.
- **근거**: wc -l 426. Part 3.1 버튼 HTML(272-329)은 examples.md 중복. Part 4 icon_filter grep 0건. reference.md 줄수표: il 4205→4440, pg 3202→3247, ac 2255→2346, mi 939→998 불일치.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: examples.md (Part 3.1/3.2 HTML 코드 블록 이관), reference.md (Part 4 아이콘 목록 이관·icon_filter 삭제)
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 코드/아이콘을 보조파일로 이관해 본문 핵심 규칙(라우팅·OR-chain·btn-primary 매트릭스)만; icon_filter 제거, 줄수 하드코딩 테이블 삭제(유지보수 부담).

#### P33 · `.claude/hooks/observe.js + .claude/learning/ (observations.jsonl, instincts) + /learn /evolve /instinct-*`

- **현재 목적**: PostToolUse 도구 사용 패턴 수집 → observations.jsonl → 클러스터링 → instinct(.md, 신뢰도) → /evolve 진화. 능동 학습 파이프라인.
- **발견한 문제**: 네이티브 Memory는 수동/파일기반 저장소이지 관찰→클러스터링→신뢰도 가중 instinct 진화 파이프라인이 아님 → 핵심 학습 루프는 가산적(중복 아님). 단 .claude/memory/*.md(mybatis-patterns/realgrid-patterns 등) 정적 패턴은 네이티브 File-based Memory와 1:1 매핑되므로 그 부분만 분리.
- **근거**: observe.js PostToolUse 수집. learn.md L91-117 instinct 생성(신뢰도 0.5~0.9) + L126-137 memory/*.md 연동(후자만 네이티브 매핑). /evolve·/instinct-* 네이티브에 없는 진화 로직.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: .claude/memory/*.md 정적 패턴 → 네이티브 File-based Memory로 흡수. observe.js+instinct 클러스터링/진화 파이프라인 → 고유 기능 유지(KEEP).
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 정적 패턴 메모리만 네이티브로, 진화 파이프라인은 보존; hook 관련이라 사람 승인.

#### P49 · `.claude/skills/kiips-frontend-guidelines/SKILL.md`

- **현재 목적**: JSP/jQuery/Bootstrap 표준 패턴, AJAX, 이벤트, XSS, 다크모드 가이드(310L).
- **발견한 문제**: 310줄로 SPLIT 초과 + 트리거 과넓음. 트리거 'JavaScript, UI, 화면, 페이지'는 거의 모든 프론트엔드 세션 매칭이라 더 구체적 스킬(realgrid/search-filter/regist-modal/button)과 함께 오발동. 폼 컴포넌트 규칙(L29-143, 115L)은 HTML 스니펫 레퍼런스, 다크모드(L251-302, 52L)는 이미 kiips-scss 위임 — 두 섹션 분리 시 본문 약 143줄.
- **근거**: wc -l 310. L3 'Use when: JSP, JavaScript, UI, 프론트엔드, 화면, 페이지'. L29-143 폼 컴포넌트 115L, L251-302 다크모드 52L(L300 'kiips-scss 참조' 위임 존재). orchestration/legacy-compliance-checker도 이 스킬 참조(연쇄 트리거).
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: examples.md (폼 컴포넌트 HTML 스니펫 전체), reference.md (다크모드 상세, kiips-scss 위임 섹션)
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 코드/다크모드 분리로 본문≈143줄; 트리거에서 'UI/화면/페이지/JavaScript' 축소.

#### P52 · `.claude/skills/kiips-operator-onboarding/SKILL.md`

- **현재 목적**: 신규 운용사 로그인 페이지 자동 설정 파이프라인(LibConfiguration, signup SCSS, 로고, 캐시버스팅).
- **발견한 문제**: stale + 트리거 + 길이. (1) header.jsp의 theme.css 캐시버스터를 YYMMDD_N(260518_0)로 기술하나 실제 ver=250518(6자리, _N 없음) — 잘못 갱신/검증 grep 빗나감. (2) 트리거 '신규 LIB 추가'가 LibConfiguration 무관 맥락(DB 라이브러리/매퍼 추가)에 오발동. (3) 296줄로 임계 근접 — 섹션9 실행 예시(40L)+섹션11 트러블슈팅(11L) 분리 가능. 인벤토리상 skills-registry.json 미등록(26 vs 27)이라 하네스 미발견 가능. disable-model-invocation 미설정은 인터랙티브 파이프라인이라 적절.
- **근거**: SKILL L64/148/204/208 'YYMMDD_N/260518_0', header.jsp:85 ver=250518, signup.jsp:50 ver=260518(둘 다 _N 없음). L3 '신규 LIB 추가'. wc -l 296, 섹션9 L222-261. 인벤토리 anomaly: kiips-operator-onboarding registry 미등록.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: .claude/skills/kiips-operator-onboarding/examples.md (섹션9 실행 예시), reference.md (섹션11 트러블슈팅 표)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 캐시버스터 형식을 실제 6자리(_N 없음)로 교정, '신규 LIB 추가' 트리거 한정, 예시/트러블슈팅 분리, skills-registry.json에 등록(누락 수정). 사람 검증.

#### P54 · `.claude/skills/kiips-page-pattern-guide/SKILL.md`

- **현재 목적**: KiiPS JSP 페이지 표준 패턴 참조 스킬(501L). Part 10-A(Controller 등록, kiips-page-harness가 SoT로 호출), Part 11(다크모드).
- **발견한 문제**: 501줄로 300줄 크게 초과 — reference.md(346L)/examples.md(183L) 존재에도 Part 10-A(Controller 자동 등록, 약 155L)·Part 11(다크모드, 약 70L)이 본문에 잔존. 핵심 구조 패턴과 절차/규칙 참조가 혼재. 부수 stale: LIBUIController.java 실존하나 매핑표에 LIB 행 누락, 반대로 LP 도메인은 표(L136)에 있으나 JSP 디렉토리/Controller 부재(stale). description 트리거·NOT-for 가드는 적절.
- **근거**: L273-427 Part 10-A 전체, L429-501 Part 11. reference.md 346L(Part 5만), examples.md 183L. find: LIBUIController.java 존재, kiips/LP/ 없음. L136 'LP관리|LP|-|KiiPS_LP'.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: reference.md (Part 10-A Controller 등록 절차 + Part 11 다크모드 규칙 이동; SKILL.md엔 요약 2~3줄 + 링크)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: Part 10-A/11을 reference.md로 이관해 본문 경량화; 매핑표에 LIB 행 추가, stale LP 행 제거. page-harness가 SoT 호출하므로 이동 후 링크 정합 확인.

#### P55 · `.claude/skills/kiips-realgrid-guide/SKILL.md`

- **현재 목적**: RealGrid 2.6.3 그리드 생성·설정·체크박스·에디터·Excel·성능 종합 가이드(467L).
- **발견한 문제**: 467줄로 300줄 초과 — reference.md(432L)/examples.md 존재에도 체크박스 토글(L196-263)+헤더 체크박스(L266-397) 약 200줄이 본문 인라인. 부수 stale: 'RealGrid 2.6.3' 단독 선언이나 header.jsp(L217-231)는 /LOGOS_ERP1에서 2.8.8, 나머지 2.6.3 로드하는 이중 버전(2.8.8 미언급). 트리거 '테이블' 단독이 HTML/SQL/DB/CSS table에 오발동. disable-model-invocation 미설정은 참조 가이드라 적절.
- **근거**: wc -l 467. L196-263 셀 체크박스 68L, L266-397 헤더 체크박스 132L. reference.md 432L. header.jsp L217-231 2.8.8/2.6.3 분기, vendor에 양 버전 존재. L3/L29 '테이블' 단독.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: reference.md (체크박스 토글 상세 코드·금지 패턴 이동; SKILL.md엔 'type:html+전역 토글, type:check+onCellClicked 금지' 요약만)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 체크박스 200줄을 reference로 이관, 2.8.8 이중 버전 명시, 트리거 '테이블'→'그리드 테이블' 한정.

#### P56 · `.claude/skills/kiips-scss/SKILL.md`

- **현재 목적**: SCSS 시스템 변수 원칙/카탈로그/다크테마/안티패턴/체크리스트/캐시버전/로고/색상매핑(531L, disable-model-invocation).
- **발견한 문제**: 531줄로 임계 크게 초과 — 시스템 변수 카탈로그(L62-163)·색상매핑(L497-515)·캐시버전 트리(L313-372)·로고 패턴(L382-457)은 실행 참조용이라 reference 분리 대상. 부수 stale: 파일구조 다이어그램(L23)에 themes/default/_variables.scss 기재하나 실제 부재(_colors/_dark/_light/_styles만 존재); 캐시버스터 YYMMDD_N 규약이나 실제 header.jsp:85 ver=250518(_N 없음). themeCssVerGuard.sh hook 연동 섹션이라 자동처리 금지. disable-model-invocation 적절.
- **근거**: wc -l 531. L23 _variables.scss(부재). 캐시 L293-372 YYMMDD_N, header.jsp:85 ver=250518. L357 themeCssVerGuard.sh 연동. 카탈로그 L62-163, 로고 L375-457.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: reference.md (시스템 변수 카탈로그 A/B/C + 색상매핑 + 캐시버전 절차 + 로고 패턴/검증 명령 이동)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 참조성 섹션을 reference.md로; _variables.scss stale 제거, 캐시버스터 형식 실제값과 정합. themeCssVerGuard 연동이라 사람 검증.

#### P57 · `.claude/skills/kiips-security-guide/SKILL.md`

- **현재 목적**: Spring Security 설정, XSS/CSRF, 인증/인가, 민감정보 보호, 코드 리뷰 체크리스트, KiiPS 특화 규칙(280L).
- **발견한 문제**: 트리거 과넓음 + SPLIT 근접 + deprecated API. (1) 트리거 '인증, 로그인, JWT, 토큰, 비밀번호, 암호화'가 일상 기능 구현(로그인 UI, 토큰 파싱, 비밀번호 폼)에도 오발동. (2) Part 6 체크리스트(L226-248)+Part 7 KiiPS 특화(L250-280) 약 55L 참조성 → 280줄로 SPLIT 경계 근접. (3) WebSecurityConfigurerAdapter를 '표준 패턴'으로 제시(SS 5.7 deprecated, 6.0 제거; 현재 Boot 2.4.2라 동작하나 마이그레이션 혼선·경고 없음).
- **근거**: L3 'Use when: 인증, 로그인, JWT, 토큰, 비밀번호, 암호화'. L226-248/L250-280 Part 6-7. L31 extends WebSecurityConfigurerAdapter. KiiPS-HUB/pom.xml Boot 2.4.2(SS 5.4.x).
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: reference.md (Part 6 체크리스트 + Part 7 KiiPS 특화 규칙 이동; SKILL.md엔 링크 한 줄)
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 체크리스트/특화규칙 reference 분리, 트리거를 보안위협 맥락으로 한정, WebSecurityConfigurerAdapter에 deprecated 경고/병기 추가. 보안이라 사람 검증.

#### P59 · `.claude/skills/kiips-ui-component-builder/SKILL.md (+ reference.md)`

- **현재 목적**: 기존 페이지에 UI 컴포넌트 단건 추가(RealGrid/ApexCharts/Bootstrap 폼/팝업). SKILL.md 472L.
- **발견한 문제**: 472줄로 300줄 크게 초과(reference.md/examples.md 존재에도). Section 0 RealGrid 헬퍼 매트릭스(L53-229, 177L)는 kiips-realgrid-guide와 중첩 가능, Section 1-2 스니펫(L231-295)은 examples.md에 일부 이미 존재(양쪽 중복). 부수 stale: reference.md Bootstrap 검색폼 예제가 BS5 전용 form-select·row g-3·native date 사용(KiiPS는 selectpicker 10062건/form-select 0건, 표준 flatpickr-basic과 충돌 → 스타일 파손). Related Skills 표에 kiips-quality 2행 중복. disable-model-invocation 미설정은 적절.
- **근거**: wc -l 472. Section 0 L53-229=177L, Section 1-2 L231-295=65L(examples.md:1-144 중복). reference.md:150 form-select, :138 row g-3, :160 native date vs SKILL:357 flatpickr-basic. grep form-select 0건/selectpicker 10062건. SKILL:459-460 kiips-quality 2행.
- **추천 조치**: `SPLIT`
- **옮긴다면 추천 위치**: reference.md (헬퍼 매트릭스 전체 코드 + 체크박스 토글 상세), examples.md (Section 1-2 인라인 스니펫)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 본문은 의사결정 규칙만, 상세 코드는 reference/examples로; reference.md 검색폼을 KiiPS 표준(selectpicker+flatpickr-basic)으로 교정, kiips-quality 행 1개로 병합.

---

## 6. 삭제 후보 (DELETE) + 네이티브 대체 (CONVERT)

> `DELETE`는 완전 제거, `CONVERT`는 커스텀 구현을 제품 네이티브 기능으로 대체(=커스텀 제거)하는 것이므로 함께 묶습니다.

### 6-A. DELETE

#### P26 · `.claude/hooks/gemini-bridge.js + geminiAutoTrigger.js + geminiReviewGate.js + .claude/commands/gemini-scan.md + .claude/gemini-bridge/ + settings.json gemini allow 패턴`

- **현재 목적**: 외부 Gemini CLI 교차검증 스택 전체: UDS 소켓 lazy daemon 자동 리뷰 큐(geminiAutoTrigger 547L), 3모드 CLI(gemini-bridge 781L), Critical 리뷰 미해결 파일 Edit/Write 차단 게이트(geminiReviewGate, 24h TTL fail-open), /gemini-scan 보안 스캔 커맨드.
- **발견한 문제**: 전체 스택이 2026-06-18 sunset 대상(오늘 기준 10일). 외부 폐쇄소스 CLI(Antigravity)+'Continue with Google' 인증 의존. callCount 8/900으로 사실상 미사용. fail-open이라 sunset 후 무의미. 네이티브 Subagent/Task + /code-review + /security-review(또는 ecc:code-review)가 동일 교차검증 보장 제공 → 외부 의존 정당성 소멸. 1300+줄 + settings.json allow 패턴 3개 + 디렉토리 운영 부담. (gemini-scan 단독 KEEP 의견은 sunset을 미반영 — 스택으로 통합 처리.)
- **근거**: antigravity-cli-migration-plan.md: Sunset 2026-06-18, callCount 8/900. gemini-bridge.js 781L, geminiAutoTrigger.js 547L. settings.json L433-448 gemini allow 패턴 3개. geminiReviewGate.js L1-9 fail-open, L186 exit(2). 네이티브 /code-review·/security-review 존재.
- **추천 조치**: `DELETE`
- **옮긴다면 추천 위치**: 교차검증은 네이티브 Task 서브에이전트 + /code-review·/security-review(또는 ecc:code-review)로 대체. settings.json의 gemini allow 패턴 3개도 함께 제거. sunset(2026-06-18) 이후 일괄 제거.
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: sunset 후 스택 전체 제거; 그 전까지는 네이티브 리뷰로 전환 운영. hook/permission 변경이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Do NOT delete now. Replace immediate DELETE with a time-gated, verification-conditioned disposition. Until 2026-06-18: KEEP the stack as-is (it currently works on the local Antigravity binary; the independent-vendor PreToolUse critical-block gate is genuine defense-in-depth that native same-model review does NOT replicate). The only safe pre-sunset reduction (SHRINK) is trimming accumulated runtime cruft in .claude/gemini-bridge/ (stale logs, duplicate empty pending-files.txt, old reviews/archive) — never the code guards or settings.json entries. AFTER 2026-06-18: run the migration-plan Phase-1 auth check (one real gemini -p call). IF and ONLY IF calls are confirmed blocked AND the team declines GCP/API-key migration, THEN the stack is truly dead-weight and removal is justified — at which point remove all 4 settings.json entries (L54 hook + L434/440/446 allow patterns), the 1300+ lines, and the postToolOrchestrator wiring (L177-182, L202) together. The finding inverts its own cited source and acts 10 days early on an unverified auth assumption; the conservative path preserves a working cross-vendor enforcement gate at near-zero cost (callCount 8/900) and defers the legitimate cleanup to the moment evidence supports it. gemini-scan.md rides with the stack decision, not deleted independently.

### 6-B. CONVERT (네이티브로 대체)

#### P12 · `.claude/output-styles/efficient.md`

- **현재 목적**: 간결 출력 스타일(★ Insight 포맷). 커스텀 output-style 후보.
- **발견한 문제**: 고아(orphan) 파일 — 활성 output-style은 settings.local.json line 54의 'Explanatory'이고 'efficient'는 어디서도 선택되지 않음. grep 0건. 'efficient'(간결)와 'Explanatory'(설명적)는 정반대 지향이라 의도 불명확.
- **근거**: 19줄. settings.local.json line 54: outputStyle='Explanatory'. settings.json/local 어디에도 'efficient' 참조 없음. git 12월 26일 이후 미수정.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 미사용 output-style — 'efficient'를 실제 채택할지 결정 후 settings에 명시 적용하거나 파일 제거. 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 고아 전제가 거짓으로 입증됨. 전역 ~/.claude/settings.local.json line 3 outputStyle=efficient 가 이 파일과 동일한(byte-identical) 스타일을 활성으로 선택 중이며, 프로젝트 파일은 그 verbatim 사본이다. 프로젝트의 Explanatory override 는 의도적 per-project 선택이다. output-style 은 선택 시에만 on-demand 로딩되는 inert 파일이라 제거해도 context tax 절감 이득이 없어 harness-diet 명분이 부적용된다. KEEP. 전역과의 동일 사본 중복은 별도 finding 으로만 기록하되, 의도된 fallback 일 수 있으므로 보수적으로 유지.

#### P14 · `.claude/skills/checklist-generator/SKILL.md + .claude/agents/checklist-generator.md`

- **현재 목적**: 코드리뷰/배포/테스트 체크리스트 동적 생성. 스킬(49L, disable-model-invocation) + 에이전트(113L, tools: Read/Write/TodoWrite, haiku).
- **발견한 문제**: 스킬과 에이전트가 같은 Code Review/Deployment/Testing 항목(KiiPS 컨벤션 Controller/Service/DAO, SQLi/XSS, #{} 사용, GlobalExceptionHandler, 5-15개 규칙)을 각자 보유. 체크리스트 '생성' 행위는 네이티브 TodoWrite로 직접 대체 가능 — 별도 haiku 서브에이전트 분리 가치 낮음. 단 정적 도메인 항목 내용은 보존 가치. (스킬의 disable-model-invocation 설정과 49줄 길이 자체는 적절 = 그 facet은 KEEP였으나, 에이전트 중복이라는 실질 결함이 우선.)
- **근거**: 두 파일 동일 항목 나열. 에이전트 L4 tools가 TodoWrite 포함(네이티브 래핑). L74-78 'Interactive(TodoWrite)' = 네이티브와 동일. 정적 항목은 checklists/*.md와 중복.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 체크리스트 생성은 네이티브 TodoWrite로 대체, 정적 KiiPS 항목은 checklists/*.md(또는 메모리)로 단일화; 스킬은 정본 포인터만.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Reject/KEEP would be wrong — there IS real removable waste: the KiiPS domain checklist content is TRIPLICATED. The same items live inline in SKILL.md, inline in the agent .md, AND in .claude/checklists/*.md (verified: code-review.md L31-34 holds MyBatis #{}, Lucy XSS, GlobalExceptionHandler, JWT — identical to the two inline copies). But CONVERT is too aggressive: it severs a runtime hook route + two registry entries + four managers' delegation target, and TodoWrite does not give the same domain-check guarantee. Correct action is SHRINK: make .claude/checklists/*.md the single canonical source, trim the duplicated inline item lists out of SKILL.md and the agent .md (replacing with a pointer to checklists/, which the agent .md L94-103 already does), and KEEP the agent node plus every piece of its orchestration wiring untouched. This removes the duplication the audit correctly smelled without breaking the delegation graph. The skill's disable-model-invocation:true and 49-line length stay as-is (audit already conceded those facets were KEEP).

#### P30 · `.claude/settings.json (permissionRules block, L166-509 deny entries)`

- **현재 목적**: rm/rm -rf/DROP/TRUNCATE/DELETE FROM/sudo + 시크릿 파일(.env, app-*.properties) 접근을 deny하는 커스텀 permissionRules 배열.
- **발견한 문제**: 스키마가 네이티브 아님(비활성 가능성 높음) + rm/DROP/TRUNCATE 강제는 ethicalValidator.js가 이미 수행 → 삼중 중복. settings.local.json은 네이티브 permissions:{allow}+sandbox:{enabled:true} 사용 중인데 settings.json은 옛 permissionRules:[{type,tool,pattern}] 형식이라 현재 제품이 읽는지 의심.
- **근거**: settings.json L166 permissionRules:[...]. settings.local.json L6 permissions:{allow:[...]} + L55 sandbox:{enabled:true}. ethicalValidator.js L76-79 DROP/TRUNCATE/ALTER..DROP 정규식 강제. permissionGate.js L17-21 'rm/DROP는 ethicalValidator 담당' 명시.
- **추천 조치**: `CONVERT`
- **옮긴다면 추천 위치**: deny 항목을 settings.local.json(또는 settings.json)의 네이티브 permissions.deny 배열로 이관(예: 'Bash(rm:*)','Bash(rm -rf:*)'). 시크릿 파일 보호는 sandbox deny + permissions.deny로 일원화.
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 비네이티브 스키마를 네이티브 permissions.deny로 이관, hook과의 삼중 중복 정리; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `MOVE` · 사람승인필요
  - 반박근거: Downgrade from CONVERT to MOVE because the as-specified target (bare permissions.deny + sandbox deny) is insufficient and mis-rationalized in BOTH possible states. The block is empirically inert (probe returned file-not-found, not permission-denied), so the entries give no real protection today — but the correct response is NOT to convert them 1:1 to permissions.deny, since native deny is prefix-based and cannot express the argument-path Bash secret rules, and the current sandbox has an empty read deny-list. Safer re-homing: (a) destructive-command denial — keep `rm -rf`/DROP TABLE/TRUNCATE TABLE in ethicalValidator (already enforced), and add plain `rm` to native permissions.deny if desired; (b) secret-file protection — extend the existing Edit|Write inline secret hook (settings.json L27) to ALSO cover Read/Grep/Bash matchers, AND populate the sandbox filesystem read deny-list for .env/app-*.properties, because that is the mechanism that actually enforces. Critically: do NOT remove the inert permissionRules block until the replacement is confirmed enforced (re-run the probe and expect permission-denied). Prefer SHRINK/MOVE over DELETE per the conservative safety-net directive; never collapse the sole secret-Read guard on a false 'duplicate' premise.

#### P37 · `.claude/settings.json (permissionRules deny *.properties/.env) + inline python3 hook(L27) + permissionGate.js BLOCKED_PATHS`

- **현재 목적**: app-kiips/stg/local/tibero.properties 및 .env/secrets 파일 접근 차단(민감정보 보호).
- **발견한 문제**: 동일 민감 파일 보호가 3중 중복: (1) settings.json permissionRules deny, (2) settings.json PreToolUse 인라인 python3 훅(blocked 배열), (3) permissionGate.js BLOCKED_PATHS. 인라인 python3 훅은 나머지 둘에 이미 포섭됨 → 중복 게이트.
- **근거**: settings.json L27 인라인 python3 blocked=['.env','secrets','.git/','app-kiips.properties','app-stg.properties','app-local.properties','app-tibero.properties','credentials','.secret','password']. 같은 파일들이 permissionRules deny(L206-357)·permissionGate.js BLOCKED_PATHS(L47-57)에 재등장.
- **추천 조치**: `CONVERT`
- **옮긴다면 추천 위치**: 인라인 python3 PreToolUse 훅(settings.json L22-30) 제거하고 permissionRules deny(→네이티브 permissions.deny, P30) + permissionGate.js로 단일화. 보안 항목이라 사람 승인.
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 동일 보호의 3중 중복 제거(안전망 제거 아님); 보안이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: Do not remove the inline hook now. It is a security safety net whose claimed redundancy is false: permissionGate.js covers none of .env/secrets/.git//app-local/app-tibero/credentials/.secret/password, and permissionRules (a) misses secrets/.git//credentials/.secret/password for Edit/Write and (b) is a non-native key that P30 says is not yet converted to enforced permissions.deny. Removal is safe ONLY after two prerequisites are verifiably met and proven by test payloads: (1) P30 completes — protected files denied via native permissions.deny and confirmed to actually block Edit/Write; (2) permissionGate.js BLOCKED_PATHS extended to cover the full token set (.env, secrets, .git/, app-local.properties, app-tibero.properties, credentials, .secret, password) so a single non-inline layer holds even if the other regresses. Until then the conservative action is to keep the inline hook (defense-in-depth), not CONVERT. If any cleanup is desired before prerequisites, limit it to reconciling/aligning the three protected-file sets in documentation — no deletion of the gate.

#### P47 · `.claude/skills/kiips-db-inspector/SKILL.md`

- **현재 목적**: MyBatis mapper XML 기반 테이블/컬럼 구조 분석 조회 전용 스킬(user-invocable: false).
- **발견한 문제**: 스킬 전체가 존재하지 않는 기술(MyBatis mapper XML)을 전제 — 프로젝트는 mapper XML을 전혀 안 쓰고 DAO가 StringBuffer+JdbcTemplate(DBSelecter) 인라인 SQL 패턴 사용. 분석 대상(mapper/*.xml, resultMap, sql 태그)이 코드베이스에 0건이라 워크플로우 전체 적용 불가 → 단순 trim이 아닌 전면 재작성. 부수: user-invocable:false 비표준 키(다른 스킬은 disable-model-invocation:true), Related 필드에 kiips-mybatis-guide 중복 기재.
- **근거**: find *.xml 결과 mapper XML 없음. FD0303APIDao.java StringBuffer+JdbcTemplate. DBSelecter.java JdbcTemplate 래퍼. SKILL L37-145 mapper 기반. user-invocable:false(L?), Related L222 kiips-mybatis-guide 2회.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: MyBatis 전제를 실제 JdbcTemplate+StringBuffer 인라인 SQL 패턴으로 전면 재작성; user-invocable→disable-model-invocation, Related 중복 제거.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `CONVERT` · 사람승인필요
  - 반박근거: 증거 확증: 전체 프로젝트에 mybatis 0건(어느 pom.xml/config에도 없음), 쿼리용 mapper XML 0건, DAO는 'extends DBSelecter' + StringBuffer.append() 인라인 SQL + JdbcTemplate(IL0206APIDao 등에서 확인), FD0303APIDao.java 실재. 프로젝트 자체 메모리 .claude/_global-seed/memory/project_kiips_inline_sql_dao.md가 'KiiPS 백엔드는 MyBatis mapper XML을 쓰지 않는다'고 명시하고 kiips-db-inspector를 XML-매퍼 전제로 부분적합 스킬로 지목 → 핵심 주장 독립 확증. 스킬 전체 워크플로우(mapper/*.xml의 resultMap/sql/select 태그 grep)가 존재하지 않는 파일을 대상으로 해 비기능적. 따라서 실제 JdbcTemplate+StringBuffer 인라인 SQL 패턴으로의 전면 재작성(CONVERT)이 타당. 단, 다음 조건부 처리 필요: [A] 프레임matter 키 변경은 단순 normalization이 아니라 의미 역전 — 'user-invocable:false'는 제거/수정해야 하나 'disable-model-invocation:true'로 바꾸지 말 것(모델호출 비활성화는 의도 반대). registry가 이미 disableModelInvocation:false로 읽고 있어 현재 키는 사실상 무효 상태이므로, 의도(모델 내부/파이프라인용, 사용자 직접호출 비노출)를 보존하려면 게이팅 의미를 재확인 후 결정. [B] reference.md/registry description/SKILLS.md 동반 갱신 포함해야 CONVERT 완결. [C] 시퀀싱 의존성: P47의 Related가 가리키는 kiips-mybatis-guide 자체도 동일하게 MyBatis-stale(별도 finding) — P47만 변환하면 stale 가이드를 가리키는 dangling pointer가 남으므로 Related 항목은 단순 중복제거가 아니라 재검토 대상. kiips-mybatis-guide 본체는 본 verdict 범위 밖.

#### P51 · `.claude/skills/kiips-mybatis-guide/SKILL.md`

- **현재 목적**: MyBatis mapper XML 패턴, SqlSessionTemplate DAO, 동적 SQL, SQL Injection 방지 가이드(373L).
- **발견한 문제**: P47과 동일 근본 원인 — 프로젝트가 MyBatis mapper XML을 실제로 안 씀(DAO 내 StringBuffer 인라인 + JdbcTemplate/DBSelecter). 전제 파일구조(mapper/**/*.xml)·DAO 패턴(SqlSessionTemplate+NAMESPACE)·XML 표준 구조 전체가 부재 레거시 → 단순 SPLIT 아닌 현행 패턴으로 전면 재작성 우선. 부수: 트리거 'SQL'/'쿼리'가 거의 매 백엔드 세션 오발동, 373줄 초과.
- **근거**: project_kiips_inline_sql_dao.md: 'MyBatis XML 안 씀, StringBuffer 인라인+JdbcTemplate'. find mapper *_SQL.xml 0건. SqlSessionTemplate 비주석 0건(주석 2줄만). TB_LP1025M_DAO.java JdbcTemplate+StringBuffer. SKILL L3 'SQL, 쿼리', skill-rules.json L446 동일. wc -l 373.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: MyBatis XML 전제를 실제 JdbcTemplate 인라인 SQL 패턴으로 전면 재작성; 트리거 'SQL'/'쿼리' 축소(skill-rules.json 동기화). 재작성 후 길이 점검.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) · 사람승인필요
  - 반박근거: CONVERT is correct: the MyBatis-XML premise is empirically false and the skill must be rewritten to the project's real JdbcTemplate/DBSelecter + StringBuffer + `?` positional-param pattern, with bare "SQL"/"쿼리" triggers narrowed and skill-rules.json synchronized. Adversarial defenses do not hold (defense-in-depth layer is dead xml-only code; skill guards the wrong surface). MANDATORY guardrails attached to the rewrite, which is why this is uphold-with-conditions, not blind approval: (a) PRESERVE the content-agnostic blockRules in this skill-rules block — `ddl-destructive` (DROP/TRUNCATE) and `delete-without-where` — they fire regardless of MyBatis-vs-JdbcTemplate and are a genuine safety net that a naive rewrite could drop; (b) the rewritten guidance MUST cover the actual injection vector (Java string concatenation of user input into SQL, 1109 files) since the existing `.xml`-only hook cannot — either re-scope mybatisBindingGuard.js to `.java` or raise it as a linked sibling finding; (c) coordinate with sibling false-premise items kiips-db-inspector (P47, 18 mapper refs) and the dead hook so the harness stays internally consistent — do NOT convert this skill in isolation. harness_diet_auto=false is correct: this rewrite involves substantive technical authorship + trigger surgery + cross-file sync and must never be auto-run via /harness-diet.

---

## 7. 사람이 직접 승인해야 하는 위험한 변경

#### P1 · `.claude/rules/power-stack.md`

- **현재 목적**: 모든 작업에 4단계 프레임워크 파이프라인(Gstack→GSD→Superpowers TDD→Gemini QA)을 always-on으로 강제하는 전역 워크플로우 규칙. CLAUDE.md line 32에 always-on 링크.
- **발견한 문제**: 참조 인프라가 실재하지 않음(.gstack/personas, .gsd/states/current_state.md, .superpowers/specs 모두 부재). 단순 편집/조회까지 무거운 4-Phase를 전 작업에 강제해 비용 대비 가치 최악. 네이티브 plan mode + TodoWrite + superpowers 플러그인(brainstorming/TDD/verification)과 정면 중복. Phase 4는 sunset 예정 Gemini CLI 의존. *.test.ts 등 Java8/JSP 무관 예시 포함.
- **근거**: 21줄. line 5 '반드시 4단계 파이프라인 준수', line 8 .gstack/personas/(부재), line 13 .gsd/states/current_state.md(부재), line 17 .superpowers/specs(부재), line 21 Phase 4 Gemini CLI. CLAUDE.md line 32 always-on 링크. 네이티브 EnterPlanMode/ExitPlanMode+TodoWrite+superpowers:test-driven-development/verification-before-completion이 동일 보장 제공.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/kiips-power-stack(신규 on-demand Skill) 또는 기존 superpowers:* 스킬로 흡수. 부재 디렉토리 참조 전부 제거, '무거운 신규 기능 착수 시에만' 트리거. CLAUDE.md line 32 always-on 링크 삭제.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: always-on에서 빼서 on-demand 스킬화; 죽은 .gstack/.gsd/.superpowers 경로 제거 후 superpowers 플러그인으로 위임.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 핵심 결함은 always-on 비용이 아니라 (a) 죽은 참조 인프라(.gstack/personas, .gsd/states/current_state.md, .superpowers/specs 전부 부재), (b) 레포 무관 예시(*.test.ts → Java8/JSP 레포), (c) sunset 위험 Gemini CLI 의존(Phase4), (d) 실존하는 superpowers:test-driven-development / verification-before-completion / brainstorming 으로 이미 대체됨. 이 깨진/낡은 내용을 제자리에서 제거·갱신하는 것이 어느 verdict 에서도 수행되어야 할 비논란 코어 작업이다. 원래 MOVE 를 downgrade 하는 이유: 신규 kiips-power-stack 스킬을 만들면 superpowers 플러그인을 그대로 중복 재생산할 뿐이고, 확률적 on-demand 트리거라 정작 무거운 신규 기능 착수 순간 발동 실패 위험(규율 파이프라인 발견성을 도박에 거는 안전망 제거)이 있다. 또한 problem 의 '전 작업 always-on 강제 비용 최악' 프레이밍은 과장 — line 32 는 Rules 카탈로그 표의 한 행이며 Top-5 강제 규칙이 아니다(always-on 비용 약 1줄, 본문은 링크 추적 시에만 로드). 따라서 더 보수적이고 방어 가능한 조치는 SHRINK: power-stack.md 를 제자리에서 재작성해 부재 디렉토리 참조·Gemini 의존·잘못된 기술스택 예시를 모두 제거하고, 4개 Phase 를 실존 superpowers 스킬에 재지정하며, CLAUDE.md 카탈로그의 1줄 넛지는 발견성 유지를 위해 보존한다. 신규 스킬 신설은 하지 않는다(superpowers 중복 방지). 죽은 참조+잘못된 예시 제거는 양쪽 verdict 공통의 논란 없는 코어이고, 스킬 전환 대 제자리 재작성 여부가 사람의 판단이 필요한 부분이다.

#### P2 · `.claude/rules/ralph-loop-detection.md`

- **현재 목적**: Ralph Loop(반복편집/빌드실패/에러시그니처 변경) 임계값과 5단계 롤백 프로토콜을 산문으로 문서화.
- **발견한 문제**: 여기 적힌 로직은 전부 buildChecker.js/multiFileGate.js가 이미 기계적으로 강제 — 산문은 hook 동작의 중복 문서일 뿐 모델 행동을 바꾸지 않음. anti-rationalization.md line 49-52가 같은 3트리거를 또 요약해 3중 표현(hook 코드+이 파일+anti-rat 요약).
- **근거**: 57줄. line 9/14/21 임계값 3 = buildChecker.js(RALPH_LOOP_ATTEMPTS default 3, errorSignatureHistory)·multiFileGate.js(THRESHOLD=3). 트리거 매트릭스 line 33-39 = anti-rationalization.md line 49-52 중복. line 48-53는 hook 파일명 나열.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: hook 동작 중복 산문 제거, '자동 강제는 buildChecker.js 참조' 한 줄로 축약; 메커니즘 자체는 P3에서 KEEP.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Downgrade, not reject: trimming IS warranted, but NOT as the plan_note scopes it. A naive executor following "hook 동작 중복 산문 제거, buildChecker.js 참조 한 줄로 축약" would delete load-bearing content. Restrict the SHRINK to ONLY the genuinely duplicated trigger matrix (lines 33-39) and the redundant hook-filename inventory (lines 48-53). KEEP: trigger #1-3 descriptions (lines 6-21) — #1 has no hook backing at all; the 5-step rollback protocol (23-31) — exists nowhere else and is cited by buildChecker.js line 139 at runtime; the 절대 금지 recovery discipline (41-46) — behavioral, not hook-enforced. This preserves audit principle (1) block real recurring mistakes and (4) prefer SHRINK over DELETE when unsure, while preventing a circular dangling reference. Risk is medium, not the claimed low: the file is a hard runtime dependency of buildChecker.js (line 139), so a wrong edit breaks the model's cited recovery path during an active Ralph Loop — the worst possible moment.

#### P3 · `.claude/hooks/buildChecker.js`

- **현재 목적**: 동일 파일 3회 편집/연속 빌드 3회 실패/에러 시그니처 3회 변경(A→B→C) 감지 후 HALT+자동 롤백. errorSignatureHistory 카운터, computeErrorSignature.
- **발견한 문제**: 문제 아님 — 네이티브 대응 기능 없음. Claude Code는 반복편집/빌드실패 연쇄/에러시그니처 변동 감지+자동 롤백 메커니즘을 제공하지 않음. '반복되는 실제 실수'를 막는 정당한 안전망. 임계값은 env로 이미 튜닝 가능. (다만 현재 settings.json에 wire되지 않은 orphaned hook으로 보고됨 — 와이어링 확인 필요.)
- **근거**: buildChecker.js L40-41 RALPH_LOOP_ATTEMPTS/SHIFTS env 튜닝, L49 computeErrorSignature 고유 로직. 관측된 네이티브 기능 목록에 반복편집/롤백 감지 없음. 인벤토리: orphaned-hooks 목록에 buildChecker.js 포함(미와이어 의심).
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 안전망 메커니즘 유지; 단 orphaned 보고와 postToolOrchestrator 통합 주장이 충돌하니 실제 wire 경로만 사람이 확인.

#### P4 · `.claude/rules/verification.md`

- **현재 목적**: 증거 기반 완료(실행 증거 없이 완료 선언 금지) + IDENTIFY/RUN/READ/VERIFY/CLAIM 게이트 + KiiPS 검증 체크리스트 표. CLAUDE.md Key Rules #4(line 21) 라이브 링크.
- **발견한 문제**: 동일 검증 게이트를 4가지 포맷으로 반복(함수형 5단계+체크리스트표+금지표현표+적용시점) — 9개 rules 중 최장 82줄. 금지표현표는 anti-rationalization.md 합리화표 및 superpowers:verification-before-completion과 의미 중복. line 43 다크테마 항목은 dark-theme.md 중복. 단 KiiPS 특화 검증표(mvn package=BUILD SUCCESS, grep '${' *.xml, SCSS 컴파일, 포트 curl)는 플러그인에 없는 고유 도메인 지식이라 가산적 → KEEP. 별개 안전망 레이어라 verify command/agent와는 중복 아님.
- **근거**: 82줄. 검증 게이트 line 19-29/33-43/49-59/63-71 4중 반복. red-flag표(49-59) = anti-rationalization.md line 7-17. KiiPS 검증표 line 31-44는 프로젝트 고유. superpowers:verification-before-completion 존재.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 범용 서문/금지표현표는 superpowers:verification-before-completion 참조로 대체, 4중 반복을 1포맷으로, KiiPS 검증표만 유지. 안전망이라 자동처리 금지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 자체는 유지하되 범위를 좁힌다. 안전: 4중 반복 게이트 게이트(line 19-29/33-43/49-59/63-71)를 1포맷으로 축약, KiiPS 검증표(line 31-44, mvn=BUILD SUCCESS/grep '${'/SCSS/curl)는 KEEP — 이것은 superpowers에 없는 고유 도메인 지식이자 /check-rules·stopEvent 훅의 참조 대상이라 절대 제거 금지. 변경: 원안의 '범용 서문/금지표현표를 superpowers 참조로 대체'는 채택하지 말 것. 대신 compact한 self-contained 인라인 게이트(IDENTIFY/RUN/READ/VERIFY/CLAIM 5단계 핵심 + red-flag 최소 essence)를 파일 내에 유지하라. 이유: Stop 훅이 이 파일을 경로로 직접 가리키므로(구조 파싱이 아닌 path 참조라 파일 존재+실행 가능 게이트만 있으면 훅은 안 깨짐) 착지 지점은 즉시 실행 가능한 deterministic 내용이어야 한다. superpowers 참조는 '추가 심화 자료' 링크로만 부기. 결과: 82줄 → 약 35-45줄, 안전망(deterministic 인라인 게이트+KiiPS표) 보존, 진짜 중복(4중 포맷 반복)만 제거. 자동처리 절대 금지(harness_diet_auto는 false 유지가 필수).

#### P5 · `.claude/rules/anti-rationalization.md`

- **현재 목적**: 합리화 표현 차단 + 수술적 변경(요청 범위만 수정) 원칙. CLAUDE.md Key Rules #5(line 22) 링크.
- **발견한 문제**: 삼중 중복의 허브. (1) line 49-52 Ralph 요약 = ralph-loop-detection.md 재서술(line 4·52·56·57 cross-link 4회). (2) line 32-37 수술적 변경 = editing.md line 14-20 동일 지시. (3) line 7-17 합리화표 = verification.md red-flag표 중복. (4) line 19-30 HARD-GATE는 multiFileGate.js·permissionGate.js가 이미 강제하는 산문 재서술. KiiPS표 MyBatis ${} 항목은 mybatisBindingGuard.js가 이미 차단.
- **근거**: 60줄. line 49-52 Ralph 3트리거 = ralph-loop-detection.md line 33-39. line 32-37 = editing.md line 19. line 24 'multiFileGate.js 자동 강제' 명시. line 39-47 KiiPS표.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: Ralph 요약·HARD-GATE·MyBatis 항목(hook 중복) 제거, 수술적 변경은 editing.md로 단일화, 합리화표는 verification.md와 1곳만 유지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Keep SHRINK but narrow it to only the empirically hook-redundant parts. Safe to remove: the pom.xml and app-properties rows of the high-risk gate, since permissionGate.js confirms a hard block, and the surgical-change principles at lines 32 to 37 which duplicate editing.md and can be reduced to a pointer. Must preserve: the multi-file change gate prose because multiFileGate.js is WARN only and fail-open so the prose is the only real enforcement layer; the KiiPS-COMMON and UTILS and MyBatis mapper SQL rows because impactAnalyzer and the binding guard are WARN only or fail-open so the hooks give no equivalent guarantee; the binding table row kept as a one-line pointer because the guard is fail-open plus whitelisted and the prose carries follow-up guidance. The rationalization table may be deduped to one location with verification.md, but since this file is the canonical Key Rule five link target, moving the table requires repointing the CLAUDE.md link or the entry point breaks. The triple-duplication-hub diagnosis is overstated; much of the apparent overlap is defense in depth over fail-open or warn-only hooks. harness_diet_auto false is correct and an uncritical harness-diet pass would strip live safety nets.

#### P6 · `.claude/rules/editing.md`

- **현재 목적**: 편집 범위 제한 + Revert/변경관리 + Golden Principles(불변성, 비밀값 환경변수) + 파일유형별 주의표.
- **발견한 문제**: anti-rationalization.md 수술적 변경 원칙과 같은 지시를 다른 말로 반복(line 7-12, 14-20). 파일유형표(line 36-42 JSP/SCSS/MyBatis #{} vs ${})는 anti-rationalization.md line 41-47 및 verification.md 체크리스트와 겹침. 자체 내부도 '관심사 분리'·'최소 편집'을 line 1-12와 14-20에서 두 번 말함.
- **근거**: 42줄. line 19 '버그+리팩토링 혼합 금지' = anti-rationalization.md line 37. line 9 '벌크 편집(10+)' = anti-rat HARD-GATE(3+)와 임계값만 다른 같은 취지. line 36-42 = anti-rat line 41-47.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 수술적 변경 원칙을 이 파일을 단일 정본으로 통합(anti-rat에서 제거), 내부 중복 2섹션→1, 파일유형표는 verification 검증표와 1곳만.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 방향 자체는 유지하되 범위를 대폭 축소한다. 안전한 SHRINK는 editing.md '내부' 중복만이다: line 7-12(Editing Rules)와 line 14-20(Revert & Change Management)에 두 번 나오는 '범위 제한/최소 편집/관심사 분리'를 1개 섹션으로 통합. 단, 다음은 절대 금지: (a) anti-rationalization.md에서 수술적 변경 원칙 제거 — 참조 토폴로지가 anti-rat를 정본으로 고정하고 있어 제거하면 CLAUDE.md/훅/4개 규칙파일 참조가 깨진다. (b) '벌크 편집(10+)'과 'HARD-GATE(3+)' 통합 — 점진적 롤아웃과 기계강제 승인게이트는 별개 동작이라 병합 시 안전망 손실. (c) 파일유형표 1곳 통합 — 편집전/주장전/발견시 3개 결정 시점에 대한 의도된 다층 방어라 제거하면 그 시점의 가드가 사라진다. 즉 cross-file 병합(원안)→내부 중복만 정리(보수안)로 다운그레이드. harness_diet_auto=false라 무비판적 자동처리 위험은 낮지만, 원안 plan_note의 임계값 동일성 주장이 사실오류이므로 자동 실행 금지가 마땅하다.

#### P7 · `.claude/rules/dark-theme.md`

- **현재 목적**: 다크테마 SCSS 작업 규칙([data-theme=dark] 셀렉터, 색상 속성만 변경, 레이아웃 변경 금지). CLAUDE.md 카탈로그(line 28) always-on 링크.
- **발견한 문제**: 특정 작업(다크테마 SCSS 편집)에서만 관련된 규칙인데 매 세션 전역 카탈로그에 노출. 빌드·Java·MyBatis·결재 등 대다수 작업과 무관. themeCssVerGuard.sh 훅도 별도 존재. 내용 자체는 유효한 안전망이라 DELETE 아님.
- **근거**: 37줄. CLAUDE.md line 28 always-on 링크. line 14 참조 themes/default/_dark.scss·layouts/_dark.scss는 SCSS 전용. verification.md line 43에서도 중복 언급.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/kiips-scss(기존 SCSS 스킬)에 흡수 또는 on-demand Skill. description 트리거 '다크테마, data-theme, _dark.scss, SCSS 색상'. CLAUDE.md line 28 always-on 링크 제거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: kiips-scss 스킬로 흡수하고 always-on 카탈로그에서 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: MOVE 는 (a) 메커니즘이 작동 불가(kiips-scss 는 disable-model-invocation:true 라 키워드 자동 트리거 안 됨)이고, (b) live 경로를 끊는다 — scssValidator.sh(settings.json 에 등록된 PostToolUse, 모든 .scss 편집마다 실행)의 위반 안내가 line 90 에서 'CLAUDE.md > Dark Theme Rules' 를 가리키므로 always-on 링크를 지우면 적발 순간 사용자가 dangling pointer 로 간다. 규칙 본문은 이미 kiips-scss SKILL.md line 167-189 에 사본이 있어 '흡수'는 이미 완료 상태이고, dormant 사본(스킬)을 승격하려 live 사본(rules+훅 안내 타깃)을 제거하는 역전이다. check-rules.md/architecture.html/workflow.html/instinct 4곳이 dark-theme.md 를 이름으로 참조해 추가 dangling 도 발생. 상시 비용은 표 1행(~15단어)에 불과해 제거 편익이 거의 없다. 진짜 중복은 비활성 스킬 섹션(line 167-189)이며 이는 다른 경로로 P7 범위 밖이라 dark-theme.md 자체는 SHRINK 도 부적절(이쪽이 live 사본). 결론: always-on 링크 유지(KEEP).

#### P8 · `.claude/rules/validation.md`

- **현재 목적**: Controller 계층 입력 검증(Boundary Validation) 원칙 + KiiPS Java 패턴 예시. CLAUDE.md 카탈로그(line 31) always-on 링크.
- **발견한 문제**: Java/Spring Controller 작성·수정 작업에서만 관련된 도메인 한정 규칙인데 always-on. JSP/SCSS/MyBatis-only/문서 작업과 무관. line 22-40의 19줄 Java 코드 예시는 컨텍스트 비용이 큰데 검증 로직 작성 시에만 필요. ecc:java-coding-standards/springboot-patterns와 주제 중복 가능.
- **근거**: 47줄. CLAUDE.md line 31 always-on. line 22-40 @PostMapping save() 19줄. line 17-18 XSS/SQL Injection은 jspXssGuard.js·mybatisBindingGuard.js와 주제 겹침.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/skills/legacy-compliance-checker 또는 신규 kiips-controller-validation on-demand Skill에 흡수. CLAUDE.md line 31 always-on 링크 제거, Controller 작업 시 트리거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: on-demand 스킬화, always-on 제거; 코드 예시는 reference로.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: MOVE는 거부(over-reach)하되 제안이 짚은 단 하나의 실질 비용은 인정해 SHRINK로 강등한다. MOVE가 위험한 이유: 파일을 현 경로에서 이동/흡수하고 always-on 링크를 제거하면 jspXssGuard.js:113과 check-rules.md의 reference가 dangling 되고, 결정론적 차단 훅이 발동하는 바로 그 순간(JSP 편집)에 설명 규칙은 확률적 스킬 트리거(Controller 작업) 뒤에 있어 로드 안 될 위험이 있다 — 노이즈 감소가 아니라 방어 layer 약화. 동시에 제안의 유일한 정당한 지적은 line 22-40의 19줄 @PostMapping save() Java 예시가 always-on 규칙치고 컨텍스트 비용이 크다는 점이다. SHRINK 범위는 그 코드 예시(line 22-40)만 몇 줄 또는 reference 포인터로 압축하는 것으로 한정한다. 반드시 보존: (a) 파일 현 경로 .claude/rules/validation.md(훅+커맨드 reference 유지), (b) always-on / CLAUDE.md line 31(JSP 편집 시 동시 로딩 유지), (c) line 17-18 XSS/SQLi 체크리스트 행(가드 앵커 텍스트). 이렇게 하면 컨텍스트 절감이라는 실익은 챙기되 load-bearing 부분은 손대지 않는다.

#### P9 · `.claude/rules/error-handling.md`

- **현재 목적**: 디버깅 프로토콜(근본 원인 우선, 한 번에 하나, 악화 시 중단, 캐시 임의 삭제 금지). CLAUDE.md 카탈로그(line 30) always-on.
- **발견한 문제**: 디버깅/에러 대응 작업에서만 관련된 규칙인데 always-on. /diagnose 커맨드 + superpowers:systematic-debugging가 같은 영역을 더 풍부하게 다뤄 중복. line 13-22 디버깅 프로토콜은 ralph-loop-detection.md 롤백 프로토콜과 '악화 시 되돌리기' 중복. line 7 캐시 삭제 금지(.m2/node_modules)만 KiiPS 특화 고가치.
- **근거**: 29줄. line 13-22 6단계 = /diagnose·superpowers:systematic-debugging 중복. line 9 = ralph-loop 롤백. line 7만 KiiPS 특화.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: /diagnose 스킬 또는 superpowers:systematic-debugging으로 흡수하고 KiiPS 특화(line 7 캐시 삭제 금지)만 해당 스킬에 통합. CLAUDE.md line 30 always-on 링크 제거.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: diagnose 스킬로 흡수, 캐시 삭제 금지 한 줄만 보존, always-on 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 중복(debugging protocol line 13-22 6단계 = /diagnose 4-phase + error-diagnose-first instinct, conf 0.85/45obs)은 실재하므로 줄일 여지는 맞다. 그러나 MOVE 대신 SHRINK가 안전하다: line 13-22 6단계 프로토콜과 중복 롤백 문구만 제거하고, 파일은 always-on 유지하되 KiiPS 특화 캐시 삭제 금지(line 8)+다른 곳에 없는 1-2줄만 남긴다. 핵심 tie-breaker: 캐시 삭제는 이미 settings.json deny 'rm:*' / 'rm -rf:*'(line 170/176)로 퍼미션 레이어에서 하드 차단되므로 마크다운 rule은 enforcement가 아닌 설명이다 — 따라서 always-on에 남겨도 토큰 비용은 1-2줄로 최소화되고, on-demand 미로딩 리스크를 피한다. MOVE의 진짜 이득(중복 제거)은 SHRINK로 동일하게 달성되며, 고가치 라인을 편집 불가한 플러그인 캐시로 잃거나 확률적 로딩에 맡기는 리스크는 제거된다.

#### P10 · `.claude/rules/svn-workflow.md`

- **현재 목적**: KiiPS는 Git 아닌 SVN — 명령어 매핑과 커밋 메시지 규칙. CLAUDE.md Key Rules #3(line 20) 링크.
- **발견한 문제**: 'SVN 사용' 한 줄 사실은 Claude의 반복되는 git 명령 실수를 막는 고가치 KEEP. 다만 line 13-21 SVN 명령어 표(up/status/diff/commit/revert/add/log)는 표준 SVN 일반지식이라 장황 — 매 세션 전역 보유 불필요. 핵심 한 줄(Git 아닌 SVN, app-local.properties 커밋 금지)만 유지하면 됨.
- **근거**: 38줄. line 13-21 명령어표 7줄은 저비용 일반지식. 핵심은 line 1 'Git 아닌 SVN' + line 37 'app-local.properties 커밋 금지'. CLAUDE.md line 20이 이미 한 줄 요약 보유.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 명령어 표 제거, 'Git 아닌 SVN + app-local.properties 커밋 금지' 핵심만 유지.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the conservative action. KEEP line 3 (Git not SVN), line 37 (app-local ban - sole enforcement, permissionGate.js does not cover app-local), line 38 (production confirm). REMOVE lines 11-21 table and lines 23-32 commit-message rules.

#### P11 · `CLAUDE.md`

- **현재 목적**: 항상 로드되는 프로젝트 루트 가이드 — Quick Reference, Key Rules Top5, Rules 카탈로그(always-on 링크 5개), Tech Stack.
- **발견한 문제**: Rules 카탈로그(line 24-32)가 작업 한정 규칙(Dark Theme line 28/Validation line 31/Power Stack line 32)까지 always-on 노출 — 이들은 on-demand Skill로 가야 함(P1/P7/P8). 본문 자체는 이미 경량(48줄)이라 KEEP 가치 높음. 추가로 line 9에 ':KiiPS-SERVICE' placeholder 모듈명이 남아 있어 실재 모듈(KiiPS-FD/IL 등)과 불일치.
- **근거**: 48줄. line 24-32 카탈로그 5행 중 Dark Theme/Validation/Power Stack 작업 한정. line 16-22 Key Rules Top5는 고가치 유지. git 85eac0c: 231→91줄 경량화 이력. line 9 ':KiiPS-SERVICE' placeholder.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 카탈로그에서 Dark Theme/Validation/Power Stack 행 제거, line 9 ':KiiPS-SERVICE' placeholder를 실제 모듈명으로 교정.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SPLIT` · 사람승인필요
  - 반박근거: Not uphold: the prescription orphans Power Stack (no skill, no scan coverage, sole discovery surface = CLAUDE.md line 32) and mis-fixes the build line (no single correct module; line 9 was an intentional per-developer template, marked [빌드담당자] and commented, that b4e354e wrongly uncommented). Not reject: the Dark Theme row trim is genuinely safe (kiips-scss skill covers discovery; /check-rules reads dark-theme.md directly so the scan and the scss-dark-theme-selector instinct survive the catalog-link removal), and the placeholder IS a real defect. Therefore SPLIT into independent dispositions: (a) Dark Theme row removal = safe to apply; (b) Validation row removal = borderline, /check-rules still fires on validation.md but skill overlap (legacy-compliance-checker) is weak on Boundary validation, so keep unless P7 skill confirmed; (c) Power Stack row = KEEP until P8 actually ships a triggering skill, since it is the only always-on pointer to power-stack.md; (d) placeholder = fix as a TEMPLATE (restore ':<your-module>' or the [빌드담당자] marker), NOT a hardcoded module name. Note: the audit's stated risk 'scan breaks' would be a factual error — the scan does not break; the real risk is silent loss of Power Stack discoverability.

#### P12 · `.claude/output-styles/efficient.md`

- **현재 목적**: 간결 출력 스타일(★ Insight 포맷). 커스텀 output-style 후보.
- **발견한 문제**: 고아(orphan) 파일 — 활성 output-style은 settings.local.json line 54의 'Explanatory'이고 'efficient'는 어디서도 선택되지 않음. grep 0건. 'efficient'(간결)와 'Explanatory'(설명적)는 정반대 지향이라 의도 불명확.
- **근거**: 19줄. settings.local.json line 54: outputStyle='Explanatory'. settings.json/local 어디에도 'efficient' 참조 없음. git 12월 26일 이후 미수정.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 미사용 output-style — 'efficient'를 실제 채택할지 결정 후 settings에 명시 적용하거나 파일 제거. 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 고아 전제가 거짓으로 입증됨. 전역 ~/.claude/settings.local.json line 3 outputStyle=efficient 가 이 파일과 동일한(byte-identical) 스타일을 활성으로 선택 중이며, 프로젝트 파일은 그 verbatim 사본이다. 프로젝트의 Explanatory override 는 의도적 per-project 선택이다. output-style 은 선택 시에만 on-demand 로딩되는 inert 파일이라 제거해도 context tax 절감 이득이 없어 harness-diet 명분이 부적용된다. KEEP. 전역과의 동일 사본 중복은 별도 finding 으로만 기록하되, 의도된 fallback 일 수 있으므로 보수적으로 유지.

#### P13 · `.claude/commands/simplify-code.md + .claude/skills/code-simplifier/SKILL.md + .claude/agents/code-simplifier.md`

- **현재 목적**: Java 코드 복잡도 분석/단순화. 커맨드(231L, Boris Cherny 스타일) + 스킬(52L) + 에이전트(555L, tools+model) 3중 구조.
- **발견한 문제**: 동일 기능이 커맨드+스킬+에이전트 3중 존재하며 복잡도 임계값(Cyclomatic>10, Nesting>3, Method>50)·리팩토링 전략(Extract Method/Guard Clauses/DRY)·안전보장을 각자 재정의. 에이전트(555L, 실행 정본)가 정본이어야 하고 스킬은 트리거+포인터, 커맨드는 thin wrapper면 충분. 추가로 스킬 description 트리거 '개선'/'improve'가 과도하게 포괄적이라 코드 단순화와 무관한 개선 요청에도 오발동.
- **근거**: 커맨드 헤더가 '서브에이전트와 동일 기능' 자인. 임계값 표가 skill·agent·command 3번 반복. SKILL.md line 3 'Use when: ...개선, improve'. kiips-button-guide·kiips-page-harness도 '개선' 키워드 보유 → 동시 트리거 충돌.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 에이전트를 단일 정본으로 두고 스킬/커맨드는 임계값·전략 본문 제거 후 포인터화; 스킬 트리거에서 '개선'/'improve' 제거.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 핵심 관찰(임계값표 Cyclomatic>10/Nesting>3/Method>50 + Extract Method/Guard Clauses/DRY 전략 본문 3파일 실제 중복; 커맨드 line9 '서브에이전트와 동일 기능' 자인)은 사실이라 통합 자체는 타당. 다만 원본 action 그대로는 위험 → 범위 축소+사람 게이트: (A) 에이전트를 단일 정본 유지. (B) 커맨드/스킬에서 임계값표·전략 예시 코드 중복 본문만 제거하고 에이전트로 포인터화, 커맨드 인자 UX(파일/디렉토리/--recent/--apply) 보존. (C) Safety Guarantees(동작 보존·적용 전 승인·테스트 통과·SVN 롤백)는 실제 Write/Edit 수행 autonomous haiku 에이전트 표면에 유지(반복 실수 방지 가드, 안전망 보수적). (D) '개선/improve 트리거 제거' 하위 액션 폐기: 근거 반증됐고 disable-model-invocation:true 라 실효 0, 명시 호출 해소만 깨뜨림. (E) harness_diet_auto=false 로 자동 다이어트 제외. 확신 부분적이라 DELETE 아닌 SHRINK 선호.

#### P14 · `.claude/skills/checklist-generator/SKILL.md + .claude/agents/checklist-generator.md`

- **현재 목적**: 코드리뷰/배포/테스트 체크리스트 동적 생성. 스킬(49L, disable-model-invocation) + 에이전트(113L, tools: Read/Write/TodoWrite, haiku).
- **발견한 문제**: 스킬과 에이전트가 같은 Code Review/Deployment/Testing 항목(KiiPS 컨벤션 Controller/Service/DAO, SQLi/XSS, #{} 사용, GlobalExceptionHandler, 5-15개 규칙)을 각자 보유. 체크리스트 '생성' 행위는 네이티브 TodoWrite로 직접 대체 가능 — 별도 haiku 서브에이전트 분리 가치 낮음. 단 정적 도메인 항목 내용은 보존 가치. (스킬의 disable-model-invocation 설정과 49줄 길이 자체는 적절 = 그 facet은 KEEP였으나, 에이전트 중복이라는 실질 결함이 우선.)
- **근거**: 두 파일 동일 항목 나열. 에이전트 L4 tools가 TodoWrite 포함(네이티브 래핑). L74-78 'Interactive(TodoWrite)' = 네이티브와 동일. 정적 항목은 checklists/*.md와 중복.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 체크리스트 생성은 네이티브 TodoWrite로 대체, 정적 KiiPS 항목은 checklists/*.md(또는 메모리)로 단일화; 스킬은 정본 포인터만.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Reject/KEEP would be wrong — there IS real removable waste: the KiiPS domain checklist content is TRIPLICATED. The same items live inline in SKILL.md, inline in the agent .md, AND in .claude/checklists/*.md (verified: code-review.md L31-34 holds MyBatis #{}, Lucy XSS, GlobalExceptionHandler, JWT — identical to the two inline copies). But CONVERT is too aggressive: it severs a runtime hook route + two registry entries + four managers' delegation target, and TodoWrite does not give the same domain-check guarantee. Correct action is SHRINK: make .claude/checklists/*.md the single canonical source, trim the duplicated inline item lists out of SKILL.md and the agent .md (replacing with a pointer to checklists/, which the agent .md L94-103 already does), and KEEP the agent node plus every piece of its orchestration wiring untouched. This removes the duplication the audit correctly smelled without breaking the delegation graph. The skill's disable-model-invocation:true and 49-line length stay as-is (audit already conceded those facets were KEEP).

#### P15 · `.claude/commands/diagnose.md`

- **현재 목적**: 진단 우선 디버깅 커맨드 - 코드 변경 전 근본 원인 파악(Phase1 READ ONLY).
- **발견한 문제**: error-handling.md(P9) 디버깅 프로토콜과 동일 원칙(근본원인 우선, 한 번에 하나, 악화 시 되돌리기)을 재진술. rule↔command 경계 중복. (P9에서 error-handling을 diagnose로 흡수하기로 했으므로 여기는 정본 수용처가 됨.)
- **근거**: diagnose: '코드 변경 전 진단 보고서 먼저', 'Phase 1 READ ONLY'. error-handling.md: 근본원인 우선/한 번에 하나/악화 시 중단 6단계.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: error-handling.md 흡수 후 단일 정본화; 중복 절차 문구 정리하고 KiiPS 캐시 삭제 금지 항목만 추가.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) · 사람승인필요
  - 반박근거: 절차 문구(근본원인 우선/한 번에 하나/악화 시 되돌리기)의 텍스트 중복은 실재하지만, 그것이 자동 SHRINK-흡수를 정당화하지 못한다. error-handling.md는 사용자 개입 없이 어느 세션에서나 발동하는 상시 rule 가드레일이고 /diagnose는 명시 호출형 커맨드다 — 계층이 다르다. 흡수하면 '/diagnose 미호출 세션'에서 근본원인-우선 가드레일과 특히 '캐시 삭제 금지'라는 파괴적-행동 안전망이 사라진다. 따라서 두 파일을 모두 KEEP(none)하고 자동 흡수를 막는다. 정 통합한다면 값싼 rule을 정본으로 두고 diagnose가 참조하는 방향으로, 사람 감독하에만 진행해야 한다. harness_diet_auto=true 는 즉시 false 로 내려야 할 위험 신호다(파괴적-행동 안전망 건드림). uphold는 불가, reject도 방어 가능하나 '절차 중복은 실재'한다는 관찰은 유지되므로 downgrade가 더 정확하다.

#### P16 · `.claude/commands/verify.md + .claude/agents/verify-agent.md`

- **현재 목적**: Fresh-Context 검증 커맨드(60L) - verify-agent(187L)를 별도 컨텍스트로 소환하는 진입점.
- **발견한 문제**: 진입점/실행자의 의도된 계층 분리이나, 검증 파이프라인 순서(Compile→Build→Test→Security)·Read-Only·증거 필수·mvn compile -pl 명령이 커맨드와 에이전트 양쪽에 정의되어 일부 중복. verification.md(P4)는 별개 안전망이라 역할 구분됨(중복 아님).
- **근거**: command와 verify-agent 모두 'Compile→Build→Test→Security 고정', Read-Only, 증거 필수, mvn compile -pl 각자 기술.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 파이프라인 순서 정의를 verify-agent에 단일화, 커맨드는 thin wrapper(에이전트 소환만)로 축소.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 중복 전제는 유효하므로 reject는 아니지만, 명세된 SHRINK('에이전트 소환만')는 dedup이 아니라 회귀다. command의 $ARGUMENTS 파싱과 파라미터화된 에이전트 프롬프트(라인 18-22, 30-53)는 수동 /verify 경로의 load-bearing 글루이며 agent는 module/effort/steps를 바로 이 프롬프트에서 공급받는다 — 자동 축소 시 인자 전달이 끊겨 /verify가 깨진다. 라인 55-60의 Read-Only/증거 필수/순서 고정은 이 시스템이 막으려는 반복 실수를 사용자 진입점에서 재강화하는 defense-in-depth라 보존해야 한다. 진짜 결함은 중복이 아니라 단계 수 drift(command 5단계 vs agent 6단계 DISCOVER)이며, 자동 도구가 한쪽을 임의 폐기할 게 아니라 사람이 단일 source of truth를 선택해 해결할 사안이다. 또한 _global-seed/global/commands/verify.md에 동일 텍스트가 있어 프로젝트 사본만 자동 편집하면 canonical seed와 desync된다. enum에 '프롬프트 내 단순화된 mvn compile(라인 51-53)만 정리' 같은 정밀 옵션이 없고 그 유일한 진짜-dead 중복은 가치 대비 자동 위험이 커, 보수적 착지는 KEEP + drift는 사람 조정으로 플래그한다. harness_diet_auto=true이므로 human approval 없이는 /harness-diet에 휩쓸려 회귀가 자동 적용될 수 있다.

#### P21 · `.claude/agents/kiips-realgrid-generator.md`

- **현재 목적**: RealGrid 2.6.3 테이블 코드 자동 생성 전문 에이전트(615L, Write/Edit 보유).
- **발견한 문제**: RealGrid 생성 커버리지가 realgrid-guide(skill,467L)/realgrid-generator(agent,615L)/ui-designer(agent,1540L) 3중 보유. generator(생성 전담)와 guide(참조)는 역할 구분되나 ui-designer가 RealGrid 생성까지 포괄해 generator와 겹침.
- **근거**: realgrid-guide 'createMainGrid', generator '그리드 생성/컬럼정의/멀티레벨헤더/엑셀', ui-designer 'RealGrid 2.6.3'. ui-component-builder도 단건추가 보유(guide 참조).
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 생성 정본을 realgrid-generator로 고정하고 ui-designer의 RealGrid 생성 부분은 generator 위임으로 축소.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 방향(generator를 생성 정본으로 고정, ui-designer의 RealGrid 생성부 축소)은 코드베이스 검증으로 타당함이 확인됨: 정본은 common_grid.js의 createMainGrid(1626행)+RealGrid. 네임스페이스이며 generator·guide skill이 이에 일치, ui-designer만 RealGridJS 네임스페이스로 off-standard. 그러나 harness_diet_auto는 반드시 false로 강등해야 한다 — (1) 1540L 다중도메인 에이전트에서 RealGrid 부분만 분리하는 것은 단순 토큰 다이어트가 아닌 correctness 정합성 편집이고, (2) ui-designer 내부에 generator 위임 포인터가 전혀 없어 자동 축소 시 위임처 없는 capability gap이 발생하기 때문. 안전한 실행: SHRINK를 유지하되 사람 승인 하에, ui-designer의 RealGrid 생성 예제(RealGridJS 코드)를 제거/축소하면서 동시에 '생성은 kiips-realgrid-generator에 위임, RealGrid 참조는 kiips-realgrid-guide' 라는 명시 포인터를 ui-designer에 추가하라. 단, ui-designer의 RealGrid CSS 변수/SCSS 토큰/접근성(role/aria) 부분은 ui-designer 고유 역량이므로 보존(이 부분까지 삭제 금지). 확신 낮을 땐 DELETE보다 SHRINK 선호 원칙에 부합. 추가 권고: ui-designer의 잘못된 RealGridJS 예제는 별도 finding으로 'API 네임스페이스 수정 후보'로도 분류 가능(본 감사 범위 외, 읽기전용이므로 미수정).

#### P22 · `.claude/commands/deploy-with-tests.md`

- **현재 목적**: 안전 배포 파이프라인 커맨드(Test→Build→Deploy→Health Check, 547L).
- **발견한 문제**: kiips-build 스킬(108L, 빌드/배포/기동 통합, maven-builder+service-deployer+build-deploy+startup 4종 병합본)과 배포 파이프라인 커버리지 중복. 두 곳 모두 Maven 빌드→테스트→배포→헬스체크 흐름·명령(curl actuator/health) 정의.
- **근거**: deploy-with-tests '[1/7]Run Tests [2/7]Build [4/7]Deploy [6/7]Health Check'. kiips-build 'Pre-flight→빌드→테스트→배포→헬스체크'.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 정본을 kiips-build 스킬로 두고 커맨드는 thin entry(스킬 호출)로 축소.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 제안 조치(스킬을 정본으로, 커맨드를 thin entry로 축소)는 세 가지 독립 근거 각각으로 무효다. 결정적 근거: kiips-build 스킬에는 rollback/backup/abort-on-test-failure/health-check-failure recovery/graceful-shutdown-force-kill 폴백이 전혀 없다(grep 0건). 커맨드를 스킬 호출 shim으로 축소하면 실행 가능한 안전 배포 파이프라인이 그 안전 단계를 수행할 수 없는 치트시트를 가리키는 껍데기로 퇴화한다 — 교과서적 safety-net 제거다. '중복'은 라벨(build/test/deploy/healthcheck) 수준일 뿐 동작 수준이 아니다. 보강 근거: (a) disable-model-invocation:true는 스킬이 수동 참조용으로 작성됐음을 보여줘 '스킬=배포 엔진' 전제를 약화시킨다. (b) 포트 데이터 충돌(PG 8201 vs 8301, Gateway 8000 vs 8088)로 클린 머지가 불가하며 사람의 재조정이 필요하다. 공정성을 위해 별도 사실 하나를 명시한다: 커맨드 내 ~150L는 비실행 산문(Boris Cherny 인용 섹션, Before/After 비교, Example 블록)이라 독립적으로 다듬을 여지는 있다 — 그러나 이는 별개 finding이며 '스킬로 병합' 조치를 정당화하지 못한다. SHRINK가 필요하다면 그것은 동작 로직 보존 전제 하의 prose 다이어트지, canonical 이전이 아니다. 따라서 KEEP 유지. 안전망 제거는 보수적으로.

#### P23 · `.claude/skills/kiips-test-runner/SKILL.md`

- **현재 목적**: KiiPS JUnit 테스트 자동 실행+결과 분석(disable-model-invocation).
- **발견한 문제**: test-coverage 커맨드(JUnit+JaCoCo)와 'mvn test' 실행 커버리지 중복. 더 심각하게, SKILL.md 핵심 기능(stopEvent Hook 자동 테스트 실행)이 stopEvent.js v4.0에서 명시 제거됨 — 약 60줄이 더 이상 존재하지 않는 동작을 묘사하는 dead content('자동 테스트 실행율 100%'는 실제 0%).
- **근거**: stopEvent.js L9 '- runAutoTests (Stop 이벤트 Maven 자동 실행은 과도)' 제거. SKILL.md L39-53/102-139/158-163/179-203 dead 자동실행 코드. test-coverage 커맨드 JaCoCo 리포트와 mvn test 중복.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: dead stopEvent 자동실행 섹션 60줄 삭제, 실행 정본=test-runner/커버리지 리포트=test-coverage로 mvn test 중복 정리.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 조치 자체 타당(확인된 dead content, low risk, 손실 안전망 없음, DELETE 아닌 SHRINK 로 수동실행 역할 보존). 단 harness_diet_auto:true 거부. (a) 동일 죽은 Hook 계약이 SKILL.md 외 skills-registry.json L1001-1007 trigger 블록과 kiips-orchestration L50 체인에도 존재 - SKILL.md 60줄만 자동삭제하면 레지스트리/오케스트레이션이 존재하지 않는 critical hook 검증을 계속 광고하는 불일치 발생. (b) 스킬 정본역할 재정의(실행 vs 커버리지 경계)는 사람 판단 필요. action 은 SHRINK 유지하되 범위를 3파일 동기화(SKILL.md dead 자동실행 60줄 정리 + registry trigger 의 hook/stopEvent 메타 갱신 + orchestration 체인 참조 점검)로 확장, 무비판적 /harness-diet 자동실행 금지.

#### P24 · `.claude/agents/security-reviewer.md`

- **현재 목적**: KiiPS 보안 전문 리뷰어 에이전트(SQL Injection/XSS/인증인가/민감정보).
- **발견한 문제**: security 커버리지가 security-reviewer(agent)/kiips-security-guide(skill,280L)/gemini-scan(command)/review(command) 4곳 분산. 동일 취약점 항목(SQLi/XSS/CSRF/하드코딩 시크릿/@PreAuthorize)을 각자 점검. 가이드=참조 정본, 리뷰어=실행으로 역할은 다르나 점검 항목 정의가 4중 반복. 보안 항목이라 보수적 처리.
- **근거**: security-reviewer 'SQLi 검증'. gemini-scan 'SQLi/XSS/CSRF/Auth bypass/Hardcoded secrets'. review Security 섹션 'Injection/Auth/Secrets/XSS(Lucy)'. security-guide 동일 영역.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 높음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 점검 항목 정의를 kiips-security-guide reference로 단일화하고 reviewer/review는 참조; 보안이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `MOVE` · 사람승인필요
  - 반박근거: Downgrade from SHRINK to a narrower MOVE: keep all executable detection logic and category definitions IN the agent (the auto-triggered, fresh-context execution layer must stay self-contained because dispatched sub-agents do not reliably load Skills on-demand, and the guide's triggers don't even match the agent's). Only MOVE/consolidate the verbose REMEDIATION prose/code samples to kiips-security-guide as the single 정본, and add a one-line 'remediation depth: see kiips-security-guide' pointer from the agent and the review command. Do NOT thin the agent's scan-item definitions or grep patterns, and do NOT make the agent depend on the guide for its core checklist. This preserves the security net and the live invocation path (userPromptSubmit.js:225, verify-agent.md:90) while still removing genuine prose duplication. The diagnosis that the guide is the reference 정본 is correct; only the direction of the cut must be inverted toward conservatism.

#### P26 · `.claude/hooks/gemini-bridge.js + geminiAutoTrigger.js + geminiReviewGate.js + .claude/commands/gemini-scan.md + .claude/gemini-bridge/ + settings.json gemini allow 패턴`

- **현재 목적**: 외부 Gemini CLI 교차검증 스택 전체: UDS 소켓 lazy daemon 자동 리뷰 큐(geminiAutoTrigger 547L), 3모드 CLI(gemini-bridge 781L), Critical 리뷰 미해결 파일 Edit/Write 차단 게이트(geminiReviewGate, 24h TTL fail-open), /gemini-scan 보안 스캔 커맨드.
- **발견한 문제**: 전체 스택이 2026-06-18 sunset 대상(오늘 기준 10일). 외부 폐쇄소스 CLI(Antigravity)+'Continue with Google' 인증 의존. callCount 8/900으로 사실상 미사용. fail-open이라 sunset 후 무의미. 네이티브 Subagent/Task + /code-review + /security-review(또는 ecc:code-review)가 동일 교차검증 보장 제공 → 외부 의존 정당성 소멸. 1300+줄 + settings.json allow 패턴 3개 + 디렉토리 운영 부담. (gemini-scan 단독 KEEP 의견은 sunset을 미반영 — 스택으로 통합 처리.)
- **근거**: antigravity-cli-migration-plan.md: Sunset 2026-06-18, callCount 8/900. gemini-bridge.js 781L, geminiAutoTrigger.js 547L. settings.json L433-448 gemini allow 패턴 3개. geminiReviewGate.js L1-9 fail-open, L186 exit(2). 네이티브 /code-review·/security-review 존재.
- **추천 조치**: `DELETE`
- **옮긴다면 추천 위치**: 교차검증은 네이티브 Task 서브에이전트 + /code-review·/security-review(또는 ecc:code-review)로 대체. settings.json의 gemini allow 패턴 3개도 함께 제거. sunset(2026-06-18) 이후 일괄 제거.
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: sunset 후 스택 전체 제거; 그 전까지는 네이티브 리뷰로 전환 운영. hook/permission 변경이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Do NOT delete now. Replace immediate DELETE with a time-gated, verification-conditioned disposition. Until 2026-06-18: KEEP the stack as-is (it currently works on the local Antigravity binary; the independent-vendor PreToolUse critical-block gate is genuine defense-in-depth that native same-model review does NOT replicate). The only safe pre-sunset reduction (SHRINK) is trimming accumulated runtime cruft in .claude/gemini-bridge/ (stale logs, duplicate empty pending-files.txt, old reviews/archive) — never the code guards or settings.json entries. AFTER 2026-06-18: run the migration-plan Phase-1 auth check (one real gemini -p call). IF and ONLY IF calls are confirmed blocked AND the team declines GCP/API-key migration, THEN the stack is truly dead-weight and removal is justified — at which point remove all 4 settings.json entries (L54 hook + L434/440/446 allow patterns), the 1300+ lines, and the postToolOrchestrator wiring (L177-182, L202) together. The finding inverts its own cited source and acts 10 days early on an unverified auth assumption; the conservative path preserves a working cross-vendor enforcement gate at near-zero cost (callCount 8/900) and defers the legitimate cleanup to the moment evidence supports it. gemini-scan.md rides with the stack decision, not deleted independently.

#### P28 · `.claude/skills/kiips-learning/SKILL.md + .claude/commands/learn.md/evolve.md/instinct-status.md/instinct-gc.md`

- **현재 목적**: KiiPS 학습 시스템 통합 스킬(65L, disable-model-invocation) + observe→learn→evolve 파이프라인 커맨드군.
- **발견한 문제**: 스킬 자체는 4기준 통과(참조 아티팩트 13개 instinct 실존, 65줄, disable-model-invocation 적절). 단 스킬이 learn/evolve 커맨드 파이프라인(observe→패턴감지→instinct 생성→진화, instincts/personal/*.md 경로, 80% 유사 중복검사)을 요약 재기술해 절차 본문이 스킬과 커맨드군에 중복. 능동 학습 루프 자체는 네이티브 Memory와 다른 고유 기능이라 KEEP.
- **근거**: 스킬 '관찰→패턴감지→Instinct생성→진화 /observe.js /learn /evolve'. learn.md --from-observations 동일 경로·중복검사 재기술. evolve.md 수집·중복감지·클러스터링. observe.js/instinct 13개/커맨드 모두 실존.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 스킬은 오케스트레이션 포인터로 두고 절차 본문(경로·중복검사)은 각 커맨드 정본으로 위임; 파이프라인 자체는 KEEP.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: No passive context cost exists to reclaim: disable-model-invocation:true plus absence from the skill roster means the body is never in always-on context, so the harness-diet rationale for SHRINK is moot. The 'duplication' is intentional orchestration summary at a higher altitude than the per-step commands — the only end-to-end pipeline map in the system — and removing the path/dedup lines degrades discoverability without saving meaningful tokens. With harness_diet_auto=true and medium confidence, a mechanical pass cannot tell the cross-reference map from a redundant copy and will over-strip the overview; it also targets the wrong content (path/dedup) while the real staleness (hardcoded 13-instinct snapshot, lines 39-46) is left untouched. Keep the skill as-is; the snapshot drift is the only legitimate touch and should be a separate human-reviewed micro-edit, not this auto SHRINK.

#### P29 · `.claude/commands/periodic-cleanup.md`

- **현재 목적**: 주기적 코드 위생 GC 스캔/리포트 커맨드(152L).
- **발견한 문제**: instinct-gc(183L, instinct archive)와 'garbage collection' 키워드 공유하나 대상 도메인 상이(코드 위생 vs instinct GC). 실제 커버리지 중복 미미 — 경계 명확화(NOT for 추가) 수준 권장. 낮은 신뢰도.
- **근거**: periodic-cleanup 'scan and report code hygiene'. instinct-gc 'archive stale/low-confidence'. 키워드 공유, 도메인 상이.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 낮음
- **신뢰도**: 낮음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 유지. (선택) description에 'NOT for: instinct GC(use instinct-gc)' 한 줄 추가로 혼동 방지.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 조치 자체는 KEEP 유지가 타당(파일 변경 없음, no-op). 단 harness_diet_auto=true 자동 처리는 해제해야 한다. 이유: (1) 항목의 기록된 근거('도메인 상이/중복 미미')가 파일 실독으로 반증됨 — 거짓 근거가 자동 통과 레인을 타선 안 된다. (2) plan_note의 'NOT for: instinct GC(use instinct-gc)' 경계 문구도 부정확하다 — periodic-cleanup은 Phase 3에서 실제로 instinct GC를 한다. 정확한 경계 문구는 'Phase 3/4는 instinct-gc 로직과 중복 — 심층 instinct GC는 /instinct-gc 직접 사용'이다. (3) 중복에 대한 올바른 정리는 DELETE/병합이 아니라 SHRINK-to-delegate, 즉 Phase 3/4 본문에서 archiving 규칙·요약 파일명을 재기술하지 말고 '/instinct-gc 위임'으로 바꿔 단일 진실원천(SSOT)을 instinct-gc로 두는 것이다. 이는 사람 검토가 필요한 리팩토링 제안이지 자동 조치가 아니다. defense-in-depth 관점: Phase 1-2(코드 위생/규칙 스캔)는 instinct-gc가 제공하지 않는 보장이므로 제거 시 재발 위험(미사용 import/빈 catch/방치 TODO 누락)이 생긴다 — 따라서 보수적으로 둘 다 보존.

#### P30 · `.claude/settings.json (permissionRules block, L166-509 deny entries)`

- **현재 목적**: rm/rm -rf/DROP/TRUNCATE/DELETE FROM/sudo + 시크릿 파일(.env, app-*.properties) 접근을 deny하는 커스텀 permissionRules 배열.
- **발견한 문제**: 스키마가 네이티브 아님(비활성 가능성 높음) + rm/DROP/TRUNCATE 강제는 ethicalValidator.js가 이미 수행 → 삼중 중복. settings.local.json은 네이티브 permissions:{allow}+sandbox:{enabled:true} 사용 중인데 settings.json은 옛 permissionRules:[{type,tool,pattern}] 형식이라 현재 제품이 읽는지 의심.
- **근거**: settings.json L166 permissionRules:[...]. settings.local.json L6 permissions:{allow:[...]} + L55 sandbox:{enabled:true}. ethicalValidator.js L76-79 DROP/TRUNCATE/ALTER..DROP 정규식 강제. permissionGate.js L17-21 'rm/DROP는 ethicalValidator 담당' 명시.
- **추천 조치**: `CONVERT`
- **옮긴다면 추천 위치**: deny 항목을 settings.local.json(또는 settings.json)의 네이티브 permissions.deny 배열로 이관(예: 'Bash(rm:*)','Bash(rm -rf:*)'). 시크릿 파일 보호는 sandbox deny + permissions.deny로 일원화.
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 비네이티브 스키마를 네이티브 permissions.deny로 이관, hook과의 삼중 중복 정리; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `MOVE` · 사람승인필요
  - 반박근거: Downgrade from CONVERT to MOVE because the as-specified target (bare permissions.deny + sandbox deny) is insufficient and mis-rationalized in BOTH possible states. The block is empirically inert (probe returned file-not-found, not permission-denied), so the entries give no real protection today — but the correct response is NOT to convert them 1:1 to permissions.deny, since native deny is prefix-based and cannot express the argument-path Bash secret rules, and the current sandbox has an empty read deny-list. Safer re-homing: (a) destructive-command denial — keep `rm -rf`/DROP TABLE/TRUNCATE TABLE in ethicalValidator (already enforced), and add plain `rm` to native permissions.deny if desired; (b) secret-file protection — extend the existing Edit|Write inline secret hook (settings.json L27) to ALSO cover Read/Grep/Bash matchers, AND populate the sandbox filesystem read deny-list for .env/app-*.properties, because that is the mechanism that actually enforces. Critically: do NOT remove the inert permissionRules block until the replacement is confirmed enforced (re-run the probe and expect permission-denied). Prefer SHRINK/MOVE over DELETE per the conservative safety-net directive; never collapse the sole secret-Read guard on a false 'duplicate' premise.

#### P32 · `.claude/checklists/ (code-review.md, deployment.md, testing.md, jsp-spring-specific.md)`

- **현재 목적**: KiiPS 특화 정적 체크리스트 템플릿(-am 플래그, 포트 8000, COMMON/UTILS 의존, /actuator/health).
- **발견한 문제**: 네이티브 TodoWrite와 중복되는 건 '동적 추적'이지 이 '정적 도메인 지식'이 아님. 그러나 .claude/checklists/ 별도 디렉토리에 고립되어 발견성 낮고, 네이티브 /code-review·/security-review·ecc:security-review와 일부 항목 중복.
- **근거**: 4개 정적 파일. KiiPS 고유 참조지식(빌드/포트/모듈) — ephemeral task 아님. 네이티브 /code-review가 동일 리뷰 카테고리 커버.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: .claude/memory/ 또는 도메인 스킬(kiips-frontend-guidelines/legacy-compliance-checker)의 reference로 통합. 동적 추적은 TodoWrite 담당.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: 정적 KiiPS 참조지식을 발견성 높은 메모리/도메인 스킬 reference로 이관.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 발견성-고립과 중복이라는 두 전제가 모두 실측으로 반증됨. checklist-generator 에이전트(.md:98-101 상대경로 표)+SKILL(line 42)+3개 매니저(feature/ui/build-manager)가 이 4개 파일을 reference로 실제 사용 중이라 MOVE 시 상대경로 링크가 깨진다. KiiPS 고유 빌드/포트/모듈/다크테마 지식은 네이티브 /code-review 가 커버하지 않는 유일 자산이므로 defense-in-depth가 아니라 unique 도메인 지식이다. harness_diet_auto 자동 패스가 링크를 깨고, MOVE 타겟 memory가 이미 충돌 포트(8000 vs 8088)를 가져 자동 병합 시 오류 전파 위험까지 있어 KEEP 유지가 타당. 별도 content-quality 플래그(8088/8000 포트 불일치)는 verdict와 무관하게 사람이 정정할 후속 항목으로만 남김.

#### P34 · `.claude/hooks/userPromptSubmit.js (activateSkills 경로, L160-178)`

- **현재 목적**: UserPromptSubmit에서 skill-rules.json 기반 프롬프트 매칭→스킬 활성화 메시지 주입(activateSkills) + complexity gate.
- **발견한 문제**: 네이티브 Skills가 이미 description 기반 on-demand 확률적 로딩 제공 → 커스텀 skill-rules.json 매칭/주입은 네이티브 트리거와 중복. kiips-* 스킬 20+개가 네이티브로 등록되어 수동 주입 레이어가 이중화.
- **근거**: userPromptSubmit.js L162-164 activateSkills() + L20-34 skill-rules.json 로드. 시스템에 kiips-* 스킬 다수 네이티브 등록.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 스킬 활성화/주입 로직 제거하고 네이티브 확률적 로딩 위임; captureScope/complexity gate 등 비중복 기능만 유지. hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 부분 타당: 9개 suggest-tier 스킬은 네이티브 description 로딩과 실제 중복이고 네이티브 스킬이 이제 등록됨(실재 신호). 그러나 remedy(activateSkills 전체 제거)는 과대 — 15개 require+critical 가드레일의 결정적 surfacing까지 상실. skill-rules.json은 integrity 테스트+회귀테스트로 잠긴 유지 계약이지 잔재 아님. 안전망 제거는 보수적으로 KEEP. reject가 아닌 downgrade인 이유: suggest-tier 한정 일부 중복은 사실이라 zero-merit 단언은 부정확. 향후 정밀 다이어트가 필요하면 activateSkills 통삭이 아니라 suggest-tier만 skill-rules.json에서 솎는 별도 항목으로 분리할 것.

#### P35 · `.claude/mcp.json (mcpServers.filesystem, args[2]=".")`

- **현재 목적**: filesystem MCP 서버를 프로젝트 루트 '.'에 바인딩하여 read/write 접근 제공.
- **발견한 문제**: 루트 '.' 전체에 광범위 read/write 권한. 단 enabledMcpjsonServers(context7/playwright/serena/obsidian)에 filesystem 부재로 현재 비활성(latent) — 활성 위협이 아닌 잠재 지뢰/죽은 설정.
- **근거**: settings.local.json enabledMcpjsonServers에 filesystem 부재. mcp.json args=['-y','@modelcontextprotocol/server-filesystem','.']. obsidian만 양쪽 등재(비대칭).
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 활성화 필요 시 '.' 대신 실제 작업 하위경로로 한정; 사용 이력 없으면 mcp.json에서 항목 제거 검토. 사람 승인 필수.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 비활성 루트 바인딩을 좁히거나 제거; MCP 설정이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 원래 SHRINK가 옳다. 다만 근거를 강화: 이 항목의 실질 위험은 'low'보다 높다. settings.json의 deny permissionRules는 전부 tool-scoped(Bash/Read/Edit/Write/Grep)라 mcp__filesystem__* 를 전혀 막지 못하고, Edit|Write 시크릿 차단 훅도 MCP 툴콜을 우회한다. filesystem 서버가 latent라 지금은 비활성이지만, git-tracked인 settings.local.json의 enabledMcpjsonServers에 'filesystem' 한 줄만 추가되면 '.'(모노레포 전체)에 대한 read/write가 시크릿 방어벽을 통째로 우회한다. 따라서 KEEP은 지뢰를 그대로 둠 → 부적절. SHRINK('.'→실제 작업 하위경로)는 활성화 여부와 무관하게 유효한 항구적 완화책이라 채택. DELETE로의 격상은 보수성 원칙상 보류(사용 이력 0이므로 사람 검토 하 제거는 별도 옵션). MCP 설정 변경 + Claude Code 재시작 + 시크릿 노출 영향 때문에 사람 명시 승인 필수이며, 무비판 자동 다이어트 금지(harness_diet_auto=false).

#### P36 · `.claude/settings.local.json (permissions.allow: Bash(node:*), Bash(python3:*), Bash(bash:*), Bash(claude:*))`

- **현재 목적**: node/python3/bash/claude CLI 실행을 프롬프트 없이 허용 — 빌드/훅/서브에이전트/serena 구동.
- **발견한 문제**: 사실상 임의 코드 실행 allowlist. PreToolUse 훅은 셸 명령 문자열 패턴만 스캔하므로 node/python 스크립트 내부 임의 로직은 미검사 → 프롬프트 없이 미검사 코드 실행 가능. sandbox가 write/network 부분 제약하나 의존성 높음. settings.local.json이 git-tracked라 팀 전체 공유.
- **근거**: settings.local.json L36 Bash(node:*), L14 Bash(python3:*), L25 Bash(bash:*), L28 Bash(claude:*). sandbox L55-58. git ls-files 추적 확인.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 가능 범위에서 구체 서브커맨드로 좁히기(node ./.claude/hooks/*는 별도 allow 존재; python3 -m serena 등). 전면 좁힘은 hook/serena/subagent 구동을 깨뜨릴 수 있어 사람 검증 필수.
- **변경 시 위험도**: 높음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 광범위 코드실행 allow를 구체 경로로 좁히되 핵심 구동 의존 확인; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the correct direction and the conservative posture (harness_diet_auto=false, human approval) is right for a git-tracked permission file. The blanket interpreter allowlist genuinely defeats the regex-only Bash hooks, so it does block a real recurring risk (unreviewed code execution) rather than preserving a habit — meeting the harness principle. But the audit must be corrected/sharpened, not auto-applied: (a) narrowing node/bash does NOT break hooks (they run via the hook runner), so the agent-facing node/bash deps are small and enumerable — node .claude/evals/eval-runner.js, node .claude/hooks/gemini-bridge.js; bash had zero agent-run scripts found; (b) Bash(claude:*) has no found dependency and is the strongest removal candidate (recursive spawn / cost+privilege amplification); (c) Bash(python3:*) is the one truly entangled with serena/LSP via a brittle hashed uv path and must be narrowed carefully, never dropped blind. Net: keep SHRINK, do not downgrade to KEEP (the hole is real) and do not escalate to a blind DELETE (python3/node carry live deps). Verify serena, eval, and gemini-bridge still run after any narrowing.

#### P37 · `.claude/settings.json (permissionRules deny *.properties/.env) + inline python3 hook(L27) + permissionGate.js BLOCKED_PATHS`

- **현재 목적**: app-kiips/stg/local/tibero.properties 및 .env/secrets 파일 접근 차단(민감정보 보호).
- **발견한 문제**: 동일 민감 파일 보호가 3중 중복: (1) settings.json permissionRules deny, (2) settings.json PreToolUse 인라인 python3 훅(blocked 배열), (3) permissionGate.js BLOCKED_PATHS. 인라인 python3 훅은 나머지 둘에 이미 포섭됨 → 중복 게이트.
- **근거**: settings.json L27 인라인 python3 blocked=['.env','secrets','.git/','app-kiips.properties','app-stg.properties','app-local.properties','app-tibero.properties','credentials','.secret','password']. 같은 파일들이 permissionRules deny(L206-357)·permissionGate.js BLOCKED_PATHS(L47-57)에 재등장.
- **추천 조치**: `CONVERT`
- **옮긴다면 추천 위치**: 인라인 python3 PreToolUse 훅(settings.json L22-30) 제거하고 permissionRules deny(→네이티브 permissions.deny, P30) + permissionGate.js로 단일화. 보안 항목이라 사람 승인.
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 동일 보호의 3중 중복 제거(안전망 제거 아님); 보안이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: Do not remove the inline hook now. It is a security safety net whose claimed redundancy is false: permissionGate.js covers none of .env/secrets/.git//app-local/app-tibero/credentials/.secret/password, and permissionRules (a) misses secrets/.git//credentials/.secret/password for Edit/Write and (b) is a non-native key that P30 says is not yet converted to enforced permissions.deny. Removal is safe ONLY after two prerequisites are verifiably met and proven by test payloads: (1) P30 completes — protected files denied via native permissions.deny and confirmed to actually block Edit/Write; (2) permissionGate.js BLOCKED_PATHS extended to cover the full token set (.env, secrets, .git/, app-local.properties, app-tibero.properties, credentials, .secret, password) so a single non-inline layer holds even if the other regresses. Until then the conservative action is to keep the inline hook (defense-in-depth), not CONVERT. If any cleanup is desired before prerequisites, limit it to reconciling/aligning the three protected-file sets in documentation — no deletion of the gate.

#### P38 · `.claude/hooks/multiFileGate.js (PreToolUse Edit|Write, settings.json L40-48)`

- **현재 목적**: 3개 이상 파일 동시 변경 시 경고하려는 advisory 게이트.
- **발견한 문제**: 헤더·코드 모두 'exit(0) always: WARN gate, never blocks' — 절대 차단하지 않는 advisory인데 차단 위치인 PreToolUse에 와이어되어 매 Edit/Write마다 Node 프로세스 spawn. 사고를 막지 못하면서 마찰/오버헤드만 추가('반복 실수 방지' 원칙 미부합, 차단력 0).
- **근거**: multiFileGate.js L6-7 'exit(0) always: WARN gate, never blocks / Fail-open'. grep exit(2)=0건, decision block=0건. settings.json PreToolUse Edit|Write 등록.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: PreToolUse(차단 위치)에서 제거하고 PostToolUse orchestrator(postToolOrchestrator.js)로 통합하거나 advisory 출력만 유지.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 차단 게이트 아니므로 PreToolUse 슬롯에서 PostToolUse orchestrator로 이전; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: Keep multiFileGate.js wired at PreToolUse Edit|Write. The finding's core observation (advisory hook, exit 0 always, zero blocking) is factually correct, but MOVE is the wrong remedy: PostToolUse fires the threshold warning after the 3rd file is already written, breaking the BEFORE-approval edge that anti-rationalization.md explicitly delegates to this hook, and relocating one of eight PreToolUse spawns does not solve the per-edit overhead it cites. The real overhead remedy is a PreToolUse orchestrator mirroring the existing postToolOrchestrator.js — consolidating the exit(0)-WARN hooks (multiFileGate + impactAnalyzer, same pattern) into one process while preserving Pre-edit timing. Two genuine defects to repair IN PLACE rather than by moving: (a) wire the 'approve multi-file' suppression (no hook currently sets approved:true, so the documented suppression/approval path is dead and the approved-branch is unreachable), and (b) confirm whether the exit(0) stderr box actually surfaces to agent vs user — the regression suite only does load_test, with no behavioral threshold assertion, so there is no evidence the warning ever fires. Record these as repair findings; do not DELETE (it is a documented member of the 5-gate safety set) and do not MOVE.

#### P39 · `.claude/hooks/impactAnalyzer.js (PreToolUse Edit|Write, settings.json L67-75)`

- **현재 목적**: KIIPS-COMMON/UTILS 등 공용 모듈 변경의 의미적 영향을 경고하는 advisory 게이트.
- **발견한 문제**: multiFileGate와 동일하게 'exit(0) always: WARN gate, never blocks' advisory인데 PreToolUse 차단 위치에 등록되어 매 Edit/Write마다 Node 프로세스 spawn. 차단력 없이 PreToolUse 게이트 수만 늘려 마찰 증가.
- **근거**: impactAnalyzer.js L8-9 'exit(0) always: WARN gate, never blocks / Fail-open'. grep exit(2)=0건. settings.json PreToolUse Edit|Write 등록.
- **추천 조치**: `MOVE`
- **옮긴다면 추천 위치**: PostToolUse orchestrator로 통합하여 advisory 유지. PreToolUse 차단 슬롯에서 제외.
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: advisory를 PostToolUse로 이전; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: MOVE는 단순 잉여 제거가 아니라 가드를 능동적으로 퇴화시킨다. PostToolUse는 write 이후에만 실행되므로 결정-시점 권고가 사후-변이 통보로 바뀐다(순서 논거, stderr 라우팅 무관). finding의 multiFileGate 패리티 논거는 반대로 작동한다: 동급 pre-action advisory인 multiFileGate은 PreToolUse에 정당하게 남아 있고 아무도 Post로 옮기자 하지 않으므로, PreToolUse advisory는 의도된 패턴이다. permissionGate+impactAnalyzer는 kiips-developer.md L31에 강제 쌍으로 문서화된 defense-in-depth이며 트리거(의미적 참조 5+ vs 파일 개수)·목적이 multiFileGate과 다르다. 비용 주장도 과장됨(SHARED_MODULE_PATTERN+.java+30분 throttle 통과 시에만 grep 실행). 따라서 현 위치 유지(KEEP)가 안전하다. 줄일 여지가 있다면 advisory 출력의 verbosity 축소 같은 SHRINK 후보만 별도 검토.

#### P40 · `.claude/hooks/scssValidator.sh (settings.json PostToolUse L98-106) vs postToolOrchestrator.js (execSync L166)`

- **현재 목적**: SCSS 다크테마 검증을 PostToolUse에서 수행.
- **발견한 문제**: 이중 와이어링: settings.json PostToolUse가 scssValidator.sh를 독립 실행(L103)하는 동시에 postToolOrchestrator.js가 runShellHook('scssValidator.sh')로 execSync(L166) — .scss 편집 시 동일 검증 2회 실행. orchestrator 설계 목적(6프로세스→1)과 모순.
- **근거**: settings.json PostToolUse L99-104 bash scssValidator.sh 등록. postToolOrchestrator.js L10/11 헤더에 scssValidator/themeCssVerGuard 통합 명시, L166 runShellHook('scssValidator.sh'), L171 themeCssVerGuard.sh execSync.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: settings.json의 독립 scssValidator.sh 와이어 제거하고 orchestrator 단일 경로로 통일; hook이라 사람 승인.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Uphold the SHRINK: remove the standalone scssValidator.sh wire in settings.json PostToolUse (L98-106) and rely on the orchestrator's single path (postToolOrchestrator.js L165-167). Evidence is strong/high-confidence: (a) git proves the duplicate is an accidental re-introduction of a wire that consolidation had intentionally deleted, directly contradicting the orchestrator's stated '6 processes -> 1' purpose (L17); (b) both paths are non-blocking (scssValidator.sh exits 0 at L94; themeCssVerGuard.sh exits 0 at L63), so the duplicate never blocks work and removing it cannot regress blocking behavior; (c) coverage is preserved because the orchestrator already invokes scssValidator.sh AND themeCssVerGuard.sh on the identical isEditWrite && isScss condition (L165-172), so the dark-theme lint and sass compile check still run on every .scss edit. CONDITION on the SHRINK (do not ship bare): before/while removing the standalone wire, raise the orchestrator's scssValidator timeout above the 5000ms default at L166 (e.g. pass an explicit larger timeout) so the `sass` compile catch on wide-import theme.scss is not weakened, and ensure the swallowed-error branch (L126-129) does not silently hide compile failures. This conditions but does not flip the verdict — the duplicate is genuine accidental redundancy and the surviving orchestrator path retains the recurring-mistake guard.

#### P41 · `.claude/hooks/ethicalValidator.js (PreToolUse Bash|Edit|Write, settings.json L3-12)`

- **현재 목적**: rm -rf/DROP/curl|bash/하드코딩 자격증명 등 파괴적·위험 작업을 PreToolUse에서 차단(fail-closed).
- **발견한 문제**: 문제 없음. Bash|Edit|Write 광범위 matcher는 '변형 도구 전체 커버'로 적절. shellContextOnly+isShellContext로 Edit/Write false positive 좁힘, AST 토크나이저로 literal/comment 오탐 제거. 반복 사고(파괴 명령)를 차단하는 핵심 안전망.
- **근거**: ethicalValidator.js L73-138 BLOCKED_OPERATIONS, isShellContext(L141+), exit(2) 차단. shellContextTokenizer AST 적용.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. 핵심 안전망.

#### P42 · `.claude/hooks/postToolOrchestrator.js (PostToolUse Bash|Edit|Write, settings.json L88-97)`

- **현재 목적**: PostToolUse 검증 6종(autoFormatter/buildChecker/scss/geminiAutoTrigger/observe/outputSecretFilter)을 단일 Node 프로세스에서 순차 실행.
- **발견한 문제**: 문제 없음. Bash|Edit|Write 광범위 matcher는 6개 spawn을 1개로 통합한 의도된 오케스트레이터로 마찰 저감 목적. 단 scssValidator 이중실행(P40)만 정리 필요.
- **근거**: postToolOrchestrator.js 헤더 L4-19 통합 목록, '6 프로세스 → 1 프로세스'. settings.json PostToolUse Bash|Edit|Write 등록.
- **추천 조치**: `KEEP`
- **변경 시 위험도**: 높음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 유지. P40의 scssValidator 이중실행만 정리.

#### P44 · `.claude/settings.local.json (permissions.allow Bash(brew install:*), Bash(chmod:*))`

- **현재 목적**: brew install 패키지 설치 및 chmod 권한 변경을 프롬프트 없이 허용.
- **발견한 문제**: brew install:*는 임의 패키지 설치(시스템 상태 변경), chmod:*는 임의 파일 권한 변경 허용. 개발 셋업 1회성 흔적으로 추정 — 상시 allow 불필요. node/python처럼 핵심 의존 아님.
- **근거**: settings.local.json L31 Bash(brew install:*), L8 Bash(chmod:*). 다른 setup 성격 allow(java -version, jdtls, java_home)와 함께 위치.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: 상시 allowlist에서 제거하여 필요 시 프롬프트 승인으로 전환. 제거해도 핵심 워크플로 영향 없음. 권한이라 사람 승인.
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 1회성 셋업 권한을 상시 allow에서 제거; 권한이라 사람 승인.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `SPLIT` · 사람승인필요
  - 반박근거: The two permissions have opposite usage profiles and must not share one action. KEEP Bash(chmod:*): 15 recurring observations through 2026-06-05 prove it is a live workflow staple (chmod +x on user-authored hooks/scripts/git-hooks), not a stale setup trace — removing it adds recurring friction with no security gain (it is the user's own repo scripts, no deny rule, in-context low risk). Only Bash(brew install:*) is a plausible SHRINK candidate (1 genuine one-time use ~3 months old), but it still has a latent trigger via .claude/scripts/setup.sh and the reinstall/migration guides, and as a system-state-changing install permission it requires human approval before removal. Net: SPLIT the item first; do not apply the bundled SHRINK as written. harness_diet_auto is correctly false and must stay false — auto-processing this would silently break the user's hook-development loop.

#### P45 · `.claude/skills/kiips-backend/SKILL.md`

- **현재 목적**: Controller/Service/DAO 패턴, 공통 코드(COMMON/UTILS), API 설계, 예외 처리 가이드.
- **발견한 문제**: 실재하지 않는 클래스/형식을 표준으로 제시(stale·오류 3건). (1) BusinessException 클래스가 코드베이스에 0건이나 예외 처리 예시가 참조 → 따라 하면 컴파일 오류. (2) StringUtils/DateUtils/NumberUtils를 KiiPS 자체 클래스처럼 열거하나 0건(실제는 org.apache.commons.lang3 + Utils/CheckUtil/FileUtil). (3) API 응답 형식을 ResponseEntity<Map<String,Object>>로 명시하나 실제 표준은 ResponseEntity<ApiResultBean<Object>>(GlobalExceptionHandler도 동일).
- **근거**: grep 'BusinessException' 0건, GlobalExceptionHandler.java NPE/IAE/RuntimeException/Exception 처리. find StringUtils/DateUtils/NumberUtils.java 0건, LoginAPIController import org.apache.commons.lang3.StringUtils. GlobalExceptionHandler L45 ResponseEntity<ApiResultBean<Object>>, ApiResultBean.java 4개 파일.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 예외 처리(BusinessException→실제 핸들러), 유틸 목록(commons-lang3+Utils/CheckUtil/FileUtil), API 응답(ApiResultBean)을 실제 코드 기준으로 교정.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: All three stale/wrong standards are verified against real code (only nuance: BusinessException appears once, in a comment, with no usable class — so "follow it = compile error" still holds). SHRINK is the right and appropriately conservative call: it removes/trims the incorrect standardized examples without deleting a useful skill, and it is far safer than DELETE. The standard adversarial objection (removing a guardrail causes regression) does not apply because this skill is the cause of the error, not a protection against one — keeping it as-is is the actively harmful option. Note the verb mismatch the plan_note reveals: the real remedy is CORRECTION (BusinessException→real GlobalExceptionHandler/NPE-IAE-RuntimeException-Exception flow; util list→commons-lang3 + DateUtil/CheckUtil/FileUtil; response→ApiResultBean<Object>), which is more than a mechanical volume trim. Because the fix requires codebase-accurate rewrites of a .claude/skills/ file (judgment, not auto-trim), it must not be run through unattended /harness-diet — keep harness_diet_auto=false and gate on human approval.

#### P46 · `.claude/skills/kiips-build/SKILL.md`

- **현재 목적**: 빌드/배포/기동 통합 스킬(108L, disable-model-invocation). maven-builder+service-deployer+build-deploy+startup 4종 병합본.
- **발견한 문제**: stale fact 다수. (1) -pl :KiiPS-SERVICE는 존재하지 않는 artifactId(실제 KiiPS-FD/IL 등) → 복사 시 빌드 실패. (2) PG 포트를 8301로 오기(실제 8501; 8301은 SY). (3) 로그 패턴 log.DATE-0.log는 APIGateway/Infra-Admin에만 존재(주요 서비스는 logback.log/err_log/api_time 형식). 트리거·길이·disable-model-invocation 자체는 적절(그 facet은 KEEP).
- **근거**: L16-17 -pl :KiiPS-SERVICE, grep artifactId KiiPS-SERVICE 0건(CLAUDE.md L9 동일 placeholder). KiiPS-PG/app-local.properties server.port=8501, KiiPS-SY=8301, SKILL L47 PG(8301). find log.*.log: APIGateway/Infra-Admin만 매칭.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: placeholder 모듈명 실제값으로, PG 포트 8301→8501, 로그 패턴을 서비스별 실제 형식(logback.log/err_log/api_time)으로 교정. 빌드/배포 도메인이라 사람 검증.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: 진단 3건 전부 소스 검증 통과. SHRINK(사실 교정+구조/트리거/disable-model-invocation 유지)는 올바른 altitude — DELETE도 MOVE도 아님. 단 교정은 blanket find/replace가 위험: 8301은 SY의 실제 포트라 전역 치환 시 SY 설정 손상, 로그 패턴은 서비스 tier별로 다름(APIGateway/Infra-Admin의 log.DATE-N.log는 정확)이라 일괄 치환하면 정상 패턴까지 오염. 따라서 이 파일 1개로 scope 한정 + 서비스별 실제 형식(active=logback.log, rolled=log.DATE-N.gz/err_log/sql/api_time)으로 교정해야 함. harness_diet_auto=false 유지 필수(자동 적용 절대 금지).

#### P47 · `.claude/skills/kiips-db-inspector/SKILL.md`

- **현재 목적**: MyBatis mapper XML 기반 테이블/컬럼 구조 분석 조회 전용 스킬(user-invocable: false).
- **발견한 문제**: 스킬 전체가 존재하지 않는 기술(MyBatis mapper XML)을 전제 — 프로젝트는 mapper XML을 전혀 안 쓰고 DAO가 StringBuffer+JdbcTemplate(DBSelecter) 인라인 SQL 패턴 사용. 분석 대상(mapper/*.xml, resultMap, sql 태그)이 코드베이스에 0건이라 워크플로우 전체 적용 불가 → 단순 trim이 아닌 전면 재작성. 부수: user-invocable:false 비표준 키(다른 스킬은 disable-model-invocation:true), Related 필드에 kiips-mybatis-guide 중복 기재.
- **근거**: find *.xml 결과 mapper XML 없음. FD0303APIDao.java StringBuffer+JdbcTemplate. DBSelecter.java JdbcTemplate 래퍼. SKILL L37-145 mapper 기반. user-invocable:false(L?), Related L222 kiips-mybatis-guide 2회.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: MyBatis 전제를 실제 JdbcTemplate+StringBuffer 인라인 SQL 패턴으로 전면 재작성; user-invocable→disable-model-invocation, Related 중복 제거.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `CONVERT` · 사람승인필요
  - 반박근거: 증거 확증: 전체 프로젝트에 mybatis 0건(어느 pom.xml/config에도 없음), 쿼리용 mapper XML 0건, DAO는 'extends DBSelecter' + StringBuffer.append() 인라인 SQL + JdbcTemplate(IL0206APIDao 등에서 확인), FD0303APIDao.java 실재. 프로젝트 자체 메모리 .claude/_global-seed/memory/project_kiips_inline_sql_dao.md가 'KiiPS 백엔드는 MyBatis mapper XML을 쓰지 않는다'고 명시하고 kiips-db-inspector를 XML-매퍼 전제로 부분적합 스킬로 지목 → 핵심 주장 독립 확증. 스킬 전체 워크플로우(mapper/*.xml의 resultMap/sql/select 태그 grep)가 존재하지 않는 파일을 대상으로 해 비기능적. 따라서 실제 JdbcTemplate+StringBuffer 인라인 SQL 패턴으로의 전면 재작성(CONVERT)이 타당. 단, 다음 조건부 처리 필요: [A] 프레임matter 키 변경은 단순 normalization이 아니라 의미 역전 — 'user-invocable:false'는 제거/수정해야 하나 'disable-model-invocation:true'로 바꾸지 말 것(모델호출 비활성화는 의도 반대). registry가 이미 disableModelInvocation:false로 읽고 있어 현재 키는 사실상 무효 상태이므로, 의도(모델 내부/파이프라인용, 사용자 직접호출 비노출)를 보존하려면 게이팅 의미를 재확인 후 결정. [B] reference.md/registry description/SKILLS.md 동반 갱신 포함해야 CONVERT 완결. [C] 시퀀싱 의존성: P47의 Related가 가리키는 kiips-mybatis-guide 자체도 동일하게 MyBatis-stale(별도 finding) — P47만 변환하면 stale 가이드를 가리키는 dangling pointer가 남으므로 Related 항목은 단순 중복제거가 아니라 재검토 대상. kiips-mybatis-guide 본체는 본 verdict 범위 밖.

#### P48 · `.claude/skills/kiips-feature-planner/SKILL.md (+ plan-template-kiips.md)`

- **현재 목적**: 신규 기능 기획/구현 전략 스킬(322L, disable-model-invocation).
- **발견한 문제**: stale 경로/형식 + 중복. (1) API Gateway 라우팅을 application.yml YAML 블록으로 안내하나 해당 파일 부재 — 실제는 app-local.properties의 spring.cloud.gateway.routes[N] properties 인덱스 방식. (2) JSP 위치를 src/main/resources/templates/로 안내하나 실제는 src/main/webapp/(templates엔 template.html 1개). (3) Related Skills에서 kiips-build를 3줄 복붙(Build/Deploy/Test, Test는 실제 kiips-test-runner). (4) Quality Gate/SVN/Testing Strategy 약 100줄이 plan-template-kiips.md와 중복 → 322줄 초과. disable-model-invocation·트리거 자체는 적절.
- **근거**: L185-195 application.yml YAML(find *.yml in src 0건), app-local.properties L25-27 routes[0].id=kiipslogin. L203-204 templates/(jsp 0건), webapp jsp 다수. L318-320 kiips-build 3행. SKILL L82-115≈template L91-133, L209-240≈L396-438.
- **추천 조치**: `SHRINK`
- **옮긴다면 추천 위치**: plan-template-kiips.md (Quality Gate/Testing Strategy 중복 단일화)
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 라우팅(properties routes[N])·JSP 경로(webapp)·Related(kiips-test-runner) 교정, 중복 100줄을 template로 단일화.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK is the right action class — the defect is over-staleness plus verbatim duplication, both warranting reduction, and SHRINK is already moderate (not a safety-net removal). Verdict is uphold WITH amended plan, because the finding's plan_note is incomplete/misdirected: (1) Stale refs must be corrected in BOTH SKILL.md AND plan-template-kiips.md — the template is NOT a clean canonical source; specifically routing should reference spring.cloud.gateway.routes[N] properties indices in KIIPS-APIGateway/app-local.properties (not application.yml YAML), and JSP location should be KiiPS-UI/src/main/webapp/ (not src/main/resources/templates/, which holds only template.html). (2) Related Skills must replace the duplicate kiips-build entries with kiips-test-runner (verified to exist) and keep kiips-logs/checklist-generator. (3) Dedup ONLY truly-verbatim prose; retain a concise Quality-Gate/Testing summary in SKILL.md because it is planner-facing guidance distinct from the artifact checklist in the template — do not fully gut it. Net: corrections are zero-risk; consolidation is medium-risk and must not designate the template as authoritative without first fixing it.

#### P51 · `.claude/skills/kiips-mybatis-guide/SKILL.md`

- **현재 목적**: MyBatis mapper XML 패턴, SqlSessionTemplate DAO, 동적 SQL, SQL Injection 방지 가이드(373L).
- **발견한 문제**: P47과 동일 근본 원인 — 프로젝트가 MyBatis mapper XML을 실제로 안 씀(DAO 내 StringBuffer 인라인 + JdbcTemplate/DBSelecter). 전제 파일구조(mapper/**/*.xml)·DAO 패턴(SqlSessionTemplate+NAMESPACE)·XML 표준 구조 전체가 부재 레거시 → 단순 SPLIT 아닌 현행 패턴으로 전면 재작성 우선. 부수: 트리거 'SQL'/'쿼리'가 거의 매 백엔드 세션 오발동, 373줄 초과.
- **근거**: project_kiips_inline_sql_dao.md: 'MyBatis XML 안 씀, StringBuffer 인라인+JdbcTemplate'. find mapper *_SQL.xml 0건. SqlSessionTemplate 비주석 0건(주석 2줄만). TB_LP1025M_DAO.java JdbcTemplate+StringBuffer. SKILL L3 'SQL, 쿼리', skill-rules.json L446 동일. wc -l 373.
- **추천 조치**: `CONVERT`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: MyBatis XML 전제를 실제 JdbcTemplate 인라인 SQL 패턴으로 전면 재작성; 트리거 'SQL'/'쿼리' 축소(skill-rules.json 동기화). 재작성 후 길이 점검.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) · 사람승인필요
  - 반박근거: CONVERT is correct: the MyBatis-XML premise is empirically false and the skill must be rewritten to the project's real JdbcTemplate/DBSelecter + StringBuffer + `?` positional-param pattern, with bare "SQL"/"쿼리" triggers narrowed and skill-rules.json synchronized. Adversarial defenses do not hold (defense-in-depth layer is dead xml-only code; skill guards the wrong surface). MANDATORY guardrails attached to the rewrite, which is why this is uphold-with-conditions, not blind approval: (a) PRESERVE the content-agnostic blockRules in this skill-rules block — `ddl-destructive` (DROP/TRUNCATE) and `delete-without-where` — they fire regardless of MyBatis-vs-JdbcTemplate and are a genuine safety net that a naive rewrite could drop; (b) the rewritten guidance MUST cover the actual injection vector (Java string concatenation of user input into SQL, 1109 files) since the existing `.xml`-only hook cannot — either re-scope mybatisBindingGuard.js to `.java` or raise it as a linked sibling finding; (c) coordinate with sibling false-premise items kiips-db-inspector (P47, 18 mapper refs) and the dead hook so the harness stays internally consistent — do NOT convert this skill in isolation. harness_diet_auto=false is correct: this rewrite involves substantive technical authorship + trigger surgery + cross-file sync and must never be auto-run via /harness-diet.

#### P53 · `.claude/skills/kiips-orchestration/SKILL.md`

- **현재 목적**: 병렬 에이전트 조정, ACE 가드레일, 스킬 체이닝 파이프라인 참조(66L, disable-model-invocation).
- **발견한 문제**: 스킬 체이닝 파이프라인 섹션(L49-62)이 참조하는 kiips-build/test-runner/feature-planner/backend/logs가 '등록된 스킬 목록에 부재'로 보고됨(단, 디스크에는 존재 — 정찰 시점 등록 누락 또는 stale 가능). 파이프라인 예시가 미등록 스킬을 가리키는 stale 우려. ACE 가드레일(L13-25)·병렬 프로토콜·66줄·disable-model-invocation 자체는 KEEP.
- **근거**: SKILL L49-62 3개 파이프라인이 kiips-build/test-runner/feature-planner/backend/logs 포함. 정찰: 등록 목록에 부재. (주의: 동일 보고서 다른 finding은 이들 스킬이 디스크 존재로 확인됨 — 등록/명명 동기화 필요.)
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 파이프라인 예시의 스킬명을 실제 등록명과 동기화(또는 일반화); ACE 가드레일은 유지.
- **🔴 Adversarial 반박**: ⛔ 반려(reject)
  - 반박근거: Premise is empirically false. All 6 referenced kiips-* skills exist on disk with name: frontmatter matching the pipeline tokens exactly; /check-health, /verify, /diagnose all resolve. The 'absent from registered list' recon signal is fully explained by disable-model-invocation: true on every referenced skill, which excludes them from the model-invocable registry recon sampled — not a stale or misnamed reference. SHRINK provides no benefit: name-sync is a no-op, and generalization is actively harmful because this doc is the only discovery surface for these explicit-invocation-only skills (defense-in-depth for hidden skills). Do not touch the SKILL.md text; KEEP as-is (ACE guardrails, parallel protocol, 66L, disable-model-invocation already slated KEEP). Out of scope but worth a separate finding: the registration/naming-sync concern (why these skills do not surface in the auto-invocable registry) is a registration matter, not a SKILL.md-text matter, and does not justify editing this file. NOTE: this item was tagged harness_diet_auto=false, correctly — it must not be auto-applied; reject confirms it should never reach /harness-diet.

#### P58 · `.claude/skills/kiips-stitch-bridge/SKILL.md`

- **현재 목적**: Stitch/Pencil 디자인(.pen, .stitch)을 KiiPS JSP/Bootstrap/RealGrid로 변환(136L).
- **발견한 문제**: stale 도구명/구조(트리거·길이·disable-model-invocation은 적절). (1) 진입점으로 mcp__pencil__open_document 명시하나 Pencil MCP에 부재 — 실제 진입점 get_editor_state(include_schema:true), 트리거 시 즉시 실패. (2) .stitch/ 디렉토리 구조를 designs/·metadata.json·*.pen 포함으로 문서화하나 실제는 SITE.md·DESIGN.md 두 파일만 존재.
- **근거**: SKILL L25 mcp__pencil__open_document(deferred-tools 목록에 없음; 실제 get_editor_state/batch_design/export_nodes 등). MCP 지침 'get_editor_state(include_schema:true) 진입점'. ls .stitch/: DESIGN.md, SITE.md만. SKILL L116-121 designs/PG0500.* 부재.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 진입점을 mcp__pencil__get_editor_state(include_schema:true)로 교정, .stitch/ 구조 예시를 실제(SITE.md/DESIGN.md)와 정합.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK`
  - 반박근거: 원 SHRINK은 (a)진입점 교정 + (b).stitch/ 구조 예시 재작성 두 변경을 묶었다. (a)만 유효하고 (b)는 해롭다 → 범위를 (a)로만 좁힌 더 보수적 SHRINK로 downgrade. 구체적으로: L25의 mcp__pencil__open_document 를 mcp__pencil__get_editor_state(include_schema:true)로 교정(이는 스키마 로드용 '첫' 호출이며, 실제 디자인 노드 읽기는 이후 batch_get/export_nodes 사용 — get_editor_state 단독으로 디자인을 읽는다고 함의하지 말 것). .stitch/ 디렉토리 예시(L113-120) 및 L50 템플릿 주석은 '(선택)' optional·forward-looking 예시이므로 손대지 말 것 — '실제와 정합' 재작성 금지. plan_note의 후반('.stitch/ 구조 예시를 실제와 정합')은 폐기. 하위 reader가 이 항목을 무비판적으로 돌릴 때 디렉토리 예시까지 덮어쓰지 않도록 명시. harness_diet_auto=false 유지가 적절(자동 처리 대상 아님).

#### P60 · `.claude/skills/legacy-compliance-checker/SKILL.md`

- **현재 목적**: KiiPS 레거시 준수 가드레일(Java 8 차단, Boot 2.4.x, jQuery/JSP, MyBatis 안전, SCSS) 정적 룰 테이블(127L, user-invocable: false).
- **발견한 문제**: 트리거 과넓음 + 비표준 플래그. (1) 트리거 'Java, 코드 작성, 구현, implement, 클래스, 메서드'가 위반 위험 없는 일반 작업(테스트 작성, 리팩터 설명, README)에도 오발동 — 진짜 필요 시점은 '신규 Java/JSP/SCSS 파일 생성·의존성 추가'로 훨씬 좁아야 함. (2) 검증이 전부 정적 정규식인데 disable-model-invocation 미명시(user-invocable:false 비표준 키만) → 불필요 LLM 추론 유발 가능. 127줄·reference.md(335L) 분리 자체는 적절(그 facet KEEP).
- **근거**: SKILL L3 'Use when: Java, 코드 작성, 구현, implement, 클래스, 메서드'. L34-38 동일 광범위. frontmatter user-invocable:false만, disable-model-invocation 없음. reference.md L319-329 정규식 테이블. wc -l 127.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: 트리거를 '신규 파일 생성/의존성 추가'로 한정, user-invocable→disable-model-invocation 표준 키로 통일.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: Downgrade to a much more conservative SHRINK than proposed, and drop Part B entirely. (1) NEVER swap user-invocable:false → disable-model-invocation:true. disable-model-invocation:true is functional (build-registries.js consumes it) and would block the only path (Skill-tool model-load) by which the Java 8 / Spring Boot 2.4.x / ES-module rules reach the model — these have no PreToolUse/PostToolUse backstop. This is exactly the "전역→Skill on-demand 로딩이라 정작 필요한 순간 트리거 안 됨" risk the audit warns about, realized as a kill switch. user-invocable:false is inert (no consumer) so it is harmless to leave; if standardization is wanted, the only safe normalization is to make the skill model-invocable on edits, not to disable it. (2) Do NOT narrow triggers to "신규 파일 생성/의존성 추가". The dominant Java-8 violation is editing an EXISTING .java file; that wording excludes the main case and lets var/record/List.of/Stream.toList ship uncaught. The fileTriggers (**/*.java/.jsp/.xml/.scss) and intentPatterns must keep firing on edits. (3) The only defensible SHRINK is a narrow prompt-keyword trim that PROVABLY preserves edit-path activation: drop pure-documentation false-fires (README, plain "test 작성" with no code-gen, refactor-explanation) by tightening promptTriggers.keywords, while KEEPING the fileTriggers and intentPatterns that fire on Java/JSP/SCSS edits. The body split (SKILL 127L + reference 335L) is correct — KEEP. If a trim that provably preserves edit-path activation cannot be specified with confidence, the safe residual is KEEP (none): this is a critical:block guardrail with a single delivery layer for Java 8, so per the audit principle (안전망 제거는 보수적으로) prefer leaving it over a risky narrowing.

#### P61 · `.claude/skills/kiips-regist-modal-guide/SKILL.md`

- **현재 목적**: 등록/수정 모달 표준 패턴(HTML, 폼필드, 편집그리드, 데이터 바인딩, 저장, 이벤트). 253L.
- **발견한 문제**: Part 번호 불연속(1,2,3→6,7,8; Part 4,5 누락)으로 내부 목차 혼란. 내용·참조 JSP(IL0927/IL0903/SY0208) 현용, 253줄로 300줄 미만(SPLIT 불필요), reference.md/examples.md 분리 완료, disable-model-invocation 미설정 적절, 트리거도 KiiPS 용어로 충분히 좁음.
- **근거**: SKILL L12 Part 1, L64 Part 2, L102 Part 3, L146 Part 6 — Part 4,5 누락. wc -l 253. reference.md 304L, examples.md 122L. IL0927.jsp createEditGrid/gatherComponent/modal-confirm 현존.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: Part 번호를 1~6 연속으로 재정렬(4,5 누락 수정); 내용은 유지.
- **🔴 Adversarial 반박**: ⛔ 반려(reject) → 대안 `KEEP` · 사람승인필요
  - 반박근거: 자동(harness_diet_auto) 적용 시 위험: cross-file 불완전 진단에 근거한 cosmetic 단일파일 재정렬을 현용 중인 스킬에 가하는데, 다이어트 이득은 0이고 reference.md의 'Part 11'을 더 고립시켜 불일치를 증가시킬 수 있다. Part 번호는 내부 참조 앵커가 아니므로(grep 매칭 0) '목차 혼란' 문제 자체가 과대평가다. 올바른 수정은 3개 파일 번호 체계를 함께 재조정하는 인간 편집 판단이지 자동 단일파일 renumber가 아니다. 스킬 콘텐츠/참조 JSP는 모두 현용이므로 KEEP가 정직한 매핑이다.

#### P63 · `.claude/hooks/ (orphaned: agentStateManager.js, autoFormatter.js, backupGc.sh, geminiAutoTrigger.js, observationsRoller.js, observe.js, outputSecretFilter.js, shellContextTokenizer.js, themeCssVerGuard.sh) + .min.js 4종`

- **현재 목적**: settings.json에 미와이어된 hook 파일 10종 + 사용되지 않는 .min.js 4종(ethicalValidator/permissionGate/postToolOrchestrator/shellContextTokenizer).
- **발견한 문제**: 인벤토리 anomaly: 10개 hook이 settings.json에 미와이어(dead code 또는 superseded 의심). 단 일부(autoFormatter/observe/outputSecretFilter/shellContextTokenizer/themeCssVerGuard)는 postToolOrchestrator.js가 내부 require/execSync로 호출하는 통합 대상일 수 있어 진짜 orphan과 구분 필요. .min.js 4종은 와이어도 사용도 안 됨(목적 불명). 보수적으로 즉시 DELETE 대신 와이어 경로 확인 후 정리.
- **근거**: 인벤토리 orphaned-hooks 10종 + hook-minified-duplicates 4종. postToolOrchestrator.js 헤더가 autoFormatter/buildChecker/scss/geminiAutoTrigger/observe/outputSecretFilter 통합 명시 — 일부는 orchestrator 경유라 진짜 dead 아님.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 중간
- **신뢰도**: 중간
- **/harness-diet 자동 처리 가능**: 아니오 ❌ (사람 승인)
- **실행 메모**: orchestrator 경유 호출 여부를 확인해 진짜 dead(.min.js 4종, backupGc/observationsRoller/agentStateManager 미참조분)만 정리; orchestrator 의존분은 유지. hook이라 사람 승인.
- **🔴 Adversarial 반박**: ⚠️ 하향(downgrade) → 대안 `KEEP` · 사람승인필요
  - 반박근거: All 9 listed hook files are live hub-delegated dependencies (require/execSync from the wired postToolOrchestrator.js, stopEvent.js, ethicalValidator.js, permissionGate.js) — verified at file:line. The 'orphan' classification is a scanner artifact that only inspected direct settings.json wiring and missed sub-hook delegation; these are KEEP, not SHRINK, because removing them deletes active safety hooks. The only genuinely unwired items are the 4 .min.js, but they are git-recoverable and CHANGELOG-documented as candidate performance drop-in replacements (one corrupted) — i.e. an unfinished human use-vs-remove optimization decision, not an automatable cleanup. With harness_diet_auto=false and the SHRINK premise factually wrong for 9 of the items, the conservative correct move is KEEP, with the min.js use-or-remove call deferred to explicit human review.

> 기준: 위험도 `높음` **또는** Adversarial이 `downgrade`/`reject` **또는** `human_approval_required=true`. 권한/hook/MCP/보안 항목은 정의상 모두 여기에 포함됩니다.

---

## 8. /harness-diet로 넘겨도 되는 low-risk 변경 목록

> 기준: `harness_diet_auto=true` **그리고** 위험도 `낮음` **그리고** Adversarial `uphold`(반박 통과). 아래만 자동 처리 후보이며, 그 외 전부는 사람 검토 대상입니다.

| ID | 경로 | 조치 | 실행 메모 |
|----|------|------|-----------|
| P23 | `.claude/skills/kiips-test-runner/SKILL.md` | SHRINK | dead stopEvent 자동실행 섹션 60줄 삭제, 실행 정본=test-runner/커버리지 리포트=test-cove… |

**상세:**

#### P23 · `.claude/skills/kiips-test-runner/SKILL.md`

- **현재 목적**: KiiPS JUnit 테스트 자동 실행+결과 분석(disable-model-invocation).
- **발견한 문제**: test-coverage 커맨드(JUnit+JaCoCo)와 'mvn test' 실행 커버리지 중복. 더 심각하게, SKILL.md 핵심 기능(stopEvent Hook 자동 테스트 실행)이 stopEvent.js v4.0에서 명시 제거됨 — 약 60줄이 더 이상 존재하지 않는 동작을 묘사하는 dead content('자동 테스트 실행율 100%'는 실제 0%).
- **근거**: stopEvent.js L9 '- runAutoTests (Stop 이벤트 Maven 자동 실행은 과도)' 제거. SKILL.md L39-53/102-139/158-163/179-203 dead 자동실행 코드. test-coverage 커맨드 JaCoCo 리포트와 mvn test 중복.
- **추천 조치**: `SHRINK`
- **변경 시 위험도**: 낮음
- **신뢰도**: 높음
- **/harness-diet 자동 처리 가능**: 예 ✅
- **실행 메모**: dead stopEvent 자동실행 섹션 60줄 삭제, 실행 정본=test-runner/커버리지 리포트=test-coverage로 mvn test 중복 정리.
- **🔴 Adversarial 반박**: ✅ 유지(uphold) → 대안 `SHRINK` · 사람승인필요
  - 반박근거: SHRINK 조치 자체 타당(확인된 dead content, low risk, 손실 안전망 없음, DELETE 아닌 SHRINK 로 수동실행 역할 보존). 단 harness_diet_auto:true 거부. (a) 동일 죽은 Hook 계약이 SKILL.md 외 skills-registry.json L1001-1007 trigger 블록과 kiips-orchestration L50 체인에도 존재 - SKILL.md 60줄만 자동삭제하면 레지스트리/오케스트레이션이 존재하지 않는 critical hook 검증을 계속 광고하는 불일치 발생. (b) 스킬 정본역할 재정의(실행 vs 커버리지 경계)는 사람 판단 필요. action 은 SHRINK 유지하되 범위를 3파일 동기화(SKILL.md dead 자동실행 60줄 정리 + registry trigger 의 hook/stopEvent 메타 갱신 + orchestration 체인 참조 점검)로 확장, 무비판적 /harness-diet 자동실행 금지.

---

## 9. /harness-diet 실행용 추천 프롬프트

> `/harness-diet`는 아직 존재하지 않는 후속 커맨드입니다. 아래는 그 도구(또는 수동 적용 세션)에 넣을 추천 프롬프트입니다. **low-risk 화이트리스트만** 자동 적용하고, 나머지는 건너뛰며 보고하도록 설계했습니다.

```text
harness-legacy-scan 리포트(.claude/docs/harness-legacy-scan-report.md)를 입력으로 받아
하네스 다이어트를 '제한적·증분적'으로 적용해줘.

적용 범위 (화이트리스트 — 이 ID만 자동 적용):
  P23

규칙:
1. 위 화이트리스트 ID의 조치만 적용한다. 그 외 항목은 절대 건드리지 말고 '보류'로 보고.
2. 권한(allowed-tools) / hook / MCP / 보안(settings.json, settings.local.json, .claude/mcp.json, .claude/hooks/**)은
   이번에도 절대 수정하지 않는다. 발견만 재확인.
3. 각 변경 전 대상 파일을 svn diff 가능한 상태로 백업하고, 변경 후 즉시 검증:
   - SKILL.md 분리(SPLIT) 시: 원본 description/frontmatter 보존, reference.md/examples.md 링크 추가, skills-registry 갱신.
   - rules 축소(SHRINK) 시: CLAUDE.md의 링크·표 무결성 확인.
4. 3개 파일 이상 변경 시 multiFileGate 규칙대로 변경 목록을 먼저 제시하고 승인을 받는다.
5. 한 번에 한 항목씩 적용→검증→다음. 회귀 발생 시 즉시 svn revert 후 보고.
6. 완료 후 '적용/보류/실패' 3열 요약표를 출력한다.

먼저 적용 계획(어떤 ID를 어떤 순서로)을 제시하고 내 승인을 기다려라.
```

**별도 사람 승인 트랙** (섹션 7, 자동 처리 금지): 아래는 가치가 크지만 위험하거나 외부 영향이 있어 반드시 대화형으로 하나씩 결정해야 합니다.

- **P12** `.claude/output-styles/efficient.md` — CONVERT (위험 낮음 · 반박:reject)
- **P14** `.claude/skills/checklist-generator/SKILL.md + .claude/agents/checklist-generator.md` — CONVERT (위험 낮음 · 반박:downgrade)
- **P26** `.claude/hooks/gemini-bridge.js + geminiAutoTrigger.js + geminiReviewGate.js + .claude/commands/gemini-scan.md + .claude/gemini-bridge/ + settings.json gemini allow 패턴` — DELETE (위험 중간 · 반박:downgrade)
- **P30** `.claude/settings.json (permissionRules block, L166-509 deny entries)` — CONVERT (위험 중간 · 반박:downgrade)
- **P37** `.claude/settings.json (permissionRules deny *.properties/.env) + inline python3 hook(L27) + permissionGate.js BLOCKED_PATHS` — CONVERT (위험 중간 · 반박:downgrade)
- **P47** `.claude/skills/kiips-db-inspector/SKILL.md` — CONVERT (위험 중간 · 반박:uphold)
- **P51** `.claude/skills/kiips-mybatis-guide/SKILL.md` — CONVERT (위험 중간 · 반박:uphold)
- **P1** `.claude/rules/power-stack.md` — MOVE (위험 낮음 · 반박:downgrade)
- **P2** `.claude/rules/ralph-loop-detection.md` — SHRINK (위험 낮음 · 반박:downgrade)
- **P3** `.claude/hooks/buildChecker.js` — KEEP (위험 높음)
- **P4** `.claude/rules/verification.md` — SHRINK (위험 중간 · 반박:downgrade)
- **P5** `.claude/rules/anti-rationalization.md` — SHRINK (위험 중간 · 반박:downgrade)

---

## 부록 A. 전체 63항목 요약표

| ID | 경로 | 조치 | 위험 | 신뢰 | auto | 반박 |
|----|------|------|------|------|------|------|
| P12 | `.claude/output-styles/efficient.md` | CONVERT | 낮음 | 높음 | ❌ | reject |
| P14 | `…LL.md + .claude/agents/checklist-generator.md` | CONVERT | 낮음 | 중간 | ✅ | downgrade |
| P30 | `…permissionRules block, L166-509 deny entries)` | CONVERT | 중간 | 중간 | ❌ | downgrade |
| P37 | `…3 hook(L27) + permissionGate.js BLOCKED_PATHS` | CONVERT | 중간 | 높음 | ❌ | downgrade |
| P47 | `.claude/skills/kiips-db-inspector/SKILL.md` | CONVERT | 중간 | 높음 | ❌ | uphold |
| P51 | `.claude/skills/kiips-mybatis-guide/SKILL.md` | CONVERT | 중간 | 높음 | ❌ | uphold |
| P26 | `…emini-bridge/ + settings.json gemini allow 패턴` | DELETE | 중간 | 높음 | ❌ | downgrade |
| P18 | `.claude/skills/kiips-quality/SKILL.md` | KEEP | 낮음 | 높음 | ❌ | — |
| P19 | `.claude/skills/kiips-page-harness/SKILL.md` | KEEP | 낮음 | 높음 | ❌ | — |
| P27 | `…de/commands/kiips-linked-approval-template.md` | KEEP | 낮음 | 높음 | ❌ | — |
| P29 | `.claude/commands/periodic-cleanup.md` | KEEP | 낮음 | 낮음 | ✅ | downgrade |
| P3 | `.claude/hooks/buildChecker.js` | KEEP | 높음 | 높음 | ❌ | — |
| P41 | `…ToolUse Bash|Edit|Write, settings.json L3-12)` | KEEP | 높음 | 높음 | ❌ | — |
| P42 | `…oolUse Bash|Edit|Write, settings.json L88-97)` | KEEP | 높음 | 높음 | ❌ | — |
| P43 | `…ssions.allow WebFetch domain entries, L37-44)` | KEEP | 낮음 | 높음 | ❌ | — |
| P62 | `…ude/skills/kiips-search-filter-guide/SKILL.md` | KEEP | 낮음 | 높음 | ❌ | — |
| P1 | `.claude/rules/power-stack.md` | MOVE | 낮음 | 높음 | ❌ | downgrade |
| P32 | `…yment.md, testing.md, jsp-spring-specific.md)` | MOVE | 낮음 | 중간 | ✅ | reject |
| P38 | `…(PreToolUse Edit|Write, settings.json L40-48)` | MOVE | 낮음 | 높음 | ❌ | downgrade |
| P39 | `…(PreToolUse Edit|Write, settings.json L67-75)` | MOVE | 낮음 | 높음 | ❌ | reject |
| P7 | `.claude/rules/dark-theme.md` | MOVE | 낮음 | 높음 | ❌ | downgrade |
| P8 | `.claude/rules/validation.md` | MOVE | 낮음 | 중간 | ❌ | downgrade |
| P9 | `.claude/rules/error-handling.md` | MOVE | 낮음 | 중간 | ❌ | downgrade |
| P10 | `.claude/rules/svn-workflow.md` | SHRINK | 낮음 | 중간 | ❌ | uphold |
| P11 | `CLAUDE.md` | SHRINK | 낮음 | 높음 | ❌ | downgrade |
| P13 | `…/SKILL.md + .claude/agents/code-simplifier.md` | SHRINK | 낮음 | 높음 | ✅ | downgrade |
| P15 | `.claude/commands/diagnose.md` | SHRINK | 낮음 | 중간 | ✅ | downgrade |
| P16 | `…ds/verify.md + .claude/agents/verify-agent.md` | SHRINK | 낮음 | 중간 | ✅ | downgrade |
| P2 | `.claude/rules/ralph-loop-detection.md` | SHRINK | 낮음 | 중간 | ❌ | downgrade |
| P21 | `.claude/agents/kiips-realgrid-generator.md` | SHRINK | 중간 | 중간 | ✅ | downgrade |
| P22 | `.claude/commands/deploy-with-tests.md` | SHRINK | 중간 | 중간 | ✅ | reject |
| P23 | `.claude/skills/kiips-test-runner/SKILL.md` | SHRINK | 낮음 | 높음 | ✅ | uphold |
| P24 | `.claude/agents/security-reviewer.md` | SHRINK | 높음 | 중간 | ❌ | downgrade |
| P28 | `…d/evolve.md/instinct-status.md/instinct-gc.md` | SHRINK | 중간 | 중간 | ✅ | downgrade |
| P34 | `…PromptSubmit.js (activateSkills 경로, L160-178)` | SHRINK | 중간 | 중간 | ❌ | downgrade |
| P35 | `…mcp.json (mcpServers.filesystem, args[2]=".")` | SHRINK | 낮음 | 중간 | ❌ | uphold |
| P36 | `…ash(python3:*), Bash(bash:*), Bash(claude:*))` | SHRINK | 높음 | 중간 | ❌ | uphold |
| P4 | `.claude/rules/verification.md` | SHRINK | 중간 | 높음 | ❌ | downgrade |
| P40 | `…6) vs postToolOrchestrator.js (execSync L166)` | SHRINK | 낮음 | 높음 | ❌ | uphold |
| P44 | `…ns.allow Bash(brew install:*), Bash(chmod:*))` | SHRINK | 낮음 | 중간 | ❌ | reject |
| P45 | `.claude/skills/kiips-backend/SKILL.md` | SHRINK | 중간 | 높음 | ❌ | uphold |
| P46 | `.claude/skills/kiips-build/SKILL.md` | SHRINK | 중간 | 높음 | ❌ | uphold |
| P48 | `…e-planner/SKILL.md (+ plan-template-kiips.md)` | SHRINK | 중간 | 높음 | ❌ | uphold |
| P5 | `.claude/rules/anti-rationalization.md` | SHRINK | 중간 | 높음 | ❌ | downgrade |
| P50 | `.claude/skills/kiips-logs/SKILL.md` | SHRINK | 중간 | 높음 | ❌ | uphold |
| P53 | `.claude/skills/kiips-orchestration/SKILL.md` | SHRINK | 낮음 | 중간 | ❌ | reject |
| P58 | `.claude/skills/kiips-stitch-bridge/SKILL.md` | SHRINK | 중간 | 높음 | ❌ | downgrade |
| P6 | `.claude/rules/editing.md` | SHRINK | 중간 | 중간 | ❌ | downgrade |
| P60 | `…ude/skills/legacy-compliance-checker/SKILL.md` | SHRINK | 낮음 | 높음 | ❌ | downgrade |
| P61 | `.claude/skills/kiips-regist-modal-guide/SKILL.md` | SHRINK | 낮음 | 높음 | ✅ | reject |
| P63 | `…kenizer.js, themeCssVerGuard.sh) + .min.js 4종` | SHRINK | 중간 | 중간 | ❌ | downgrade |
| P17 | `…de/skills/kiips-checklist-list-popup/SKILL.md` | SPLIT | 낮음 | 높음 | ❌ | — |
| P20 | `…/kiips-button-guide/SKILL.md (+ reference.md)` | SPLIT | 낮음 | 중간 | ❌ | — |
| P33 | `…sonl, instincts) + /learn /evolve /instinct-*` | SPLIT | 중간 | 중간 | ❌ | — |
| P49 | `…ude/skills/kiips-frontend-guidelines/SKILL.md` | SPLIT | 낮음 | 중간 | ❌ | — |
| P52 | `…ude/skills/kiips-operator-onboarding/SKILL.md` | SPLIT | 중간 | 높음 | ❌ | — |
| P54 | `.claude/skills/kiips-page-pattern-guide/SKILL.md` | SPLIT | 중간 | 높음 | ❌ | — |
| P55 | `.claude/skills/kiips-realgrid-guide/SKILL.md` | SPLIT | 중간 | 높음 | ❌ | — |
| P56 | `.claude/skills/kiips-scss/SKILL.md` | SPLIT | 중간 | 높음 | ❌ | — |
| P57 | `.claude/skills/kiips-security-guide/SKILL.md` | SPLIT | 낮음 | 중간 | ❌ | — |
| P59 | `…i-component-builder/SKILL.md (+ reference.md)` | SPLIT | 중간 | 높음 | ❌ | — |

## 부록 B. 방법론

- **7개 관점 에이전트**: Inventory · Global Context Tax · Skill Quality(스킬당 1, ×27) · Cross-Skill Overlap · Product Overlap · Safety&Permission · Refactor Planner · Adversarial Reviewer.
- **읽기 전용 2중 보장**: (1) `Explore`/`Plan` 에이전트 타입이 Edit/Write/NotebookEdit 도구를 제거, (2) 기존 `permissionRules` deny `rm`/`rm -rf`.
- **중복 탐지 보강**: 격리된 per-skill 에이전트는 스킬 간 중복을 원리적으로 못 보므로, 모든 description을 한 컨텍스트에서 비교하는 Cross-Skill Overlap 에이전트를 추가.
- **Product Overlap 근거 고정**: 추측 대신 현재 관측된 네이티브 기능(plan mode, TodoWrite, sandbox, native hooks/skills/permissions, /code-review 등)을 1차 증거로 사용.
- **Adversarial 게이트**: 모든 DELETE/SHRINK/MOVE/CONVERT 및 auto-flagged 항목을 독립 반박. 무비판적 자동 삭제를 차단.
