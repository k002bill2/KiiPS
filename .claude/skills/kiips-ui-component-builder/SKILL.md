---
name: kiips-ui-component-builder
description: "JSP 컴포넌트 템플릿 기반 생성 (RealGrid, ApexCharts, Bootstrap 폼, 팝업). 데이터 테이블은 기본 RealGrid 사용, HTML <table> 금지. Use when: UI 컴포넌트, JSP 생성, 그리드 생성, 차트 추가, 페이지 생성, 화면 개발"
---

# KiiPS UI Component Builder

JSP 템플릿 기반의 UI 컴포넌트를 빠르게 생성하는 Skill입니다. RealGrid, ApexCharts, Bootstrap 폼 등 자주 사용하는 컴포넌트의 프리셋을 제공하여 개발 속도를 향상시킵니다.

## Purpose

### What This Skill Does
- **JSP 컴포넌트 생성**: JSTL/EL 기반 템플릿으로 재사용 가능한 컴포넌트 생성
- **RealGrid 프리셋**: 기본, 편집, 트리 그리드 템플릿 제공
- **ApexCharts 프리셋**: 선, 도넛, 바 차트 템플릿 제공
- **Bootstrap 폼**: 검색, 모달, 탭 레이아웃 템플릿 제공
- **XSS 방어**: Lucy XSS 필터 자동 적용
- **접근성**: ARIA 속성 자동 추가

### What This Skill Does NOT Do
- Java 백엔드 로직 작성
- 데이터베이스 쿼리 작성
- Maven 빌드 설정
- SCSS 색상 작성 ([`kiips-scss`](../kiips-scss/SKILL.md) 참조) — **컴포넌트 색상은 반드시 `var(--*)` / `$grey-*` / `$primary-*` 시스템 변수 기반. hex 하드코딩 금지**

## When to Use

이 Skill은 다음 상황에서 자동 활성화됩니다:

### User Prompt Keywords
```
"UI 컴포넌트 생성", "JSP 페이지 만들기", "그리드 추가", "차트 추가",
"검색 폼", "모달 팝업", "탭 레이아웃", "펀드 목록 화면", "투자 대시보드",
"팝업", "popup", "인쇄", "print", "모달", "modal"
```

### File Patterns
```
새 파일 생성: **/*.jsp, **/webapp/**/*.html
수정: **/*.jsp
팝업: **/POPUP*.jsp, **/popup*.jsp, **/*_print*.jsp
```

### Intent Patterns
```regex
/생성|만들|추가|개발.*?(페이지|화면|컴포넌트|그리드|차트|폼|모달|탭|팝업)/
/UI.*?(만들|생성|추가|개발)/
/팝업.*만들|팝업.*생성|popup.*create|인쇄.*페이지|print.*popup/
```

## Quick Reference

### 0. Table Default: RealGrid + 헬퍼 매트릭스 (MANDATORY)

**원칙**: KiiPS의 모든 데이터 테이블은 **RealGrid 2.6.3** + `common_grid.js`의 공통 헬퍼를 사용합니다. 순수 HTML `<table>`은 금지. **개별 JSP에서 `setDataSource/setFields/setColumns`를 직접 호출하는 것도 금지** — 반드시 아래 헬퍼 중 하나를 선택.

**헬퍼 선택 매트릭스** (`common_grid.js` 참조):

| 위치 / 용도 | 헬퍼 | 특성 |
|------------|------|------|
| **페이지 본문 메인 조회** | `createMainGrid` | 그룹 패널, Excel 풀세팅, 헤더 합계, rowHeight 36, lookupDisplay, commitByCell |
| **모달/팝업 편집** (행추가/삭제 있음) | `createSimpleEditGrid` | editable, insertable, 체크바, 높이 210px 기본 |
| **모달/팝업 읽기 전용** | `createSimpleGrid` | editable:false, rows 선택 스타일, 체크바 |
| **메인 내 서브 편집** (상세/등록) | `createEditGrid` | 컨텍스트 메뉴, Paste 옵션, margin-bottom 20px |
| **트리 구조** | `createTreeGrid` | TreeProvider/TreeView |

