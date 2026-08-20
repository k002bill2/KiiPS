# 하네스 ↔ 신모델 능력 정합성 감사 (2026-08-07)

> 대상 모델: Fable 5 · Opus 5 · Haiku 4.5
> 범위: 프로젝트 `.claude/`(agents 19 / skills 54 / commands 23 / hooks 29 / rules 10 / workflows 2) +
> 글로벌 `~/.claude/`(agents 40 / skills 113 / commands 16 / hooks 16) + `~/.codex/config.toml`
> 방법: 읽기 전용 정적 조사 9축. 실행·변경 없음.

> ⚠️ **읽는 법 — 「요약」~「D. 양호」 절은 2026-08-07 시점의 스냅샷이며 현재 상태가 아니다.**
> 이후 조치로 **A1·A2·C3·C5 는 이미 상태가 바뀌었다**(예: `architect.md` 는 삭제되어 아카이브에만 있고,
> `advisorModel` 은 `"fable"` 로 바뀌어 실효까지 확인됐다). 각 절의 「근거」 열은 **당시 관측**을 보존한 것이므로
> 현재 근거로 인용하지 말 것. **현재 상태의 정본은 문서 하단 「변경 이력」과 「C3 종결 상세」다.**

## 요약

날짜 고정 모델 ID·모델명 문자열 분기가 **하네스 자산에 0건**이라, 모델 교체 자체를 막는 구조적 장애물은 없다.
실제 문제는 세 갈래다 — ① 구세대를 가리키는 **폴백 1건**, ② 신규 도구 경로에서 **보안 가드가 발동하지 않는 구멍**,
③ 새 모델이 제공하는 상위 옵션(effort·1M·Fable)을 **설정에서 쓰지 않는 미활용**.

---

## A. 실제 제한 — 하네스가 능력을 막는 지점

| # | 지점 | 근거 | 영향 |
|---|------|------|------|
| A1 | 폴백 모델이 구세대 <br>*(2026-08-07 당시 · 현재 해소)* | `~/.claude/CLAUDE.md:40`, ~~`~/.claude/agents/architect.md:5`~~ *(삭제됨 → `~/.claude/archive/architect.md`)* → `ANTHROPIC_DEFAULT_FABLE_MODEL=claude-opus-4-8` | Fable 한도 소진 시 **Opus 5가 아닌 4.8** 로 내려감 |
| A2 *(유지 — 의도된 설계)* | 프로젝트 에이전트 9개가 haiku/sonnet 고정 | `.claude/agents/*.md` frontmatter (haiku 2 / sonnet 7) | Opus 5·Fable 5로 실행 불가. **조언자–작업자 설계상 의도일 수 있어 확인 필요** |
| A3 | 스킬 6개 `disable-model-invocation` | checklist-generator, kiips-learning, kiips-scss, kiips-orchestration, kiips-feature-planner, kiips-build | 모델 자동 발동 차단(수동 전용). 의도적 설계 |
| A4 | 워크플로 에이전트 모델 고정 | `.claude/workflows/harness-legacy-scan.js:332` → `model: "sonnet"` | 해당 워크플로는 Sonnet 5 고정, 상위 모델 선택 불가 |

## B. 구멍 — 파일 변경 도구명 누락

| # | 지점 | 근거 | 영향 |
|---|------|------|------|
| B1 | **`NotebookEdit`·`MultiEdit`가 매처에 없음** | 프로젝트 `PreToolUse`/`PostToolUse` 매처가 `Edit\|Write`, `Bash\|Edit\|Write` 조합뿐 | 해당 도구로 파일을 바꾸면 `mybatisBindingGuard`·`jspXssGuard`·`multiFileGate`·`impactAnalyzer`가 **미발동** |

