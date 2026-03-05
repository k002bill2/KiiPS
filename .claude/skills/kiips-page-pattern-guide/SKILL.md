---
name: KiiPS Page Pattern Guide
description: |
  KiiPS JSP 페이지 표준 패턴 종합 가이드 - 페이지 레이아웃, Include 체계, 검색필터+버튼+그리드 연동.
  Use when: 새 JSP 페이지 생성, 페이지 구조 수정, 표준 패턴 적용, 페이지 템플릿 제작
version: 1.0.0
priority: critical
enforcement: require
category: ui-development
disclosure:
  summary: true
  expanded: true
  full: true
  default: expanded
tags:
  - page
  - jsp
  - template
  - pattern
  - layout
  - 페이지
  - 화면
  - 표준패턴
author: KiiPS Development Team
lastUpdated: 2026-02-06
---

# KiiPS Page Pattern Guide

KiiPS JSP 페이지의 표준 구조 패턴입니다. 검색필터, 버튼, 그리드, 모달, API 연동까지 모든 레이어를 다룹니다.

## Purpose

### What This Skill Does
- **페이지 생성**: KiiPS 표준 JSP 페이지 스캐폴딩
- **Include 체계**: header, sidemenu, filter, button, footer 연동
- **검색-버튼-그리드 연동**: MAIN_SEARCH_FILTER() 중심 데이터 흐름
- **도메인별 버튼 등록**: inc_{domain}_button.jsp 분기 추가
- **모달 패턴**: Bootstrap 모달 + RealGrid 편집 그리드

### What This Skill Does NOT Do
- 백엔드 Controller/Service/Mapper 생성 (별도 스킬)
- SCSS 테마 적용 (kiips-scss-theme-manager 참조)
- RealGrid 상세 설정 (kiips-realgrid-guide 참조)

### Related Skills
| Skill | 연동 포인트 |
|-------|------------|
| `kiips-search-filter-guide` | Part 3: SEARCH_CONDITION 빌더 |
| `kiips-button-guide` | Part 4: inc_main_button 버튼 등록 |
| `kiips-realgrid-guide` | Part 5: 그리드 생성/설정 |

## When to Use

### User Prompt Keywords
```
"페이지 생성", "화면 만들", "JSP 만들", "새 화면",
"페이지 패턴", "표준 패턴", "페이지 템플릿",
"화면 추가", "목록 화면", "CRUD 화면"
```

### File Patterns
```
새 파일: KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{DOMAIN}/{SCREEN_ID}.jsp
수정 파일: **/include/button/inc_{domain}_button.jsp
```

---

# Part 1: 페이지 표준 구조

## 1.1 전체 레이아웃

```
+----------------------------------------------------------+
| header.jsp (공통 헤더, CSS, 메타)                          |
| sidemenu.jsp (좌측 사이드 메뉴)                            |
| inc_files.jsp (공통 JS/CSS 파일)                           |
+----------------------------------------------------------+
| <section class="content-body">                            |
|   inc_page_header.jsp (페이지 제목, 브레드크럼)             |
|   +----------------------------------------------------+ |
|   | <div class="card">                                  | |
|   |   inc_filter_main.jsp (검색필터 바)                  | |
|   |   inc_main_button.jsp (버튼 툴바)                    | |
|   |   RealGrid (데이터 그리드)                           | |
|   |   Paging (페이징)                                    | |
|   +----------------------------------------------------+ |
| </section>                                                |
| Modal(s) (편집/상세 모달)                                   |
| <script> (그리드 설정, API 호출, 이벤트)                    |
| footer_sidemenu.jsp (공통 푸터)                            |
+----------------------------------------------------------+
```

## 1.2 파일 위치 규칙

```
KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/
  {DOMAIN}/           # 도메인 디렉토리
    {SCREEN_ID}.jsp   # 메인 페이지
  include/
    header.jsp
    sidemenu.jsp
    inc_files.jsp
    inc_page_header.jsp
    inc_filter_main.jsp
    inc_main_button.jsp
    button/
      inc_{domain}_button.jsp   # 도메인별 버튼
    footer_sidemenu.jsp
```

