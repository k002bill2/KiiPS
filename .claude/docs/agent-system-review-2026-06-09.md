# KiiPS `.claude` 에이전트 시스템 종합 검토 리포트

> 작성: 2026-06-09 · 방식: ultracode 멀티에이전트 워크플로우 (15 에이전트, 5차원 fan-out + orphan 적대적 검증 + 종합)
> **읽기 전용 감사 — 어떤 파일도 수정하지 않음. 모든 권고는 사용자 승인 대상.**
> **증거 등급**: P0 보안 2건(permissionRules inert + 백스톱 부재, 인라인 python fail-open)은 메인 세션에서 독립 재현. 나머지 HIGH 4건(skill-rules dead config, 미존재 orchestration 스킬 4종, 미배선 스킬 3종, disable-model-invocation 모순)은 서브에이전트의 구조적 사실 검증(파일 부재/grep). 후자는 최악의 경우가 '불필요한 사용자 확인'이라 재현 미수행.

## 종합 요약(Executive Summary)

KiiPS `.claude` 에이전트 시스템은 **하부 정합성은 견고하나 상부 배선(wiring)과 문서 동기화에 구조적 결함이 누적된** 상태다. 읽기 전용 감사 결과, 3개 레지스트리(agents 13 / skills 27 / commands 24)는 디스크와 양방향 완전 정합(dangling 0, orphan 0)이고, 7개 이벤트 훅 와이어링과 postToolOrchestrator의 6개 sub-hook export 계약이 모두 실파일·실export에 도달하며, 진짜 보안 경계(ethicalValidator·permissionGate)는 모든 오류 입력에서 fail-CLOSED로 검증됐다. 그러나 (1) **보안층의 핵심 deny 규칙 33개가 비공식 키(`permissionRules`)로 작성돼 제품이 읽지 않아 inert**이고, (2) **인라인 python 시크릿 가드가 malformed 입력에서 fail-OPEN**이며, (3) 오케스트레이터 계층은 "설계는 풍부하나 배선은 끊긴" 상태(dead config·미존재 스킬 참조·모순 디렉티브), (4) 디스크 3개 스킬이 자동 트리거에 미배선, (5) 문서 카운트가 실측과 drift(README가 아직 26·31) 상태다. 시스템은 동작 중이나 "방어선이 있다고 믿는 곳에 실제로는 없는" 거짓 안심이 가장 큰 위험이다.

### 가장 중요한 발견 Top 5 (blast radius 순)

| # | 발견 | severity | 차원 | 분류 | 핵심 |
|---|------|----------|------|------|------|
| 1 | `permissionRules` 33개가 비공식 키라 제품 미독해 → **Read 축 시크릿 보호 사실상 0** | high | 보안 | FIX | `cat app-kiips.properties`·`Read app-*.properties` 무방비. 코드 소비처 0건으로 inert 확정 (메인세션 재현 ✅) |
| 2 | settings.json L27 인라인 python 시크릿 가드가 malformed/빈 stdin에서 **exit 1 fail-OPEN** | high | 보안 | FIX | 보안 차단 가드인데 try/except 부재 → 입력이 깨지면 차단 미실행 (메인세션 재현 ✅ exit 1) |
| 3 | SILENT GAP: 디스크 3개 스킬이 skill-rules.json 미등재 → **자동 트리거 구조적 불가** | high | 자동연동/orphan | WIRE | operator-onboarding/page-harness/stitch-bridge. 수동 호출만 가능(=미배선, dead 아님) |
| 4 | skill-rules의 managerAgent/orchestrationSkill 4건 + enforcement require/suggest 23건이 **dead config** | high | 오케스트레이터 | DECIDE | 매니저 라우팅은 훅 하드코딩으로 별개 수행, 레지스트리 선언이 런타임 미반영 |
| 5 | 4개 매니저가 선언한 'new orchestration skill' 4종이 **디스크에 전무** (pre-consolidation stale 문서) | high | 오케스트레이터 | DECIDE | feature/build/deployment/ui orchestration 스킬 모두 MISSING |

> 추가 high 1건(차원2): kiips-orchestration·kiips-feature-planner가 `disable-model-invocation:true`인데 activateSkills가 `!스킬명` 호출 디렉티브를 주입 → 호출 불가 스킬을 호출하라는 모순(WIRE).

---

## 수정 적용 현황 (2026-06-09, P0+P1 — probe 실증)

> 사용자 승인 하에 P0 전부 + P1 전부 적용. 모든 변경은 before/after probe로 검증. 읽기전용 감사 이후의 별도 수정 단계.

