# KiiPS UI Component Builder - Examples

## Example 1: RealGrid 기본 그리드 (Complete JSP)

**User Request**: "펀드 목록 조회 화면 만들어줘"

**Generated Files**:
- `fund-list.jsp` - JSP 템플릿
- Inline `<script>` - RealGrid 초기화 + logosAjax

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../include/header.jsp"%>
<spring:eval expression="@environment.getProperty('KiiPS.FD.URL')" var="KiiPS_FD"/>

<!-- 검색 영역 -->
<div class="search-area card mb-3">
    <div class="card-body">
        <form id="searchForm" class="row g-3">
            <div class="col-md-3">
                <label for="fundName" class="form-label">펀드명</label>
                <input type="text" class="form-control" id="fundName" name="FUND_NM">
            </div>
            <div class="col-md-3">
                <label for="fundType" class="form-label">펀드유형</label>
                <select class="form-select" id="fundType" name="FUND_TYPE">
                    <option value="">전체</option>
                    <option value="EQUITY">주식형</option>
                    <option value="BOND">채권형</option>
                    <option value="MIXED">혼합형</option>
                </select>
            </div>
            <div class="col-12">
                <button type="button" class="btn btn-primary" onclick="searchFundList()">
                    <i class="bi bi-search"></i> 조회
                </button>
                <button type="button" class="btn btn-secondary" onclick="resetSearch()">
                    <i class="bi bi-arrow-clockwise"></i> 초기화
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 그리드 영역 -->
<div class="grid-area card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">펀드 목록</h5>
        <button type="button" class="btn btn-sm btn-success" onclick="exportToExcel()">
            <i class="bi bi-file-earmark-excel"></i> 엑셀 다운로드
        </button>
    </div>
    <div class="card-body">
        <div id="TB_FUND_LIST" style="width:100%; height:500px;"
             role="grid" aria-label="펀드 목록 그리드"></div>
    </div>
</div>

<script>
// gToken은 header.jsp에서 세션 토큰으로 초기화됨 (재선언 금지)
var dataProvider, gridView;

$(document).ready(function() {
    initGrid();
    searchFundList();
});