### 도메인-포트 매핑

| 도메인 | 코드 | 서비스 포트 | spring:eval 변수 |
|--------|------|:-----------:|-----------------|
| 투자원장 | IL | 8401 | `KiiPS_IL` |
| 펀드 | FD | 8601 | `KiiPS_FD` |
| 회계 | AC | - | `KiiPS_AC` |
| 시스템 | SY | - | `KiiPS_SY` |
| LP관리 | LP | - | `KiiPS_LP` |
| 전자원장 | EL | - | `KiiPS_EL` |

---

# Part 2: Include 체계

## 2.1 필수 헤더 Include (순서 중요)

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../include/header.jsp"%>
<jsp:include page="../include/sidemenu.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="{SCREEN_ID}" />
</jsp:include>
<jsp:include page="../include/inc_files.jsp"></jsp:include>
```

## 2.2 서비스 URL 선언

```jsp
<spring:eval expression="@environment.getProperty('web.realgrid.lic')" var="KiiPS_GRID" />
<spring:eval expression="@environment.getProperty('KiiPS.LOGIN.URL')" var="KiiPS_LOGIN" />
<spring:eval expression="@environment.getProperty('KiiPS.{DOMAIN}.URL')" var="KiiPS_{DOMAIN}" />
```

## 2.3 SEARCH_CONDITION + 화면 권한

```jsp
<%
    String SEARCH_CONDITION =
        MainComponent.getInstance().{TYPE}().ID("{ID}").LABEL("{LABEL}")
            .ScriptFuncName("{FN}").getTag()
        + "|" + MainComponent.getInstance().{TYPE2}().ID("{ID2}").LABEL("{LABEL2}").getTag()
        ;

    String[] SCREEN_DATA    = ScreenAuth.get("{SCREEN_ID}").split("\\|");
    String SCREEN_AUTH      = SCREEN_DATA[0];
    String SCREEN_SHORT_CUT = SCREEN_DATA[3];
    String SCREEN_NM        = SCREEN_DATA[1];
    String SCREEN_NM_LINE   = Utils.getInstance().getScreenNmLine(SCREEN_DATA[2]);
%>
```

## 2.4 필수 푸터 Include

```jsp
<%@ include file="../include/footer_sidemenu.jsp"%>
```

---

# Part 3: HTML 본문 구조

## 3.1 기본 구조 (단일 그리드)

```jsp
<section role="main" class="content-body content-body-modern mt-0 pb-1">
    <%@ include file="../include/inc_page_header.jsp"%>
    <div class="row">
        <div class="col">
            <div class="card">
                <!-- 검색필터 -->
                <jsp:include page="../include/inc_filter_main.jsp" flush="false">
                    <jsp:param name="MAIN_SCREEN_ID" value="{SCREEN_ID}" />
                    <jsp:param name="MAIN_SEARCH_CONDITION" value="<%=SEARCH_CONDITION%>" />
                </jsp:include>
                <!-- 버튼 툴바 -->
                <jsp:include page="../include/inc_main_button.jsp" flush="false">
                    <jsp:param name="MENU_SCREEN_ID" value="{SCREEN_ID}" />
                </jsp:include>
                <!-- 그리드 -->
                <div id="TB_{SCREEN_ID}" data-id="TB_{SCREEN_ID}" data-gbn="table" data-provider-id="dataProvider"></div>
                <!-- 페이징 -->
                <div id="paging"></div>
            </div>
        </div>
    </div>
</section>
```

## 3.2 탭 구조 (다중 그리드)

```jsp
<ul class="nav nav-tabs" role="tablist" style="clear:both">
    <li class="nav-item">
        <a class="apprv_tab nav-link active" id="TAB_DOC1" data-toggle="tab"
           href="#STCK_DOC1" role="tab" aria-selected="true">탭1</a>
    </li>
    <li class="nav-item">
        <a class="apprv_tab nav-link" id="TAB_DOC2" data-toggle="tab"
           href="#STCK_DOC2" role="tab" aria-selected="false">탭2</a>
    </li>