| 항목 | 조치 | 변경 파일 | 검증 |
|------|------|----------|------|
| **P0 #1** Read/Bash 축 시크릿 무방비 | permissionGate에 `SECRET_FILE_PATTERNS`/`SECRET_BASH_PATTERNS` + Read/Grep 분기 추가, settings.json matcher `+Read\|Grep` (커밋·전파되는 검증된 보호층) | `permissionGate.js`, `settings.json` | `cat/Read/Grep app-*.properties·.env` → exit 2, 정상 read 통과, AST 따옴표 필터 정상 ✅ |
| **P0 #2** 인라인 python fail-open | `try/except → sys.exit(2)` fail-closed + app-production 추가 | `settings.json` | malformed/빈 stdin → exit 2 (round-trip 실측) ✅ |
| **P1-4** disable-model-invocation 모순 | `isModelInvocationDisabled()` 필터 → 해당 스킬 `!`접두 제외 | `userPromptSubmit.js` | kiips-orchestration/feature-planner plain화, 대조군 security-guide `!` 유지 ✅ |
| **P1-3** 미배선 스킬 3종 (WIRE) | skill-rules.json에 promptTriggers 3종 등재(priority normal) | `skill-rules.json` | 3종 모두 자동 트리거 발동 확인 ✅ |
| **P1-2** 미존재 orchestration 스킬 4종 (SHRINK) | 매니저 4종의 가공 스킬 참조 8건 → 공유 `kiips-orchestration` 정합 | `{build,feature,deployment,ui}-manager.md` | 잔존 참조 0 ✅ |
| **P1-1** skill-rules dead config (정리+문서화) | managerAgent/orchestrationSkill/autoActivationLevel/delegationRules 제거 + 라우팅 정본 문서화 | `skill-rules.json`, `kiips-orchestration/SKILL.md` | dead 필드 0, JSON valid, catalog 새 drift 0 ✅ |
| **P2-1** drift/catalog/scss/중복 | README 카운트 정정(Skills 27·훅 27·바인딩 16) + catalog 사각지대 2축(README Skills·산문 훅) + scssValidator 이중실행 제거 + ui-manager 중복 | `README.md`, `tests/catalog-integrity.sh`, `settings.json`, `ui-manager.md` | catalog **ALL PASS 12/12** ✅ |
| **P2-2** mybatis priority | ref-only kiips-mybatis-guide critical→normal (`!` 노이즈 제거) | `skill-rules.json` | plain 제안 확인 ✅ |
| **P2-3** DQUOTE `$()` + 문서정합 | tokenizer v1.1.0 STATE stack(`$()` 코드 탐지) + ralph 문서 현실화 + effort-scaling 밴드 런타임 정합 | `shellContextTokenizer.js`, `ralph-loop-detection.md`, `anti-rationalization.md`, `kiips-orchestration/SKILL.md` | `echo "$(rm -rf)"` exit 0→**2**, tokenizer **34/34** ✅ |

**Read 축 보호 메커니즘 주의**: 검증된 보호는 **permissionGate 훅**(settings.json·커밋·전파, `cat`/Read/Grep 시크릿 → exit 2 실증). 단 (a) Read/Grep을 matcher에 넣어 **모든 read가 fail-closed 게이트를 거침** — perf 비용 + 훅 오류 시 정상 read도 차단되는 trade-off(저확률, 추후 deny-only 전환으로 튜닝 가능). (b) 선언적 `permissions.deny`는 **미검증 패턴 형식(`**/` vs 문서의 `./`)+로컬 전용(전파 X)** 이라 inert 거짓안심 방지 위해 **제거함**. 향후 defense-in-depth 원하면 커밋되는 settings.json에 문서 형식(`Read(./**/app-kiips.properties)`)으로 추가 후 재시작 검증 권장(특히 `KIIPS_PERMISSION_GATE=off` 시나리오 대비).

**잔존(보류·별개 과제, 사용자 결정 반영)**:
- **사용자 보류**: orphan 삭제(.min.js 4종 + 빈 `backups/`·`worktrees/`) — rm 권한 차단 + 무해해 defer.
- **sunset 연계 보류**: `orchestrate._callCount` dead counter + Gemini 리뷰 환각 → 2026-06-18 Gemini sunset과 함께 정리.
- **별개 한계로 명시(범위 분리)**: ethicalValidator의 `bash -c "리터럴 명령"` 인터프리터 우회 + DQUOTE 내부 backtick 명령치환 — tokenizer `$()` STATE-stack 수정(P2-3) 범위 밖, 인터프리터 인자 인식이라는 다른 메커니즘 필요. `telemetry/`·`agent-team.log`는 무해 placeholder/로그라 변경 불필요로 결정.
- **선언적 defense-in-depth(선택)**: Read 축 `permissions.deny`를 검증된 문서 형식(`Read(./**/app-kiips.properties)`)으로 커밋되는 settings.json에 추가 + 재시작 검증 — `KIIPS_PERMISSION_GATE=off` 대비용. 현재는 permissionGate 훅이 단독 보호.
- **catalog 3번째 축 보류**: skill-rules↔disk 양방향 대조는 agent/tool/manual 항목 false-positive 위험으로 정밀 설계 후 추가 권장(README Skills·산문 훅 2축은 P2-1에서 추가 완료).

