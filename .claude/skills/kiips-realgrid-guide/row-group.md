# RealGrid 행 그룹 (Row Group) — 접기/펼치기

> 조사일 2026-09-03 · **L1 브라우저 실측 완료 2026-09-09** (IL0602 / RealGrid 2.6.3 / 46컬럼 평면 / 10행)
> 근거: 배포 `realgrid.2.6.3.min.js`·`2.8.8.min.js` 정적 분석 + docs.realgrid.com + 라이브 화면 실측
> 관련: [SKILL.md](SKILL.md) · [reference.md](reference.md) · `KiiPS-UI/src/main/resources/static/js/common_grid.js`

## 핵심 사실

**`collapseAll()` / `expandAll()` 는 TreeView 전용이 아니다.** `GridView`의 정식 public API이며,
접히는 대상은 트리 노드가 아니라 **그룹행(`GroupItem`)** 이다.

2.6.3 / 2.8.8 배포본 **양쪽 모두** `GridView.prototype` 에 존재함을 확인:

```
groupBy, isGrouped, collapseAll, expandAll, collapseGroup, expandGroup,
collapseParent, expandParent, getRowGroup, setRowGroup, getGroupPanel,
setGroupPanel, getGroupFieldNames, getGroupFields, getGroupLevel, getGroupLevels,
getGroupIndex, isGroupItem, isMergedGrouped, layoutCollapseAll, layoutExpandAll
```

## 시그니처

```js
gridView.groupBy(fieldNames, sorting?, direction?)   // sorting 은 boolean (기본 rowGroup.sorting = true)
gridView.groupBy(["FIELD1","FIELD2"], true, "ascending")
gridView.groupBy([])                      // 그룹 해제 (내부적으로 ungroupBy → clearGroupBy)
gridView.isGrouped()                      // 그룹핑 여부
gridView.collapseAll(recursive?)          // recursive 기본 false — 루트 그룹만 접음
gridView.expandAll(recursive?, level?)    // 루트 그룹을 펼침
```

- `collapseAll(true)` = 자손 그룹까지 전부 접음
- `collapseAll()` = 최상위 그룹만

> ❌ **`gridView.clearGrouping()` 은 존재하지 않는다.** 두 배포본 모두 0건.
> (`reference.md:299` 의 예제가 이 이름을 쓰고 있으나 오류다.) 해제는 `groupBy([])`.

## KiiPS 현황 — createMainGrid 는 이미 그룹 준비 완료

`common_grid.js` 의 `createMainGrid()` 가 이미 설정한다:

| 라인 | 설정 | 효과 |
|---|---|---|
| 1686 | `gridView.groupPanel.visible = true` | 그룹패널 표시 — 헤더를 드래그해 그룹핑 가능 |
| 1711~ | `setRowGroup({mergeMode:true, headerStatement:"${groupColumn} - ${rowCount} rows", createFooterCallback:()=>false})` | 병합 모드 + 그룹 풋터 숨김 |
| 1774 | `setRowGroup({expandedAdornments:"footer"})` | **펼친 상태에서 헤더 행 없음** |

→ 별도 세팅 없이 `groupBy()` + `collapseAll()` 이 즉시 동작한다.

---

## ⚠️ 함정 6종

### 1. `expandedAdornments:"footer"` 가 펼친 그룹의 헤더 행을 없앤다 (최대 함정)

```js
RowGroupAdornments = { NONE:"none", HEADER:"header", FOOTER:"footer", SUMMARY:"summary", BOTH:"both" }
isHeaderAdornment = (x) => x == "both" || x == "header"
```

`"footer"` 는 헤더 판정 false → **펼치면 그룹 헤더 행이 사라진다.**
접었을 때만 보이는 이유는 `collapsedAdornments` 기본값이 `"header"` 이기 때문.
"그룹핑했는데 헤더가 안 보인다"의 1순위 원인 — `groupBy` 문제가 아니다.

**L1 실측 (IL0602, 데이터 10행, `groupBy(["STD_YM"])` 후):**

