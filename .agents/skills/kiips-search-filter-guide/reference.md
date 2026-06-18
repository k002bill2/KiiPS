# KiiPS Search Filter Guide - 상세 레퍼런스

## 자주 사용하는 ScriptFuncName 함수

### 공통 데이터 로드 함수

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

### 함수 연동 패턴

```java
// ScriptFuncName에 지정한 함수가 Promise를 반환하면
// search_condition_main.jsp에서 자동으로:
// fnAuthCmbtNmCode(true).then(function(data) {
//     fnInitSelectBox("MAIN_SEARCH_CMBT_CUST_NO", "재원", data);
// });
```

**중요**: ScriptFuncName에 지정한 함수는 반드시 `Promise`를 반환해야 하며, resolve 시 `[{CDDT: "값", DSCP: "표시명"}, ...]` 형태의 배열을 전달해야 합니다.

---

## 탭 기반 동적 필터 관리 패턴

### 탭별 필터 분기 (MAIN_SEARCH_FILTER)

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

### 탭 클릭 시 필터 동적 추가/제거

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

### 주의사항

- 모든 SEARCH_CONDITION 필터는 `MAIN_SEARCH_` 접두사를 자동 부여
- 탭 전환 시 `createObjectForSearchAjax(item)`이 모든 태그 값을 수집
- 백엔드에서 사용하지 않는 파라미터는 자동 무시 (명시적 매핑 필요)
- 탭 전용 필터를 SEARCH_CONDITION에 포함시키면 모든 탭에서 필터가 보임

---

## MAIN_SEARCH_FILTER + createObjectForSearchAjax 연동

### createObjectForSearchAjax 동작 원리

```javascript
// 태그에서 검색 파라미터 객체 생성
let searchCond = createObjectForSearchAjax(item);
// 결과: { EMP_CUST_NO: "001234", RPT_DT: "20260101|20260201", ... }
```

- `MAIN_SEARCH_` 접두사를 제거하고 원래 ID를 키로 사용
- 날짜 기간(DT_TERM)은 `시작일|종료일` 형태
- 미선택 필터는 키 자체가 포함되지 않음
- 다중 선택은 `,` 구분 문자열

### 필터 저장/초기화

inc_filter_main.jsp가 자동 제공하는 기능:
- **필터 저장**: 현재 필터 상태를 localStorage에 저장 (화면 ID 기준)
- **필터 초기화**: 모든 태그 제거 + 기본값으로 복원
- **전체보기**: 필터 없이 전체 데이터 조회

### 자동 검색 vs 수동 검색

```java
// 자동 검색 (기본값) - 필터 변경 즉시 MAIN_SEARCH_FILTER 호출
MainComponent.getInstance().SELECT_MULTI().ID("EMP_NO").LABEL("사원").getTag()

// 수동 검색 - 필터 변경 시 검색 안 함, "전체보기" 버튼으로만 검색
MainComponent.getInstance().SELECT_MULTI().NonSearch().ID("EMP_NO").LABEL("사원").getTag()
```

### 관리자 권한 규칙 (RULE_ADMIN)

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