**선택 로직**:
```
if (메인 페이지 조회 리스트) → createMainGrid
else if (트리 구조)         → createTreeGrid
else if (모달/팝업 내부) {
    if (행추가/삭제/텍스트 편집 필요)  → createSimpleEditGrid
    else if (체크박스 토글만 필요)      → createSimpleGrid + onCellClicked 수동 토글 ★
    else                                → createSimpleGrid
}
else if (메인 내 서브 편집) → createEditGrid
```

**★ 체크박스 토글만 필요한 모달 패턴** (설정/개인화 모달):
`createSimpleEditGrid`를 쓰고 insertable/appendable/deletable/commitByCell을 다 끄면 코드가 비대해지고, 텍스트 에디터 충돌(common_grid.js:1326의 `showEditor` 자동 바인딩)로 체크박스 클릭 시 Y/N 텍스트 입력창이 뜨는 회귀가 발생합니다. 대신 `createSimpleGrid`(editable:false 기본)로 텍스트 에디터를 원천 차단하고, USE_YN 컬럼만 `onCellClicked`에서 수동 토글:
```javascript
createSimpleGrid("TB_SETTING", dp, gv, [
    { fieldName:"USE_YN", width:120, editable:false,
      renderer:{type:"check", useImages:true, trueValues:"Y", falseValues:"N"} }, ...
]);
gv.setCheckBar({visible:false}); gv.setFooters({visible:false}); gv.setRowIndicator({visible:false});
gv.editOptions.movable = true;

gv.onCellClicked = function(grid, clickData) {
    if (clickData.cellType !== "data") return;
    var col = grid.getColumns()[clickData.column];
    if (!col || col.fieldName !== "USE_YN") return;
    var cur = dp.getValue(clickData.dataRow, "USE_YN");
    var next = (cur === "Y") ? "N" : "Y";
    // 제한 있으면 여기서 사전 검사 후 return
    dp.setValue(clickData.dataRow, "USE_YN", next);
};
```
참조: AC1028.jsp `fnInitSettingGrid`.

**호출 패턴** (KiiPS 관용구, AC0201_POP.jsp:329-335 기준):
```javascript
var dp = new RealGrid.LocalDataProvider(true);
var gv = new RealGrid.GridView("TB_SETTING");         // div id
createSimpleEditGrid("TB_SETTING", dp, gv, columns);  // container는 ID 문자열(# 없음)

// 호출 후 필요한 부분만 오버라이드
gv.setCheckBar({ visible: false });
gv.setFooters({ visible: false });
gv.editOptions.movable = true;
```

**적용 범위**:
- 조회/편집/서브 그리드 전부 포함
- **모달 내부 설정/옵션 목록** — 10행 이하여도 RealGrid + 헬퍼 사용
- 팝업 내 데이터 목록

**예외 (HTML `<table>` 허용)**:
- 인쇄 전용 레이아웃 (`POPUP_*_print.jsp`)
- 순수 정적 정보 카드 (데이터 변경 없는 안내/레이블)

**이유**:
1. 다크테마 / 반응형 / 접근성 스타일이 RealGrid + 헬퍼에 일관 적용
2. Excel 익스포트 border, 컬럼 너비 자동조절(`fitLayoutWidth`), 컨텍스트 메뉴 등 공통 기능 자동 상속
3. `text-center` 사용 금지, 정렬/스타일 API 표준화 (`styleName: "center-column"` 등)

