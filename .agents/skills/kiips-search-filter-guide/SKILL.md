---
name: kiips-search-filter-guide
description: "KiiPS 검색필터 종합 가이드 - MainComponent, Constant, inc_filter_main.jsp 연동. Use when: 검색조건, 검색필터, SEARCH_CONDITION, MainComponent, 필터, inc_filter_main"
---

# KiiPS Search Filter Guide

KiiPS 검색필터 종합 가이드입니다. MainComponent 빌더 패턴, Constant 헬퍼, inc_filter_main.jsp 연동 등 검색필터 구현의 모든 내용을 다룹니다.

## Purpose

### What This Skill Does
- **검색조건 생성**: MainComponent 빌더 패턴으로 SEARCH_CONDITION 작성
- **날짜 필터**: Constant의 8가지 날짜 TYPE (단일/기간, 일/월/년)
- **셀렉트박스 필터**: 단일/다중 선택, ScriptFuncName 기반 데이터 로드
- **필터 바 연동**: inc_filter_main.jsp + Bootstrap TagsInput
- **탭 기반 동적 필터**: 탭별 필터 노출/숨기기 패턴
- **MAIN_SEARCH_FILTER**: 검색 실행 + createObjectForSearchAjax 연동

### What This Skill Does NOT Do
- 백엔드 API/컨트롤러 개발
- 그리드(RealGrid) 자체 설정 (kiips-realgrid-guide 참조)

## When to Use

### User Prompt Keywords
```
"검색조건", "검색필터", "필터", "SEARCH_CONDITION", "MainComponent",
"inc_filter_main", "필터 추가", "조건 추가", "날짜 필터", "셀렉트 필터",
"필터 바", "tagsinput", "createObjectForSearchAjax"
```

### File Patterns
```
수정: **/WEB-INF/jsp/**/*.jsp
내용: "SEARCH_CONDITION", "MainComponent", "inc_filter_main", "MAIN_SEARCH_FILTER"
```

---

# Part 1: 기본 구조 - SEARCH_CONDITION + inc_filter_main.jsp 연동

## 1.1 전체 아키텍처

```
[Java JSP 상단]                [JSP Include]                [JavaScript]
MainComponent.getTag()  -->  inc_filter_main.jsp   -->  MAIN_SEARCH_FILTER()
  |                           |                           |
  v                           v                           v
"ID^LABEL^TYPE^..."     search_condition_main.jsp   createObjectForSearchAjax()
  |                      (파이프 | 로 연결)              |
  v                           v                           v
SEARCH_CONDITION 문자열   동적 HTML 렌더링              Ajax 호출
```

## 1.2 JSP 표준 구조

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../include/header.jsp"%>
<!-- ... 생략 ... -->
<%
    // 1) SEARCH_CONDITION 정의
    String SEARCH_CONDITION =
        MainComponent.getInstance().SELECT_MULTI()
            .ScriptFuncName("fnCustListWithRTIR()")
            .RULE_ADMIN(true)
            .ID("EMP_CUST_NO")
            .LABEL("사원명")
            .getTag()
        + "|" + Constant.Single_Date_Term("RPT_DT", "보고기간", Constant.검색조건_일자_TYPE2)
        ;
%>

<!-- 2) 필터 바 Include -->
<jsp:include page="../include/inc_filter_main.jsp" flush="false">
    <jsp:param name="MAIN_SCREEN_ID" value="SCREEN_ID" />
    <jsp:param name="MAIN_SEARCH_CONDITION" value="<%=SEARCH_CONDITION%>" />
</jsp:include>

<script>
    // 3) 검색 함수 정의
    function MAIN_SEARCH_FILTER(tabId) {
        var item = $("#FILTER_INPUT_TAG").tagsinput('items');
        let searchCond = createObjectForSearchAjax(item);
        // API 호출...
    }
</script>
```

## 1.3 Tag 직렬화 포맷

`getTag()` 메서드가 반환하는 문자열:
```
MAIN_SEARCH_{ID}^{LABEL}^{HTMLTYPE}^{DATAS}^{AUTOSEARCH}^{ISSINGLE}^{ISREQ}^{SCRIPTFUNCNAME}^{WHERESTR}^{RULE_ADMIN}^{TOGGLELABELS}^{TOGGLESCRIPTFUNCNAME}
```

| 인덱스 | 이름 | 설명 | 예시 |
|--------|------|------|------|
| 0 | ID | `MAIN_SEARCH_` 접두사 + 사용자 ID | `MAIN_SEARCH_EMP_CUST_NO` |
| 1 | LABEL | 화면 표시 라벨 | `사원명` |
| 2 | HTMLTYPE | UI 컴포넌트 타입 | `SELECT`, `DT_TERM` |
| 3 | DATAS | 정적 데이터 (`#`=값/라벨, `@`=구분) | `1#Yes@0#No` |
| 4 | AUTOSEARCH | 변경 시 자동 검색 | `true`/`false` |
| 5 | ISSINGLE | 단일 선택 여부 | `true`/`false` |
| 6 | ISREQ | 필수 여부 | `true`/`false` |
| 7 | SCRIPTFUNCNAME | 데이터 로드 JS 함수 | `fnCustNo()` |
| 8 | WHERESTR | 함수 전달 파라미터 | SQL WHERE 조건 |
| 9 | RULE_ADMIN | 관리자 전용 규칙 | `true`/`false` |
| 10 | TOGGLELABELS | 토글 라벨 | `OFF#ON` |
| 11 | TOGGLESCRIPTFUNC | 토글 함수 | `fnToggle()` |