function initGrid() {
    dataProvider = new RealGrid.LocalDataProvider(true);
    gridView = new RealGrid.GridView("TB_FUND_LIST");

    // 컬럼 정의 (KiiPS 표준 패턴)
    let columns = [
        {fieldName: "FUND_CD", width: "120", header: {text: "펀드코드"},
         editable: false, styleName: "center-column"},
        {fieldName: "FUND_NM", width: "250", header: {text: "펀드명"},
         editable: false, styleName: "left-column"},
        {fieldName: "FUND_TYPE", width: "100", header: {text: "펀드유형"},
         editable: false, styleName: "center-column"},
        {fieldName: "NAV_AMT", width: "120", header: {text: "NAV (원)"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "TOTAL_ASSET", width: "150", header: {text: "순자산 (백만원)"},
         editable: false, dataType: "number", numberFormat: "#,##0",
         styleName: "right-column"},
        {fieldName: "RETURN_RATE", width: "100", header: {text: "수익률 (%)"},
         editable: false, dataType: "number", numberFormat: "0.00",
         styleName: "right-column"},
        {fieldName: "REG_DT", width: "100", header: {text: "등록일"},
         editable: false,
         renderer: {
             type: "html",
             callback: function(grid, cell) {
                 return StringUtil.toDate(cell.value, "-");
             }
         }}
    ];

    // KiiPS 공통 초기화 함수 사용
    createMainGrid("TB_FUND_LIST", dataProvider, gridView, columns);

    // 행 선택 이벤트
    gridView.onCurrentRowChanged = function(grid, oldRow, newRow) {
        if (newRow >= 0) {
            const rowData = dataProvider.getJsonRow(newRow);
            console.log('Selected fund:', rowData);
        }
    };
}

function searchFundList() {
    var searchCond = {
        FUND_NM: $("#fundName").val(),
        FUND_TYPE: $("#fundType").val()
    };

    // KiiPS 표준 AJAX 패턴
    logosAjax.requestTokenGrid(gridView, gToken,
        "${KiiPS_FD}/FDAPI/FUND/LIST", "post", searchCond,
        function(data) {
            dataProvider.setRows(data.body.list);
            gridView.refresh();
        });
}

function resetSearch() {
    $('#searchForm')[0].reset();
    searchFundList();
}

function exportToExcel() {
    gridView.exportGrid({
        type: "excel",
        target: "local",
        fileName: "펀드목록_" + new Date().toISOString().split('T')[0] + ".xlsx",
        done: function() {
            console.log('Excel export completed');
        }
    });
}
</script>

<%@ include file="../include/footer.jsp"%>
```

---

## Example 2: 펀드 목록 페이지 (File Structure)

**User Request**: "펀드 목록 조회 화면을 만들어줘. RealGrid로 표시하고 엑셀 다운로드 기능 추가"

**Files Generated**:
```
KiiPS-UI/src/main/webapp/WEB-INF/jsp/fund/
├── fund-list.jsp          (메인 JSP)
├── fund-list.js           (RealGrid + AJAX)
└── fund-list.scss         (커스텀 스타일)
```

**Full Example**: [examples/fund-list/](./examples/fund-list/)

---

## Example 3: 투자 대시보드

**User Request**: "투자 현황 대시보드 만들어줘. 요약 카드 4개랑 차트 3개"

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Summary Cards (4개)                          │
├──────────────┬──────────────┬──────────────┤
│ 총 투자액     │ 수익률       │ 펀드 수       │
│ 최근 투자일   │              │              │
└──────────────┴──────────────┴──────────────┘
┌──────────────────┬──────────────────────────┐
│ Line Chart       │ Donut Chart              │
│ (투자 추이)       │ (펀드 분류)               │
└──────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────┐
│ Bar Chart (Top 10 펀드 수익률)               │
└─────────────────────────────────────────────┘
```

**Full Example**: [examples/dashboard/](./examples/dashboard/)

---

## Example 4: ApexCharts 선 차트 (AJAX 데이터 로드)

```javascript
// 차트 인스턴스 생성 후 AJAX로 데이터 업데이트
function loadChartData() {
    logosAjax.requestToken(gToken,
        "${KiiPS_FD}/FDAPI/CHART/TREND", "post", {},
        function(data) {
            chart.updateOptions({
                xaxis: {
                    categories: data.body.months
                }
            });
            chart.updateSeries([{
                name: '투자금액',
                data: data.body.investAmts
            }, {
                name: '수익금액',
                data: data.body.profitAmts
            }]);
        }
    );
}
```

---

## Example 5: Bootstrap Modal + RealGrid 편집

```html
<!-- 모달 -->
<div class="modal fade" id="editModal" data-backdrop="static">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="editForm">
                <section class="card">
                    <header class="card-header">
                        <h1 class="card-title">펀드 정보 수정
                            <div class="card-actions">
                                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                                   data-dismiss="modal"></a>
                            </div>
                        </h1>
                    </header>
                    <div class="card-body px-5 py-4">
                        <!-- 폼 필드 -->
                        <div class="sectionBox">
                            <div class="form-group new row">
                                <div class="col-sm-6 col-lg-4">
                                    <label class="control-label">펀드명</label>
                                    <input type="text" class="form-control"
                                           data-gbn="text" data-id="FUND_NM" name="FUND_NM" />
                                </div>
                                <div class="col-sm-6 col-lg-4">
                                    <label class="control-label">펀드유형</label>
                                    <select class="selectpicker show-tick form-control"
                                            data-gbn="select" data-id="FUND_TYPE" name="FUND_TYPE"
                                            multiple data-max-options="1"></select>
                                </div>
                            </div>
                        </div>

                        <!-- 버튼 -->
                        <div class="bottom-btn">
                            <button type="button" class="btn btn-primary modal-confirm"
                                    onclick="fn_submit('#editForm')">저장</button>
                            <button type="reset" class="btn btn-outline-secondary modal-dismiss"
                                    data-dismiss="modal">닫기</button>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    </div>
</div>

<script>
// 모달 열기
function openEditModal(fundCd) {
    logosAjax.requestToken(gToken,
        "${KiiPS_FD}/FDAPI/FUND/VIEW", "post", {FUND_CD: fundCd},
        function(data) {
            setComponent('#editForm', data.body);
            $('#editModal').modal('show');
        }
    );
}

// 저장
function fn_submit(formId) {
    let obj = gatherComponent(formId);
    logosAjax.requestToken(gToken,
        "${KiiPS_FD}/FDAPI/FUND/SAVE", "post", obj,
        function(data) {
            MESSAGE_HANDLE('save');
            $('#editModal').modal('hide');
            MAIN_SEARCH_FILTER();
        }
    );
}
</script>
```