</ul>
<div class="tab-content px-0">
    <div class="tab-pane active pt-0" id="STCK_DOC1" role="tabpanel">
        <div id="TB_{SCREEN_ID}" data-id="TB_{SCREEN_ID}" data-gbn="table" data-provider-id="dataProvider"></div>
        <div id="paging"></div>
    </div>
    <div class="tab-pane pt-0" id="STCK_DOC2" role="tabpanel">
        <div id="TB_{SCREEN_ID}2" data-id="TB_{SCREEN_ID}2" data-gbn="table" data-provider-id="dataProvider2"></div>
        <div id="paging2"></div>
    </div>
</div>
```

### 탭 네이밍 규칙

| 요소 | 패턴 | 예시 |
|------|------|------|
| 탭 ID | `TAB_DOC{N}` | TAB_DOC1, TAB_DOC2 |
| Pane ID | `STCK_DOC{N}` | STCK_DOC1, STCK_DOC2 |
| 그리드 ID | `TB_{SCREEN_ID}{N}` | TB_IL09272 |
| DataProvider | `dataProvider{N}` | dataProvider2 |
| GridView | `gridView{N}` | gridView2 |
| Paging | `paging{N}` | paging2 |

---

# Part 4: 모달 패턴

## 4.1 기본 모달 구조

```jsp
<div class="modal fade" id="{modalId}" aria-hidden="true"
     style="display: none; z-index: 1060;"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-{size}">  <!-- modal-sm / modal-lg / modal-xl -->
        <div class="modal-content">
            <form id="{formId}">
                <section class="card">
                    <header class="card-header">
                        <h1 class="card-title">{타이틀}
                            <div class="card-actions">
                                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                                   data-dismiss="modal"></a>
                            </div>
                        </h1>
                    </header>
                    <div class="card-body px-5 py-4">
                        <!-- 폼 필드 / 그리드 -->
                        <div class="bottom-btn">
                            <button type="button" class="btn btn-primary modal-confirm"
                                    onclick="fn_submit('#{formId}')">저장</button>
                            <button type="reset" class="btn btn-outline-secondary modal-dismiss"
                                    data-dismiss="modal">닫기</button>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    </div>
</div>
```

## 4.2 모달 내 폼 필드

```jsp
<div class="sectionBox">
    <div class="form-group new row">
        <div class="col-sm-6 col-lg-4">
            <label class="control-label">{라벨}</label>
            <!-- 셀렉트 -->
            <select id="{ID}" class="selectpicker show-tick form-control"
                    data-gbn="select" data-id="{ID}" name="{ID}"
                    multiple data-max-options="1"></select>
        </div>
        <div class="col-sm-6 col-lg-4">
            <label class="control-label">{라벨}</label>
            <!-- 날짜 -->
            <input type="text" class="form-control flatpickr-basic"
                   data-gbn="date" data-id="{ID}" placeholder="YYYY-MM-DD" name="{ID}" />
        </div>
    </div>
</div>
```

## 4.3 모달 내 편집 그리드

```jsp
<div class="sectionBox">
    <div class="flex-row">
        <h2 class="modalH2">{섹션명}</h2>
        <div class="datable_button2 flex-fill jce p-0">
            <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                    onclick="myCreateFunction(gridViewRG)" title="행추가"><span class="icon_addRow"></span></button>
            <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                    onclick="myDeleteFunction(gridViewRG,dataProviderRG)" title="행삭제"><span class="icon_delRow"></span></button>
        </div>
    </div>
    <div id="TB_{SCREEN_ID}RG" data-id="dataProviderRG" data-gbn="table" data-provider-id="dataProviderRG"></div>
</div>
```

---

# Part 5: Script 구조

## 5.1 전체 Script 레이아웃

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

// ===== 4. 모달 그리드 (있으면) =====
// ...

// ===== 5. document.ready =====
$(document).ready(function(){
    MAIN_SEARCH_FILTER();
});

// ===== 6. MAIN_SEARCH_FILTER (핵심) =====
function MAIN_SEARCH_FILTER() {
    var item = $("#FILTER_INPUT_TAG").tagsinput('items');
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
function fn_delete() { /* 서버 삭제 */ }

// ===== 8. Excel 함수 =====
function excelExport() { /* 엑셀 다운로드 */ }

// ===== 9. Lookup 초기화 =====
fnCustNo().then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
});

// ===== 10. Validate + Submit =====
const validator = $("#form").validate({ /* ... */ });
</script>
```

