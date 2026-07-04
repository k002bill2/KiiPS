---
name: kiips-a11y-guide
description: "KiiPS 웹 접근성(A11y) 가이드 - KWCAG/WCAG 4대 원칙을 KiiPS 스택(JSP/selectpicker/checkbox-custom/모달/RealGrid/다크테마)에 적용하는 실행 규칙과 개발 체크리스트. JSP 화면을 새로 만들거나 수정하는 모든 작업에서 접근성 언급이 없어도 반드시 함께 참조할 것. Use when: (1) 페이지/화면/JSP 신규 생성·수정·마크업 검토, (2) 접근성/a11y/웹접근성/KWCAG/WCAG/접근성 인증 심사/Lighthouse·axe 접근성 점수 개선, (3) alt/aria/aria-label/label-input 연결/role 마크업 작성·점검, (4) 스크린리더/시각장애인/저시력 사용자 관련 이슈, (5) 키보드·탭키로 버튼/모달/링크가 조작·포커스 안 되는 문제, (6) 텍스트·문구가 잘 안 보인다는 명도 대비 민원(라이트/다크테마 모두), (7) 아이콘만 있고 텍스트 없는 버튼 점검. NOT for: SCSS 변수/다크테마 색상값 변경 자체(use kiips-scss), 폼/AJAX 일반 규칙(use kiips-frontend-guidelines), RealGrid API·setFocus·editOptions 설정(use kiips-realgrid-guide)"
---

# KiiPS Web Accessibility (A11y) Guide

KWCAG(한국형 웹 콘텐츠 접근성 지침) / WCAG 2.1 기반 접근성 규칙을 KiiPS 기술 스택에 맞게 구체화한 가이드입니다.
**신규 페이지 생성 또는 기존 화면 수정 시 항상 이 가이드를 함께 적용합니다.**

> 평가 연동: `kiips-page-harness` 파이프라인의 평가 기준
> (`.claude/agents/shared/kiips-evaluation-criteria.md` §3 접근성/반응형, 비중 15%)을 이 가이드가 실행 레벨로 뒷받침합니다.

---

## 4대 원칙 요약

| 원칙 | 핵심 | KiiPS 적용 포인트 |
|------|------|------------------|
| 인식 (Perceivable) | 모든 콘텐츠는 인식 가능해야 | `alt`, 아이콘 `aria-hidden`, 명도 대비 4.5:1 (라이트+다크 모두) |
| 운용 (Operable) | 키보드만으로 조작 가능해야 | 포커스 이동, 모달 포커스 트래핑, `<a href="#">` 액션 처리 |
| 이해 (Understandable) | 콘텐츠는 이해하기 쉬워야 | `<label for>` 연결, 오류 메시지 위치/해결법, 일관된 내비게이션 |
| 견고 (Robust) | 보조기술과 호환되어야 | 시맨틱 마크업, 올바른 ARIA role, well-formed HTML |

---

## 1. 인식의 용이성 (Perceivable)

### 이미지 대체 텍스트

```html
<!-- 의미 있는 이미지: 반드시 alt 제공 -->
<img src="../img/logo_KiiPS.svg" alt="KiiPS">
<img src="/img/dealpipe.svg" alt="deal pipeline">

<!-- 장식용 이미지: 빈 alt (스크린리더가 건너뜀) -->
<img src="/img/deco_line.png" alt="">
```

- 동적으로 HTML 문자열 연결(`html += '<img ...'`)로 이미지를 만들 때도 `alt`를 누락하지 말 것 — 템플릿 코드에서 가장 자주 빠짐.

### 아이콘 (Font Awesome)

KiiPS는 `<i class="fas fa-*">` Font Awesome 아이콘을 사용합니다. 아이콘 폰트는 스크린리더가 의미 없는 문자로 읽거나 무시하므로:

```html
<!-- 장식/보조 아이콘 (인접 텍스트가 의미 전달): aria-hidden -->
<button type="button" class="btn btn-outline-primary">
    <i class="fas fa-check mr-1" aria-hidden="true"></i>저장
</button>

<!-- 아이콘 단독 버튼 (텍스트 없음): 반드시 aria-label 또는 title -->
<button type="button" class="btn btn-outline-primary" aria-label="새로고침">
    <i class="fas fa-sync" aria-hidden="true"></i>
</button>

<!-- 정보 팝오버 아이콘: 툴팁 내용을 접근 가능한 이름으로 -->
<i class="fas fa-info-circle text-color-info ml-1 example-popover"
   role="img" aria-label="도움말" data-content="..."></i>
```

### 명도 대비 (4.5:1 이상)

