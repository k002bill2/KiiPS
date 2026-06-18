# Registration Modal Guide - 상세 레퍼런스

## 다중 그리드 모달 (2+ 그리드)

### 패턴: sectionBox로 각 그리드 분리
```html
<div class="card-body px-5 py-4">
    <!-- 폼 필드 -->
    <div class="sectionBox">...</div>

    <!-- 그리드 1 -->
    <div class="sectionBox">
        <div class="flex-row">
            <h2 class="modalH2">재무상태표</h2>
            <div class="table_info flex-fill"><span>(단위 : 백만원)</span></div>
            <div class="datable_button2 jce p-0">
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary"
                        onclick="loadFinancialData()" title="불러오기">
                    <span class="icon_paste"></span>
                </button>
            </div>
        </div>
        <div id="TB_{GRID1_ID}" data-id="dataProvider{1}" data-gbn="table"
             data-provider-id="dataProvider{1}"></div>
    </div>

    <!-- 그리드 2 -->
    <div class="sectionBox">
        <div class="flex-row">
            <h2 class="modalH2">재무비율</h2>
            <div class="datable_button2 flex-fill jce p-0">
                <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary"
                        onclick="toggleDirectInput()" title="직접입력">
                    <span class="icon_edit"></span>
                </button>
            </div>
        </div>
        <div id="TB_{GRID2_ID}" data-id="dataProvider{2}" data-gbn="table"
             data-provider-id="dataProvider{2}"></div>
    </div>

    <div class="bottom-btn">...</div>
</div>
```

### 참조 파일
- `IL0927.jsp` - 재무상태표 + 재무비율 2그리드 모달
- `IL0903.jsp` - 6그리드 분기보고 모달

---

## columnGroup 헤더 머지

### setColumnLayout + direction: horizontal
전기/당기, 분기별 등 서브컬럼을 그룹 헤더 아래에 배치합니다.

```javascript
// 1. 컬럼 정의 - 서브컬럼의 header.text는 "전기", "당기" 등
let columns = [
    { fieldName: "INV_COMP_NM", width: "120", header: {text: "투자기업명"}, editable: false }
    ,{ fieldName: "CUR_AST_BF", width: "90", header: {text: "전기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
    ,{ fieldName: "CUR_AST_AF", width: "90", header: {text: "당기"}, editable: true,
       numberFormat: "#,##0", styleName: "right-column", dataType: "number" }
    // ... 나머지 컬럼들
];

// 2. 레이아웃 정의 - columnGroup으로 상위 헤더 생성
var layout = [
    "INV_COMP_NM"   // 단일 컬럼은 문자열로
    ,{ name: "유동자산", direction: "horizontal",
       header: { text: "유동자산" },
       items: ["CUR_AST_BF", "CUR_AST_AF"] }
    ,{ name: "비유동자산", direction: "horizontal",
       header: { text: "비유동자산" },
       items: ["NCUR_AST_BF", "NCUR_AST_AF"] }
    // ... 나머지 그룹들
];

// 3. 그리드 생성 후 레이아웃 적용
createEditGrid("TB_GRID", dataProvider, gridView, columns);
gridView.setColumnLayout(layout);    // 레이아웃 적용
gridView.header.heights = [40, 40];  // 2단 헤더 높이 설정
gridView.setCheckBar({visible: false});
```

### 주의사항
- `items` 배열의 문자열은 **fieldName**과 일치해야 함
- `direction: "horizontal"` -> 서브컬럼이 수평 배치
- `header.heights`를 `[40, 40]`으로 설정해야 2단 헤더가 올바르게 표시

---

## 다중 그리드 데이터 바인딩

