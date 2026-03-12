# KiiPS Page Pattern Guide - Reference

## Part 5: Script 구조

### 5.1 전체 Script 레이아웃

```javascript
<script>
// ===== 1. 컬럼 정의 =====
let MAIN_COLUMNS = [ /* ... */ ];

// ===== 2. 그리드 초기화 =====
let dataProvider = new RealGrid.LocalDataProvider(true);
let gridView = new RealGrid.GridView("TB_{SCREEN_ID}");
createMainGrid("TB_{SCREEN_ID}", dataProvider, gridView, MAIN_COLUMNS);

// ===== 3. 그리드 옵션 =====
gridView.displayOptions.minRowHeight = 50;
gridView.editOptions.appendable = false;
gridView.setRowIndicator({visible: true});

// ===== 5. document.ready =====
$(document).ready(function(){
    MAIN_SEARCH_FILTER();
});

// ===== 6. MAIN_SEARCH_FILTER =====
function MAIN_SEARCH_FILTER() {
    var item = $("#FILTER_INPUT_TAG").tagsinput("items");
    let searchCond = createObjectForSearchAjax(item);
    logosAjax.requestToken(gToken,
        "${KiiPS_{DOMAIN}}/{DOMAIN}API/{SCREEN_ID}/LIST", "post",
        searchCond, function(data) {
            dataProvider.setRows(data.body.LIST);
            setPaging(gridView, 10, "#paging");
            gridView.refresh();
        }
    );
}

// ===== 7. CRUD 함수 =====
function myCreateFunction(grid) { /* 행추가 */ }
function myDeleteFunction(gv, dp) { /* 행삭제 */ }

// ===== 8. Excel =====
function excelExport() { /* 엑셀 다운로드 */ }

// ===== 9. Lookup =====
fnCustNo().then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
});

// ===== 10. Validate + Submit =====
const validator = $("#form").validate({ /* ... */ });
</script>
```

### 5.2 MAIN_SEARCH_FILTER 패턴

**핵심 원칙**: `inc_filter_main.jsp`의 TagsInput에서 검색조건을 수집하여 API 호출

```javascript
function MAIN_SEARCH_FILTER() {
    var item = $("#FILTER_INPUT_TAG").tagsinput("items");
    let searchCond = createObjectForSearchAjax(item);
    // searchCond: { EMP_CUST_NO: '001', BASE_DT: '20260101', ... }

    logosAjax.requestToken(gToken,
        "${KiiPS_{DOMAIN}}/{DOMAIN}API/{SCREEN_ID}/LIST",
        "post", searchCond,
        function(data) {
            dataProvider.setRows(data.body.LIST);
            setPaging(gridView, 10, "#paging");
            gridView.refresh();
        }
    );
}
```

### 5.3 API URL 규칙

```
${KiiPS_{DOMAIN}}/{DOMAIN}API/{SCREEN_ID}/{ACTION}
```

| ACTION | 용도 | HTTP |
|--------|------|------|
| LIST | 목록 조회 | POST |
| VIEW | 상세 조회 | POST |
| SAVE | 저장 (신규+수정) | POST |
| DELETE | 삭제 | POST |
| CONFIRM | 확정 | POST |
| CANCEL | 확정취소 | POST |

### 5.4 행추가/행삭제 공통 함수

```javascript
// 행추가
function myCreateFunction(grid) {
    let dataprovider = grid.getDataSource();
    grid.commit(true);
    let log = grid.validateCells(dataprovider.getRowCount()-1, false);
    if (log) {
        MESSAGE_HANDLE('GRID_VALIDATE_ERROR');
        return;
    }
    dataprovider.addRow({});
    grid.commit(true);
}

// 행삭제
function myDeleteFunction(gv, dp) {
    let items = gv.getCurrent().itemIndex;
    if (items.length == 0) {
        MESSAGE_HANDLE('선택 항목이 없습니다.');
        return false;
    }
    gv.cancel(true);
    setDeleteRow(gv, dp);
}
```

### 5.5 엑셀 다운로드