---

# Part 2: MainComponent 컴포넌트 타입 + 수정자

## 2.1 컴포넌트 타입 (15개)

| 메서드 | htmltype | 설명 |
|--------|----------|------|
| `SELECTBOX()` | `SELECT` | 기본 셀렉트박스 |
| `SELECT_SINGLE()` | `SELECT` | 단일 선택 셀렉트 |
| `SELECT_MULTI()` | `SELECT` | 다중 선택 셀렉트 |
| `TEXTBOX()` | `TEXTBOX` | 텍스트 입력 |
| `TEXTBOX_EACH()` | `TEXTBOX_EACH` | 개별 텍스트 입력 |
| `SEARCHBOX()` | `SEARCHBOX` | 검색박스 |
| `DATE_SINGLE_YYYYMMDD()` | `DT_SINGLE` | 단일 날짜 (년월일) |
| `DATE_SINGLE_YYYYMM()` | `DT_MONTH_SINGLE` | 단일 날짜 (년월) |
| `DATE_SINGLE_YYYY()` | `DT_YEAR_SINGLE` | 단일 날짜 (년도) |
| `DATE_TERM_YYYYMMDD()` | `DT_TERM` | 기간 (년월일~년월일) |
| `DATE_TERM_YYYYMM()` | `DT_MONTH_TERM` | 기간 (년월~년월) |
| `DATE_TERM_YYYY()` | `DT_YEAR_TERM` | 기간 (년도~년도) |
| `TOGGLE_SELECT_SINGLE()` | `TOGGLE_SELECT` | 토글 + 단일 선택 |
| `TOGGLE_SELECT_MULTI()` | `TOGGLE_SELECT` | 토글 + 다중 선택 |
| `BUTTOM()` | `BUTTON` | 버튼 |

## 2.2 수정자 (Modifier) 메서드 (12개)

| 메서드 | 설명 | 예시 |
|--------|------|------|
| `ID(String)` | 엘리먼트 ID | `.ID("EMP_CUST_NO")` |
| `LABEL(String)` | 표시 라벨 | `.LABEL("사원명")` |
| `ScriptFuncName(String)` | 데이터 로드 JS 함수 | `.ScriptFuncName("fnCustNo()")` |
| `RULE_ADMIN(boolean)` | 관리자 권한 규칙 | `.RULE_ADMIN(true)` |
| `REQUIRED()` | 필수 입력 | `.REQUIRED()` |
| `NonSearch()` | 자동 검색 비활성화 | `.NonSearch()` |
| `DATAS(String)` | 정적 데이터 | `.DATAS("Y#예@N#아니오")` |
| `WHERE_STR(String)` | 함수 전달 파라미터 | `.WHERE_STR("FUND")` |
| `TOGGLE_LABELS(String)` | 토글 라벨 | `.TOGGLE_LABELS("OFF#ON")` |
| `ToggleScriptFuncName(String)` | 토글 함수 | `.ToggleScriptFuncName("fn()")` |
| `SELECT_SINGLE()` | 단일 선택 설정 | 체이닝 시 |
| `SELECT_MULTI()` | 다중 선택 설정 | 체이닝 시 |

## 2.3 빌더 체이닝 패턴

```java
// 기본 패턴
MainComponent.getInstance()
    .SELECT_MULTI()                          // 1) 타입 선택
    .ID("EMP_CUST_NO")                       // 2) ID 설정
    .LABEL("사원명")                          // 3) 라벨
    .ScriptFuncName("fnCustListWithRTIR()") // 4) 데이터 로드 함수
    .RULE_ADMIN(true)                        // 5) 관리자 규칙
    .getTag()                                // 6) 문자열 생성

// 정적 데이터 패턴
MainComponent.getInstance()
    .SELECT_SINGLE()
    .ID("USE_YN")
    .LABEL("사용여부")
    .DATAS("Y#사용@N#미사용")
    .getTag()

// 날짜 패턴
MainComponent.getInstance()
    .DATE_SINGLE_YYYYMMDD()
    .ID("BASE_DT")
    .LABEL("기준일")
    .getTag()
```

