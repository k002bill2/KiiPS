---
name: KiiPS Button Area Guide
description: |
  KiiPS 버튼 영역 종합 가이드 - inc_main_button.jsp, 도메인별 버튼, 권한 처리, 아이콘 클래스.
  Use when: 버튼 추가, 툴바 생성, 권한별 버튼 노출, inc_main_button 연동
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
  - button
  - toolbar
  - inc_main_button
  - 권한
  - AUTH
  - icon
  - 버튼
  - 툴바
author: KiiPS Development Team
lastUpdated: 2026-02-06
---

# KiiPS Button Area Guide

KiiPS 버튼 영역 종합 가이드입니다. inc_main_button.jsp 라우팅, 도메인별 버튼 파일, 권한 체계, 아이콘 클래스 등 모든 내용을 다룹니다.

## Purpose

### What This Skill Does
- **버튼 영역 생성**: inc_main_button.jsp + 도메인별 inc_xx_button.jsp 연동
- **권한 기반 노출**: A(관리자)/C(등록수정삭제)/E(조회만) 3단계 권한
- **표준 버튼 패턴**: 조회, 등록, 삭제, 엑셀, 인쇄, 도움말
- **드롭다운 버튼**: 관리자 메뉴, 다중 등록 옵션
- **탭 내 인라인 버튼**: 그리드별 행추가/삭제/엑셀

### What This Skill Does NOT Do
- 검색필터 생성 (kiips-search-filter-guide 참조)
- 그리드 설정 (kiips-realgrid-guide 참조)

## When to Use

### User Prompt Keywords
```
"버튼", "툴바", "inc_main_button", "권한", "AUTH",
"버튼 추가", "엑셀 버튼", "관리자 버튼", "등록 버튼",
"아이콘", "icon_reload", "icon_plus"
```

### File Patterns
```
수정: **/include/button/inc_*_button.jsp
참조: **/include/inc_main_button.jsp
내용: "btn_reload", "btn_regist", "MAIN_SEARCH_FILTER", "AUTH"
```

---

# Part 1: 전체 아키텍처

## 1.1 버튼 라우팅 구조

```
[JSP 페이지]
    |
    v
inc_main_button.jsp (마스터 라우터)
    |
    ├── MENU_SCREEN_ID.substring(0,2) → 도메인 코드 추출
    ├── ScreenAuth → 권한(A/C/E) 파싱
    └── 도메인별 분기:
        ├── AC → inc_ac_button.jsp
        ├── EL → inc_el_button.jsp
        ├── FD → inc_fd_button.jsp
        ├── IL → inc_il_button.jsp  ← 4205줄 (가장 큼)
        ├── PG → inc_pg_button.jsp
        ├── RT → inc_rt_button.jsp
        ├── MI → inc_mi_button.jsp
        ├── SY → inc_sy_button.jsp
        ├── RM → inc_rm_button.jsp
        ├── ST → inc_st_button.jsp
        ├── MG → inc_mg_button.jsp
        └── IV → inc_iv_button.jsp
```

## 1.2 JSP 표준 구조

```jsp
<!-- 검색필터 Include -->
<jsp:include page="../include/inc_filter_main.jsp" flush="false">
    <jsp:param name="MAIN_SCREEN_ID" value="XX0000" />
    <jsp:param name="MAIN_SEARCH_CONDITION" value="<%=SEARCH_CONDITION%>" />
</jsp:include>

<!-- 버튼 영역 Include -->
<jsp:include page="../include/inc_main_button.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="XX0000" />
</jsp:include>

<!-- 그리드 영역 -->
<div id="TB_XX0000" data-id="TB_XX0000" data-gbn="table" data-provider-id="dataProvider"></div>
```

---

# Part 2: 권한 체계

## 2.1 권한 레벨

| 코드 | 레벨 | 설명 | 버튼 범위 |
|------|------|------|----------|
| **A** | 관리자 | 모든 기능 + 관리자 메뉴 | 조회+등록+삭제+확정+인쇄+엑셀+관리자메뉴 |
| **C** | 등록/수정/삭제 | CRUD 가능 | 조회+등록+삭제+인쇄+엑셀 |
| **E** | 조회만 | 읽기 전용 | 조회+엑셀 |

