# KiiPS 팝업(Popup) 디자인 가이드

> **Last Updated**: 2026-01-13
> **Purpose**: KiiPS 팝업창 개발 시 일관된 패턴과 템플릿 제공
> **기준 파일**: `POPUP_AC0522_print.jsp`

---

## 📍 Quick Reference

**팝업 열기**: `COMM_POPUP_NEW(url, 'POP_ID', dataObj, 'width', 'height')`
**팝업 닫기**: `closeCurrentWindow()` 또는 `window.close()`
**인쇄**: `window.print()`

**필수 포함 파일**:
```jsp
<%@ include file="../include/header_popup.jsp" %>
<link rel="stylesheet" href="/css/print.css" /> <!-- 인쇄용 -->
```

---

## 🪟 팝업 유형

### 1. 일반 팝업 (COMM_POPUP_*.jsp)
- 데이터 입력/조회 용도
- card → header → body → bottom-btn 구조
- 예: `COMM_POPUP_NOTICE.jsp`, `COMM_POPUP_ADDRES.jsp`

### 2. 인쇄용 팝업 (POPUP_*_print.jsp) ⭐
- 문서 인쇄 전용
- `print.css` 필수 적용
- `no-print` 클래스로 화면 요소 숨김
- 예: `POPUP_AC0522_print.jsp`, `COMM_POPUP_RM0403_print01.jsp`

### 3. 그리드 팝업
- RealGrid 2.8.8 데이터 표시
- 읽기 전용 조회가 대부분
- 예: `COMM_POPUP_OPINION.jsp`, `COMM_POPUP_HISTRYAPP.jsp`

### 4. Bootstrap Modal 팝업
- 페이지 내 오버레이 표시
- `data-backdrop="static"` 배경 클릭 무시
- 예: 확인/취소 다이얼로그

---

## 🎨 CSS 클래스 레퍼런스

### 구조 클래스

| 클래스 | 용도 | 예시 |
|--------|------|------|
| `card` | 팝업 컨테이너 | `<div class="card">` |
| `card-header` | 헤더 섹션 | 제목, 닫기 버튼 포함 |
| `card-title` | 제목 | `<h2 class="card-title">제목</h2>` |
| `card-body` | 본문 | `<div class="card-body px-5 py-4">` |
| `card-actions` | 액션 영역 | 닫기 버튼 위치 |
| `bottom-btn` | 버튼 영역 | 저장/닫기 버튼 |

### 인쇄 클래스

| 클래스 | 용도 | 인쇄 시 동작 |
|--------|------|-------------|
| `print-wrap` | 인쇄 영역 | 색상 유지, 페이지 구분 |
| `no-print` | 숨길 영역 | `display: none` |
| `onlyprint` | 인쇄만 표시 | 화면: hidden, 인쇄: visible |
| `print` | 인쇄 테이블 | border 1px solid |
| `print_card` | 카드 구분 | page-break-after: always |
| `pageA4` | A4 페이지 | width: 1000px |
| `page-break-always` | 페이지 나눔 | 강제 페이지 구분 |

### 버튼 클래스

| 클래스 | 용도 | 색상 |
|--------|------|------|
| `btn btn-primary` | 주요 버튼 (저장, 확인) | 파란색 |
| `btn btn-outline-secondary` | 보조 버튼 (취소, 닫기) | 회색 아웃라인 |
| `modal-dismiss` | 모달 닫기 | data-dismiss="modal" |
| `btn-py-2 px-4` | 버튼 패딩 | 기본 패딩 |

### 테이블 클래스 (인쇄용)

| 클래스 | 용도 |
|--------|------|
| `table.print` | 인쇄용 테이블 스타일 |
| `sum-row` | 합계 행 (회색 배경, 굵은 글씨) |
| `sectionBox` | 섹션 박스 |
| `modalH2` | 섹션 제목 (h2) |
| `table_info` | 단위 정보 표시 |

---

## 📝 HTML 템플릿