**RealGrid 공통 주의사항**:
- **모달 내 초기화**: `display:none` 상태에서 치수 0 → `shown.bs.modal` 이벤트에서 `gridView.resetSize()` 호출 필수
- **행 순서 변경(검증 패턴)**: `gridView.editOptions.movable = true` + `dataProvider.onRowMoved = function(provider, row, newRow) { ... }` 콜백에서 순서 필드(ORD) 재계산. ⚠️ `displayOptions.rowMovable`만 설정하면 드래그가 **작동하지 않음**. `gridView.onRowsMoved`(복수)는 존재하지 않는 API — 반드시 `dataProvider.onRowMoved`(단수). 참조: SY0205.jsp:157-166, AC0201_POP.jsp:330-335
- **Y/N 체크박스 토글**: `renderer: {type:"check", trueValues:"Y", falseValues:"N"}` + `editable: true` (AC1028.jsp `PRSNL_USE_YN` 패턴 참조)
- **`clickData` 스키마 (KiiPS 관용구)**: `onCellClicked(grid, clickData)` 콜백의 `clickData.column`은 **필드명 문자열**입니다 (배열 인덱스 아님). 예: `if (clickData.column === "USE_YN") { ... }` (SY0210:366, AC0812:329, SY0801:163 등 확인). `clickData.itemIndex`가 행 인덱스. 데이터 외 영역 가드는 `clickData.cellType === "header" / "summary" / "groupPanel" / "groupFooter"`로 체크 (SY0215:140-144). ⚠️ `renderer:{type:"check"}` 셀의 cellType은 `"data"`가 아니라 **`"check"`로 분류**될 수 있으므로 `if (cellType !== "data") return;`로 과하게 거르면 체크 셀 클릭이 통과하지 못합니다 — cellType 포지티브 필터 금지, 네거티브 제외만 사용.
- **`createSimpleEditGrid` + 체크박스 컬럼의 함정**: 이 헬퍼는 내부에서 `onCellClicked`에 `grid.showEditor(true)`를 자동 바인딩(common_grid.js:1326)합니다. 체크박스 컬럼 클릭 시에도 **텍스트 에디터가 열리는 회귀** 발생. 대처 — 헬퍼 호출 후 ① `gv.onCellClicked = function(){};`로 no-op 덮어쓰기 + ② `gv.onShowEditor = function(grid, index) { if (grid.getColumns()[index.column].fieldName === "USE_YN") return false; };`로 키보드 경로까지 차단. 체크 토글은 렌더러 내부 이벤트라 `onCellClicked` no-op과 무관하게 정상 동작. 참조: AC1028.jsp `fnInitSettingGrid`

**모달 Close 버튼은 KiiPS 커스텀 테마 패턴 (Bootstrap 아님)**:
```html
<!-- ✅ KiiPS 표준 (SY0217.jsp:121, SY0210.jsp:52 동일 패턴) -->
<div class="modal-header">
    <h2 class="card-title py-2" id="xxxTitle">제목<span class="card-actions mt-2 mr-2"><a href="#" class="card-action card-action-dismiss modal-dismiss" data-dismiss="modal"></a></span></h2>
</div>

<!-- ❌ 금지: Bootstrap 5 btn-close (KiiPS는 BS4 기반) -->
<button class="btn-close" data-dismiss="modal"></button>

<!-- ❌ 금지: Bootstrap 4 button.close (KiiPS 테마에서 검정 네모로 깨짐) -->
<button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
```
핵심: `<a>` 태그 + 3개 클래스 조합(`card-action card-action-dismiss modal-dismiss`) + `card-actions` 래퍼는 **`h2.card-title` 내부 인라인**. 아이콘은 CSS 배경으로 그려지므로 `<span>&times;</span>` 같은 텍스트 불필요.

**설정/목록 성격 모달 프레임 — list_TODO(COMM_TODO.jsp) 패턴**:
데이터가 많거나 넓은 작업 공간이 필요한 모달(설정 목록, 다중 선택, 관리 패널)은 단순 `modal-header/body/footer`가 아닌 **카드 섹션 래퍼** 구조를 사용합니다. KiiPS 테마의 card 전역 스타일이 모달에 상속되어 일관된 외관 확보.
```html
<div class="modal fade" id="xxx" aria-hidden="true" style="display:none; z-index:1060;"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <section class="card">
                <header class="card-header">
                    <h2 class="card-title">제목
                        <span class="card-actions">
                            <a href="#" class="card-action card-action-dismiss modal-dismiss" data-dismiss="modal"></a>
                        </span>
                    </h2>
                </header>
                <div class="card-body px-5 py-4">
                    <!-- 본문: RealGrid, 탭, 리스트 등 -->
                    <div id="TB_XXX" style="width:100%; height:420px;"></div>

                    <!-- 하단 버튼은 card-body 내부의 bottom-btn -->
                    <div class="bottom-btn">
                        <button class="btn btn-primary font-weight-semibold btn-py-2 px-4" onclick="fnSave()">저장</button>
                        <button class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss" data-dismiss="modal">닫기</button>
                    </div>
                </div>
            </section>
        </div>
    </div>
</div>
```
참조: `COMM_TODO.jsp` (원본 list_TODO), `AC1028.jsp` (대시보드 설정 적용 예). 단순 등록/수정 모달은 기존 `modal-header`/`modal-body` 평면 구조 유지, 설정/목록 UI만 이 카드 래퍼 사용.

