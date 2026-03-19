---
name: kiips-frontend-guidelines
description: "KiiPS 프론트엔드 개발 가이드 - JSP/jQuery/Bootstrap 표준 패턴, AJAX 호출 규칙, RealGrid 연동. Use when: JSP, JavaScript, UI, 프론트엔드, 화면, 페이지"
---

# KiiPS Frontend Guidelines

> KiiPS JSP/jQuery 프론트엔드 표준 패턴 가이드

---

## Quick Reference

| 기술 | 버전 | 용도 |
|------|------|------|
| JSP | 2.3 | 서버 사이드 렌더링 |
| jQuery | 3.x | DOM 조작, AJAX |
| Bootstrap | 4.x | 레이아웃, 컴포넌트 |
| RealGrid | 2.6.3 | 데이터 그리드 |
| ApexCharts | 3.x | 차트/대시보드 |

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

## 관련 스킬
- `kiips-page-pattern-guide`: 페이지 레이아웃 상세
- `kiips-search-filter-guide`: 검색필터 패턴
- `kiips-button-guide`: 버튼 영역 패턴
- `kiips-realgrid-guide`: RealGrid 그리드 패턴
- `kiips-regist-modal-guide`: 등록/수정 모달 패턴
