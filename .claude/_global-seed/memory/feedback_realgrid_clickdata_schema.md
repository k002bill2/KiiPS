---
name: RealGrid onCellClicked clickData 스키마 (KiiPS 검증)
description: onCellClicked 콜백의 clickData 객체 필드 의미. column은 필드명 문자열이고 check 렌더러 셀의 cellType은 "check"
type: feedback
originSessionId: d9983b69-cd43-4721-94ad-06156432e5f6
---
KiiPS에서 `gridView.onCellClicked(grid, clickData)` 콜백을 쓸 때 `clickData` 객체의 실제 필드 의미는 다음과 같다. RealGrid 일반 문서나 타 프로젝트 패턴으로 추정하면 틀린다.

**clickData 필드**:
- `clickData.column` — **필드명 문자열** (예: `"USE_YN"`, `"TRT_CUST_NM"`, `"SLIP_NO_VIEW"`). 배열 인덱스 아님.
- `clickData.itemIndex` — 행 인덱스 (정렬/필터 후 화면 상 인덱스). `dataProvider.setValue/getValue`에 그대로 전달 가능.
- `clickData.cellType` — 영역 분류. 주요 값: `"header"`, `"summary"`, `"groupPanel"`, `"groupFooter"`, `"check"`, `"data"`.

**⚠️ 핵심 함정 — `renderer:{type:"check"}` 셀의 cellType**:
- 일반 데이터 셀이어도 렌더러가 check면 cellType이 **`"check"`로 분류**된다.
- 따라서 `if (cellType !== "data") return;` 같은 **포지티브 필터는 체크 셀을 전부 제외**하여 토글 자체를 차단한다.
- 올바른 패턴: cellType은 **네거티브 제외만** 사용 (헤더/썸머리/그룹 등 확실히 데이터 외 영역만 걸러냄).

**올바른 패턴 (AC1028.jsp 검증)**:
```javascript
gv.onCellClicked = function(grid, clickData) {
    // 데이터 외 영역 제외 (네거티브 필터)
    if (clickData.cellType === "header" || clickData.cellType === "summary" ||
        clickData.cellType === "groupPanel" || clickData.cellType === "groupFooter") {
        return;
    }
    if (clickData.itemIndex == null || clickData.itemIndex < 0) return;

    // 필드명 문자열 직접 비교 (인덱스 접근 금지)
    if (clickData.column !== "USE_YN") return;

    // itemIndex로 dataProvider 접근
    var cur = dp.getValue(clickData.itemIndex, "USE_YN");
    dp.setValue(clickData.itemIndex, "USE_YN", cur === "Y" ? "N" : "Y");
};
```

**금지 패턴**:
```javascript
// ❌ clickData.column을 배열 인덱스로 취급
var col = grid.getColumns()[clickData.column];  // undefined 반환

// ❌ cellType 포지티브 필터 — check 렌더러 셀 전부 차단됨
if (clickData.cellType !== "data") return;
```

**Why**: RealGrid 2.6.3 문서의 여러 필드 설명이 버전/테마별로 편차가 있지만, KiiPS 코드베이스에서는 위 스키마가 일관적으로 쓰인다. `clickData.column = 'CNTE'` 같은 직접 대입도 발견됨(SY0221:496).

**How to apply**:
- 새 `onCellClicked` 작성 시 위 패턴 복제
- cellType 조건은 **반드시 네거티브**
- 컬럼 식별은 **fieldName 문자열 직접 비교**
- 행 인덱스는 `itemIndex` (dataRow는 버전별 존재 여부 불확실)

**참조 파일**:
- `SY0210.jsp:366` — `clickData.column == 'MFUND_ACCT_TPCD'`
- `AC0812.jsp:329,353` — `clickData.column==='SLIP_NO_VIEW'`
- `SY0801.jsp:163,214` — `clickData.column === "ORI_FNN"`
- `SY0215.jsp:140-144` — 네거티브 cellType 필터 (`'check' || 'header' || 'summary' || 'groupPanel' || 'groupFooter'`)
- `AC1028.jsp` fnInitSettingGrid — 검증된 수정본

**실수 이력 (2026-04-22)**: AC1028 대시보드 설정 모달에서 USE_YN 체크 토글이 작동하지 않는 문제. 원인은 ① `clickData.column`을 배열 인덱스로 가정하여 `grid.getColumns()[clickData.column]`으로 접근(undefined 반환), ② `cellType !== "data"` 포지티브 필터로 check 렌더러 셀 차단. 두 버그 결합으로 토글 자체가 실행 안 됨. KiiPS 실제 코드 grep 후 교정.

**메타 교훈**: RealGrid API 관련 가정은 반드시 KiiPS 코드베이스 grep으로 확인할 것. 탐색 에이전트 요약 또는 일반 RealGrid 문서 추정만으로 가정하면 실수 반복.
