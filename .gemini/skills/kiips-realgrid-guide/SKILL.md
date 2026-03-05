---
name: KiiPS RealGrid Guide
description: |
  RealGrid 2.6.3 종합 가이드 - 그리드 생성, 설정, 에디터, Excel, 성능 최적화.
  Use when: RealGrid 관련 작업 (그리드 생성, 컬럼 설정, Excel, 필터링, 성능 최적화)
version: 1.0.0
priority: critical
enforcement: require
category: ui-development
disclosure:
  summary: true      # name + description 만 로드
  expanded: true     # Quick Reference + 핵심 패턴
  full: true         # 전체 가이드 (8 Parts)
  default: expanded  # 기본 로딩 레벨
tags:
  - realgrid
  - realgrid-2.6.3
  - grid
  - table
  - generator
  - template
  - excel
  - editor
  - performance
author: KiiPS Development Team
lastUpdated: 2026-02-02
---

# KiiPS RealGrid Guide

RealGrid 2.6.3 종합 가이드입니다. 그리드 생성부터 고급 설정, Excel 기능, 성능 최적화까지 모든 내용을 다룹니다.

## 📋 Purpose

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

## 🎯 When to Use

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

# Part 1: 그리드 생성 (Generator)

## 1.1 기본 초기화 패턴

```javascript
// JSP Container
<div id="TB_GRID_ID"></div>

// JavaScript
let dataProvider = new RealGrid.LocalDataProvider(true);
let gridView = new RealGrid.GridView("TB_GRID_ID");

// KiiPS 공통 초기화 (핵심!)
createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);
```

## 1.2 컬럼 정의

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

## 1.3 멀티 레벨 헤더 (Column Groups)

### 기본 2단 헤더

```javascript
gridView.setColumnLayout([
    "RANK",           // 일반 컬럼
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

// 2단 헤더용 높이 설정
gridView.header.height = 60;
```

### 다단 헤더 (3단 이상)

**핵심**: `header.heights` 배열 + 중첩 `items` 구조 사용

```javascript
var layout = [
    "COL1", "COL2", "COL3",
    {
        name: "Group",
        direction: "horizontal",
        items: [
            "COL4",
            "COL5",
            {
                name: "InnerGroup",
                direction: "horizontal",
                items: ["COL6", "COL7", "COL8", "COL9"],
                header: {text: "내부 그룹 헤더"}
            },
            "COL10"
        ],
        header: {text: "외부 그룹 헤더"}
    }
];

gridView.setColumnLayout(layout);
gridView.header.heights = [28, 28, 28];  // 3단 헤더
```

### 헤더 높이 옵션

| 옵션 | 사용법 | 설명 |
|------|--------|------|
| `header.height` | `50` | 2단 헤더 (단일 높이) |
| `header.heights` | `[30, 30]` | 2단 헤더 (행별 높이) |
| `header.heights` | `[30, 30, 30]` | 3단 헤더 |

## 1.4 데이터 로딩 (KiiPS 패턴)

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

## 1.5 커스텀 렌더러 (common_grid.js)

### 렌더러 등록 및 사용

```javascript
// 1. 렌더러 등록
fn_grid_renderer(gridView, 'renderer_imgbtn');

// 2. 컬럼에 적용
{fieldName: "SEARCH", width: "50", header: {text: "조회"},
 renderer: "renderer_imgbtn"}
```

### 전체 렌더러 목록 (24개)