> **⚠ 정정 (초판 오류)** — 초판은 B1을 "서브에이전트 편집이 프로젝트 보안 가드를 우회"로 서술하고 이를 최상위 발견으로 꼽았다. **이는 틀렸다.**
> 가드 5종을 실측한 결과 전부 `tool_input.file_path`를 읽는다(각 1~2회 참조). `Agent`/`Task`의 `tool_input`은 프롬프트라 검사 대상이 없으므로,
> 매처에 `Agent|Task`를 추가해도 **무의미하다**(no-op). `postToolOrchestrator.js`는 `toolInput.file_path || ""` 로 방어되어 있어 크래시도 나지 않는다.
> 서브에이전트의 편집이 부모 세션 훅에 걸리는지는 **정적으로 판정 불가**이며 아래 미검증 항목으로 옮긴다.
> `Skill`·`Workflow`·`Artifact` 역시 파일을 직접 변경하는 도구가 아니므로 매처 대상이 아니다.

## C. 미활용 — 쓸 수 있으나 설정되지 않음

| # | 지점 | 근거 | 비고 |
|---|------|------|------|
| C1 *(미결 유지)* | effort 상위 2단 미사용 | `~/.claude/settings.json` → `effortLevel: "high"` | enum은 `low\|medium\|high\|xhigh\|max` — 상위 2단 유휴 |
| C2 | 서브에이전트 1M 미적용 | 메인만 `model: "opus[1m]"`. Agent 도구 model enum = `sonnet\|opus\|haiku\|fable` | **`[1m]` 변형이 enum에 없어 per-subagent 요청 자체 불가.** 부모 상속 여부 미검증 |
| C3 *(→ 2026-08-20 종결, 하단 참조)* | `advisorModel` ↔ 문서 불일치 | `~/.claude/settings.json` → `advisorModel: "opus"` vs `CLAUDE.md` "조언자 = Fable 5" | ~~**키를 제품이 해석하는지 미확인.** 해석되면 문서 불일치, 무시되면 설정 자체가 무효~~ *(당시 판단 — 2026-08-20 실측으로 **해석됨** 확인, 설정을 `"fable"` 로 맞춰 종결)* |
| C4 | 신규 서브에이전트 안내에 Fable 누락 | `~/.claude/skills/subagent-creator/SKILL.md:23` → `sonnet/opus/haiku/inherit` | 새 에이전트 작성 시 Fable 5가 선택지로 노출되지 않음 |
| C5 | 커맨드 템플릿이 구세대 ID 예시 | `~/.claude/skills/slash-command-creator/references/frontmatter.md:54,55,72` → `claude-3-5-haiku-20241022`, `claude-sonnet-4-5-20250929` | 신규 커맨드에 **구세대 날짜 고정이 전파될 위험** |

## D. 양호 — 제한 아님 (확인 완료)

- 날짜 고정 모델 ID: **하네스 자산 0건** (검색 히트 37파일은 전부 `node_modules` SDK 문서 + statusline 백업 *파일명*)
- 모델명 문자열 분기: **0건**. `~/.claude/awesome-statusline.sh:15`는 `.model.display_name`을 그대로 출력 → 새 모델명도 정상 표시
- `permissions.deny`: 프로젝트·글로벌 **0건** — 도구 차단 없음
- `thinking`: `{enabled: true, mode: "auto"}` — 활성
- 1M 컨텍스트 인지: `~/.claude/hooks/gsd-statusline.js:310` → `total_tokens || 1_000_000`
- `contextWindowWarningThreshold: 0.8` — 1M 기준 800k, 합리적
- 훅/커맨드가 `claude -p --model`로 모델을 강제하는 호출: **0건**
- `.claude/_global-seed/` 온보딩 자산: 별칭(`sonnet`/`opus`)만 사용 → 신규 인원에게 구세대 전파 없음
- 에이전트 `tools:` 빈 값(`kiips-architect`)은 **전체 도구 상속**으로 해석됨(런타임 에이전트 목록이 `All tools`로 표기)
- Codex 검증기(`~/.codex/config.toml`): `gpt-5.6-sol` / `model_reasoning_effort = "high"` — Claude 모델과 무관

## E. 반증 — 하네스 탓으로 오인하기 쉬운 것

**"AgentTool 호출 금지" · "workflows/deep-research 사용 금지" 지침은 이 하네스에서 나오지 않는다.**
`.claude/`, `~/.claude/CLAUDE.md`, `~/.claude/output-styles/` 전수 검색 결과 **0건**. 세션/제품 레벨 설정이다.

