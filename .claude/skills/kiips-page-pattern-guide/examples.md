# KiiPS Page Pattern Guide - Examples

## Part 4: 모달 패턴

### 4.1 기본 모달 구조

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

### 4.2 모달 내 폼 필드

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

### 4.3 모달 내 편집 그리드

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

## Part 9: 실전 템플릿 (전체)

### 단일 그리드 편집 페이지 (IL0927 기반)

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