---

## 차원1 — 하네스 엔지니어링 & 훅 시스템

### 잘 작동하는 점
- **7개 이벤트 훅 와이어링 전부 실파일 도달** — settings.json L3-163의 모든 command 경로가 존재 파일을 가리킴(orphan 바인딩 0건).
- **postToolOrchestrator의 6개 sub-hook export 계약 정합** — autoFormatter.onPostToolUse / buildChecker.onPostToolUse / observe.processEvent / outputSecretFilter.filterSecrets / agentStateManager.cleanupStale / geminiAutoTrigger.trigger 모두 호출명=export명 일치.
- **에러로그 무결** — hook-errors.log 0바이트, security-masking.log 0바이트, hook-debug.log는 PreCompact 정상기록 2줄뿐. 런타임 크래시 흔적 없음.
- **Ralph-loop 게이트 중 2개는 실재·동작** — multiFileGate THRESHOLD=3(distinct 파일), buildChecker MAX_AUTO_FIX_ATTEMPTS=3 + MAX_SIGNATURE_SHIFTS=3, 빌드 성공 시 errorSignatureHistory 초기화.
- **fail-open 일관성** — 모든 sub-hook 호출이 try/catch로 감싸져 한 훅 실패가 파이프라인 전체를 중단시키지 않음.
- themeCssVerGuard.sh의 간접 도달(runShellHook .scss 한정), scssValidator.sh 비-.scss 즉시 exit 0 가드도 설계 의도대로 동작.

### 발견사항

| severity | 분류 | 발견 / 증거 | 권고 |
|----------|------|-------------|------|
| medium | WIRE | **orchestrate._callCount는 프로세스-퍼-이벤트 모델에서 누적 불가(dead counter).** L354-374 CLI 엔트리는 stdin 파싱 → orchestrate() 1회 → process.exit(0). daemon 없음. 매 이벤트가 새 node 프로세스라 함수객체 프로퍼티가 매번 리셋 → `_callCount % 10`(Gemini realtime fallback)·`% 50`(cleanupStale)이 영구 도달 불가. **영향 축소**: cleanupStale은 pre-compact-save.sh가 PreCompact마다 inline node로 호출하므로 stale 정리는 별 경로로 유지됨. 실질 손실은 '비-critical Gemini 리뷰 realtime 표시'뿐(critical은 signal 경로 L217로 별도 발화). | 프로세스 간 영속 카운터(파일 기반)로 이전하거나 %10 fallback 제거 후 signal 경로 단일화. **Gemini 스택 2026-06-18 sunset이므로 적극 수정보다 '문서화 후 sunset과 함께 정리' 권고.** |
| medium | DECIDE | **Ralph-loop '동일 파일 3회 편집' 카운터 미구현 (문서 vs 코드 drift).** ralph-loop-detection.md가 `.file-edit-counter.json`을 명시하나 `find`·`grep` 결과 0건. 실재 게이트는 multiFileGate(distinct 파일 수)·buildChecker(빌드 실패/시그니처)뿐. 문서가 약속한 '동일 파일 3회 Edit→즉시 중단' 트리거는 부재. | (A) 문서를 실제 구현에 맞춰 정정하거나 (B) 약속된 카운터를 실제 구현. **drift를 '고치지' 말고 어느 쪽이 의도인지 사용자 확인.** |
| low | FIX | **scssValidator.sh 이중 실행.** settings.json L98-106이 Edit\|Write에 직접 바인딩 + postToolOrchestrator L166이 동일 이벤트 3단계에서 runShellHook 재호출 → .scss Edit/Write 1회당 2개 bash 프로세스. (비-.scss는 exit 0이라 기능 오작동은 아님) | 둘 중 하나 제거하여 오케스트레이터 통합 의도에 정합화. 사용자 승인. |
| low | DELETE | **.min.js 4종은 현행 소스의 정상 minify 미러이나 참조 0건, 빌드 스텝 부재.** settings는 .js만 바인딩, require/spawn 0건, minify 스크립트 미발견, catalog는 .min.js 제외. (Gemini 리뷰의 buildChecker.min.js/agentStateManager.min.js 삭제 경고는 존재하지 않는 파일에 대한 **환각**) | 제거 권고(저위험·가역). tracked/gitignored 확인 후 git rm 또는 rm. |
| info | DECIDE | **Gemini 리뷰 로그가 비존재 파일 삭제를 critical로 환각.** review-*.json이 buildChecker.min.js/agentStateManager.min.js(디스크에 없음) 삭제 경고 + 테스트 픽스처(/tmp/test.java)를 '워크스페이스 위반'으로 보고. | **sunset(6/18) 전까지 Gemini 리뷰는 참고용으로만, 자동 차단 신호로 신뢰 금지.** |
| info | KEEP | **.pending-build.json 정상 idle.** files 3개 추적·errors=[]·autoFixAttempts=0 → ralph 빌드게이트 미발화(정상). | 권고 없음. |

