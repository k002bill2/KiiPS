---
name: kiips-realgrid-guide
description: "RealGrid 2.6.3 종합 가이드 - 그리드 생성, 설정, 에디터, Excel, 성능 최적화. Use when: RealGrid, 리얼그리드, 그리드, 테이블, 그리드 생성, 그리드 만들어"
---

# KiiPS RealGrid Guide

RealGrid 2.6.3 종합 가이드입니다. 그리드 생성부터 고급 설정, Excel 기능, 성능 최적화까지 모든 내용을 다룹니다.

## Purpose

### What This Skill Does
- **그리드 생성**: KiiPS 표준 패턴 (createMainGrid, logosAjax)
- **멀티 레벨 헤더**: columnLayout, header.heights
- **커스텀 렌더러**: common_grid.js 24개 렌더러
- **셀 에디터**: text, number, date, dropdown, multiline
- **Excel 기능**: Import, Export, 템플릿
- **필터 & 정렬**: 다중 컬럼 필터, 커스텀 정렬
- **성능 최적화**: 가상 스크롤, 지연 로딩

### What This Skill Does NOT Do
- 백엔드 API 개발
- 다른 그리드 라이브러리 (AG-Grid, DataTables 등)

## When to Use

### User Prompt Keywords
```
"RealGrid", "그리드", "테이블", "리얼그리드",
"멀티 레벨 헤더", "컬럼 그룹", "columnLayout",
"셀 편집", "에디터", "엑셀 내보내기", "엑셀 가져오기",
"그리드 필터", "그리드 정렬", "그룹핑", "집계"
```

### File Patterns
```
새 파일: **/*grid*.js, **/*Grid*.js, **/*.jsp
수정: **/*grid*.js
내용: "RealGridJS", "GridView", "DataProvider", "createMainGrid"
```

---

## 핵심 패턴: 그리드 생성

### 기본 초기화

```javascript
// JSP Container
<div id="TB_GRID_ID"></div>

// JavaScript
let dataProvider = new RealGrid.LocalDataProvider(true);
let gridView = new RealGrid.GridView("TB_GRID_ID");

// KiiPS 공통 초기화 (핵심!)
createMainGrid("TB_GRID_ID", dataProvider, gridView, columns);
```

### 컬럼 정의

```javascript
let columns = [
    // 텍스트 (좌측 정렬)
    {fieldName: "CODE", width: "100", header: {text: "코드"},
     editable: false, styleName: "left-column"},

    // 숫자 (우측 정렬, 포맷)
    {fieldName: "AMOUNT", width: "150", header: {text: "금액"},
     editable: false, dataType: "number", numberFormat: "#,##0",
     styleName: "right-column",
     headerSummary: {expression: "sum", numberFormat: "#,##0"}},

    // 패턴 포맷 (등록번호)
    {fieldName: "REG_NO", width: "130", header: {text: "등록번호"},
     editable: false,
     textFormat: "([0-9]{3})([0-9]{2})([0-9]{5});$1-$2-$3"},

    // 날짜 (렌더러)
    {fieldName: "DATE", width: "120", header: {text: "날짜"},
     editable: false,
     renderer: {
         type: "html",
         callback: function(grid, cell) {
             return StringUtil.toDate(cell.value, "-");
         }
     }}
];
```

### 데이터 로딩 (KiiPS 패턴)

```javascript
function getData(searchCond) {
    logosAjax.requestTokenGrid(
        gridView,
        gToken,
        "${KiiPS_FD}/FDAPI/FD0101/LIST",
        "post",
        searchCond,
        function(data) {
            dataProvider.setRows(data.body.list);
            gridView.refresh();
        }
    );
}
```

### 멀티 레벨 헤더 (Column Groups)

```javascript
// 기본 2단 헤더
gridView.setColumnLayout([
    "RANK",
    "COMPANY_NM",
    {
        name: "GROUP1",
        header: {text: "그룹 헤더 1"},
        columns: ["COL1", "COL2", "COL3"]
    },
    {
        name: "GROUP2",
        header: {text: "그룹 헤더 2"},
        columns: ["COL4", "COL5", "COL6"]
    },
    "TOTAL"
]);

gridView.header.height = 60;  // 2단 헤더용
```

