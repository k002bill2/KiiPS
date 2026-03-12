# KiiPS RealGrid Examples

실전 그리드 생성, Excel 처리, 템플릿 예제 모음입니다.

---

## Excel Export 예제

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

---

## Excel Import 예제

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

## JSP 페이지 전체 템플릿

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

---

## JavaScript 모듈 템플릿

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

## 편집 그리드 예제

편집 가능한 그리드의 전체 설정 예제:

```javascript
function initEditableGrid() {
    dataProvider = new RealGrid.LocalDataProvider(true);
    gridView = new RealGrid.GridView("TB_EDIT_GRID");

    dataProvider.setFields([
        { fieldName: 'fundCode', dataType: 'text' },
        { fieldName: 'fundName', dataType: 'text' },
        { fieldName: 'fundType', dataType: 'text' },
        { fieldName: 'investAmount', dataType: 'number' },
        { fieldName: 'investDate', dataType: 'datetime' },
        { fieldName: 'memo', dataType: 'text' }
    ]);

    let columns = [
        // 텍스트 (읽기 전용)
        {fieldName: "fundCode", width: "100", header: {text: "펀드코드"},
         editable: false, styleName: "center-column"},

        // 텍스트 (편집 가능)
        {fieldName: "fundName", width: "200", header: {text: "펀드명"},
         editable: true,
         editor: { type: 'text', maxLength: 100 },
         styleName: "editable-column"},

        // 드롭다운
        {fieldName: "fundType", width: "120", header: {text: "유형"},
         editable: true,
         editor: { type: 'dropdown', domainOnly: true, textReadOnly: true },
         values: ['EQUITY', 'BOND', 'MIXED'],
         labels: ['주식형', '채권형', '혼합형'],
         lookupDisplay: true,
         styleName: "editable-column"},

        // 숫자
        {fieldName: "investAmount", width: "150", header: {text: "투자금액"},
         editable: true,
         editor: { type: 'number', editFormat: '#,##0', min: 0 },
         numberFormat: "#,##0",
         styleName: "editable-column right-column"},

        // 날짜
        {fieldName: "investDate", width: "120", header: {text: "투자일"},
         editable: true,
         editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', openOnClick: true },
         datetimeFormat: 'yyyy-MM-dd',
         styleName: "editable-column"},

        // 멀티라인
        {fieldName: "memo", width: "200", header: {text: "메모"},
         editable: true,
         editor: { type: 'multiline', maxLength: 500, rows: 3 },
         styleName: "editable-column"}
    ];

    createMainGrid("TB_EDIT_GRID", dataProvider, gridView, columns);

    // Soft Delete 활성화
    dataProvider.setOptions({ softDeleting: true });

    // 편집 옵션
    gridView.setEditOptions({
        editable: true,
        updatable: true,
        validateOnEdited: true,
        commitWhenEnter: true
    });
}
```

---

## 상위-하위 그리드 예제 (Parent-Child)

상위 그리드 선택 시 하위 그리드 갱신:

