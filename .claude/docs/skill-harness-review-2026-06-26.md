# KiiPS 스킬 하네스 강화 검토 리포트 (2026-06-26)

> 멀티 에이전트 워크플로우(`kiips-skill-harness-review`, run `wf_02dc7403-4de`)로 `.claude/skills/` 전체 27개 스킬을
> `superpowers:writing-skills` 표준 루브릭에 대조 검토. **이 리포트는 검토 결과(데이터)이며, 어떤 스킬 파일도 수정하지 않았습니다.**
> 실제 편집은 사용자 승인 후 별도 후속 작업으로 진행합니다 (3+파일 → `multiFileGate` 게이트 + 반합리화 규칙).

---

## 0. 실행 상태 (정직성 고지)

워크플로우가 **세션 토큰 한도(4:10am Asia/Seoul 리셋)에 도달해 부분 완료**되었습니다.

| 단계 | 계획 | 완료 | 미완 |
|------|------|------|------|
| Review (스킬별) | 27 | **26** | `kiips-ui-component-builder` 1건 (파일 정상, 리뷰만 누락) |
| Verify (적대적 재검증) | drift 있는 스킬 | 대부분 | 4건 실패 → **리포터가 Bash로 직접 재검증 완료** (§4) |
| Portfolio (registry·consistency·collision·overlap) | 4 | **0** | 전부 실패 → registry는 직접 확정, overlap/collision은 self-report 기반(중간 신뢰도) |

소비: 47 에이전트 · 2.49M 토큰 · 10.5분 · 315 도구호출.

### 신뢰도 등급 표기
- 🟢 **HIGH** — fresh-context 적대검증 통과 OR 리포터가 Bash로 직접 재확인.
- 🟡 **MEDIUM** — 단일 리뷰어 self-report, 독립검증 미통과 (과거 KiiPS 감사에서 raw 발견의 ~78%가 재검증 시 강등됨 → 그대로 신뢰 금지).
- ⚪ **DESIGN** — 결함이 아니라 사용자 판단이 필요한 설계 선택.

---

## 1. 한눈에 보기 — 등급 분포

| 등급 | 수 | 스킬 |
|------|----|------|
| **A** | 5 | kiips-button-guide, kiips-checklist-list-popup, kiips-db-inspector, kiips-frontend-guidelines, kiips-mybatis-guide |
| **B** | 14 | kiips-backend, kiips-feature-planner, kiips-learning, kiips-linked-approval-template, kiips-operator-onboarding, kiips-orchestration, kiips-page-harness, kiips-page-pattern-guide, kiips-realgrid-guide, kiips-regist-modal-guide, kiips-scss, kiips-search-filter-guide, kiips-test-runner, legacy-compliance-checker |
| **C** | 6 | code-simplifier, kiips-build, kiips-logs, kiips-quality, **kiips-security-guide**, kiips-stitch-bridge |
| **D** | 1 | **checklist-generator** |
| 미검토 | 1 | kiips-ui-component-builder |

**가장 시급한 3개**: `checklist-generator`(D) · `kiips-security-guide`(C) · `kiips-stitch-bridge`(C) — 셋 다 **KiiPS에 존재하지 않는 패턴을 가르치는 사실 오류(drift)**가 다수.

---

## 2. 핵심 결론 (3줄)

1. **하네스의 가장 큰 약점은 "사실 오류(drift)"** — 스킬이 인용하는 파일/클래스/포트/DB/SCSS변수가 실제 코드베이스와 어긋남. 트리거링·구조는 대체로 양호하나, 정확성이 평균을 끌어내림.
2. **트리거링 자체는 건강** — 11개 `disable-model-invocation` 스킬도 KiiPS 커스텀 훅(`skill-rules.json`) 채널로 정상 surface됨 (리뷰어의 "inert" 주장은 정정됨, §5).
3. **집-스타일 일관성 격차** — gold standard의 `Use when: + NOT for:(use X)` 패턴을 12개+ 스킬이 미적용 → 충돌/오발동 위험.
   - 형식 앵커: **kiips-frontend-guidelines (검증된 A)** + button-guide·db-inspector·mybatis-guide·checklist-list-popup(검증된 A).
   - kiips-ui-component-builder는 **구조/description 형식이 모범적임을 리포터가 직접 확인**(Use when+NOT for, canonical 헤딩)했으나 **정확성(drift)은 이번에 미채점**(리뷰 에이전트 사망, §11) — 형식 앵커로만 사용.

