---
name: kiips-realgrid-guide
description: "RealGrid 2.6.3 종합 가이드 - 그리드 생성, 설정, 에디터, Excel, 성능 최적화. Use when: RealGrid, 리얼그리드, 그리드, 테이블, 그리드 생성, 그리드 만들어"
---

# KiiPS RealGrid Guide

RealGrid 2.6.3 종합 가이드입니다. 그리드 생성부터 고급 설정, Excel 기능, 성능 최적화까지 모든 내용을 다룹니다.

## Purpose

### What This Skill Does
- **그리드 생성**: KiiPS 표준 패턴 (createMainGrid, logosAjax)
- **멀티 레벨 헤더**: columnLayout, header.heights
- **커스텀 렌더러**: common_grid.js 24개 렌더러
- **셀 에디터**: text, number, date, dropdown, multiline
- **Excel 기능**: Import, Export, 템플릿
- **필터 & 정렬**: 다중 컬럼 필터, 커스텀 정렬
- **성능 최적화**: 가상 스크롤, 지연 로딩

### What This Skill Does NOT Do
- 백엔드 API 개발
- 다른 그리드 라이브러리 (AG-Grid, DataTables 등)

## When to Use

### User Prompt Keywords
```
"RealGrid", "그리드", "테이블", "리얼그리드",
"멀티 레벨 헤더", "컬럼 그룹", "columnLayout",
"셀 편집", "에디터", "엑셀 내보내기", "엑셀 가져오기",
"그리드 필터", "그리드 정렬", "그룹핑", "집계"
```

### File Patterns
```
새 파일: **/*grid*.js, **/*Grid*.js, **/*.jsp
수정: **/*grid*.js
내용: "RealGridJS", "GridView", "DataProvider", "createMainGrid"
```

---

## 핵심 패턴: 그리드 생성

### 기본 초기화

```javascript
// JSP Container
<div id="TB_GRID_ID"></div>

// JavaScript
let dataProvider = new RealGrid.LocalDataProvider(true);
let gridView = new RealGrid.GridView("TB_GRID_ID");

// KiiPS 공통 초기화 (핵심!)
createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);
```

### 컬럼 정의

```javascript
let columns = [
    // 텍스트 (좌측 정렬)
    {fieldName: "CODE", width: "100", header: {text: "코드"},
     editable: false, styleName: "left-column"},

    // 숫자 (우측 정렬, 포맷)
    {fieldName: "AMOUNT", width: "150", header: {text: "금액"},
     editable: false, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column",
     headerSummary: {expression: "sum", numberFormat: "#,##0"}},

    // 패턴 포맷 (등록번호)
    {fieldName: "REG_NO", width: "130", header: {text: "등록번호"},
     editable: false,
     textFormat: "([0-9]{3})([0-9]{2})([0-9]{5});$1-$2-$3"},

    // 날짜 (렌더러)
    {fieldName: "DATE", width: "120", header: {text: "날짜"},
     editable: false,
     renderer: {
         type: "html",
         callback: function(grid, cell) {
             return StringUtil.toDate(cell.value, "-");
         }
     }}
];
```

### 데이터 로딩 (KiiPS 패턴)

```javascript
function getData(searchCond) {
    logosAjax.requestTokenGrid(
        gridView,
        gToken,
        "${KiiPS_FD}/FDAPI/FD0101/LIST",
        "post",
        searchCond,
        function(data) {
            dataProvider.setRows(data.body.list);
            gridView.refresh();
        }
    );
}
```

### 멀티 레벨 헤더 (Column Groups)

```javascript
// 기본 2단 헤더
gridView.setColumnLayout([
    "RANK",
    "COMPANY_NM",
    {
        name: "GROUP1",
        header: {text: "그룹 헤더 1"},
        columns: ["COL1", "COL2", "COL3"]
    },
    {
        name: "GROUP2",
        header: {text: "그룹 헤더 2"},
        columns: ["COL4", "COL5", "COL6"]
    },
    "TOTAL"
]);

gridView.header.height = 60;  // 2단 헤더용
```

