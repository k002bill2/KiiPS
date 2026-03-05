# KiiPS RealGrid 2.6.3 Guide (common_grid.js 기반)

> **Version**: 2.0
> **Last Updated**: 2026-01-13
> **Purpose**: KiiPS 프로젝트에서 RealGrid 사용을 위한 종합 가이드
> **기반 파일**: `KiiPS-UI/src/main/resources/static/js/common_grid.js`

---

## 📍 Quick Reference

### 핵심 파일 경로
```
/KiiPS-UI/src/main/resources/static/
├── js/
│   ├── common_grid.js            # ⭐ RealGrid 공통 함수 (필수)
│   └── common_grid.min.js        # 압축 버전
├── vendor/
│   └── realgrid-lic.js           # 라이선스 파일
└── css/
    └── sass/gui/_realgrid.scss   # 그리드 스타일
```

### JSP Include (필수)
```jsp
<!-- RealGrid 라이브러리 -->
<script src="/vendor/realgrid-lic.js"></script>
<script src="/vendor/realgrid.2.6.3.min.js"></script>

<!-- KiiPS 공통 그리드 함수 -->
<script src="/js/common_grid.js"></script>
```

---

## 1. 그리드 생성 함수

### 함수 선택 가이드

| 함수 | 용도 | 편집 | 체크박스 | 페이징 |
|------|------|:----:|:--------:|:------:|
| `createMainGrid` | 메인 조회 그리드 | ❌ | ✅ | ✅ |
| `createSimpleGrid` | 단순 조회 (팝업 등) | ❌ | ❌ | ❌ |
| `createEditGrid` | 편집 가능 + 체크박스 | ✅ | ✅ | ❌ |
| `createSimpleEditGrid` | 편집 가능 (체크박스 없음) | ✅ | ✅ | ❌ |
| `createTreeGrid` | 트리 구조 표시 | ❌ | ✅ | ❌ |

### 1.1 createMainGrid (메인 조회용)

```javascript
// 변수 선언
let dataProvider, gridView;

$(document).ready(function() {
    // 1. Provider 및 GridView 생성
    dataProvider = new RealGrid.LocalDataProvider();
    gridView = new RealGrid.GridView("realgrid");

    // 2. 컬럼 정의
    const columns = [
        { fieldName: "FD_NO", name: "FD_NO", width: 100,
          header: { text: "펀드번호" }, styleName: "center-column" },
        { fieldName: "FD_NM", name: "FD_NM", width: 200,
          header: { text: "펀드명" } },
        { fieldName: "AMT", name: "AMT", width: 120,
          header: { text: "금액" }, styleName: "right-column",
          numberFormat: "#,##0" }
    ];

    // 3. 그리드 생성
    createMainGrid("realgrid", dataProvider, gridView, columns);

    // 4. 페이징 설정 (선택)
    setPaging(gridView, 10, "#paging");
});
```

**기본 설정값:**
- `displayOptions.rowHeight`: -1 (자동), minRowHeight: 36
- `header.height`: 36, `footer.height`: 36
- `editOptions.editable`: false
- `displayOptions.fitStyle`: "even" (컬럼 너비 자동)
- 컨텍스트 메뉴 자동 설정

### 1.2 createEditGrid (편집용)

```javascript
// 편집 가능한 그리드 생성
const columns = [
    { fieldName: "ITEM_CD", name: "ITEM_CD", width: 100,
      header: { text: "항목코드" }, editable: true },
    { fieldName: "ITEM_NM", name: "ITEM_NM", width: 200,
      header: { text: "항목명" }, editable: true },
    { fieldName: "USE_YN", name: "USE_YN", width: 80,
      header: { text: "사용여부" },
      editor: dropdownDomainOnly,  // KiiPS 상수 사용
      values: ["Y", "N"],
      labels: ["예", "아니오"] }
];

createEditGrid("editGrid", dataProvider, gridView, columns);
```