---

## 3. P0 — 사실 오류(검증된 drift) 🟢 HIGH

> 모두 리포터가 `grep`/`find`로 직접 재확인했거나 완료된 verify에서 적대검증 통과.
> 효과: 이 스킬을 따르면 에이전트가 **존재하지 않는 레이어/파일/설정을 검증·생성하려 시도**함.

### P0-1. `checklist-generator` [D] — 6건 사실 오류 (8/8 검증 통과)
| 인용 | 실측 |
|------|------|
| MyBatis `#{}` 바인딩 (L21) | `.java` 7,368개 중 `#{}` 0건. inline StringBuffer SQL만 |
| "DAO 통합 테스트 (MyBatis mapper)" (L34) | `*Mapper.xml` 0건 |
| GlobalExceptionHandler (L22) | `.java`에 0건 (문서에만 등장) |
| @PreAuthorize (L23) | `.java`에 0건 |
| /actuator/health (L29) | properties/yml에 0건 |
| FundController.java:45 (L49) | 파일 없음. 실제는 `FundAPIController.java` |
→ **조치**: MyBatis 표현을 inline DAO + `${}` 회피로 교체, 4개 미존재 인용 제거/정정.

### P0-2. `kiips-security-guide` [C] — KiiPS 보안 스킬이 사실상 "제네릭 Spring Security"
| 스킬이 "필수"로 가르침 | 실측 (리포터 직접 grep) |
|------|------|
| MyBatis `#{}` / mapper.xml = SQL Injection 방어 | mapper.xml 0건 |
| jasypt `ENC()` 암호화 필수 | jasypt 의존성/사용 0건 |
| @PreAuthorize / hasPermission 권한검증 | 둘 다 `.java` 0건 |
| `_csrf` JSP 토큰 / CookieCsrfTokenRepository | 둘 다 0건 (실제 config는 `csrf().disable()` + `permitAll`) |
→ KiiPS 실제 인증은 **Gateway JWT + 화면ID 기반 ScreenAuth**인데 스킬은 이를 전혀 반영 안 함.
→ **조치**: SQL은 kiips-mybatis-guide로 위임, jasypt는 "권고(미도입)"로 강등, 인증 섹션을 실제 ScreenAuth 구조로 재작성하거나 미사용 API 예제를 "일반 Spring 참고"로 명확히 라벨링.

### P0-3. `kiips-stitch-bridge` [C] — 핵심 복붙 예제가 깨진 페이지를 생성
| 인용 | 실측 |
|------|------|
| `inc_regist_modal.jsp` include | 리포지토리에 없음 |
| `MainComponent.init()` (클라 JS 호출) | 없음. MainComponent는 **서버사이드** Java 태그빌더(`getInstance().SELECT_MULTI()`) |
| `class="grid_wrap" id="mainGrid"` | 0건. 실제는 `<div id="xxxGrid">` |
| SCSS 변수 8종($brand-primary 등) | **전부 미존재**. 실제는 $primarybgColor·$theme-color·$primary-color-hue |
| `.stitch/metadata.json` + `designs/` | 실제는 DESIGN.md·SITE.md만 |
→ **조치**: SCSS 변수표를 실제 변수로 교체(또는 kiips-scss로 위임), JSP 예제의 3개 무효 참조 수정.

### P0-4. `kiips-build` [C] — Pre-flight가 잘못된 DB·포트를 가리킴
- "PostgreSQL 연결 테스트" → 실제 **Oracle (ojdbc6) + OCI SDK** (Tibero 프로파일). 🟢
- PG 서비스 포트 `8301` → 실제 **8501** (8301은 SY). 🟢
→ **조치**: Pre-flight step 1을 Oracle/Tibero로, 모듈 의존성 체인의 PG 포트를 8501로 수정.

### P0-5. `kiips-logs` [C] — 존재하지 않는 로그 경로
- "Common | `KiiPS-COMMON-SERVICE/logs/`" → 실제 **`KiiPS-COMMON/logs/`**. 🟢
→ **조치**: Common 행 경로 수정.