```javascript
var parentProvider, parentGrid;
var childProvider, childGrid;

function initParentChildGrid() {
    // 상위 그리드
    parentProvider = new RealGrid.LocalDataProvider(true);
    parentGrid = new RealGrid.GridView("TB_PARENT_GRID");

    let parentColumns = [
        {fieldName: "FUND_CD", width: "100", header: {text: "펀드코드"},
         editable: false, styleName: "center-column"},
        {fieldName: "FUND_NM", width: "200", header: {text: "펀드명"},
         editable: false, styleName: "left-column"},
        {fieldName: "TOTAL_AMT", width: "150", header: {text: "총자산"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"}
    ];

    createMainGrid("TB_PARENT_GRID", parentProvider, parentGrid, parentColumns);

    // 하위 그리드
    childProvider = new RealGrid.LocalDataProvider(true);
    childGrid = new RealGrid.GridView("TB_CHILD_GRID");

    let childColumns = [
        {fieldName: "INVEST_CD", width: "100", header: {text: "투자코드"},
         editable: false, styleName: "center-column"},
        {fieldName: "INVEST_NM", width: "200", header: {text: "투자대상"},
         editable: false, styleName: "left-column"},
        {fieldName: "INVEST_AMT", width: "150", header: {text: "투자금액"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "INVEST_DT", width: "120", header: {text: "투자일"},
         editable: false,
         renderer: {
             type: "html",
             callback: function(grid, cell) {
                 return StringUtil.toDate(cell.value, "-");
             }
         }}
    ];

    createMainGrid("TB_CHILD_GRID", childProvider, childGrid, childColumns);

    // 상위 행 선택 이벤트 -> 하위 갱신
    parentGrid.onCurrentRowChanged = function(grid, oldRow, newRow) {
        if (newRow >= 0) {
            var rowData = parentProvider.getJsonRow(newRow);
            loadChildData(rowData.FUND_CD);
        }
    };
}

function loadChildData(fundCode) {
    logosAjax.requestTokenGrid(childGrid, gToken,
        "${KiiPS_FD}/FDAPI/DETAIL/LIST", "post",
        { FUND_CD: fundCode },
        function(data) {
            childProvider.setRows(data.body.list);
            childGrid.refresh();
        });
}
```

---

## 멀티 레벨 헤더 그리드 예제

3단 헤더 + 그룹핑 예제:

```javascript
function initMultiHeaderGrid() {
    dataProvider = new RealGrid.LocalDataProvider(true);
    gridView = new RealGrid.GridView("TB_MULTI_GRID");

    let columns = [
        {fieldName: "RANK", width: "60", header: {text: "순위"},
         editable: false, styleName: "center-column"},
        {fieldName: "COMPANY_NM", width: "180", header: {text: "기업명"},
         editable: false, styleName: "left-column"},
        // 투자 정보 그룹
        {fieldName: "INVEST_AMT", width: "130", header: {text: "투자금액"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "INVEST_RATIO", width: "100", header: {text: "비중(%)"},
         editable: false, dataType: "number", numberFormat: "#,##0.00",
         styleName: "right-column"},
        // 수익 정보 그룹 - 평가 하위
        {fieldName: "EVAL_AMT", width: "130", header: {text: "평가금액"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "EVAL_PROFIT", width: "130", header: {text: "평가손익"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        // 수익 정보 그룹 - 실현 하위
        {fieldName: "REAL_PROFIT", width: "130", header: {text: "실현손익"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "REAL_RATIO", width: "100", header: {text: "수익률(%)"},
         editable: false, dataType: "number", numberFormat: "#,##0.00",
         styleName: "right-column"}
    ];

    createMainGrid("TB_MULTI_GRID", dataProvider, gridView, columns);

    // 3단 헤더 레이아웃
    var layout = [
        "RANK",
        "COMPANY_NM",
        {
            name: "InvestGroup",
            header: {text: "투자 정보"},
            columns: ["INVEST_AMT", "INVEST_RATIO"]
        },
        {
            name: "ProfitGroup",
            direction: "horizontal",
            header: {text: "수익 정보"},
            items: [
                {
                    name: "EvalGroup",
                    direction: "horizontal",
                    header: {text: "평가"},
                    items: ["EVAL_AMT", "EVAL_PROFIT"]
                },
                {
                    name: "RealGroup",
                    direction: "horizontal",
                    header: {text: "실현"},
                    items: ["REAL_PROFIT", "REAL_RATIO"]
                }
            ]
        }
    ];

    gridView.setColumnLayout(layout);
    gridView.header.heights = [28, 28, 28];
}
```

---

## 변경사항 저장 패턴

Soft Delete와 상태별 행 수집 예제:

```javascript
function commitChanges() {
    var stateRows = dataProvider.getAllStateRows();
    var removedRows = stateRows.deleted;
    var updatedRows = stateRows.updated;
    var createdRows = stateRows.created;

    saveToServer({
        removed: removedRows,
        updated: updatedRows,
        created: createdRows
    });
    dataProvider.commit();
}
```