| 렌더러명 | 용도 |
|----------|------|
| `renderer_invstcom` | 투자재원배분 기업 검색 |
| `renderer_imgbtn` | 주주명 검색 (일반 팝업) |
| `renderer_zipcode` | 우편번호 검색 |
| `renderer_custnm` | 회사주주관리 거래처 검색 |
| `renderer_exchange` | 환율정보 조회 |
| `renderer_zipcode_grid` | 그리드 내 우편번호 검색 |
| `renderer_remove_apprv` | 전자결재 결재선 취소 |
| `renderer_account` | 계정과목 검색 |
| `renderer_account_dr` | 차변 계정과목 검색 |
| `renderer_account_cr` | 대변 계정과목 검색 |
| `renderer_account_nm` | 계정과목명 검색 |
| `renderer_enterprise` | 기업 검색 |
| `renderer_code_brch` | 지점 코드 검색 |
| `renderer_save` | 저장 버튼 |
| `renderer_del` | 삭제 버튼 |
| `renderer_searchbtn` | 검색 버튼 |
| `renderer_searchacitcd` | 계정과목코드 검색 |
| `renderer_lpapprv` | LP 승인 상태 |
| `renderer_lpapprv_2` | LP 승인 상태 v2 |
| `renderer_shaped` | 도형 렌더러 |
| `renderer_searchEmployee` | 직원 검색 |
| `renderer_CUST_NO` | 고객번호 검색 |
| `renderer_Inquire` | 조회 버튼 |
| `renderer_stockholder_info` | 주주 정보 |

### 자주 사용하는 렌더러

```javascript
fn_grid_renderer(gridView, 'renderer_imgbtn');    // 검색 버튼
fn_grid_renderer(gridView, 'renderer_account');   // 계정 조회
fn_grid_renderer(gridView, 'renderer_lpapprv');   // LP 승인 상태
fn_grid_renderer(gridView, 'renderer_save');      // 저장 버튼
fn_grid_renderer(gridView, 'renderer_del');       // 삭제 버튼
```

---

# Part 2: 고급 설정 (Builder)

## 2.1 필드 정의 (setFields)

```javascript
function setupFields() {
    dataProvider.setFields([
        // 텍스트
        { fieldName: 'fundCode', dataType: 'text' },
        { fieldName: 'fundName', dataType: 'text' },

        // 숫자
        { fieldName: 'navAmount', dataType: 'number' },
        { fieldName: 'totalAsset', dataType: 'number' },

        // 날짜/시간
        { fieldName: 'regDate', dataType: 'datetime' },
        { fieldName: 'updateDate', dataType: 'date' },

        // 불린
        { fieldName: 'isActive', dataType: 'boolean' }
    ]);
}
```

**Data Types**: `text`, `number`, `datetime`, `date`, `boolean`

## 2.2 셀 에디터 (Editable Columns)

### 텍스트 에디터

```javascript
{
    name: 'fundName',
    fieldName: 'fundName',
    header: { text: '펀드명' },
    width: 200,
    editable: true,
    editor: {
        type: 'text',
        maxLength: 100,
        textCase: 'upper',  // 'upper', 'lower', 'normal'
        IME: { mode: 'hangul' }
    },
    styleName: 'editable-column'
}
```

### 숫자 에디터

```javascript
{
    name: 'investAmount',
    fieldName: 'investAmount',
    header: { text: '투자금액 (원)' },
    width: 150,
    editable: true,
    editor: {
        type: 'number',
        editFormat: '#,##0',
        min: 0,
        max: 9999999999,
        step: 1000,
        integerOnly: false
    },
    numberFormat: '#,##0',
    styleName: 'editable-column'
}
```

### 드롭다운 에디터

```javascript
{
    name: 'fundType',
    fieldName: 'fundType',
    header: { text: '펀드유형' },
    width: 120,
    editable: true,
    editor: {
        type: 'dropdown',
        dropDownCount: 10,
        domainOnly: true,
        textReadOnly: true
    },
    values: ['EQUITY', 'BOND', 'MIXED', 'ALTERNATIVE'],
    labels: ['주식형', '채권형', '혼합형', '대체투자형'],
    lookupDisplay: true
}
```

### 날짜 선택기

```javascript
{
    name: 'investDate',
    fieldName: 'investDate',
    header: { text: '투자일' },
    width: 120,
    editable: true,
    editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        minDate: '2020-01-01',
        maxDate: '2030-12-31',
        openOnClick: true
    },
    datetimeFormat: 'yyyy-MM-dd'
}
```