```javascript
function excelExport() {
    excelExport_EXT([{ grid: gridView, sheetName: '{시트명}' }], false);
}
```

---

## Part 6: 도메인별 버튼 등록

### 6.1 버튼 파일에 분기 추가

새 페이지를 만들면 반드시 해당 도메인의 버튼 파일에 SCREEN_ID 분기를 추가해야 합니다.

**파일 위치**: `include/button/inc_{domain}_button.jsp`

| 도메인 | 파일명 |
|--------|--------|
| IL | inc_il_button.jsp |
| FD | inc_fd_button.jsp |
| AC | inc_ac_button.jsp |
| SY | inc_sy_button.jsp |

### 등록 패턴

```jsp
}else if(MENU_SCREEN_ID.equals("{SCREEN_ID}")){
%>
<div class="col-12 col-lg-auto mb-3 mb-lg-0 pl-0 pr-0 mt-3">
    <div class="main_gridRow">
        <div class="gridpage_info">
            <div class="in-bl px-3 brd_card rounded-5">
                <span id="Total_Cnt">Total 1000</span>
            </div>
        </div>
        <div class="maingrid_button">
            <!-- 버튼 구성 -->
        </div>
    </div>
</div>
<%
```

### 6.2 버튼 조합 패턴

#### 기본 조회 페이지

조회(icon_reload) + 엑셀(inc_excel_button.jsp) + 도움말(icon_question)

#### 편집 페이지

조회 + 행추가(icon_plus) + 행삭제(icon_trash) + 엑셀 + 도움말

#### CRUD 페이지

관리자(icon_admin, dropdown) + 조회 + 등록(icon_plus) + 삭제(icon_trash, 관리자만) + 인쇄(icon_print) + 엑셀 + 도움말

### 아이콘 클래스 참조

| 아이콘 | 클래스 | 용도 |
|--------|--------|------|
| 조회 | `icon_reload` | MAIN_SEARCH_FILTER() |
| 추가 | `icon_plus` | 등록 모달 또는 행추가 |
| 삭제 | `icon_trash` | 행삭제 또는 서버 삭제 |
| 엑셀 | `icon_excel` | 엑셀 다운로드 |
| 인쇄 | `icon_print` | 인쇄/리포트 |
| 도움말 | `icon_question` | 화면 도움말 |
| 관리자 | `icon_admin` | 관리자 드롭다운 |
| 저장 | `icon_save` | 저장 |

---

## Part 7: Lookup 초기화 패턴

### 7.1 공통 코드 Lookup

```javascript
fnCommCode("{TPCD}").then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
});
```

### 7.2 사원 목록 Lookup

```javascript
fnCustNo().then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
    $('#selectId').html(fnCreateSelectOpt(data));
    $('#selectId').selectpicker('refresh');
});
```

### 7.3 투자기업 Lookup

```javascript
fnInvCustNo('trdOnly', true).then(function(data) {
    createLookupColumn(gridView, 'CUST_NO', data);
});
```

---

## Part 8: Validate + Submit 패턴

```javascript
const validator = $("#{formId}").validate({
    ignore: ".ignore",
    rules: {
        FIELD1: { required: true },
        FIELD2: { required: true }
    },
    submitHandler: function(form) {
        // 1. 그리드 유효성 검사
        gridViewRG.validateCells();
        let logs = gridViewRG.getInvalidCells();
        if (logs) {
            MESSAGE_HANDLE('GRID_VALIDATE_ERROR');
            return false;
        }
        gridViewRG.commit(true);

        // 2. 데이터 수집
        let obj = {};
        obj.MASTER = gatherComponent('#{formId}');
        obj.DETAIL = obj.MASTER.dataProviderRG;
        delete obj.MASTER.dataProviderRG;

        // 3. API 호출
        logosAjax.requestToken(gToken,
            "${KiiPS_{DOMAIN}}/{DOMAIN}API/{SCREEN_ID}/SAVE", "post", obj,
            function(data) {
                MESSAGE_HANDLE('save');
                $('#{modalId}').modal('hide');
                MAIN_SEARCH_FILTER();
            }
        );
    }
});
```

