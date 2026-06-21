# Harness Legacy Scan — Adversarial 재검증 (2026-06-21)

> 2026-06-20 감사(`harness-legacy-scan-2026-06-20.md`)에서 **세션 한도로 검증이 끊긴 22건**을
> 적대적으로 재검증한 결과. **read-only — 어떤 하네스 파일도 수정하지 않음.**
> 실행: adversarial 전용 워크플로우(Run `wf_11257612-9a6`, 22 skeptic 에이전트, Opus, ~11분, 완주 22/22).
> 각 skeptic이 인용 파일을 **실제로 Read/Grep으로 재독**하고 evidence를 명령으로 재현하여 판정.

## 배경 — 왜 재검증인가
원 감사의 adversarial은 18/40만 완료됐고(세션 한도), 그중 **78%가 강등/기각**됐다. 즉 raw 권고가
체계적으로 과도했다. 검증이 끊긴 22건을 같은 기준으로 마저 검증했다.

> 참고: 2026-06-21 07:10 KST cloud 루틴(`trig_01R9...`)이 같은 작업을 시도했으나 **PR 생성에 실패**
> (cloud 환경 git push 권한). 그래서 한도 리셋 후 로컬 세션(Opus, git 정상)에서 재실행하여 완주.

---

## verdict 분포

| verdict | 건수 | 의미 |
|---------|------|------|
| **uphold** | 8 | 권고 정확·적정 — 신뢰 가능 |
| **downgrade** | 10 | 방향은 맞으나 과함 → 더 보수적 조치 |
| **reject** | 4 | 권고가 틀렸거나 위험 → 하지 말 것 |

**원 감사 권고의 부정확률(downgrade+reject) = 14/22 = 64%** — 1차 18건의 78%와 일관되게, raw Plan은
실행 명령서로 부적합함이 재확인됐다.

---

## 전체 verdict 표

| id | path | 원권고 | verdict | 안전 조치 |
|----|------|--------|---------|----------|
| P29 | `_global-seed/memory/project_antigravity_migration.md` + GEMINI.md 2종 | SHRINK | ✅ uphold | SHRINK |
| P34 | `settings.json` permissionRules array | SHRINK | ✅ uphold | SHRINK |
| P35 | `settings.local.json` permissions.allow + sandbox | SHRINK | ⬇ downgrade | **KEEP** |
| P37 | `settings.json` 인라인 python3 시크릿 차단 훅 | MOVE | ❌ **reject** | **KEEP** |
| P40 | `hooks/*.min.js` (10개) | DELETE | ✅ uphold | DELETE |
| P41 | `skills/kiips-learning/SKILL.md` | SHRINK | ❌ **reject** | **KEEP** |
| P42 | `skills/kiips-backend/SKILL.md` | SHRINK | ✅ uphold | SHRINK |
| P43 | `skills/kiips-build/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** |
| P44 | `skills/kiips-db-inspector/SKILL.md` | SHRINK | ✅ uphold | SHRINK |
| P45 | `skills/kiips-db-inspector/reference.md` | CONVERT | ✅ uphold | CONVERT |
| P46 | `skills/kiips-mybatis-guide/SKILL.md` | SPLIT | ⬇ downgrade | SHRINK |
| P47 | `skills/kiips-feature-planner/SKILL.md` | SHRINK | ✅ uphold | SHRINK |
| P48 | `skills/kiips-frontend-guidelines/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** |
| P49 | `skills/kiips-linked-approval-template/SKILL.md` | SPLIT | ⬇ downgrade | SHRINK |
| P50 | `skills/kiips-logs/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** (1줄 FIX) |
| P51 | `skills/kiips-operator-onboarding/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** (포맷 FIX) |
| P52 | `skills/kiips-orchestration/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** |
| P55 | `skills/kiips-regist-modal-guide/SKILL.md` | SHRINK | ❌ **reject** | **KEEP** |
| P60 | `skills/kiips-security-guide/SKILL.md` | SHRINK | ❌ **reject** | **KEEP** |
| P61 | `skills/kiips-stitch-bridge/SKILL.md` | SHRINK | ✅ uphold | SHRINK |
| P62 | `skills/kiips-test-runner/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** |
| P63 | `skills/legacy-compliance-checker/SKILL.md` | SHRINK | ⬇ downgrade | **KEEP** |

---

## ✅ 신뢰 가능 — uphold 8건 (실행 후보)

> 모두 skeptic이 evidence를 실제 명령으로 재현하여 사실 확인. 단, 실제 적용 시 항목별 검증은 필수.

- **P29** *(SHRINK)* — Gemini 스택 완전 제거 확인(`find gemini-bridge*`=0, hooks/settings 참조 0).
  seed 메모가 없는 `gemini-bridge.js`를 "절대 제거 금지"로 보호 + 폐기된 5-Phase 플랜을 future 세션에
  지시 → 오도. **추가 발견**: `setup.sh:52`가 seed 메모를 신규직원 auto-memory로 전파(실害 경로).
- **P40** *(DELETE)* — `hooks/*.min.js` 10개가 settings.json·require 어디서도 미참조(grep 0건 재현).
  단일행 미니파이(비어있지 않음, 7~11KB)지만 동작하지 않는 orphan. ⚠️ 보안 훅 사본이라 적용 시 사람 확인.
- **P42** *(SHRINK)* — `BusinessException` 클래스 부재 확인(실제 `AppException` 등 `KiiPS-UTILS/.../exception/`).
  SKILL 예제(@Autowired 필드주입+Map)가 실코드(생성자주입+typed VO+ApiResultBean)와 불일치.
