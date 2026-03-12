---
name: kiips-regist-modal-guide
description: "KiiPS 등록/수정 모달 종합 가이드 - 모달 HTML, 폼필드, 편집그리드, columnGroup 머지, 저장 패턴"
---

# KiiPS Registration Modal Guide

KiiPS 등록/수정 모달의 표준 패턴입니다. 단순 폼, 단일 그리드, 다중 그리드 + columnGroup 머지까지 모든 유형을 다룹니다.

---

## Part 1: 기본 모달 구조

### 표준 HTML 래퍼
```html
<!-- {모달명} 모달 S -->
<div class="modal fade" id="{modalId}" aria-hidden="true"
     style="display: none; z-index: 1060;"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog {modal-size}">
        <!-- modal-size: modal-sm | modal-lg | modal-xl | modal-xxl -->
        <div class="modal-content">
            <form id="{formId}">
                <section class="card">
                    <header class="card-header">
                        <h1 class="card-title">{모달 제목}
                            <div class="card-actions">
                                <a href="#" class="card-action card-action-dismiss modal-dismiss"
                                   data-dismiss="modal"></a>
                            </div>
                        </h1>
                    </header>
                    <!-- hidden fields -->
                    <input type="hidden" data-id="{KEY_FIELD}" data-gbn="txt">

                    <div class="card-body px-5 py-4">
                        <!-- 폼 필드 + 그리드 영역 -->

                        <!-- 하단 버튼 -->
                        <div class="bottom-btn">
                            <button type="button" class="btn btn-primary font-weight-semibold btn-py-2 px-4 modal-confirm isEditable"
                                    onclick="fn_submit('#{formId}')">저장</button>
                            <button type="reset" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss"
                                    data-dismiss="modal">닫기</button>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    </div>
</div>
<!-- {모달명} 모달 E -->
```

### 필수 체크리스트
- `data-backdrop="static"` - 외부 클릭 닫기 방지
- `data-keyboard="false"` - ESC 키 닫기 방지
- `z-index: 1060` - 다른 모달 위에 표시
- `bottom-btn` div - 저장/닫기 버튼 영역
- `modal-dismiss` class - X 버튼과 닫기 버튼

---

## Part 2: 폼 필드 패턴

### sectionBox + edu_flex 레이아웃
```html
<div class="sectionBox">
    <div class="edu_flex">
        <div class="form-group new row">
            <!-- 날짜 필드 -->
            <div class="col-sm-6 col-lg-4">
                <label class="control-label">기준일</label>
                <input type="text" class="form-control flatpickr-basic"
                       data-gbn="date" data-id="BASE_DT"
                       placeholder="YYYY-MM-DD" name="BASE_DT" />
            </div>
            <!-- 셀렉트 필드 -->
            <div class="col-sm-6 col-lg-4">
                <label class="control-label">작성자</label>
                <select id="{SELECT_ID}" class="selectpicker show-tick form-control"
                        data-hide-disabled="true" data-gbn="select"
                        data-id="{FIELD_NAME}" name="{FIELD_NAME}"
                        multiple data-max-options="1"></select>
            </div>
        </div>
    </div>
</div>
```

### 필드 타입 참조
| 타입 | data-gbn | class | 비고 |
|------|----------|-------|------|
| 텍스트 | `txt` | `form-control` | |
| 날짜 | `date` | `form-control flatpickr-basic` | placeholder 필수 |
| 셀렉트 | `select` | `selectpicker show-tick form-control` | `data-max-options` |
| 텍스트영역 | `text` | `form-control` | `data-plugin-textarea-autosize` |
| 히든 | `txt` | - | `type="hidden"` |

---

## Part 3: 단일 편집 그리드 모달

### 그리드 + 행 조작 버튼
```html
<div class="sectionBox">
    <div class="flex-row">
        <h2 class="modalH2">{섹션 제목}</h2>
        <div class="datable_button2 flex-fill jce p-0">
            <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                    onclick="myCreateFunction(gridView{X})" data-toggle="tooltip" title="행추가">
                <span class="icon_addRow"></span>
            </button>
            <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                    onclick="myDeleteFunction(gridView{X},dataProvider{X})" data-toggle="tooltip" title="행삭제">
                <span class="icon_delRow"></span>
            </button>
        </div>
    </div>
    <div id="TB_{GRID_ID}" data-id="dataProvider{X}" data-gbn="table"
         data-provider-id="dataProvider{X}"></div>
</div>
```

