# KiiPS Checklist List Popup — HTML 템플릿 & 이벤트 핸들러 코드

## 3. HTML 템플릿

```jsp
<!-- {체크리스트명} 모달 시작 -->
<div id="modalForm1">
    <section class="card">
        <header class="card-header form-inline">
            <h2 class="card-title">{체크리스트명}</h2>
            <span class="control-label ml-3 text-sm text-primary" id="CUST_NM"></span>
        </header>
        <div class="card-body px-5 py-4">

            <!-- 아이콘 버튼 바 (오른쪽 정렬) -->
            <div class="form-group row jce gap3x">
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary"
                        data-toggle="tooltip" data-placement="top"
                        title="<spring:message code='WRD_등록'/>"
                        onclick="saveChkBtn()"><span class="icon_plus"></span></button>
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                        data-toggle="tooltip" data-placement="top"
                        title="<spring:message code='WRD_결재_상신'/>"
                        onclick="fnApprv()"><span class="icon_approv"></span></button>
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary"
                        data-toggle="tooltip" data-placement="top"
                        title="<spring:message code='WRD_삭제'/>"
                        onclick="fnDelete()"><span class="icon_trash"></span></button>
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                        data-toggle="tooltip" data-placement="top"
                        title="<spring:message code='WRD_인쇄'/>"
                        onclick="callRD()"><span class="icon_print"></span></button>
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                        data-toggle="tooltip" data-placement="top"
                        title="<spring:message code='WRD_엑셀'/>"
                        onclick="fnExcelDown()"><span class="icon_excel"></span></button>
            </div>

            <!-- 그리드 -->
            <div class="form-group row p-relative">
                <div id="TB_IL01205"></div>
            </div>

            <!-- 닫기 -->
            <div class="bottom-btn">
                <button type="button"
                        class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-confirm"
                        data-dismiss="modal" onclick="closeCurrentWindow()">
                    <spring:message code="WRD_닫기"/>
                </button>
            </div>

        </div>
    </section>
</div>
```

### 핵심 클래스 레퍼런스

| 영역 | 클래스 | 역할 |
|------|--------|------|
| 섹션 | `section.card` | 팝업 프레임 |
| 헤더 | `card-header.form-inline` | 제목+부제목 가로배치 |
| 제목 | `h2.card-title` | 체크리스트명 |
| 부제목 | `text-sm.text-primary` | 투자기업명 등 |
| 버튼 바 | `form-group.row.jce.gap3x` | justify-content-end + 간격 |
| 아이콘 버튼 | `btn.btn-only-icon.btn-xl.btn-outline-primary` | 아이콘 전용 대형 버튼 |
| 하단 버튼 | `bottom-btn` | 닫기 영역(중앙/우측 정렬) |

### 아이콘 SPAN 매핑

| 기능 | 아이콘 클래스 |
|------|--------------|
| 등록 | `icon_plus` |
| 결재 상신 | `icon_approv` |
| 삭제 | `icon_trash` |
| 인쇄 | `icon_print` |
| 엑셀 | `icon_excel` |
| 복사 | `icon_copy` (필요 시) |

> 주의: KiiPS는 FontAwesome이 아닌 **자체 icon_ 폰트 클래스**를 사용합니다. `<i class="fa fa-*">` 대신 `<span class="icon_*">` 사용.

---

## 5. 이벤트 핸들러 표준

### 5.1 셀 더블클릭 분기

```javascript
gridView.onCellDblClicked = function(grid, clickData) {
    let rowData = grid.getValues(clickData.itemIndex);

    // 결재 행 또는 결재 데이터 존재 시 → 결재 조회 팝업
    if ((clickData.column == "DSCP" || rowData.APRV_STAT_TPCD != null)
        && rowData.ERP_ELEC_APRV_IHRT_NO) {
        POP_APPRV({ ERP_ELEC_APRV_IHRT_NO : rowData.ERP_ELEC_APRV_IHRT_NO });
        return;
    }

    // 일반 행 → 상세 팝업 호출 (서버에서 detail 조회 후 팝업 open)
    let requestData = {
        INVTEX_SEQ          : rowData.INVTEX_SEQ,
        INVTEX_BEF_CHK_TPCD : rowData.INVTEX_BEF_CHK_TPCD,
        CHK_SEQ             : rowData.CHK_SEQ
    };
    logosAjax.requestToken(gToken, "${KiiPS_IL}/ILAPI/IL0120/AF/VIEW", "post", requestData,
        function(data) {
            let param = {
                LIST               : data.body,
                GBN                : 'VIEW',
                INVTEX_SEQ         : rowData.INVTEX_SEQ,
                INVTEX_BEF_CHK_TPCD: rowData.INVTEX_BEF_CHK_TPCD,
                CHK_SEQ            : rowData.CHK_SEQ,
                CMBT_CUST_NO       : rowData.CMBT_CUST_NO,
                CUST_NM            : DATA.CUST_NM,
                CUST_NO            : DATA.CUST_NO,
                APRV_STAT_TPCD     : rowData.APRV_STAT_TPCD,
                MENU_ID            : DATA.MENU_ID,
                PARENT_NUM         : 2
            };
            COMM_POPUP_NEW('${KiiPS_GATE}', 'CHECKAF_IMM', param, '1400', '1000');
        }
    );
};
```

### 5.2 등록 버튼

