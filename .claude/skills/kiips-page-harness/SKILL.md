---
name: kiips-page-harness
description: "KiiPS 페이지 자동 생성 하네스 - 1줄 프롬프트로 Plan→Generate→Evaluate 파이프라인 실행. Use when: 페이지 자동 생성, 하네스, harness, 자동 QA, 페이지 파이프라인, 신규 화면 자동"
---

# KiiPS Page Harness (3-Agent Pipeline)

> 1줄 프롬프트 → Planner → Generator → Evaluator → 완성된 페이지
> Harness Engineering 패턴 기반, KiiPS 엔터프라이즈 환경 적응

---

## Purpose

### What This Skill Does
- 1줄 프롬프트로 KiiPS JSP 페이지를 **자동 기획 → 생성 → 평가** 파이프라인 실행
- 3개 분리된 에이전트가 각각 독립 컨텍스트에서 작업 (확인 편향 제거)
- 정량적 QA 채점 (4항목 10점 + 가중 점수)으로 품질 게이트 적용
- 불합격 시 자동 피드백 반영 + 재생성 (최대 2회 재시도)

### What This Skill Does NOT Do
- 기존 페이지 수정/리팩토링 (신규 생성 전용)
- Backend 코드 생성 (Controller/Service/DAO는 별도 스킬)
- 데이터베이스 스키마 변경

### Related Skills

| Skill | 연동 포인트 |
|-------|------------|
| `kiips-page-pattern-guide` | Planner/Generator가 참조하는 페이지 표준 패턴 |
| `kiips-search-filter-guide` | 검색 필터 구성 패턴 |
| `kiips-button-guide` | 버튼 영역 패턴 |
| `kiips-realgrid-guide` | 그리드 생성/설정 패턴 |
| `kiips-regist-modal-guide` | 등록/수정 모달 패턴 |
| `kiips-quality` | Evaluator가 참조하는 접근성/반응형 기준 |
| `kiips-ui-component-builder` | Generator가 사용하는 컴포넌트 템플릿 |

---

## When to Use

### User Prompt Keywords
- "페이지 자동 생성", "하네스", "harness"
- "자동 QA", "파이프라인으로 만들어"
- "1줄로 페이지 만들어", "자동으로 화면 생성"

### Intent Patterns
```
/(자동|하네스|harness|파이프라인).*(생성|만들|page)/
/PG\d{4}.*만들어/
```

---

## 실행 흐름

```
[사용자 프롬프트: "PG0444 펀드 목록 페이지 만들어줘"]
       ↓
  ① Planner 에이전트 (Explore + Plan)
     → PAGE_SPEC.md 생성
     → 기존 유사 페이지 분석, 기능 목록, 파일 구조 설계
       ↓
  ② Generator 에이전트 (KiiPS Developer)
     → JSP + inc 파일 생성 + SELF_CHECK.md 작성
       ↓
  ③ Evaluator 에이전트 (verify-agent 기반)
     → QA_REPORT.md 작성 (4항목 채점)
       ↓
  ④ 판정 확인
     → 합격 (≥7.0): 완료 보고
     → 조건부/불합격: ②→③ 반복 (최대 2회)
```

---

## 단계별 실행 지시

### 단계 1: Planner 호출

**에이전트**: Plan 타입 서브에이전트

**프롬프트 템플릿**:
```
당신은 KiiPS 페이지 기획 전문가입니다.

## 지시
1. 다음 스킬을 읽고 참조하라:
   - kiips-page-pattern-guide (표준 페이지 구조)
   - kiips-search-filter-guide (검색 필터 패턴)
   - kiips-button-guide (버튼 영역 패턴)

2. 기존 유사 페이지를 탐색하라:
   - KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/ 하위 검색
   - 유사 도메인/기능의 _P.jsp 파일 참조

3. 사용자 요청: [사용자 프롬프트]

4. 결과를 PAGE_SPEC.md로 저장하라.

## PAGE_SPEC.md 형식

### 개요
[무엇이고, 어떤 도메인인지 2~3문장]

### 파일 구조
[생성할 파일 목록 + 경로]

### 검색 조건
[MainComponent 필드 목록]

### 버튼 구성
[도메인별 버튼 목록 + 권한]

### 그리드 컬럼
[RealGrid 컬럼 정의]

### 기능 목록
- 기능 1: [설명 + 사용자 스토리]
- 기능 2: ...
(최소 5개)

### 참조 페이지
[분석한 유사 페이지 경로]
```

**완료 조건**: PAGE_SPEC.md 파일 생성됨

---

### 단계 2: Generator 호출

**에이전트**: KiiPS Developer 타입 서브에이전트