## 2.2 권한 데이터 흐름

```
SessionInfo.getMenuAuth()
    └── Key: MENU_SCREEN_ID (예: "IL0927")
    └── Value: "A,C,E|IL0927_주간보고|WEB_IL|IL0927_1"
         ├── [0]: "A,C,E" → 권한 문자열
         ├── [1]: 화면명
         ├── [2]: 경로
         └── [3]: 단축키
```

## 2.3 JSP 권한 체크 패턴

```jsp
<%-- 관리자만 ---%>
<% if("A".equals(AUTH)){ %>
    <button ...>관리자 전용 버튼</button>
<% } %>

<%-- 관리자 또는 등록 권한 ---%>
<% if("A".equals(AUTH) || "C".equals(AUTH)){ %>
    <button ...>등록 버튼</button>
<% } %>

<%-- JavaScript에서 권한 확인 ---%>
<script>
    gAuth = '<%=Auth%>';  // 전역 변수
    if(gAuth === 'A') { /* 관리자 로직 */ }
</script>
```

---

# Part 3: 표준 버튼 컴포넌트

## 3.1 기본 버튼 타입

### 조회 버튼 (모든 화면)
```html
<button type="button" id="btn_reload"
    class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" data-placement="top" title="조회"
    onClick="MAIN_SEARCH_FILTER()">
    <span class="icon_reload"></span>
</button>
```

### 등록 버튼 (A, C 권한)
```html
<button type="button" id="btn_regist"
    class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="등록"
    onclick="callRegistModal()">
    <span class="icon_plus"></span>
</button>
```

### 삭제 버튼 (A 권한)
```html
<% if("A".equals(AUTH)){ %>
<button type="button" id="btn_del"
    class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" data-placement="top" title="삭제"
    onClick="fn_delete()">
    <span class="icon_trash"></span>
</button>
<% } %>
```

### 인쇄 버튼
```html
<button type="button" id="btn_print"
    class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" data-placement="top" title="인쇄"
    onClick="callPrintModal()">
    <span class="icon_print"></span>
</button>
```

### 엑셀 버튼 (공통 include)
```jsp
<jsp:include page="inc_excel_button.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="<%= MENU_SCREEN_ID %>" />
</jsp:include>
```

### 도움말 버튼 (모든 화면)
```html
<button type="button" id="btn_help"
    class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" data-placement="top" title="도움말"
    onClick="javascript:ScreenHelp(window.location.pathname)">
    <span class="icon_question"></span>
</button>
```

## 3.2 드롭다운 버튼 (다중 액션)

### 관리자 드롭다운
```html
<% if("A".equals(AUTH)){ %>
<button type="button" id="btnADMIN"
    class="btn btn-only-icon btn-primary"
    data-toggle="dropdown" data-placement="top">
    <span class="icon_admin"></span>
</button>
<div class="dropdown-menu" aria-labelledby="btnADMIN">
    <a class="dropdown-item" href="javascript:callOrderModal()">출력순서 설정</a>
    <a class="dropdown-item" href="javascript:fn_confirm()">확정</a>
    <a class="dropdown-item" href="javascript:fn_cancel()">확정 취소</a>
</div>
<% } %>
```

### 등록 드롭다운 (다중 등록 옵션)
```html
<div class="dropdown in-bl">
    <button id="btn_regist" type="button"
        class="btn btn-only-icon btn-primary btn-xl"
        data-toggle="dropdown">
        <span class="icon_plus"></span>
    </button>
    <div class="dropdown-menu">
        <a class="dropdown-item" onclick="clearPage('1')">등록</a>
        <a class="dropdown-item" onclick="clearPage('2')">약정액변동</a>
        <a class="dropdown-item" onclick="clearPage('3')">양수도</a>
    </div>
</div>
```

---

# Part 4: 아이콘 클래스 목록