### 조회 -> mapPage + 다중 setRows
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
                dataProvider{2}.setRows(data.body.LIST_2);
                gridView{2}.refresh();
            } else {
                mapPage('#{formId}', obj);
            }

            $('#{modalId}').modal('show');
        }
    );
}
```

### 다중 그리드 gatherComponent
```javascript
let obj = gatherComponent('#{formId}');
obj.LIST_1 = obj.dataProvider{1};
obj.LIST_2 = obj.dataProvider{2};
delete obj.dataProvider{1};
delete obj.dataProvider{2};
```

### 다중 그리드 hide.bs.modal
```javascript
$('#{modalId}').on('hide.bs.modal', function(e) {
    gridView{1}.cancel();
    gridView{2}.cancel();
    initComponent('#{modalId}');
    dataProvider{1}.clearRows();
    dataProvider{2}.clearRows();
    gridView{2}.editOptions.editable = false;
});
```

### 편집 가능 토글
```javascript
function toggleDirectInput() {
    let editable = !gridView{X}.editOptions.editable;
    gridView{X}.editOptions.editable = editable;

    if (editable) {
        MESSAGE_HANDLE('직접입력 모드가 활성화되었습니다.');
    } else {
        MESSAGE_HANDLE('직접입력 모드가 비활성화되었습니다.');
    }
}
```

---

## 읽기 전용 정보 + 단순 그리드 모달 (Part 11)

상세 정보를 읽기 전용으로 표시하고, 하단에 조회 전용 그리드를 보여주는 패턴입니다.
`SY0208 모바일 대표 아이디 설정` 모달이 대표 예제입니다.

### HTML 구조
```html
<!-- {모달명} 모달 S -->
<div class="modal fade" id="{modalId}" aria-hidden="true"
     style="display: none; z-index: 1060;"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <header class="card-header">
                <h1 class="card-title">
                    <span class="main-txt">{모달 제목}</span>
                    <div class="card-actions">
                        <a href="#" class="card-action card-action-dismiss modal-dismiss"
                           data-dismiss="modal"></a>
                    </div>
                </h1>
            </header>
            <div class="card-body px-5 py-4">

                <!-- 읽기 전용 폼 -->
                <form id="{formId}">
                    <div class="form-group new mt-0">
                        <label class="control-label">{레이블}</label>
                        <span data-id="{FIELD_NM}">{데모값}</span>
                    </div>

                    <!-- 체크박스 인라인 필드 -->
                    <div class="form-group new">
                        <label class="control-label">
                            {레이블}
                            <i class="fas fa-info-circle text-color-info example-popover"
                               type="button" data-container="body"
                               onmouseover="fn_setToolMakerp(this,'I', '{툴팁 내용}')"
                               data-trigger="hover" data-toggle="popover"
                               data-placement="top" title="Information" data-html="true">
                            </i>
                        </label>
                        <div class="d-flex align-items-center">
                            <span data-id="{FIELD_NM}" class="mr-4">{데모값}</span>
                            <div class="checkbox-custom checkbox-default mb-0">
                                <input type="checkbox" id="{CHK_ID}" data-id="{CHK_ID}" name="{CHK_ID}">
                                <label for="{CHK_ID}">{체크박스 레이블}</label>
                            </div>
                        </div>
                    </div>
                </form>

                <!-- 그리드 섹션 헤더 -->
                <div class="d-flex align-items-center justify-content-between mb-2 mt-3">
                    <h2 class="modalH2 mb-0">{섹션 제목}</h2>
                    <div class="d-flex jce mb-2 gap3x">
                        <button type="button"
                                class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                                data-toggle="tooltip" data-placement="top" title="동기화"
                                onclick="{fn_sync()}">
                            <span class="icon_cloudSync"></span>
                        </button>
                        <button type="button"
                                class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                                data-toggle="tooltip" data-placement="top" title="행삭제"
                                onclick="{fn_delete()}">
                            <span class="icon_delRow"></span>
                        </button>
                    </div>
                </div>
                <div id="TB_{GRID_ID}" style="height:200px;"></div>

                <div class="bottom-btn">
                    <button type="button"
                            class="btn btn-primary font-weight-semibold btn-py-2 px-4"
                            onclick="{fn_save()}">저장</button>
                    <button type="button"
                            class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss"
                            data-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- {모달명} 모달 E -->
```

### JavaScript: 단순 조회 그리드 초기화 (1회만 실행)
```javascript
let dataProvider{X} = null;
let gridView{X}     = null;

function fn_initGrid{X}() {
    if (gridView{X} != null) return;   // 중복 초기화 방지
    let columns = [
          { fieldName: "COL1", width: "200", header: {text: "컬럼1"}, editable: false, styleName: "left-column" }
        , { fieldName: "COL2", width: "220", header: {text: "컬럼2"}, editable: false, styleName: "left-column" }
    ];
    dataProvider{X} = new RealGrid.LocalDataProvider(true);
    gridView{X}     = new RealGrid.GridView("TB_{GRID_ID}");
    createSimpleGrid("TB_{GRID_ID}", dataProvider{X}, gridView{X}, columns);
    gridView{X}.setHeaderSummaries({ visible: false });
    gridView{X}.groupPanel.visible = false;
    gridView{X}.editOptions.appendable = false;
}
```

### JavaScript: 모달 오픈 함수
```javascript
function callModal{X}(rowData) {
    fn_initGrid{X}();
    $('[data-id="FIELD_1"]').text(rowData.FIELD_1 || '');
    $('[data-id="FIELD_2"]').text(rowData.FIELD_2 || '');
    $('#CHK_ID').prop('checked', rowData.CHK_YN === 'Y');
    fn_loadList(rowData);
    $('#{modalId}').modal('show');
}

function fn_loadList(rowData) {
    logosAjax.requestToken(
        gToken,
        "${KiiPS_SY}/SYAPI/{SCREEN}/LIST",
        "post",
        { KEY: rowData.KEY },
        function(data) {
            let list = (data.body && data.body.LIST) ? data.body.LIST : [];
            dataProvider{X}.setRows(list);
        }
    );
}
```

### 핵심 규칙

| 항목 | 값 |
|------|-----|
| 읽기 전용 데이터 표시 | `<span data-id="...">` (class 없음) |
| 그리드 헤더 컨테이너 | `d-flex align-items-center justify-content-between` |
| 버튼 그룹 | `d-flex jce mb-2 gap3x` |
| 버튼 클래스 | `btn btn-only-icon btn-xl btn-outline-primary buttons-row` |
| 그리드 함수 | `createSimpleGrid` (편집 불필요 시) |
| 그리드 초기화 | 함수 내 `if (gridView != null) return;` 가드 필수 |
| 저장 버튼 | `onclick="fn_save()"` 방식 (form submit 아님) |
