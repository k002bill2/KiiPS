---
name: kiips-ui-component-builder
description: "JSP 컴포넌트 템플릿 기반 생성 (RealGrid, ApexCharts, Bootstrap 폼, 팝업). Use when: UI 컴포넌트, JSP 생성, 그리드 생성, 차트 추가, 페이지 생성, 화면 개발"
---

# KiiPS UI Component Builder

JSP 템플릿 기반의 UI 컴포넌트를 빠르게 생성하는 Skill입니다. RealGrid, ApexCharts, Bootstrap 폼 등 자주 사용하는 컴포넌트의 프리셋을 제공하여 개발 속도를 향상시킵니다.

## Purpose

### What This Skill Does
- **JSP 컴포넌트 생성**: JSTL/EL 기반 템플릿으로 재사용 가능한 컴포넌트 생성
- **RealGrid 프리셋**: 기본, 편집, 트리 그리드 템플릿 제공
- **ApexCharts 프리셋**: 선, 도넛, 바 차트 템플릿 제공
- **Bootstrap 폼**: 검색, 모달, 탭 레이아웃 템플릿 제공
- **XSS 방어**: Lucy XSS 필터 자동 적용
- **접근성**: ARIA 속성 자동 추가

### What This Skill Does NOT Do
- Java 백엔드 로직 작성
- 데이터베이스 쿼리 작성
- Maven 빌드 설정

## When to Use

이 Skill은 다음 상황에서 자동 활성화됩니다:

### User Prompt Keywords
```
"UI 컴포넌트 생성", "JSP 페이지 만들기", "그리드 추가", "차트 추가",
"검색 폼", "모달 팝업", "탭 레이아웃", "펀드 목록 화면", "투자 대시보드",
"팝업", "popup", "인쇄", "print", "모달", "modal"
```

### File Patterns
```
새 파일 생성: **/*.jsp, **/webapp/**/*.html
수정: **/*.jsp
팝업: **/POPUP*.jsp, **/popup*.jsp, **/*_print*.jsp
```

### Intent Patterns
```regex
/생성|만들|추가|개발.*?(페이지|화면|컴포넌트|그리드|차트|폼|모달|탭|팝업)/
/UI.*?(만들|생성|추가|개발)/
/팝업.*만들|팝업.*생성|popup.*create|인쇄.*페이지|print.*popup/
```

## Quick Reference

### 1. RealGrid 기본 그리드 (Read-Only)

**User Request**: "펀드 목록 조회 화면 만들어줘"

**참조**: RealGrid 상세 설정은 [kiips-realgrid-guide](../kiips-realgrid-guide/SKILL.md) 참조

**핵심 패턴**: `createMainGrid` + `logosAjax.requestTokenGrid`

```javascript
// 컬럼 정의
let columns = [
    {fieldName: "FUND_CD", width: "120", header: {text: "펀드코드"},
     editable: false, styleName: "center-column"},
    {fieldName: "FUND_NM", width: "250", header: {text: "펀드명"},
     editable: false, styleName: "left-column"},
    {fieldName: "NAV_AMT", width: "120", header: {text: "NAV (원)"},
     editable: false, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column"}
];

// KiiPS 공통 초기화
createMainGrid("TB_FUND_LIST", dataProvider, gridView, columns);

// 데이터 로드
logosAjax.requestTokenGrid(gridView, gToken,
    "${KiiPS_FD}/FDAPI/FUND/LIST", "post", searchCond,
    function(data) {
        dataProvider.setRows(data.body.list);
        gridView.refresh();
    });
```

### 2. RealGrid 편집 그리드 (Editable)

**User Request**: "투자 금액 입력 화면 만들어줘. 그리드에서 직접 수정 가능하게"

**참조**: [kiips-realgrid-guide](../kiips-realgrid-guide/SKILL.md) 참조

```javascript
// 편집 가능 컬럼 설정 (KiiPS 패턴)
let columns = [
    {fieldName: "INV_AMT", width: "150", header: {text: "투자금액 (원)"},
     editable: true, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column editable-column",
     editor: {
         type: "number",
         editFormat: "#,##0",
         min: 0,
         max: 9999999999
     }},
    {fieldName: "INV_TYPE", width: "120", header: {text: "투자유형"},
     editable: true, styleName: "center-column",
     editor: {
         type: "dropdown",
         values: ["EQUITY", "BOND", "MIXED"],
         labels: ["주식형", "채권형", "혼합형"]
     }}
];

createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);

// 편집 옵션
gridView.editOptions.editable = true;
gridView.editOptions.commitByCell = true;
```

### 3. ApexCharts Quick Summary

