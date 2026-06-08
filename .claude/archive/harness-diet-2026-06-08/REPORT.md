# 🥗 harness-diet 적용 리포트 — 2026-06-08

> harness-legacy-scan 리포트 기반 **보수적·가역 low-risk 개선만** 적용.
> 적용 전 원본은 `.claude/archive/harness-diet-2026-06-08/originals/` 에 백업, 전부 git 추적 → 완전 가역.
> 독립 검증 통과: `.claude/scripts/verify_diet.py` EXIT 0 (보존 누락 0 / frontmatter 불변 / 도달성 OK).

## 1. 변경한 파일 목록 (6개)

| 구분 | 파일 | 변경 |
|------|------|------|
| 수정 | `.claude/rules/svn-workflow.md` | 38→15줄 (−23) |
| 수정 | `.claude/skills/kiips-checklist-list-popup/SKILL.md` | 407→129줄 (+9 −287) |
| 신규 | `.claude/skills/kiips-checklist-list-popup/examples.md` | 250줄 (코드 이관) |
| 신규 | `.claude/skills/kiips-checklist-list-popup/reference.md` | 39줄 (참조표 이관) |
| 수정 | `.claude/skills/kiips-frontend-guidelines/SKILL.md` | 310→267줄 (+5 −48) |
| 신규 | `.claude/skills/kiips-frontend-guidelines/reference.md` | 54줄 (다크모드 이관) |

**무변경 확인**: hooks / settings.json / settings.local.json / mcp.json / CLAUDE.md / skills-registry.json — 전부 손대지 않음.

## 2. 파일별 변경 이유

- **svn-workflow.md (P10)** — 매 세션 전역 로드되는 룰. `svn up/status/diff/commit/revert` 명령어 표(L11-21)와 커밋 메시지 규칙 블록(L23-32)은 표준 SVN 일반지식이라 always-on 보유가 컨텍스트 낭비. 핵심 안전장치(Git 아닌 SVN / `app-local.properties` 커밋 금지 / 프로덕션 설정 확인)만 보존. *adversarial이 정확히 이 라인을 지정(uphold).*
- **kiips-checklist-list-popup (P17)** — 407줄로 300줄 SPLIT 임계 초과. HTML 템플릿(§3)·이벤트 핸들러 코드(§5)는 `examples.md`로, API 네이밍(§6)·결재상태 매트릭스(§7)·유형 카탈로그(§8)는 `reference.md`로 이관. SKILL.md엔 의사결정 콘텐츠(언제 사용·구조·컬럼 규칙·금지사항)만 남김. "사용하지 말아야 할 때" 본문 섹션 추가로 비-체크리스트 팝업 오발동 억제.
- **kiips-frontend-guidelines (P49)** — 310줄. 다크모드 자동연동 섹션(이미 kiips-scss에 위임된 내용)만 `reference.md`로 이관(clean whole-section). 폼 컴포넌트 절대 규칙(CRITICAL)·AJAX·XSS 등 핵심은 SKILL.md 유지. "사용하지 말아야 할 때" 섹션으로 그리드/검색/모달/버튼 전용 스킬로 유도.

## 3. Before / After 요약

| 스킬/룰 | Before | After (SKILL.md 본문) | 보조파일 |
|---------|--------|----------------------|----------|
| svn-workflow.md | 38줄 (표+커밋규칙 포함) | 15줄 (핵심 원칙만) | — |
| checklist-list-popup | 407줄 단일 | 129줄 (의사결정) | examples 250 + reference 39 |
| frontend-guidelines | 310줄 단일 | 267줄 (핵심 규칙) | reference 54 (다크모드) |

- **트리거(frontmatter description) 전부 불변** → 스킬 발동성 변화 없음(보수적 선택).
- 콘텐츠 보존 독립검증: 원본 모든 non-blank 라인이 결과 파일 합본에 1:1 존재(P17 326/326, P49 228/228, 누락 0).

## 4. diff 요약

```
.claude/rules/svn-workflow.md                       +0  -23   (표 7행 + 커밋규칙 블록 삭제)
.claude/skills/kiips-checklist-list-popup/SKILL.md  +9  -287  (5개 섹션 이관 + 링크/NOT-for 추가)
.claude/skills/kiips-frontend-guidelines/SKILL.md   +5  -48   (다크모드 섹션 이관 + 링크/NOT-for 추가)
+ examples.md(250) reference.md(39) reference.md(54)  신규 3종
```
순 효과: 항상 로드되는 표면적이 svn룰 −23줄 + (스킬 발동 시) 본문 −278/−43줄 축소. 상세는 필요 시 링크로 1-hop 조회.

## 5. Claude의 행동이 어떻게 달라질 수 있는가

