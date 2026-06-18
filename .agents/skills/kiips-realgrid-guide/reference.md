# KiiPS RealGrid Reference

상세 설정, 에디터, 필터링, 이벤트, 성능 최적화에 대한 레퍼런스 문서입니다.

---

## 필드 정의 (setFields)

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

---

## 셀 에디터 (Editable Columns)

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

---

## Grid 옵션 설정

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

## 다단 헤더 (3단 이상)

`header.heights` 배열 + 중첩 `items` 구조 사용:

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

---

## 전체 렌더러 목록 (24개)

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

---

## 필터링 & 그룹핑

### 자동 필터

```javascript
gridView.setColumnFilters('fundType', [
    { name: 'EQUITY', criteria: "value = 'EQUITY'", text: '주식형' },
    { name: 'BOND', criteria: "value = 'BOND'", text: '채권형' },
    { name: 'MIXED', criteria: "value = 'MIXED'", text: '혼합형' }
]);
```

### 프로그래매틱 필터

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

### 그룹핑 & 집계

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

## 이벤트 핸들러

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

## 성능 최적화

### 가상 스크롤

```javascript
gridView.setDisplayOptions({
    fitStyle: 'fill',
    rowHeight: 32  // 고정 높이 필수!
});
```

### 지연 로딩 (Lazy Loading)

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

### Soft Delete

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

## 스타일

### CSS 변수 (테마)

```scss
var(--color)                       // 기본 텍스트 색상
var(--rgTable-background-color)    // 그리드 배경색
var(--rgTable-border-color)        // 테두리 색상
var(--rgTable-header-background)   // 헤더 배경색
```

---

## 주의사항 (Anti-Patterns)

### styleName:"text-center" 사용 금지

RealGrid 기본 정렬이 중앙정렬이므로 `text-center`는 불필요하다.

```javascript
// BAD - 불필요한 text-center
{fieldName: "COL1", styleName: "text-center"}
{fieldName: "COL2", styleName: "text-center green-column"}

// GOOD - text-center 제거
{fieldName: "COL1"}
{fieldName: "COL2", styleName: "green-column"}
```

**정렬 변경이 필요한 경우만 명시**: `right-column` (우측), `left-column` (좌측)
