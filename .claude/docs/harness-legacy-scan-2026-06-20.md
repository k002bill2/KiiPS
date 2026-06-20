# Harness Legacy Scan — 2026-06-20 (재감사)

> 읽기 전용 감사. **이 파일은 리포트일 뿐 어떤 하네스 파일도 수정하지 않았다.**
> 실행 엔진: `harness-legacy-scan` 워크플로우 (Run ID `wf_4cb95f6b-0be`, 73 에이전트, ~46분).
> 원본 구조화 데이터: `/private/tmp/claude-501/.../tasks/wbqns8mr9.output` (JSON, 1158줄).
> 이전 감사: `.claude/docs/harness-legacy-scan-report.md` (2026-06-09, 253KB) — reconcile 대상.

---

## ⚠️ 신뢰도 경고 — 먼저 읽으세요

이 감사의 **Plan(63항목 분류)을 실행 계획으로 신뢰하지 마십시오.** 이유:

1. **Adversarial(반박 검증) 단계가 18/40만 완료.** 나머지 22건은 **세션 한도 초과**로 실패
   (`You've hit your session limit · resets 7am (Asia/Seoul)`).
2. **검증된 18건 중 78%가 강등/기각됐다:**
   - 14건 **downgrade** (감사 권고가 과도 — 더 보수적 조치로 교정)
   - 1건 **reject** (P14 — 하면 안 됨)
   - 3건만 **uphold** (P13, P19, P21)
3. 감사 자체에서 **stale evidence 발견**: 예) P1은 "power-stack이 sunset된 Gemini CLI에 의존"이라
   주장했으나, adversarial이 현재 파일을 읽어 **거짓**으로 판정(2026-06-09 Edit이 이미 Gemini 줄 제거).
4. 따라서 **검증 안 된 45건(P5, P9~P12, P17~P18, P22~P63 다수)은 같은 과도성 가능성이 높아 실행 금지.**

**결론: 이 리포트는 "문제 후보 지도"로는 가치 있으나, "실행 명령서"로는 미완성이다.**
안전하게 쓰려면 7am(Asia/Seoul) 한도 리셋 후 adversarial을 재실행해야 한다.

---

## 실행 요약 (감사 Planner overall_summary)

> 하네스는 전반적으로 비교적 잘 통제된 상태. CLAUDE.md(64줄)가 유일한 always-on 전역 문서로
> 절제돼 있고, 훅은 `postToolOrchestrator`/`stopEvent` 허브로 통합돼 마찰이 낮으며, 스킬들의
> 'NOT for' 경계가 능동적으로 중복을 막고 있다.
>
> 가장 큰 절감 기회는 컨텍스트 압축이 아니라 **"이 코드베이스가 쓰지 않는 패턴을 가르치는
> stale 콘텐츠" 제거**다:
> - 프로젝트에 mapper XML이 0개(inline SQL DAO)인데 `kiips-db-inspector` /
>   `kiips-mybatis-guide` / `kiips-backend` 3개 스킬이 MyBatis mapper XML을 정본처럼 설명.
> - 2026-06-18 sunset된 Gemini CLI를 살아있는 듯 참조하는 죽은 콘텐츠
>   (`power-stack.md`, `page-harness/reference.md`, `GEMINI.md` 2종, antigravity 마이그레이션 메모).
>
> 안전망(ethicalValidator/permissionGate/buildChecker/ralph-loop/verify 3계층)은 **모두 KEEP**.
> 권한 항목(settings.local.json 광범위 allow, permissionRules inert 키, PreToolUse 체인)은
> 모두 `harness_diet_auto=false`(사람 승인 대상)로 분류.

---

## 인벤토리 스냅샷

| 카테고리 | 수량 | 비고 |
|---------|------|------|
| Agents | 13 | specialist 7 + manager 4 + system 2 (`agents-registry.json` 수동 유지) |
| Skills | 27 | KiiPS 22 + 공통 3 + 디자인 2 (`skills-registry.json` 자동 생성) |
| Commands | 23 | `commands-registry.json` 자동 생성 |
| Hooks | 23 소스 | 직접 배선 13 + 허브 위임 10 (**고아 0** — orphaned 의혹 REFUTED) |
| Rules | 9 | 조건부 적용 (`.claude/rules/`) |
| Disabled ECC skills | 162 | `disabled-ecc-skills.md` 추적 (프로젝트 외부) |

### 확정된 이상(anomalies)
- **REFUTED** — "고아 훅" 의혹: 23개 전부 허브(`postToolOrchestrator`/`stopEvent`/공유 lib) 경유 LIVE. 고아 아님.
- **CONFIRMED** — `.claude/hooks/*.min.js` **10개**가 settings.json·require 어디서도 미참조 = dead weight.
- **CONFIRMED** — MCP 정의가 4곳에 분산(`.mcp.json` 빈 객체 / `.claude/mcp.json` / `settings.local.json` / README 주장).
  `pencil`·`claude-in-chrome`은 README가 주장하나 어디서도 enable 안 됨.
- **NEW** — `AGENTS.md`가 존재하지 않는 `.Codex/rules/`, `.Codex/PORTS.md`, `.Codex/README.md`를 참조(broken). `.claude/*`로 교정 필요.
- **CONFIRMED** — `hook-debug.log`/`security-masking.log` stale(빈/최소).

