---
name: kiips-checklist-list-popup
description: "KiiPS 체크리스트 목록 팝업 표준 패턴 - 아이콘 버튼 바(등록/결재/삭제/인쇄/엑셀) + RealGrid 목록 + 셀 더블클릭으로 상세팝업/결재팝업 분기. 기준: COMM_POPUP_CHECKLIST_AF_IMM.jsp. Use when: 체크리스트 목록 조회 팝업, 작성일/작성자/수정일시/결재 컬럼, 목록 팝업, list popup, checklist popup"
---

# KiiPS Checklist List Popup Pattern

체크리스트 목록을 조회·관리하는 팝업의 표준 패턴입니다. 기준 파일: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/COM/COMM_POPUP_CHECKLIST_AF_IMM.jsp` (인수금융 체크리스트).

---

## 1. 언제 사용하는가

- 같은 투자건/거래건에 대해 **여러 체크리스트 작성 이력**을 목록으로 보여줄 때
- 각 이력은 **작성일 / 작성자 / 수정일시 / 결재상태** 4가지 공통 속성을 가짐
- 셀 더블클릭으로 **상세 저장/조회 팝업** 또는 **결재 조회 팝업** 으로 진입
- 상단 아이콘 바로 **등록 / 결재상신 / 삭제 / 인쇄 / 엑셀** 수행

이 패턴은 "조회+작성+결재+인쇄+엑셀"을 한 팝업에 집약하는 KiiPS 표준 목록 팝업 구조입니다.

---

## 2. 구조 개요

```
┌── section.card ───────────────────────────────────────────────┐
│ header.card-header.form-inline                                │
│   h2.card-title  "체크리스트명"                                │
│   span#CUST_NM   (투자기업명 등 부제목)                        │
├───────────────────────────────────────────────────────────────┤
│ div.card-body.px-5.py-4                                       │
│   div.form-group.row.jce.gap3x   ← 아이콘 버튼 바 (오른쪽 정렬)│
│     [+]  [결재상신]  [🗑]  [🖨]  [📊Excel]                    │
│                                                               │
│   div.form-group.row    ← 그리드                              │
│     div#TB_IL01205                                            │
│                                                               │
│   div.bottom-btn        ← 닫기 버튼                           │
│     button.btn-outline-secondary                              │
└───────────────────────────────────────────────────────────────┘
```

---

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

## 4. RealGrid 컬럼 표준

```javascript
let column = [
    // 숨김 키 컬럼 (상세조회/삭제용)
      { fieldName : "INVTEX_SEQ",          visible : false }
    , { fieldName : "INVTEX_BEF_CHK_TPCD", visible : false }
    , { fieldName : "CHK_SEQ",             visible : false }
    , { fieldName : "CMBT_CUST_NO",        visible : false }

    // 표시 컬럼
    , { fieldName : "FST_EXAN_DT", width : "100",
        header : { text : strMessage("작성일") },
        editable : false,
        renderer : {
            type : "html",
            callback : function(grid, cell, w, h) {
                return StringUtil.toDate(cell.value, "-");  // YYYYMMDD -> YYYY-MM-DD
            }
        }
      }
    , { fieldName : "CUST_NM",  width : "80",  header : { text : strMessage("작성자") },  editable : false }
    , { fieldName : "MODY_DTM", width : "130", header : { text : strMessage("수정일시") }, editable : false }
    , { fieldName : "DSCP",     width : "80",  header : { text : strMessage("결재") },     editable : false }

    // 결재용 숨김 컬럼
    , { fieldName : "APRV_STAT_TPCD",         visible : false }
    , { fieldName : "ERP_ELEC_APRV_IHRT_NO",  visible : false }
    , { fieldName : "MAK_EMP_CUST_NO",        visible : false }
];