### 1. 일반 팝업 템플릿

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="../include/header_popup.jsp" %>

<% Object DATA = request.getAttribute("KEYS"); %>
<script>
    let DATA = <%=DATA%>;
</script>

<div class="">
    <!-- 헤더 -->
    <header class="card-header">
        <h2 class="card-title">
            팝업 제목
            <div class="card-actions">
                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                   data-dismiss="modal" onclick="closeCurrentWindow()"></a>
            </div>
        </h2>
    </header>

    <!-- 본문 -->
    <div class="card-body px-5 py-4">
        <form id="viewForm">
            <!-- 폼 내용 -->
            <div class="form-group row">
                <label class="col-sm-2 control-label text-sm-right">라벨</label>
                <div class="col-sm-10">
                    <input type="text" class="form-control" name="fieldName"
                           data-gbn="txt" data-id="FIELD_ID">
                </div>
            </div>
        </form>
    </div>

    <!-- 버튼 -->
    <div class="bottom-btn">
        <button type="button" class="btn btn-primary font-weight-semibold btn-py-2 px-4"
                onclick="fnSave()">저장</button>
        <button type="reset" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss"
                data-dismiss="modal" onclick="closeCurrentWindow()">닫기</button>
    </div>
</div>

<script>
    $(document).ready(function() {
        getData();
    });

    function getData() {
        let gToken = DATA.gtoken;
        let param = { KEY: DATA.KEY };

        logosAjax.requestToken(
            gToken,
            "${KiiPS_XX}/XXAPI/XX0000/VIEW",
            "POST",
            param,
            function(data) {
                // 데이터 바인딩
                console.log(data);
            }
        );
    }

    function fnSave() {
        // 저장 로직
        closeCurrentWindow();
    }
</script>
```

---

### 2. 인쇄용 팝업 템플릿 ⭐ (POPUP_AC0522_print.jsp 기반)

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="../include/header_popup.jsp" %>

<!-- 인쇄용 CSS 필수 -->
<link rel="stylesheet" type="text/css" href="/css/print.css" />

<% Object DATA = request.getAttribute("KEYS"); %>

<style type="text/css">
    /* 페이지 설정: A4 가로, 여백 10mm */
    @page { size: A4 landscape; margin: 10mm 0; }

    /* 합계 행 스타일 */
    .sum-row {
        background: #e7e7e7;
        font-weight: bold;
    }
</style>

<script>
    let DATA = <%=DATA%>;
</script>

<div class="card">
    <div class="px-5 py-4">
        <!-- 상단 정보 영역 -->
        <ul class="sectionBox data_flex">
            <li class="tbl_item flex-dynamic" style="--flex-basis: 14%">
                <span class="control-label">작성기준일</span>
            </li>
            <li id="MAK_DT" class="tbl_item flex-dynamic" style="--flex-basis: 36%"></li>
            <li class="tbl_item flex-dynamic" style="--flex-basis: 14%">
                <span class="control-label">작성자</span>
            </li>
            <li id="MAK_EMP_CUST_NM" class="tbl_item flex-dynamic" style="--flex-basis: 36%"></li>
        </ul>

        <!-- 섹션 1 -->
        <div id="SECTION1" class="sectionBox">
            <h2 class="modalH2">1. 섹션 제목</h2>
            <div class="table_info">
                <span>(단위 : 원, %)</span>
            </div>
            <table class="print">
                <colgroup>
                    <col style="width: 120px" />
                    <col style="width: 160px" />
                    <col style="width: 200px" />
                </colgroup>
                <thead>
                    <tr>
                        <th>컬럼1</th>
                        <th>컬럼2</th>
                        <th>컬럼3</th>
                    </tr>
                </thead>
                <tbody id="SECTION1_BODY"></tbody>
            </table>
        </div>

        <!-- 페이지 나눔이 필요한 섹션 -->
        <div id="SECTION2" class="sectionBox page-break-always">
            <h2 class="modalH2">2. 다음 페이지 섹션</h2>
            <!-- 내용 -->
        </div>

        <!-- 버튼 영역 (인쇄 시 숨김) -->
        <div class="bottom-btn no-print">
            <button type="button" class="btn btn-primary font-weight-semibold btn-py-2 px-4"
                    onclick="return window.print()">출력하기</button>
            <button type="reset" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4"
                    onclick="javascript:window.close();">닫기</button>
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {
        getData();
    });

    function getData() {
        let gToken = DATA.gtoken;
        let param = { KEY: DATA.KEY };

        logosAjax.requestToken(
            gToken,
            "${KiiPS_XX}/XXAPI/XX0000/VIEW",
            "POST",
            param,
            function(data) {
                renderData(data.body);
            }
        );
    }

    function renderData(body) {
        let htmlRows = "";

        for (let i = 0; i < body.LIST.length; i++) {
            let item = body.LIST[i];

            // 합계 행 처리
            if (item.TYPE === "합계") {
                htmlRows += '<tr class="sum-row">';
                htmlRows += '   <td colspan="2" class="text-center">' + item.TYPE + '</td>';
                htmlRows += '   <td class="text-right">' + StringUtil.addCommaDecimal(item.AMOUNT, ',') + '</td>';
                htmlRows += '</tr>';
                continue;
            }

            // 일반 행
            htmlRows += '<tr>';
            htmlRows += '   <td>' + StringUtil.nvl(item.COL1, '') + '</td>';
            htmlRows += '   <td>' + StringUtil.nvl(item.COL2, '') + '</td>';
            htmlRows += '   <td class="text-right">' + StringUtil.addCommaDecimal(item.AMOUNT, ',') + '</td>';
            htmlRows += '</tr>';
        }

        $("#SECTION1_BODY").html(htmlRows);
    }
</script>
```

