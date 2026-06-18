# KiiPS Page Harness — 실행 레퍼런스

> 오케스트레이터가 참조하는 실행 상세 가이드

---

## Part 1: 오케스트레이터 구현 패턴

### Agent 도구를 사용한 실제 호출

```javascript
// 단계 1: Planner
Agent({
  subagent_type: "Plan",
  description: "Plan page structure",
  prompt: `[Planner 프롬프트 - SKILL.md 참조]`
});

// 단계 2: Generator
Agent({
  subagent_type: "KiiPS Developer",
  description: "Generate JSP page files",
  prompt: `[Generator 프롬프트 - SKILL.md 참조]`
});

// 단계 3: Evaluator (반드시 별도 에이전트)
Agent({
  subagent_type: "verify-agent",
  description: "QA evaluate generated page",
  prompt: `[Evaluator 프롬프트 - SKILL.md 참조]`
});
```

### 판정 분기 로직

```
QA_REPORT.md 읽기
  → "합격" 포함? → 완료 보고
  → "조건부 합격" 또는 "불합격" 포함?
    → 현재 라운드 < 3? → Generator 재호출 (피드백 반영 프롬프트)
    → 현재 라운드 = 3? → 현재 상태로 전달 + 미해결 이슈 보고
```

---

## Part 2: 실행 예시

### 예시 1: 펀드 목록 페이지

**입력**: "PG0601 펀드 목록 페이지 만들어줘"

**Planner 출력 (PAGE_SPEC.md)**:
```markdown
# PG0601 펀드 목록

## 개요
펀드 관리 도메인의 목록 조회 페이지. 펀드 기본정보 검색/조회/엑셀 다운로드.

## 파일 구조
- KiiPS-UI/.../jsp/kiips/fd/PG0601_P.jsp (메인)
- KiiPS-UI/.../jsp/kiips/fd/PG0601/inc_filter_main.jsp (검색)
- KiiPS-UI/.../jsp/kiips/fd/PG0601/inc_main_button.jsp (버튼)
- KiiPS-UI/.../jsp/kiips/fd/PG0601/inc_grid_main.jsp (그리드)

## 검색 조건
| 필드명 | 타입 | 라벨 |
|--------|------|------|
| FUND_CD | text | 펀드코드 |
| FUND_NM | text | 펀드명 |
| FUND_TP | select | 펀드유형 |
| USE_YN | select | 사용여부 |

## 그리드 컬럼
| 컬럼 | 필드명 | 너비 | 에디터 |
|------|--------|------|--------|
| 펀드코드 | FUND_CD | 120 | - |
| 펀드명 | FUND_NM | 200 | - |
| 펀드유형 | FUND_TP_NM | 100 | - |
| 설정일 | SET_DT | 100 | - |
| 사용여부 | USE_YN | 80 | - |

## 기능 목록
1. 펀드 목록 조회 (검색조건 연동)
2. 엑셀 다운로드
3. 신규 등록 (모달)
4. 상세 조회 (행 더블클릭)
5. 페이징
```

**Evaluator 출력 (QA_REPORT.md)**:
```markdown
## QA Report

**전체 판정**: 조건부 합격
**가중 점수**: 6.8 / 10.0
**라운드**: R1

### 항목별 점수

| 항목 | 점수 | 코멘트 |
|------|------|--------|
| 패턴 준수 (40%) | 7/10 | Include 체계 정상, Lookup 초기화 누락 |
| 기능 완성도 (30%) | 7/10 | CRUD 동작, 엑셀 미구현 |
| 접근성/반응형 (15%) | 6/10 | 검색 입력에 aria-label 누락 3건 |
| 보안 (15%) | 8/10 | #{} 사용, Controller 검증 존재 |

### 구체적 개선 지시

1. **[WHERE]** `inc_filter_main.jsp:15,23,31` — **[WHY]** WCAG 2.1 AA aria-label 필수 — **[HOW]** 각 input에 `aria-label="펀드코드"` 등 추가
2. **[WHERE]** `PG0601_P.jsp:initPage()` — **[WHY]** kiips-search-filter-guide Lookup 초기화 패턴 — **[HOW]** `initLookup('FUND_TP', '/api/common/code/FD001')` 추가
3. **[WHERE]** `inc_main_button.jsp` — **[WHY]** 엑셀 버튼 미구현 — **[HOW]** `btn_excel` 추가 + `exportGrid(gridView, '펀드목록')` 연동

### 안티패턴 발견
- 없음

### 방향 판단
[현재 방향 유지] — 구조 양호, 세부 보완 필요
```

---

## Part 3: Harness 원본과의 차이점

| 항목 | Harness 원본 | KiiPS 적응 |
|------|-------------|-----------|
| 생성 대상 | 단일 HTML 파일 | JSP + inc 파일 4개 세트 |
| 평가 기준 | 디자인 40% + 독창성 30% | 패턴 준수 40% + 기능 완성도 30% |
| Agent 분리 | Task 도구 사용 | Agent 도구 + subagent_type |
| 피드백 형식 | 자유 형식 | WHERE/WHY/HOW 3요소 필수 |
| 최대 반복 | 3회 | 2회 (R3까지, Ralph Loop 연동) |
| 안티패턴 | AI Slop (보라색 그라데이션) | KiiPS Anti-Slop (인라인 style, raw ajax) |
| 자체 점검 | SELF_CHECK.md | SELF_CHECK.md (동일) |
| 외부 평가 | 없음 | Gemini Auto-Reviewer 병행 |

---

## Part 4: 에러 처리

### 에이전트 실패 시

| 실패 상황 | 조치 |
|----------|------|
| Planner가 PAGE_SPEC.md 미생성 | 사용자에게 보고, 수동 기획 제안 |
| Generator 파일 생성 실패 | 에러 로그 확인 → 재시도 1회 |
| Evaluator 채점 형식 위반 | 재호출 (형식 강조 프롬프트) |
| R3 후에도 불합격 | 현재 상태 전달 + 미해결 이슈 목록 |

### Ralph Loop 연동

Page Harness의 R3 = Ralph Loop의 3회 임계값과 동일.
R3 후 불합격 시 자동으로 Anti-Rationalization 프로토콜 발동:
1. HALT — 생성 중단
2. REPORT — 상황 보고
3. 사용자 판단 대기

---

## Part 5: CLAUDE.md 등록

이 스킬을 Active Skills에 추가:

```markdown
| `kiips-page-harness` | 페이지 자동 생성 하네스 (Plan→Generate→Evaluate 파이프라인) |
```

---

**버전**: 1.0.0
**기반**: Harness Engineering 3-Agent Pipeline
