---
name: kiips-button-guide
description: "KiiPS 버튼 영역 종합 가이드 - inc_main_button.jsp, 도메인별 버튼, 권한 처리, 아이콘 클래스. Use when: 버튼, 툴바, inc_main_button, btn_reload, btn_regist, 관리자 버튼"
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

## 1.3 스크린 ID 그룹화 원칙 (OR 조건 재사용) 🚨 Critical Rule

> **계열 버튼 파일(`inc_XX_button.jsp`)에서 신규 스크린을 추가할 때, 기존 분기와 동일한 버튼 배열을 복제하지 말 것.**

### 판단 규칙

```
신규 스크린의 버튼 배열을 기존 모든 분기와 비교
    |
    ├── 기존 분기와 "완전히 동일한 버튼 구성"인가?
    │   └── YES → 기존 분기의 if 조건에 || 로 추가 (✅ 재사용)
    │   └── NO  → 새로운 else if 분기 생성 (신규 구성일 때만)
    │
    └── "일부만 같고 일부는 다름" → 새 분기 생성 (코드 중복 회피보다 명확성 우선)
```

### ✅ 올바른 예 (동일 버튼 배열 공유)

```jsp
<%-- MI0303/MI0320/MI0324/MI0329/MI0331 이 모두
     [Total + ADJ_GRID + 조회 + 소계드롭다운 + 엑셀 + 도움말]을 공유한다면 --%>
}else if(MENU_SCREEN_ID.equals("MI0303") || MENU_SCREEN_ID.equals("MI0320")
      || MENU_SCREEN_ID.equals("MI0324") || MENU_SCREEN_ID.equals("MI0329")
      || MENU_SCREEN_ID.equals("MI0331") || MENU_SCREEN_ID.equals("MI0332") /* 신규: 기존 그룹과 버튼 동일 */ ){
%>
    <!-- 단일 버튼 HTML 블록 -->
<%
}
```

### ❌ 잘못된 예 (동일 배열을 새 분기로 복제)

```jsp
<%-- 버튼 구성이 기존 그룹과 동일한데 별도 분기를 만든 경우 --%>
}else if(MENU_SCREEN_ID.equals("MI0303") || ... || MENU_SCREEN_ID.equals("MI0331")){
%>
    <!-- 같은 HTML 블록 A -->
<%
}else if(MENU_SCREEN_ID.equals("MI0332")){  // ❌ 분기 중복
%>
    <!-- HTML 블록 A와 거의 동일한 복제본 -->
<%
}
```

### 재사용 vs 신규 분기 판단 체크리스트

| 항목 | 기존 그룹 | 신규 스크린 | 일치? |
|------|----------|------------|-------|
| Total 뱃지 | O | O | ✓ |
| ADJ_GRID_COLUMN | O | O | ✓ |
| 조회 버튼(btn_reload) | O | O | ✓ |
| 등록 버튼(btn_regist) | X | X | ✓ |
| 소계 드롭다운 | O | X | ✗ |
| 엑셀 버튼 | O | X | ✗ |
| 도움말(btn_help) | O | O | ✓ |

> 위 예시처럼 **하나라도 불일치**면 새로운 분기 생성. **모두 일치**면 OR 체인 재사용.

### 사유

1. **Single Source of Truth**: 버튼 아이콘/클래스/핸들러 변경 시 한 곳만 수정
2. **회귀 방지**: 복제본 누락 수정으로 화면별 버튼이 따로 노는 사고 예방
3. **파일 크기 관리**: `inc_il_button.jsp`는 이미 4,205줄 — 불필요한 분기 증식 차단
4. **코드 리뷰 효율**: OR 체인 한 줄만 봐도 "이 버튼 구성이 적용되는 화면들"을 즉시 파악

### 리팩토링 가이드

기존에 중복된 분기를 발견하면 다음 순서로 정리:

```
1. 두 분기의 HTML 블록을 diff
2. 100% 동일 → 분기 병합 (OR 체인으로 통합)
3. 일부 차이 → 차이 부분만 <% if(...) { %> 조건부로 감싸고 나머지 공유
4. 전혀 다름 → 그대로 유지
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

- [ ] **[🚨 Critical]** 기존 분기와 버튼 배열이 100% 동일한지 비교 — 동일하면 **`||` OR 체인으로 기존 조건에 추가** (1.3 원칙)
- [ ] 버튼 구성이 일부라도 다르면 새로운 `else if` 분기 생성 (동일 HTML 복제 금지)
- [ ] `inc_XX_button.jsp`에 MENU_SCREEN_ID별 조건 분기 추가 (OR 재사용 원칙 적용 후)
- [ ] `gridpage_info` div (Total_Cnt + ADJ_GRID_COLUMN) 포함
- [ ] 권한별 버튼 분기 (`A`/`C`/`E`)
- [ ] 표준 배치 순서: [관리자] → [조회] → [등록] → [삭제] → [인쇄] → [엑셀] → [도움말]
- [ ] 엑셀 버튼은 `inc_excel_button.jsp` include 사용
- [ ] 도움말 버튼의 `ScreenHelp(window.location.pathname)` 호출
- [ ] 탭 내 그리드 편집 버튼은 `buttons-row` 클래스 사용
- [ ] JSP 페이지에서 해당 함수 (callRegistModal, fn_delete 등) 정의 확인

---

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