```javascript
function saveChkBtn(){
    let param = {
        INVTEX_SEQ          : DATA.INVTEX_SEQ,
        GBN                 : 'SAVE',
        INVTEX_BEF_CHK_TPCD : '40',                // 체크리스트 유형 코드
        CMBT_CUST_NO        : (DATA.CMBT_CUST_NO || '000'),
        CUST_NM             : DATA.CUST_NM,
        CUST_NO             : DATA.CUST_NO,
        PARENT_NUM          : 2,
        CORP_PRJT_INVT_TPCD : DATA.CORP_PRJT_INVT_TPCD,
        CHI_WALL_TPCD       : DATA.CHI_WALL_TPCD,
        INVTEX_LVL_TPCD     : DATA.INVTEX_LVL_TPCD
    };
    COMM_POPUP_NEW('${KiiPS_GATE}', 'CHECKAF_IMM', param, '1400', '1000');
}
```

### 5.3 삭제 버튼

```javascript
function fnDelete(){
    let items = gridView.getCheckedItems();
    if (items.length == 0) { MESSAGE_HANDLE('delete_no_select'); return; }

    // 결재 진행/완료 데이터는 삭제 불가
    for (let i = 0; i < items.length; i++) {
        let s = gridView.getValue(items[i], 'APRV_STAT_TPCD');
        if (s == '2' || s == '4' || s == '8' || s == '10') {
            MESSAGE_HANDLE(strMessage("결재_삭제불가_INFO"));
            return false;
        }
    }
    if (MESSAGE_HANDLE_CONFIRM('del')) return;

    let TB_IL5001M_DEL = items.map(idx => ({
        INVTEX_SEQ          : gridView.getValue(idx, "INVTEX_SEQ"),
        INVTEX_BEF_CHK_TPCD : gridView.getValue(idx, "INVTEX_BEF_CHK_TPCD"),
        CHK_SEQ             : gridView.getValue(idx, "CHK_SEQ"),
        CMBT_CUST_NO        : gridView.getValue(idx, "CMBT_CUST_NO")
    }));

    logosAjax.requestToken(gToken, "${KiiPS_IL}/ILAPI/IL0120/AF/DEL", "post",
        { TB_IL5001M_DEL : TB_IL5001M_DEL },
        function() {
            MESSAGE_HANDLE('save', '', '');
            reload_Parent();
        }
    );
}
```

### 5.4 결재 상신

```javascript
function fnApprv(){
    let items = gridView.getCheckedItems();
    if (items.length <= 0)   { MESSAGE_HANDLE(strMessage("결재_선택_INFO"));   return; }
    if (items.length > 1)    { MESSAGE_HANDLE(strMessage("WRD_결재_단건_INFO") + " " + strMessage("데이터_단건선택_INFO")); return; }

    let row = gridView.getValues(items[0]);
    if (row.APRV_STAT_TPCD == '4') { MESSAGE_HANDLE(strMessage("결재_완료_INFO")); return; }
    if (row.APRV_STAT_TPCD == '2') { MESSAGE_HANDLE(strMessage("결재_진행_INFO")); return; }

    logosAjax.requestToken(gToken, "${KiiPS_IL}/ILAPI/IL0120/AF/VIEW", "post",
        { INVTEX_SEQ : row.INVTEX_SEQ, INVTEX_BEF_CHK_TPCD : row.INVTEX_BEF_CHK_TPCD, CHK_SEQ : row.CHK_SEQ },
        function(data) {
            let aprvData = {
                rowData         : data.body,
                doc_id          : '<%= Constant.결재_연계_인수금융체크리스트_IMM %>',
                doc_nm          : '인수금융 체크리스트',
                doc_tit         : '인수금융 체크리스트',
                out_gbn         : 'CHECKLIST_AF_IMM',
                CHK_SEQ         : row.CHK_SEQ,
                INVTEX_LVL_TPCD : DATA.INVTEX_LVL_TPCD,
                INVTEX_SEQ      : DATA.INVTEX_SEQ,
                CUST_NO         : DATA.CUST_NO,
                CUST_NM         : DATA.CUST_NM,
                url             : '${KiiPS_IL}'
            };
            COMM_POPUP_NEW('${KiiPS_GATE}', 'APPR', aprvData, 1890, 940);
        }
    );
}
```

### 5.5 목록 조회 & reload_Parent

```javascript
function getData(){
    logosAjax.requestToken(gToken, "${KiiPS_IL}/ILAPI/IL0120/CHK/LIST", "post",
        { INVTEX_SEQ : DATA.INVTEX_SEQ, INVTEX_BEF_CHK_TPCD : '40' },
        function(data) {
            dataProvider.setRows(data.body);
            gridView.refresh();
        }
    );
}

function reload_Parent(){
    getData();                                                      // 본 팝업 재조회
    if (DATA.MENU_ID == 'IL0120') window.opener.MAIN_SEARCH_FILTER();
    else                          window.opener.location.reload();
}

$(document).ready(function(){
    getData();
    $('#CUST_NM').html(DATA.CUST_NM);
});

// 결재 후 콜백 — 표준 시그니처
function arrpovalReportcallBack() {
    if (window.opener && !window.opener.closed) {
        if (typeof window.opener.MAIN_SEARCH_FILTER === 'function') {
            window.opener.MAIN_SEARCH_FILTER();
        } else if (typeof window.opener.arrpovalReportcallBack === 'function') {
            window.opener.arrpovalReportcallBack();
        }
    }
    getData();
}
```
