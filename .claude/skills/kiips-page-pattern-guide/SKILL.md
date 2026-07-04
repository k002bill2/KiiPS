---
name: kiips-page-pattern-guide
description: "KiiPS JSP 페이지 표준 패턴 학습/참조 (수동 생성 가이드). 레이아웃, Include 체계, 검색필터+버튼+그리드 연동 구조. Use when: 페이지 패턴, 표준 패턴, JSP 구조, 페이지 레이아웃, Include 체계, 검색+버튼+그리드 연결, 수동으로 페이지 만들. NOT for: 자동 생성 파이프라인(use kiips-page-harness), 컴포넌트 단위 추가(use kiips-ui-component-builder)"
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
- SCSS 테마 적용 (kiips-scss 참조) — **신규 페이지 색상은 반드시 `var(--*)` / `$grey-*` / `$primary-*` 시스템 변수 기반 작성. hex 하드코딩 금지**
- RealGrid 상세 설정 (kiips-realgrid-guide 참조)

### Related Skills
| Skill | 연동 포인트 |
|-------|------------|
| `kiips-search-filter-guide` | SEARCH_CONDITION 빌더 (본 가이드 Part 2.3) |
| `kiips-button-guide` | inc_main_button 버튼 등록 |
| `kiips-realgrid-guide` | 그리드 생성/설정 |
| `kiips-a11y-guide` | **웹 접근성 — 페이지 생성/수정 시 항상 함께 적용** (alt/aria/라벨/키보드/명도대비 체크리스트) |

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
- [ ] **Controller RequestMapping 등록** → Part 10-A 절차 따름 (필수, 누락 시 URL 접근 불가)
- [ ] **다크모드 호환** (아래 규칙 참조)

---

# Part 10-A: Controller RequestMapping 자동 등록

> JSP 파일을 만든 직후 반드시 수행. 이 단계가 빠지면 페이지가 만들어졌어도 URL로 접근할 수 없음.
> 자동화 흐름(`kiips-page-harness`)도 이 절차를 그대로 호출함 — 단일 진실의 원천(SoT).

## 1. 도메인 → Controller 파일 매핑 (확정 규칙)

기준 경로: `KiiPS-UI/src/main/java/com/kiips/ui/controller/`

| JSP 디렉토리 | Controller 파일 | URL Prefix | 비고 |
|---|---|---|---|
| `kiips/PG/` | `PGUIController.java` | `/PG/*` | |
| `kiips/FD/` | `FDUIController.java` | `/FD/*` | |
| `kiips/IL/` | `ILUIController.java` | `/IL/*` | |
| `kiips/AC/` | `ACUIController.java` | `/AC/*` | |
| `kiips/EL/` | `ELUIController.java` | `/EL/*` | |
| `kiips/IV/` | `IVUIController.java` | `/IV/*` | |
| `kiips/MG/` | `MGUIController.java` | `/MG/*` | |
| `kiips/MI/` | `MIUIController.java` | `/MI/*` | |
| `kiips/RM/` | `RMUIController.java` | `/RM/*` | |
| `kiips/RT/` | `RTUIController.java` | `/RT/*` | |
| `kiips/ST/` | `STUIController.java` | `/ST/*` | |
| `kiips/SY/` | `SYUIController.java` | `/SY/*` | |
| `kiips/PR/` | `KiiPSUIController.java` | (특수) | 변경 금지 |
| **`kiips/COM/`** | **`COMMONUIController.java`** | `/COM/*` | 명명 예외 |
| `kiips/POPUP/` | `COMMONUIController.COM_POPUP()` | — | **이 절차 적용 안 함** → `kiips-ui-component-builder` 위임 |

**규칙**: 일반적으로 `{도메인}` → `{도메인}UIController.java`. 예외 1건(COM → COMMON).

## 2. 표준 메서드 템플릿

기존 메서드(예: `PGUIController.java:27-30`)와 100% 동일한 시그니처를 유지:

```java
@RequestMapping(value="/{PAGE_ID}", method={RequestMethod.GET,RequestMethod.POST})
public String {PAGE_ID}(Locale locale, HttpServletRequest req, HttpServletResponse res) {
    return "kiips/{도메인}/{PAGE_ID}";
}
```

- `Model` 파라미터는 **추가하지 않음** (기본 시그니처는 미포함)
- 들여쓰기는 탭 1개 (기존 메서드와 동일)
- 어노테이션 위치·줄바꿈도 기존 메서드와 동일하게

## 3. 자동화 절차 (의사코드)