- 색상은 반드시 `themes/default/` 시스템 변수(`var(--primary)`, `$grey-5` 등) 기반으로 작성 (hex 하드코딩 금지 — `kiips-scss` 규칙과 동일).
- **다크테마(`[data-theme=dark]`)에서도 대비를 별도 확인**할 것. 라이트에서 4.5:1을 만족해도 다크 변수 조합에서 깨지는 경우가 흔함.
- 색상만으로 상태를 구분하지 말 것 — 상태 텍스트/아이콘을 병행 (예: 승인=초록만 X → "승인" 텍스트 + 색).
- 검사: Chrome DevTools > Lighthouse 또는 axe DevTools. claude-in-chrome 실측 검증 시 대비 검사도 함께 수행.

### 콘텐츠 선형화

- CSS 배치에 의존하지 말고 HTML을 논리적 순서(검색필터 → 버튼 → 그리드 → 모달)로 작성 — KiiPS 표준 페이지 구조(`kiips-page-pattern-guide`)를 따르면 자연히 충족됨.

---

## 2. 운용의 용이성 (Operable)

### 키보드 접근성

- 클릭 가능한 요소는 `<button>` 또는 `<a href>`로 작성. `<div onclick>`/`<span onclick>` 금지 (Tab 포커스 불가).
- 부득이하게 비대화형 요소에 클릭 핸들러를 달아야 하면 `tabindex="0"` + `role="button"` + Enter/Space 키 핸들러를 함께 제공.
- 커스텀 컴포넌트 중 selectpicker(Bootstrap-Select)와 flatpickr는 자체 키보드 지원이 있으므로 기본 초기화 패턴(`kiips-frontend-guidelines`)을 따르면 됨 — 임의로 `tabindex="-1"`을 넣지 말 것.

### 포커스 표시

- `outline: none` / `outline: 0`을 포커스 대체 스타일 없이 넣지 말 것. 포커스 링 제거가 필요하면 `:focus-visible` 대체 스타일을 반드시 제공.

### 모달 (Bootstrap Modal)

KiiPS 모달 닫기는 `card-action-dismiss` 앵커 패턴인데, **텍스트가 없는 빈 앵커**이므로 접근 가능한 이름이 필수입니다:

```html
<h2 class="card-title">등록
    <span class="card-actions">
        <a href="#" class="card-action card-action-dismiss modal-dismiss"
           data-dismiss="modal" aria-label="닫기"></a>
    </span>
</h2>
```

- 모달 컨테이너: `role="dialog"` `aria-modal="true"` `aria-labelledby="{제목 id}"`.
- 열릴 때 포커스를 모달 내부 첫 요소로 이동, 닫힐 때 열었던 트리거 버튼으로 복귀.
- ESC 키로 닫기 동작 유지 (Bootstrap 기본값 `keyboard: true`를 끄지 말 것).
- Bootstrap 4는 포커스 트래핑을 기본 제공(`_enforceFocus`) — 커스텀 모달을 새로 만들지 말고 표준 모달 패턴(`kiips-regist-modal-guide`)을 사용할 것.

### 시간 제한 / 자동 동작

- 세션 만료 안내에는 연장 수단 제공.
- 자동 새로고침/폴링이 있는 화면은 갱신 시 포커스와 스크롤 위치를 보존 (RealGrid `setRows` 후 `pageYOffset` 보존 패턴 참조).

---

## 3. 이해의 용이성 (Understandable)

### 폼 라벨 연결

KiiPS 표준 폼 컴포넌트는 라벨 연결 구조가 이미 정해져 있습니다 — 패턴을 지키면 접근성도 충족됩니다:

```html
<!-- checkbox-custom: input id ↔ label for 반드시 일치 -->
<div class="checkbox-custom checkbox-default">
    <input type="checkbox" id="MOBILE_REP_YN" data-id="MOBILE_REP_YN" name="MOBILE_REP_YN">
    <label for="MOBILE_REP_YN">대표아이디 설정</label>
</div>

<!-- 텍스트 입력: label for 연결, 시각적 라벨이 없으면 aria-label -->
<label class="control-label" for="FUND_NM">펀드명</label>
<input type="text" class="form-control" id="FUND_NM" data-id="FUND_NM">

<!-- selectpicker: title 속성이 placeholder 역할, 라벨은 별도 연결 -->
<label class="control-label" for="CRC_TPCD">통화</label>
<select class="selectpicker show-tick form-control" id="CRC_TPCD" title="선택해주세요" ...>
```

- `<span class="control-label">` 금지, `<label class="control-label">` 사용 (`kiips-frontend-guidelines` 규칙과 동일 — 접근성이 그 이유).
- 동적 생성 체크박스(`html += ...`)에서 `id`/`for` 인덱스 불일치가 흔한 버그: `id="XXX' + index + '"` ↔ `for="XXX' + index + '"` 쌍을 항상 함께 확인.