**금지 패턴**:
```html
<!-- ❌ 금지: HTML table로 데이터 목록 -->
<table class="table table-hover">
    <thead><tr><th>항목</th></tr></thead>
    <tbody id="myList"></tbody>
</table>
```
```javascript
// ❌ 금지: 헬퍼 무시하고 직접 초기화
var dp = new RealGrid.LocalDataProvider(true);
var gv = new RealGrid.GridView("TB_SETTING");
gv.setDataSource(dp);
dp.setFields([...]);
gv.setColumns([...]);  // createMainGrid/SimpleEditGrid 등을 써야 함
```

**표준 패턴 (모달 설정 그리드 전체 예시)**:
```html
<div id="TB_SETTING" style="height: 320px;"></div>
```
```javascript
var dp = new RealGrid.LocalDataProvider(true);
var gv = new RealGrid.GridView("TB_SETTING");

createSimpleEditGrid("TB_SETTING", dp, gv, [
    { fieldName: "KEY",    visible: false },
    { fieldName: "CAT_NM", header:{text:"항목"},   editable:false, styleName:"left-column" },
    { fieldName: "USE_YN", header:{text:"사용여부"}, width:120, editable:true,
      renderer:{type:"check", useImages:true, trueValues:"Y", falseValues:"N"} },
    { fieldName: "ORD",    header:{text:"순서"},   width:80, editable:false, styleName:"center-column", dataType:"number" }
]);

// 설정 모달 오버라이드: 체크바/푸터 숨김 + 행추가/삭제 차단 + 이동만 허용
gv.setCheckBar({ visible: false });
gv.setFooters({ visible: false });
gv.editOptions.insertable = false;
gv.editOptions.appendable  = false;
gv.editOptions.movable     = true;
gv.editOptions.deletable   = false;
$("#TB_SETTING").css("height", "320px");  // 헬퍼 기본 210px 덮어쓰기

dp.onRowMoved = function(provider, row, newRow) {
    for (var i = 0; i < provider.getRowCount(); i++) provider.setValue(i, "ORD", i + 1);
    gv.setCurrent({ dataRow: newRow });
};

$("#myModal").on("shown.bs.modal", function() { gv.resetSize(); });
```

### 1. RealGrid 기본 그리드 (Read-Only)

**User Request**: "펀드 목록 조회 화면 만들어줘"

**참조**: RealGrid 상세 설정은 [kiips-realgrid-guide](../kiips-realgrid-guide/SKILL.md) 참조

**핵심 패턴**: `createMainGrid` + `logosAjax.requestTokenGrid`

```javascript
// 컬럼 정의
let columns = [
    {fieldName: "FUND_CD", width: "120", header: {text: "펀드코드"},
     editable: false, styleName: "center-column"},
    {fieldName: "FUND_NM", width: "250", header: {text: "펀드명"},
     editable: false, styleName: "left-column"},
    {fieldName: "NAV_AMT", width: "120", header: {text: "NAV (원)"},
     editable: false, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column"}
];

// KiiPS 공통 초기화
createMainGrid("TB_FUND_LIST", dataProvider, gridView, columns);

// 데이터 로드
logosAjax.requestTokenGrid(gridView, gToken,
    "${KiiPS_FD}/FDAPI/FUND/LIST", "post", searchCond,
    function(data) {
        dataProvider.setRows(data.body.list);
        gridView.refresh();
    });
```

### 2. RealGrid 편집 그리드 (Editable)

**User Request**: "투자 금액 입력 화면 만들어줘. 그리드에서 직접 수정 가능하게"

**참조**: [kiips-realgrid-guide](../kiips-realgrid-guide/SKILL.md) 참조

