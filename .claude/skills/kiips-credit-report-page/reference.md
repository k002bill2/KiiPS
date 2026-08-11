# KiiPS Credit Report Page Guide - Reference

MI10 계열(여신전문금융업무보고서) 화면의 패턴별 상세 스펙입니다. 판단·절차는 [SKILL.md](SKILL.md), 복붙 코드는 [examples.md](examples.md) 에 있습니다.

레퍼런스: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/MI/MI1010.jsp`

---

## Part 5: 고정 서식 표 자료구조

### 5.1 `G_ROWS` — 행 객체 스키마

서식의 각 행을 선언적 객체로 정의하고 IIFE 안에서 팩토리 함수로 조립합니다. 코드·라벨은 보고서 서식의 **고정 구조이며 데이터가 아닙니다.**

| 필드 | 타입 | 의미 |
|------|------|------|
| `code` | string | 서버 응답의 `ROW_CD` 와 1:1. 드릴다운 키이자 값 매핑 키 |
| `labels` | string[5] | 좌측 라벨 열. 길이는 상수 `NLAB`(=5). **빈 문자열은 가로 병합 신호** |
| `kind` | `'data'` \| `'subtotal'` \| `'total'` \| `'grandtotal'` | 음영 결정 |
| `cnt` | boolean? | 건수/개수 행 → **단위 환산 대상 제외** |
| `sub` | boolean? | 값은 원천이지만 서식상 음영 처리되는 행 |
| `spanLabel` | boolean? | 라벨 5열을 통째 colspan 하는 블록합계 행. **이 행은 `labels` 자체가 없다** |
| `spanText` | string? | `spanLabel:true` 일 때 표시할 문구 |

⚠️ `spanLabel` 행은 `labels` 가 없으므로, 라벨을 참조하는 **모든 코드**는 방어적 접근 관용구를 써야 합니다:

```js
let v = (r.labels && r.labels[c]) || '';
```

MI1010 은 예외 없이 이 형태를 씁니다.

### 5.2 팩토리 함수 — 호출부가 곧 서식 목차

반복 구조를 함수로 묶으면 호출부만 읽어도 서식 목차가 보입니다.

- `pair(g0, l2, l3, cCost, cBook, kind)` — 취득원가/장부가액 2행 세트
- `investBlock(p, g0, opt)` — 회사분/조합분 블록 1개 (업무집행조합수·투자업체수·투자건수 → 투자주식/사채/조건부융자/기타 → 소계 → 대출금 → 블록합계)
- `chulja(nm, codes)` — 조합출자 2×3 격자 (업무집행조합원분/유한책임조합원 × 조합수/약정액/출자액)

`investBlock` 의 `opt` 필드: `upmu`(업무집행조합수 행 유무) · `daechul`(신기술금융대출금 유무) · `subLetter`(소계 라벨 접미) · `totalCode` · `spanText`.

### 5.3 `G_RMAP` — 코드 → 행 역인덱스

드릴다운에서 `ROW_CD` 로 행 메타를 O(1) 조회하기 위해 별도 IIFE 로 만듭니다. 없는 코드면 조용히 return 하는 가드가 `fnOpenDetail` 진입부에 있습니다.

### 5.4 `fnCalcSpan` — 병합 행렬

렌더 전에 `span[][]`(rowspan 길이)·`skip[][]`(셀 생략 여부) 두 행렬을 만듭니다. 규칙 3가지:

1. **세로 병합은 상위 라벨이 모두 같을 때만 이어진다**
   자기 값 일치(`sameSelf`)만으로는 부족하고, `0..c-1` 부모 라벨 **전부** 일치(`sameParents`)를 요구합니다.
   → 이래야 '회사분 > 투자주식 > 합계' 와 '조합분 > 투자주식 > 합계' 가 잘못 이어붙지 않습니다.
2. **블록합계(`spanLabel`) 행에서 강제로 끊는다**
   내부 루프에서 `if (rj.spanLabel) break;` 하고, 자신은 `skip = true` 로 표시합니다.
3. **빈 문자열은 `'empty'` 로 표시**해 셀 자체를 생략하고, 렌더 쪽에서 오른쪽으로 이어지는 빈 라벨 개수를 세어 colspan 으로 환산합니다.

렌더 루프는 `skip[i][c]` 가 `'empty'` 든 `true` 든 모두 continue 하고, `rs > 1` · `cs > 1` 일 때만 속성을 붙입니다.

### 5.5 음영 — `fnShadeOf` / `fnSpanShade`

음영 클래스 결정을 함수 하나로 중앙집중합니다.

| `kind` | 클래스 |
|--------|--------|
| `data` + `sub:false` | (없음) |
| `data` + `sub:true` | `bg_subsum` |
| `subtotal` | `bg_subsum` |
| `total` / `grandtotal` | `bg_subsum bg_totsum` |

⚠️ **두 클래스 모두 런타임에 미정의일 수 있습니다.** `bg_totsum` 은 정의 0건이고, `bg_subsum` 은 `css/datatables.scss` 에만 정의돼 있는데 그 스타일시트는 MI 페이지 include 체인에서 로드되지 않습니다 — 음영 유무는 **브라우저 실측으로 확인**하십시오(Part 9.2.1).

`fnSpanShade(i, rs)` — rowspan 셀은 걸쳐 있는 **모든 행의 음영이 같을 때만** 음영을 줍니다. 다르면 빈 문자열을 반환합니다.

음영 문자열은 코드 셀 · 라벨 셀 · 값 셀 · 검증 셀 전부에 같은 변수로 연결됩니다.

### 5.6 컬럼 축 — `G_COLS`

AC285 기준 열 축은 전역 배열 하나로 고정합니다.

```js
const G_COLS = ['A','B','C','D','F','E'];
```

⚠️ **화면 표시 순서가 알파벳 순이 아닙니다** (D 다음 F, 마지막이 E).

| 열 | 의미 | 서버 필드 |
|---|---|---|
| A | 전분기말 잔액 | `BEF_QTR_BLNC_AMT` |
| B | 당분기중 실행 | `NOW_QTR_EXEC_AMT` |
| C | 당분기중 회수 | `NOW_QTR_RCVR_AMT` |
| D | 당분기중 순실행 | **없음 — `B − C` 화면 계산** |
| F | 당분기중 기타 | `NOW_QTR_ETC_AMT` |
| E | 당분기말 잔액(원장 집계) | `NOW_QTR_BLNC_AMT` |
| E' | 당분기말 잔액(수식) | **없음 — `A+B−C+F` 화면 계산** |

`fnColVal(v, col)` 이 D 만 특수 처리하며, B·C 가 **둘 다** null 이면 null 을 반환합니다(0 이 아님).

### 5.7 표 골격 마크업

- `<table class="display no-footer dataTable" id="rep">`
- `<col style="width:...">` 를 라벨 열 + 값 열 개수만큼 선언. **검증 열은 폭을 지정하지 않고 CSS 에서 줍니다**(Part 7.3)
- 3단 `<thead>`: 1행 = `코드 / 행열명`(`rowspan=3 colspan=6`) + 열 기호 A~E + 검증 2열 / 2행 = `당분기 중` 그룹(`colspan=4`) / 3행 = 실행·회수·순실행·기타
- 빈 `<tbody id="dataTable_body">`
- 값 셀 클래스: `dt-right` + 음영 + D 전용 `col-net`

렌더는 통짜 HTML 문자열을 조립해 `$('#dataTable_body').html(html)` 로 **1회 주입**합니다.

---

## Part 6: 단위 전환 계약

### 6.1 계약

> **서버는 항상 '원' 단위 정수를 내려주고, 백만원 환산은 화면에서만 한다.**

이 계약은 `fnBindData` 위 블록 주석에 명시돼 있습니다. 서버가 이미 환산해서 내려주면 이중 환산이 됩니다.

#### 6.1.1 `/DETAIL` 은 예외 — 그리드는 재환산하지 않는다

위 계약은 **`/LIST` 에만** 적용됩니다. 드릴다운 모달은 다릅니다:

- 모달 그리드는 받은 `AMT` 를 **어떤 재환산도 없이** 그대로 그립니다.
- footer 대사는 `ctx.sum === ctx.cell` 로 비교하는데, `ctx.cell` 은 `fnDisp(fnColVal(...))` 즉 **표시단위 값**입니다.
- 레퍼런스의 샘플 경로는 `AMT: fnDisp(parts[i], isCnt)` 로 **이미 환산된 값**을 넣습니다.

따라서 백엔드가 `/LIST` 와 똑같이 '원' 정수를 내려주면 백만원 모드에서 **모든 명세 모달 footer 가 항상 '불일치'** 로 뜹니다(10⁶ 배 차이). 둘 중 하나를 **명시적으로 선택**하고 문서화하십시오.

| 설계 | 해야 할 일 |
|------|-----------|
| (a) 서버가 표시단위로 내려준다 | `fnOpenDetail` 요청에 현재 단위를 실어 보냅니다 — `searchCond.UNIT = G_UNIT;` (Part 8.2 payload 에 필드 1개 추가) |
| (b) 서버는 '원'을 내려준다 (`/LIST` 와 통일) | `fnShowDetailModal` 호출 **직전에** 매핑 단계를 넣습니다 — `list.forEach(function(x){ x.AMT = fnDisp(x.AMT, mctx.cnt); });` ⚠️ **이 코드는 examples.md 에 없습니다. 직접 넣어야 합니다.** |

> ⚠️ **열린 모달은 단위 토글에 반응하지 않습니다.** `fnSetUnit` 은 `fnRenderTable()` 만 다시 돌리고, 컬럼 헤더 문구 `"금액(" + fnUnitNm() + ")"` 는 `fnDetailCols` 실행 시점에 굳습니다. 단위를 바꾸면 숫자도 헤더도 그대로입니다.
> → `fnSetUnit` 안에서 `$('#MI10xxMD').modal('hide');` 로 닫거나 재조회하십시오.

### 6.2 상태 · 유틸

```js
let G_UNIT   = 'M';        // 'M' = 백만원, 'W' = 원
const G_WON  = 1000000;
```

| 함수 | 역할 |
|------|------|
| `fnNum(v)` | `null`/`undefined`/`''`/NaN → `null`, 그 외 Number |
| `fnComma(n)` | `StringUtil.addComma` 가 부호를 못 다루므로 **절대값에만 적용하고 부호를 앞에 붙임** |
| `fnDisp(v, isCnt)` | 표시 단위 환산. **`isCnt` 면 환산하지 않고 반올림만** |
| `fnCell(v, isCnt)` | 셀 문자열. `null` → 공란, `0` → `'-'`. 형제 화면의 `undefined` 출력 문제를 막음 |
| `fnUnitNm()` | `'백만원'` / `'원'` |

렌더 시 행 플래그를 그대로 넘깁니다: `fnCell(raw, r.cnt)`.

### 6.3 전환 진입점 — 재조회하지 않는다

```js
function fnSetUnit(u){
    if (G_UNIT === u) return;
    G_UNIT = u;
    fnRenderTable();
}
```

단위를 바꿔도 **서버를 다시 부르지 않습니다.** `G_VALS` 에 원 단위 원본이 그대로 있으므로 렌더만 다시 돌면 됩니다.

### 6.4 바인딩 — `changed.bs.select`

selectpicker 는 **native `change` 와 `changed.bs.select` 가 대칭이 아닙니다.**

| 경로 | native `change` | `changed.bs.select` |
|------|:---:|:---:|
| 사용자가 드롭다운 클릭 | ✅ | ✅ |
| 코드가 `.selectpicker('val', v)` 호출 | ❌ | ✅ |

→ 프로그램 세팅에도 핸들러가 돌아야 하므로 **반드시 `changed.bs.select`** 를 씁니다. 값이 배열로 오는 경우를 방어합니다(examples.md Part 12).

### 6.5 단위 라벨 동기화

표 위 우측에 `<small class="text-xxs mr-2 pull-right mb-2" id="unitLbl">` 를 두고 렌더 끝에서 문구를 갱신합니다.

라벨 문구는 서식이 쓰는 단위만 나열합니다 (AC285 = `(단위: 개, 건, 백만원)`). 금액 단위 부분만 `fnUnitNm()` 으로 갈아끼우십시오.

---

## Part 7: 검증열 대사 규칙

### 7.1 대사 공식

```
E' = A + B − C + F        (양식 수식)
df = E − E'               (원장 집계 − 수식)
ok = Math.abs(df) <= 0.5  (부동소수 여유)
```

임계값 비교를 쓰는 이유: 부동소수 오차로 `df !== 0` 이 되는 경우를 불일치로 잡지 않기 위함입니다. 같은 임계값이 `fnOpenVerify` 에도 반복됩니다.

### 7.2 렌더 — 항상 그려두고 CSS 로만 토글

검증 2열(E', V)은 **조건 없이 매 행 렌더**하고 노출은 CSS 클래스가 결정합니다.

**이유**: KiiPS 유틸리티 클래스(`.in-bl`/`.ib`/`.dis_in_bl`)가 `display:inline-block !important` 를 걸어 jQuery `show()`/`hide()` 가 무력화되기 때문입니다.

| 셀 | 내용 |
|---|---|
| E' | `fnCell(fx, r.cnt)`. 불일치면 `text-danger font-weight-bold` |
| V | `OK` 또는 `불일치 ±차이`. OK 면 `text-success` |

두 셀 모두 `title` 툴팁에 `원장 X vs 수식 Y · 차이 Z` 를 넣고 `onclick="fnOpenVerify(code)"` 를 겁니다.

⚠️ **데이터가 없는 행(`v` 없음)도 빈 `vcol` 셀 2개를 그려야 합니다.** 안 그리면 열 수가 어긋나 표가 깨집니다.

### 7.3 열 폭 CSS

`table-layout:auto` 라 `width` 만으로는 내용에 밀리므로 **`min-width` 를 병기**해야 합니다. E' 열은 폭이 좁으면 헤더가 여러 줄로 깨져 **헤더 높이가 통째로 늘어납니다**.

### 7.4 토글 버튼 상태

`fnToggleVerify()` 는 3가지를 동시에 합니다:
1. 표에 `von` 클래스 토글
2. 버튼을 `btn-outline-primary` ↔ `btn-primary` 로 전환 (토글 상태 시각화)
3. `aria-pressed` 동기화 (접근성)

### 7.5 검증 셀 클릭 흐름

`fnOpenVerify(rowCd)` 는 차이가 임계값 이내면 `MESSAGE_HANDLE('...일치합니다.')` 로 끝내고, 어긋날 때만 `fnOpenDetail(rowCd, 'V')` 로 위임합니다.

> `MESSAGE_HANDLE(TYPE, ...)` 는 `switch(TYPE.toLowerCase())` 의 `default:` 에서 `AlertMsg('I', TYPE)` 를 호출하므로 원문 문자열을 그대로 넘겨도 표시됩니다. 다만 문구가 우연히 `nodata`/`delete`/`save` 등 예약 키워드와 같아지면 **조용히 다른 문장으로 치환**됩니다. 에러 톤이 필요하면 `MESSAGE_HANDLE('custom_error', msg)`.

---

## Part 8: 드릴다운 계약

### 8.1 셀 클릭 가능 조건

```js
if (col !== 'D' && raw !== null && raw !== 0) { /* clickable */ }
```

- **D(순실행)는 파생열이라 비클릭** — 서버에 조회할 원천이 없습니다
- 값이 없거나 0 인 셀도 비클릭

이 규칙은 표 위 안내 배너(`alert alert-info-light`) 문구와 **1:1 로 대응**해야 합니다. 규칙을 바꾸면 배너 문구도 함께 바꾸십시오.

### 8.2 요청 payload

```
POST ${KiiPS_SY}/SYAPI/MI10xx/DETAIL
{ STD_QTR, STD_YM, AUTH_USERID, ROW_CD, COL_CD }
```

`COL_CD` 는 `'A'|'B'|'C'|'F'|'E'|'V'` — **D 는 파생열이라 조회하지 않습니다.**

### 8.3 응답 payload — 단일 스키마가 아니라 kind 별 필드 집합

```
data.body.LIST = [ { …kind 별 필드… }, ... ]
```

원천 행이면 개별 명세를, 소계/합계 행이면 구성 내역을 **서버가 판단해** 내려줍니다.

⚠️ 응답 행의 필드명은 `fnDetailCols` 가 만드는 컬럼의 `fieldName` 과 **1:1 이어야 합니다.** 그런데 `fnDetailCols` 는 kind(Part 8.5) 마다 컬럼 구성이 다르므로 **응답 스키마도 하나로 고정되지 않습니다.** 아래 표가 실제 소비처(`MI1010.jsp` 의 `fnDetailCols`)에서 역산한 계약입니다.

| kind | 필수 fieldName | 조건부 fieldName |
|------|----------------|------------------|
| `verify` | `TRD_CD` · `TRD_NM` · `BLNC_CD` · `PRPL_CD` · `TRD_DT` · `AMT` | — |
| `cntsum` | `PART_CD` · `PART_NM` · `AMT` | — |
| `sum` | `PART_NM` · `PART_CD` · `TRGT_NM` · `CNTR_NO` · `GDS_NM` · `INV_DT` · `AMT` | 조합분 블록이면 `FUND_NM`, 기타조합분이면 `FUND_TP` |
| `amt` (기본) | `TRGT_NM` · `CNTR_NO` · `GDS_NM` · `INV_DT` · `AMT` | 조합분 블록이면 `FUND_NM`, 기타조합분이면 `FUND_TP` |
| `entcnt` | `TRGT_NM` · `BIZ_NO` (**금액 컬럼 없음**) | 조합분 블록이면 `FUND_NM`, 기타조합분이면 `FUND_TP` · `NTB_YN` |
| `concnt` | `TRGT_NM` · `GDS_NM` · `INV_DT` · `CNTR_NO` (**금액 컬럼 없음**) | 조합분 블록이면 `FUND_NM`, 기타조합분이면 `FUND_TP` |
| `yakjeong` | `FUND_NM` · `FUND_TP` · `POS` · `GP_NM` · `FORM_DT` | 기타조합분·`기타조합` 라벨이면 `BASIS` / 건수 행이 아니면 `AMT` |
| `chulja` | `FUND_NM` · `FUND_TP` · `DIV` · `INV_DT` · `AMT` | `COL_CD='F'`(양수도)면 `FROM_NM` · `TO_NM`, 그 외에는 `SEQ` |

- '조합분 블록'은 행 라벨 `labels[0]` 이 `신기술사업투자조합분` 또는 `기타조합분` 인 경우입니다(`fnIsFundBlk`). `기타조합분`이면 추가로 `FUND_TP` 가 붙습니다(`fnIsEtcBlk`).
- `BLNC_CD` · `DIV` 는 **코드값**입니다(`P`/`M`, `출자`/`분배`/`양수도`). 배지 HTML 은 화면이 만듭니다 — Part 8.9 참조.
- `AMT` 의 단위는 '원'이 아닙니다. **Part 6.1.1 을 반드시 읽으십시오.**
- `entcnt` · `concnt` 는 금액 컬럼 자체가 없고 **행 수가 곧 건수**입니다(`fnSumOf`).

> ⛔ **`MI1010.jsp` 의 `/DETAIL` payload 블록 주석(`{ DTL_SEQ, TRGT_NM, TRD_CD, TRD_NM, BLNC_INCDEC_CD, PRPL_AMT_INCDEC_CD, TRD_DT, TRD_AMT }`)을 복제하지 마십시오.**
> 그 주석은 `fnDetailCols` 와 어긋나 있습니다 — 실제 컬럼은 `BLNC_CD` · `PRPL_CD` · `AMT` 인데 주석은 `BLNC_INCDEC_CD` · `PRPL_AMT_INCDEC_CD` · `TRD_AMT` 로 적혀 있고, `DTL_SEQ` 는 소비처가 없습니다(행번호는 `rowIndicator` 담당). 주석대로 백엔드를 구현하면 `verify` 명세의 3개 컬럼이 공란으로 뜨고 footer 합계가 0 이 됩니다. Part 9.1.6 참조.

### 8.4 LIST payload

```
POST ${KiiPS_SY}/SYAPI/MI10xx/LIST
요청: { STD_QTR, STD_YM, AUTH_USERID }
응답: data.body.LIST = [ { ROW_CD, BEF_QTR_BLNC_AMT, NOW_QTR_EXEC_AMT,
                          NOW_QTR_RCVR_AMT, NOW_QTR_ETC_AMT, NOW_QTR_BLNC_AMT }, ... ]