---

## 분류 분포 (63항목)

| Action | 건수 |
|--------|------|
| SHRINK | 29 |
| KEEP | 16 |
| SPLIT | 9 |
| CONVERT | 4 |
| MOVE | 4 |
| DELETE | 1 (P40 = `.min.js` 10개) |

`harness_diet_auto`: true(자동안전) **14** / false(사람승인) **49**.

> ⚠️ 단, 위 `harness_diet_auto=true` 14건도 adversarial에서 P1·P2·P26 등이 **강등**됐으므로
> "자동 안전" 라벨 자체를 재검증 전까지 신뢰하지 말 것.

---

## Adversarial 검증 결과 (18/40 완료)

| id | 원분류 | verdict | 더 안전한 분류 | 대상 |
|----|--------|---------|--------------|------|
| P1 | CONVERT | **downgrade** | SHRINK | rules/power-stack.md |
| P2 | SHRINK | downgrade | SHRINK(재정의) | rules/verification.md |
| P3 | SHRINK | **downgrade** | **KEEP** | rules/anti-rationalization.md |
| P4 | SHRINK | downgrade | SHRINK | rules/editing.md |
| P6 | MOVE | **downgrade** | **KEEP** | rules/dark-theme.md |
| P7 | MOVE | downgrade | SHRINK | rules/validation.md |
| P8 | MOVE | downgrade | SHRINK | rules/error-handling.md |
| P13 | SHRINK | ✅ **uphold** | — | skills/code-simplifier (description '개선/improve' 제거) |
| P14 | CONVERT | ❌ **reject** | — | agents/code-simplifier.md (전환하지 말 것) |
| P15 | SHRINK | **downgrade** | **KEEP** | skills/checklist-generator |
| P16 | CONVERT | downgrade | SHRINK | agents/checklist-generator.md |
| P19 | SHRINK | ✅ **uphold** | SHRINK | page-harness/reference.md (죽은 'Gemini Auto-Reviewer 병행' 줄 제거) |
| P20 | SHRINK | **downgrade** | **KEEP** | skills/kiips-button-guide |
| P21 | SHRINK | ✅ **uphold** | SHRINK | kiips-button-guide/reference.md |
| P24 | SHRINK | **downgrade** | **KEEP** | page-pattern-guide/reference.md |
| P26 | SHRINK | downgrade | SHRINK | ui-component-builder/reference.md |
| P33 | SHRINK | downgrade | SHRINK | userPromptSubmit.js (activateSkills) |
| P36 | SHRINK | **downgrade** | **KEEP** | .claude/mcp.json |

**verdict 분포: downgrade 14 / uphold 3 / reject 1.**

### 신뢰 가능한 실행 항목 (uphold 3건만 — 그래도 사람 승인 권장)
- **P19** *(uphold, low risk, auto)* — `kiips-page-harness/reference.md`의 죽은
  "Gemini Auto-Reviewer 병행"(L133) 줄 제거. **가장 안전한 단일 조치.**
- **P21** *(uphold)* — `kiips-button-guide/reference.md` 압축.
- **P13** *(uphold)* — `code-simplifier` 스킬 description에서 과광범위 트리거 '개선/improve' 제거(정밀도↑).

### 명시적으로 하면 안 되는 것
- **P14 (reject)** — `agents/code-simplifier.md`를 skill 위임 껍데기로 CONVERT하지 말 것.

---

## 미검증 45건 (실행 금지 — 재검증 필요)

P5, P9, P10, P11, P12, P17, P18, P22, P23, P25, P27, P28, P29, P30, P31, P32,
P34, P35, P37, P38, P39, P40, P41, P42, P43, P44, P45, P46, P47, P48, P49, P50,
P51, P52, P53, P54, P55, P56, P57, P58, P59, P60, P61, P62, P63.

> 이 중 stale-콘텐츠 후보(mapper XML 3종 P42/P44/P45, Gemini 잔재 P29, `.min.js` DELETE P40)는
> 인벤토리 anomaly로 뒷받침되나, **개별 adversarial 미통과**이므로 단독 실행 전 확인 필요.

---

## 다음 단계 (권장)

1. **7am(Asia/Seoul) 한도 리셋 후 adversarial 재실행** — 같은 워크플로우를 resume하면 완료된
   18건은 캐시 반환되고 실패한 22건만 재실행:
   `Workflow({scriptPath: ".../harness-legacy-scan-wf_4cb95f6b-0be.js", resumeFromRunId: "wf_4cb95f6b-0be"})`
2. 재검증 완료 전까지 **하네스 파일 수정 금지** (이 감사는 read-only가 원칙).
3. 즉시 가치 있는 단일 안전 조치만 별도 승인하에: **P19**(죽은 Gemini 줄 제거).
4. 이전 리포트(2026-06-09)와 reconcile — P1처럼 이전엔 더 보수적 결론(SHRINK)이었던 항목이
   이번에 더 공격적으로 escalate된 사례가 있어 회귀 점검 필요.

---

*생성: 2026-06-20 · harness-legacy-scan 재감사 · 18/40 adversarial 완료(부분).*