```javascript
// 편집 가능 컬럼 설정 (KiiPS 패턴)
let columns = [
    {fieldName: "INV_AMT", width: "150", header: {text: "투자금액 (원)"},
     editable: true, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column editable-column",
     editor: {
         type: "number",
         editFormat: "#,##0",
         min: 0,
         max: 9999999999
     }},
    {fieldName: "INV_TYPE", width: "120", header: {text: "투자유형"},
     editable: true, styleName: "center-column",
     editor: {
         type: "dropdown",
         values: ["EQUITY", "BOND", "MIXED"],
         labels: ["주식형", "채권형", "혼합형"]
     }}
];

createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);

// 편집 옵션
gridView.editOptions.editable = true;
gridView.editOptions.commitByCell = true;
```

### 3. ApexCharts Quick Summary

| 차트 유형 | 용도 | chart.type |
|-----------|------|------------|
| Line | 추이 분석 (월별 투자) | `'line'` |
| Donut | 비율 분석 (펀드 분류) | `'donut'` |
| Bar | 비교 분석 (Top 10) | `'bar'` |

상세 옵션과 템플릿은 [reference.md](reference.md) 참조.

### 4. Popup Quick Summary

| 유형 | 용도 | 기준 파일 |
|------|------|-----------|
| **일반 팝업** | 데이터 입력/조회 | `COMM_POPUP_*.jsp` |
| **인쇄용 팝업** | 문서 인쇄 | `POPUP_AC0522_print.jsp` |
| **그리드 팝업** | RealGrid 데이터 표시 | `COMM_POPUP_OPINION.jsp` |
| **Bootstrap Modal** | 페이지 내 오버레이 | data-backdrop="static" |

#### ⚠️ 팝업 JSP 만들 때 반드시 수행 (3 단계)

1. `KiiPS-UI/.../jsp/kiips/COM/COMM_POPUP_{POP_ID}.jsp` 파일 생성 (저장/조회 쌍이면 두 개)
2. **`COMMONUIController.java` 의 `COM_POPUP()` 메서드에 `POP_ID` → `rtnJSP` 분기 추가** — 누락 시 팝업이 404 또는 기본 화면으로 떨어짐
3. 부모 페이지에서 `COMM_POPUP_NEW('${KiiPS_GATE}', 'POP_ID', param, w, h)` 호출

**체크리스트 쌍 네이밍 비대칭**: URL=`CHECKLIST{ID}` ↔ 파일=`COMM_POPUP_CHECKLIST_{ID}.jsp` (언더스코어). 컨트롤러 `rtnJSP` 문자열이 이 변환을 흡수하므로 반드시 등록해야 함.

팝업 생성 시 반드시 참조: [docs/POPUP_GUIDE.md](../../../docs/POPUP_GUIDE.md) — `🧭 POP_ID 라우팅 등록` 섹션

### 5. 폼 입력 컴포넌트 표준 패턴 (CRITICAL)

KiiPS 프로젝트 전용 패턴입니다. Bootstrap 기본 클래스를 사용하면 스타일이 깨집니다.

#### 체크박스

```html
<!-- ✅ KiiPS 표준 -->
<div class="form-check-inline">
    <div class="checkbox-custom checkbox-default mb-2">
        <input type="checkbox" data-id="FIELD_ID" data-gbn="checkbox" id="FIELD_ID">
        <label for="FIELD_ID">&nbsp;라벨</label>
    </div>
</div>

<!-- ❌ 금지: Bootstrap custom-control -->
<div class="custom-control custom-checkbox">
    <input type="checkbox" class="custom-control-input">
</div>

<!-- ❌ 금지: form-check-input 클래스 -->
<input type="checkbox" class="form-check-input">
```

**필수 클래스**: `checkbox-custom checkbox-default`
**금지 클래스**: `custom-control`, `custom-checkbox`, `form-check-input`

#### 날짜 입력

```html
<!-- ✅ KiiPS 표준 (flatpickr) -->
<input type="text" class="form-control flatpickr-basic"
       data-id="FIELD_ID" data-gbn="date" name="FIELD_ID"
       placeholder="YYYY-MM-DD">

<!-- ❌ 금지: datepicker -->
<input type="text" class="datepicker">
```

