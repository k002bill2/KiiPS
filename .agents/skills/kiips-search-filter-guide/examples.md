# KiiPS Search Filter Guide - 실전 예제

## 기본 - 사원 + 기간 검색

```java
String SEARCH_CONDITION =
    MainComponent.getInstance().SELECT_MULTI()
        .ScriptFuncName("fnCustNo()")
        .RULE_ADMIN(true)
        .ID("EMP_CUST_NO").LABEL("담당자").getTag()
    + "|" + Constant.Single_Date_Term("BASE_DT", "기준일", Constant.검색조건_일자_TYPE2)
    ;
```

## 재원 + 투자기업 + 기준일 (IL0927 사후보고서)

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

## 펀드 관리 (복합 필터)

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

## 텍스트 검색 + 정적 데이터

```java
String SEARCH_CONDITION =
    Constant.SEARCH_TEXT("KEYWORD", "검색어")
    + "|" + MainComponent.getInstance().SELECT_SINGLE()
        .ID("USE_YN").LABEL("사용여부")
        .DATAS("Y#사용@N#미사용").getTag()
    + "|" + Constant.Single_Date_Term("REG_DT", "등록일", Constant.검색조건_일자_TYPE1)
    ;
```

## 토글 셀렉트 패턴

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