| 옵션 | 사용법 | 설명 |
|------|--------|------|
| `header.height` | `50` | 2단 헤더 (단일 높이) |
| `header.heights` | `[30, 30]` | 2단 헤더 (행별 높이) |
| `header.heights` | `[30, 30, 30]` | 3단 헤더 |

---

## Quick Reference

### 커스텀 렌더러 (common_grid.js)

```javascript
// 렌더러 등록 + 컬럼 적용
fn_grid_renderer(gridView, 'renderer_imgbtn');

{fieldName: "SEARCH", width: "50", header: {text: "조회"},
 renderer: "renderer_imgbtn"}
```

**자주 사용하는 렌더러:**

| 렌더러명 | 용도 |
|----------|------|
| `renderer_imgbtn` | 검색 버튼 (일반 팝업) |
| `renderer_account` | 계정과목 검색 |
| `renderer_lpapprv` | LP 승인 상태 |
| `renderer_save` | 저장 버튼 |
| `renderer_del` | 삭제 버튼 |
| `renderer_enterprise` | 기업 검색 |
| `renderer_searchbtn` | 검색 버튼 |

> 전체 24개 렌더러 목록은 [reference.md](reference.md) 참조

### 기본 이벤트 바인딩

```javascript
// 행 선택 변경
gridView.onCurrentRowChanged = function(grid, oldRow, newRow) {
    if (newRow >= 0) {
        const rowData = dataProvider.getJsonRow(newRow);
    }
};

// 셀 더블클릭
gridView.onCellDblClicked = function(grid, clickData) {
    const rowData = dataProvider.getJsonRow(clickData.dataRow);
    openDetailModal(rowData);
};
```

### CSS 클래스

| Class | 설명 | 사용 |
|-------|------|------|
| `left-column` | 좌측 정렬 | 텍스트 |
| `center-column` | 중앙 정렬 | 코드, 상태 |
| `right-column` | 우측 정렬 | 숫자 |
| `editable-column` | 편집 가능 | 입력 필드 |
| `unicorn-blue-text` | 파란색 | 강조 숫자 |
| `unicorn-bold-text` | 굵은 글씨 | 합계 |

---

## 체크박스 토글 (필수 규약 — 반복 재발 방지)

> **문제**: RealGrid 2.6.3 의 `renderer:{type:"check"}` 은 **표시 전용**이다. 셀을 `editable:true` 로 하면 텍스트 에디터가 열려 "Y"/"N" 원시값이 노출되고, `editable:false` 로 하면 클릭해도 아무 반응이 없다. `onCellClicked` 로 우회 토글해도 렌더러 빌드·이벤트 전파 조건에 따라 클릭이 누락되는 사례가 반복 보고되었다.
>
> **원인**: `type:"check"` 렌더러는 시각 이미지만 그리고 네이티브 클릭 이벤트를 래핑하지 않음. `onCellClicked` 는 cellType/fieldName 추출이 빌드에 따라 실패하기도 함.

### 표준 해법: HTML 체크박스 렌더러 + 전역 토글 함수

AC1028 대시보드 설정 모달, IL0120 투자계약서 점검 팝업(COMM_POPUP_CHECKIACHK.jsp)에서 검증된 패턴.