```

- **배열 순서는 무관** (`ROW_CD` 로 매핑). 누락된 행은 공란으로 그립니다
- 금액은 '원' 단위 정수
- 0건이어도 `fnBindData(list)` 를 그대로 태워 서식을 공란으로 유지합니다

### 8.5 명세 종류(kind) 판정

`fnDetailKind(r, colCd)` 가 8종으로 분기합니다(`KIND_NM` 키 8개와 1:1). 정의 코드 → [examples.md](examples.md) Part 14.6.

| kind | 조건 | 표기명 |
|------|------|--------|
| `verify` | `colCd === 'V'` | 대사 차이 내역 |
| `chulja` | 조합출자 블록 + 라벨 `출자액` | 개별 명세 |
| `yakjeong` | 조합출자 블록 (그 외) | 개별 명세 |
| `cntsum` | `kind !== 'data'` + `cnt` | 구성 내역 |
| `sum` | `kind !== 'data'` | 구성 내역 |
| `entcnt` | 투자업체수 / 업무집행조합수 | 개별 명세 |
| `concnt` | 투자건수 / 그 외 `cnt` 행 | 개별 명세 |
| `amt` | 기본 (원천 금액) | 개별 명세 |

### 8.6 모달 컨텍스트 `ctx`

컬럼 빌더와 footer 대사가 공유하는 객체입니다.

| 필드 | 의미 |
|------|------|
| `basis` | footer 라벨 접두. **kind 별로 6갈래 계산** — 아래 표 |
| `cell` | **본표에 그려진 그 셀의 표시값** — `fnDisp(fnColVal(mval, colCd), !!r.cnt)` |
| `cnt` | 건수 명세 여부 |
| `sum` | 명세 합계 (`fnSumOf(list, kind)`) |
| `footSpanField` | footer 병합 대상 필드명 — **컬럼 빌더가 심는다** |
| `footSpanCount` | 병합 칸 수 |

`fnSumOf(list, kind)` 는 건수 명세(`entcnt`/`concnt`)면 행 수를, 금액 컬럼이 없으면 역시 행 수를, 있으면 `AMT` 합을 돌려줍니다.

**`basis` 매핑 규칙** — 한 줄로 뭉개면 footer 라벨이 전 종류 동일해집니다.

| kind | `basis` |
|------|---------|
| `sum` | `'개별 명세'` |
| `cntsum` | `'구성 항목'` |
| `yakjeong` | 건수 행이면 `'조합수'`, 아니면 `'약정액'` |
| `chulja` | `COL_CD` 별 — `B`→`'출자(Capital Call)'` · `C`→`'분배(Distribution)'` · `F`→`'양수도(조합지분 양수·양도)'` · 그 외 `'출자잔액(출자−분배±양수도 누계)'` |
| `entcnt` · `concnt` | `labels[4] \|\| labels[1] \|\| '명세 건수'` |
| 기본(`amt` 등) | `labels[4] \|\| '금액'` |

코드 → [examples.md](examples.md) Part 14.4.

### 8.7 모달 제목 2단

- 큰 글씨(`_MD_TITLE_MAIN`) = 클릭한 **열 이름** (`COL_NM[colCd]`)
- 작은 글씨(`_MD_TITLE_SUB`) = **행 라벨 경로** (`'— ' + fnLabelPath(r)`)
- **검증(V) 모달만 소제목을 비웁니다**

`fnLabelPath(r)` 는 `spanLabel` 행이면 `spanText`, 아니면 빈 값을 제외하고 `' > '` 로 join 합니다.

### 8.8 그리드 재생성 관용구

`fnShowDetailModal(list, kindNm, cols, ctx)` 의 순서가 계약입니다.

```
$('#모달ID').one('shown.bs.modal', function(){
    clearRows
    → createSimpleGrid 재호출 (setFields + setColumns 를 함께 처리)
    → setRowIndicator(true) / onDataLoadComplated 무력화 / fitStyle "even" / height 덮기
    → setFooters (컬럼이 정의한 footers 최대 길이만큼 행 생성)
    → footerSpans 적용 (layoutByColumn) + 되읽기 검증
    → setRows
    → refresh
});
$('#모달ID').modal('show');    // 반드시 그 다음 줄
```

- **`.one()` 필수** — `.on()` 이면 모달을 열 때마다 핸들러가 누적됩니다
- **`copyToClipboardGrid` 는 초기 1회만** — 재호출하면 표시 옵션을 덮어씁니다
- footer 행 수는 하드코딩하지 않고 **모든 컬럼의 `footers.length` 최대값**으로 역산합니다

### 8.9 컬럼 팩토리 `C()` / `N()`

| 팩토리 | 용도 | 필수 처리 |
|--------|------|-----------|
| `C(f, w, t)` | 텍스트 컬럼 | 이름·상품 등 긴 텍스트는 `styleName:"left-column"` (RealGrid 기본이 중앙정렬). 배지 표시 필드(`BLNC_CD`·`DIV`)는 `renderer:{type:"html"}` |
| `N(f, w, t)` | 숫자 컬럼 | `dataType:"number"` + **`numberFormat:"#,##0"` 필수** + `styleName:"right-column"` + `footers` |

`N()` 의 footer 는 3행입니다:
1. RealGrid 자체 집계 `{"expression":"sum"}`
2. 본표 표시값 `fnComma(ctx.cell)`
3. 대사 결과 `일치` / `불일치`

대응 라벨 3행은 `cols[0].footers` 에 넣어 좌측 병합합니다. 이때 `ctx.footSpanField` / `ctx.footSpanCount` 를 심습니다 — **컬럼 정의가 footer 스펙까지 들고 다니는 구조**입니다.

금액 컬럼이 없는 명세는 `CNT_FOOT()` 가 1행 footer 로 대체합니다 (`"투자업체수 = 27 개"`). 단위는 라벨이 `/건수$/` 면 `건`, 아니면 `개`. 불일치 시 같은 줄 끝에 `" (명세 N · 불일치)"` 를 덧붙여 묻히지 않게 합니다.

> `No.` 컬럼은 넣지 않습니다 — RealGrid 행번호(`rowIndicator`)가 담당합니다.

**배지 마크업은 화면이 만듭니다 — 서버가 HTML 을 내려주게 하지 마십시오.**
서버는 **코드값**만 내려줍니다(`BLNC_CD` = `P`/`M`, `DIV` = `출자`/`분배`/`양수도`). `renderer:{type:"html"}` 컬럼에 서버 문자열이 그대로 들어가는 설계는 KiiPS-UI/CLAUDE.md #1(출력 이스케이프 필수)을 우회하는 주입 표면이 됩니다.
`fnDetailCols` 호출 직전에 매핑하십시오 — `list.forEach(function(x){ x.BLNC_CD = fnBadge(x.BLNC_CD); });` (`fnBadge` 구현 → [examples.md](examples.md) Part 14.5).

⚠️ 레퍼런스에서 배지 HTML 을 조립하는 코드는 **샘플 블록 안에만** 있습니다(`fnSampleDetail`). 샘플을 삭제하면 조립부가 함께 사라지므로, 위 매핑을 **운영 영역에** 따로 두어야 합니다(Part 9.5.1.1).

### 8.10 `footerSpans` — 컬럼 리터럴로는 안 먹는다

`footerSpans` 는 `GridColumn` 이 아니라 **레이아웃 아이템(`CellLayout`) 속성**입니다. 컬럼 정의 리터럴에 넣으면 **조용히 무시**됩니다.

그리드 생성 **후** `layoutByColumn()` 으로 레이아웃 아이템을 얻어 설정하고, 적용 후 **되읽어 실패를 `console.warn` 으로 남깁니다**(조용한 무동작 방지). 전체를 try/catch 로 감싸 실패해도 모달은 뜨게 합니다.

`footerSpans` / `layoutByColumn` 은 RealGrid 2.6.3 · 2.8.8 양쪽 min.js 에 존재합니다.

---

## Part 9: 함정 전체 목록

각 항목은 **증상 → 원인 → 올바른 코드** 형식입니다.

### 9.1 레퍼런스 구현체 자체의 결함

#### 9.1.1 샘플 불일치 주입이 무효화된다

- **증상**: `SMP_DIFF` 에 5건을 정의했는데 화면에는 전혀 다른 행들이 불일치로 뜬다. `SMP_DIFF[].why` 를 고쳐도 화면 문구가 안 바뀐다.
- **원인**: `SMP_DIFF` 주입 **직후**에 `for (let k in V) { x.E = x.A + x.B - x.C + x.F; }` 전역 재계산이 돌아 방금 넣은 델타를 **전부 되돌립니다.** 실제 화면 불일치는 그 재계산 **뒤에** 도는 `SMP_NG` 배열이 만듭니다. `why` 는 어디서도 참조되지 않는 죽은 필드입니다.
- **파일의 장문 주석("반드시 모든 롤업이 끝난 뒤 넣어야 SMP_DIFF 건수만 어긋난다")은 현재 코드 동작을 설명하지 못합니다.**
- **올바른 규약**: 주입 기준선은 '롤업 뒤'가 아니라 **'E 강제 재계산 뒤'** 입니다.

```js
// 1) 리프 생성 → 롤업(fnSmpSum)
// 2) E 정의 강제 (리프·롤업 어느 경로든 A+B-C+F 로 닫는다)
for (let k in V) { let x = V[k]; x.E = x.A + x.B - x.C + x.F; }