### 멀티라인 텍스트

```javascript
{
    name: 'memo',
    fieldName: 'memo',
    header: { text: '메모' },
    width: 200,
    editable: true,
    editor: {
        type: 'multiline',
        maxLength: 500,
        rows: 5
    }
}
```

## 2.3 Grid 옵션 설정

```javascript
function setupOptions() {
    // 표시 옵션
    gridView.setDisplayOptions({
        fitStyle: 'fill',           // 'even', 'fill', 'none'
        selectionStyle: 'rows',     // 'rows', 'columns', 'cells'
        columnResizable: true,
        rowHeight: 32,
        headerHeight: 40
    });

    // 편집 옵션
    gridView.setEditOptions({
        editable: true,
        insertable: false,
        appendable: false,
        updatable: true,
        deletable: false,
        validateOnEdited: true,
        commitWhenEnter: true
    });

    // 복사/붙여넣기 옵션
    gridView.setCopyOptions({
        enabled: true,
        singleMode: false,
        copyDisplayText: true,
        copyHeaders: false
    });

    // 정렬 옵션
    gridView.setSortingOptions({
        enabled: true,
        style: 'exclusive'
    });

    // 필터링 옵션
    gridView.setFilteringOptions({
        enabled: true
    });
}
```

---

# Part 3: Excel 기능

## 3.1 Excel Export

```javascript
function exportToExcel() {
    gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: '펀드목록_' + new Date().toISOString().split('T')[0] + '.xlsx',

        documentTitle: {
            message: '펀드 목록',
            visible: true,
            spaceTop: 1,
            spaceBottom: 0,
            height: 60,
            styles: { fontSize: 20, fontBold: true }
        },

        header: { visible: true },
        footer: {
            visible: true,
            message: '출력일: ' + new Date().toLocaleDateString()
        },

        showProgress: true,
        progressMessage: '엑셀 파일 생성 중...',

        done: function() {
            console.log('Excel export completed');
        },

        failed: function(error) {
            console.error('Excel export failed:', error);
            alert('엑셀 다운로드 실패');
        }
    });
}
```

## 3.2 Excel Import

```javascript
function importFromExcel(file) {
    gridView.importData({
        type: 'excel',
        file: file,

        append: false,
        fillMode: 'set',
        fillPos: 0,

        mapping: [
            { excelColumn: 'A', fieldName: 'fundCode' },
            { excelColumn: 'B', fieldName: 'fundName' },
            { excelColumn: 'C', fieldName: 'fundType' },
            { excelColumn: 'D', fieldName: 'navAmount' }
        ],

        done: function() {
            alert('엑셀 데이터를 가져왔습니다.');
        },

        failed: function(error) {
            alert('엑셀 가져오기 실패: ' + error.message);
        }
    });
}

// HTML
<input type="file" id="excelFile" accept=".xlsx, .xls"
       onchange="importFromExcel(this.files[0])">
```

---

# Part 4: 필터링 & 그룹핑

## 4.1 자동 필터

```javascript
gridView.setColumnFilters('fundType', [
    { name: 'EQUITY', criteria: "value = 'EQUITY'", text: '주식형' },
    { name: 'BOND', criteria: "value = 'BOND'", text: '채권형' },
    { name: 'MIXED', criteria: "value = 'MIXED'", text: '혼합형' }
]);
```

## 4.2 프로그래매틱 필터

```javascript
function applyFilter(fundType, minAmount) {
    let filterStr = '';

    if (fundType) {
        filterStr += `fundType = '${fundType}'`;
    }

    if (minAmount > 0) {
        if (filterStr) filterStr += ' and ';
        filterStr += `navAmount >= ${minAmount}`;
    }

    dataProvider.setFilters(filterStr);
}

// 필터 해제
function clearFilter() {
    dataProvider.clearFilters();
}
```

## 4.3 그룹핑 & 집계