- **P44** *(SHRINK)* — mapper XML 0개 재확인. SKILL L9가 "mapper XML 안 씀" 자인하면서 본문 60%가
  mapper XML 분석 — 자기모순.
- **P45** *(CONVERT)* — `reference.md` 195줄 전량이 존재하지 않는 mapper XML 전제. inline SQL DAO
  탐색법 0줄 → inline SQL DAO 가이드로 전면 재작성.
- **P47** *(SHRINK)* — Related Skills에 `kiips-build` 3회 복붙(grep -c=3 재현). ⚠️ 단 감사의 *수정안*
  (대체 스킬명 추정)은 부정확하니 적용 시 실제 의도 확인 필요.
- **P61** *(SHRINK)* — `kiips-stitch-bridge` L25 진입점 `mcp__pencil__open_document`가 Pencil MCP에
  부재(실제 첫 호출은 `get_editor_state`). 잘못 호출 시 스킬 즉시 실패 → 1줄 수정.
- **P34** *(SHRINK)* — `permissionRules`는 비공식 키로 inert(permissionGate.js L79 주석 확인). deny
  의도는 native sandbox + ethicalValidator + permissionGate 3중 중복. ⚠️ 권한 영역이라 신중히.

> uphold 중 **가장 안전·고가치**: P29(죽은 Gemini 잔재), P61(1줄 버그 수정), P42·P44·P45(mapper XML
> stale 콘텐츠). P40·P34는 보안/권한 표면이라 적용 시 추가 확인 권장.

---

## ❌ reject 4건 — 하지 말 것

- **P37** *(MOVE→reject)* — 감사가 "중복"이라 본 두 시크릿 가드는 실은 **상보 관계**:
  permissionGate `SECRET_FILE_PATTERNS`는 **Read/Grep**만, 인라인 python3는 **Edit/Write**만 차단
  (코드 주석이 분담을 자기문서화). 권고대로 통합하면 **Edit/Write 시크릿 파일(.env/.git//credentials
  등) 보호에 구멍** → 보안 회귀.
- **P41** *(SHRINK→reject)* — 감사 핵심 주장("SKILL이 4 command 목차 역할")이 **거짓**: `commands/`
  하위폴더 미존재, SKILL은 고유 콘텐츠(Instinct YAML 스키마 등) 보유. 잘못된 전제.
- **P55** *(SHRINK→reject)* — 두 주장(Part 번호 갭, 과광범위 트리거) 사실이나 SHRINK로는 **고칠 수
  없음**(번호 갭은 재번호 = 추가 작업; SHRINK는 반대 방향). 처방-진단 불일치.
- **P60** *(SHRINK→reject)* — 280줄<300이라 워크플로우 자체 SPLIT 임계값 미발화("93%"는 선제 표현).
  `disable-model-invocation` 부재는 정상(보안 가이드는 인증 작업 시 자동 트리거돼야 함).

---

## ⬇ downgrade 10건 — 대부분 KEEP

원 SHRINK/SPLIT 권고가 과도. 주요 패턴:
- **enum 미스매치형 (KEEP+FIX)**: P50(한 줄 경로 오타 `KiiPS-COMMON-SERVICE`→`KiiPS-COMMON`),
  P51(캐시버스팅 포맷 표기 오류 8자리→실제 6자리). **분량 축소(SHRINK)가 아니라 1줄 수정 대상**인데
  enum에 FIX가 없어 SHRINK로 끼워맞춤. → 작은 정정만 하면 됨.
- **오독형 (KEEP)**: P43 — 감사 대표 근거 "복사 즉시 실패"가 **주석 처리된 예시**(`# cd ... -pl
  :KiiPS-SERVICE`)이고 `:KiiPS-SERVICE`는 프로젝트 전역 플레이스홀더. 실행 코드 아님.
- **컨텍스트세 0 (KEEP)**: P52·P62 — `disable-model-invocation: true`라 always-load 비용 없음.
  과거 기록/미구현 로드맵이 noise지만 제거 이득 미미.
- **방향 오류 (KEEP)**: P35 — "allow가 deny를 무력화" 주장이 거짓(작동하는 deny 룰 자체가 없음).
  P48 — NOT-for 경계가 이미 오트리거 방지. P63 — 잘못된 아티팩트 타겟(skill-rules.json이 정밀 트리거 담당).
- **SPLIT→SHRINK**: P46(mapper XML stale은 맞으나 통째 분리는 과함), P49(Step6은 필수 자동실행
  단계라 통째 이동 부적절).

---

## 다음 단계 (권장)

1. **P29 + P61** 우선 적용 — 가장 안전(죽은 Gemini 잔재 / 1줄 버그). 각각 적용 후 검증.
2. **P42·P44·P45·P46** — mapper XML stale 콘텐츠 정리(이 코드베이스가 안 쓰는 패턴을 가르침).
   inline SQL DAO 현실로 교정. (한 묶음으로 처리 가능)
3. **P50·P51** — 1줄 FIX(경로·포맷 오타). SHRINK 아님.
4. **P40·P34** — 보안/권한 표면. 별도 신중 검토 후 적용.
5. **reject 4건(P37·P41·P55·P60)** — 적용 금지. 특히 P37은 적용 시 보안 회귀.
6. downgrade 중 KEEP 판정은 현행 유지.

> 이 리포트는 판정만 담는다. 실제 파일 수정은 항목별로 사람 승인 후 진행하며, 각 적용 후 회귀 테스트
> (`bash .claude/tests/hook-regression.sh`)와 catalog-integrity로 검증한다.

---

*생성: 2026-06-21 · adversarial 재검증 22/22 완주 · Run wf_11257612-9a6 · read-only*