// 3) ★ 불일치 주입은 반드시 여기 — (2) 뒤여야 살아남는다
Object.keys(SMP_DIFF).forEach(function (cd) {
    if (V[cd]) V[cd].E += SMP_DIFF[cd];
});
return V;
```

⚠️ **`SMP_DIFF` 는 스칼라 맵(`{ "A111": -12 * G_WON }`)으로 쓰십시오.** 레퍼런스는 `{ delta, why }` 객체 형태지만 `why` 는 어디서도 참조되지 않는 죽은 필드이므로 **객체 형태 자체를 폐기**합니다. 이 문서와 [examples.md](examples.md) Part 15 는 스칼라 형태로 통일돼 있습니다 — 두 문서를 섞어 쓰면서 `.delta` 를 남기면 `E += undefined` → **E 가 NaN** 이 되어 화면 전체가 조용히 무너집니다.

주입 장치는 **하나만** 두십시오. `SMP_DIFF` 와 `SMP_NG` 를 동시에 복제하면 같은 혼란이 재생산됩니다.

#### 9.1.2 죽은 코드 `fnReconHtml`

- **증상**: 모달 아래에 대사표가 안 나온다.
- **원인**: `fnReconHtml(list, cols, ctx)` 는 정의만 있고 **호출부가 0건**입니다. 대사표를 RealGrid footer 로 옮기면서 남은 잔재입니다.
- **올바른 코드**: 동일 역할은 `N()` 의 3행 `ft`(합계 / 표시값 / 대사 결과)가 담당합니다(Part 8.9). `fnReconHtml` 을 복제하지 마십시오.

#### 9.1.3 `fnVerifySumHtml` 은 인자를 무시하는 고정 문구

- **증상**: 어떤 행의 검증 모달을 열어도 같은 안내 문구가 나오고, 그 설명이 실제 데이터와 맞지 않는다.
- **원인**: 인자 `r` 을 전혀 쓰지 않고 `v` 는 null 가드로만 씁니다. 반환값은 `PRPL_AMT_INCDEC_CD` 를 언급하는 하드코딩 문자열이며, `SMP_NG` 로 만들어진 행에는 맞지 않는 설명입니다.
- **올바른 코드**: 안내 문구를 쓸 거라면 **실제 차이 원인에서 파생**시키십시오. 근거가 없으면 슬롯을 비우는 편이 낫습니다.

```js
$("#MI10xx_MD_VSUM").html("");   // 근거 없는 고정 문구보다 빈 슬롯이 낫다
```

#### 9.1.4 `USE_SAMPLE = true` 로 출하

- **증상**: 화면이 잘 도는데 백엔드를 붙여도 값이 안 바뀐다.
- **원인**: `const USE_SAMPLE = true;` 상태라 실 API `/LIST`·`/DETAIL` 을 **한 번도 타지 않습니다.**
- **올바른 코드**: 신규 화면에 샘플을 쓰더라도 백엔드 연동 시점에 반드시 플래그를 내리고 블록을 삭제하십시오(Part 9.5). 레퍼런스를 복제할 때 이 상태를 '검증된 동작'으로 착각하지 마십시오.

#### 9.1.5 미해결 `// TODO 확인필요` 2건