```javascript
// 그룹 패널 활성화
gridView.setGroupPanel({ visible: true });

// 프로그래매틱 그룹핑
gridView.groupBy(['fundType', 'investYear'], {
    sorting: [{ field: 'fundType', ascending: true }],
    summaryMode: 'aggregate',
    footer: {
        visible: true,
        expression: 'sum',
        numberFormat: '#,##0'
    }
});

// 그룹 해제
gridView.clearGrouping();
```

---

# Part 5: 이벤트 핸들러

```javascript
function setupEvents() {
    // 행 선택 변경
    gridView.onCurrentRowChanged = function(grid, oldRow, newRow) {
        if (newRow >= 0) {
            const rowData = dataProvider.getJsonRow(newRow);
            console.log('Selected:', rowData);
        }
    };

    // 셀 클릭
    gridView.onCellClicked = function(grid, clickData) {
        console.log('Cell clicked:', clickData);
    };

    // 셀 더블클릭
    gridView.onCellDblClicked = function(grid, clickData) {
        const rowData = dataProvider.getJsonRow(clickData.dataRow);
        openDetailModal(rowData);
    };

    // 편집 완료 후
    gridView.onEditCommit = function(grid, index, oldValue, newValue) {
        console.log('Edit committed:', oldValue, newValue);
        saveChangesToServer(index, newValue);
    };

    // 체크박스 변경
    gridView.onItemChecked = function(grid, itemIndex, checked) {
        console.log('Item checked:', itemIndex, checked);
    };
}
```

---

# Part 6: 성능 최적화

## 6.1 가상 스크롤

```javascript
gridView.setDisplayOptions({
    fitStyle: 'fill',
    rowHeight: 32  // 고정 높이 필수!
});
```

## 6.2 지연 로딩 (Lazy Loading)

```javascript
let currentPage = 1;
const pageSize = 100;

function loadData(page = 1) {
    $.ajax({
        url: '/api/funds/list',
        data: { page: page, size: pageSize },
        success: function(response) {
            if (page === 1) {
                dataProvider.setRows(response.data.list);
            } else {
                dataProvider.addRows(response.data.list);
            }
        }
    });
}

// 스크롤 이벤트
gridView.onScrollToBottom = function(grid) {
    if (hasMoreData) {
        loadData(++currentPage);
    }
};
```

## 6.3 Soft Delete

```javascript
dataProvider.setOptions({
    softDeleting: true,
    deleteCreated: true
});

// 변경사항 커밋
function commitChanges() {
    const deletedRows = dataProvider.getAllStateRows().deleted;
    const updatedRows = dataProvider.getAllStateRows().updated;
    const createdRows = dataProvider.getAllStateRows().created;

    saveToServer({ deleted: deletedRows, updated: updatedRows, created: createdRows });
    dataProvider.commit();
}
```

---

# Part 7: 템플릿

## 7.1 JSP 템플릿

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<spring:eval expression="@environment.getProperty('KiiPS.FD.URL')" var="KiiPS_FD"/>
<spring:eval expression="@environment.getProperty('KiiPS.GW.URL')" var="KiiPS_GATE"/>

<div class="card">
    <div class="card-header">
        <h5 class="mb-0">그리드 제목</h5>
    </div>
    <div class="card-body">
        <div id="TB_GRID_ID"></div>
    </div>
</div>

<script>
var gToken = "${gToken}";
var dataProvider, gridView;

$(document).ready(function() {
    initGrid();
    loadData();
});

function initGrid() {
    dataProvider = new RealGrid.LocalDataProvider(true);
    gridView = new RealGrid.GridView("TB_GRID_ID");

    let columns = [
        // 컬럼 정의
    ];

    createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);
}

function loadData() {
    logosAjax.requestTokenGrid(gridView, gToken,
        "${KiiPS_FD}/FDAPI/SERVICE/LIST", "post", {},
        function(data) {
            dataProvider.setRows(data.body.list);
            gridView.refresh();
        });
}
</script>
```

## 7.2 JavaScript 모듈 템플릿

```javascript
/**
 * Grid Name: TB_GRID_ID
 * Description: 그리드 설명
 */