---

## 차원2 — 오케스트레이터 계층 (orchestration skill + 4 managers + shared + skill-rules)

오케스트레이터 계층은 **"설계는 풍부하나 배선은 끊긴"** 상태다. 매니저 4종·shared 4종·kiips-orchestration SKILL·skill-rules의 매핑 필드가 모두 존재하지만 런타임 연결이 완결되지 않았다. 매니저 문서는 통합 이전(pre-consolidation) 스킬 카탈로그 기준의 stale 스냅샷이다.

### 잘 작동하는 점
- **worker 에이전트 참조 전부 유효** — kiips-architect/developer/ui-designer/checklist-generator/verify-agent 5종 실재, agents-registry 정합(totalAgents 13, managers 4, specialists 7).
- kiips-feature-planner 스킬 실재(깨진 링크 아님), shared 4종 파일 전부 실재·정합.
- delegation-template.md(Objective/OutputFormat/Tools/Boundaries + DO-NOT/WAIT-FOR/STOP-IF)는 위임 시 즉시 사용 가능한 수준.
- quality-gates.md의 ethical-gate-first 매트릭스를 매니저 4종이 일관 참조. detectManagerAgent 하드코딩 키워드는 skill-rules promptTriggers와 의미적으로 일치(라우팅 의도 자체는 정합).

### 발견사항

| severity | 분류 | 발견 / 증거 | 권고 |
|----------|------|-------------|------|
| high | DECIDE | **skill-rules의 managerAgent/orchestrationSkill/autoActivationLevel/delegationRules 4건이 어떤 훅도 미소비(dead config).** grep 결과 userPromptSubmit.js에 미참조. 실제 라우팅은 detectManagerAgent(L381-433) 하드코딩으로 수행. 레지스트리 선언이 런타임 전혀 미반영. | (A) 훅이 skill-rules를 읽도록 통합(single source) 또는 (B) 미사용 필드 제거 + 하드코딩 정본화. **결정만 요청.** |
| high | DECIDE | **4개 매니저 선언 'new orchestration skill' 4종이 디스크 전무.** build-orchestration/deployment-pipeline/feature-lifecycle/ui-workflow — skills/ 27개 어디에도 없고 skill-rules도 미등재. kiips-orchestration이 이미 통합 역할 수행 중. | (A) 매니저 문서에서 미존재 참조 삭제(SHRINK, 정합적) 또는 (B) 4스킬 실제 생성. |
| high | WIRE | **disable-model-invocation:true 스킬에 호출 디렉티브 주입 모순.** activateSkills(L467-494)는 `[Skills] !스킬명` 텍스트만 반환하나 kiips-orchestration·kiips-feature-planner는 SKILL.md L4에서 모델 호출 차단. activateSkills가 이 플래그를 미검사. 두 스킬 모두 priority:critical로 자동활성화 경로에 등재. | activateSkills에 disable-model-invocation 제외 필터 추가, 또는 두 스킬 promptTriggers 제거하여 명시 호출 전용화. |
| medium | FIX | **동일 파이프라인이 SKILL.md 본문과 skill-rules.json pipelines에서 상이(3개 전부).** feature/build/incident 모두 스테이지 정의 불일치. 추가로 pipelines 필드는 어떤 훅도 미독해(둘 다 advisory이나 상호 모순). skill-rules feature-lifecycle는 에이전트(architect/developer/ui-designer)를 '스킬'처럼 나열(혼동). | 한쪽으로 일원화 + 스킬 체인과 에이전트 핸드오프 분리 표기. |
| medium | FIX | **매니저 'Skills Managed' 통합 붕괴 흔적(중복 등재).** deployment-manager kiips-build x2(L60-61,64-65), ui-manager kiips-quality x2(L62-63,65-66) + L395 Related Skills 'kiips-quality, kiips-quality'. | 중복 줄을 단일 항목 + 하위 불릿 역할로 병합. |
| low | FIX | **feature-manager QA handoff 대상이 문서 내부 모순.** L14/L99는 checklist-generator, L145-149 핸드오프 코드는 verify-agent를 최종 게이트로. (둘 다 실재 → 깨진 링크 아님, 정의 일관성 문제) | 정본 종착점 확정(checklist-generator=체크리스트, verify-agent=독립검증). |
| low | WIRE | **kiips-evaluation-criteria.md가 매니저 4종 Shared Protocols 목록에서 누락.** 매니저는 quality-gates/delegation-template/effort-scaling 3개만 링크. 이 평가표는 kiips-page-harness에서만 사용. | 'page-harness 전용'이면 MOVE, 'feature QA 공용'이면 feature/ui-manager에 WIRE. |
| low | FIX | **effort-scaling 복잡도 밴드 불일치.** kiips-orchestration SKILL.md L37-42(SIMPLE/MODERATE/COMPLEX/CRITICAL) vs effort-scaling.md L14-19(Trivial/Simple/Moderate/Complex, CRITICAL 밴드 없음). | SKILL.md 표를 effort-scaling에 정합화하거나 제거 후 참조. |