| 차트 유형 | 용도 | chart.type |
|-----------|------|------------|
| Line | 추이 분석 (월별 투자) | `'line'` |
| Donut | 비율 분석 (펀드 분류) | `'donut'` |
| Bar | 비교 분석 (Top 10) | `'bar'` |

상세 옵션과 템플릿은 [reference.md](reference.md) 참조.

### 4. Popup Quick Summary

| 유형 | 용도 | 기준 파일 |
|------|------|-----------|
| **일반 팝업** | 데이터 입력/조회 | `COMM_POPUP_*.jsp` |
| **인쇄용 팝업** | 문서 인쇄 | `POPUP_AC0522_print.jsp` |
| **그리드 팝업** | RealGrid 데이터 표시 | `COMM_POPUP_OPINION.jsp` |
| **Bootstrap Modal** | 페이지 내 오버레이 | data-backdrop="static" |

팝업 생성 시 반드시 참조: [docs/POPUP_GUIDE.md](../../../docs/POPUP_GUIDE.md)

## Component Templates

| Template | Purpose | File |
|----------|---------|------|
| **realgrid-basic** | 읽기 전용 데이터 그리드 | [templates/realgrid-basic.jsp](./templates/realgrid-basic.jsp) |
| **realgrid-editable** | 편집 가능 데이터 그리드 | [templates/realgrid-editable.jsp](./templates/realgrid-editable.jsp) |
| **realgrid-tree** | 트리 그리드 (계층 구조) | [templates/realgrid-tree.jsp](./templates/realgrid-tree.jsp) |
| **apexcharts-line** | 선 차트 (추이 분석) | [templates/apexcharts-line.jsp](./templates/apexcharts-line.jsp) |
| **apexcharts-donut** | 도넛 차트 (비율 분석) | [templates/apexcharts-donut.jsp](./templates/apexcharts-donut.jsp) |
| **apexcharts-bar** | 바 차트 (비교 분석) | [templates/apexcharts-bar.jsp](./templates/apexcharts-bar.jsp) |
| **bootstrap-search-form** | 검색 폼 레이아웃 | [templates/bootstrap-search-form.jsp](./templates/bootstrap-search-form.jsp) |
| **bootstrap-modal** | 모달 팝업 | [templates/bootstrap-modal.jsp](./templates/bootstrap-modal.jsp) |
| **bootstrap-tabs** | 탭 레이아웃 | [templates/bootstrap-tabs.jsp](./templates/bootstrap-tabs.jsp) |

## Security & Accessibility

### XSS Prevention (Automatic)

모든 템플릿은 Lucy XSS 필터를 자동 적용합니다:

```jsp
<%@ taglib prefix="lucy" uri="http://www.navercorp.com/lucy/xss" %>

<!-- 사용자 입력 출력 시 -->
<td><lucy:out value="${fund.fundName}"/></td>

<!-- JavaScript 변수 할당 시 -->
<script>
const fundName = '<lucy:js value="${fund.fundName}"/>';
</script>
```

### Accessibility (WCAG 2.1 AA)

- **ARIA 레이블**: 모든 폼 요소에 `aria-label` 자동 추가
- **키보드 네비게이션**: Tab, Enter, Space 지원
- **스크린 리더**: 의미있는 레이블과 설명 제공
- **색상 대비**: 4.5:1 이상 보장

## Common Pitfalls

### Don't
```javascript
// XSS 취약점
document.innerHTML = userInput;
// 하드코딩된 URL
fetch('http://localhost:8000/api/funds');
// 접근성 누락
<button onclick="save()">저장</button>
```

### Do
```javascript
// XSS 방어
document.textContent = userInput;
// 상대 URL
fetch('/api/funds');
// 접근성 준수
<button onclick="save()" aria-label="펀드 정보 저장">
    <i class="bi bi-save" aria-hidden="true"></i> 저장
</button>
```

## Related Skills

| Skill | Usage |
|-------|-------|
| **kiips-realgrid-guide** | RealGrid 2.6.3 종합 가이드 - 필수 참조 |
| **kiips-responsive-validator** | 생성된 컴포넌트의 반응형 검증 |
| **kiips-a11y-checker** | 접근성 자동 검증 및 수정 |
| **kiips-scss-theme-manager** | SCSS 스타일 커스터마이징 |

## Naming Conventions

- **JSP**: `{domain}-{action}.jsp` (예: `fund-list.jsp`)
- **JS**: `{domain}-{action}.js` (JSP와 동일)
- **SCSS**: `{domain}-{action}.scss`
- **API**: `/api/{domain}/{action}`

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
