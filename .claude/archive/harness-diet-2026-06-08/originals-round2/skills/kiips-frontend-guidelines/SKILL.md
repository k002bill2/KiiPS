---
name: kiips-frontend-guidelines
description: "KiiPS 프론트엔드 개발 가이드 - JSP/jQuery/Bootstrap 표준 패턴, AJAX 호출 규칙, RealGrid 연동. Use when: JSP, JavaScript, UI, 프론트엔드, 화면, 페이지"
---

# KiiPS Frontend Guidelines

> KiiPS JSP/jQuery 프론트엔드 표준 패턴 가이드
>
> **🎨 색상 작성 원칙**: 신규 페이지 생성 또는 화면 수정 시 색상은 반드시 `themes/default/` 의 시스템 변수(`var(--primary)`, `var(--color)`, `$grey-5`, `$primary-50` 등) 기반으로 작성. hex 하드코딩 금지. 상세는 [`kiips-scss`](../kiips-scss/SKILL.md) 스킬의 "시스템 변수 우선 원칙" 섹션 참조.

---

## Quick Reference

| 기술 | 버전 | 용도 |
|------|------|------|
| JSP | 2.3 | 서버 사이드 렌더링 |
| jQuery | 3.x | DOM 조작, AJAX |
| Bootstrap | 4.x | 레이아웃, 컴포넌트 |
| RealGrid | 2.6.3 | 데이터 그리드 |
| ApexCharts | 3.x | 차트/대시보드 |
| Bootstrap-Select | 1.13.x | `selectpicker` 드롭다운 |
| flatpickr | 4.x | 날짜 입력 |
| jquery-year-picker | - | 연도 입력 |

---

## 폼 컴포넌트 절대 규칙 (CRITICAL)

> 신규 컴포넌트 생성 또는 기존 화면 수정 시 **반드시** 아래 패턴을 따를 것.
> 일반 `<select class="form-control">`, `<input type="date">`, Bootstrap 4 기본 컨트롤 사용 금지.

### 셀렉트박스 → `selectpicker`

```html
<select class="selectpicker show-tick form-control"
        data-hide-disabled="true"
        data-gbn="select"
        id="FIELD_ID"
        data-id="FIELD_ID"
        title="선택해주세요"
        multiple data-max-options="1">
    <option value="A">옵션A</option>
    <option value="B">옵션B</option>
</select>
```

규칙:
- 클래스: `selectpicker show-tick form-control` (3종 모두 필수)
- 단일선택이라도 `multiple data-max-options="1"` 조합 사용 (KiiPS 표준)
- placeholder는 `title="..."` 속성 (빈 옵션 `<option value="">선택해주세요</option>` 금지)
- `data-gbn="select"` 필수 (저장/조회 자동 매핑)
- JS에서 값 변경 후 `$('#FIELD_ID').val(v).selectpicker('refresh');` 호출 필수

### 날짜 (전체) → `flatpickr-basic`

```html
<input type="text" class="form-control flatpickr-basic"
       data-id="FIELD_ID" data-gbn="date" name="FIELD_ID"
       placeholder="YYYY-MM-DD">
```

### 연도 → `yearpicker nopickerTag`

```html
<input type="text" class="form-control yearpicker nopickerTag"
       id="FIELD_ID" data-id="FIELD_ID" data-gbn="date"
       placeholder="YYYY" maxlength="4">
```

규칙:
- `nopickerTag` 클래스 필수 (flatpickr 자동 초기화 차단 + jquery-year-picker가 처리)
- `data-gbn="date"` 사용

### 분기 → `selectpicker` 4옵션

```html
<select class="selectpicker show-tick form-control"
        data-hide-disabled="true" data-gbn="select"
        id="QUAT_SEQ" data-id="QUAT_SEQ"
        multiple data-max-options="1">
    <option value="1Q">1Q</option>
    <option value="2Q">2Q</option>
    <option value="3Q">3Q</option>
    <option value="4Q">4Q</option>
</select>
```

### 폼 그룹 레이아웃 → `form-group new`

```html
<div class="form-group new row">
    <div class="col-sm-6 col-lg-3">
        <label class="control-label" for="FIELD_ID">레이블</label>
        <!-- selectpicker / yearpicker / flatpickr-basic -->
    </div>
    <!-- 반복 -->
</div>
```

규칙:
- 모달 폼은 `form-group new` (+ `row` + `col-sm-X col-lg-Y`) 사용
- `<ul class="data_flex"><li class="tbl_item flex-dynamic">` 패턴은 **메인 화면 검색필터 외에는 사용 금지**
- `<span class="control-label">` 대신 `<label class="control-label">` 사용 (접근성 + Bootstrap form-group 호환)
- `d-flex gap3x` + `flex-fill` 폼 패턴 금지

### 체크박스 → `checkbox-custom`

```html
<div class="form-check-inline">
    <div class="checkbox-custom checkbox-default mb-2">
        <input type="checkbox" data-id="FIELD_ID" data-gbn="checkbox" id="FIELD_ID">
        <label for="FIELD_ID">&nbsp;라벨</label>
    </div>
</div>
```

### 라디오 → `custom-control custom-radio`