| 상태 | itemCount | 그룹행 | 데이터행 |
|---|---|---|---|
| 그룹핑 전 | 10 | 0 | 10 |
| `expandedAdornments:"footer"` (KiiPS 기본) + 펼침 | 10 | **0** ← 헤더 없음 | 10 |
| 같은 설정 + `collapseAll(true)` | 1 | 1 | 0 |
| `expandedAdornments:"both"` + 펼침 | 11 | **1** ← 헤더 등장 | 10 |
| `"both"` + `collapseAll(true)` | 1 | 1 | 0 |

`isGrouped()` 는 **네 경우 모두 `true`** 였다. 즉 그룹핑은 성공했는데 헤더만 안 보이는 것이라,
`isGrouped()` 로는 이 증상을 진단할 수 없다.

**해결:** 화면별로 `setRowGroup({expandedAdornments:"both"})`
(실측 시 `mergeMode:true` 와 `headerStatement` 가 그대로 유지돼 **부분 병합**도 확인됨)

### 2. mergeMode + (멀티레벨 헤더 | 숨김 컬럼) = `groupBy()` 가 조용히 무시된다

`groupByFieldNames` 의 필드 수집 루프:

```js
var u = h && this.layoutByColumn(h);
!u || this.rowGroup.mergeMode && u.parent != this.activeCellLayout._root || l >= 0 && n.push(l)
```

`(!u) || (mergeMode && u.parent != root) || (push)` — 앞 두 조건이 참이면 **push 자체를 건너뛴다.**

- 컬럼이 레이아웃에 없음(숨김 등) → 조용히 제외
- **`mergeMode:true` 인데 그 컬럼이 `columnLayout` 그룹 안에 중첩돼 있으면 → 조용히 제외**

**같은 필터가 `$_doGroupBy` 에도 한 번 더 있다** (탈락 지점 2곳):

```js
if (this.rowGroup.mergeMode) for (l = a.length-1; l >= 0; l--) {
    var h = this.$_getVisibleRootByField(a[l], !1);
    h ? h.$_setMergeGrouped(!0) : a.splice(l, 1)   // ← 여기서도 조용히 제거
}
```

KiiPS `createMainGrid` 는 `mergeMode:true` 가 기본이고 멀티레벨 헤더를 자주 쓴다.
→ 최상위가 아닌 컬럼으로 `groupBy(["FIELD"])` 하면 **에러 없이 아무 일도 안 일어난다.**
수집 결과가 비면 `n.length > 0` 이 false 라 `groupBy` 호출조차 되지 않는다.

**★ L1 실측으로 드러난 진짜 조건 — 판정 기준은 `$_getVisibleRootByField`, 즉 "보이는 루트"다.**

| 대상 컬럼 | mergeMode | `isGrouped()` 결과 |
|---|---|---|
| 보이는 루트 컬럼 (`STD_YM`, `visible:true`) | `true` | ✅ `true` |
| **숨김 컬럼** (`CUST_NO`, `visible:false`) | `true` | ❌ **`false`** |
| 그룹 레이아웃에 중첩된 컬럼 | `true` | ❌ **`false`** |
| 같은 중첩 컬럼 | `false` | ✅ `true` |

숨김 컬럼은 `layoutByColumn()` 이 **null 이 아니었다**(`hasLayout:true`). 그런데도 탈락했다 —
`!u` 조건이 아니라 `$_doGroupBy` 의 `$_getVisibleRootByField(...)` 가 걸러낸 것이다.
따라서 "레이아웃이 있으니 괜찮겠지"로 판단하면 안 된다. **`visible:false` 만으로도 탈락한다.**
(숨김 컬럼이 `mergeMode:false` 에서 되는지는 미검증)

**해결:** `mergeMode:false` 로 바꾸거나, 최상위 레이아웃의 컬럼으로 그룹핑.

### 3. `mergeMode:true` 는 그룹 헤더를 별도 행이 아니라 병합 셀로 그린다

`$_buildItems` 구현: `mergeMode ? new MergedGroupItem(...) : new GroupItemImpl(...)`
→ **아이템 트리는 동일, 렌더러만 다르다.** 그래서 `collapseAll()` 은 두 모드 모두 동작한다.