---

# Part 3: Constant 날짜 타입 + 사전정의 조건

## 3.1 날짜 TYPE 상수 (8개)

| 상수 | 값 | 설명 |
|------|-----|------|
| `검색조건_일자_TYPE1` | `DT_SINGLE` | 년월일 단일 |
| `검색조건_일자_TYPE2` | `DT_TERM` | 년월일 기간 |
| `검색조건_일자_TYPE3` | `DT_MONTH_SINGLE` | 년월 단일 |
| `검색조건_일자_TYPE4` | `DT_MONTH_TERM` | 년월 기간 |
| `검색조건_일자_TYPE5` | `DT_MONTH_TERM_DGRN` | 년월 기간 + 차수 |
| `검색조건_일자_TYPE6` | `DT_TERM_CUSTOM` | 커스텀 기간 |
| `검색조건_일자_TYPE7` | `DT_YEAR_SINGLE` | 년도 단일 |
| `검색조건_일자_TYPE8` | `DT_YEAR_TERM` | 년도 기간 |

## 3.2 Constant 헬퍼 함수

```java
// 날짜 검색조건
Constant.Single_Date_Term("RPT_DT", "보고기간", Constant.검색조건_일자_TYPE2)
// → "MAIN_SEARCH_RPT_DT^보고기간^DT_TERM^..."

// 단일 셀렉트박스
Constant.Single_SelectBox("FUND_TPCD", "펀드구분")
Constant.Single_SelectBox_ScriptFunction("CMBT_NO", "재원", "fnCmbtCode()")

// 다중 셀렉트박스
Constant.Multi_SelectBox("DEPT_CD", "부서")
Constant.Multi_SelectBox_ScriptFunction("EMP_NO", "담당자", "fnEmpList()")

// 텍스트
Constant.SEARCH_TEXT("KEYWORD", "검색어")
Constant.SEARCH_NUMBER("AMT", "금액")
Constant.SEARCH_TEXT_POP("ADDR", "주소")

// 버튼
Constant.getMainSearchButton("fnSearch", "조회")

// 커스텀
Constant.getMainSearchCustomComp("CUSTOM", "커스텀", "CUSTOM_TYPE", "data")
```

## 3.3 주요 사전정의 검색조건 상수

```java
// 재원/펀드
검색조건_펀드_이름      // MAIN_SEARCH_CMBT_CUST_NO
검색조건_펀드_분류      // MAIN_SEARCH_FUNDLKIND_TPCD
검색조건_결성상태       // MAIN_SEARCH_COBT_STAT_TPCD
검색조건_결성기간       // MAIN_SEARCH_ESTB_COBT_TERM

// 날짜/기간
검색조건_기준년도       // MAIN_SEARCH_STD_YY
검색조건_분기구분       // MAIN_SEARCH_QUAR_TPCD
검색조건_통화구분코드   // MAIN_SEARCH_CRC_TPCD

// 조직
검색조건_부서코드       // MAIN_SEARCH_DEPT_CD
```

---

# 핵심 파일 참조

| 파일 | 경로 | 역할 |
|------|------|------|
| MainComponent.java | `KiiPS-UTILS/src/main/java/com/kiips/util/MainComponent.java` | 빌더 패턴 컴포넌트 |
| Constant.java | `KiiPS-UTILS/src/main/java/com/kiips/util/Constant.java` | 헬퍼 함수 + 상수 |
| inc_filter_main.jsp | `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/inc_filter_main.jsp` | 필터 바 UI |
| search_condition_main.jsp | `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/Filter/search_condition_main.jsp` | 파싱 + 동적 렌더링 |
| common.js | `KiiPS-UI/src/main/resources/static/js/common.js` | fnInitSelectBox, fnCommCode 등 |

---

# 체크리스트

검색필터 추가 시 확인사항:

- [ ] SEARCH_CONDITION에 `|`로 구분하여 새 조건 추가
- [ ] MainComponent 빌더: ID, LABEL, ScriptFuncName 설정
- [ ] ScriptFuncName 함수가 Promise 반환 + `[{CDDT, DSCP}]` 형태 확인
- [ ] 날짜는 Constant.Single_Date_Term() 또는 MainComponent.DATE_* 사용
- [ ] 관리자 전용 필터는 RULE_ADMIN(true) 설정
- [ ] MAIN_SEARCH_FILTER()에서 새 파라미터 활용 로직 추가
- [ ] 백엔드 API에서 새 파라미터 수신 및 처리 확인
- [ ] 탭 기반이면 탭 클릭 이벤트에 분기 로직 추가

---

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