---

## 차원3 — 에이전트/스킬/훅 자동연동 & 레지스트리 drift

### 잘 작동하는 점
- **3개 레지스트리 ↔ 디스크 양방향 완전 정합** — agents 13키/13파일(+shared 4/4), skills 27키/27 SKILL.md, commands 24키/24 .md. 모두 dangling 0·orphan 0.
- **훅 도달성 무누락** — 직접바인딩 16 + require체인 8 + spawn/runShellHook 3 = 27 distinct, 디스크 비-min 훅 27과 정확히 일치, **true orphan 0건**.
- 훅 바인딩 카운트 정합(catalog 17 = README 17), skill-rules→디스크 방향 dangling 트리거 0건, SPECIALIST_ROUTES 8개 에이전트 전부 디스크 실존, catalog-integrity.sh는 검사하는 6축에서 정확히 동작.

### 발견사항

| severity | 분류 | 발견 / 증거 | 권고 |
|----------|------|-------------|------|
| high | WIRE | **SILENT GAP: 디스크 3개 스킬이 skill-rules.json 항목 0건 → 자동 트리거 구조적 불가.** kiips-operator-onboarding/page-harness/stitch-bridge. shouldActivateSkill()은 promptTriggers만 읽으므로 프롬프트 기반 자동활성화 불가, Skill 도구 수동 호출로만 발동. catalog는 이 축 미검사(9/10 PASS여도 미검출). | (a) 자동제안 의도면 promptTriggers 추가, (b) 명시 호출 전용이면 문서화. catalog에 skill-rules↔디스크 대조 축 추가 권고. |
| medium | FIX | **README.md L15 훅 카운트 26 (실측 27) — catalog-integrity.sh 유일 FAIL, 순수 doc-lag.** 도달성 산술로 27개 전부 도달 가능 확인(미연동 훅 아님). | **README.md L15 26→27 수정.** |
| medium | FIX | **README.md L13 Skills 31 (실측 27) — catalog가 못 잡는 SKILLS.md와의 내부 모순.** 권위 소스 SKILLS.md=27. README L13=31. catalog는 SKILLS.md만 대조하고 README L13은 미검사(SILENT). | README L13을 SKILLS.md 권위 내역(27)에 맞춰 수정. |
| medium | FIX | **Dead config: enforcement 'require'(15건)·'suggest'(9건)는 무동작.** userPromptSubmit.js L503에서 enforcement는 'block'으로만 소비. 24개 중 23개 enforcement 값이 무효 표기. | (a) enforcement 보강 또는 (b) 무의미 인지하고 스키마 정리. |
| medium | DECIDE | **트리거↔자기선언 부정합 7건.** priority:critical인데 SKILL.md가 manual-only/ref-only: kiips-build/feature-planner/orchestration/quality/test-runner + mybatis-guide/search-filter-guide. activateSkills L489-491이 critical에 '!' 접두 강제 주입 → 광범위 키워드 매칭 시 noise. **핵심 정정: 동인은 enforcement:require(무동작)가 아니라 priority:critical임.** | manual/ref-only 스킬 priority 하향 또는 키워드 협소화. breakage 아닌 noise라 medium. |
| medium | FIX | **catalog-integrity.sh 사각지대: 4개 실 drift 중 1개만 검출.** 미검출 3건: README L13(Skills 31), README L79(산문 '26개 훅'), skill-rules↔디스크 SILENT GAP. | catalog에 3개 축 추가. |
| low | FIX | **README.md L79 산문 '26개 유니크 훅' (실측 27).** catalog는 표 행만 grep, L79 산문 미검사. | L79 '26개'→'27개'. |
| low | FIX | **Dead config: managerAgent/orchestrationSkill 4건 미참조.** 차원2와 동일 근본. | 필드 제거 또는 훅 연결. |

