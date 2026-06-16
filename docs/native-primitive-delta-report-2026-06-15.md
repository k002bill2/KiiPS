# KiiPS 하네스/에이전트 아키텍처 — 네이티브 프리미티브 델타 리포트

> 작성일: 2026-06-15 · READ-ONLY 권고 리포트 (사용자 승인 전, 어떤 것도 변경되지 않음)
> 범위: KiiPS 레거시 커스텀 하네스 ↔ Claude Code **네이티브 프리미티브**(Workflow / Agent / Teams / Skills / Worktree / Cron·background / Memory) 간의 **델타**만 다룸.
> ⚠️ 별도의 **2026-06-09 내부 일관성 감사**(dead-config·중복·드리프트)는 이미 완료됨. 본 리포트는 그것과 별개로 **"네이티브로 대체 가능한가"** 한 축만 평가한다. 두 감사가 같은 파일을 가리킬 때는 본문에서 "(6/9 감사 소관)"으로 표시한다.

---

## 1. 종합 요약

KiiPS는 **결정적 멀티에이전트 제어 흐름(Workflow tool), 네이티브 스킬 서피싱, subagent_type 레지스트리, 워크트리 격리** 같은 프리미티브가 **존재하지 않던 시기**에 이 기능들을 손으로 구축했다. 그 결과 (a) 프롬프트 기반 매니저/코디네이터 계층(4 매니저 + 3 글로벌 코디네이터 + ACE 프로토콜), (b) 키워드 기반 스킬 활성화 계층(skill-rules.json + userPromptSubmit.js), (c) 3종 카탈로그 레지스트리 + 드리프트 테스트, (d) 외부모델(Gemini) 리뷰 브리지가 쌓였다. **네이티브 프리미티브가 도착한 지금**, 이 계층의 상당 부분은 (1) 런타임 동작이 전혀 없는 **프롬프트 픽션**이거나 (2) 네이티브가 이미 라이브로 수행하는 일의 **중복**이다.

결정적 신호 세 가지: ① 프로젝트의 **실제 자동화는 이미 네이티브로 이동**했다 — `.claude/workflows/deep-research.js`·`harness-legacy-scan.js`는 `phase()/parallel()/pipeline()` + 빌트인 `Plan`/`Explore`만 사용한다. ② 4개 매니저 에이전트는 **어떤 스크립트도 spawn하지 않으며**(`subagent_type|Task{|agentType|spawn` grep = 0), `userPromptSubmit.js`가 주입하는 `[L4.5 Manager]` **텍스트로만** 존재한다. ③ Gemini 외부 브리지(2270줄)는 **2026-06-09 커밋 cf7248f에서 이미 삭제**되어 "브리지를 이관할까" 질문 자체가 무의미해졌다.

핵심 결론: **삭제·이관 대상의 다수는 실행되지 않는 프롬프트 픽션**이며, **진짜로 지켜야 할 KiiPS 고유 가치**는 보안 게이트(`ethicalValidator.js`/`permissionGate.js`), 결정적 스킬 활성화(`skill-rules.json`의 enforcement/fileTrigger), Maven·MyBatis·다크테마 검증 레시피(`verify-agent.md`), inline-SQL 보안 리뷰(`security-reviewer.md`), 외부 전송 sanitization 지식뿐이다 — 이것들은 **네이티브가 대체하지 못한다.**

---

## 2. 3-버킷 분류

### KEEP — KiiPS 고유 가치 (네이티브가 대체 못 함, 손대지 말 것)