(function() {
    'use strict';

    let dataProvider, gridView;

    function init() {
        dataProvider = new RealGrid.LocalDataProvider(true);
        gridView = new RealGrid.GridView("TB_GRID_ID");

        setupColumns();
        setupOptions();
        setupEvents();
        loadData();
    }

    function setupColumns() {
        let columns = [
            {fieldName: "COL1", width: "100", header: {text: "컬럼1"},
             editable: false, styleName: "center-column"},
            {fieldName: "COL2", width: "150", header: {text: "컬럼2"},
             editable: false, styleName: "left-column"},
            {fieldName: "AMOUNT", width: "120", header: {text: "금액"},
             editable: false, dataType: "number", numberFormat: "#,##0",
             styleName: "right-column"}
        ];

        createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);
    }

    function setupOptions() {
        gridView.editOptions.editable = false;
        gridView.displayOptions.rowHeight = 36;
        gridView.displayOptions.fitStyle = "even";
        gridView.stateBar.visible = false;
        gridView.checkBar.visible = false;
        gridView.footer.visible = false;
    }

    function setupEvents() {
        gridView.onCellClicked = function(grid, clickData) {
            console.log('Cell clicked:', clickData);
        };
    }

    function loadData(searchCond) {
        searchCond = searchCond || {};
        logosAjax.requestTokenGrid(gridView, gToken,
            apiUrl, "post", searchCond,
            function(data) {
                dataProvider.setRows(data.body.list);
                gridView.refresh();
            });
    }

    // Public API
    window.GridModule = { init, loadData };

    $(document).ready(init);
})();
```

---

# Part 8: 스타일

## 8.1 CSS 클래스

| Class | 설명 | 사용 |
|-------|------|------|
| `left-column` | 좌측 정렬 | 텍스트 |
| `center-column` | 중앙 정렬 | 코드, 상태 |
| `right-column` | 우측 정렬 | 숫자 |
| `editable-column` | 편집 가능 | 입력 필드 |
| `unicorn-blue-text` | 파란색 | 강조 숫자 |
| `unicorn-bold-text` | 굵은 글씨 | 합계 |

## 8.2 CSS 변수 (테마)

```scss
var(--color)                       // 기본 텍스트 색상
var(--rgTable-background-color)    // 그리드 배경색
var(--rgTable-border-color)        // 테두리 색상
var(--rgTable-header-background)   // 헤더 배경색
```

---

# Part 9: Best Practices

## ✅ Do

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

## ❌ Don't

```javascript
// 순환 참조
gridView.onEditCommit = function(grid, index) {
    grid.commit();  // ✗ 무한 루프!
};

// 필드/컬럼 불일치
{ name: 'amount', fieldName: 'navAmount' }  // ✗

// 타입 불일치
{ fieldName: 'amount', dataType: 'number' }
{ name: 'amount', editor: { type: 'text' } }  // ✗
```

---

## 📊 Success Metrics

- ✅ 그리드 초기화: < 500ms
- ✅ 1만 행 렌더링: < 1초
- ✅ Excel Export (1만 행): < 3초
- ✅ 셀 편집 응답 시간: < 100ms
- ✅ 메모리 사용량: < 50MB (1만 행 기준)

---

## 🔗 Related Resources

| 리소스 | 경로 |
|--------|------|
| **공통 함수** | `KiiPS-UI/src/main/resources/static/js/common_grid.js` |
| **스타일** | `/vendor/realgrid.2.6.3/realgrid-style.scss` |
| **종합 가이드** | `docs/REALGRID_GUIDE.md` |
| **SCSS 가이드** | `docs/SCSS_GUIDE.md` |

---

**Version**: 1.0.0
**Last Updated**: 2026-01-13
**RealGrid Version**: 2.6.3
**Author**: KiiPS Development Team