**추가 설정:**
- `editOptions.editable`: true
- `editOptions.insertable`: true (Insert 키)
- `editOptions.deletable`: true (Ctrl+Del)
- `editOptions.commitWhenLeave`: true (포커스 아웃 시 커밋)
- `checkBar.visible`: true

### 1.3 createTreeGrid (트리 구조)

```javascript
let treeProvider = new RealGrid.LocalTreeDataProvider();
let treeView = new RealGrid.TreeView("treeGrid");

const columns = [
    { fieldName: "DEPT_NM", name: "DEPT_NM", width: 200,
      header: { text: "부서명" } },
    { fieldName: "EMP_CNT", name: "EMP_CNT", width: 100,
      header: { text: "인원수" }, styleName: "right-column" }
];

createTreeGrid("treeGrid", treeProvider, treeView, columns);

// 데이터 로드 (계층 구조)
treeProvider.setRows(data, "DEPT_CD", false, "", "PARENT_CD");
```

---

## 2. KiiPS 표준 상수

### 2.1 Summary 설정

```javascript
// 헤더 합계
const headerSummaryKiips = {
    expression: "sum",
    numberFormat: "#,##0.####",
    styleName: "right-column"
};

// 푸터 합계
const footerSummaryKiips = {
    expression: "sum",
    numberFormat: "#,##0.####",
    styleName: "right-column"
};

// 그룹 합계
const groupFooterKiips = {
    dataType: "number",
    numberFormat: "#,##0.####",
    styleName: "right-column"
};

// 컬럼에 적용
{ fieldName: "AMT", name: "AMT",
  header: { text: "금액" },
  footer: footerSummaryKiips,      // 푸터 합계
  headerSummary: headerSummaryKiips // 헤더 합계
}
```

### 2.2 텍스트 포맷

```javascript
// 날짜 포맷 (YYYYMMDD → YYYY-MM-DD)
const textFormatDateKiips = "([0-9]{4})([0-9]{2})([0-9]{2});$1-$2-$3";

// 휴대폰 포맷 (01012345678 → 010-1234-5678)
const textFormatHpPhoneKiips = "([0-9]{3})([0-9]{4})([0-9]{4});$1-$2-$3";

// 사업자번호 포맷 (1234567890 → 123-45-67890)
const textFormaBsnRegNumtKiips = "([0-9]{3})([0-9]{2})([0-9]{5});$1-$2-$3";

// 컬럼에 적용
{ fieldName: "BIZ_DT", name: "BIZ_DT",
  header: { text: "기준일자" },
  textFormat: textFormatDateKiips }
```

### 2.3 날짜 에디터

```javascript
// 날짜 에디터 (마스크 포함)
const editorDateKiips = {
    type: "date",
    mask: {
        editMask: "9999-99-99",
        placeHolder: "yyyy-MM-dd",
        includedFormat: true
    },
    datetimeFormat: "yyyy-MM-dd"
};

// 날짜 에디터 (마스크 미포함)
const editorDateKiipsF = {
    type: "date",
    mask: {
        editMask: "9999-99-99",
        placeHolder: "yyyy-MM-dd",
        includedFormat: false
    },
    datetimeFormat: "yyyy-MM-dd"
};

// 컬럼에 적용
{ fieldName: "START_DT", name: "START_DT",
  header: { text: "시작일" },
  editor: editorDateKiips }
```

### 2.4 드롭다운 & 병합

```javascript
// 도메인만 허용하는 드롭다운
const dropdownDomainOnly = { type: "dropdown", domainOnly: true };

// 값 기준 병합
const mergeRuleKiips = { criteria: "value" };

// 컬럼에 적용
{ fieldName: "STATUS", name: "STATUS",
  editor: dropdownDomainOnly,
  values: ["01", "02", "03"],
  labels: ["대기", "승인", "반려"],
  mergeRule: mergeRuleKiips }
```

### 2.5 파일 아이콘 렌더러