## F. 범위 외 (인접 · 기존 known issue)

- 프로젝트 `.claude/settings.json`에 `permissions` 키 자체가 부재 → 프로젝트 권한 규칙이 비어 있음.
  모델 능력이 아니라 **보안 축**이며, `project_harness_engineering_status` 메모리의 P0와 동일 건.

---

## 권고 (우선순위)

> ⚠️ **아래는 2026-08-07 시점의 권고이며 실행 지시가 아니다 — 1·2·4·5·6 은 이미 처리됐고 3 은 종결됐다.**
> 각 항목 끝의 `→` 표시가 현재 상태다. 현재 남은 미결은 **C1 뿐**이다(하단 「조치 이력」 참조).

1. **A1** — 폴백 표기를 Opus 5(`claude-opus-5`)로 갱신. `CLAUDE.md:40`·`architect.md:5` 두 곳.
   ⚠ 이 둘은 **문서/주석**이며 런타임 설정이 아니다. 실제 동작을 바꾸려면 셸의 `export ANTHROPIC_DEFAULT_FABLE_MODEL` 값을 사용자가 직접 갱신해야 한다.
   → **완료·무효화**: `CLAUDE.md` 는 갱신됐고 `architect.md` 는 **삭제**(아카이브)됐다. env 리맵 자체도 2026-08-20 제거되어 이 권고는 대상이 사라졌다.
2. **B1** — 프로젝트 매처에 `NotebookEdit`(+ 글로벌 정합용 `MultiEdit`) 추가. `Agent|Task`는 추가하지 말 것(위 정정 참조).
   → **완료** (2026-08-07, 하단 조치 이력 참조).
3. **C3** — `advisorModel` 설정(opus)과 문서(Fable 5) 중 어느 쪽으로 맞출지 **사용자 결정 필요**. 자동으로 뒤집지 말 것.
   → **2026-08-20 종결**: 사용자 결정 `"fable"`, 실효까지 확인. 「C3 종결 상세」 참조. *(이 권고는 당시 기록)*
4. **C5** — 커맨드 템플릿 예시를 별칭(`haiku`/`sonnet`)으로 교체해 구세대 전파 차단.
   → **완료** (2026-08-07, 하단 조치 이력 참조).
5. **A2** — 프로젝트 에이전트의 모델 고정은 **조언자–작업자 설계상 의도됨(2026-08-07 사용자 확인)**. 조치 없음.
6. **C1/C2** — effort `xhigh`/`max` 사용 여부는 비용 판단이라 유지. 서브에이전트 1M은 현재 도구 스키마상 요청 불가이므로 조치 대상 아님.

## 미검증 항목 (정직한 한계)

- ~~`advisorModel`·`effortLevel` 키를 Claude Code가 실제로 해석하는지 — 정적 조사로 확인 불가~~
  → **✅ 2026-08-20 해소**: `advisorModel` 은 해석됨(실측). 「C3 종결 상세」 참조. `effortLevel` 은 여전히 미검증.
- **서브에이전트의 도구 호출이 부모 세션의 프로젝트 훅을 발동시키는지** — 정적 판정 불가.
  초판이 "우회한다"고 단정했으나 근거가 없었다. 확인하려면 서브에이전트로 JSP를 편집시켜 `jspXssGuard` 발동 여부를 실측해야 한다.
- 서브에이전트가 부모의 `[1m]` 컨텍스트를 상속하는지
- 훅 매처 변경 시의 실제 발동 여부(실행 검증 미실시 — 본 감사는 읽기 전용)

---

