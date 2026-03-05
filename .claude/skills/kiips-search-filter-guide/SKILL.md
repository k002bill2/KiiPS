---
name: KiiPS Search Filter Guide
description: |
  KiiPS 검색필터 종합 가이드 - MainComponent, Constant, inc_filter_main.jsp 연동.
  Use when: 검색조건 추가, 필터 생성, SEARCH_CONDITION 작성, MainComponent 빌더 패턴
version: 1.0.0
priority: critical
enforcement: require
category: ui-development
disclosure:
  summary: true      # name + description 만 로드
  expanded: true     # Quick Reference + 핵심 패턴
  full: true         # 전체 가이드 (7 Parts)
  default: expanded  # 기본 로딩 레벨
tags:
  - search
  - filter
  - MainComponent
  - Constant
  - SEARCH_CONDITION
  - 검색조건
  - 필터
  - inc_filter_main
  - tagsinput
author: KiiPS Development Team
lastUpdated: 2026-02-06
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

# Part 4: 자주 사용하는 ScriptFuncName 함수

## 4.1 공통 데이터 로드 함수

| 함수명 | 반환 데이터 | 용도 |
|--------|------------|------|
| `fnCustNo()` | 전체 사원 목록 | 사원 셀렉트 |
| `fnCustListWithRTIR()` | RTIR 관련 사원 | 주간보고 등 |
| `fnAuthCmbtNmCode(true)` | 권한별 조합(재원) 목록 | 재원 필터 |
| `fnInvCustNo('ILONLY')` | 투자기업(IL모듈) | IL 투자기업 필터 |
| `fnInvCustNo('compOnly')` | 투자기업(기업만) | 사후관리 탭 |
| `fnInvCustNo(true, true)` | 투자기업(전체) | 전체 투자기업 |
| `fnCommCode("TPCD_ID")` | 공통코드 | 구분/유형 셀렉트 |
| `fnGetManagerList()` | 펀드매니저 목록 | 매니저 셀렉트 |
| `fnDeptCode()` | 부서 코드 | 부서 필터 |

## 4.2 함수 연동 패턴

```java
// ScriptFuncName에 지정한 함수가 Promise를 반환하면
// search_condition_main.jsp에서 자동으로:
// fnAuthCmbtNmCode(true).then(function(data) {
//     fnInitSelectBox("MAIN_SEARCH_CMBT_CUST_NO", "재원", data);
// });
```

**중요**: ScriptFuncName에 지정한 함수는 반드시 `Promise`를 반환해야 하며, resolve 시 `[{CDDT: "값", DSCP: "표시명"}, ...]` 형태의 배열을 전달해야 합니다.

---

# Part 5: 탭 기반 동적 필터 관리 패턴

## 5.1 탭별 필터 분기 (MAIN_SEARCH_FILTER)

탭마다 다른 API를 호출해야 할 때:

```javascript
function MAIN_SEARCH_FILTER(tabId) {
    var item = $("#FILTER_INPUT_TAG").tagsinput('items');
    let searchCond = createObjectForSearchAjax(item);
    const activeTab = tabId || $('.apprv_tab.active').attr('id');

    // 특정 탭은 별도 API
    if(activeTab === 'TAB_DOC4') {
        logosAjax.requestToken(gToken, url + "/POST_RPT_LIST", "post", searchCond,
            function(data) {
                dataProvider4.setRows(data.body.LIST);
                setPaging(gridView4, 10, "#paging4");
                gridView4.refresh();
            });
        return;
    }

    // 기본 탭 (1~3) - 하나의 API로 여러 탭 데이터
    logosAjax.requestToken(gToken, url + "/LIST", "post", searchCond,
        function(data) {
            dataProvider.setRows(data.body.GN);
            dataProvider2.setRows(data.body.AF);
            dataProvider3.setRows(data.body.IV);
            // 탭 클릭 트리거...
        });
}
```

## 5.2 탭 클릭 시 필터 동적 추가/제거

```javascript
$('.apprv_tab').on('click', function() {
    const tabId = $(this).attr('id');

    if(tabId === 'TAB_DOC4') {
        searchTab4();  // 별도 검색 함수 호출
        return;
    }

    if(tabId === 'TAB_DOC2') {
        // 탭2 전용 추가 필터 생성
        if($('#MAIN_SEARCH_EXTRA').length === 0) {
            const filterHtml = `
                <div class="input-group" id="EXTRA_FILTER">
                    <select id="MAIN_SEARCH_EXTRA" multiple ...></select>
                </div>`;
            $('.filter_div.aisch').append(filterHtml);
            // 데이터 로드
            fnLoadData().then(function(data) {
                fnInitSelectBox("MAIN_SEARCH_EXTRA", "추가필터", data);
            });
        }
    } else {
        // 다른 탭에서는 추가 필터 숨기기
        $('#EXTRA_FILTER').hide();
    }
});
```

## 5.3 주의사항

- 모든 SEARCH_CONDITION 필터는 `MAIN_SEARCH_` 접두사를 자동 부여
- 탭 전환 시 `createObjectForSearchAjax(item)`이 모든 태그 값을 수집
- 백엔드에서 사용하지 않는 파라미터는 자동 무시 (명시적 매핑 필요)
- 탭 전용 필터를 SEARCH_CONDITION에 포함시키면 모든 탭에서 필터가 보임