```javascript
// 첨부파일 아이콘 (Y/N 기준)
const rendererFileIconKiips = {
    type: "icon",
    iconCallback: function(grid, cell) {
        let atchFile = cell.value == 'Y' ? 'icon_attach.svg' : 'blank.png';
        return '../../../../../img/' + atchFile;
    },
    iconLocation: "center",
    iconHeight: 15,
    iconWidth: 15
};

// 첨부파일 아이콘 (null 체크)
const rendererFileIconKiips2 = {
    type: "icon",
    iconCallback: function(grid, cell) {
        let atchFile = cell.value != null ? 'icon_attach.svg' : 'blank.png';
        return '../../../../../img/' + atchFile;
    },
    iconLocation: "center",
    iconHeight: 15,
    iconWidth: 15
};

// 컬럼에 적용
{ fieldName: "ATCH_YN", name: "ATCH_YN",
  header: { text: "첨부" },
  renderer: rendererFileIconKiips }
```

---

## 3. 커스텀 렌더러 (fn_grid_renderer)

### 3.1 사용 가능한 렌더러 목록

| 렌더러 이름 | 용도 | 클릭 동작 |
|-------------|------|-----------|
| `renderer_imgbtn` | 검색 버튼 | 모달 팝업 |
| `renderer_invstcom` | 투자재원배분 기업 검색 | fn_valSave 호출 |
| `renderer_zipcode` | 우편번호 검색 (폼용) | Daum 주소 API |
| `renderer_zipcode_grid` | 우편번호 검색 (그리드용) | Daum 주소 API |
| `renderer_custnm` | 거래처 검색 | callPG0103V1 |
| `renderer_exchange` | 환율정보 검색 | callIL0202_POP2 |
| `renderer_account` | 계정과목 검색 | callACCOUNT |
| `renderer_account_dr` | 차변 계정과목 검색 | callACCOUNT |
| `renderer_account_cr` | 대변 계정과목 검색 | callACCOUNT |
| `renderer_account_nm` | 계좌번호 검색 | callSEARCH_ACCNT |
| `renderer_enterprise` | 거래처 검색 | callINVSTCOM |
| `renderer_code_brch` | 지점코드 조회 | (비활성) |
| `renderer_save` | 저장 버튼 | 커스텀 저장 |
| `renderer_remove_apprv` | 결재선 취소 버튼 | 취소 처리 |

### 3.2 렌더러 등록 및 사용

```javascript
// 1. 렌더러 등록 (그리드 생성 후)
fn_grid_renderer(gridView, 'renderer_account');

// 2. 컬럼에 적용
const columns = [
    { fieldName: "ACIT_NM", name: "ACIT_NM", width: 150,
      header: { text: "계정과목" },
      renderer: "renderer_account" }  // 렌더러 이름 지정
];
```

### 3.3 커스텀 렌더러 직접 생성

```javascript
// 새 렌더러 등록 패턴
gridView.registerCustomRenderer("renderer_custom", {
    // 초기화: DOM 요소 생성
    initContent: function(parent) {
        let span = this._span = document.createElement("span");
        span.className = "custom_render_span";
        parent.appendChild(span);
        parent.appendChild(this._button1 = document.createElement("span"));
    },

    // 클릭 가능 여부
    canClick: function() {
        return true;
    },

    // 정리: 그리드 destroy 시 호출
    clearContent: function(parent) {
        parent.innerHTML = "";
    },

    // 렌더링: 셀 그릴 때 호출
    render: function(grid, model, width, height, info) {
        info = info || {};
        let span = this._span;
        span.textContent = model.value;
        this._value = model.value;
        this._button1.className = "custom_search custom-hover custom-focused";
    },

    // 클릭 이벤트
    click: function(event) {
        let index = this.index.toProxy();
        // 커스텀 동작
        console.log("Clicked row:", index.dataRow);
    }
});
```

---

## 4. 페이징 시스템

### 4.1 기본 페이징 설정