---

### 3. 그리드 팝업 템플릿

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="../include/header_popup.jsp" %>

<% Object DATA = request.getAttribute("KEYS"); %>
<script>
    let DATA = <%=DATA%>;
</script>

<div class="">
    <header class="card-header">
        <h2 class="card-title">
            그리드 팝업 제목
            <div class="card-actions">
                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                   data-dismiss="modal" onclick="closeCurrentWindow()"></a>
            </div>
        </h2>
    </header>

    <div class="card-body px-5 py-4">
        <form id="viewForm">
            <!-- 숨은 필드 -->
            <input type="hidden" name="CUST_NO" data-gbn="txt" data-id="CUST_NO">

            <!-- RealGrid 영역 -->
            <div id="TB_GRID_POPUP" class="TB_GRID_POPUP"></div>
        </form>

        <div class="bottom-btn">
            <button type="reset" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss"
                    data-dismiss="modal" onclick="closeCurrentWindow()">닫기</button>
        </div>
    </div>
</div>

<script>
    let dataProvider, gridView;

    $(document).ready(function() {
        initGrid();
        getData();
    });

    function initGrid() {
        dataProvider = new RealGrid.LocalDataProvider(true);
        gridView = new RealGrid.GridView("TB_GRID_POPUP");

        let columns = [
            { name: "COL1", fieldName: "COL1", header: { text: "컬럼1" }, width: 120 },
            { name: "COL2", fieldName: "COL2", header: { text: "컬럼2" }, width: 150 },
            { name: "AMOUNT", fieldName: "AMOUNT", header: { text: "금액" }, width: 120,
              numberFormat: "#,##0", styleName: "text-right" }
        ];

        createSimpleGrid("TB_GRID_POPUP", dataProvider, gridView, columns);

        // 그리드 높이 설정
        $(eval("TB_GRID_POPUP")).css("height", "400px");

        // 읽기 전용 설정
        gridView.editOptions.editable = false;
        gridView.displayOptions.hscrollBar = false;
    }

    function getData() {
        let gToken = DATA.gtoken;
        let param = { CUST_NO: DATA.CUST_NO };

        logosAjax.requestTokenGrid(
            gridView,
            gToken,
            "${KiiPS_XX}/XXAPI/XX0000/LIST",
            "POST",
            param,
            function(data) {
                dataProvider.setRows(data.body.LIST);
                gridView.refresh();
            }
        );
    }