```html
<div class="custom-control custom-radio">
    <input type="radio" name="FIELD_NAME" id="FIELD_ID_1"
           data-gbn="radio" data-id="FIELD_NAME" value="1"
           class="custom-control-input" checked>
    <label class="custom-control-label" for="FIELD_ID_1"> 라벨1</label>
</div>
```

### 금지 패턴 매트릭스

| 금지 | 사용 |
|------|------|
| `<select class="form-control">` | `selectpicker show-tick form-control` |
| `<option value="">선택...</option>` | `title="선택해주세요"` 속성 |
| `<input type="date">` | `flatpickr-basic` 클래스 |
| `<input class="datepicker">` | `flatpickr-basic` 클래스 |
| 단일 select에 `multiple` 미사용 | `multiple data-max-options="1"` |
| `.val()` 후 refresh 누락 | `.val(v).selectpicker('refresh')` |
| `<span class="control-label">` (폼 내부) | `<label class="control-label">` |
| `custom-control custom-checkbox` | `checkbox-custom checkbox-default` |
| `<ul class="data_flex">` 모달 내 폼 | `<div class="form-group new row">` |

---

## JSP 파일 구조

```
KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{domain}/
├── {SCREEN_ID}.jsp          ← 메인 페이지
├── include/
│   ├── inc_filter_main.jsp  ← 검색필터 Include
│   ├── button/
│   │   └── inc_{domain}_button.jsp  ← 도메인별 버튼
│   └── inc_main_button.jsp  ← 공통 버튼
```

### 페이지 표준 Include 순서
1. `header.jsp` → 2. `sidemenu.jsp` → 3. `inc_filter_main.jsp` → 4. `inc_main_button.jsp` → 5. 그리드/본문

---

## AJAX 호출 패턴

```javascript
// 표준 AJAX 패턴
logosAjax.request({
    url: "/api/{domain}/{method}",
    data: JSON.stringify(param),
    success: function(data) {
        // 성공 처리
    },
    error: function(xhr) {
        // 에러 처리 필수
    }
});
```

### 규칙
- `logosAjax.request()` 또는 `logosAjax.requestTokenGrid()` 사용
- **`var gToken` 재선언 금지** — `header.jsp`에서 세션 토큰으로 이미 초기화됨
- **`logosAjax.getToken()` 사용 금지** — 존재하지 않는 메서드
- `.fail()` 에러 핸들러 필수
- Loading 스피너 표시/숨기기
- 중복 요청 방지 (버튼 비활성화)
- `x-api-key` 헤더 자동 포함 확인

---

## 이벤트 핸들러

```javascript
// 페이지 초기화
$(document).ready(function() {
    initComponent();  // 컴포넌트 초기화
    initGrid();       // 그리드 초기화
    initEvent();      // 이벤트 바인딩
    MAIN_SEARCH_FILTER(); // 초기 검색
});
```

### 규칙
- `$(document).ready()` 내에서 초기화
- 이벤트 핸들러는 `initEvent()` 함수에 집중
- 전역 변수 최소화 (모듈 패턴 권장)

---

## HTML 문자열 연결 시 text-indent 필수

`변수명 += '<html...'` 패턴으로 HTML을 동적 생성할 때, 문자열 내부에 HTML 중첩 레벨에 맞는 들여쓰기를 적용합니다.

```javascript
// Good - HTML 구조가 한눈에 보임 + XSS 이스케이프 적용
html += '<div class="form-group row">';
html += '  <label class="col-sm-2 control-label">' + escapeHtml(item.DSCP) + '</label>';
html += '  <div class="col-sm-10">';
html += '    <input type="text" class="form-control" />';
html += '  </div>';
html += '</div>';

// Bad - 중첩 구조 파악 불가, XSS 취약
html += '<div class="form-group row">';
html += '<label class="col-sm-2 control-label">' + item.DSCP + '</label>';
html += '<div class="col-sm-10">';
html += '<input type="text" class="form-control" />';
html += '</div>';
html += '</div>';
```

- 들여쓰기 단위: 2칸 스페이스 (문자열 내부)
- 적용 대상: `html`, `mainHtml`, `cnte`, `resultTxt` 등 모든 HTML 연결 변수

---

## XSS 방어

```jsp
<%-- 출력 시 반드시 이스케이프 --%>
<c:out value="${data.name}" />
${fn:escapeXml(data.name)}

<%-- 금지: 직접 출력 --%>
<%-- ${data.name} --%>
```

---

## 사용하지 말아야 할 때

구체적 컴포넌트는 전용 스킬 우선 — 그리드=kiips-realgrid-guide, 검색필터=kiips-search-filter-guide, 등록모달=kiips-regist-modal-guide, 버튼=kiips-button-guide, SCSS·다크테마=kiips-scss. 본 스킬은 공통 폼 규칙·AJAX·XSS 기준용.

---

## 관련 파일

- [reference.md](reference.md): 다크모드 자동 연동 상세 규칙 (다크모드 작업 시 반드시 읽을 것)

---

## 관련 스킬
- `kiips-page-pattern-guide`: 페이지 레이아웃 상세
- `kiips-search-filter-guide`: 검색필터 패턴
- `kiips-button-guide`: 버튼 영역 패턴
- `kiips-realgrid-guide`: RealGrid 그리드 패턴
- `kiips-regist-modal-guide`: 등록/수정 모달 패턴
- `kiips-scss`: SCSS 테마 + 다크모드 변수/패턴