| 클래스 | 용도 | 비고 |
|--------|------|------|
| `.icon_reload` | 조회/새로고침 | F2 단축키 |
| `.icon_plus` | 등록/추가 | |
| `.icon_trash` | 삭제 | |
| `.icon_excel` | 엑셀 다운로드 | |
| `.icon_save` | 저장 | |
| `.icon_print` | 인쇄 | |
| `.icon_question` | 도움말 | |
| `.icon_approv` | 결재상신 | |
| `.icon_admin` | 관리자 | btn-primary 사용 |
| `.icon_search` | 검색 | |
| `.icon_calculator` | 계산 | |
| `.icon_bank` | 운용/은행 | |
| `.icon_sum` | 소계 표시 | |
| `.icon_refresh` | 새로고침 | 탭 내 버튼용 |
| `.icon_addRow` | 행추가 | 그리드 내 버튼 |
| `.icon_delRow` | 행삭제 | 그리드 내 버튼 |
| `.icon_arrowUp` | 위로이동 | 행 순서 변경 |
| `.icon_arrowDown` | 아래로이동 | 행 순서 변경 |
| `.icon_bars-arrow-down` | 트리 펼치기 | AC 트리 화면 |
| `.icon_filter` | 필터 | 추가 필터 메뉴 |

---

# Part 5: 도메인별 버튼 파일 구조

## 5.1 새 화면 버튼 추가 패턴

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

## 5.2 버튼 배치 순서 (표준)

```
[관리자 드롭다운] → [조회] → [등록] → [삭제] → [인쇄] → [엑셀] → [도움말]
```

## 5.3 파일별 위치

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

# Part 6: 탭 내 인라인 버튼 (그리드별)

## 6.1 탭별 그리드 툴바

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
    <div id="paging"></div>
</div>
```

## 6.2 인라인 버튼 클래스

```html
<!-- 메인 버튼: btn-outline-primary -->
class="btn btn-only-icon btn-xl btn-outline-primary"

<!-- 탭 내 버튼: btn-outline-primary buttons-row -->
class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
```

**차이점**: `buttons-row` 클래스가 추가되어 좀 더 컴팩트한 스타일.

---

# Part 7: 표준 함수명 규칙

## 7.1 버튼 클릭 함수

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

## 7.2 탭 내 함수

| 함수명 | 목적 | 사용 |
|--------|------|------|
| `searchTab4()` | 탭4 조회 | 탭4 새로고침 |
| `myCreateFunction(grid)` | 행 추가 | 그리드 편집 |
| `myDeleteFunction(gv,dp)` | 행 삭제 | 그리드 편집 |
| `excelExportTab4()` | 탭4 엑셀 | 탭4 엑셀 |
| `saveTab4()` | 탭4 저장 | 탭4 저장 |

---

# Part 8: 실전 예제

## 8.1 기본 화면 (조회+등록+삭제+엑셀+도움말)

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

## 8.2 관리자 드롭다운 포함 (IL0927 패턴)

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

---

# 핵심 파일 참조

| 파일 | 경로 | 역할 |
|------|------|------|
| inc_main_button.jsp | `include/inc_main_button.jsp` | 마스터 라우터 (도메인 분기) |
| inc_il_button.jsp | `include/button/inc_il_button.jsp` | IL 도메인 버튼 (4205줄) |
| inc_fd_button.jsp | `include/button/inc_fd_button.jsp` | FD 도메인 버튼 |
| inc_ac_button.jsp | `include/button/inc_ac_button.jsp` | AC 도메인 버튼 |
| inc_excel_button.jsp | `include/button/inc_excel_button.jsp` | 공통 엑셀 버튼 |

---

# 체크리스트

버튼 영역 추가 시 확인사항:

- [ ] `inc_XX_button.jsp`에 MENU_SCREEN_ID별 조건 분기 추가
- [ ] `gridpage_info` div (Total_Cnt + ADJ_GRID_COLUMN) 포함
- [ ] 권한별 버튼 분기 (`A`/`C`/`E`)
- [ ] 표준 배치 순서: [관리자] → [조회] → [등록] → [삭제] → [인쇄] → [엑셀] → [도움말]
- [ ] 엑셀 버튼은 `inc_excel_button.jsp` include 사용
- [ ] 도움말 버튼의 `ScreenHelp(window.location.pathname)` 호출
- [ ] 탭 내 그리드 편집 버튼은 `buttons-row` 클래스 사용
- [ ] JSP 페이지에서 해당 함수 (callRegistModal, fn_delete 등) 정의 확인