```javascript
// 그리드 생성 후 페이징 설정
createMainGrid("realgrid", dataProvider, gridView, columns);
setPaging(gridView, 10, "#paging");  // 10개씩, #paging 컨테이너

// HTML 구조
<div id="realgrid" style="width:100%;height:400px;"></div>
<div id="paging"></div>  <!-- 페이지 네비게이션 표시 영역 -->
```

### 4.2 페이지 수 변경

```javascript
// ADJ_GRID_COLUMN select 박스 연동
<select id="ADJ_GRID_COLUMN" onchange="fn_ChangePageCnt(this.value, gridView)">
    <option value="10">10개</option>
    <option value="20">20개</option>
    <option value="50">50개</option>
    <option value="전체">전체</option>
</select>

// 페이지 수 변경 함수 (common_grid.js에 정의됨)
function fn_ChangePageCnt(cnt, gridView) {
    setPaging(gridView, cnt);
}
```

### 4.3 전체보기 토글

```javascript
// 체크박스로 전체보기 전환
<input type="checkbox" id="allView" onchange="fnGridAllView(this, 'realgrid')">
<label for="allView">전체보기</label>

// fnGridAllView 함수 (common_grid.js)
// - checked: 페이징 해제, 화면 높이에 맞춤
// - unchecked: 10개씩 페이징 복원
```

### 4.4 그리드 높이 자동 조절

```javascript
// 데이터 수에 따라 그리드 높이 자동 조절
AllHeightGridView(gridView, "#realgrid", 200, 300);

// Parameters:
// - gridView: 그리드 인스턴스
// - containerID: 그리드 컨테이너 ID
// - marginTop: 상단 여백 (모달 등)
// - gridmindHeight: 최소 높이 (5건 미만일 때)
```

---

## 5. Excel Export

### 5.1 기본 Excel 내보내기

```javascript
// 버튼 클릭 이벤트
<button onclick="ExcelExportAll()">엑셀 다운로드</button>

// ExcelExportAll() 자동 동작:
// 1. screenGrid Map에서 _main 접미사 그리드 수집
// 2. 화면명(gSCREEN_NAME) + ".xlsx" 파일명 생성
// 3. 조회조건 자동 포함 (FILTER_INPUT_TAG)
// 4. 접근 로그 자동 기록
```

### 5.2 조회조건 표시 옵션

```javascript
// 조회조건 표시 (기본)
ExcelExportAll(true);

// 조회조건 숨김
ExcelExportAll(false);

// 사용자 정의 셀 + 사유 추가
ExcelExportAll(true, customCells, "월별 실적 다운로드");
```

### 5.3 시트별 제목 추가 (탭 분리)

```javascript
// 여러 탭으로 분리된 그리드 내보내기
ExcelExportAllCustom(true, null, "분기별 실적");

// 시트명: 탭 이름 자동 추출
// 각 그리드가 부모 탭의 이름으로 시트 생성
```

### 5.4 특정 그리드만 내보내기

```javascript
// 단일 그리드
excelExport(gridView);

// 여러 그리드 지정
ExcelExportWithGrid(gridView1, gridView2, gridView3);
```

### 5.5 Pivot Grid 내보내기

```javascript
// 피벗 그리드 전용
fn_pivotExportGridLog(pivotGrid, "피벗리포트");

// 접근 로그 자동 기록 포함
```

---

## 6. 컨텍스트 메뉴

### 6.1 기본 컨텍스트 메뉴

```javascript
// 그리드 생성 함수에서 자동 설정됨
// 수동 설정 시:
setContextMenu(gridView);

// 기본 메뉴 항목:
// - 선택 데이터 복사 (Ctrl+C)
// - 행 복사
// - 값 조회 (ALT+Q)
// - 필터 적용/해제
```

### 6.2 커스텀 컨텍스트 메뉴