## 5.2 MAIN_SEARCH_FILTER 패턴

**핵심 원칙**: `inc_filter_main.jsp`의 TagsInput에서 검색조건을 수집하여 API 호출

```javascript
function MAIN_SEARCH_FILTER() {
    // 1. 필터 바에서 검색조건 수집
    var item = $("#FILTER_INPUT_TAG").tagsinput('items');
    let searchCond = createObjectForSearchAjax(item);
    // searchCond 결과: { EMP_CUST_NO: "001", BASE_DT: "20260101", ... }

    // 2. API 호출
    logosAjax.requestToken(gToken,
        "${KiiPS_{DOMAIN}}/{DOMAIN}API/{SCREEN_ID}/LIST",
        "post", searchCond,
        function(data) {
            // 3. 그리드 데이터 바인딩
            dataProvider.setRows(data.body.LIST);
            setPaging(gridView, 10, "#paging");
            gridView.refresh();
        }
    );
}
```

## 5.3 API URL 규칙

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

## 5.4 행추가/행삭제 공통 함수

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
    grid.validateCells(dataprovider.getRowCount()-1, false);
}

// 행삭제
function myDeleteFunction(gv, dp) {
    if (isEmpty(gv.validateCells(null, true)).length > 0) {
        if (MESSAGE_HANDLE_CONFIRM("입력이 끝나지 않은 행이 있습니다. 삭제")) {
            return;
        }
        gv.deleteSelection(true);
    }
    let items = gv.getCurrent().itemIndex;
    if (items.length == 0) {
        MESSAGE_HANDLE('선택 항목이 없습니다.');
        return false;
    }
    gv.cancel(true);
    setDeleteRow(gv, dp);
}
```

## 5.5 엑셀 다운로드

```javascript
function excelExport() {
    let grids = [{
        grid: gridView,
        sheetName: "{시트명}"
    }];
    excelExport_EXT(grids, false);
}
```

---

# Part 6: 도메인별 버튼 등록

## 6.1 inc_{domain}_button.jsp에 분기 추가

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
            <div class="inputBTN_coment">
                <input type="button" id="ADJ_GRID_COLUMN" class="btn btn-outline-primary btn-lg" value="10" />
                <span id="setROW_BTN" data-toggle="popover-x" data-target="#POP_GRID_ROW_SETTING"
                      data-placement="top" class="badge"><i data-feather="more-horizontal"></i></span>
            </div>
        </div>
        <div class="maingrid_button">
            <!-- 버튼 구성은 Part 6.2 참조 -->
        </div>
    </div>
</div>
<%
```

## 6.2 버튼 조합 패턴

### 기본 조회 페이지 (조회 + 엑셀 + 도움말)

```jsp
<button type="button" id="btn_reload" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="조회" onClick="MAIN_SEARCH_FILTER()"><span class="icon_reload"></span></button>
<jsp:include page="inc_excel_button.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="<%= MENU_SCREEN_ID %>" />
</jsp:include>
<button type="button" id="btn_help" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="<spring:message code='WRD_도움말' />"
    onClick="javascript:ScreenHelp(window.location.pathname)"><span class="icon_question"></span></button>
```

### 편집 페이지 (조회 + 행추가 + 행삭제 + 엑셀 + 도움말)

```jsp
<button type="button" id="btn_reload" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="조회" onClick="MAIN_SEARCH_FILTER()"><span class="icon_reload"></span></button>
<button type="button" id="btn_add" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="행추가" onclick="myCreateFunction(gridView)"><span class="icon_plus"></span></button>
<button type="button" id="btn_del" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="행삭제" onClick="myDeleteFunction(gridView,dataProvider)"><span class="icon_trash"></span></button>
<button type="button" id="btn_excel" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="엑셀" onClick="excelExport()"><span class="icon_excel"></span></button>
<button type="button" id="btn_help" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="<spring:message code='WRD_도움말' />"
    onClick="javascript:ScreenHelp(window.location.pathname)"><span class="icon_question"></span></button>
```