</script>
```

---

### 4. Bootstrap Modal 팝업 템플릿

```html
<!-- 페이지 내 모달 정의 -->
<div class="modal fade" id="confirmModal" role="dialog"
     aria-hidden="true" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-dialog-centered modal-sm" role="document">
        <div class="modal-content p-4">
            <div class="modal-body text-center">
                <h4 id="modalMessage">저장하시겠습니까?</h4>
            </div>
            <div class="bottom-btn">
                <button type="button" class="btn btn-primary" onclick="doConfirm()">확인</button>
                <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">취소</button>
            </div>
        </div>
    </div>
</div>

<script>
    // 모달 열기
    function showConfirmModal(message, callback) {
        $('#modalMessage').text(message);
        window.modalCallback = callback;
        $('#confirmModal').modal('show');
    }

    // 확인 버튼 클릭
    function doConfirm() {
        $('#confirmModal').modal('hide');
        if (window.modalCallback) {
            window.modalCallback();
        }
    }

    // 사용 예시
    // showConfirmModal('저장하시겠습니까?', function() {
    //     fnSave();
    // });
</script>
```

---

## 🔧 JavaScript 패턴

### 팝업 열기 (COMM_POPUP_NEW)

```javascript
// 기본 사용법
COMM_POPUP_NEW('${KiiPS_GATE}', 'POP_ID', {}, '800', '600');

// 데이터와 함께 열기
let data = {
    CUST_NO: '12345',
    MENU_ID: MENU_ID,
    DATE: '20260113'
};
COMM_POPUP_NEW('${KiiPS_GATE}', 'OPINION', data, '900', '700');

// 인쇄 팝업 열기
let printData = {
    gtoken: gToken,
    MAK_UUID: selectedUUID,
    ACC_BEFORE_DT: beforeDate,
    ACC_CURRENT_DT: currentDate
};
COMM_POPUP_NEW('${KiiPS_GATE}', 'AC0522_print', printData, '1200', '900');
```

### 팝업 닫기

```javascript
// 기본 닫기
function closeCurrentWindow() {
    window.close();
}

// 부모 창에 데이터 전달 후 닫기
function closeWithData(data) {
    if (window.opener) {
        window.opener.callbackFromPopup(data);
    }
    window.close();
}
```

### API 호출 패턴

```javascript
// logosAjax.requestToken - 일반 조회
logosAjax.requestToken(
    gToken,                          // JWT 토큰
    "${KiiPS_XX}/XXAPI/XX0000/VIEW", // API URL
    "POST",                          // HTTP Method
    paramObj,                        // 요청 파라미터
    function(data) {                 // 성공 콜백
        console.log(data.body);
    },
    function(error) {                // 실패 콜백 (선택)
        alert('조회 실패');
    }
);

// logosAjax.requestTokenGrid - 그리드 데이터 조회
logosAjax.requestTokenGrid(
    gridView,                        // RealGrid GridView
    gToken,                          // JWT 토큰
    "${KiiPS_XX}/XXAPI/XX0000/LIST", // API URL
    "POST",                          // HTTP Method
    paramObj,                        // 요청 파라미터
    function(data) {                 // 성공 콜백
        dataProvider.setRows(data.body.LIST);
        gridView.refresh();
    }
);
```

### StringUtil 유틸리티

```javascript
// null 체크 및 기본값
StringUtil.nvl(value, '');           // null이면 빈 문자열
StringUtil.nvl(value, 0);            // null이면 0

// null 체크
StringUtil.isNull(value);            // true/false

// 숫자 포맷팅
StringUtil.addCommaDecimal(12345, ',');  // "12,345"
StringUtil.addCommaDecimal(12345.67, ','); // "12,345.67"