### 입력 오류 안내

- 검증 실패 시 "어느 필드가, 왜, 어떻게 고치면 되는지"를 메시지에 포함 (예: "제목은 200자 이하로 입력해주세요").
- 오류 발생 필드로 포커스를 이동시켜 사용자가 위치를 바로 알 수 있게 함.

### 예측 가능성 / 일관성

- 새 창/팝업 열기 링크에는 사전 안내 (`title="새 창"` 또는 텍스트 표기).
- select 변경(change) 이벤트만으로 페이지 이동·전체 갱신을 트리거하지 말 것 — 조회 버튼 클릭으로 실행 (KiiPS 표준 검색 흐름과 일치).
- 내비게이션(sidemenu·header include 체계)은 전 페이지 공통 include를 사용 — 페이지별 임의 변형 금지.

---

## 4. 견고성 (Robust)

### 시맨틱 마크업

- 제목 계층: 페이지 제목 → 카드 제목(`<h2 class="card-title">`) 순서 유지, 스타일 목적의 heading 사용 금지.
- 버튼은 `<button type="button">`, 링크는 `<a href>` — 역할과 태그 일치.
- 탭 UI는 표준 role 패턴 사용 (KiiPS 표준 탭 구조와 동일):

```html
<a class="nav-link active" data-toggle="tab" href="#STCK_DOC1"
   role="tab" aria-selected="true">탭1</a>
```

- JSP well-formed 마크업 필수 — 태그 미닫힘은 보조기술 파싱 실패의 최우선 원인.

### RealGrid 접근성 (canvas 한계 보완)

RealGrid는 canvas 렌더링이라 스크린리더가 셀 내용을 읽지 못합니다. 그리드 자체를 고치려 하지 말고 **주변 정보로 보완**합니다:

- 그리드 컨테이너에 `role="region"` + `aria-label="{그리드 내용 설명}"` 부여.
- 조회 결과 건수를 시각적 텍스트로 표시하고 `aria-live="polite"` 영역으로 갱신 안내:

```html
<div id="gridResultCount" aria-live="polite">조회 결과 128건</div>
<div id="realgrid" role="region" aria-label="펀드 목록 그리드"></div>
```

- 핵심 데이터는 엑셀 다운로드 버튼(표준 버튼 영역)으로 대체 접근 수단을 항상 제공.

---

## 개발 체크리스트 (페이지 생성/수정 시)

- [ ] `<img>`에 `alt` 부여 (장식용은 `alt=""`) — 동적 HTML 문자열 포함
- [ ] 아이콘 단독 버튼/앵커에 `aria-label` 존재 (모달 닫기 `card-action-dismiss` 포함)
- [ ] 장식 아이콘 `<i class="fas ...">`에 `aria-hidden="true"`
- [ ] 모든 입력 요소에 `<label for>` 연결 (checkbox-custom `id`/`for` 쌍 일치)
- [ ] 클릭 가능한 요소가 `<button>`/`<a href>`인지 확인 (`div onclick` 없음)
- [ ] 모달: `role="dialog"` + `aria-labelledby` + ESC 닫기 + 포커스 복귀
- [ ] 명도 대비 4.5:1 — 라이트 + 다크(`[data-theme=dark]`) 양쪽 확인
- [ ] RealGrid 컨테이너 `aria-label` + 결과 건수 `aria-live` 영역
- [ ] 탭에 `role="tab"` `aria-selected` 유지
- [ ] Lighthouse 또는 axe DevTools 접근성 검사 실행 (실측 검증 시)

---

## 검증 방법

| 검증 | 방법 |
|------|------|
| 자동 검사 | Chrome DevTools > Lighthouse(Accessibility) 또는 axe DevTools |
| 키보드 | Tab/Shift+Tab/Enter/ESC 만으로 조회→모달 열기→저장→닫기 시나리오 완주 |
| 대비 | DevTools 색상 피커의 contrast ratio 표시 (라이트/다크 각각) |
| 마크업 | JSP well-formed 확인 (태그 쌍, 중복 id 없음) |

## 참조

- [W3C WAI Guidelines](https://www.w3.org/WAI/)
- [한국 웹 접근성 연구소 — KWCAG](https://www.wah.or.kr)
- 관련 스킬: `kiips-frontend-guidelines`(폼 규칙) · `kiips-page-pattern-guide`(페이지 구조) · `kiips-scss`(색상 변수/다크테마) · `kiips-regist-modal-guide`(모달)