- **증상**: 생성 버튼이 동작하지 않거나 엑셀 서식이 어긋난다.
- **원인**:
  - `requestData.TB_RP1011M` — '화면ID → 테이블 +1 오프셋' 관례로 **추정한 이름**. 실제 VO 필드명과 다를 수 있습니다.
  - `downExcel(param, "${KiiPS_COMMON}", 11, 3)` 의 `(11,3)` — 서식 xlsx 의 데이터 기록 시작 좌표(0-based)로 **자리표시자**입니다.
  - 엑셀 헤더 미스매치의 **직접 원인은 파일명 한 글자(공백)** 입니다. `KiiPS-UTILS/.../Constant.java:1497` 의 `getExcelHeader(String fileName)` 은 파일명 문자열로 `switch` 하며 `case "투자 및 융자현황"`(1504행, MI1001)이 **이미 존재**합니다. 그런데 `MI1010.jsp:1542` 는 `fileName` 을 `"투자 및 융자 현황.xlsx"`(융자와 현황 사이 **공백**)로 넘깁니다 — `MI1001.jsp:1942` 는 `"투자 및 융자현황.xlsx"`.
- **올바른 코드**: `fn_excelDown` / `setData` 를 **검증된 패턴으로 취급하지 마십시오.** 실제 VO 필드명과 서식 좌표는 백엔드와 맞춘 뒤 확정합니다.
  엑셀 헤더는 **먼저 `fileName` 을 MI1001 과 동일하게 정규화**해 기존 case 를 재사용하십시오. MI1010 은 MI1001 과 같은 AC285 서식이므로 헤더 매핑도 동일합니다.
  `Constant.getExcelHeader()` 에 case 를 **추가**하는 것은 공유 모듈(`KiiPS-UTILS`) 변경이므로, **서식/헤더가 실제로 다를 때만** 검토하고 그때는 사용자 승인을 받으십시오.

