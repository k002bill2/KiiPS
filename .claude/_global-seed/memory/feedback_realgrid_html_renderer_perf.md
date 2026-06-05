---
name: RealGrid HTML 렌더러 성능 함정 + 모달 그리드 데이터 주입 타이밍
description: type:"html" 렌더러를 N×M 셀에 적용 시 렌더 지연 + Bootstrap 모달 그리드는 shown.bs.modal 후 데이터 주입
type: feedback
originSessionId: 1e5632c8-73b9-4e10-b273-d9a074c423af
---
## 규칙 1: HTML 렌더러는 셀 단위로 비싸다 — 다중 컬럼 적용 금지

`renderer: { type: "html", callback: ... }` 는 매 렌더마다 콜백을 호출해 DOM 문자열을 재생성한다. 7컬럼 × 12행 = 84회/렌더이고, 가상 스크롤·정렬·체크 토글 등 모든 그리드 이벤트마다 재호출된다. 시각적으로 "데이터가 안 나옴"으로 보일 정도로 느려진다.

대신 RealGrid native 렌더러 사용:
- 체크박스: `renderer: { type: "check", trueValues: "Y", falseValues: "N", useImages: true, editable: false }` + `onCellClicked`로 토글
- 아이콘: `renderer: { type: "icon", iconCallback: ... }`

**Why:** native 렌더러는 이미지 스프라이트 + canvas 기반이라 ~10배 빠르다. HTML 렌더러는 단일 셀에서만(예: 버튼 1개) 사용하고, 컬럼 단위/대량 적용 금지.

**How to apply:**
- 셀에 체크박스가 필요하면 `type:"check"` + `useImages:true` + `editable:false` + `onCellClicked` 토글
- 셀에 버튼/아이콘 같은 단일 요소면 `type:"html"` 또는 `type:"icon"`을 1~2 컬럼에 한정
- 헤더 체크박스는 `header.template` HTML 직접 주입 (1회 평가, 셀 렌더러와 무관하게 빠름)
- `onCellClicked` 핸들러에서 `clickData.cellType === 'data'` 가드 필수 (헤더/체크바 클릭 분리)

## 규칙 2: Bootstrap 모달 내부 RealGrid 데이터 주입은 shown.bs.modal 후

```javascript
function callPopup(){
    // 1. 폼 초기화
    $('#FORM_FIELD').val('').selectpicker('refresh');
    gridView.checkAll(false);
    // 2. 모달 표시
    $('#POP_MODAL').modal('show');
}
$('#POP_MODAL').on('shown.bs.modal', function(){
    // 3. 모달이 완전히 표시된 후 데이터 주입 — 그리드 레이아웃 안정화 보장
    dataProvider.clearRows();
    dataProvider.setRows(rows);
    gridView.refresh();
});
```

**Why:** 모달이 `display:none` 상태에서 `setRows + refresh` 호출 시, 그리드는 0×0 컨테이너에서 가상 스크롤 영역을 계산해 첫 행만 보이거나 빈 상태로 멈춘다. `shown.bs.modal` 이벤트는 fade 애니메이션 종료 후 발생하므로 그리드 컨테이너가 실제 픽셀 크기를 가진다.

**How to apply:** 모달 내부에 RealGrid가 있고 데이터를 동적 주입할 때는 항상 `shown.bs.modal` 이벤트 핸들러로 분리. `callXxx` 함수는 폼 초기화 + 모달 표시까지만, 데이터 주입은 shown 콜백.

**참조:** `IL/IL0920.jsp` 첨부파일 다운로드 모달 — 7컬럼 체크박스 그리드를 `type:"check"` + `shown.bs.modal` 로 처리하여 1행만 보이던 현상 해결.