- `mergeMode:true` (KiiPS 기본) — 그룹 컬럼 셀이 세로 병합돼 표시
- `mergeMode:false` (RealGrid 기본) — 전체 폭 그룹 헤더 행 + 접기 화살표

### 4. 편집 중이면 조용히 무시된다

```js
GridBase.prototype.collapseAll = function(t){ this.isItemEditing(null) || this._rs.collapseAll(t) }
```

`groupBy`, `expandAll`, `collapseAll`, `clearGroupBy` **전부** 같은 게이트를 갖는다.
`createMainGrid` 는 `editOptions.insertable/appendable = true` 라 에디터가 열려 있을 수 있다.
→ 호출 전 `gridView.commit()`.

### 5. `collapseAll` ≠ `layoutCollapseAll`

- `collapseAll` — **행 그룹**(데이터 행 묶음)
- `layoutCollapseAll` — **컬럼 레이아웃 그룹**(멀티레벨 헤더). `expandable` 설정된 그룹Layout 대상.

"접기"만 보고 잘못 집기 쉬움.

### 6. 그룹핑 안 된 그리드에서 호출해도 에러 아님 (no-op)

`_groupedProvider` 는 그룹핑 여부와 무관하게 항상 생성된다
(`new GroupedItemProvider(_rs, false)`). `collapseAll` 은 `rootItem` 자식 중
`instanceof GroupItem` 인 것만 처리 → 그룹 없으면 **조용한 no-op**.
기존 화면에 넣어도 안 깨진다.

---

## headerStatement 치환자

기본값: `"${groupField}: ${groupValue} - ${rowCount} rows"`

| 토큰 | 반환값 |
|---|---|
| `${groupField}` | 필드명 (`field.fieldName`) |
| `${fieldHeader}` | 필드 헤더 (`field.header`) |
| `${groupColumn}` | 컬럼 표시명 (`column.displayText`) |
| `${columnHeader}` | `column.header.text` (없으면 `displayText`) |
| `${columnFooter}` | `column.footer.text` (없으면 `displayText`) |
| `${groupValue}` | 그룹 값 |
| `${rowCount}` | `descendantCount` |
| `${sum}` `${max}` `${min}` `${avg}` `${dataCount}` `${dataAvg}` | 집계 (인덱서 형태) |

토큰은 **대소문자 무시** (`IDENTS` 맵을 `toLowerCase()` 로 조회).

예: `"${groupValue} ${groupColumn}"` → `"2018 빈티지"`

## setRowGroup 은 부분 병합이다

```js
GridView.prototype.setRowGroup = function(t){ this._view.rowGroup.assignFrom(t) }
// Base.assignFrom: 객체 리터럴이면 for (var d in t) — 전달된 키만 setter 호출
```

→ **여러 번 호출해도 이전 설정을 덮어쓰지 않는다.**
`common_grid.js` 가 1711행과 1774행에서 두 번 호출해도 `mergeMode:true` 는 유지된다.

---

## 적용 레시피 — 화면별로 덮어쓰기

⚠️ **`common_grid.js` 를 고치지 말 것.** 공유 파일이라 전 화면 메인 그리드가 전부 바뀐다
(고위험 파일 게이트 대상). 반드시 화면 JSP 에서 `createMainGrid()` **호출 후** 덮어쓴다.

```js
createMainGrid(container, dataProvider, gridView, columns);

// 전체 폭 그룹 헤더 행 + 접기 화살표 형태로
gridView.setRowGroup({
    mergeMode: false,                                 // 함정 2·3 회피
    expandedAdornments: "both",                       // 함정 1 회피
    headerStatement: "${groupValue} ${groupColumn}"   // "2018 빈티지"
});
gridView.commit();                // 함정 4 회피
gridView.groupBy(["VNTG_YY"]);
gridView.collapseAll();           // 전부 접힌 상태로 시작
```

## 툴바 전체접기/펼치기 토글 버튼

`common_grid.js:2936 treeNodeListOnClick()` 의 GridView 판.
차이는 2가지뿐: `treeView` → 대상 `gridView`, `isGrouped()` 가드 + `commit()` 추가.