```javascript
// 1) 컬럼 정의 — type:"html" 렌더러로 네이티브 input 주입
{ fieldName: "STD_YN", width: "70", header: { text: "기준" },
  editable: false, sortable: false,
  renderer: {
    type: "html",
    callback: function (grid, cell) {
      var checked = cell.value === "Y" ? "checked" : "";
      return "<div class='checkbox-custom checkbox-default in-bl m-0'>"
           +   "<input type='checkbox' id='MY_STD_" + cell.dataRow + "' " + checked
           +          " onclick='fnMyToggle(" + cell.dataRow + ",\"STD_YN\")'/>"
           +   "<label for='MY_STD_" + cell.dataRow + "'>&nbsp;</label>"
           + "</div>";
    }
  }
}

// 2) 전역 토글 함수 — dataProvider 값 직접 갱신
window.fnMyToggle = function (dataRow, field) {
  var cur  = dataProvider.getValue(dataRow, field);
  var next = (cur === "Y") ? "N" : "Y";
  dataProvider.setValue(dataRow, field, next);
};
```

### 필수 규약

| 항목 | 값 | 이유 |
|------|----|------|
| `editable` | **`false`** | 텍스트 에디터 폴백 차단 |
| `sortable` | **`false`** | 클릭 = 정렬 방지 |
| `renderer.type` | **`"html"`** | `"check"` 금지 |
| `onclick` 파라미터 | **`cell.dataRow`** (itemIndex 아님) | 정렬·페이징 상황에서도 provider 기준 행 매핑 |
| 값 갱신 API | **`dataProvider.setValue`** | `grid.setValue` 대신 provider 직접 — refresh 타이밍 불안정 회피 |
| `<label for>` | **id 와 매칭** | KiiPS `checkbox-custom` 스타일 동작 조건 |
| 저장 시 변경 추출 | `dataProvider.getJsonRows()` 순회 또는 `getAllStateRows()` | |

### 절대 금지

```javascript
// ❌ 금지 1 — type:"check" 렌더러 + editable:true (텍스트 에디터 폴백)
{ fieldName: "STD_YN", editable: true,
  renderer: { type: "check", trueValues: "Y", falseValues: "N" } }

// ❌ 금지 2 — onCellClicked 로 토글 시도 (빌드별 이벤트 누락)
gridView.onCellClicked = function (grid, clickData) {
  if (clickData.fieldName === "STD_YN") { /* 불안정 */ }
};

// ❌ 금지 3 — grid.setValue 4번째 인자 true (silent fail 사례 있음)
grid.setValue(idx, field, val, true);
```

### 참조 구현

- 표준 구현: `KiiPS-UI/.../COM/COMM_POPUP_CHECKIACHK.jsp` (HTML 체크박스 렌더러 + `fnIachkToggle`)
- 비그리드 대체: `KiiPS-UI/.../AC/AC1028.jsp` (대시보드 설정 모달 — RealGrid 대신 HTML `<table>` + jQuery sortable)

---

## 헤더 체크박스 (열 단위 마스터 토글)

> **용도**: 컬럼 헤더 자체에 체크박스를 두어 (1) 마스터 전체 행 일괄 셋/리셋, 또는 (2) 컬럼 단위 선택 표시.
>
> **표준**: `header.template` 속성에 KiiPS `checkbox-custom` HTML 직접 주입 + 전역 토글 함수.

### 패턴 1 — 마스터 토글 (한 컬럼의 모든 행 값을 Y/N 일괄 변경)

검증된 참조: `COMM_POPUP_CHECKDUTY.jsp` (의무사항기재확인서)

```javascript
{ fieldName: "CRPD_YN", width: "40", editable: false, sortable: false, type: "data",
  header: {
    text: "확인",
    template: "확인"
            + "<div class='checkbox-custom checkbox-default in-bl ml-1'>"
            +   "<input type='checkbox' data-id='' data-gbn='checkbox' onclick='setCheck()' id='chk'/>"
            +   "<label for='chk'></label>"
            + "</div>"
  },
  renderer: { type: "check", trueValues: "Y", falseValues: "N", useImages: true }
}

// 마스터 토글 — 헤더 체크박스 클릭 시 전체 행에 Y/N 일괄 적용
function setCheck(){
    var checked = document.getElementById('chk').checked;
    var v = checked ? 'Y' : 'N';
    for (var i = 0; i < gridView.getItemCount(); i++) {
        gridView.setValue(i, 'CRPD_YN', v);
        gridView.commit(true);
    }
}
```