```javascript
// 컨텍스트 메뉴 확장
setContextMenu(gridView, 'custom');

// 이벤트 핸들러 오버라이드
gridView.onContextMenuPopup = function(grid, x, y, elementName) {
    // 메뉴 표시 전 커스텀 처리
};

gridView.onContextMenuItemClicked = function(grid, item, data) {
    // 메뉴 선택 시 처리
    if (item.tag === "custom_action") {
        // 커스텀 동작
    }
};
```

---

## 7. 데이터 조작

### 7.1 데이터 로드

```javascript
// AJAX로 데이터 조회 후 그리드에 설정
$.ajax({
    url: "/api/funds/list",
    type: "POST",
    data: searchParams,
    success: function(result) {
        // 데이터 설정 (공통 함수)
        fnSetGrid(dataProvider, result.data);

        // 또는 직접 설정
        dataProvider.setRows(result.data);

        // 페이징 갱신
        setPaging(gridView, 10, "#paging");
    }
});
```

### 7.2 행 상태 확인 (수정 여부)

```javascript
// 수정 데이터 존재 여부 확인
if (!isEdited(gridView)) {
    MESSAGE_HANDLE('save_no_data');  // "저장할 데이터가 없습니다"
    return;
}

// 주의: dataProvider.restoreMode = "auto" 필요
// createEditGrid에서 자동 설정됨
```

### 7.3 행 삭제 처리

```javascript
// 삭제할 행 설정
setDeleteRow(gridView, dataProvider);

// 삭제된 행 데이터 가져오기
let deletedRows = getGridDelData("realgrid");

// 삭제 데이터 초기화
resetDeleteData();
```

### 7.4 체크된 행 가져오기

```javascript
// 체크된 행 인덱스 배열
let checkedRows = gridView.getCheckedRows();

// 체크된 행 데이터 배열
let checkedData = [];
checkedRows.forEach(function(rowIndex) {
    checkedData.push(dataProvider.getJsonRow(rowIndex));
});
```

### 7.5 데이터 저장

```javascript
function fnSave() {
    // 1. 수정 여부 확인
    if (!isEdited(gridView)) {
        MESSAGE_HANDLE('save_no_data');
        return;
    }

    // 2. 현재 편집 커밋
    gridView.commit();

    // 3. 변경된 행 수집
    let allStateRows = dataProvider.getAllStateRows();
    let saveData = {
        created: [],
        updated: [],
        deleted: []
    };

    allStateRows.created.forEach(idx =>
        saveData.created.push(dataProvider.getJsonRow(idx)));
    allStateRows.updated.forEach(idx =>
        saveData.updated.push(dataProvider.getJsonRow(idx)));
    allStateRows.deleted.forEach(idx =>
        saveData.deleted.push(dataProvider.getJsonRow(idx)));

    // 4. 서버 전송
    $.ajax({
        url: "/api/funds/save",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(saveData),
        success: function(result) {
            MESSAGE_HANDLE('save_success');
            fnSearch();  // 재조회
        }
    });
}
```

---

## 8. 유틸리티 함수

### 8.1 헤더 색상 설정

```javascript
// 특정 컬럼들의 헤더 색상 변경
setHeaderColor(gridView, "required-header", "FD_NM", "START_DT", "END_DT");

// styleName 예시:
// - "required-header": 필수 입력 표시 (빨간 배경)
// - "readonly-header": 읽기 전용 표시 (회색 배경)
```

### 8.2 클립보드 복사 설정

```javascript
// 그리드 선택 영역 복사 활성화
copyToClipboardGrid(gridView);

// 설정 내용:
// - selectionMode: "extended"
// - selectionStyle: "block"
// - copyDisplayText: true (화면 표시값 복사)
// - lookupDisplay: true (코드→라벨 변환값 복사)
```

### 8.3 금액 단위 변환

```javascript
// 그리드 금액 단위 변환 (원 → 천원, 백만원 등)
GRID_FORMAT_CHAGE(gridView, "AMT", 1000, true);

// Parameters:
// - gridView: 그리드 인스턴스
// - column: 컬럼명
// - unitAmt: 단위 (1000=천원, 1000000=백만원)
// - hasSummary: 합계 컬럼 여부
```