## 조치 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-08-07 | B1 | 초판 오류 정정(서브에이전트 우회 → 도구명 누락). `NotebookEdit`/`MultiEdit` 매처 추가 |
| 2026-08-07 | A1 | 폴백 표기 `claude-opus-4-8` → `claude-opus-5` (문서 2곳) |
| 2026-08-07 | C4 | `subagent-creator` 모델 안내에 `fable` 추가 |
| 2026-08-07 | C5 | `slash-command-creator` 예시를 날짜 고정 ID → 별칭으로 교체 |
| 2026-08-07 | A2·A3·A4 | 의도된 설계로 확인 — 변경 없음 |
| 2026-08-07 | C1·C3 | 사용자 판단 대기 — 변경 없음 |
| 2026-08-20 | **C3 종결** | 사용자 결정: **단일 티어 수용 + advisor 툴만 상위 티어**. `settings.json` → `advisorModel: "opus"→"fable"`, `env.ANTHROPIC_DEFAULT_FABLE_MODEL` **제거**. 문서를 실측에 맞춤(아래 상세) |
| 2026-08-20 | A2 재판정 *(범위: **글로벌** `~/.claude/agents/architect.md` 한정 — §A 의 A2 가 가리키는 **프로젝트** `.claude/agents/*.md` 9건은 2026-08-07 판정대로 **의도된 설계로 유지**되며, 2026-08-20 재실측에서도 9건 그대로다)* | `architect` 에이전트 **삭제** — 전 세션 트랜스크립트 `"subagent_type":"architect"` **0건**(대조: worker 34/analyzer 7). 네이티브 `advisor` 툴이 상위호환(전체 트랜스크립트 자동 전달). 아카이브: `~/.claude/archive/architect.md` |
| 2026-08-20 | 회귀 방지 | 번들 설치기 **2벌 동기화** — `~/Downloads/codex-advisor-worker-bundle/install.sh`, `~/Downloads/Claude-Code-Universal-Environment-Setup-main-1/docs/codex-advisor-worker-bundle/install.sh`(전체 경로). ⚠ **byte-identical 인 것은 두 설치기가 *생성하는 CLAUDE.md 마커 블록*이지 설치기 소스 자체가 아니다** — 소스는 상위판이 `researcher`·컨텍스트 예산 훅을 더 갖고 있어 서로 다르다. 재실행 no-op 실증. 백업 `install.sh.bak.20260820` |
| 2026-08-20 | C1 | 여전히 미결 — `effortLevel` 은 `high` 유지(비용 판단) |
| 2026-08-20 | **C3 미검증 항목 종결** | 재시작 후 `advisor` 1회 호출 실측 — 엔트리 `advisorModel=claude-fable-5`, `usage.iterations[].model=claude-fable-5` 확인. **양성**(설정 실효). 상세는 아래 「C3 종결 상세」 |

### C3 종결 상세 (2026-08-20)

**결정** — 모델 티어 차익(advisor > worker)은 `env.ANTHROPIC_DEFAULT_FABLE_MODEL="claude-opus-5"` 리맵으로
**무효(inert)** 상태였다. 메인 세션·worker·`advisor` 툴이 전부 `claude-opus-5` 로 해석됨(트랜스크립트 `model` 필드 실측).
두 갈래 중 **단일 티어 수용**을 택하되, **상위 리뷰 경로에만** 티어 격차를 복원했다.

| 레이어 | 조치 |
|---|---|
| 메인 세션 · `worker` | Opus 5 유지 (변경 없음) |
| `advisor` 툴 | `advisorModel: "fable"` + env 리맵 제거 → Fable 5 (**실측 확인됨**, 아래 참조) |
| `architect` 서브에이전트 | 삭제 (호출 0건, `advisor` 툴이 대체) |
| Codex 검증 게이트 | **전량 유지** — 이종 모델 계열이 제공하는 유일한 진짜 격차 |
| worker 위임 근거 | "저렴한 모델은 못 멈춘다" → **컨텍스트 위생 + 범위 고정**으로 교체 |

**✅ 검증 완료 (2026-08-20 · 재시작 후 실측 · 근거 L1 · 불확실성 Low)** —
`advisorModel` 키는 제품이 **실제로 해석하며**, `"fable"` 별칭은 **Fable 5 로 해석된다**.
설정 변경 후 첫 세션에서 `advisor` 툴을 1회 호출하고 세션 트랜스크립트 엔트리를 파싱해 확인했다.