---

# Part 6: MAIN_SEARCH_FILTER + createObjectForSearchAjax 연동

## 6.1 createObjectForSearchAjax 동작 원리

```javascript
// 태그에서 검색 파라미터 객체 생성
let searchCond = createObjectForSearchAjax(item);
// 결과: { EMP_CUST_NO: "001234", RPT_DT: "20260101|20260201", ... }
```

- `MAIN_SEARCH_` 접두사를 제거하고 원래 ID를 키로 사용
- 날짜 기간(DT_TERM)은 `시작일|종료일` 형태
- 미선택 필터는 키 자체가 포함되지 않음
- 다중 선택은 `,` 구분 문자열

## 6.2 필터 저장/초기화

inc_filter_main.jsp가 자동 제공하는 기능:
- **필터 저장**: 현재 필터 상태를 localStorage에 저장 (화면 ID 기준)
- **필터 초기화**: 모든 태그 제거 + 기본값으로 복원
- **전체보기**: 필터 없이 전체 데이터 조회

## 6.3 자동 검색 vs 수동 검색

```java
// 자동 검색 (기본값) - 필터 변경 즉시 MAIN_SEARCH_FILTER 호출
MainComponent.getInstance().SELECT_MULTI().ID("EMP_NO").LABEL("사원").getTag()

// 수동 검색 - 필터 변경 시 검색 안 함, "전체보기" 버튼으로만 검색
MainComponent.getInstance().SELECT_MULTI().NonSearch().ID("EMP_NO").LABEL("사원").getTag()
```

## 6.4 관리자 권한 규칙 (RULE_ADMIN)

```java
// RULE_ADMIN(true) 설정 시:
// - 관리자: 전체 목록 표시 + 선택 가능
// - 일반 사원: 자신의 데이터만 표시 + 변경 불가 (자동 필터링)
MainComponent.getInstance()
    .SELECT_MULTI()
    .ID("EMP_CUST_NO")
    .LABEL("사원명")
    .ScriptFuncName("fnCustNo()")
    .RULE_ADMIN(true)
    .getTag()
```

---

# Part 7: 실전 예제

## 7.1 기본 - 사원 + 기간 검색

```java
String SEARCH_CONDITION =
    MainComponent.getInstance().SELECT_MULTI()
        .ScriptFuncName("fnCustNo()")
        .RULE_ADMIN(true)
        .ID("EMP_CUST_NO").LABEL("담당자").getTag()
    + "|" + Constant.Single_Date_Term("BASE_DT", "기준일", Constant.검색조건_일자_TYPE2)
    ;
```

## 7.2 재원 + 투자기업 + 기준일 (IL0927 사후보고서)

```java
String SEARCH_CONDITION =
    MainComponent.getInstance().SELECT_MULTI()
        .ScriptFuncName("fnCustListWithRTIR()").RULE_ADMIN(true)
        .ID("EMP_CUST_NO").LABEL("사원명").getTag()
    + "|" + Constant.Single_Date_Term("RPT_DT", "보고기간", Constant.검색조건_일자_TYPE2)
    + "|" + MainComponent.getInstance().SELECT_MULTI()
        .ScriptFuncName("fnAuthCmbtNmCode(true)")
        .ID("CMBT_CUST_NO").LABEL("재원").getTag()
    + "|" + MainComponent.getInstance().SELECT_MULTI()
        .ID("INV_COMP_NM").LABEL("투자기업")
        .ScriptFuncName("fnInvCustNo('ILONLY')").getTag()
    + "|" + MainComponent.getInstance().DATE_SINGLE_YYYYMMDD()
        .ID("BASE_DT").LABEL("기준일").getTag()
    ;
```

## 7.3 펀드 관리 (복합 필터)

```java
String SEARCH_CONDITION =
    Constant.검색조건_펀드_이름
    + "|" + Constant.검색조건_펀드_분류
    + "|" + Constant.검색조건_결성상태
    + "|" + Constant.Single_Date_Term("ESTB_DT", "결성기간", Constant.검색조건_일자_TYPE2)
    + "|" + MainComponent.getInstance().SELECT_SINGLE()
        .ID("CRC_TPCD").LABEL("통화").ScriptFuncName("fnCommCode('CRC_TPCD')").getTag()
    ;
```

## 7.4 텍스트 검색 + 정적 데이터

```java
String SEARCH_CONDITION =
    Constant.SEARCH_TEXT("KEYWORD", "검색어")
    + "|" + MainComponent.getInstance().SELECT_SINGLE()
        .ID("USE_YN").LABEL("사용여부")
        .DATAS("Y#사용@N#미사용").getTag()
    + "|" + Constant.Single_Date_Term("REG_DT", "등록일", Constant.검색조건_일자_TYPE1)
    ;
```

## 7.5 토글 셀렉트 패턴

```java
String SEARCH_CONDITION =
    MainComponent.getInstance().TOGGLE_SELECT_MULTI()
        .ID("FUND_TYPE").LABEL("펀드유형")
        .ScriptFuncName("fnFundType()")
        .TOGGLE_LABELS("전체#활성만")
        .ToggleScriptFuncName("fnFundTypeToggle()")
        .getTag()
    ;
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