### P0-6. `kiips-scss` [B] — `?ver=` 포맷 규칙이 라이브 코드와 정반대
- 스킬: `YYMMDD_N` 필수, **6자리 no-`_N`을 안티패턴으로 명시**.
- 실측: `header.jsp:85`가 정확히 `?ver=260622` (6자리 no-`_N`) 사용 중. 🟢
→ **조치**: 규칙을 라이브 6자리 포맷으로 정정하거나, `_N` 채택 예정이면 "미마이그레이션" 주석. (그대로 두면 에이전트가 코드베이스가 한 번도 안 쓴 값을 생성)

### P0-7. `kiips-realgrid-guide` [B] — 수치/예제 오류 (경미)
- "전체 24개 렌더러" → common_grid.js 실측 **23개**. 🟢
- IL0920.jsp Pattern 2: 셀 렌더러를 `type:html`로 기술하나 실제 L1293은 `type:"icon"` + `iconCallback` (헤더 템플릿은 일치). 🟡 (라인 단위 재확인 권장)

---

## 4. 리포터 직접 재검증 로그 (verify 실패분 보강)

워크플로우의 verify 에이전트 4건이 세션 한도로 죽어, 그 13개 drift 주장을 리포터가 직접 grep으로 재검증함:

| 스킬 | 주장 | 재검증 결과 |
|------|------|------------|
| security-guide | mapper.xml / jasypt / @PreAuthorize / hasPermission / _csrf / CookieCsrfTokenRepository | **전부 0건 → drift 확정** 🟢 |
| security-guide | server.servlet.session.timeout | properties 접근 제한으로 **미확정** (보수적으로 drift 미판정) ⚪ |
| stitch-bridge | inc_regist_modal.jsp / MainComponent.init() / grid_wrap / 8 SCSS vars / .stitch 구조 | **전부 확정** 🟢 |
| realgrid-guide | renderer 24개 | 실측 23 → **확정** 🟢 |
| legacy-compliance | mapper XML 규칙 적용 가능 여부 | mapper.xml 0건 + `*Dao.java` 1,048개 → **inline DAO 확정, mapper 규칙 moot** 🟢 |

> 주목: 이번 배치는 78% 강등 이력과 달리 **거의 전부 견고**. 대부분 "mapper.xml 부재"류 hard fact라 kiips-mybatis-guide 자체 경고와 교차 확인됨.

---

## 5. ⚪ DESIGN — 정정된 발견 (버그 아님)

### disable-model-invocation "트리거링 무력화" 주장 → 정정
리뷰어들이 kiips-quality·kiips-scss 등에 **HIGH/P0**로 "disable-model-invocation이 키워드 트리거링을 inert하게 만든다"고 보고했으나, **KiiPS에선 부정확**:

- KiiPS는 **이중 채널**:
  1. 네이티브 Skill 도구 자동호출 ← SKILL.md `description` (이건 `disable-model-invocation:true`가 끔)
  2. KiiPS `userPromptSubmit.js` 훅 ← `skill-rules.json` `promptTriggers` → `[Skills]` 힌트 주입 (**disable와 무관**)
- `userPromptSubmit.js:447-460`: disable 스킬은 `!`(호출지시) 접두만 제거되고 **plain 제안으로 여전히 surface**됨. 세션 시작 시 `[Skills] ... kiips-scss ...` 실제 출현으로 확인.
- 따라서 **트리거 투자(키워드)는 죽지 않음**. → 결함 강등.

**남는 진짜 질문 (사용자 판단)**: disable-model-invocation을 가진 11개 집합이 의도적·일관적인가?
`checklist-generator, code-simplifier, kiips-backend, kiips-build, kiips-feature-planner, kiips-learning, kiips-logs, kiips-orchestration, kiips-quality, kiips-scss, kiips-test-runner`
— 이 중 kiips-scss·kiips-backend는 모델이 직접 Skill로 호출하는 게 자연스러워 보임. 재검토 권장 (P2).

---

## 6. P1 — 트리거링 & description 품질