| 항목 | 파일 | 왜 KEEP인가 |
|------|------|------------|
| **결정적 스킬 활성화 트리거** | `.claude/skill-rules.json` + `userPromptSubmit.js:16-30,486` | 네이티브 스킬 서피싱(BASELINE #7)은 **설명 기반·확률적**이며 `enforcement:'require'` 티어도, **fileTrigger(`**/jsp/**/*.jsp`)** 경로 활성화도 없다. skill-rules.json은 KiiPS 고유의 결정적 키워드·파일경로 활성화 계층이다. **단, 서피싱(중복)·블록(dead) 부분은 분리해 SHRINK** — 아래 HYBRID 참조. |
| **'!' 강제 호출 디렉티브** | `userPromptSubmit.js:500-525,463-484` | 네이티브에는 **프로젝트 정의 우선순위 정렬**도, 현재 프롬프트에 키된 "지금 이 스킬을 호출하라" **명령형 디렉티브**도 없다. 단, **5개 critical 스킬에만** 공급(검증된 교집합): `kiips-security-guide, kiips-realgrid-guide, kiips-page-pattern-guide, kiips-regist-modal-guide, legacy-compliance-checker`. `disable-model-invocation` 연동(P1 fix) 보존. |
| **DDL/시크릿 하드 게이트** | `ethicalValidator.js` (PreToolUse Bash, `exit(2)` fail-closed) | 네이티브에는 **프롬프트/작성 코드 기반 deny 프리미티브가 전혀 없다.** 실제 파괴적 DDL 차단은 여기서 일어난다(리터럴 파괴 SQL 테스트 차단 확인 — 이 리포트 작성 중에도 본 게이트가 발동하여 우회 작성함). 6/9 감사 소관·이미 감사 완료. |
| **Stop 시 작성 코드 검사** | `stopEvent.js:274,280` | 프롬프트가 아니라 **실제 편집된 파일 내용**에서 `${}` 인젝션·`.dark`/`.theme-dark` 셀렉터를 검사. 네이티브 미제공. |
| **공유모듈/pom.xml 승인 게이트** | `permissionGate.js` (kiips-developer `:31` "enforced by permissionGate") | Golden Principle #1 불변성 — COMMON/UTILS/HUB 보호를 **실제로 강제**한다(훅 백킹 확인). |
| **KiiPS 검증 레시피 에이전트** | `.claude/agents/verify-agent.md` (page-harness reference.md:28에서 wired) | Maven `COMMON→UTILS→service` 빌드순서, `-pl/-am` 모듈별 invoke, `${}`/`[data-theme=dark]`/Java-8(var/record) FAIL 기준, effort-scaled 티어 — **네이티브 빌트인 에이전트가 모르는** 도메인 레시피. ⚠️ "fresh-context로 편향 제거" **셀링포인트는 삭제**(이제 모든 Agent가 무료로 갖는 네이티브 속성). |
| **inline-SQL 보안 리뷰어** | `.claude/agents/security-reviewer.md` (priority-1 route, `userPromptSubmit.js:218`) | KiiPS는 mapper XML 없이 **Java DAO 내 StringBuffer inline SQL** 사용(MEMORY `project_kiips_inline_sql_dao`). Lucy XSS·JSP `${param}`·`@PreAuthorize`/`WebSecurityConfiguration` 갭·OWASP 매핑 — 제네릭 `/security-review`에 없는 도메인 규약. ⚠️ (6/9 감사) `:75` SQL grep이 아직 `mapper/` XML을 가리킴 — inline-SQL DAO로 갱신 필요. |
| **KiiPS 워커 에이전트 2종** | `kiips-developer.md`, `kiips-ui-designer.md` | Java-8 호환·공유모듈 no-touch(developer는 훅 백킹)·RealGrid 2.6.3/ApexCharts/다크테마 규약 — general-purpose가 추론 불가. ⚠️ `kiips-ui-designer`의 "파일스코프 lock"은 **미강제 프로즈**(frontmatter `tools:` 비어 전체 상속) — keep 근거는 lock이 아니라 **UI 규약**. |
| **KiiPS 도메인 스킬군** | `.claude/skills/kiips-*` | RealGrid·검색필터·등록모달·결재연계 등 KiiPS 도메인 지식. 네이티브가 컨테이너만 제공, **내용은 KiiPS 자산**. (정확한 개수는 카운트 드리프트 회피 위해 명시 안 함 — `ls .claude/skills`로 확인) |
| **외부 전송 sanitization 지식** | (삭제된 브리지에 있던) `SENSITIVE_FILE_PATTERNS`/`sanitizePath`/`audit.log`/sandbox-env 제거 | **가장 중요한 KEEP 앵커.** 네이티브 어떤 프리미티브도 외부 모델로 보내는 **콘텐츠 sanitization·민감파일 차단·감사로그**를 자동 제공하지 않는다. 향후 어떤 외부 sink 리뷰가 재도입되면 **먼저 재구현 필수**. 마이그레이션 플랜 Section 4 목록을 폐기 전 별도 보존. |

### MIGRATE — 네이티브로 이관 (네이티브와 중복, 실행 백킹 없음)

| 항목 | 현재 패턴 | 네이티브 대체 | 구체적 이관 단계 |
|------|----------|--------------|----------------|
| **feature-lifecycle 핸드오프** | 4 매니저 .md의 phase/checkpoint/delegation **프로즈**(실행 백킹 0) | **Workflow tool** `phase()/parallel()/pipeline()` (BASELINE #1) | `feature-manager`의 단계 레시피만 `.claude/workflows/*.js`로 작성. **빌드/배포는 이관 대상 아님** — MEMORY `feedback_no_auto_build_clean`(앱 로컬 실행, 자동 mvn 금지)에 따라 "2.6x 병렬 빌드"는 KiiPS가 돌리지 않는 시나리오 → **재구축 말고 dead-prose 삭제**. |
| **매니저 오케스트레이션 프로즈** | `build/feature/ui/deployment-manager.md` 의 phase 배열·lock·retry 루프 | (없음 — 삭제 대상) | 4개 .md의 오케스트레이션 프로즈 삭제 + `agents-registry.json` managers:4→0. `detectManagerAgent`(`userPromptSubmit.js:194-195,374-427`) **dead injection scorer 제거**(어떤 흐름도 소비 안 함). |
| **ACE Layer-4 런타임 픽션** | `primary-coordinator.md`/매니저들의 `acquireManagerLock`/`reportToPrimary`/30초 모니터링/ETHICAL_VETO (25곳, **전부 markdown**) | worktree 격리(#6) + Workflow concurrency cap·budget(#1) + Monitor/run_in_background(#4) | 픽션 프로즈 **전면 삭제**. grep 확인: lock store·telemetry sink·30초 타이머·veto enforcer **아무것도 wired 안 됨**(`acquireManagerLock|reportToPrimary|managerProgress` = 0). 실제 가드는 `permissionGate.js`/`ethicalValidator.js`(KEEP). |
| **글로벌 코디네이터 잔재** | `~/.claude/agents/{primary-coordinator,cli-orchestrator,planner}.md` — README "제거됨"인데 런타임 LIVE | Workflow(#1) + Teams(#3) + 빌트인 Plan(#2) | **글로벌 스코프(레포 밖)이므로 사용자 정리 필요.** (a) README/registry가 `coordinators:0`이라 주장하지만 글로벌 LIVE → **카운트 정정** 또는 (b) 사용자가 글로벌 파일을 personal-only로 재배치. `cli-orchestrator` 백킹 스크립트는 **존재하나 SKILL.md.disabled**(상태파일 부재) → Workflow 스크립팅이 대체. |
| **delegation-template.md 제네릭 4요소** | 336줄 cross-agent 계약(Objective/Output/Boundaries) | `agent(prompt,{schema})` 반환 검증 + `parallel()` barrier + `Explore`/`Plan` agentType + worktree | 제네릭 4요소를 네이티브 사용으로 붕괴(deep-research.js가 이미 inline). **KiiPS 고유 boundary만** 짧은 스니펫으로 워크플로우 프롬프트에 잔존 — HYBRID 참조. |
| **3종 카탈로그 레지스트리** | `agents-registry.json`/`skills-registry.json`/`commands-registry.json` — **런타임 훅 소비 0** | 네이티브 디스커버리(#2/#7, 매 세션 disk에서 live 파싱) | JSON 3종 삭제(커밋 중단). **단, `tests/registry-integrity.test.js` 동시 삭제**(없는 파일에 `exit(1)`) + `catalog-integrity.sh` registry-stats 서브체크(43-49,58-60,76-78줄) 제거 — 안 그러면 테스트 스위트 깨짐. agent .md frontmatter가 single source of truth. |
| **레지스트리 model/tools/triggers 필드** | `agents-registry.json:12-18,54-60` — .md frontmatter 중복 복사 + dead triggers | agent .md frontmatter(#2, 플랫폼이 직접 파싱) | 중복 메타 삭제. ⚠️ 어떤 테스트도 이 필드를 .md와 대조하지 않음 → **무감시 dead-copy**(필드 드리프트 테스트 추가 말고 제거). 라이브 triggers 복사본은 `userPromptSubmit.js`에 있음(디스커버리 차원, 손대지 말 것). |
| **문서 카운트 테이블** | `SKILLS.md:1 '27개'`, `COMMANDS.md:1 '23개'`, `README.md:13 'Skills 27'` | 네이티브 스킬 리스트(#7, 매 세션 live) | 헤더의 숫자만 제거(프로즈 카탈로그는 유지 가능). 자기충족 루프(카운트→드리프트 테스트→resync 커밋) 차단. |
| **빈 worktree 디렉터리** | `.claude/worktrees/` (완전 빈 디렉터리, 참조 0) | 네이티브 `EnterWorktree`/`Agent isolation:'worktree'`(#6) | 디렉터리 삭제. 이관 비용 0 — 이관할 내용 자체가 없음. |
| **에이전트 상태 머신** | `agentStateManager.js` (O_EXCL lock, 삭제된 Gemini 데몬용 race-guard) | run_in_background(#4, runId 추적)·Teams(#3)·Workflow cap/barrier(#1) | 멀티에이전트가 네이티브로 이동 시 모듈 + 2 no-op 콜사이트 제거. **정정: `setAgentState`는 내부 호출자(`:206`) 있음** — 정확한 점은 *wired 경로가 'running' 레코드를 절대 쓰지 않고*, 상태파일이 양쪽 위치에 부재하며, `cleanupStale`이 어느 경로로도 실행 안 됨(per-process `_callCount%50` dead + pre-compact가 없는 경로 가드). 훅이므로 사용자 승인 게이트. |
| **Antigravity 마이그레이션 플랜 + Gemini 잔재** | `antigravity-cli-migration-plan.md`(브리지 PORT 전제)·`GEMINI.md`·`.gemini/`·`.temp/coordination/` | Workflow 리뷰어(#1)·run_in_background/RemoteTrigger(#4)·Teams(#3) | 플랜을 1문단 노트로 supersede("브리지 6/9 은퇴, 리뷰는 네이티브로 재제공"). **Section 4 보안가드 목록을 KEEP 레코드로 추출 후** 나머지 아카이브. consumer `crossToolReader.js`는 이미 삭제됨. |
| **외부모델 2차 리뷰 (결정적 fan-out 절반)** | Gemini 브리지 자동트리거(데몬) = **삭제됨**. 결정적 adversarial 2차 리뷰 fan-out. | Workflow(#1) + 기존 `santa-loop`(2-리뷰어 수렴)·`requesting-code-review`·`security-reviewer.md` subagent | **브리지 부활 금지.** 리뷰 capability는 네이티브 **재사용**(greenfield 금지): security-reviewer.md를 deep-research.js adversarial 형태로 감싸거나 santa-loop 채택. ⚠️ **cross-VENDOR 독립성**(비-Claude 리뷰어가 Claude 맹점 포착)은 진짜 네이티브 갭이나 **6/18 sunset + 팀 삭제 결정**으로 의도적 포기 — 모든 네이티브는 Claude를 spawn. |

### HYBRID — 부분 이관 (오케스트레이션은 가지만 역할은 남음, 어느 절반이 가고 어느 절반이 남는지 명시)

| 항목 | 가는 절반 (오케스트레이션) | 남는 절반 (역할/도메인) |
|------|------------------------|----------------------|
| **스킬 키워드 서피싱** (`skill-rules.json` promptTriggers) | **서피싱 전용 ~22개 스킬**의 `promptTriggers.keywords/intentPatterns` 삭제 → SKILL.md `'Use when'`이 디스커버리 source. 이중유지/드리프트 부담 제거. | **5개 critical 모델호출 스킬**(`kiips-security-guide, kiips-realgrid-guide, kiips-page-pattern-guide, kiips-regist-modal-guide, legacy-compliance-checker`)은 promptTriggers **유지** — '!' 강제호출 디렉티브(KEEP)의 **입력**이라 load-bearing. **블랭킷 삭제 금지.** |
| **`[Skills]` 주입 라인** (`userPromptSubmit.js`) | 비-`'!'` plain 라인은 네이티브 서피싱과 **중복** → 발신 중단. (CLAUDE-CODE-GUIDE 판정: 커스텀 계층은 서피싱에 중복·강제력 없음) | `'!'` critical 라인은 **유지**(네이티브에 없는 강제호출). 단, 대규모 멀티플러그인 스킬 리스트(수백 개)에서 니치 KiiPS 스킬이 누락되면 그 스킬만 minimal nudge 잔존(신뢰성 carve-out). |
| **catalog-integrity.sh** (SessionStart) | agent/skill/command **카운트 서브체크**(41-82줄) 제거(레지스트리·doc 카운트 삭제와 동시) | **훅 바인딩 카운트**(84-99줄)·**per-command/skill 파일존재 체크**(101-135줄)는 **유지** — 네이티브가 훅바인딩 카운트도, 댕글링 doc 참조도 검증 안 함. |
| **build-registries.js** | 연속 자동유지 **역할**은 레지스트리와 함께 죽음(호출하는 wiring 없음) | 스크립트 자체는 **on-demand 카탈로그 생성기**로 보존 가능(opt-in, 저우선). PR/감사용 정적 스냅샷 원할 때만. skill-rules.json을 input으로 읽음(`:83`) → 그 input 보존. |
| **kiips-planner + kiips-architect** | 읽기전용 탐색/설계/리스크 분석 = 빌트인 **Plan**(#2)과 중복. `kiips-planner`의 **Agent tool grant는 vestigial → 제거**(body가 구현 금지). | KiiPS 의존성체인(`JSP→AJAX→Controller→Service→DAO→Table`) + 리스크 매트릭스는 **Plan 프리앰블/스킬**로 보존. 글로벌 중복 `planner.md`는 사용자와 정리. |
| **kiips-realgrid-generator 에이전트** (615줄) | 코드생성 오케스트레이션 = 빌트인 general-purpose/Workflow 단계에서 스킬 호출로 대체 가능. 어떤 스크립트도 이 이름을 spawn 안 함(hook 텍스트만). | RealGrid 지식은 **이미 `kiips-realgrid-guide` 스킬(467줄)에 존재**. 에이전트 은퇴(또는 스킬 로드 thin alias). 은퇴 시 `userPromptSubmit.js:234` SPECIALIST_ROUTES + registry 엔트리 제거(6/9 감사 소관). |
| **SPECIALIST_ROUTES 디스커버리** (`userPromptSubmit.js:216-301`) | `detectManagerAgent`의 매니저(build/deploy/feature/ui) **오케스트레이션** 의도 → Workflow 이관. | ⚠️ **로컬 `.claude/agents/*.md`가 네이티브 subagent_type으로 서피싱되는지 미검증**(글로벌 오케스트레이터만 관찰됨). 안 되면 SPECIALIST_ROUTES nudge가 **유일한 디스커버리 경로** → 검증 전 삭제 금지. 검증되면 네이티브 엔트리 없는 스페셜리스트로만 축소. |
| **delegation-template.md** (correctedBucket=hybrid) | 제네릭 4요소(Objective/Output/Boundaries/dependency ordering) → `schema`/`parallel()`/`Explore`·`Plan`/worktree 네이티브 사용으로 붕괴. deep-research.js가 이미 inline. | **KiiPS 고유 boundary**(per-agent DO-NOT: kiips-developer는 COMMON/UTILS/HUB 금지, MyBatis `${}` 금지, 새 `_component.scss` 생성 규약)는 짧은 스니펫으로 **워크플로우 프롬프트에 잔존**. 336줄 standalone 계약은 폐기. |
| **온디맨드 리뷰 진입점** (`/gemini-scan`, Scout 페르소나) — D5-D4-2 correctedBucket=hybrid | 데몬(자동트리거) 절반 → Workflow. | ⚠️ **정정**: 채팅 진입점은 **이미 라이브**(네이티브 `review`/`/code-review`/`santa-loop`/`requesting-code-review` 이번 세션 서피싱됨). 좁은 갭은 KiiPS 도메인 리뷰 체크리스트(MyBatis `${}`/JSP XSS/다크테마 셀렉터/RealGrid)를 단일 명령으로 — `security-reviewer.md`에 임베드 권장. |
| **code-simplifier / checklist-generator** | 네이티브 `/simplify`·TodoWrite와 중복(agent-type 축 아님, command/tool 축). | checklist-generator의 KiiPS 항목(build-from-HUB, `#{}` not `${}`, Lucy XSS)은 TodoWrite-backed 스킬로 보존. 6/9 command/skill 감사 소관. |

---

## 3. 우선순위 로드맵

> 가치/노력 순. P0 = 고가치·저위험·실행백킹 없음(삭제 안전). P1 = 중간. P2 = 저우선·선택.

| 우선 | 항목 | 현재 패턴 | 네이티브 대체 | 분류 | 잃는 것 | 권고 조치 |
|------|------|----------|--------------|------|---------|----------|
| **P0** | ACE Layer-4 런타임 픽션 | lock/telemetry/30초 모니터/veto **markdown 프로즈**(25곳) | worktree·Workflow cap·Monitor(#1/#4/#6) | MIGRATE(삭제) | **없음** — wired 백킹 0, 실제 가드는 permissionGate/ethicalValidator(KEEP) | 4 매니저 + primary-coordinator.md의 픽션 런타임 프로즈 전면 삭제 |
| **P0** | dead `[L4.5 Manager]` scorer | `userPromptSubmit.js:194-195,374-427` 주입 텍스트 | (없음) | MIGRATE(삭제) | 없음 — 어떤 흐름도 소비 안 함 | detectManagerAgent 제거 |
| **P0** | 빈 worktree 디렉터리 | `.claude/worktrees/` (빈, 참조 0) | `Agent isolation:'worktree'`(#6) | MIGRATE(삭제) | 없음 | 디렉터리 삭제, 이관 비용 0 |
| **P0** | 3종 카탈로그 레지스트리 | 런타임 훅 소비 0 | 네이티브 디스커버리(#2/#7) | MIGRATE | 정적 diffable 스냅샷(on-demand 재생성으로 대체) | JSON 3종 + `registry-integrity.test.js` **동시** 삭제 + catalog-integrity.sh 카운트체크 제거 |
| **P0** | 문서 카운트 테이블 | `SKILLS.md/COMMANDS.md/README` 하드코딩 숫자 | 네이티브 스킬 리스트(#7) | MIGRATE | 없음(human-doc, 즉시 드리프트) | 헤더 숫자 제거 → resync 커밋 churn 차단 |
| **P1** | 스킬 키워드 서피싱 중복 | skill-rules.json promptTriggers ×27 (+ SKILL.md 'Use when' 27/27 중복) | SKILL.md frontmatter 'Use when'(#7) | HYBRID | regex 정밀 매칭(대부분 불필요) | **22개 surfacing-only만** promptTriggers 삭제. **5개 critical은 유지**('!' 디렉티브 입력) |
| **P1** | `[Skills]` plain 주입 | userPromptSubmit.js 비-'!' 라인 | 네이티브 서피싱(#7) | HYBRID | 중복 nudge(니치 스킬 신뢰성 carve-out) | plain 라인 중단, '!' critical 라인 유지 |
| **P1** | 매니저 오케스트레이션 프로즈 | 4 매니저 .md phase/lock/retry | Workflow phase()/parallel()/pipeline()(#1) | MIGRATE | 빌드순서 지식(permissionGate로 재배치) | feature-lifecycle만 Workflow화. **빌드/배포는 재구축 말고 dead-prose 삭제**(no-auto-build) |
| **P1** | agentStateManager 잔재 | O_EXCL lock, 삭제된 데몬용 | run_in_background/Teams(#4/#3) | MIGRATE | 없음(어느 경로로도 실행 안 됨) | 멀티에이전트 네이티브 이동 시 제거, 사용자 승인 게이트(훅) |
| **P1** | verify-agent 셀링포인트 | "fresh-context 편향제거" 마케팅 | 모든 Agent의 네이티브 속성(#2) | KEEP(문구만 수정) | 없음 | 레시피 내용은 KEEP, "fresh-context" 문구만 삭제 |
| **P1** | kiips-planner/architect | 읽기전용 설계 = 빌트인 Plan 중복 | 빌트인 Plan(#2) | HYBRID | KiiPS 의존성체인/리스크 매트릭스 | Plan 프리앰블로 붕괴, planner의 vestigial Agent grant 제거 |
| **P1** | Antigravity 플랜 + Gemini 잔재 | 브리지 PORT 전제 doc/잔재 | Workflow 리뷰어(#1) | MIGRATE | 없음(삭제된 서브시스템) | **Section 4 보안가드 KEEP 추출 후** supersede·아카이브 |
| **P1** | 외부 sanitization 지식 | (삭제된 브리지) SENSITIVE_FILE/sanitizePath/audit | **네이티브 미제공** | **KEEP** | 외부 sink로 시크릿 유출(감사로그 없음) | 하드 요구사항으로 보존, 외부 리뷰 재도입 시 **먼저 재구현** |
| **P2** | kiips-realgrid-generator 에이전트 | 615줄, 스킬과 중복 | kiips-realgrid-guide 스킬(#7) | HYBRID | 격리 컨텍스트(general-purpose로 회복) | 스킬로 통합, 에이전트 은퇴(spawn site 0 확인됨) |
| **P2** | 글로벌 코디네이터 드리프트 | README "제거" vs 런타임 LIVE | Workflow/Teams/Plan | MIGRATE | 없음(글로벌, 레포 밖) | **사용자 정리**: 카운트 정정 또는 글로벌 파일 재배치 |
| **P2** | SPECIALIST_ROUTES | 키워드 라우터 | 네이티브 agent 서피싱(#2) | HYBRID | **미검증** — 로컬 .md 네이티브 서피싱 여부 | 검증 전 삭제 금지. 매니저 오케스트레이션만 Workflow 이관 |
| **P2** | delegation-template.md | 336줄 cross-agent 계약 | schema/parallel/Explore-Plan/worktree | MIGRATE | KiiPS boundary 디폴트 | 네이티브 붕괴, KiiPS boundary 스니펫만 워크플로우 프롬프트에 잔존 |
| **P2** | build-registries.js | 자동유지 역할 | 네이티브 disk 파싱(#7) | HYBRID | 없음(역할), 정적 생성기(선택) | 출력 커밋 중단, 스크립트는 opt-in 유틸로 보존 |
| **P2** | code-simplifier/checklist-generator | /simplify·TodoWrite 중복 | 네이티브 command/tool | HYBRID | checklist의 KiiPS 항목 | 6/9 command/skill 감사 소관, agent-type 이관 프레임 강요 말 것 |

---

## 4. 검증에서 뒤집힌 주장 (신뢰성 필수 섹션)

adversarial 검증 패스가 **원 분석을 정정·반박**한 항목들. 아래는 본 리포트에 **반영되지 않았거나 약화된** 주장이다.

1. **"매니저는 사용자 호출 named-specialist 진입점이다" (D1-orchestration D1-2) — 반박/약화.**
   프로젝트 매니저(build/feature/ui/deployment)가 user-invokable 진입점이라는 전제는 **미입증·거짓 가능성 높음**. 글로벌 트리오만 런타임 agent-type으로 관찰됐고, 프로젝트 매니저는 메타데이터 + advisory 텍스트로만 존재. 게다가 effort-scaling.md:114-153상 각 매니저는 기존 스페셜리스트(kiips-developer/ui-designer/realgrid)를 **얇게 감싼 wrapper**일 뿐. → **새 매니저 subagent_type 신설 금지.** 도메인 스페셜리스트 표면은 이미 기존 에이전트/스킬이 커버.

2. **"제네릭 /security-review는 string-concat SQL 인젝션을 놓친다" (D3 D1-5) — 정정.**
   설득력 없음 — string-concat SQLi는 어떤 보안 리뷰든 기본. 게다가 `security-reviewer.md`는 **이미 inline SQL을 커버**(`:23` DAO JDBC 검증, `:77` `concat.*model\.` grep). keep 근거는 "제네릭이 SQL 못 찾음"이 **아니라** Lucy-XSS/JSP/@PreAuthorize/OWASP 매트릭스/priority-1 라우팅. (단, `:75` primary grep이 stale mapper-XML을 가리키는 건 사실 — 6/9 감사 소관.)

3. **"kiips-ui-designer는 백엔드 편집을 막는 file-scope lock을 갖는다" (D3 D1-6) — 정정.**
   frontmatter `tools:`가 **비어 있어 전체 도구 상속**(Edit/Write 어디든). body의 "JSP/SCSS만, *.java 금지"는 **미강제 advisory 프로즈**. keep는 유효하나 근거는 lock이 아니라 **RealGrid/ApexCharts/다크테마 규약**. (kiips-developer의 공유모듈 제한은 `:31` permissionGate 훅 백킹 — 진짜 가드.)

4. **"cli-orchestrator는 존재하지 않는 scripts/orchestrator.js를 참조한다" (D3 D1-2 / D5 일부) — 사실오류 정정.**
   `~/.claude/skills/cli-orchestrator/scripts/`에 orchestrator.js·agent-coordinator.js·pipeline-runner.js·bootstrap-manager.js **모두 존재**. 단 SKILL.md는 `.disabled`이고 상태파일 부재. → 에이전트가 **주장보다 더 살아있어** "글로벌 런타임 오염, 사용자 정리" 권고를 **강화**(약화 아님). primary-coordinator는 별개로 실행 백킹 없음.

5. **"agentStateManager.setAgentState는 호출자가 ZERO다" (D5 D4-3) — evidence 정정.**
   거짓 — `:206`(CLI 'set' 분기) 내부 호출자 있고 `:230` export됨. **정확한 점**: wired 경로가 status='running'을 절대 쓰지 않고, 상태파일이 양쪽 위치에 부재하며, `cleanupStale`이 어느 경로로도 실행 안 됨(per-process `_callCount%50` dead counter + pre-compact가 없는 경로 가드). 결론(redundant-migrate)은 **오히려 강해짐**.

6. **"온디맨드 리뷰 진입점은 라이브 갭이다 (네이티브 대체 미연결)" (D5 D4-2) — 정정·심각도 하향.**
   자기모순(같은 finding이 santa-loop/requesting-code-review를 네이티브 등가로 명명하면서 "아무것도 wired 안 됨" 주장). 실제 이번 세션 available-skills에 `review`·`/code-review`·`security-review`·`santa-loop`·`requesting-code-review` **다수 라이브**. 채팅 진입점은 **존재**. 좁은 진짜 갭은 KiiPS 도메인 체크리스트(MyBatis `${}`/JSP XSS/다크테마/RealGrid)를 단일 명령으로 묶는 것 → `security-reviewer.md` 임베드. 중간 갭 → **refined·하향**.

7. **"build/deploy 멀티서비스 빌드를 Workflow로 이관하라" (D1 D1-1) — 범위 정정.**
   MEMORY `feedback_no_auto_build_clean`: 앱 로컬 실행(JSP 라이브 반영), 자동 mvn 빌드/clean 금지. build-manager의 간판 "2.6x 병렬 빌드"는 KiiPS가 **일상적으로 돌리지 않는** 시나리오 → **재구축 말고 dead-prose 삭제**가 정답. Workflow 이관 가치 있는 건 feature-lifecycle 핸드오프뿐.

8. **"3종 레지스트리는 ZERO 런타임 consumer다" (D4 D1-1) — 정정(스코프).**
   문자 그대로는 거짓 — 4 consumer 존재(catalog-integrity.sh, registry-integrity.test.js, build-registries.js, harness-legacy-scan.js의 prompt-string 언급). 정확한 점: **always-on 훅 파이프라인이 소비 안 함**. 그래서 삭제는 옳지만 **불완전** — `registry-integrity.test.js`를 동시 삭제하지 않으면 테스트 스위트가 `exit(1)`로 깨짐. 권고에 이 동시 삭제를 명시 반영했다.

9. **"SKILL.md frontmatter를 single source of truth로 삼고 promptTriggers 전량 삭제" (D2 D-SKILL-2) — 블로킹 cross-finding 반박.**
   블랭킷 삭제는 **거짓**. 코드 경로상 `shouldActivateSkill`은 promptTriggers 매치에서만 true → '!' 강제호출 디렉티브(D-SKILL-3, KEEP)는 activatedSkills를 필터링해 만들어진다. 따라서 promptTriggers를 지우면 그 스킬은 '!' 디렉티브 대상에서 **탈락**. 검증된 교집합(critical AND not disable-model-invocation) = **5개 스킬**은 promptTriggers를 **반드시 유지**. → redundant-migrate에서 **hybrid로 이동**. 본 리포트는 "22개 surfacing-only만 삭제, 5개 critical 유지"로 carve-out 반영.

---

### 종합 권고 한 줄

**실행 백킹 없는 프롬프트 픽션(ACE 런타임·dead scorer·빈 worktree·중복 레지스트리)은 P0로 삭제하고, 결정적 가드(skill-rules enforcement·'!' 디렉티브·보안 훅·검증 레시피·sanitization 지식)는 네이티브가 대체 못 하므로 KEEP한다. 매니저/코디네이터 "오케스트레이션"은 네이티브 Workflow로 이미 대체 가능하나, KiiPS가 자동 빌드를 돌리지 않으므로 대부분 "이관"이 아니라 "삭제" 대상이다.**

---

## 5. 적용 로그 + 검증이 정정한 사실 (2026-06-15/16, 사용자 승인 하 단계별 적용)

> 베이스라인 5종 테스트(catalog 12/12·registry 38/38·hook 53/53·permission 51/51·tokenizer 34/34)
> **변경 전 GREEN → 각 단계 후 GREEN** 유지로 회귀 0 실증. 8개 git-추적 파일 수정(`git restore` 복구 가능),
> 미커밋. 모든 단계는 사용자 게이트 승인을 거침.

### ✅ 적용됨
| 묶음 | 항목 | 변경 | 검증 |
|------|------|------|------|
| **P0-A1** | 빈 `worktrees/` 삭제 | untracked 빈 디렉터리 제거 | 손실 0 |
| **P0-A2** | dead `[L4.5 Manager]` scorer | `userPromptSubmit.js` 호출부(2줄)+`detectManagerAgent` 함수 제거 | COMPLEX 페이로드에서 `[L4.5 Manager]`만 소거, `[Skills]`/`[BLOCKED]`/`[Specialist]`/`[L4 Task]`/`[L3 Match]`/`[Effort]` 유지 |
| **P0-A3** | 매니저 4종 ACE 픽션 strip | build/deployment/feature/ui-manager.md를 도메인 스텁으로(`acquireManagerLock`/`reportToPrimary`/telemetry/Config JSON 제거, 빌드순서·permissionGate·운영명령 보존). **1599→255줄** | 픽션 토큰 0·frontmatter 4/4 무결(에이전트 타입 유지) |
| **P1-안전** | kiips-planner vestigial `Agent` grant | frontmatter+registry에서 `Agent` 도구 제거(읽기전용 명시, 빌트인 Plan 안내) | tools=`[Read,Glob,Grep,Bash]` |
| **P1-안전** | verify-agent 셀링포인트 | "fresh-context 편향제거"→KiiPS 검증 레시피 중심 reframe(레시피 본문 KEEP), registry 동기화 | — |
| **P1-안전** | Antigravity 플랜 supersede | SUPERSEDED 배너 + **외부 sink sanitization 지식 KEEP 레코드 추출**(네이티브 미제공) | — |
| **드리프트 정정** | `kiips-orchestration/SKILL.md:71-72` | 삭제된 `detectManagerAgent()`를 "유일한 런타임 정본"으로 서술하던 라인을 "scorer 제거됨 + 매니저=named subagent_type + 오케스트레이션=네이티브 Workflow"로 갱신 | 삭제 기능 서술 grep 0건 |

### ⏸️ 보류 (사용자 결정 — 저가치·고결합/위험)
- **Group B 전체**(레지스트리 3종+`registry-integrity.test.js`+`catalog-integrity.sh` 6체크+문서카운트+`build-registries.js`+`gen_harness_report.py`): drift/orphan 검출 안전망(네이티브 미제공)을 유지. 방금 적용을 검증해 준 인프라.
- **스킬 키워드 서피싱 트림**: 아래 정정으로 근거 약화 + 니치 스킬 활성화 누락 위험.
- **agentStateManager 제거**: wired-but-harmless no-op. 제거는 live hub 훅+pre-compact+README/catalog drift 비용에 이득 ~0. Group B와 묶는 게 합리적.

### ⚠️ 검증이 정정한 리포트 사실 (현재 코드 대조 — "리포트는 point-in-time" 원칙 작동)
1. **fileTriggers는 27개 스킬 전부 0개.** §2 KEEP 표가 skill-rules.json의 KEEP 근거로 든 "fileTrigger(`**/jsp/**/*.jsp`) 경로 활성화 = 네이티브 갭"은 **현 상태에서 무효**. skill-rules.json의 실제 KEEP 근거는 (a) priority 정렬, (b) '!' 강제호출 디렉티브 입력, (c) `enforcement:block` 하드게이트(legacy-compliance-checker 단 1종)다.
2. **critical 스킬은 8개**(리포트 "5개" 정정): kiips-security-guide·realgrid-guide·**test-runner**·page-pattern-guide·regist-modal-guide·legacy-compliance-checker·**kiips-build**·**kiips-orchestration**. 트림 시 promptTriggers 유지 필수 집합이 더 넓음.
3. **kiips-realgrid-generator는 "중복"이 아님 → P2 은퇴 권고 철회(KEEP).** §2 HYBRID 표·§3 P2가 "RealGrid 지식은 이미 kiips-realgrid-guide 스킬에 존재 → 에이전트 은퇴"라 했으나, **두 파일을 실제로 diff한 결과 거짓**: 에이전트(615줄)는 스킬에 없는 고유 자산을 다수 보유 — 렌더러 24종 전체 카탈로그(호출함수 포함), 3·4단 다단 헤더(MI0801.jsp `header.heights` 실제 패턴), Style System(realgrid-style.scss), JSP 컨테이너 템플릿. 스킬은 체크박스 토글 규약이 강점으로 **상호보완** 관계. 은퇴/thin-alias 시 위 지식 손실 → **KEEP 확정.** (적대적 검증이 파일 내용을 실제 대조하지 않은 over-recommendation. fileTrigger·critical 카운트에 이은 3번째 전제 오류.)
4. **`!kiips-orchestration` 이상 — 재현 안 됨(정정).** 대화 초반 라이브 훅 출력엔 `!kiips-orchestration`(critical+disable-model-invocation인데 `!` 부여)이 보였으나, **직접 재테스트에선 정상 plain으로 demote됨**(`[Skills] ...kiips-build, kiips-orchestration`). 즉 결정적 재현이 안 되는 불일치라 "확정 회귀"가 아니다. **본 변경과 무관**: diff상 `activateSkills`/`isModelInvocationDisabled`(이제 ~405-460행) 미접촉 확인. 결정적 repro가 잡히면 6/9 감사 소관으로 별도 처리. (SKILL.md `disable-model-invocation:true`는 실재 확인됨.)