- **SVN 룰**: 매 세션 토큰 세금 감소. SVN-우선·app-local 금지·프로덕션 확인은 그대로 강제 — 안전성 동일, 장황함만 제거.
- **checklist-popup 스킬**: 발동 시 129줄 핵심만 먼저 로드 → 더 빠른 판단. HTML/이벤트 코드가 필요하면 `관련 파일` 링크로 examples.md를, 결재상태/API는 reference.md를 읽음. "사용하지 말아야 할 때" 덕에 일반 그리드 팝업엔 덜 잘못 적용.
- **frontend-guidelines 스킬**: 폼/AJAX/XSS 핵심은 즉시, 다크모드 상세는 필요 시 reference.md로. 구체 컴포넌트는 전용 스킬(realgrid/search-filter/regist-modal/button/scss)로 유도.
- **발동성 위험 없음**: description 미변경이라 동일 키워드에 동일하게 발동. "필요할 때 안 뜰" 리스크 없음(트리거 좁히기를 이번에 제외한 이유).

## 6. 아직 사람이 승인해야 하는 high-risk 항목 (이번에 적용 안 함)

| 항목 | 대상 | 왜 보류 |
|------|------|---------|
| P20 | kiips-button-guide | "icon_filter stale" 전제 **거짓**(JSP에서 실사용) — 삭제 전 sonnet 주장 재검증 필요 |
| P23 | kiips-test-runner | dead stopEvent 제거가 `skills-registry.json` L1007/L1048까지 동기화 필요(registry는 이번 범위 외) |
| P1/P7/P8/P9 | rules MOVE (power-stack/dark-theme/validation/error-handling → Skill) | always-on→on-demand는 행동 변화 大, 신규 스킬 생성 필요, adversarial downgrade |
| P11 | CLAUDE.md 축소 | 중심 파일 + placeholder는 의도적 템플릿(adversarial)이라 하드코딩 금지 |
| P14/P47/P51 | CONVERT (checklist→TodoWrite, db-inspector/mybatis-guide MyBatis→JdbcTemplate 재작성) | 전면 재작성, 정확성 검증 필수 |
| P26 | Gemini 스택 제거 | sunset(2026-06-18) 전까지 독립벤더 차단게이트=defense-in-depth 유지(adversarial) |
| P30/P37/P36/P44 | settings 권한·permissionRules | hooks/권한 영역 — 금지 + 사람 승인 |
| P24/P57 | security-reviewer / security-guide | 보안 도메인 — 사람 검증 |
| .min.js 4종 | hooks/*.min.js | 미사용 중복(저위험)이나 hooks 디렉토리라 이번 범위 제외 |
| 트리거 좁히기 | checklist-popup/frontend-guidelines description | 사용자가 보수적 선택 — 행동변화라 별도 승인 |

## 7. 새 하네스 검증용 smoke-test 프롬프트 5개

1. **SVN 안전장치 생존** — "방금 변경을 커밋해줘" → git이 아닌 **svn** 안내 + `app-local.properties` 커밋 금지 경고가 떠야 함.
2. **checklist-popup 발동 + 보조파일 조회** — "체크리스트 목록 조회 팝업 만들어줘 (작성일/작성자/결재 컬럼)" → 스킬 발동 후 HTML/이벤트 코드가 필요할 때 `examples.md`를, 결재상태 처리는 `reference.md`를 읽는지.
3. **checklist NOT-for 작동** — "체크리스트와 무관한 단순 목록 팝업 하나 만들어줘" → checklist-list-popup으로 잘못 끌려가지 않고 kiips-realgrid-guide/kiips-regist-modal-guide로 가는지.
4. **frontend reference 도달** — "다크모드까지 대응하는 공통 입력 폼 JSP 만들어줘" → frontend-guidelines 발동 후 다크모드 규칙을 `reference.md`에서 가져오는지(본문엔 링크만).
5. **frontend NOT-for 유도** — "이 페이지에 RealGrid 그리드 추가해줘" → frontend-guidelines가 아니라 kiips-realgrid-guide를 우선 선택하는지.

## 되돌리기

```bash
# 개별 복원 (원본은 archive에 보존)
cp .claude/archive/harness-diet-2026-06-08/originals/rules/svn-workflow.md .claude/rules/
cp .claude/archive/harness-diet-2026-06-08/originals/skills/kiips-checklist-list-popup/SKILL.md .claude/skills/kiips-checklist-list-popup/
cp .claude/archive/harness-diet-2026-06-08/originals/skills/kiips-frontend-guidelines/SKILL.md .claude/skills/kiips-frontend-guidelines/
rm .claude/skills/kiips-checklist-list-popup/examples.md .claude/skills/kiips-checklist-list-popup/reference.md .claude/skills/kiips-frontend-guidelines/reference.md
# 또는 git: git checkout -- <files> && (신규파일 수동 삭제)
```