> 🔑 **§5의 이중 채널 귀결 — 트리거링의 1차 산출물은 `description`이 아니라 `skill-rules.json`이다.**
> KiiPS 활성화 경로는 `userPromptSubmit.js → activateSkills() → skill-rules.json.promptTriggers`(`shouldActivateSkill`).
> - 네이티브 Skill-도구 자동호출(= SKILL.md `description`)은 **11개 `disable-model-invocation` 스킬에서 OFF**.
> - 즉 그 11개는 `skill-rules.json`이 **유일한 라이브 활성화 surface**. description만 고치면 트리거링엔 **무효(장식)**.
> - 나머지 16개도 description은 *모델의 수동 판단·사람 가독성*엔 유효하나, 훅 기반 결정적 발동은 여전히 `skill-rules.json`이 결정.
> ⇒ **아래 description 재작성에서 추가/변경한 트리거 키워드는 반드시 `skill-rules.json`의 해당 스킬 `promptTriggers.keywords`(및 필요시 `intentPatterns`)에도 미러링**해야 실제 발동에 반영됨.
> (예: mybatis-guide에 "mybatis/InParameter/? 바인딩", db-inspector에 "JOIN 분석", search-filter에 "createObjectForSearchAjax"를 추가하면 — description뿐 아니라 skill-rules.json에도 넣어야 함.)

### P1-A. description 워크플로우-요약 안티패턴 (5건) 🟢
`description`이 절차를 요약하면 에이전트가 본문을 건너뛰는 "지름길 함정"(writing-skills의 핵심 발견). 해당:
**kiips-checklist-list-popup, kiips-feature-planner, kiips-logs, kiips-operator-onboarding, kiips-realgrid-guide**
→ description은 "언제(트리거)"만 남기고 "무엇/절차"는 본문으로 이동. (§9 재작성안 참고, 기존 키워드 전량 보존)

### P1-B. `NOT for:` 크로스레퍼런스 누락 (집-스타일 격차) 🟡
gold standard(frontend-guidelines·ui-component-builder)는 `NOT for:(use X)`로 형제 스킬과 경계를 명시. 미적용·보강 필요:
checklist-generator, code-simplifier, kiips-backend, kiips-build, kiips-db-inspector, kiips-feature-planner, kiips-linked-approval-template, kiips-mybatis-guide, kiips-operator-onboarding, kiips-orchestration, kiips-quality, kiips-realgrid-guide, kiips-regist-modal-guide, kiips-scss, kiips-search-filter-guide, kiips-security-guide, legacy-compliance-checker
→ §9에 각 스킬별 재작성안 제공 (전부 기존 키워드 보존 확인).

### P1-C. 추가 사실오류 (P0보다 경미) 🟡 (일부 🟢)
| 스킬 | 항목 |
|------|------|
| kiips-search-filter-guide | `검색조건_부서코드`/`MAIN_SEARCH_DEPT_CD` 미존재 상수, common.js 헬퍼명 오기(`fnInitSelectBox` 등 → 실제 `createObjectForSearchAjax`) 🟢 |
| kiips-page-pattern-guide | Related Skills 표의 Part 번호 참조 오류 |
| kiips-test-runner | skipTests를 `<properties>`로 표기, 실제 KiiPS-HUB/pom.xml L112-117은 surefire `<configuration>` 하위 |
| kiips-operator-onboarding | §9 예제의 8자리 `?ver=`(20250318) → 실제 6자리 |
| kiips-page-harness | 완료 리포트 템플릿이 inc_main_button/inc_filter_main을 "생성 파일"로 표기, 실제는 공유 include "편집". 메뉴 DB 등록 누락 경고 필요(없으면 ScreenAuth NPE/500) |
| kiips-learning | `현재 Instinct (13개)` 하드코딩 → `/instinct-status` 포인터로 |
| kiips-backend / kiips-db-inspector / kiips-frontend-guidelines / kiips-quality | 각 1건 (완료 verify 통과) |

### P1-D. registry 수치 drift 🟢
`.claude/README.md`가 **2곳(L33 디렉토리구조, L97 quick-ref)에서 "31 스킬"**로 stale.
실측: dirs 27 / skill-rules.json 27 / skills-registry.json 27 (stats: domain 22 + common 3 + design 2). 개요 테이블만 27로 정확.
→ L33·L97을 27로 정정.

---

## 7. P2 — 구조 / 콘텐츠 다이어트