---

## 차원4 — 보안 (PreToolUse fail-open/closed + deny 커버리지 + 시크릿 마스킹)

### 잘 작동하는 점
- **진짜 보안 경계 fail-CLOSED 실측 검증** — ethicalValidator.js·permissionGate.js 모두 빈 stdin/malformed JSON/타임아웃(10s)/내부예외에서 exit 2. 'rm -rf /'·'svn commit' 정상 차단 실측. "크래시시켜 우회" 불가.
- ethicalValidator의 shellContextOnly AST 세그먼트 분리 + unclosed 세그먼트 regex-only fail-closed fallback은 state 누출 공격을 구조적으로 방어.
- outputSecretFilter 마스킹 패턴 광범위(JDBC/DB pw/OpenAI·AWS·GitHub 키/JWT/Private Key + 주민번호·휴대폰 + Base64·URL-Encoded 우회 탐지).
- **settings.local.json이 공식 permissions.{allow} 문자열 형식 + sandbox.enabled:true** 를 올바르게 사용 — 이것이 실제 작동하는 권한층.

### PreToolUse 게이트 fail-open/closed 판정

| 게이트 | 분류 | 거동 | 평가 |
|--------|------|------|------|
| ethicalValidator.js | **fail-CLOSED (정답, 진짜 경계)** | 빈/malformed/타임아웃/내부예외 → exit 2 | 올바름 |
| permissionGate.js | **fail-CLOSED (정답, 진짜 경계)** | 동일 → exit 2 / catch block decision:block | 올바름 |
| mybatisBindingGuard / jspXssGuard | **fail-OPEN (정답, 품질 게이트)** | 오류 시 exit 0 | 의도적·정당(개발 비차단) |
| settings.json L27 인라인 python | **fail-OPEN (오답, 보안 가드인데 잘못된 방향)** | malformed/빈 stdin → exit 1(비차단) | **결함 — fail-closed여야 함 (메인세션 재현 ✅)** |

### 발견사항

| severity | 분류 | 발견 / 증거 | 권고 |
|----------|------|-------------|------|
| high | FIX | **permissionRules 33개가 비공식 키라 제품 미독해 (Read 축 시크릿 보호 사실상 0).** settings.json L166 `permissionRules:[{type,tool,pattern}]` 객체배열은 **비공식 스키마** — 공식은 `permissions.{allow/deny}` 문자열 배열(settings.local.json L6이 사용)이므로 제품 파서가 무시(inert 근거는 스키마 형식; grep-0은 보강 정황). 영향: `Read **/app-kiips.properties`·`Bash cat app-kiips.properties` 무방비(인라인 python·permissionGate 모두 Edit\|Write만 매칭, sandbox read.denyOnly:[]). **상위 레이어 백스톱 부재 확정(메인세션 재현 ✅): `~/.claude/settings.json` deny:0, managed-settings.json 부재 → managed/user/project 전체 스택에 시크릿 read deny 0건.** | permissionRules→공식 permissions.{deny} 이관 + 인라인 python을 Read/Grep/Bash로 확장 + sandbox read.deny에 app-*.properties 등재 병행. **검증(probe) 전까지 기존 항목 삭제 금지.** |
| high | FIX | **인라인 python 시크릿 가드 fail-OPEN.** malformed JSON → json.load JSONDecodeError 미캐치 → exit 1(비차단). 빈 stdin도 exit 1(메인세션 재현 ✅). | try/except로 감싸 파싱 실패 시 sys.exit(2)(fail-closed), 또는 별도 .js 가드로 승격. |
| medium | FIX | **민감정보 deny 커버리지 도구별·파일별 불균일.** permissionGate BLOCKED_PATHS=pom/start/stop/app-kiips/stg/production(local·tibero·.env·credentials 미포함). 인라인 python=.env/app-kiips/stg/local/tibero/credentials(app-production 미포함). 즉 app-production은 permissionGate(Edit/Write)에만, Read/Bash 무방비. | 작동 계층에서 보호 파일 집합 단일 SOT 통일(production 포함) + Read/Bash 매처 추가. |
| medium | DECIDE | **'3중 중복'은 defense-in-depth가 아니라 category error.** [Read 축]=permissionRules 단독→inert→보호 0. [Edit/Write 축]=인라인python(fail-open)+permissionGate(부분경로)→degraded 2층, 대상 집합 불일치. [출력 축]=outputSecretFilter(PostToolUse)→직교축. 실질 2중. | permissionRules 공식화 vs python+permissionGate 2층 단일화 결정. |
| medium | FIX | **ethicalValidator filesystem/remoteExecution 우회(false-negative, 문서화된 한계, 실측 재현).** `bash -c "rm -rf /tmp/x"`→exit 0, `echo "$(rm -rf /home)"`→exit 0. shellContextTokenizer L17-25 주석이 DQUOTE 내부 $() 를 literal로 분류함을 명시. | tokenizer에 STATE stack 도입, 또는 filesystem 패턴이 DQUOTE 내부도 스캔. fail-open 아닌 정탐 누락. |
| info | DECIDE | **security-masking.log 0바이트** — 마스킹 한 번도 미수행. | 시크릿 더미 출력 주입 후 로그 확인 1회. 관측성 갭. |
| low | KEEP | ethicalValidator/permissionGate가 shellContextTokenizer require 의존 — 모듈 손상 시 exit 1. 단 토크나이저는 의존성 0 순수 JS. | 권고 불필요. |