### 패턴 2 — 헤더 + 셀 통합 체크박스 (컬럼 선택 + 개별 셀 토글)

검증된 참조: `IL/IL0920.jsp` 첨부파일 다운로드 모달

같은 컬럼에서 헤더와 셀 모두 체크박스를 쓸 때는 동일한 `checkbox-custom checkbox-default` 클래스로 시각/다크모드 일관성 확보. 셀은 데이터 존재 시(`Y`)만 렌더, 미존재(`N`)는 공란.

```javascript
// 헤더 템플릿 (컬럼 선택용)
function attachDocHeaderTemplate(fieldName, text){
    return text
        + "<div class='checkbox-custom checkbox-default in-bl ml-1'>"
        + "<input type='checkbox' data-id='' data-gbn='checkbox'"
        +    " onclick=\"toggleAttachDocCol('" + fieldName + "')\""
        +    " id='chk_" + fieldName + "'/>"
        + "<label for='chk_" + fieldName + "'></label>"
        + "</div>";
}

// 셀 렌더러 (개별 셀 토글용) — type:"html" 사용, type:"icon"/"check" 금지
function attachDocCellRenderer(grid, cell){
    if (cell.value !== "Y") return "";  // 미존재 = 공란
    var id = "chk_" + cell.column.fieldName + "_" + cell.dataRow;
    return "<div class='checkbox-custom checkbox-default in-bl m-0'>"
        +    "<input type='checkbox' data-id='' data-gbn='checkbox' checked"
        +           " id='" + id + "'"
        +           " onclick=\"toggleAttachDocCell(" + cell.dataRow + ",'" + cell.column.fieldName + "')\"/>"
        +    "<label for='" + id + "'></label>"
        + "</div>";
}

// 컬럼 정의 — 헤더 template + 셀 html callback 양쪽 다 KiiPS 체크박스
{ fieldName: "DOC1_YN", width: "120", editable: false, sortable: false,
  header: { text: "주주명부", template: attachDocHeaderTemplate("DOC1_YN", "주주명부") },
  renderer: { type: "html", callback: attachDocCellRenderer }
}

// 선택 상태 추적 + 토글
let selectedDocCols = new Set();
function toggleAttachDocCol(fieldName){
    let cb = document.getElementById('chk_' + fieldName);
    if (cb && cb.checked) selectedDocCols.add(fieldName);
    else selectedDocCols.delete(fieldName);
}
window.toggleAttachDocCell = function(dataRow, fieldName){
    var cur = dataProvider.getValue(dataRow, fieldName);
    dataProvider.setValue(dataRow, fieldName, cur === "Y" ? "N" : "Y");
};
function resetAttachColSelection(){
    selectedDocCols.clear();
    ['DOC1_YN','DOC2_YN','DOC3_YN'].forEach(function(f){
        var cb = document.getElementById('chk_' + f);
        if (cb) cb.checked = false;
    });
}
```

ID 네이밍 규칙:
- 헤더: `chk_<field>` (컬럼당 1개)
- 셀: `chk_<field>_<dataRow>` (행마다 별도)
- 충돌 방지: `dataRow` 접미사로 헤더와 자연 분리

Spacing 규칙:
- 헤더: `ml-1` (텍스트 옆 좌측 마진)
- 셀: `m-0` (셀 중앙 정렬)

### 헤더 체크박스 필수 규약

| 항목 | 값 | 이유 |
|------|----|------|
| `header.template` | **HTML 문자열** | `text` 단독으론 체크박스 표현 불가. template 우선 적용 |
| 체크박스 클래스 | **`checkbox-custom checkbox-default in-bl ml-1`** | KiiPS 표준 + 인라인 + 텍스트와 간격 |
| `<label for>` | **id 와 매칭** | KiiPS `checkbox-custom` 스타일 동작 조건 |
| `onclick` 핸들러 | **전역 함수** (window scope) | RealGrid 헤더 컨텍스트는 inline JS 평가 시 `this`/스코프 제한 |
| 모달 재오픈 시 초기화 | `resetXxxSelection()` 호출 | `cb.checked = false` 로 직접 리셋 (DOM 잔존 상태 회피) |
| 셀 렌더러 | **요구사항에 따라 분리** | 마스터 토글 = `type:"check"` / read-only 표시 = `type:"icon"` |
| `editable` | `false` | 데이터 자체는 읽기 전용, 헤더만 입력 |
| `sortable` | `false` | 헤더 클릭 정렬 방지 (체크박스 클릭과 충돌) |