**최초 실행 프롬프트**:
```
당신은 KiiPS 프론트엔드 개발자입니다.

## 지시
1. 다음을 읽어라:
   - PAGE_SPEC.md (설계서)
   - .claude/agents/shared/kiips-evaluation-criteria.md (평가 기준)
   - kiips-page-pattern-guide 스킬 (표준 패턴)

2. PAGE_SPEC.md의 전체 기능을 구현하라.

3. KiiPS 안티패턴 금지 목록을 반드시 준수하라:
   - 인라인 style="" 금지 → CSS 클래스 사용
   - checkbox-custom 패턴 사용
   - logosAjax 래퍼 사용 (raw $.ajax 금지)
   - [data-theme=dark] 전용 (.dark 금지)
   - flatpickr-basic 날짜 입력
   - MyBatis #{} 전용

4. 결과 파일을 저장하라.

5. SELF_CHECK.md를 작성하라:
   - SPEC 기능별 구현 여부 체크
   - 안티패턴 위반 여부 자체 점검
   - 사용한 패턴/컴포넌트 목록
```

**피드백 반영 시 (R2 이상) 프롬프트**:
```
당신은 KiiPS 프론트엔드 개발자입니다.

## 지시
1. PAGE_SPEC.md를 읽어라 (설계서).
2. 현재 생성된 파일들을 읽어라 (현재 코드).
3. QA_REPORT.md를 읽어라 (QA 피드백).
4. .claude/agents/shared/kiips-evaluation-criteria.md를 읽어라 (평가 기준).

5. QA 피드백의 "구체적 개선 지시"를 모두 반영하여 수정하라.
6. "방향 판단"이 "완전히 다른 접근 시도"이면 구조 자체를 변경하라.
7. SELF_CHECK.md를 업데이트하라.

중요: "이 정도면 괜찮지 않나?" 합리화 금지. 피드백을 그대로 반영하라.
```

**완료 조건**: JSP + inc 파일 생성 + SELF_CHECK.md 작성

---

### 단계 3: Evaluator 호출

**에이전트**: verify-agent 타입 서브에이전트 (별도 컨텍스트 필수)

**프롬프트**:
```
당신은 엄격한 KiiPS QA 검수자입니다.

## 최우선 원칙: 절대 관대하게 보지 마라
"괜찮은 것 같기도 한데..." → 감점
한 항목이 좋아도 다른 항목 문제를 상쇄하지 마라.

## 검수 절차
1. .claude/agents/shared/kiips-evaluation-criteria.md를 읽어라 (채점 기준).
2. PAGE_SPEC.md를 읽어라 (설계서).
3. 생성된 JSP/inc 파일들을 읽어라 (검수 대상).

4. 검수 실행:
   a. SPEC 기능별 구현 여부 확인 (PASS/FAIL)
   b. kiips-evaluation-criteria.md 4개 항목 채점 (10점 만점)
   c. 안티패턴 금지 목록 위반 검사
   d. 최종 판정 (합격/조건부/불합격)
   e. 불합격/조건부 시 구체적 개선 지시 (WHERE/WHY/HOW 3요소 필수)

5. QA_REPORT.md로 저장하라.
```

**완료 조건**: QA_REPORT.md 작성 (피드백 형식 준수)

---

### 단계 4: 판정 확인

오케스트레이터가 QA_REPORT.md를 읽고 판정:

| 판정 | 조치 |
|------|------|
| **합격** (가중 ≥ 7.0) | 완료 보고 |
| **조건부** (가중 5.0~6.9) | 단계 2로 → 피드백 반영 재생성 |
| **불합격** (가중 < 5.0) | 단계 2로 → 근본 재설계 |
| **R3 이후 미합격** | 현재 상태 전달 + 미해결 이슈 보고 |

---

## 완료 보고 형식

```markdown
## KiiPS Page Harness 완료

**결과물**: [생성된 파일 목록]
**SPEC 기능 수**: X개
**QA 반복 횟수**: X회
**최종 점수**: 패턴 X/10, 기능 X/10, 접근성 X/10, 보안 X/10 (가중 X.X/10)

### 실행 흐름
1. Planner: [설계 요약]
2. Generator R1: [첫 구현 결과]
3. Evaluator R1: [판정 + 핵심 피드백]
4. Generator R2: [수정 내용] (있는 경우)
5. Evaluator R2: [최종 판정] (있는 경우)

### 생성된 파일
- `JSP경로/_P.jsp` — 메인 페이지
- `JSP경로/inc_filter_main.jsp` — 검색 필터
- `JSP경로/inc_main_button.jsp` — 버튼 영역
- `JSP경로/inc_grid_main.jsp` — 그리드 영역
```

---

## 주의사항

1. **Generator와 Evaluator는 반드시 다른 에이전트로 호출** (분리가 핵심)
2. 각 단계 완료 후 생성된 파일 존재 여부 확인
3. Evaluator는 코드를 수정하지 않음 (평가만 수행)
4. 최대 반복: 2회 (R1 + R2 + R3 = 총 3라운드)
5. 안티패턴 금지 목록은 Generator와 Evaluator 모두 참조

---

## 상세 레퍼런스

- 평가 기준 상세: [kiips-evaluation-criteria.md](../../agents/shared/kiips-evaluation-criteria.md)
- 실행 예제: [reference.md](reference.md)