#### 9.1.6 `/DETAIL` payload 주석이 실제 컬럼과 어긋난다

- **증상**: 주석대로 백엔드를 구현했는데 `verify` 명세의 잔액증감·원금증감·금액 컬럼이 전부 공란이고 footer 합계가 0 이다.
- **원인**: `MI1010.jsp` 의 `/DETAIL` payload 블록 주석이 `BLNC_INCDEC_CD` · `PRPL_AMT_INCDEC_CD` · `TRD_AMT` 를 적고 있으나, 소비처인 `fnDetailCols` 의 `fieldName` 은 `BLNC_CD` · `PRPL_CD` · `AMT` 입니다. `DTL_SEQ` 는 소비처가 없습니다.
- **올바른 코드**: 그 주석을 복제하지 말고 **Part 8.3 의 kind 별 필드 표**를 계약으로 삼으십시오. (Part 9.8 '관용구: API 계약 주석화' 는 여전히 유효하지만, **주석과 코드가 갈라지면 코드가 진실**입니다.)

### 9.2 CSS / 테마

#### 9.2.1 소계/합계 음영 클래스는 둘 다 미정의일 수 있다

- **증상**: 합계 행과 소계 행이 구분되지 않는다 (같은 음영이거나, 아예 음영이 없다).
- **정적 사실** (실측):
  - `bg_totsum` — 프로젝트 CSS **정의 0건**.
  - `bg_subsum` — `KiiPS-UI/src/main/resources/static/css/datatables.scss`(+ 컴파일 산출물 `datatables.css`/`datatables.min.css`) **에만** 정의(라이트 `#ededed` / 다크 `#454951`).
  - 그런데 `datatables.*` 는 **MI 페이지 include 체인에서 링크되지 않습니다** — `header.jsp` · `inc_files.jsp` · `sidemenu.jsp` · `inc_page_header.jsp` · `footer_sidemenu.jsp` 전부 0건. 실제 서빙되는 `css/sass/theme.css` 에도 `bg_subsum` 은 0건입니다.