### 8.4 컬럼 표시/숨김

```javascript
// 컬럼 숨김/표시 토글
setHideShowColumn(["COL1", "COL2", "COL3"]);

// 특정 컬럼 숨김
gridView.setColumnProperty("COL_NAME", "visible", false);

// 특정 컬럼 표시
gridView.setColumnProperty("COL_NAME", "visible", true);
```

---

## 9. 스타일 클래스

### 9.1 기본 정렬 스타일

```css
/* common_grid.js에서 사용하는 스타일 */
.center-column { text-align: center; }
.left-column { text-align: left; }
.right-column { text-align: right; }
```

### 9.2 상태별 스타일

```css
/* 체크된 행 */
.selectsel-color { background-color: #e3f2fd; }

/* 편집 셀 */
.rg-editing { background-color: #fff3e0; }

/* 읽기 전용 */
.readonly-cell { background-color: #f5f5f5; }
```

### 9.3 Excel Export 스타일

```css
/* 테두리 (모든 셀) */
.all_Border { border: 1px solid #000; }

/* 타이틀 */
.gridtitle-column {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
}

/* Export 폰트 */
.exprt_font { font-family: "맑은 고딕", sans-serif; }
```

---

## 10. 컬럼 정의 예시

### 10.1 기본 컬럼 구조

```javascript
const columns = [
    // 텍스트 컬럼 (기본)
    {
        fieldName: "FD_NO",        // 데이터 필드명
        name: "FD_NO",             // 컬럼 식별자
        width: 100,                // 너비
        header: { text: "펀드번호" },
        styleName: "center-column"
    },

    // 숫자 컬럼 (포맷팅)
    {
        fieldName: "AMT",
        name: "AMT",
        width: 120,
        header: { text: "금액" },
        styleName: "right-column",
        numberFormat: "#,##0",     // 천단위 구분
        footer: footerSummaryKiips // 합계 표시
    },

    // 날짜 컬럼
    {
        fieldName: "BIZ_DT",
        name: "BIZ_DT",
        width: 100,
        header: { text: "기준일" },
        styleName: "center-column",
        textFormat: textFormatDateKiips,  // YYYYMMDD → YYYY-MM-DD
        editor: editorDateKiips           // 날짜 에디터
    },

    // 드롭다운 컬럼
    {
        fieldName: "STATUS",
        name: "STATUS",
        width: 80,
        header: { text: "상태" },
        styleName: "center-column",
        editor: dropdownDomainOnly,
        values: ["01", "02", "03"],
        labels: ["대기", "승인", "반려"],
        lookupDisplay: true        // 화면에 labels 표시
    },

    // 체크박스 컬럼
    {
        fieldName: "USE_YN",
        name: "USE_YN",
        width: 60,
        header: { text: "사용" },
        styleName: "center-column",
        renderer: { type: "check", trueValues: "Y", falseValues: "N" },
        editable: true
    },

    // 커스텀 렌더러 컬럼
    {
        fieldName: "ACIT_NM",
        name: "ACIT_NM",
        width: 150,
        header: { text: "계정과목" },
        renderer: "renderer_account",  // 검색 버튼 렌더러
        editable: false
    },

    // 아이콘 컬럼
    {
        fieldName: "ATCH_YN",
        name: "ATCH_YN",
        width: 50,
        header: { text: "첨부" },
        renderer: rendererFileIconKiips
    },

    // 병합 컬럼
    {
        fieldName: "CATEGORY",
        name: "CATEGORY",
        width: 100,
        header: { text: "분류" },
        mergeRule: mergeRuleKiips  // 같은 값 병합
    }
];
```

### 10.2 그룹 헤더 컬럼