---

## 차원5 — Orphaned 파일 (적대적 검증 반영)

완전한 참조 그래프(settings.json ∪ orchestrator runShellHook/lazy require ∪ require 체인 ∪ spawn/execSync ∪ 3 레지스트리 ∪ skill-rules ∪ tests) 위에서 판정 후, **적대적 반증(prove-it-alive)으로 재검증.** 아래 표는 정정된 verdict 기준. **2건이 원판정에서 flip**됐다.

| 파일 | 원판정 | confirmed | **정정 verdict** | 분류 | 근거 |
|------|--------|-----------|------------------|------|------|
| ethicalValidator.min.js | dead | true | **진짜 dead** | DELETE | 8개 벡터 전수 탐색 inbound 0건. untracked+gitignored |
| permissionGate.min.js | dead | true | **진짜 dead** | DELETE | 7개 벡터 무참조. package.json 부재→minify 스크립트 선언 불가 |
| postToolOrchestrator.min.js | dead | true | **진짜 dead** | DELETE | catalog 의도적 제외, minify 태스크 부재 |
| shellContextTokenizer.min.js | dead | true | **진짜 dead** | DELETE | require→.js로 해석. **소스 .js는 LIVE, 삭제 금지** |
| **backups/** | live | **false (flip)** | **진짜 dead** | DELETE(또는 .gitkeep) | 원전제 거짓: config-backup은 미설치 command. 실제 백업은 `.claude-backups`(sibling) |
| **worktrees/** | live | **false (flip)** | **진짜 dead** | DELETE(또는 .gitkeep) | 원전제 거짓: 활성 코드 worktree 참조 0건 |
| **telemetry/** | live | **false** | **미배선 보류** | DECIDE | producer 부재. observe.js는 learning/observations.jsonl에 기록. 문서↔코드 drift |
| **agent-team.log** | uncertain | **false** | **미배선 보류** | DECIDE | env 활성이나 검증된 write-path 부재 + 3.5개월 stale |
| kiips-operator-onboarding (SKILL) | not-yet-wired | true | **미배선 보류** | WIRE | registry 정합·수동 호출 가능, skill-rules 미등재로 자동활성화만 미배선 |
| kiips-page-harness (SKILL) | not-yet-wired | true | **미배선 보류** | WIRE | 'Use when:' 키워드 존재 → 자동활성화 추가 가치 높음 |
| kiips-stitch-bridge (SKILL) | not-yet-wired | true | **미배선 보류** | WIRE | 동일 |
| gemini-bridge/reviews/ | live | true | **거짓양성(hot path live)** | KEEP | settings 등록 4개 훅이 직접 read/write |
| hook 로그 3종 | live | true | **거짓양성(런타임 산출물)** | KEEP | settings가 hook-errors.log에 2>> 리다이렉트 |
| archive/harness-diet-2026-06-08/ | live | true | **거짓양성(의도적 백업)** | KEEP | harness-diet 변경 원본 백업 |
| workflows/ | live | true | **거짓양성(워크플로우 엔진)** | KEEP / WIRE | untracked → **git add 추적 권고(손실 위험)** |
| disabled-ecc-skills.md | uncertain | true | **uncertain (human 노트)** | KEEP | git-tracked + 명시 목적 기재된 의도적 참고 문서 |

### 3-way 버킷 요약
- **진짜 dead** (6): `.min.js` 4종 + `backups/` + `worktrees/`
- **미배선 보류** (5): kiips-operator-onboarding / page-harness / stitch-bridge + `agent-team.log` + `telemetry/`
- **거짓양성(디스패처 경유 live)**: gemini-bridge.js·backupGc.sh·themeCssVerGuard.sh·geminiAutoTrigger.js·**소스 shellContextTokenizer.js**·observationsRoller.js·reviews/·hook 로그·workflows/·archive/

> **canary 해결**: shellContextTokenizer.js는 MEMORY.md('통합 최우선')와 달리 디스크상 이미 ethicalValidator.js+permissionGate.js가 require하는 LIVE 공유 라이브러리 — **메모리가 stale, 통합 이미 완료.** orphan은 `.min.js` 미러뿐.

---

## drift 추적: 어느 파일이 아직 26인가

세션시작 신호 'FAIL 26/실측 27'의 정체는 **스킬이 아니라 README의 훅 카운트**다.

| 항목 | 파일·라인 | 현재 값 | 정상 값 | catalog 검출 |
|------|-----------|---------|---------|--------------|
| 훅 유니크 카운트 (표) | **README.md L15** | 26 | **27** | ✅ catalog FAIL(유일) |
| 훅 유니크 카운트 (산문) | **README.md L79** | 26 | **27** | ❌ SILENT |
| Skills 카운트 | **README.md L13** | 31 | **27** | ❌ SILENT |

**스킬은 3-way 정합 PASS** (SKILLS.md=27, skills-registry.totalSkills=27, 디스크 SKILL.md=27). FAIL은 별개 축인 훅 카운트다.

---

## 권고 우선순위

**모든 수정은 읽기 전용 감사의 권고이며 사용자 승인 대상이다.**

| 우선순위 | 권고 | 분류 | 차원 |
|----------|------|------|------|
| **P0** | permissionRules→공식 permissions.{deny} 이관 + 인라인 python을 Read/Bash로 확장 + sandbox read.deny에 app-*.properties 등재 | FIX | 보안 |
| **P0** | 인라인 python 시크릿 가드를 try/except fail-closed(sys.exit 2)로 | FIX | 보안 |
| **P1** | 보호 파일 집합 단일 SOT 통일(app-production 포함) + Read/Bash 매처 | FIX | 보안 |
| **P1** | '3중 중복' 방어 구조 재설계 여부 결정 | DECIDE | 보안 |
| **P1** | 3개 스킬 자동활성화 배선 여부 결정 | WIRE/DECIDE | 자동연동 |
| **P1** | skill-rules managerAgent/orchestrationSkill/enforcement dead config 처리 | DECIDE | 오케스트레이터 |
| **P1** | 4개 매니저의 미존재 orchestration 스킬 참조 처리 | DECIDE | 오케스트레이터 |
| **P1** | disable-model-invocation 스킬 호출 디렉티브 모순 해소 | WIRE | 오케스트레이터 |
| **P2** | README L13/L15/L79 카운트 정정(31→27, 26→27 ×2) | FIX | drift |
| **P2** | catalog-integrity.sh에 사각지대 3축 추가 | FIX | 자동연동 |
| **P2** | ethicalValidator DQUOTE 내부 $() 우회 수정 | FIX | 보안 |
| **P2** | priority:critical ↔ manual/ref-only 부정합 7건 | DECIDE | 자동연동 |
| **P2** | 오케스트레이터 파이프라인/effort-scaling/중복/QA handoff 정합화 | FIX | 오케스트레이터 |
| **P2** | ralph-loop 동일파일 카운터 문서 vs 코드 drift 해소 | DECIDE | 하네스 |
| **P2** | scssValidator.sh 이중 실행 제거 | FIX | 하네스 |
| **P2** | .min.js 4종 + backups/ + worktrees/ 정리 (소스 .js 보존) | DELETE | orphan |
| **P2** | workflows/ git add 추적 | WIRE | orphan |
| **P2** | agent-team.log / telemetry/ 미배선 보류 — 활성화 의도 확인 | DECIDE | orphan |
| **P2 (sunset)** | orchestrate._callCount dead counter + Gemini 리뷰 환각 + reviews/ | DELETE/DECIDE | 하네스 |

관련 핵심 파일: `settings.json`, `settings.local.json`, `hooks/postToolOrchestrator.js`, `hooks/userPromptSubmit.js`, `hooks/permissionGate.js`, `hooks/ethicalValidator.js`, `hooks/shellContextTokenizer.js`, `skill-rules.json`, `README.md`(L13/L15/L79), `SKILLS.md`, `tests/catalog-integrity.sh`, `rules/ralph-loop-detection.md`, `agents/managers/{build,deployment,feature,ui}-manager.md`, `skills/kiips-orchestration/SKILL.md`.