### 절대 금지

```javascript
// ❌ 금지 1 — onColumnHeaderClicked + setColumnProperty 텍스트 토글 (시각적 불명확)
gridView.onColumnHeaderClicked = function(grid, column) {
    grid.setColumnProperty(column.fieldName, 'header', { text: '☑ ' + ... });
};

// ❌ 금지 2 — 헤더에 jQuery selector 로 직접 DOM 조작 (RealGrid 재렌더링 시 사라짐)
$('#myGrid .header').append('<input type="checkbox">');

// ❌ 금지 3 — Bootstrap `custom-control custom-checkbox` 패턴 (KiiPS 비표준)
template: "<div class='custom-control custom-checkbox'><input class='custom-control-input'>...</div>"
```

### 참조 구현

- 마스터 토글: `KiiPS-UI/.../COM/COMM_POPUP_CHECKDUTY.jsp:73-84` + `setCheck()` 함수
- 컬럼 선택 토글: `KiiPS-UI/.../IL/IL0920.jsp` (첨부파일 다운로드 모달)

---

## Best Practices

### Do

```javascript
// 일관된 필드/컬럼 이름
{ name: 'navAmount', fieldName: 'navAmount' }

// 타입 일치
{ fieldName: 'navAmount', dataType: 'number' }
{ name: 'navAmount', editor: { type: 'number' } }

// 올바른 이벤트 핸들링
gridView.onEditCommit = function(grid, index) {
    saveToServer(index);  // 외부 함수 호출
};
```

### Don't

```javascript
// 순환 참조
gridView.onEditCommit = function(grid, index) {
    grid.commit();  // 무한 루프!
};

// 필드/컬럼 불일치
{ name: 'amount', fieldName: 'navAmount' }  // 불일치

// 타입 불일치
{ fieldName: 'amount', dataType: 'number' }
{ name: 'amount', editor: { type: 'text' } }  // 불일치
```

---

## 체크리스트

- [ ] `createMainGrid()` 으로 초기화
- [ ] 필드 dataType과 에디터 type 일치
- [ ] 숫자 컬럼에 `numberFormat: "#,##0"` 설정
- [ ] 날짜 컬럼에 `StringUtil.toDate()` 렌더러 적용
- [ ] 멀티 레벨 헤더 시 `header.heights` 배열 설정
- [ ] 편집 가능 컬럼에 `styleName: "editable-column"` 적용
- [ ] **체크박스 토글 컬럼은 `type:"html"` 렌더러 + 전역 토글 함수 사용** (`type:"check"` + `onCellClicked` 금지 — 상세는 "체크박스 토글" 섹션)
- [ ] Excel Export 시 `fileName`에 날짜 포함
- [ ] 대량 데이터 시 가상 스크롤 + 고정 rowHeight 확인

## Success Metrics

- 그리드 초기화: < 500ms
- 1만 행 렌더링: < 1초
- Excel Export (1만 행): < 3초
- 셀 편집 응답 시간: < 100ms
- 메모리 사용량: < 50MB (1만 행 기준)

## Related Resources

| 리소스 | 경로 |
|--------|------|
| **공통 함수** | `KiiPS-UI/src/main/resources/static/js/common_grid.js` |
| **스타일** | `/vendor/realgrid.2.6.3/realgrid-style.scss` |
| **종합 가이드** | `docs/REALGRID_GUIDE.md` |
| **SCSS 가이드** | `docs/SCSS_GUIDE.md` |

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