**필수**: `flatpickr-basic` + `data-gbn="date"` + `placeholder="YYYY-MM-DD"`

#### 토글 스위치

```html
<div class="media-body text-left icon-state switch-outline">
    <label class="switch">
        <input type="checkbox" data-id="FIELD_ID" data-gbn="checkbox"
               name="FIELD_ID" id="FIELD_ID">
        <span class="switch-state"></span>
    </label>
</div>
```

## Component Templates

본 스킬은 인라인 코드 예제(위 Quick Reference 섹션)와 [reference.md](reference.md) / [examples.md](examples.md)를 통해 템플릿을 제공합니다. 별도 템플릿 파일 없이 SKILL.md 내 스니펫을 복사하여 사용하세요.

- **RealGrid 기본/편집 그리드**: 위 "Quick Reference" 1~2번 참조
- **ApexCharts 템플릿**: [reference.md](reference.md) 참조
- **Bootstrap 폼/모달/탭**: 연관 스킬 `kiips-regist-modal-guide`, `kiips-search-filter-guide` 참조

## Security & Accessibility

### XSS Prevention (Automatic)

모든 템플릿은 Lucy XSS 필터를 자동 적용합니다:

```jsp
<%@ taglib prefix="lucy" uri="http://www.navercorp.com/lucy/xss" %>

<!-- 사용자 입력 출력 시 -->
<td><lucy:out value="${fund.fundName}"/></td>

<!-- JavaScript 변수 할당 시 -->
<script>
const fundName = '<lucy:js value="${fund.fundName}"/>';
</script>
```

### Accessibility (WCAG 2.1 AA)

- **ARIA 레이블**: 모든 폼 요소에 `aria-label` 자동 추가
- **키보드 네비게이션**: Tab, Enter, Space 지원
- **스크린 리더**: 의미있는 레이블과 설명 제공
- **색상 대비**: 4.5:1 이상 보장

## Common Pitfalls

### Don't
```javascript
// XSS 취약점
document.innerHTML = userInput;
// 하드코딩된 URL
fetch('http://localhost:8000/api/funds');
// 접근성 누락
<button onclick="save()">저장</button>
// 다크모드 미지원 — 인라인 색상
el.style.color = "#333";
el.style.backgroundColor = "#f8f9fa";
```

### Do
```javascript
// XSS 방어
document.textContent = userInput;
// 상대 URL
fetch('/api/funds');
// 접근성 준수
<button onclick="save()" aria-label="펀드 정보 저장">
    <i class="bi bi-save" aria-hidden="true"></i> 저장
</button>
// 다크모드 지원 — CSS 클래스 또는 테마 감지
el.classList.add("summary-bar");
// 또는 불가피 시:
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
el.style.color = isDark ? "#ddd" : "#333";
```

## Dark Mode Rules (CRITICAL)

새 컴포넌트 생성 시 반드시 준수:

1. **인라인 style에 `color`, `background-color`, `border-color` 사용 금지** → CSS 클래스 사용
2. **새 CSS 클래스는 라이트+다크 쌍으로** `custom.scss`에 정의
3. **JS 커스텀 렌더러**에서 색상 하드코딩 시 `isDark` 분기 필수
4. **Bootstrap 유틸**: `text-dark` 대신 `text-body` 사용 (다크 지원)
5. 상세: [kiips-scss](../kiips-scss/SKILL.md) 참조

## Related Skills

| Skill | Usage |
|-------|-------|
| **kiips-realgrid-guide** | RealGrid 2.6.3 종합 가이드 - 필수 참조 |
| **kiips-quality** | 생성된 컴포넌트의 반응형 검증 |
| **kiips-quality** | 접근성 자동 검증 및 수정 |
| **kiips-scss** | SCSS 스타일 커스터마이징 |

## Naming Conventions

- **JSP**: `{domain}-{action}.jsp` (예: `fund-list.jsp`)
- **JS**: `{domain}-{action}.js` (JSP와 동일)
- **SCSS**: `{domain}-{action}.scss`
- **API**: `/api/{domain}/{action}`

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
