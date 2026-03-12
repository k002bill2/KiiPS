# KiiPS Button Guide - 실전 예제

## 기본 화면 (조회+등록+삭제+엑셀+도움말)

```jsp
<%-- inc_il_button.jsp에 추가 ---%>
}else if(MENU_SCREEN_ID.equals("IL0999")){
%>
<div class="col-12 col-lg-auto mb-3 mb-lg-0 pl-0 pr-0 mt-3">
    <div class="main_gridRow">
        <div class="gridpage_info">
            <div class="in-bl px-3 brd_card rounded-5">
                <span id="Total_Cnt">Total 1000</span>
            </div>
            <div class="inputBTN_coment">
                <input type="button" id="ADJ_GRID_COLUMN" class="btn btn-outline-primary btn-lg" value="10" />
                <span id="setROW_BTN" data-toggle="popover-x" data-target="#POP_GRID_ROW_SETTING" data-placement="top" class="badge"><i data-feather="more-horizontal"></i></span>
            </div>
        </div>
        <div class="maingrid_button">
            <button type="button" id="btn_reload" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="조회" onClick="MAIN_SEARCH_FILTER()"><span class="icon_reload"></span></button>
            <% if("A".equals(AUTH) || "C".equals(AUTH)){ %>
            <button type="button" id="btn_regist" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" title="등록" onclick="callRegistModal()"><span class="icon_plus"></span></button>
            <% } %>
            <% if("A".equals(AUTH)){ %>
            <button type="button" id="btn_del" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="삭제" onClick="fn_delete()"><span class="icon_trash"></span></button>
            <% } %>
            <jsp:include page="inc_excel_button.jsp" flush="false">
                <jsp:param name="MENU_SCREEN_ID" value="<%= MENU_SCREEN_ID %>" />
            </jsp:include>
            <button type="button" id="btn_help" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="도움말" onClick="javascript:ScreenHelp(window.location.pathname)"><span class="icon_question"></span></button>
        </div>
    </div>
</div>
<%
```

## 관리자 드롭다운 포함 (IL0927 패턴)

```jsp
}else if(MENU_SCREEN_ID.equals("IL0927")){
%>
<div class="col-12 col-lg-auto mb-3 mb-lg-0 pl-0 pr-0 mt-3">
    <div class="main_gridRow">
        <div class="gridpage_info">...</div>
        <div class="maingrid_button">
            <% if("A".equals(AUTH)){ %>
            <button type="button" id="btnADMIN" class="btn btn-only-icon btn-primary" data-toggle="dropdown"><span class="icon_admin"></span></button>
            <div class="dropdown-menu" aria-labelledby="btnADMIN">
                <a class="dropdown-item" href="javascript:callOrderModal()">출력순서 설정</a>
                <a class="dropdown-item" href="javascript:fn_confirm()">확정</a>
                <a class="dropdown-item" href="javascript:fn_cancel()">확정 취소</a>
            </div>
            <% } %>
            <button ... onClick="MAIN_SEARCH_FILTER()">조회</button>
            <button ... onclick="callRegistModal()">등록</button>
            <% if("A".equals(AUTH)){ %>
            <button ... onClick="fn_delete()">삭제</button>
            <% } %>
            <button ... onClick="callPrintModal()">인쇄</button>
            <jsp:include page="inc_excel_button.jsp" ... />
            <button ... onClick="ScreenHelp(...)">도움말</button>
        </div>
    </div>
</div>
<%
```