### CRUD 페이지 (관리자+조회+등록+삭제+인쇄+엑셀+도움말)

```jsp
<% if("A".equals(AUTH)){ %>
<div class="dropdown">
    <button type="button" id="btnADMIN" class="btn btn-only-icon btn-primary btn-xl"
        data-toggle="dropdown"><span class="icon_admin"></span></button>
    <div class="dropdown-menu">
        <a class="dropdown-item" href="javascript:fn_confirm()">확정</a>
        <a class="dropdown-item" href="javascript:fn_cancel()">확정 취소</a>
    </div>
</div>
<% } %>
<button type="button" id="btn_reload" ...><span class="icon_reload"></span></button>
<button type="button" id="btn_regist" ... onclick="callRegistModal()"><span class="icon_plus"></span></button>
<% if("A".equals(AUTH)){ %>
<button type="button" id="btn_del" ... onClick="fn_delete()"><span class="icon_trash"></span></button>
<% } %>
<button type="button" id="btn_print" ... onClick="callPrintModal()"><span class="icon_print"></span></button>
<jsp:include page="inc_excel_button.jsp" ... />
<button type="button" id="btn_help" ...><span class="icon_question"></span></button>
```

### 아이콘 클래스 참조

| 아이콘 | 클래스 | 용도 |
|--------|--------|------|
| 조회/새로고침 | `icon_reload` | MAIN_SEARCH_FILTER() |
| 등록/추가 | `icon_plus` | 등록 모달 또는 행추가 |
| 삭제 | `icon_trash` | 행삭제 또는 서버 삭제 |
| 엑셀 | `icon_excel` | 엑셀 다운로드 |
| 인쇄 | `icon_print` | 인쇄/리포트 |
| 도움말 | `icon_question` | 화면 도움말 |
| 관리자 | `icon_admin` | 관리자 드롭다운 |
| 저장 | `icon_save` | 저장 |

---

# Part 7: Lookup 초기화 패턴

## 7.1 공통 코드 Lookup

```javascript
// 공통 코드 (values/labels 자동 매핑)
fnCommCode("{TPCD}").then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
});
```

## 7.2 사원 목록 Lookup

```javascript
fnCustNo().then(function(data) {
    createLookupColumn(gridView, '{FIELD}', data);
    // selectpicker 초기화 (모달용)
    $('#selectId').html(fnCreateSelectOpt(data));
    $('#selectId').selectpicker('refresh');
});
```

## 7.3 투자기업 Lookup

```javascript
fnInvCustNo('trdOnly', true).then(function(data) {
    createLookupColumn(gridView, 'CUST_NO', data);
});
```

---

# Part 8: Validate + Submit 패턴

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

---

# Part 9: 실전 템플릿 (전체)

## 9.1 단일 그리드 편집 페이지 (IL0927 기반)

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../include/header.jsp"%>
<jsp:include page="../include/sidemenu.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="{SCREEN_ID}" />
</jsp:include>
<jsp:include page="../include/inc_files.jsp"></jsp:include>
<spring:eval expression="@environment.getProperty('web.realgrid.lic')" var="KiiPS_GRID" />
<spring:eval expression="@environment.getProperty('KiiPS.LOGIN.URL')" var="KiiPS_LOGIN" />
<spring:eval expression="@environment.getProperty('KiiPS.{DOMAIN}.URL')" var="KiiPS_{DOMAIN}" />
<%
    String SEARCH_CONDITION =
        MainComponent.getInstance().SELECT_MULTI()
            .ScriptFuncName("{fnName}()").ID("{FILTER_ID}").LABEL("{라벨}").getTag()
        + "|" + MainComponent.getInstance().DATE_SINGLE_YYYYMMDD()
            .ID("{DATE_ID}").LABEL("{날짜라벨}").getTag()
        ;

    String[] SCREEN_DATA    = ScreenAuth.get("{SCREEN_ID}").split("\\|");
    String SCREEN_AUTH      = SCREEN_DATA[0];
    String SCREEN_SHORT_CUT = SCREEN_DATA[3];
    String SCREEN_NM        = SCREEN_DATA[1];
    String SCREEN_NM_LINE   = Utils.getInstance().getScreenNmLine(SCREEN_DATA[2]);