- **kiips-feature-planner**: 범용 Maven/SVN/testing/troubleshooting 블록(L137-235, 261-283)을 CLAUDE.md·kiips-build·kiips-test-runner로 링크아웃.
- **code-simplifier [C]**: 전략이 이름만 나열, KiiPS 실제 before/after Java 예제 0개 → actionability 2/5. 최소 1개 실예제 추가.
- **canonical 구조 미적용**(Overview→When/NOT-for→Quick Ref 표→Common mistakes): checklist-generator 등 — 점진적 강화.
- disable-model-invocation 11개 집합 일관성 재검토 (§5).

---

## 8. 중복/충돌 클러스터 🟡 MEDIUM

> ⚠️ portfolio collision/overlap 에이전트가 세션 한도로 실패. 아래는 **26개 스킬의 self-report(suspectedOverlaps) 종합**이며 독립 충돌테스트 미실행 → 중간 신뢰도. 단, 처방(=`NOT for:` 크로스레퍼런스 추가)은 클러스터와 무관하게 동일하므로 실행 가치 있음.

| 클러스터 | 멤버 | 위험 |
|----------|------|------|
| **페이지/화면 생성** | page-harness · page-pattern-guide · ui-component-builder · stitch-bridge · feature-planner | "새 화면 만들어줘"에 다수 발동. page-pattern-guide가 8개 중복 자기보고(최광역 scope) |
| **그리드/모달** | realgrid-guide · ui-component-builder · regist-modal-guide · checklist-list-popup | "그리드/모달 추가"에 경합 |
| **품질/빌드/테스트** | checklist-generator · quality · build · test-runner · legacy-compliance-checker | checklist-generator의 제네릭 이름이 오발동 위험 |
| **백엔드/SQL** | backend · db-inspector · mybatis-guide · security-guide | "DAO/SQL"에 경합 |
| (broad parent) | **frontend-guidelines** 가 다수에게 부모로 인용됨 | 의도된 상위 가이드 — 자식들이 NOT-for로 위임하면 해소 |

→ **권장**: 합치기(merge)보다 **각 스킬 description에 `NOT for:(use X)` 추가**로 경계 명시 (§9). 독립 충돌테스트는 세션 리셋 후 재실행 권장(§11).

---

## 9. description 재작성안 부록 (키워드 보존 — 적용 전 diff 필수)

> 워크플로우가 생성한 18개 재작성안. 에이전트는 `keywordsPreserved=true`로 self-report 했으나 — **이는 self-report이며 검증된 사실이 아님**.
> 리포터의 결정적 diff(현재 description 토큰화 → 재작성안 포함 여부)는 **13개 재작성안에서 33개 누락 후보**를 발견:
> - 대부분 양성(서술형 prose 리워딩: 통합/종합/패턴/기반/스킬 등 — 실제 트리거 키워드 아님) + WF-요약 의도적 제거(checklist-list-popup의 더블클릭/상세팝업).
> - ⚠️ **적용 전 개별 diff 필수 건**: `kiips-operator-onboarding`이 `?v=` → `?ver=`로 변경(메모리상 로그인 JSP는 `?v=`, header는 `?ver=` — 혼동 위험), `?v=`/JSP/버전/일괄/처리 등 8토큰 누락.
> - 깨끗(누락 0): code-simplifier, kiips-build, kiips-db-inspector, kiips-learning, kiips-regist-modal-guide, kiips-scss, kiips-search-filter-guide, kiips-security-guide.
> → **각 재작성안은 적용 직전 토큰 diff로 트리거 키워드 보존을 재확인**할 것. 전체 재작성안 전문은 `skill-harness-review-2026-06-26-data.json`(이 디렉토리) 보존. 실제 적용은 §10 승인 후.

**checklist-generator**
`...Use when: checklist, 체크리스트, TODO, todo, task list, verification. NOT for: 빌드 실행(use kiips-build), 테스트 실행(use kiips-test-runner), 품질 종합 점검(use kiips-quality), 레거시 준수 검증(use legacy-compliance-checker)`

**kiips-security-guide**
`...Use when: 인증, 로그인, JWT, 토큰, 비밀번호, 암호화, 세션, 파일업로드 보안, 보안 코드 리뷰. NOT for: SQL 바인딩/Injection 방지(use kiips-mybatis-guide), JSP 폼/AJAX/XSS 표준(use kiips-frontend-guidelines), Spring Boot 일반 보안(use ecc:springboot-security)`

