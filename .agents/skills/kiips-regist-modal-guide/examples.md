# Registration Modal Guide - 실전 예제

## 예제 1: 단순 폼 모달 (그리드 없음)

- 모달 HTML: `sectionBox` > `edu_flex` > `form-group`
- 저장: `gatherComponent` -> `logosAjax`
- 참조: 일반적인 설정/등록 화면

```html
<div class="modal fade" id="settingModal" aria-hidden="true"
     style="display: none; z-index: 1060;"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="settingForm">
                <section class="card">
                    <header class="card-header">
                        <h1 class="card-title">설정 등록
                            <div class="card-actions">
                                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                                   data-dismiss="modal"></a>
                            </div>
                        </h1>
                    </header>
                    <input type="hidden" data-id="SETTING_ID" data-gbn="txt">
                    <div class="card-body px-5 py-4">
                        <div class="sectionBox">
                            <div class="edu_flex">
                                <div class="form-group new row">
                                    <div class="col-sm-6 col-lg-4">
                                        <label class="control-label">설정명</label>
                                        <input type="text" class="form-control"
                                               data-gbn="txt" data-id="SETTING_NM"
                                               name="SETTING_NM" />
                                    </div>
                                    <div class="col-sm-6 col-lg-4">
                                        <label class="control-label">적용일</label>
                                        <input type="text" class="form-control flatpickr-basic"
                                               data-gbn="date" data-id="APPLY_DT"
                                               placeholder="YYYY-MM-DD" name="APPLY_DT" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bottom-btn">
                            <button type="button" class="btn btn-primary font-weight-semibold btn-py-2 px-4 modal-confirm isEditable"
                                    onclick="fn_submit('#settingForm')">저장</button>
                            <button type="reset" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss"
                                    data-dismiss="modal">닫기</button>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    </div>
</div>
```

---

## 예제 2: 단일 그리드 모달

- 모달 HTML: `sectionBox` > `flex-row(제목+행추가/삭제)` > 그리드 div
- 그리드: `createEditGrid` + 행추가/삭제 버튼
- 참조: IL0927 기존 주간보고 registModal

```javascript
// 그리드 초기화
let columnsReport = [
    { fieldName: "SEQ", width: "0", header: {text: "순번"}, editable: false, visible: false }
    ,{ fieldName: "REPORT_ITEM", width: "200", header: {text: "보고항목"}, editable: true }
    ,{ fieldName: "REPORT_CONTENT", width: "400", header: {text: "보고내용"}, editable: true,
       styleName: "multiline-editor left-column", editor: {type: "multiline", altEnterNewLine: true} }
];

let dpReport = new RealGrid.LocalDataProvider(true);
let gvReport = new RealGrid.GridView("TB_REPORT_GRID");
createEditGrid("TB_REPORT_GRID", dpReport, gvReport, columnsReport);
gvReport.setRowIndicator({visible: true});
gvReport.editOptions.movable = true;
gvReport.editOptions.appendable = false;
gvReport.displayOptions.fitStyle = "none";
gvReport.displayOptions.syncGridHeight = "always";
```

---

## 예제 3: 다중 그리드 + columnGroup 모달

- 모달 HTML: 2+ sectionBox, 각각 그리드 포함
- 그리드: `setColumnLayout` + `header.heights = [40, 40]`
- 참조: IL0927 사후보고서 postRptRegistModal, IL0903 분기보고

```javascript
// columnGroup 활용 예: 재무상태표
let columnsFinance = [
    { fieldName: "INV_COMP_NM", width: "120", header: {text: "투자기업명"}, editable: false }
    ,{ fieldName: "CUR_AST_BF", width: "90", header: {text: "전기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
    ,{ fieldName: "CUR_AST_AF", width: "90", header: {text: "당기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
    ,{ fieldName: "NCUR_AST_BF", width: "90", header: {text: "전기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
    ,{ fieldName: "NCUR_AST_AF", width: "90", header: {text: "당기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
];

var layoutFinance = [
    "INV_COMP_NM"
    ,{ name: "유동자산", direction: "horizontal",
       header: { text: "유동자산" },
       items: ["CUR_AST_BF", "CUR_AST_AF"] }
    ,{ name: "비유동자산", direction: "horizontal",
       header: { text: "비유동자산" },
       items: ["NCUR_AST_BF", "NCUR_AST_AF"] }
];

createEditGrid("TB_FINANCE", dpFinance, gvFinance, columnsFinance);
gvFinance.setColumnLayout(layoutFinance);
gvFinance.header.heights = [40, 40];
gvFinance.setCheckBar({visible: false});
```