| 실측 필드 | 값 | 판정 |
|---|---|---|
| `message.model` | `claude-opus-5` | 메인 루프 = Opus 5 (의도대로) |
| 엔트리 top-level `advisorModel` | `claude-fable-5` | **별칭 해석 성공** — 단, 이 필드는 *모든* 어시스턴트 엔트리에 찍히는 **설정값 에코**라 실행 증거는 아니다 |
| `usage.iterations[]` 중 `type=="advisor_message"` 항목의 `model` | `claude-fable-5` (`input_tokens` 115,778 / `output_tokens` 7,147) | **실제 추론이 Fable 5 로 실행됨** — 토큰이 별도 계상된 유일한 실행 증거 |
| 엔트리 top-level `effort` | `high` | C1 현행값 |

**검증 방법의 함정** — advisor 호출은 별도 sidechain 이 아니라 **메인 턴 엔트리 안에 중첩**된다.
따라서 `message.model` 만 grep 하면 영원히 `claude-opus-5` 만 보이고 "설정 실패"로 오독하게 된다.
판정에 쓸 필드는 **엔트리 top-level `advisorModel`** 과, `message.usage.iterations[]` 중
**`type == "advisor_message"`** 인 항목의 `model` 이다. 후자는 `input_tokens`/`output_tokens`/`cache_*` 를
동반하는 **토큰 사용량 항목**이라, 선언이 아니라 *실제로 그 모델로 턴이 돌았다*는 것을 보여 준다.

**재현 (결정적 절차)** — `command grep '"model":"claude-fable-5"'` 만으로는 부족하다.
이 사례에서도 같은 패턴이 165~169행을 함께 반환했다(시스템 프롬프트의 모델 ID 목록 등이 걸린다).
`advisor` 호출 엔트리를 특정하려면 아래처럼 JSON 조건으로 거른다:

```bash
F=~/.claude/projects/-Users-younghwankang-WORK-WORKSPACE-KiiPS/<session-id>.jsonl
jq -c 'select([.message.usage.iterations[]? | select(.type == "advisor_message")] | length > 0)
       | {advisorModel,
          mainModel: .message.model,
          advisorIter: [.message.usage.iterations[]?
                        | select(.type == "advisor_message")
                        | {model, input_tokens, output_tokens}]}' "$F" | sort -u
```

⚠ `select(.advisorModel != null)` 로 거르면 **안 된다** — 그 필드는 advisor 를 호출하지 않은 엔트리에도
전부 찍힌다(본 세션 실측 **141행**, 세션이 길어질수록 증가). 위처럼 **`advisor_message` 항목 보유**를
조건으로 걸어야 결정적이다(실측 매칭 5행 → `sort -u` 후 1줄).

기대 출력(본 감사 실측, `sort -u` 후 **1줄**):

```json
{"advisorModel":"claude-fable-5","mainModel":"claude-opus-5",
 "advisorIter":[{"model":"claude-fable-5","input_tokens":115778,"output_tokens":7147}]}
```

`jq` 를 쓰므로 JSON 공백·키 순서 변화에 영향받지 않는다. 매칭 엔트리는 5건이지만 스트리밍 부분 기록이라
내용은 동일하다(같은 `message.id`). 실측 세션 ID: `5af6f873-21be-416d-bed9-b1bd8399ab59`(해당 엔트리 169행).

**근거의 범위(과잉 일반화 금지)** — 위는 **재시작 직후 세션의 advisor 호출 1건**에 대한 관측이다.
이로써 "`advisorModel` 키가 무시된다 / `fable` 별칭이 안 풀린다"는 가설은 **반증**되었다(종결 근거로 충분).
반면 "모든 세션·모드에서 항상 이렇게 해석된다"는 **이 관측만으로는 보증되지 않는다** — 설정을 바꿨을 때는
같은 절차로 다시 확인할 것.

되돌리기: `advisorModel` → `"opus"`, 또는 `env.ANTHROPIC_DEFAULT_FABLE_MODEL="claude-opus-5"` 복원.
백업: `~/.claude/settings.json.bak.20260820-advisormodel`.
