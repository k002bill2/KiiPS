# KiiPS Button Guide - 상세 레퍼런스

## 도메인별 버튼 파일 구조

### 새 화면 버튼 추가 패턴

```jsp
<%-- inc_XX_button.jsp에 추가 ---%>
}else if(MENU_SCREEN_ID.equals("XX0000")){
%>
<div class="col-12 col-lg-auto mb-3 mb-lg-0 pl-0 pr-0 mt-3">
    <div class="main_gridRow">
        <div class="gridpage_info">
            <div class="in-bl px-3 brd_card rounded-5">
                <span id="Total_Cnt">Total 1000</span>
            </div>
            <!-- 그리드 노출수 설정 -->
            <div class="inputBTN_coment">
                <input type="button" id="ADJ_GRID_COLUMN"
                    class="btn btn-outline-primary btn-lg" value="10" />
                <span id="setROW_BTN" data-toggle="popover-x"
                    data-target="#POP_GRID_ROW_SETTING" data-placement="top"
                    class="badge">
                    <i data-feather="more-horizontal"></i>
                </span>
            </div>
        </div>
        <div class="maingrid_button">
            <%-- 여기에 버튼 배치 ---%>
            <button ... onClick="MAIN_SEARCH_FILTER()">조회</button>
            <button ... onclick="callRegistModal()">등록</button>
            <%-- 엑셀 ---%>
            <jsp:include page="inc_excel_button.jsp" flush="false">
                <jsp:param name="MENU_SCREEN_ID" value="<%= MENU_SCREEN_ID %>" />
            </jsp:include>
            <%-- 도움말 ---%>
            <button ... onClick="ScreenHelp(window.location.pathname)">도움말</button>
        </div>
    </div>
</div>
<%
```

### 버튼 배치 순서 (표준)

```
[관리자 드롭다운] → [조회] → [등록] → [삭제] → [인쇄] → [엑셀] → [도움말]
```

### 파일별 위치

| 도메인 | 파일 | 줄 수 |
|--------|------|------:|
| IL | `button/inc_il_button.jsp` | 4205 |
| PG | `button/inc_pg_button.jsp` | 3202 |
| AC | `button/inc_ac_button.jsp` | 2255 |
| RT | `button/inc_rt_button.jsp` | 1471 |
| MI | `button/inc_mi_button.jsp` | 939 |
| SY | `button/inc_sy_button.jsp` | 858 |
| FD | `button/inc_fd_button.jsp` | 760 |
| RM | `button/inc_rm_button.jsp` | 376 |
| EL | `button/inc_el_button.jsp` | 356 |
| MG | `button/inc_mg_button.jsp` | 125 |
| IV | `button/inc_iv_button.jsp` | 106 |
| ST | `button/inc_st_button.jsp` | 88 |

---

## 탭 내 인라인 버튼 (그리드별)

### 탭별 그리드 툴바

메인 버튼과 별도로, 각 탭 pane 안에 그리드 편집용 버튼을 배치할 수 있습니다.

```html
<div class="tab-pane pt-0" id="STCK_DOC4" ...>
    <!-- 탭 내 인라인 버튼 (그리드별) -->
    <div class="row jce datable_button2 px-3 mb-1">
        <button ... onclick="searchTab4()"><span class="icon_refresh"></span></button>
        <button ... onclick="myCreateFunction(gridView4)"><span class="icon_addRow"></span></button>
        <button ... onclick="myDeleteFunction(gridView4,dataProvider4)"><span class="icon_delRow"></span></button>
        <button ... onclick="excelExportTab4()"><span class="icon_excel"></span></button>
    </div>
    <!-- 그리드 -->
    <div id="TB_GRID" ...></div>
</div>
```

### 인라인 버튼 클래스

```html
<!-- 메인 버튼: btn-outline-primary -->
class="btn btn-only-icon btn-xl btn-outline-primary"

<!-- 탭 내 버튼: btn-outline-primary buttons-row -->
class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
```

**차이점**: `buttons-row` 클래스가 추가되어 좀 더 컴팩트한 스타일.

---

## 표준 함수명 규칙

### 버튼 클릭 함수

| 함수명 | 목적 | 호출 위치 |
|--------|------|----------|
| `MAIN_SEARCH_FILTER()` | 메인 조회 | 조회 버튼 |
| `MAIN_SEARCH_FILTER(tabId)` | 특정 탭 조회 | 탭 전환 시 |
| `callRegistModal()` | 등록 모달 오픈 | 등록 버튼 |
| `callREGIST_POP()` | 등록 팝업 오픈 | 등록 버튼 |
| `clearPage(type)` | 페이지 초기화 + 모달 | 드롭다운 등록 |
| `fn_delete()` | 선택 항목 삭제 | 삭제 버튼 |
| `fn_confirm()` | 확정 | 관리자 드롭다운 |
| `fn_cancel()` | 확정 취소 | 관리자 드롭다운 |
| `callPrintModal()` | 인쇄 | 인쇄 버튼 |
| `callOrderModal()` | 출력순서 설정 | 관리자 드롭다운 |
| `ExcelExportAll(cond)` | 엑셀 내보내기 | 엑셀 버튼 |
| `ScreenHelp(path)` | 도움말 | 도움말 버튼 |

### 탭 내 함수

| 함수명 | 목적 | 사용 |
|--------|------|------|
| `searchTab4()` | 탭4 조회 | 탭4 새로고침 |
| `myCreateFunction(grid)` | 행 추가 | 그리드 편집 |
| `myDeleteFunction(gv,dp)` | 행 삭제 | 그리드 편집 |
| `excelExportTab4()` | 탭4 엑셀 | 탭4 엑셀 |
| `saveTab4()` | 탭4 저장 | 탭4 저장 |