%>
<section role="main" class="content-body content-body-modern mt-0 pb-1">
    <%@ include file="../include/inc_page_header.jsp"%>
    <div class="row">
        <div class="col">
            <div class="card">
                <jsp:include page="../include/inc_filter_main.jsp" flush="false">
                    <jsp:param name="MAIN_SCREEN_ID" value="{SCREEN_ID}" />
                    <jsp:param name="MAIN_SEARCH_CONDITION" value="<%=SEARCH_CONDITION%>" />
                </jsp:include>
                <jsp:include page="../include/inc_main_button.jsp" flush="false">
                    <jsp:param name="MENU_SCREEN_ID" value="{SCREEN_ID}" />
                </jsp:include>
                <div id="TB_{SCREEN_ID}" data-id="TB_{SCREEN_ID}" data-gbn="table" data-provider-id="dataProvider"></div>
                <div id="paging"></div>
            </div>
        </div>
    </div>
</section>

<script>
    let MAIN_COLUMNS = [
        { fieldName: "{FIELD1}", width: "100", header: { text: "{헤더1}" }, editable: false }
        // ... 컬럼 추가
    ];

    let dataProvider = new RealGrid.LocalDataProvider(true);
    let gridView = new RealGrid.GridView("TB_{SCREEN_ID}");
    createMainGrid("TB_{SCREEN_ID}", dataProvider, gridView, MAIN_COLUMNS);
    gridView.displayOptions.minRowHeight = 50;
    gridView.editOptions.appendable = false;
    gridView.setRowIndicator({visible: true});

    $(document).ready(function(){
        MAIN_SEARCH_FILTER();
    });

    function MAIN_SEARCH_FILTER() {
        var item = $("#FILTER_INPUT_TAG").tagsinput('items');
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

    function myCreateFunction(grid) {
        let dp = grid.getDataSource();
        grid.commit(true);
        if (grid.validateCells(dp.getRowCount()-1, false)) {
            MESSAGE_HANDLE('GRID_VALIDATE_ERROR');
            return;
        }
        dp.addRow({});
        grid.commit(true);
    }

    function myDeleteFunction(gv, dp) {
        let items = gv.getCurrent().itemIndex;
        if (items.length == 0) {
            MESSAGE_HANDLE('선택 항목이 없습니다.');
            return false;
        }
        gv.cancel(true);
        setDeleteRow(gv, dp);
    }

    function excelExport() {
        excelExport_EXT([{ grid: gridView, sheetName: "{시트명}" }], false);
    }
</script>
<%@ include file="../include/footer_sidemenu.jsp"%>
```

---

# Part 10: 체크리스트

## 새 페이지 생성 시 체크리스트

- [ ] JSP 파일 생성: `jsp/kiips/{DOMAIN}/{SCREEN_ID}.jsp`
- [ ] SEARCH_CONDITION 정의 (MainComponent 빌더)
- [ ] ScreenAuth.get("{SCREEN_ID}") 등록 확인
- [ ] inc_filter_main.jsp 연동 (MAIN_SCREEN_ID, MAIN_SEARCH_CONDITION)
- [ ] inc_main_button.jsp 연동 (MENU_SCREEN_ID)
- [ ] **inc_{domain}_button.jsp에 SCREEN_ID 분기 추가** (필수!)
- [ ] RealGrid 컬럼/그리드 초기화
- [ ] MAIN_SEARCH_FILTER() 구현
- [ ] Lookup 컬럼 초기화 (fnCustNo, fnCommCode 등)
- [ ] Excel 다운로드 함수
- [ ] 모달 (필요 시)
- [ ] footer_sidemenu.jsp Include
- [ ] Controller에 화면 매핑 추가