```javascript
const columns = [
    {
        name: "GROUP_INFO",        // 그룹 컬럼명
        header: { text: "기본정보" },
        columns: [                 // 하위 컬럼
            { fieldName: "FD_NO", name: "FD_NO", width: 100,
              header: { text: "펀드번호" } },
            { fieldName: "FD_NM", name: "FD_NM", width: 200,
              header: { text: "펀드명" } }
        ]
    },
    {
        name: "GROUP_AMT",
        header: { text: "금액정보" },
        columns: [
            { fieldName: "INVST_AMT", name: "INVST_AMT", width: 120,
              header: { text: "투자금액" }, styleName: "right-column" },
            { fieldName: "RCVR_AMT", name: "RCVR_AMT", width: 120,
              header: { text: "회수금액" }, styleName: "right-column" }
        ]
    }
];
```

---

## 11. screenGrid 시스템

### 11.1 개요

```javascript
// screenGrid: 화면별 그리드 인스턴스 관리 Map
const screenGrid = new Map();

// 자동 등록 (createXxxGrid 함수에서)
screenGrid.set(container + "_main", gridView);   // createMainGrid
screenGrid.set(container + "_simple", gridView); // createSimpleGrid
screenGrid.set(container + "_edit", gridView);   // createEditGrid
```

### 11.2 활용

```javascript
// 특정 그리드 가져오기
let mainGrid = screenGrid.get("realgrid_main");

// 모든 메인 그리드 순회
for (let [key, value] of screenGrid) {
    if (key.indexOf('_main') > 0) {
        console.log("Grid:", key, "Rows:", value.getDataSource().getRowCount());
    }
}

// ExcelExportAll()에서 자동 활용
// - _main 접미사 그리드 자동 수집
// - 다중 그리드 탭 분리 내보내기
```

---

## 12. 이벤트 핸들러

### 12.1 셀 클릭

```javascript
gridView.onCellClicked = function(grid, clickData) {
    if (clickData.cellType === 'data') {
        let rowData = dataProvider.getJsonRow(clickData.dataRow);
        console.log("Clicked:", rowData);
    }
};
```

### 12.2 셀 값 변경

```javascript
gridView.onCellEdited = function(grid, itemIndex, dataRow, field) {
    let value = dataProvider.getValue(dataRow, field);
    console.log("Changed:", field, "=", value);

    // 연관 필드 자동 계산
    if (field === "UNIT_PRICE" || field === "QTY") {
        let unitPrice = dataProvider.getValue(dataRow, "UNIT_PRICE");
        let qty = dataProvider.getValue(dataRow, "QTY");
        dataProvider.setValue(dataRow, "AMT", unitPrice * qty);
    }
};
```

### 12.3 행 삽입/삭제

```javascript
// 행 삽입 전
gridView.onRowInserting = function(grid, itemIndex) {
    return true;  // false 반환 시 삽입 취소
};

// 행 삽입 후
gridView.onRowInserted = function(grid, itemIndex) {
    // 기본값 설정
    dataProvider.setValue(itemIndex, "USE_YN", "Y");
    dataProvider.setValue(itemIndex, "REG_DT", getCurrentDate());
};

// 행 삭제 전
gridView.onRowDeleting = function(grid, itemIndex) {
    let status = dataProvider.getValue(itemIndex, "STATUS");
    if (status === "02") {  // 승인된 건
        MESSAGE_HANDLE("승인된 건은 삭제할 수 없습니다.");
        return false;
    }
    return true;
};
```

### 12.4 데이터 로드 완료

```javascript
gridView.onDataLoadComplated = function(grid) {
    // 컬럼 너비 자동 조절
    gridView.getColumns().forEach(function(item) {
        let w = item.renderer?.type === 'icon' ? 80 : 500;
        gridView.fitLayoutWidth(item.name, w, item.width, true);
    });

    // 첫 번째 행 선택
    if (dataProvider.getRowCount() > 0) {
        gridView.setCurrent({ itemIndex: 0 });
    }
};
```

---

## 13. 자주 사용하는 패턴

### 13.1 마스터-디테일 그리드