- **귀결**: MI1010 런타임에서는 **두 클래스 모두 미정의일 가능성이 높습니다**(= 소계/합계 행에 음영이 아예 없음). "실제 음영은 `bg_subsum` 이 담당한다" 는 설명은 **정적 근거로 뒷받침되지 않습니다.**
- **올바른 대응**: ① 브라우저에서 소계/합계 행의 `background-color` 를 **실측**해 음영 유무를 먼저 확정하십시오. ② 음영이 필요하다고 판단되면 공통 SCSS 가 아니라 **페이지 `<style>` 의 id 셀렉터**로 주십시오(파급 0). 공통 SCSS 수정은 기존 업무보고서 화면 전체에 동시 파급됩니다.

```js
return ' bg_subsum bg_totsum';   // 계열 관례상 함께 부여. 단, 렌더 결과는 실측 전까지 미확정
```

#### 9.2.2 유틸리티 클래스가 `show()`/`hide()` 를 무력화한다

- **증상**: `$(el).hide()` 를 걸었는데 요소가 그대로 보인다.
- **원인**: `_helpers.scss` 의 `.in-bl, .dis_in_bl, .ib { display: inline-block !important; }` 가 인라인 `display:none` 을 이깁니다.
- **올바른 코드**: 열/요소 노출은 **CSS 클래스 토글**로 하십시오.

```css
#rep .vcol      { display: none; }
#rep.von .vcol  { display: table-cell; }
```
```js
$('#rep').toggleClass('von', G_VERIFY);
```

굳이 JS 로 감춰야 하면 `el.style.setProperty('display','none','important')` 를 쓰십시오. `d-none` 은 명시도가 동률이라 안전하지 않습니다.

#### 9.2.3 전역 `ul` 리셋이 목록 마커를 지운다

- **증상**: 안내 서랍이나 본문의 `<ol>`/`<ul>` 번호·불릿이 통째로 사라진다.
- **원인**: 테마 리셋의 bare 셀렉터 `ol, ul { list-style: none; }` — 소스는 `KiiPS-UI/src/main/resources/static/css/sass/themes/default/_styles.scss:303`, 컴파일 산출물은 `css/sass/theme.css:301`, 이것을 `header.jsp` 85행이 링크합니다.
  ⚠️ `css/style_pc.scss` 의 리셋을 원인으로 지목하지 마십시오 — **그 파일은 MI 페이지 include 체인 어디에도 링크돼 있지 않습니다**(include 디렉토리 전체 grep 0건. 참조처는 `preui/*`·`COM/push.jsp`·`grid_test.jsp` 등 별도 페이지).
- **올바른 코드**: 공통 SCSS 를 건드리지 말고 **id 셀렉터 특이도**로 이 화면 안에서만 되살립니다. **색은 지정하지 않습니다** — 마커는 글자색을 따라가므로 다크테마가 자동 대응합니다.

```css
#MI10xx_GUIDE ol { list-style: decimal outside; padding-left: 1.5rem; }
#MI10xx_GUIDE ul { list-style: disc outside;    padding-left: 1.1rem; }
#MI10xx_GUIDE ul.list-unstyled { list-style: none; padding-left: 0; }
```

#### 9.2.4 `<small>` 로 감싸도 글자가 안 작아진다

- **증상**: 모달 소제목을 `<small>` 로 감쌌는데 크기가 그대로다.
- **원인**: 테마의 `small` 규칙이 `--font-size` **CSS 변수만** 선언하고 실제 `font-size` 속성은 선언하지 않습니다.
- **올바른 코드**: id 셀렉터로 직접 줍니다. `em` 단위라 제목 크기에 비례하고, 색은 `text-muted` 가 담당합니다.

```css
#MI10xx_MD_TITLE_SUB { font-size: 0.7em; font-weight: 400; }
```

#### 9.2.5 배지 글자 대비 부족

- **증상**: 라이트 테마에서 모달 배지 글자가 묻힌다.
- **원인**: `.badge-info` 가 중간 톤 배경에 어두운 글자(`#242424`)를 씁니다.
- **올바른 코드**: 컨테이너 id 셀렉터로 글자만 올려 `!important` 없이 이깁니다. 다크 테마에는 별도 오버라이드가 있으므로 **양쪽 결과를 확인**하십시오.

```css
#TB_MI10xx_MD .badge { color: #fff; font-weight: 600; }
```

#### 9.2.6 페이지 `<style>` 다크테마 규칙

색을 선언할 때 지킬 것:

1. **반드시 라이트/다크 쌍으로 선언** — 한쪽만 쓰면 다른 테마에서 깨집니다
2. 단색은 하드코딩 대신 테마 토큰 (`var(--primary)`, `var(--rgTable-hover-background)` — 양쪽 정의 확인됨)
3. 텍스트 강조는 `text-danger`/`text-success` **유틸리티만** 써서 다크가 자동으로 따라오게
4. 공통 SCSS 를 고치지 말고 `#화면ID` 셀렉터 특이도로 전역 규칙을 이겨 파급을 0으로
5. `:not()` 으로 검증색을 덮지 않도록 제외

```css
/* 링크 셀은 밑줄 대신 primary 토큰. 단 검증열의 danger/success 는 덮지 않는다. */
#rep td.clickable:not(.text-danger):not(.text-success) { color: var(--primary); }
```

### 9.3 selectpicker

#### 9.3.1 전역 패치를 가정하지 말 것

MEMORY 에 기록된 `header.jsp` / `header_popup.jsp` 의 `$.fn.selectpicker` refresh/render/val 전역 패치는 **현재 워킹카피에 존재하지 않습니다** (`header.jsp`·`header_popup.jsp`·`common.min.js` 모두 grep 0건). disabled/refresh 관련 문제가 전역에서 해결됐다고 가정하지 마십시오.

#### 9.3.2 `data-id` 는 2개를 매칭한다