**kiips-realgrid-guide** (WF-요약 제거)
`RealGrid 2.6.3 그리드 생성·설정·에디터·Excel·성능 최적화·체크박스 토글. Use when: RealGrid, 리얼그리드, 그리드, 테이블, 그리드 생성, 그리드 만들어, columnLayout, 멀티레벨 헤더, 셀/헤더 체크박스. NOT for: 신규 페이지 전체(use kiips-page-pattern-guide), 컴포넌트 단건(use kiips-ui-component-builder), 등록/수정 모달(use kiips-regist-modal-guide), 체크리스트 목록 팝업(use kiips-checklist-list-popup)`

*(나머지 15개 재작성안: kiips-backend, kiips-build, kiips-button-guide, kiips-checklist-list-popup, kiips-db-inspector, kiips-feature-planner, kiips-learning, kiips-linked-approval-template, kiips-logs, kiips-mybatis-guide, kiips-operator-onboarding, kiips-quality, kiips-regist-modal-guide, kiips-scss, kiips-search-filter-guide, legacy-compliance-checker — `result-full.json`에 전문 보존)*

---

## 10. 권장 실행 계획 (승인·게이트 인지)

> 27개 스킬 일괄 수정은 `multiFileGate`(3+파일) + 반합리화(요청범위) 규칙에 걸림. **배치 단위로 승인받아 진행** 권장.

| 배치 | 내용 | 파일수 | 우선순위 | 신뢰도 |
|------|------|--------|----------|--------|
| **B1** | P0 사실오류 6종 정정 (checklist-generator, security-guide, stitch-bridge, build, logs, scss) | 6 | 즉시 | 🟢 |
| **B2** | registry drift (README 2곳 27로) | 1 | 즉시(저위험) | 🟢 |
| **B3** | **트리거링 정비** — ① `skill-rules.json` promptTriggers 갱신(**1차 산출물**, §6 callout) + ② description WF-요약 제거·NOT-for 추가 + ③ 적용 직전 토큰 diff로 키워드 보존 재확인 | ~17 SKILL.md + `skill-rules.json` | 다음 | 🟡 (키워드보존 미검증 — diff 필수) |
| **B4** | P1-C 경미 사실오류 (search-filter, page-pattern, test-runner, operator-onboarding, page-harness, learning) | 6 | 다음 | 🟢/🟡 |
| **B5** | P2 구조/다이어트 + disable 집합 재검토 | — | 점진 | ⚪ |

각 배치는 **편집 후 정적 검증만**(앱 로컬 실행 중이라 빌드 불필요 — 메모리 `feedback_no_auto_build_clean` 준수), SCSS 변경 시에만 컴파일 확인.

---

## 11. 세션 리셋 후 재실행할 것 (4:10am+)

1. **누락 리뷰 1건**: `kiips-ui-component-builder` (gold standard로 분류됐으나 실제 검토 안 됨 → 확인 필요).
2. **portfolio 4종 재실행**: registry(✅직접완료)·consistency(desc↔skill-rules 정렬)·**collision test(16개 실프롬프트)**·overlap matrix(적대검증).
3. 재실행은 캐시 활용: `Workflow({scriptPath: ".../kiips-skill-harness-review-wf_02dc7403-4de.js", resumeFromRunId: "wf_02dc7403-4de"})` — 완료된 26 리뷰는 캐시 즉시반환, 실패분만 라이브 재실행.

---

## 12. B1 적용 기록 + 보고서 정정 (2026-06-26, B1 실행 중 발견)

### 🔴 방법론 결함 발견 — `grep -r .` false negative
B1 적용 직전 검증에서 **이 환경의 `grep -rl '패턴' .`(전체 트리)가 false negative를 냄**을 발견:
`grep -rl 'AppException' .` = 0건이나 `grep -rl 'AppException' KiiPS-UTILS` = 14건, 파일은 실재.
(메모리 [[project_kiips_inline_sql_dao]]의 "grep --include 오작동→find+xargs" 함정과 동일.)
⇒ **§3·§4의 일부 "drift(0건)" 판정은 검색 실패였음.** 신뢰 방법은 `find . -name '*.java' | xargs grep -l`.