```javascript
// 마스터 그리드 클릭 → 디테일 조회
masterGridView.onCellClicked = function(grid, clickData) {
    if (clickData.cellType === 'data') {
        let masterData = masterProvider.getJsonRow(clickData.dataRow);
        loadDetailGrid(masterData.FD_NO);
    }
};

function loadDetailGrid(fdNo) {
    $.ajax({
        url: "/api/funds/detail",
        data: { fdNo: fdNo },
        success: function(result) {
            detailProvider.setRows(result.data);
        }
    });
}
```

### 13.2 행 추가 버튼

```javascript
function fnAddRow() {
    // 현재 편집 커밋
    gridView.commit();

    // 새 행 추가
    dataProvider.insertRow(0, {
        USE_YN: "Y",
        REG_DT: getCurrentDate(),
        REG_ID: gUserNo
    });

    // 새 행 포커스
    gridView.setCurrent({ itemIndex: 0, column: "ITEM_NM" });
    gridView.showEditor();
}
```

### 13.3 선택 행 삭제

```javascript
function fnDeleteRows() {
    let checkedRows = gridView.getCheckedRows();

    if (checkedRows.length === 0) {
        MESSAGE_HANDLE("삭제할 항목을 선택하세요.");
        return;
    }

    if (!confirm(checkedRows.length + "건을 삭제하시겠습니까?")) {
        return;
    }

    // 역순으로 삭제 (인덱스 꼬임 방지)
    checkedRows.sort((a, b) => b - a);
    checkedRows.forEach(function(rowIndex) {
        dataProvider.removeRow(rowIndex);
    });

    MESSAGE_HANDLE(checkedRows.length + "건이 삭제되었습니다.");
}
```

---

## 14. 문제 해결 (Troubleshooting)

### 14.1 "dataProvider.restoreMode = 'auto' 설정이 필요합니다"

```javascript
// isEdited() 함수 사용 시 필요
// 해결: createEditGrid 또는 createSimpleEditGrid 사용
// 또는 수동 설정:
dataProvider.restoreMode = "auto";
```

### 14.2 Excel Export 안됨

```javascript
// 확인 사항:
// 1. screenGrid에 등록되었는지 확인
console.log([...screenGrid.keys()]);

// 2. _main 접미사가 있는지 확인
// createMainGrid 사용 시 자동 등록됨

// 3. 수동으로 그리드 지정
ExcelExportWithGrid(gridView);
```

### 14.3 페이징 동작 안함

```javascript
// 확인 사항:
// 1. #paging 요소 존재 확인
// 2. ADJ_GRID_COLUMN select 존재 확인
// 3. 수동 설정:
setPaging(gridView, 10, "#paging");
```

### 14.4 렌더러 버튼 클릭 안됨

```javascript
// 확인 사항:
// 1. fn_grid_renderer 호출 확인
fn_grid_renderer(gridView, 'renderer_account');

// 2. 컬럼에 renderer 지정 확인
{ renderer: "renderer_account" }

// 3. 관련 콜백 함수 정의 확인 (callACCOUNT 등)
```

---

## 15. 참고 링크

- [RealGrid 2 공식 문서](https://docs.realgrid.com)
- [RealGrid 2 가이드](https://docs.realgrid.com/guides)
- [RealGrid 2 API 레퍼런스](https://docs.realgrid.com/refs)
- [KiiPS SCSS 가이드](./SCSS_GUIDE.md)

---

## 16. 관련 스킬

| 스킬 | 용도 | 키워드 |
|------|------|--------|
| **kiips-realgrid-guide** | RealGrid 2.6.3 종합 가이드 | "그리드", "RealGrid", "테이블", "엑셀 내보내기" |

> 📌 **Note**: `kiips-realgrid-generator`와 `kiips-realgrid-builder`가 `kiips-realgrid-guide`로 통합되었습니다.

---

**Last Updated**: 2026-01-13
**Version**: 2.0
**RealGrid Version**: 2.6.3
**Maintained By**: KiiPS Development Team