```js
function gridGroupToggleOnClick(obj){
    var grid = screenGrid.get(container + "_main");
    if(!grid.isGrouped()) return;   // 그룹핑 안 됐으면 아무것도 안 함
    grid.commit();                  // 에디터 열려 있으면 무시되므로 커밋 먼저

    if(obj.classList.contains('active')){
        obj.dataset.originalTitle = '전체펼치기';
        obj.lastElementChild.classList.remove('icon_bars-arrow-up');
        obj.lastElementChild.classList.add('icon_bars-arrow-down');
        grid.collapseAll(true);
    }else{
        obj.dataset.originalTitle = '전체숨기기';
        obj.lastElementChild.classList.remove('icon_bars-arrow-down');
        obj.lastElementChild.classList.add('icon_bars-arrow-up');
        grid.expandAll(true);
    }
    $(obj).blur();
}
```

> `.active` 클래스는 이 함수가 토글하지 않는다 — Bootstrap `data-toggle="button"` 이 처리한다.
> 기존 트리 버튼과 **동일한 마크업**을 써야 동작한다.

## GridView 그룹 vs TreeView — 언제 무엇을

| | GridView 행 그룹 | TreeView |
|---|---|---|
| 데이터 | 평면 목록 + 그룹 필드 | 부모-자식 계층 데이터 |
| 그룹 헤더 | 전체 폭 별도 행 (또는 병합 셀) | 없음 — 노드 자체가 행 |
| 자식 행 | 모든 컬럼을 쓰는 일반 데이터 행 | 첫 컬럼 안에서 들여쓰기 중첩 |
| 생성 | `createMainGrid` + `groupBy()` | `createTreeGrid` (common_grid.js:1465) |
| 접기 | `gridView.collapseAll()` | `treeView.collapseAll()` |

값이 그룹 컬럼 **안에** 들여쓰기로 중첩돼야 하면 TreeView,
접기/펼치기 동작만 같으면 되면 GridView 그룹으로 충분.

---

## L1 실측 결과 (2026-09-09, IL0602 / RealGrid 2.6.3)

브라우저 콘솔에서 라이브 화면으로 검증 완료. **정적 분석과 전부 일치**했다.

| 검증 항목 | 결과 |
|---|---|
| `GridView`에 `collapseAll`/`expandAll`/`groupBy`/`isGrouped` 존재 | ✅ 전부 `function` |
| `clearGrouping` | ✅ `undefined` (존재하지 않음 확인) |
| `groupBy([])` 로 그룹 해제 | ✅ `isGrouped:false`, `getGroupFieldNames():null` |
| 런타임 `getRowGroup()` 기본값 | ✅ `mergeMode:true`, `expandedAdornments:"footer"`, `collapsedAdornments:"header"`, `headerStatement:"${groupColumn} - ${rowCount} rows"` — common_grid.js 분석과 동일 |
| 함정 1 (펼치면 헤더 소실) | ✅ 재현 — 위 표 참조 |
| 함정 2 (숨김/중첩 컬럼 무시) | ✅ 재현 — 위 표 참조 |
| `setRowGroup` 부분 병합 | ✅ `expandedAdornments` 만 바꿔도 `mergeMode`·`headerStatement` 유지 |

> 그리드 상태는 테스트 후 전부 원복했다(46컬럼 / 10행 / `mergeMode:true` / `expandedAdornments:"footer"` / 그룹 해제).

### 재현 절차

FD/IL 화면 콘솔에서 (`gridView` 전역이 없으면 `screenGrid.get("<container>_main")`):

```js
gridView.commit();
gridView.setRowGroup({mergeMode:false, expandedAdornments:"both", headerStatement:"${groupValue} ${groupColumn}"});
gridView.groupBy(["필드명"]);      // 아무 일도 안 나면 → 함정 2 의심
gridView.isGrouped();              // true 여야 함
gridView.collapseAll(true);        // 전부 접힘
gridView.expandAll(true);          // 펼쳤을 때 헤더 행이 보이면 확정
```