### ✅ 보고서 정정 — false positive (실재함, drift 아님)
find+xargs 재검증 결과 아래는 **실재하므로 스킬에서 제거하지 않음**:
| 보고서가 drift로 표기한 것 | 실측(find+xargs) | 위치 |
|------|------|------|
| GlobalExceptionHandler (checklist-generator P0) | **2건 실재** | KiiPS-COMMON `com.kiips.common.exception.GlobalExceptionHandler` |
| @ExceptionHandler | 8건 실재 | 다수 |
| CookieCsrfTokenRepository (security-guide) | **1건 실재** | KIIPS-Infra-Admin WebSecurityConfig |
| /actuator/health | 2건 실재 | KIIPS-AI (단, 메인 서비스엔 미구성) |
⇒ checklist-generator의 GlobalExceptionHandler/actuator **보존**. security-guide CSRF는 P0 제외(P1 보류).

### ✅ 재확인된 진짜 drift (find+xargs로 확정)
@PreAuthorize=0, hasPermission=0, jasypt=0, MyBatis `#{`=0, `_csrf`(jsp)=0, mapper.xml=0, inc_regist_modal.jsp=0, grid_wrap=0, MainComponent.init()=0(서버사이드 getInstance만 3561건), SCSS변수 8종=0, **KiiPS-PG=8501·SY=8301**, KiiPS-COMMON/logs, header.jsp 6자리 `?ver=`(250429/260622/250820).

### B1 적용 결과 (5/6 파일, 정적검증 통과)
| 파일 | 변경 | 검증 |
|------|------|------|
| checklist-generator | MyBatis#{}→inline DAO, @PreAuthorize→Auth*예외, FundController→FundAPIController, MyBatis mapper→inline DAO (GlobalExceptionHandler·actuator 보존) | 🟢 grep 0 잔존 |
| kiips-logs | KiiPS-COMMON-SERVICE/logs → KiiPS-COMMON/logs | 🟢 |
| kiips-build | PG(8301)→PG(8501)+SY(8301), PostgreSQL→Oracle/Tibero | 🟢 |
| kiips-stitch-bridge | grid_wrap 제거, inc_regist_modal 제거, MainComponent.init() 제거, SCSS변수표 실변수+kiips-scss위임, .stitch 구조 정정 | 🟢 |
| kiips-security-guide | QR: MyBatis#{}→inline DAO·jasypt→@Value, Part5 jasypt 섹션 "미도입" 정정 (CSRF는 P1 보류) | 🟢 |
| kiips-scss | **사용자 결정=6자리 정정 적용**: `?ver=` 규칙 `YYMMDD_N`→`YYMMDD`(라이브 6자리 일치), 결정트리·예시·안티패턴·L448 일괄 (YYMMDD_N 잔존 0) | 🟢 |

### ✅ B1 파생 후속 — `themeCssVerGuard.sh` 훅 (사용자 승인 후 정정 완료)
scss를 6자리로 정정하면서 발견: 훅 `themeCssVerGuard.sh:30`의 정규식이 `_N`을 강제(`[0-9]{6}_[0-9]+`)해 라이브 `260622`에 미매치 → ver 추출 빈 값으로 **오작동(경고 누락)**.
정정(4곳): 정규식 `[0-9]{6}`, `CURRENT_DATE` 단순화, `NEXT_VER="${TODAY}"`(_0 제거), 메시지·주석 6자리화.
**실행 검증**: `bash -n` OK + 라이브 header.jsp에서 `260622` 추출 확인 + 전체 실행 시 `260622→260626` 경고 정상 출력(수정 전엔 침묵). 테스트 마커 정리 완료.

### ⚠️ 잔존 grep-suspect (B4 전 find+xargs 재검증 필요)
§3-P0-7(realgrid IL0920), §6-P1-C(search-filter 상수·common.js헬퍼, page-pattern Part참조, test-runner XML, page-harness, learning) 및 backend/db-inspector/frontend-guidelines 각 1건은 **grep -r 기반일 수 있어 미정** — B4 착수 전 신뢰 방법으로 재확인할 것.

---

## 부록: 산출물 위치
- 전체 구조화 데이터(26 스킬 × 점수·약점·drift·재작성안 전문): `.claude/docs/skill-harness-review-2026-06-26-data.json` (영구 보관)
- 워크플로우 스크립트: `.../workflows/scripts/kiips-skill-harness-review-wf_02dc7403-4de.js`
- 본 리포트: `.claude/docs/skill-harness-review-2026-06-26.md`