let dataProvider = new RealGrid.LocalDataProvider(true);
let gridView     = new RealGrid.GridView("TB_IL01205");
createSimpleEditGrid("TB_IL01205", dataProvider, gridView, column);
gridView.setFooters({ visible : false });
$(eval("TB_IL01205")).css({ 'height' : '130px' });
```

### 컬럼 규칙

1. **text-center 금지** — RealGrid 기본 중앙정렬이므로 styleName 생략(프로젝트 메모리)
2. **날짜 포맷** — `FST_EXAN_DT`는 DB에 YYYYMMDD로 저장 → `renderer.callback`에서 `StringUtil.toDate(value, "-")`로 변환
3. **숨김 키 컬럼 선배치** — 상세조회/삭제/결재 요청에 필요한 INVTEX_SEQ, CHK_SEQ 등은 항상 숨김 보유
4. **결재 분기 컬럼** — `APRV_STAT_TPCD`(결재상태코드), `ERP_ELEC_APRV_IHRT_NO`(결재고유번호) 필수
5. **그리드 높이** — 목록 2~5건 예상 시 `130px~200px` 고정

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

---

## 6. API 네이밍 규칙

| 기능 | URL 패턴 | Method | 예시 |
|------|----------|--------|------|
| 목록 조회 | `/ILAPI/IL0120/CHK/LIST` | POST | 공통 목록 엔드포인트 |
| 상세 조회 | `/ILAPI/IL0120/{DOMAIN}/VIEW` | POST | `/AF/VIEW`, `/DD/VIEW` |
| 등록 | `/ILAPI/IL0120/{DOMAIN}/SAVE` | POST | `/AF/SAVE` |
| 수정 | `/ILAPI/IL0120/{DOMAIN}/UPDATE` | POST | `/AF/UPDATE` |
| 삭제 | `/ILAPI/IL0120/{DOMAIN}/DEL` | POST | `/AF/DEL` |

{DOMAIN}은 체크리스트 약어(AF=인수금융, DD=Due Diligence, ESG, LAW, AA 등).

---

## 7. 결재상태코드 (APRV_STAT_TPCD) 처리 매트릭스

| 코드 | 의미 | 삭제 가능 | 결재 상신 가능 |
|------|------|----------|--------------|
| (null) | 미결재 | O | O |
| 2 | 진행 | X | X(진행 중) |
| 4 | 완료 | X | X(이미 완료) |
| 8 | 임시 | X | - |
| 10 | 수신 | X | - |

**필수 검증 로직** — 삭제 시 `2/4/8/10`은 `결재_삭제불가_INFO` 메시지로 차단, 결재 상신 시 `2/4`는 각각 `결재_진행_INFO`/`결재_완료_INFO`로 차단.

---

## 8. 체크리스트 유형별 카탈로그 (참고)

| 유형 코드 | 명칭 | 도메인 약어 | 샘플 파일 |
|----------|------|------------|----------|
| 40 | 인수금융 체크리스트 | AF | COMM_POPUP_CHECKLIST_AF_IMM.jsp |
| 43 | 투자계약서 점검 | IACHK | COMM_POPUP_CHECKLIST_IACHK.jsp |
| (그 외) | DD/ESG/LAW/AA | DD/ESG/LAW/AA | COMM_POPUP_CHECKLIST_*.jsp |

신규 체크리스트 목록 팝업을 만들 때는 본 스킬의 템플릿을 복사 → 유형 코드·도메인 약어만 치환하면 됩니다.

---

## 9. 체크리스트 (작성 전 확인)

- [ ] 헤더는 `section.card` + `header.card-header.form-inline` 사용
- [ ] 아이콘 버튼 바는 `form-group.row.jce.gap3x` + `btn-only-icon.btn-xl.btn-outline-primary`
- [ ] 아이콘은 `<span class="icon_*">` (FontAwesome 사용 금지)
- [ ] 그리드 컬럼에 INVTEX_SEQ / CHK_SEQ / APRV_STAT_TPCD / ERP_ELEC_APRV_IHRT_NO 숨김 포함
- [ ] 작성일은 `StringUtil.toDate(cell.value, "-")` 포맷 렌더러
- [ ] `setFooters({visible:false})` + 그리드 높이 고정(130~200px)
- [ ] 셀 더블클릭: 결재행/결재데이터 존재 시 POP_APPRV, 아니면 상세팝업
- [ ] 삭제: `APRV_STAT_TPCD in (2,4,8,10)` 차단 로직
- [ ] 결재 상신: 단건 선택 강제 + `APRV_STAT_TPCD in (2,4)` 차단
- [ ] `reload_Parent()` / `arrpovalReportcallBack()` 구현
- [ ] `closeCurrentWindow()` 닫기 버튼

---

## 10. 금지 사항

- ❌ `<i class="fa fa-*">` — KiiPS는 자체 아이콘 폰트 사용
- ❌ `text-center` styleName — RealGrid 기본 중앙정렬(피드백 메모리)
- ❌ 인라인 `style="background-color:*"` — 다크테마 오버라이드 깨짐(피드백 메모리)
- ❌ `btn-close` / Bootstrap `.close` 클래스 — 모달 close는 `card-action.card-action-dismiss.modal-dismiss`(피드백 메모리)
- ❌ 결재 진행/완료 레코드의 삭제 허용
- ❌ 목록에서 체크 없이 결재상신/삭제/인쇄/엑셀 실행