### 그리드 초기화 (JavaScript)
```javascript
let columns{X} = [
    { fieldName: "SEQ", width: "0", header: {text: "순번"}, editable: false, visible: false }
    ,{ fieldName: "FIELD_1", width: "200", header: {text: "컬럼1"}, editable: true }
    ,{ fieldName: "FIELD_2", width: "300", header: {text: "컬럼2"}, editable: true,
       styleName: "multiline-editor left-column", editor: {type: "multiline", altEnterNewLine: true} }
];

let dataProvider{X} = new RealGrid.LocalDataProvider(true);
let gridView{X} = new RealGrid.GridView("TB_{GRID_ID}");
createEditGrid("TB_{GRID_ID}", dataProvider{X}, gridView{X}, columns{X});
gridView{X}.setRowIndicator({visible: true});
gridView{X}.editOptions.movable = true;
gridView{X}.editOptions.appendable = false;
gridView{X}.displayOptions.fitStyle = "none";
gridView{X}.displayOptions.syncGridHeight = "always";
```

---

## Part 6: 모달 데이터 바인딩

### 조회 -> mapPage + setRows
```javascript
function loadDetail(obj) {
    logosAjax.requestToken(
        gToken,
        "${KiiPS_IL}/ILAPI/{SCREEN}/DETAIL",
        "post",
        obj,
        function (data) {
            const isRegist = Object.values(data.body).every(
                arr => Array.isArray(arr) && arr.length === 0
            );

            if (!isRegist) {
                mapPage('#{formId}', data.body.VIEW_M[0]);
                dataProvider{1}.setRows(data.body.LIST_1);
                gridView{1}.refresh();
            } else {
                mapPage('#{formId}', obj);
            }

            $('#{modalId}').modal('show');
        }
    );
}
```

### gatherComponent -> 저장 데이터 수집
```javascript
let obj = gatherComponent('#{formId}');
obj.LIST_1 = obj.dataProvider{1};
delete obj.dataProvider{1};
```

---

## Part 7: Validate + Submit 패턴

### jQuery Validate + gatherComponent + logosAjax
```javascript
const validator = $("#{formId}").validate({
    ignore: ".ignore"
    ,rules: {
        BASE_DT: { required: true }
    }
    ,submitHandler: function(form) {
        gridView{1}.commit(true);

        let obj = gatherComponent('#{formId}');
        obj.LIST_1 = obj.dataProvider{1};
        delete obj.dataProvider{1};

        logosAjax.requestToken(
            gToken
            , "${KiiPS_IL}/ILAPI/{SCREEN}/SAVE"
            , "post"
            , obj
            , function(data) {
                MESSAGE_HANDLE('save');
                $('#{modalId}').modal('hide');
                MAIN_SEARCH_FILTER();
            }
        );
    }
});

function fn_submit(id) {
    if (!MESSAGE_HANDLE_CONFIRM('save')) {
        $(id).valid();
        $(id).submit();
    }
}
```

---

## Part 8: 모달 이벤트

### hide.bs.modal - 닫기 시 초기화
```javascript
$('#{modalId}').on('hide.bs.modal', function(e) {
    gridView{1}.cancel();
    initComponent('#{modalId}');
    dataProvider{1}.clearRows();
});
```

---

## 체크리스트

### 모달 생성 시 필수 확인
- [ ] 모달 ID 고유성 확인 (페이지 내 중복 없음)
- [ ] `data-backdrop="static"` 설정
- [ ] `z-index: 1060` 이상
- [ ] `bottom-btn` div 포함 (저장 + 닫기)
- [ ] `hide.bs.modal` 이벤트에서 `initComponent` + `clearRows` 호출
- [ ] `form` 태그에 ID 부여 + `validate()` 연결
- [ ] hidden 필드로 키 값 전달 (`data-gbn="txt"`)
- [ ] `gatherComponent` 결과에서 그리드 데이터 분리 (`delete obj.dataProvider{X}`)
- [ ] columnGroup 사용 시 `header.heights = [40, 40]` 설정
- [ ] `selectpicker` 사용 시 `selectpicker('refresh')` 호출

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