- **증상**: `$('[data-id=UNIT_SEL]')` 로 조작했더니 옵션이 날것으로 노출되거나 렌더가 깨진다.
- **원인**: bootstrap-select 가 위젯 생성 시 원본 select 의 `data-id` 를 **생성한 버튼에도 복사**합니다 → select + button 2개 매칭.
- **올바른 코드**: id 셀렉터로 한정하십시오.

```js
$('#UNIT_SEL').on('changed.bs.select', ...);   // O
$('[data-id=UNIT_SEL]')...                     // X — 버튼까지 잡힘
```

#### 9.3.3 `refresh()` 는 전면 재조립

`refresh()` 는 data 속성 재읽기 → checkDisabled → setStyle → render → buildData → buildList → setWidth → setSize 를 전부 다시 돌립니다. **버튼 텍스트를 직접 손봐 둔 것은 이후 어떤 코드가 `refresh` 를 부르는 순간 전부 날아갑니다.**

#### 9.3.4 `UNIT_SEL` id 가 두 분기에 중복 존재

같은 id `UNIT_SEL` 이 `inc_mi_button.jsp` 의 MI0333 분기(`AK`=억원 / `WON`=원)와 MI1010 분기(`M`=백만원 / `W`=원)에 각각 선언돼 있고 **option value 세트가 다릅니다.** 분기는 배타적이라 DOM 충돌은 없지만, 다른 화면의 핸들러를 복사해 오면 값이 조용히 어긋납니다(`AK` 를 기대하는 코드에 `M` 이 들어옴).

### 9.4 RealGrid

#### 9.4.1 `createSimpleGrid` 가 강제하는 4가지

- **증상**: 모달 그리드에 가로 스크롤이 생기고, 높이가 210px 로 고정되며, footer 와 행번호가 안 보인다.
- **원인**: `createSimpleGrid` 는 컨테이너에 `height:210px` 를 CSS 로 못박고, `onDataLoadComplated` 에 컬럼 내용맞춤을 걸어 `fitStyle` 을 사실상 무효화하며, `setFooters({visible:false})` · `setRowIndicator({visible:false})` 로 footer/행번호를 끕니다.
- **올바른 코드**: **호출 이후에** 4개를 전부 되돌립니다. 순서가 중요합니다.

```js
createSimpleGrid("TB_MI10xx_MD", dataProviderM, gridViewM, cols);
gridViewM.setRowIndicator({visible: true});
gridViewM.onDataLoadComplated = function(){};   // 내용맞춤 무력화
gridViewM.displayOptions.fitStyle = "even";     // 컨테이너에 폭 맞춤
$('#TB_MI10xx_MD').css('height', '410px');      // 210px 덮기
gridViewM.setFooters({ visible:true, items:fitems });
```

#### 9.4.2 숨겨진 컨테이너에서 `setRows`

- **증상**: 모달을 열었는데 그리드가 비어 있다.
- **원인**: 컨테이너가 숨겨진 상태에서 `setRows` 하면 렌더되지 않습니다.
- **올바른 코드**: `.one('shown.bs.modal', ...)` 안에서 채우고 그 **다음 줄**에서 `modal('show')`. `.on()` 은 핸들러가 누적됩니다(Part 8.8).

#### 9.4.3 `numberFormat` 누락 → TypeError

`dataType:"number"` 컬럼은 **반드시 `numberFormat`(예 `"#,##0"`)을 함께 지정**해야 합니다. 없으면 렌더 중 TypeError 가 납니다.

#### 9.4.4 `copyToClipboardGrid` 재호출

내부에서 `setDisplayOptions({selectionMode:"extended", selectionStyle:"block"})` 를 호출해 직전에 잡아 둔 표시 옵션(`fitStyle` 등)을 덮어씁니다. **초기 1회만** 부르고 재생성 경로에서는 부르지 마십시오.

#### 9.4.5 정렬

RealGrid 셀은 기본 중앙정렬입니다. `text-center` 를 붙일 이유가 없습니다. 긴 텍스트는 `styleName:"left-column"`, 금액은 `"right-column"`. 두 클래스는 2.6.3 · 2.8.8 **양쪽 style/dark CSS 에 모두** 정의돼 있어 쿠키 `INDEX_PATH` 로 버전이 갈려도 안전합니다.

### 9.5 샘플 데이터 블록 규약

#### 9.5.1 `USE_SAMPLE` 경계

샘플 블록은 **통째로 삭제 가능**해야 하며, **주입 지점은 2곳을 넘지 않아야** 합니다.

```js
// 지점 1 — 목록
function getData(searchCond){
    G_STD_YM = searchCond.STD_YM;
    if (USE_SAMPLE) { fnBindData(fnSampleList()); return; }
    logosAjax.requestToken(gToken, "${KiiPS_SY}/SYAPI/MI10xx/LIST", ...);
}

// 지점 2 — 드릴다운
if (USE_SAMPLE) {
    let smp = fnSampleDetail(rowCd, colCd);
    mctx.sum = fnSumOf(smp, mk);
    fnShowDetailModal(smp, mkind, fnDetailCols(mk, r, colCd, mctx), mctx);
    return;
}
```

`fnSampleList()` 는 **실제 LIST 응답과 동일한 형태**(`ROW_CD`/`BEF_QTR_BLNC_AMT`/…)로 만들어 `fnBindData` 를 그대로 태웁니다 → 샘플 경로와 실경로가 **같은 바인딩 코드**를 지납니다. 샘플에서만 도는 별도 바인딩을 만들면 이 보장이 깨집니다.

샘플 블록은 들여쓰기도 0칸으로 낮춰 시각적으로 분리합니다.

#### 9.5.1.1 샘플 경계선 긋기 — 운영 코드가 안에 섞이면 삭제가 파괴적이 된다

**⛔ 샘플 블록을 통삭제하기 전에, 운영 경로가 참조하는 심볼이 전부 경계 *위*에 있는지 반드시 확인하십시오.** `//====[샘플 데이터]====` ~ `//====조회 / 생성 / 엑셀====` 구간 안에 운영 심볼이 하나라도 남아 있으면 조회는 되지만 **첫 셀 클릭에서 `fnDetailKind is not defined` 로 드릴다운이 통째로 죽습니다.**

> `MI1010.jsp` 의 경계는 **2026-08-11 교정됨** — `fnDetailKind` · `KIND_NM` · `fnDetailCols` · `fnIsFundBlk` · `fnIsEtcBlk` 를 배너 **위**(운영 영역)로 이동.

| 경계 **위**(운영 영역 — 남긴다) | 경계 **아래**(삭제 대상) |
|---|---|
| `fnDetailKind` · `KIND_NM` | `fnSeed` · `fnRnd` |
| `fnDetailCols` (+ 내부 `C` / `N` / `fundCols` / `CNT_FOOT`) | `fnSmpLeaf` · `fnSmpCnt` · `fnSmpSum` · `fnSmpSplit` |
| `fnGdsKey` · `fnIsFundBlk` · `fnIsEtcBlk` · `fnFundPool` | `fnSmpDt` · `fnSmpYear` · `fnSmpLines` |
| `fnCntrNo` · `fnPick` (`fnDetailCols` 경로가 간접 의존) | `fnSampleList` · `fnSampleDetail` |
| `let G_STD_YM = "";` 선언 (`getData` 가 대입) | `SMP_*` 상수 (`SMP_PARTS` · `SMP_DIFF` · `SMP_CO` · `SMP_FUND` · `SMP_GP` · `SMP_GDS`) |
| 배지 매핑(`fnBadge`) — Part 8.9 | `USE_SAMPLE` 플래그와 2개 주입 지점 |