| 옵션 | 사용법 | 설명 |
|------|--------|------|
| `header.height` | `50` | 2단 헤더 (단일 높이) |
| `header.heights` | `[30, 30]` | 2단 헤더 (행별 높이) |
| `header.heights` | `[30, 30, 30]` | 3단 헤더 |

---

## Quick Reference

### 커스텀 렌더러 (common_grid.js)

```javascript
// 렌더러 등록 + 컬럼 적용
fn_grid_renderer(gridView, 'renderer_imgbtn');

{fieldName: "SEARCH", width: "50", header: {text: "조회"},
 renderer: "renderer_imgbtn"}
```

**자주 사용하는 렌더러:**

| 렌더러명 | 용도 |
|----------|------|
| `renderer_imgbtn` | 검색 버튼 (일반 팝업) |
| `renderer_account` | 계정과목 검색 |
| `renderer_lpapprv` | LP 승인 상태 |
| `renderer_save` | 저장 버튼 |
| `renderer_del` | 삭제 버튼 |
| `renderer_enterprise` | 기업 검색 |
| `renderer_searchbtn` | 검색 버튼 |

> 전체 24개 렌더러 목록은 [reference.md](reference.md) 참조

### 기본 이벤트 바인딩

```javascript
// 행 선택 변경
gridView.onCurrentRowChanged = function(grid, oldRow, newRow) {
    if (newRow >= 0) {
        const rowData = dataProvider.getJsonRow(newRow);
    }
};

// 셀 더블클릭
gridView.onCellDblClicked = function(grid, clickData) {
    const rowData = dataProvider.getJsonRow(clickData.dataRow);
    openDetailModal(rowData);
};
```

### CSS 클래스

| Class | 설명 | 사용 |
|-------|------|------|
| `left-column` | 좌측 정렬 | 텍스트 |
| `center-column` | 중앙 정렬 | 코드, 상태 |
| `right-column` | 우측 정렬 | 숫자 |
| `editable-column` | 편집 가능 | 입력 필드 |
| `unicorn-blue-text` | 파란색 | 강조 숫자 |
| `unicorn-bold-text` | 굵은 글씨 | 합계 |

---

## Best Practices

### Do

```javascript
// 일관된 필드/컬럼 이름
{ name: 'navAmount', fieldName: 'navAmount' }

// 타입 일치
{ fieldName: 'navAmount', dataType: 'number' }
{ name: 'navAmount', editor: { type: 'number' } }

// 올바른 이벤트 핸들링
gridView.onEditCommit = function(grid, index) {
    saveToServer(index);  // 외부 함수 호출
};
```

### Don't

```javascript
// 순환 참조
gridView.onEditCommit = function(grid, index) {
    grid.commit();  // 무한 루프!
};

// 필드/컬럼 불일치
{ name: 'amount', fieldName: 'navAmount' }  // 불일치

// 타입 불일치
{ fieldName: 'amount', dataType: 'number' }
{ name: 'amount', editor: { type: 'text' } }  // 불일치
```

---

## 체크리스트

- [ ] `createMainGrid()` 으로 초기화
- [ ] 필드 dataType과 에디터 type 일치
- [ ] 숫자 컬럼에 `numberFormat: "#,##0"` 설정
- [ ] 날짜 컬럼에 `StringUtil.toDate()` 렌더러 적용
- [ ] 멀티 레벨 헤더 시 `header.heights` 배열 설정
- [ ] 편집 가능 컬럼에 `styleName: "editable-column"` 적용
- [ ] Excel Export 시 `fileName`에 날짜 포함
- [ ] 대량 데이터 시 가상 스크롤 + 고정 rowHeight 확인

## Success Metrics

- 그리드 초기화: < 500ms
- 1만 행 렌더링: < 1초
- Excel Export (1만 행): < 3초
- 셀 편집 응답 시간: < 100ms
- 메모리 사용량: < 50MB (1만 행 기준)

## Related Resources

| 리소스 | 경로 |
|--------|------|
| **공통 함수** | `KiiPS-UI/src/main/resources/static/js/common_grid.js` |
| **스타일** | `/vendor/realgrid.2.6.3/realgrid-style.scss` |
| **종합 가이드** | `docs/REALGRID_GUIDE.md` |
| **SCSS 가이드** | `docs/SCSS_GUIDE.md` |

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
