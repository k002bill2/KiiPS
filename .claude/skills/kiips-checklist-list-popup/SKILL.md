---
name: kiips-checklist-list-popup
description: "KiiPS 체크리스트 목록 조회·관리 팝업의 표준 패턴 (기준: COMM_POPUP_CHECKLIST_AF_IMM.jsp). 아이콘 버튼 바(등록/결재/삭제/인쇄/엑셀)·RealGrid 목록·셀 더블클릭 상세/결재 분기 포함. Use when: 체크리스트 목록 조회 팝업, 작성일/작성자/수정일시/결재 컬럼, checklist popup. NOT for: 체크리스트와 무관한 일반 목록/그리드 팝업(use kiips-realgrid-guide / kiips-regist-modal-guide)"
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

## 사용하지 말아야 할 때

체크리스트와 무관한 일반 목록 팝업에는 사용 금지 — 본 스킬은 체크리스트(작성일/작성자/결재 컬럼) 목록 팝업 전용. 단순 그리드 팝업은 kiips-realgrid-guide, 등록/수정 모달은 kiips-regist-modal-guide 참조.

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

## 관련 파일

- [examples.md](./examples.md) — HTML 템플릿(§3), 이벤트 핸들러 표준 코드(§5)
- [reference.md](./reference.md) — API 네이밍 규칙(§6), 결재상태코드 처리 매트릭스(§7), 체크리스트 유형별 카탈로그(§8)

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
