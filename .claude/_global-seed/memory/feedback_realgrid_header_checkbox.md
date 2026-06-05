---
name: RealGrid 컬럼 헤더 체크박스 표준
description: RealGrid 2.6.3에서 컬럼 헤더에 체크박스를 넣을 때 사용하는 header.template 패턴
type: feedback
originSessionId: 1e5632c8-73b9-4e10-b273-d9a074c423af
---
## 규칙

RealGrid 컬럼 헤더에 체크박스를 표시할 때는 `header.template` 속성에 KiiPS 표준 `checkbox-custom` HTML 문자열을 직접 주입한다. `onColumnHeaderClicked` + `setColumnProperty` 로 텍스트(`☑`)를 토글하는 방식은 금지.

```javascript
{ fieldName: "DOC_YN", editable: false, sortable: false,
  header: {
    text: "주주명부",
    template: "주주명부"
            + "<div class='checkbox-custom checkbox-default in-bl ml-1'>"
            +   "<input type='checkbox' data-id='' data-gbn='checkbox' onclick=\"toggleCol('DOC_YN')\" id='chk_DOC_YN'/>"
            +   "<label for='chk_DOC_YN'></label>"
            + "</div>"
  },
  renderer: { type: "icon", iconCallback: iconFormat, iconLocation: "center" }  // 또는 type:"check"
}
```

토글 함수는 전역 함수로 두고 `document.getElementById('chk_FIELD').checked` 를 직접 읽는다. 모달 재오픈 시 `cb.checked = false` 로 명시적 초기화 필요(DOM 잔존 방지).

**Why:** RealGrid 2.6.3 의 `setColumnProperty('header', {text: '☑ ...'})` 토글은 (1) 시각적으로 일반 체크박스 UI와 다르고, (2) 다크테마/CSS 일관성이 깨지며, (3) 클릭 영역이 모호하다. `header.template` 은 RealGrid 공식 속성이고 검증된 참조 구현이 다수 존재 (`COMM_POPUP_CHECKDUTY.jsp:73-84`, `IL0920.jsp` 첨부파일 모달).

**How to apply:** 컬럼 헤더에 체크박스가 필요한 경우 항상 `header.template` 패턴 사용. 클래스는 `checkbox-custom checkbox-default in-bl ml-1` 고정. 토글 함수는 전역 스코프에 선언. `editable:false` + `sortable:false` 필수 (정렬·에디터 폴백 차단).

**참조 구현:**
- 마스터 토글 (전체 행에 Y/N 일괄 적용): `COMM_POPUP_CHECKDUTY.jsp:73-84` + `setCheck()`
- 컬럼 선택 토글 + 셀 체크박스 통합: `IL/IL0920.jsp` 첨부파일 다운로드 모달
- 스킬 가이드: `kiips-realgrid-guide` SKILL.md "헤더 체크박스" 섹션

## 헤더 + 셀 통합 패턴 (시각적 일관성)

같은 컬럼에서 헤더와 셀 모두 체크박스를 쓸 때는 동일한 KiiPS 클래스를 사용하여 시각/다크모드 일관성을 확보한다.

```javascript
// 헤더 (header.template)
"<div class='checkbox-custom checkbox-default in-bl ml-1'>"
+ "<input type='checkbox' onclick=\"toggleCol('FIELD')\" id='chk_FIELD'/>"
+ "<label for='chk_FIELD'></label>"
+ "</div>"

// 셀 (renderer.callback) — type:"html" 사용, type:"icon"/"check" 금지
function cellRenderer(grid, cell){
    if (cell.value !== "Y") return "";  // 데이터 없으면 공란
    var id = "chk_" + cell.column.fieldName + "_" + cell.dataRow;
    return "<div class='checkbox-custom checkbox-default in-bl m-0'>"
        +    "<input type='checkbox' checked id='" + id + "'"
        +           " onclick=\"toggleCell(" + cell.dataRow + ",'" + cell.column.fieldName + "')\"/>"
        +    "<label for='" + id + "'></label>"
        + "</div>";
}

// 셀 토글 — dataProvider.setValue 사용 (grid.setValue 금지)
window.toggleCell = function(dataRow, field){
    var cur = dataProvider.getValue(dataRow, field);
    dataProvider.setValue(dataRow, field, cur === "Y" ? "N" : "Y");
};
```

핵심:
- 헤더 ID: `chk_<field>` / 셀 ID: `chk_<field>_<dataRow>` — 충돌 방지
- 헤더 spacing: `ml-1` (텍스트 옆) / 셀 spacing: `m-0` (셀 중앙)
- N(또는 미존재) 셀: 빈 문자열 반환 = 공란. unchecked 체크박스 렌더 금지(의미 모호)
