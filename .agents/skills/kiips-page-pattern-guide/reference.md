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

## Part 5.6: 공통 팝업 호출 패턴 (COMM_POPUP_NEW)

### 함수 시그니처

```javascript
// common.js에 정의됨 (전역)
COMM_POPUP_NEW(URL, pop_id, key, width, height)
```

| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `URL` | API Gateway URL | `'${KiiPS_GATE}'` |
| `pop_id` | 팝업 JSP ID (`POPUP/{pop_id}.jsp`로 매핑) | `'PG0916POP'`, `'CHECK_PIDF'` |
| `key` | 팝업에 전달할 파라미터 객체 (또는 빈 문자열) | `param`, `rtnObj`, `''` |
| `width` | 팝업 너비 (문자열) | `'1200'` |
| `height` | 팝업 높이 (문자열) | `'900'` |

### 내부 동작 (자동 처리)

- `key.MENU_ID` 미설정 시 → 현재 화면 `MENU_ID` 자동 할당
- `key.gtoken` → `gToken` 자동 할당
- 팝업 위치 → 화면 중앙 자동 계산
- `target` → `pop_id + key.invtex_seq`로 생성 (동일 대상 재오픈 시 기존 팝업 재사용)
- `COMM_PUPUP_FORM`으로 POST 전송 → `{URL}/COM/POPUP`

### 표준 사용법

```javascript
// 기본 호출 (파라미터 없이)
COMM_POPUP_NEW('${KiiPS_GATE}', 'PG0404_CKD', '', '800', '900');

// 파라미터 전달
function fn_openPopup(grid, clickData) {
    var rowData = grid.getValues(clickData.itemIndex);
    var param = {
        FIELD1: rowData.FIELD1,
        FIELD2: StringUtil.nvl(rowData.FIELD2, ''),
        invtex_seq: rowData.UNIQUE_KEY  // 동일 대상 재오픈 방지용
    };
    COMM_POPUP_NEW('${KiiPS_GATE}', '{POP_ID}', param, '1200', '900');
}

// 검색 팝업 (inline onclick)
<button type="button" class="btn btn-only-icon btn-sm btn-outline-primary text-4"
    onclick="COMM_POPUP_NEW('${KiiPS_GATE}','SEARCH_ORG','COMM_POPUP_SCHEDULE', '1000','900')">
    <span class="icon_treeView"></span>
</button>
```

### Anti-Pattern (금지)

```javascript
// BAD: 수동으로 팝업 열기 (gToken, MENU_ID, 위치 계산 중복)
param.gtoken = gToken;
var width = 1200;
var popupX = (window.screen.width / 2) - (width / 2);
var popupY = (window.screen.height / 2) - (height / 2);
var win = window.open("", target, "width=...");
var form = document.COMM_PUPUP_FORM;
form.POP_ID.value = 'PG0916POP';
form.key.value = JSON.stringify(param);
form.action = '${KiiPS_GATE}/COM/POPUP';
form.submit();

// GOOD: COMM_POPUP_NEW 사용
COMM_POPUP_NEW('${KiiPS_GATE}', 'PG0916POP', param, '1200', '900');
```

### 주요 사용 사례

| 용도 | pop_id 예시 | 크기 |
|------|-------------|------|
| 조직도 | `SEARCH_ORG` | 1000x900 |
| 전표 조회 | `SLIP` | 1800x900 |
| 이력 조회 | `HISTRYAPP` | 1000x450 |
| 인쇄 미리보기 | `PRINT_VIEW` | 1200x1000 |
| 클립소프트 | `CLIPSOFT` | 811x900 |
| 결재 조회 | `APPR_VIEW` | 960x940 |
| 화면별 팝업 | `{SCREEN_ID}POP` | 화면별 상이 |

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