// 날짜 포맷팅
StringUtil.toDate('20260113');           // "2026-01-13"
StringUtil.toDate('20260113', '-');      // "2026-01-13"
StringUtil.toDate('20260113', '.');      // "2026.01.13"
```

---

## 📄 인쇄 설정

### @page CSS 설정

```css
/* A4 세로 */
@page { size: A4 portrait; margin: 10mm; }

/* A4 가로 */
@page { size: A4 landscape; margin: 10mm 0; }

/* 첫 페이지만 다르게 */
@page :first { margin-top: 20mm; }
```

### 페이지 나눔

```html
<!-- 섹션 전에 페이지 나눔 -->
<div class="sectionBox page-break-always">
    <!-- 새 페이지에서 시작 -->
</div>
```

```css
.page-break-always {
    page-break-before: always;
}

.page-break-avoid {
    page-break-inside: avoid;
}
```

### print.css 주요 규칙

```css
/* 인쇄 시 색상 유지 */
.print-wrap {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
}

/* 인쇄 시 숨김 */
@media print {
    .no-print {
        display: none !important;
    }

    header, footer {
        display: none;
    }
}

/* 인쇄용 테이블 */
table.print {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #bfbfbf;
}

table.print th,
table.print td {
    border: 1px solid #adadad;
    padding: 6px 5px;
}

table.print th {
    background-color: #e7e7e7;
    text-align: center;
}
```

---

## ✅ 팝업 생성 체크리스트

### 일반 팝업

- [ ] `header_popup.jsp` include
- [ ] `DATA` 객체 초기화 (`request.getAttribute("KEYS")`)
- [ ] card-header, card-body, bottom-btn 구조
- [ ] `closeCurrentWindow()` 닫기 함수
- [ ] `logosAjax.requestToken()` API 호출

### 인쇄용 팝업

- [ ] `header_popup.jsp` include
- [ ] `print.css` link 추가
- [ ] `@page` CSS 설정 (A4, landscape/portrait)
- [ ] `no-print` 클래스로 버튼 영역 숨김
- [ ] `page-break-always` 클래스로 페이지 구분
- [ ] `window.print()` 출력 버튼
- [ ] `sum-row` 클래스로 합계 행 스타일링

### 그리드 팝업

- [ ] `header_popup.jsp` include
- [ ] RealGrid 초기화 (`LocalDataProvider`, `GridView`)
- [ ] 그리드 높이 설정 (`css("height", "XXXpx")`)
- [ ] `logosAjax.requestTokenGrid()` 사용
- [ ] 읽기 전용 설정 (`editable: false`)

### Bootstrap Modal

- [ ] `data-backdrop="static"` 배경 클릭 무시
- [ ] `data-keyboard="false"` ESC 키 무시
- [ ] `modal-dialog-centered` 중앙 정렬
- [ ] 콜백 함수 처리

---

## 🔗 관련 문서

- **SCSS 가이드**: [SCSS_GUIDE.md](./SCSS_GUIDE.md) - 스타일 변수 및 믹스인
- **프로젝트 구조**: [../CLAUDE.md](../CLAUDE.md) - KiiPS 전체 구조
- **KiiPS-UI**: [../KiiPS-UI/CLAUDE.md](../KiiPS-UI/CLAUDE.md) - UI 모듈 가이드

---

## 📚 참조 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| 기준 파일 | `KiiPS-UI/.../COM/POPUP_AC0522_print.jsp` | 인쇄 팝업 표준 |
| 헤더 | `KiiPS-UI/.../include/header_popup.jsp` | 팝업 공통 헤더 |
| 인쇄 CSS | `KiiPS-UI/.../static/css/print.css` | 인쇄 스타일 |
| 공통 JS | `KiiPS-UI/.../static/js/common.js` | COMM_POPUP_NEW 등 |
| 그리드 JS | `KiiPS-UI/.../static/js/common_grid.js` | RealGrid 초기화 |

---

**Version**: 1.0
**Maintained By**: KiiPS Development Team
**Source**: `POPUP_AC0522_print.jsp` 기반 분석