**신규 화면에서는 배치만 다르게 하고 코드는 그대로 쓰십시오.** 위 표의 왼쪽 열을 `USE_SAMPLE` 선언보다 **위**에 두면 블록 통삭제가 안전해집니다.

검증 방법: 삭제 후 `fnOpenDetail` 이 참조하는 심볼이 전부 살아 있는지 확인하십시오(호출부 ↔ 정의부 대조). 통과 기준은 "옮겼다" 가 아니라 **경계 위 영역을 대상으로 한 `grep "SMP_\|fnSmp\|fnSample"` 이 0건**인 것입니다(주입 지점 2곳 제외). "삭제해도 조회가 된다" 는 통과 근거가 아닙니다 — 드릴다운은 클릭해야 터집니다.

#### 9.5.2 결정적 시드 — `Math.random` 금지

- **증상**: 조회할 때마다 값이 바뀌어 회귀(버그)와 잡음을 구분할 수 없다.
- **원인**: `Math.random()` 사용.
- **올바른 코드**: 코드 문자열에서 결정적으로 만듭니다 (FNV-1a 해시 → LCG). 시드 키는 항상 의미 있는 문자열 조합이고, 필드별로 접미사로 네임스페이스를 나눕니다(`seed+"c"+i`, `seed+"d"+i` 등). 같은 셀을 몇 번 열어도 같은 명세가 나옵니다.

#### 9.5.3 값은 반드시 백만원 정수배

- **증상**: 소계와 구성행의 합이 화면에서 어긋나 보인다.
- **원인**: 화면이 `Math.round(n / 1,000,000)` 으로 환산하므로 배수가 아니면 **반올림 오차**가 누적됩니다.
- **올바른 코드**: 금액 리프는 `* G_WON` 으로 만들고, 불일치 델타도 `G_WON` 정수배로 주십시오(50만원 미만 델타는 환산 후 같은 숫자로 찍혀 버그처럼 보입니다). 건수 행은 환산 대상이 아니므로 작은 정수를 씁니다.

#### 9.5.4 리프 → 롤업 구조

소계/합계를 따로 만들지 말고 **리프에서 만들어 롤업**하십시오. 그래야 화면 숫자와 모달 '구성 내역'이 구조적으로 어긋날 수 없습니다.

`SMP_PARTS`(소계/합계가 어떤 행들의 합인지)가 **단일 진실원**이며, 값 생성(롤업)과 드릴다운 구성 내역 조회가 **같은 정의를 공유**합니다.

#### 9.5.5 잔차 흡수 분할

셀 총액을 명세 N 건으로 쪼갤 때, **각 건의 '화면 표시값' 합이 셀 표시값과 정확히 일치**해야 합니다. `step` 배수(금액=`G_WON`, 건수=`1`)로만 쪼개고 **마지막 건이 잔차를 흡수**하게 하십시오. 음수(F열 평가손실 등)도 부호를 유지한 채 분할합니다.

### 9.6 검색조건 초기화

#### 9.6.1 기본값은 모달과 같은 경로로

- **증상**: 기본 태그에 필수(빨강) 스타일이 안 붙거나, yearpicker 가 "기준일" 태그를 따로 만든다.
- **원인**: 인풋에 값을 직접 넣었기 때문.
- **올바른 코드**: `#quarterModal` 의 hidden 필드를 채운 뒤 `fnQuarterSet($qm)` 를 호출합니다. 인풋은 placeholder 를 유지하고 값은 태그로만 표현합니다. `getMonth()` 는 0-based 이므로 분기는 `Math.floor(getMonth()/3) + 1`.

#### 9.6.2 `STD_QTR === undefined` 가드

조회·생성·엑셀·드릴다운 **네 함수 모두** 동일한 프리앰블을 공유합니다. 분기 초기 셋팅 시점 문제로 태그가 아직 없을 수 있으므로 조용히 return 합니다.

```js
let tagItems   = $("#FILTER_INPUT_TAG").tagsinput('items');
let searchCond = createObjectForSearchAjax(tagItems);
if (searchCond.STD_QTR === undefined) { return; }
searchCond.STD_YM = getSTD_YM(searchCond.STD_QTR);
```

#### 9.6.3 ready 마지막 순서

**조회 전에도 서식이 보이도록 빈 표를 먼저 그린 뒤** 조회합니다.

```js
fnRenderTable();        // 빈 서식 먼저
MAIN_SEARCH_FILTER();   // 그 다음 조회
```

### 9.7 파일 / 환경

#### 9.7.1 줄바꿈 혼재

- **증상**: 한 줄만 고쳤는데 `svn diff` 가 파일 전체를 보여준다.
- **원인**: MI1010·MI1001·`inc_mi_button.jsp`·`header.jsp` 는 **순수 CRLF**, 같은 폴더의 MI0333 은 **순수 LF** 입니다. "이 폴더는 CRLF" 라고 뭉뚱그리면 틀립니다. `sed`/`awk` 리다이렉트 편집은 줄바꿈을 통째로 바꿉니다.
- **올바른 코드**: 편집 전 대상 파일의 줄바꿈을 실측하고, python 편집 시 `open(..., newline='')` 을 쓰십시오. 인코딩은 UTF-8(BOM 없음).

#### 9.7.2 자동 빌드 금지

앱이 로컬 실행 중이라 `mvn clean` 은 target 잠금으로 실패합니다. JSP 는 라이브 반영되므로 편집 후 정적 검증 + 새로고침 안내로 끝내십시오. Java(`MIUIController`, SY 모듈) 변경은 빌드가 필요하지만 **사용자가 명시적으로 요청할 때만** 실행하십시오.

### 9.8 코딩 관용구 (규범으로 옮길 것)

레퍼런스에서 반복 관찰되는, 계승할 가치가 있는 습관들입니다.

| 관용구 | 내용 |
|--------|------|
| 조용한 실패 금지 | 레이아웃 속성 등 '적용됐는지 알 수 없는' 설정은 되읽어 검증하고 `console.warn('[화면ID] ...')` 로 남긴다 |
| 방어적 라벨 접근 | `(r.labels && r.labels[n]) \|\| ''` — `spanLabel` 행은 `labels` 자체가 없다 |
| API 계약 주석화 | 요청/응답 payload 를 함수 위 블록 주석으로 못박는다 ('배열 순서 무관', '금액은 원 단위 정수', 'D·E' 는 화면 계산') |
| 미확정 값 표시 | `// TODO 확인필요` + 추정 근거를 함께 남긴다 |
| 부동소수 비교 | `Math.abs(df) <= 0.5` — 등호 비교 금지 |
| CSS 명시도로 `!important` 회피 | id 셀렉터 / `:not()` / `[data-theme=dark]` 쌍 선언 |