```
입력: PAGE_ID (예: "PG0444"), JSP_PATH (예: "kiips/PG/PG0444.jsp")

1. 도메인 추출
   - 정규식: kiips/([A-Z]+)/  →  도메인 = "PG"

2. Controller 파일명 결정
   - 일반: "{도메인}UIController.java"
   - 예외: COM → "COMMONUIController.java"
   - POPUP: 이 절차 적용 안 함, kiips-ui-component-builder로 위임

3. Controller 파일 존재 확인
   - 없으면 → [신규 도메인 분기] AskUserQuestion으로 신규 파일 생성 승인 요청
              승인 시: 표준 클래스 템플릿으로 작성
              거절/응답 없음 시: 자동화 중단, 수동 처리 안내
   - 있으면 → 다음 단계

4. 중복 메서드 검사 (필수, 멱등성)
   - 명령: grep -E '"/{PAGE_ID}"' {Controller 파일 경로}
   - hit 발견 시 → 등록 skip + "이미 존재함" 보고

5. 메서드 삽입
   - 위치: 클래스 마지막 메서드 다음, 클래스 닫는 '}' 직전
   - 내용: 위 "표준 메서드 템플릿" 그대로
   - 기존 메서드 수정 금지 (editing.md 범위 제한)

6. 컴파일 검증
   - cd KiiPS-HUB && mvn compile -pl :KiiPS-UI -am
   - BUILD SUCCESS 확인 후에만 완료 보고
   - 실패 시 → svn revert {Controller 파일} → 에러 메시지 사용자 보고

7. 결과 출력
   - 추가된 파일 경로
   - 등록된 메서드명
   - 매핑 URL (예: "/PG/PG0444")
   - 컴파일 결과
```

## 4. 신규 도메인 — Controller 파일 신규 생성 템플릿

도메인이 처음 등장하는 경우(`{도메인}UIController.java`가 존재하지 않음), 사용자 승인 후 다음 템플릿으로 생성:

```java
package com.kiips.ui.controller;

import com.kiips.ui.config.MessageUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Locale;

@Controller
@RequestMapping("/{도메인}/*")
public class {도메인}UIController {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    MessageUtil messageUtil;

    // 메서드는 Part 10-A 절차로 추가
}
```

## 5. 안전장치 (필수)

| 가드 | 근거 규칙 | 동작 |
|---|---|---|
| 중복 메서드 시 skip | `verification.md` | grep으로 사전 확인, 중복 시 등록 안 함 |
| 신규 Controller 파일 승인 게이트 | `anti-rationalization.md` 고위험 파일 | AskUserQuestion 호출, 거절 시 중단 |
| 컴파일 실패 시 자동 revert | `error-handling.md` 악화 시 되돌리기 | `svn revert` + 에러 보고 |
| 기존 메서드 수정 금지 | `editing.md` 범위 제한 | 신규 메서드 삽입만, 다른 행 건드리지 않음 |
| Ralph Loop 감지 | `ralph-loop-detection.md` | 동일 Controller 3회 편집 시 자동 HALT |

## 6. 비범위 (이 절차가 다루지 않는 것)

- Service/DAO/Mapper 자동 생성
- 메뉴(`TB_MENU`) 데이터 등록
- 권한(role) 매핑 / 보안 어노테이션
- 팝업(POPUP/) 라우팅 — `kiips-ui-component-builder`의 `COMMONUIController.COM_POPUP()` 분기 흐름 사용

## 7. 검증 결과 보고 형식

완료 시 다음 정보를 사용자에게 보고:

```
✅ Controller 등록 완료
   - 파일: KiiPS-UI/.../{도메인}UIController.java
   - 메서드: {PAGE_ID}()
   - 매핑 URL: /{도메인}/{PAGE_ID}
   - View: kiips/{도메인}/{PAGE_ID}
   - 컴파일: BUILD SUCCESS
```

또는 skip된 경우:

```
⏭ Controller 등록 skip
   - 사유: {PAGE_ID} 메서드 이미 존재
   - 위치: {파일}:{대략 라인}
```

---

# Part 11: 다크모드 자동 연동 (CRITICAL)

새 페이지/컴포넌트 생성 시 반드시 다크모드를 고려해야 합니다.

## 규칙 1: 인라인 style에 색상 금지

```jsp
<!-- ❌ 다크모드에서 오버라이드 불가 -->
<div style="background-color:#f8f9fa; color:#333; border:1px solid #dee2e6;">

<!-- ✅ CSS 클래스 사용 → SCSS에서 다크 오버라이드 -->
<div class="summary-bar">
```

## 규칙 2: 새 CSS 클래스는 라이트+다크 쌍으로 정의

```scss
// custom.scss에 추가
.my-component {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}
[data-theme=dark] .my-component {
  background-color: $dark-color-3;
  color: $dark-default-text;
  border-color: $dark-color-4;
}
```

## 규칙 3: RealGrid 커스텀 렌더러 다크 감지

```javascript
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

gridView.registerCustomRenderer("my_renderer", {
  initContent: function(parent) {
    var el = document.createElement("span");
    // ✅ 테마별 색상 분기
    el.style.color = isDark ? "#ddd" : "#333";
    el.style.background = isDark ? "#3a3f47" : "#e9ecef";
    parent.appendChild(el);
  }
});
```

## 규칙 4: JS 동적 HTML 생성 시

```javascript
// ❌ 하드코딩 색상
html += '<span style="color:#333;">텍스트</span>';

// ✅ CSS 클래스 사용
html += '<span class="text-body">텍스트</span>';
```

## 색상 매핑 Quick Reference

| 용도 | 라이트 | 다크 변수 |
|------|--------|----------|
| 배경 | `#f8f9fa` | `$dark-bg` (#1d2127) |
| 카드 배경 | `#fff` | `$dark-color-3` |
| 텍스트 | `#333` | `$dark-default-text` (#eee) |
| 테두리 | `#dee2e6` | `$dark-color-4` |
| 입력 배경 | `#e9ecef` | `#3a3f47` |

> 상세: [kiips-scss](../kiips-scss/SKILL.md) 스킬 참조

---

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
