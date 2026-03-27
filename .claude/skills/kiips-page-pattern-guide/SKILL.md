---
name: kiips-page-pattern-guide
description: "KiiPS JSP 페이지 표준 패턴 종합 가이드 - 페이지 레이아웃, Include 체계, 검색필터+버튼+그리드 연동. Use when: 페이지 생성, 화면 만들, JSP 만들, 새 화면, 페이지 패턴, 표준 패턴"
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
- SCSS 테마 적용 (kiips-scss 참조)
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

# Part 0: HTML 문자열 연결 코드 규칙

## text-indent 필수

`변수명 += '<html...'` 패턴으로 HTML을 문자열 연결할 때, HTML 구조의 중첩 레벨에 맞는 text-indent를 반드시 적용합니다.

### Bad (들여쓰기 없음)

```javascript
html += '<div class="tabs col-sm-12">';
html += '<ul class="nav nav-tabs">';
html += '<li class="nav-item">';
html += '<a class="nav-link active">전체</a>';
html += '</li>';
html += '</ul>';
html += '</div>';
```

### Good (HTML 중첩 레벨에 맞는 들여쓰기)

```javascript
html += '<div class="tabs col-sm-12">';
html += '  <ul class="nav nav-tabs">';
html += '    <li class="nav-item">';
html += '      <a class="nav-link active">전체</a>';
html += '    </li>';
html += '  </ul>';
html += '</div>';
```

- 모든 변수명에 적용: `html`, `mainHtml`, `cnte`, `resultTxt`, `allFileHtml`, `navHtml` 등
- 들여쓰기 단위: 2칸 스페이스 (문자열 내부)
- JavaScript 코드 자체의 들여쓰기와 별개로, 문자열 **내부** HTML 구조를 들여쓰기

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
                <!-- paging은 setPaging()이 동적 생성 → HTML 불필요 -->
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
    </div>
    <div class="tab-pane pt-0" id="STCK_DOC2" role="tabpanel">
        <div id="TB_{SCREEN_ID}2" data-id="TB_{SCREEN_ID}2" data-gbn="table" data-provider-id="dataProvider2"></div>
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

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
