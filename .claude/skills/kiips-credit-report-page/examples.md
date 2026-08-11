# KiiPS Credit Report Page Guide - Examples

복붙 가능한 코드 조각입니다. 판단·절차는 [SKILL.md](SKILL.md), 스펙 상세는 [reference.md](reference.md) 를 보십시오.

> ⚠️ **붙여넣은 뒤 반드시 심볼 대조를 하십시오.** 이 문서의 조각들은 서로를 호출합니다(예: `fnOpenDetail` → `fnDetailKind`/`KIND_NM`/`fnDetailCols`, 주입 지점 2 → `fnSampleDetail`). 필요한 Part 를 빠뜨리면 **셀 클릭 시점에** `... is not defined` 로 죽습니다 — 조회는 정상으로 보이므로 눈으로는 못 잡습니다.
> 최소 세트: Part 10(골격) + 12(표) + 13(검증열) + 14.1~14.6(모달 전체) + 15(샘플을 쓸 때만).

아래 예제의 `MI10xx` 는 실제 화면 ID 로 치환하십시오. **줄바꿈은 대상 파일의 기존 방식(대개 CRLF)에 맞추십시오** (reference.md Part 9.7.1).

---

## Part 10: 페이지 골격 JSP

`KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/MI/MI10xx.jsp`

include 순서가 계약입니다. `header.jsp` 는 **static include**(`<%@ include %>`)여야 `ScreenAuth` 맵이 스코프에 들어옵니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../include/header.jsp"%>
<jsp:include page="../include/sidemenu.jsp" flush="false">
    <jsp:param name="MENU_SCREEN_ID" value="MI10xx" />
</jsp:include>
<jsp:include page="../include/inc_files.jsp"></jsp:include>
<spring:eval expression="@environment.getProperty('web.realgrid.lic')" 	var="KiiPS_GRID" />
<spring:eval expression="@environment.getProperty('KiiPS.LOGIN.URL')" 	var="KiiPS_LOGIN" />
<spring:eval expression="@environment.getProperty('KiiPS.SY.URL')" 		var="KiiPS_SY" />
<%
    // 화면에 나와야 하는 검색조건 (이 계열은 기준분기 단일 조건)
    String SEARCH_CONDITION =
            "MAIN_SEARCH_STD_QTR"
            ;

    String[] SCREEN_DATA 	= ScreenAuth.get("MI10xx").split("\\|");
    String SCREEN_AUTH 		= SCREEN_DATA[0];
    String SCREEN_SHORT_CUT = SCREEN_DATA[3];
    String SCREEN_NM 		= SCREEN_DATA[1];
    String SCREEN_NM_LINE 	= Utils.getInstance().getScreenNmLine(SCREEN_DATA[2]);
%>
<style>
    /* Part 16 참조 */
</style>
<section role="main" class="content-body content-body-modern mt-0 pb-1">
    <%@ include file="../include/inc_page_header.jsp"%>
    <!-- start: page -->
    <div class="row">
        <div class="col">
            <div class="card ">
                <!-- strat : 검색필터 -->
                <jsp:include page="../include/inc_filter_main.jsp" flush="false">
                    <jsp:param name="MAIN_SCREEN_ID" value="MI10xx" />
                    <jsp:param name="MAIN_SEARCH_CONDITION" value="<%=SEARCH_CONDITION%>" />
                </jsp:include>
                <!-- end : 검색필터 -->
                <jsp:include page="../include/inc_main_button.jsp" flush="false">
                    <jsp:param name="MENU_SCREEN_ID" value="MI10xx" />
                </jsp:include>

                <%-- 셀 클릭 안내 — 표준 alert 패턴. 문구는 렌더 로직의 클릭 조건과 1:1 로 맞춘다. --%>
                <div class="alert alert-info-light p-2 pl-3 mb-1">
                    <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
                    <i class="fas fa-info-circle"></i>
                    <b>원천 데이터 셀</b>을 클릭하면 <b>개별 명세</b>가,
                    <b>소계·합계 셀</b>을 클릭하면 <b>구성 내역</b>이 열립니다.
                    <b>당분기중 순실행(D)</b>은 B−C 자동계산이라 클릭되지 않습니다.
                </div>

                <!-- start : 메인 조회 -->
                <small class="text-xxs mr-2 pull-right mb-2" id="unitLbl">(단위: 개, 건, 백만원)</small>
                <div class="dataTables_wrapper scrollbar-dynamic scrollbar-outer" >
                    <table class="display no-footer dataTable" id="rep">
                        <%-- 라벨 6열 + 값 6열. 검증 2열은 폭 미지정(CSS 에서 준다). --%>
                        <col style="width:4%" />
                        <col style="width:9%" /><col style="width:9%" /><col style="width:9%" />
                        <col style="width:9%" /><col style="width:9%" />
                        <col style="width:8.5%" /><col style="width:8.5%" /><col style="width:8.5%" />
                        <col style="width:8.5%" /><col style="width:8.5%" /><col style="width:8.5%" />
                        <col /><col />
                        <thead>
                        <tr>
                            <th rowspan="3" colspan="6">코드 / 행열명</th>
                            <th>A</th><th>B</th><th>C</th><th>D</th><th>F</th><th>E</th>
                            <th class="vcol">E'</th>
                            <th class="vcol">V</th>
                        </tr>
                        <tr>
                            <th rowspan="2">전분기말<br />잔액</th>
                            <th colspan="4">당분기 중</th>
                            <th rowspan="2">당분기말<br />잔액</th>
                            <th rowspan="2" class="vcol">당분기말잔액<br />(수식 A+B-C+F)</th>
                            <th rowspan="2" class="vcol">검증</th>
                        </tr>
                        <tr>
                            <th>당분기중<br />실행</th>
                            <th>당분기중<br />회수</th>
                            <th>당분기중<br />순실행</th>
                            <th>기타</th>
                        </tr>
                        </thead>
                        <tbody id = 'dataTable_body'>
                        </tbody>
                    </table>
                </div>
                <!-- end : 메인 조회 -->

            </div>
        </div>
    </div>
    <!-- end: page -->
</section>

<%-- 드릴다운 모달 → Part 14 --%>

<script>
    /* 상세 그리드 초기화 → Part 14 */
    /* G_ROWS / 렌더 → Part 12 */
    /* 조회·생성·엑셀·ready → Part 12.4 */
</script>
<%@ include file="../include/footer_sidemenu.jsp" %>
```

### 10.1 가이드 서랍 (선택)

보고서 작성요령은 공통 서랍 컴포넌트로 넣습니다. **스크립트 1줄 + 컨테이너 div 1개**가 전부입니다.

```jsp
<script src="${KiiPS_GATE}/js/kiips-guide-drawer.js?ver=260806_1"></script>
<div class="kiips-guide" id="MI10xx_GUIDE"
     data-guide-title="{서식명}({서식코드}) 작성가이드"
     data-guide-tab="작성가이드"
     data-guide-hold="3000"
     data-guide-key="MI10xx_GUIDE_NO_AUTO">
    <ul class="list-unstyled mb-0">
        <li class="mb-2">
            <span class="pillsbadge-blue">작성 주기</span>
            <ul class="list-unstyled mb-0"><li>분기</li></ul>
        </li>
        <li>
            <span class="pillsbadge-blue">작성 요령</span>
            <ol class="mb-0">
                <li>{요령 1}</li>
            </ol>
        </li>
    </ul>
    <%-- 여기서 끝. 하단 '자동 열림 방지' 체크박스와 왼쪽 손잡이 탭은 공통 JS 가 만들어 붙인다.
         체크박스를 직접 넣지 말 것 : 공통 JS 가 또 하나 만든다. --%>
</div>
```

- `${KiiPS_GATE}` / `${KiiPS_COMMON}` 은 `header.jsp` 가 `spring:eval` 로 정의합니다 (페이지에서 다시 선언하지 않음)
- `?ver=` 캐시버스터 필수
- 서랍 목록 마커 복원 CSS → Part 16

---

## Part 11: inc_mi_button.jsp 분기 블록

`KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/button/inc_mi_button.jsp`

기존 체인의 마지막 분기 뒤가 아니라, **MI10 계열 분기들 사이의 적절한 위치**에 `else if` 를 추가하십시오. 종단 `else` 가 없으므로 분기를 빠뜨리면 툴바가 조용히 빕니다.

### 11.1 단위 셀렉트 + 검증 토글이 있는 전용 분기

```jsp
}else if(MENU_SCREEN_ID.equals("MI10xx")){
	//Total + 단위(백만원/원) + 검증 토글 + 조회 + 생성 + 엑셀 + 도움말
%>
	<!-- start: DYNAMIC TABLE PANEL -->
	<div class="col-12 col-lg-auto mb-3 mb-lg-0 pl-0 pr-0 mt-3">
		<div class="main_gridRow">
			<div class="gridpage_info">
				<div class="in-bl px-3 brd_card rounded-5"> <span id="Total_Cnt">Total 0</span></div>
				<div class="form-inline in-bl">
					<div class="in-bl mx-1">단위</div>
					<select id="UNIT_SEL" class="selectpicker show-tick form-control" data-hide-disabled="true" data-gbn="select" data-id="UNIT_SEL">
						<option value="M" selected="selected">백만원</option>
						<option value="W">원</option>
					</select>
				</div>
			</div>
			<div class="maingrid_button">
				<button type="button" id="btn_reload" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="조회" onClick="MAIN_SEARCH_FILTER()"><span class="icon_reload"></span></button>
				<button type="button" id="btn_verify" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="검증 (양식 수식 A+B-C+F 와 원장 집계 E 대사)" aria-label="검증" aria-pressed="false" onClick="fnToggleVerify()"><i class="fa-solid fa-check-double"></i></button>
				<button type="button" id="btn_regist" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="생성" onclick="setData()"><i class="fa-solid fa-plus"></i></button>
				<button type="button" id="btn_excel" class="btn btn-only-icon btn-primary buttons-row" data-toggle="tooltip" aria-haspopup="true" aria-expanded="false" title="엑셀 다운로드" onClick="fn_excelDown()"><span class="icon_excel icon_wh"></span></button>
				<button type="button" id="btn_help" class="btn btn-only-icon btn-xl btn-outline-primary" data-toggle="tooltip" data-placement="top" title="도움말" onClick="javascript:ScreenHelp(window.location.pathname)" ><i class="fa-solid fa-question"></i></button>
			</div>
		</div>
	</div>
<%
```

**규칙:**
- 아이콘 전용 버튼은 전부 `btn btn-only-icon btn-xl btn-outline-primary` + `data-toggle="tooltip"`
- **엑셀만 예외** — `btn-primary` + `icon_wh`(아이콘 반전)
- 토글 버튼은 `aria-label` + `aria-pressed="false"` 초기값
- `onClick` 이 부르는 함수는 **페이지 JSP 에 전부 정의**돼 있어야 합니다

### 11.2 추가 컨트롤이 필요 없는 경우

기존 MI1001~MI1008 공유 OR 묶음에 화면 ID 만 추가하십시오.

```jsp
}else if(MENU_SCREEN_ID.equals("MI1001") || ... || MENU_SCREEN_ID.equals("MI1008")
      || MENU_SCREEN_ID.equals("MI10xx")){
```

⚠️ 이 묶음에는 `UNIT_SEL` 도 `btn_verify` 도 없습니다. 공유 분기에 버튼을 추가하면 **묶인 모든 화면에 파급**되고, 각 화면에 없는 함수를 참조하게 됩니다.

---

## Part 12: 고정 서식 표 + 단위 전환

### 12.1 행 정의 (`G_ROWS`)

> 아래 코드 세트(`AAA` · `A111` · `A1111` · `A113` · `A12` · `A13` · `A1` · `A2` · `A`)는
> **Part 15 의 샘플 생성기와 정확히 일치**합니다. 두 조각을 함께 복붙하면 모든 행에 값이 채워집니다.
> 코드를 늘릴 때는 **Part 15 의 `fnSmpVals` · `SMP_PARTS` 도 함께** 늘리십시오 — 한쪽만 늘리면
> 값 없는 빈 행이나 화면에 안 나오는 값이 생깁니다.
>
> 실제 서식은 95행 규모라 `pair` / `investBlock` / `chulja` 팩토리로 조립합니다 →
> 팩토리 스펙은 [reference.md](reference.md) Part 5.2 참조. 여기서는 병합·음영·클릭 동작을
> 확인할 수 있는 최소 세트만 둡니다.

```js
/* =====================================================================
   화면 구조 정의
   - 코드/라벨은 보고서 서식의 고정 구조이며 데이터가 아니다.
   - 값은 전부 /SYAPI/MI10xx/LIST 응답으로 채운다. (하드코딩 없음)
   - cnt : true 인 행은 건수/개수 이므로 단위 환산 대상이 아니다.
   - sub : true 인 행은 값 자체는 원천이지만 서식상 음영 처리되는 행이다.
   ===================================================================== */
const NLAB = 5;
let G_ROWS = (function(){
    let rows = [];
    function push(o){ rows.push(o); }

    // 건수 행 — cnt:true 라 단위 환산 대상이 아니고, sub:true 라 음영이 붙는다
    push({ code:'AAA',   labels:['회사분','투자업체수','','',''],              kind:'data', cnt:true, sub:true });
    // 원천(리프) 행 — 빈 문자열 라벨은 오른쪽으로 colspan 병합된다
    push({ code:'A111',  labels:['회사분','투자','투자주식','보통주','취득원가'], kind:'data' });
    push({ code:'A1111', labels:['회사분','투자','투자주식','우선주','취득원가'], kind:'data' });
    // 소계 행 — 상위 라벨('회사분>투자>투자주식')이 같아 세로 병합이 이어진다
    push({ code:'A113',  labels:['회사분','투자','투자주식','합계','취득원가'],   kind:'subtotal' });
    push({ code:'A12',   labels:['회사분','투자','투자사채','','취득원가'],       kind:'data' });
    push({ code:'A13',   labels:['회사분','투자','조건부융자','','취득원가'],     kind:'data' });
    push({ code:'A1',    labels:['회사분','투자','소계','','취득원가(A)'],        kind:'subtotal' });
    push({ code:'A2',    labels:['회사분','신기술금융대출금','','','대출금액'],    kind:'data' });
    // 블록합계 행 — labels 가 없고 spanText 로 라벨 5열을 통째 병합한다
    push({ code:'A',     spanLabel:true, spanText:'회사분 합계 (D)',             kind:'total' });

    return rows;
})();

// code -> row 역인덱스 (드릴다운에서 사용)
let G_RMAP = (function(){
    let m = {};
    for (let i=0; i<G_ROWS.length; i++) m[G_ROWS[i].code] = G_ROWS[i];
    return m;
})();

let G_UNIT   = 'M';        // 'M' = 백만원, 'W' = 원
let G_VERIFY = false;      // 검증열(E', V) 노출 여부
let G_VALS   = {};         // ROW_CD -> { A, B, C, F, E }
const G_WON  = 1000000;
const G_COLS = ['A','B','C','D','F','E'];   // 표시 순서 (알파벳 순 아님)
```

### 12.2 숫자 표시 유틸

```js
function fnNum(v){
    if (v === null || v === undefined || v === '') return null;
    let n = Number(v);
    return isNaN(n) ? null : n;
}
// 음수 대응 콤마 (StringUtil.addComma 는 부호를 다루지 않으므로 절대값에만 적용)
function fnComma(n){
    return (n < 0 ? '-' : '') + StringUtil.addComma(Math.abs(n));
}
// 표시 단위 환산. 건수/개수 행(isCnt)은 환산하지 않는다.
function fnDisp(v, isCnt){
    let n = fnNum(v);
    if (n === null) return null;
    if (isCnt) return Math.round(n);
    return (G_UNIT === 'M') ? Math.round(n / G_WON) : Math.round(n);
}
// 셀 문자열. null/undefined 는 공란, 0 은 '-' (형제 화면의 undefined 출력 문제 방지)
function fnCell(v, isCnt){
    let n = fnDisp(v, isCnt);
    if (n === null) return '';
    if (n === 0) return '-';
    return fnComma(n);
}
function fnUnitNm(){ return (G_UNIT === 'M') ? '백만원' : '원'; }
```

### 12.3 병합 행렬 · 음영 · 렌더

```js
// 세로 병합은 상위 라벨이 모두 동일할 때만 이어지며, 블록합계(spanLabel) 행에서 강제로 끊긴다.
function fnCalcSpan(rows){
    let R = rows.length;
    let span = [], skip = [];
    for (let i=0; i<R; i++) { span.push(new Array(NLAB).fill(0)); skip.push(new Array(NLAB).fill(false)); }
    for (let c=0; c<NLAB; c++) {
        for (let i=0; i<R; i++) {
            let ri = rows[i];
            if (ri.spanLabel) { span[i][c] = 0; skip[i][c] = true; continue; }
            let val = (ri.labels && ri.labels[c]) || '';
            if (val === '') { span[i][c] = 0; skip[i][c] = 'empty'; continue; }
            if (skip[i][c]) continue;
            let len = 1;
            for (let j=i+1; j<R; j++) {
                let rj = rows[j];
                if (rj.spanLabel) break;                       // 블록합계에서 강제 절단
                let sameSelf = ((rj.labels && rj.labels[c]) || '') === val;
                let sameParents = true;
                for (let p=0; p<c; p++) {                      // 상위 라벨 전부 일치해야 이어진다
                    if (((rj.labels && rj.labels[p]) || '') !== ((ri.labels && ri.labels[p]) || '')) { sameParents = false; break; }
                }
                if (sameSelf && sameParents) { len++; skip[j][c] = true; } else break;
            }
            span[i][c] = len;
        }
    }
    return { span:span, skip:skip };
}

// 소계/합계 음영 클래스. ⚠️ bg_subsum·bg_totsum 은 서빙되는 스타일시트에 정의가 없을 수 있다
// (bg_totsum 정의 0건 / bg_subsum 은 로드되지 않는 datatables.scss 에만) → 음영은 실측 확인.
// reference.md Part 9.2.1
function fnShadeOf(r){
    if (r.kind === 'data')     return r.sub ? ' bg_subsum' : '';
    if (r.kind === 'subtotal') return ' bg_subsum';
    return ' bg_subsum bg_totsum';   // total / grandtotal
}
// rowspan 셀은 걸쳐 있는 모든 행의 음영이 같을 때만 음영을 준다.
function fnSpanShade(i, rs){
    let s = fnShadeOf(G_ROWS[i]);
    for (let j=i+1; j<i+rs; j++) { if (fnShadeOf(G_ROWS[j]) !== s) return ''; }
    return s;
}

function fnColVal(v, col){
    if (!v) return null;
    if (col === 'D') {                       // D 는 파생열 (서버 필드 없음)
        if (v.B === null && v.C === null) return null;
        return (v.B || 0) - (v.C || 0);
    }
    return v[col];
}

function fnBindData(list){
    G_VALS = {};
    if (list && list.length) {
        for (let i=0; i<list.length; i++) {
            let d = list[i];
            if (!d || !d.ROW_CD) continue;   // 배열 순서 무관 — ROW_CD 로 매핑
            G_VALS[d.ROW_CD] = {
                  A : fnNum(d.BEF_QTR_BLNC_AMT)
                , B : fnNum(d.NOW_QTR_EXEC_AMT)
                , C : fnNum(d.NOW_QTR_RCVR_AMT)
                , F : fnNum(d.NOW_QTR_ETC_AMT)
                , E : fnNum(d.NOW_QTR_BLNC_AMT)
            };
        }
    }
    fnRenderTable();
}

function fnRenderTable(){
    let mg = fnCalcSpan(G_ROWS);
    let html = '';
    for (let i=0; i<G_ROWS.length; i++) {
        let r     = G_ROWS[i];
        let shade = fnShadeOf(r);
        let v     = G_VALS[r.code] || null;

        html += '<tr>';
        html += '<th class="code-c' + shade + '">' + r.code + '</th>';

        if (r.spanLabel) {
            html += '<th colspan="' + NLAB + '" class="spanlbl' + shade + '">' + r.spanText + '</th>';
        } else {
            for (let c=0; c<NLAB; c++) {
                if (mg.skip[i][c] === 'empty') continue;
                if (mg.skip[i][c] === true)    continue;
                let cs = 1;   // 오른쪽으로 이어지는 빈 라벨을 colspan 으로 환산
                for (let k=c+1; k<NLAB; k++) { if (((r.labels && r.labels[k]) || '') === '') cs++; else break; }
                let rs = (mg.span[i][c] > 1) ? mg.span[i][c] : 1;
                let at = '';
                if (cs > 1) at += ' colspan="' + cs + '"';
                if (rs > 1) at += ' rowspan="' + rs + '"';
                html += '<th class="lbl' + fnSpanShade(i, rs) + '"' + at + '>' + ((r.labels && r.labels[c]) || '') + '</th>';
            }
        }

        // 값 셀 — D(순실행)는 파생열이므로 비클릭, 값 없음/0 도 비클릭
        for (let n=0; n<G_COLS.length; n++) {
            let col = G_COLS[n];
            let raw = fnColVal(v, col);
            let cls = 'dt-right' + shade + (col === 'D' ? ' col-net' : '');
            let att = '';
            if (col !== 'D' && raw !== null && raw !== 0) {
                // 클릭 셀은 기본이 키보드 불가. role/tabindex 를 붙이고 Enter/Space 는
                // ready 의 위임 핸들러가 처리한다 (SKILL.md 4.6)
                cls += ' clickable';
                att  = ' role="button" tabindex="0"'
                     + ' onclick="fnOpenDetail(\'' + r.code + '\',\'' + col + '\')"';
            }
            html += '<td class="' + cls + '"' + att + '>' + fnCell(raw, r.cnt) + '</td>';
        }

        html += fnVerifyCells(r, v, shade);   // Part 13
        html += '</tr>';
    }
    $('#dataTable_body').html(html);
    $('#Total_Cnt').text('Total ' + G_ROWS.length);
    $('#unitLbl').text('(단위: 개, 건, ' + fnUnitNm() + ')');
}
```

### 12.4 단위 전환 + 조회/생성/엑셀 + ready

```js
// 표시 단위 전환은 재조회 없이 렌더만 다시 돈다.
function fnSetUnit(u){
    if (G_UNIT === u) return;
    G_UNIT = u;
    fnRenderTable();
}

// 기준분기(YYYY-NQ) -> 기준년월(YYYYMM)
function getSTD_YM(stdQtr) {
    let v = String(StringUtil.nvl(stdQtr, '')).replaceAll("'", '');
    if (v.length < 6) return '';
    let strYear = v.substring(0, 4);
    switch (v.substring(5, 6)) {
        case '1' : return strYear + '03';
        case '2' : return strYear + '06';
        case '3' : return strYear + '09';
        case '4' : return strYear + '12';
        default  : return '';
    }
}

function getData(searchCond){
    G_STD_YM = searchCond.STD_YM;   // 명세 생성·계약번호가 참조 (선언은 Part 15 상단)
    logosAjax.requestToken(
         gToken
        ,"${KiiPS_SY}/SYAPI/MI10xx/LIST"
        ,"POST"
        ,searchCond
        ,function(data) {
            let list = (data && data.body && data.body.LIST) ? data.body.LIST : [];
            if (list.length === 0) { MESSAGE_HANDLE('먼저 데이터를 생성해주세요.'); }
            // 데이터가 없어도 서식은 공란으로 그려 화면이 깨지지 않게 한다.
            fnBindData(list);
        });
}

function MAIN_SEARCH_FILTER() {
    let tagItems   = $("#FILTER_INPUT_TAG").tagsinput('items');
    let searchCond = createObjectForSearchAjax(tagItems);
    // 분기 초기셋팅 시 시점 문제 예외처리
    if (searchCond.STD_QTR === undefined) { return; }
    searchCond.STD_YM = getSTD_YM(searchCond.STD_QTR);
    getData(searchCond);
}

$(document).ready(function(){
    // 기준분기 : 필수 + 기본값(현재 연도·분기)
    //   인풋은 placeholder 를 유지하고 값은 태그로만 표현한다.
    //   기본 태그도 모달을 거친 것과 같은 경로(fnQuarterSet)로 만들어야
    //   필수(빨강) 스타일이 붙고, yearpicker 가 "기준일" 태그를 따로 만들지 않는다.
    $('#MAIN_SEARCH_STD_QTR').attr('tag_type', 'required');
    let $qm = $('#quarterModal');
    $qm.find("[name=filterId]").val('MAIN_SEARCH_STD_QTR');
    $qm.find("[name=searchAutoYn]").val(false);
    $qm.find("[name=QTR_YY]").val(DateUtil.GetCurYear());
    $qm.find("[name=QTR_NO]").val(Math.floor(new Date().getMonth() / 3) + 1);   //getMonth() 는 0-based
    fnQuarterSet($qm);

    // 단위 변경 → 재조회 없이 렌더만 다시.
    // changed.bs.select 필수 : .selectpicker('val', v) 로 세팅하면 native change 는 안 뜬다.
    // id 셀렉터 필수 : data-id 는 select 와 생성된 button 두 곳에 붙어 2개가 매칭된다.
    $('#UNIT_SEL').on('changed.bs.select', function(){
        let v = $('#UNIT_SEL').val();
        if (Array.isArray(v)) v = v[0];
        fnSetUnit(v || 'M');
    });

    // 클릭 셀 키보드 조작 (Enter/Space). 셀이 수백 개라 인라인 onkeydown 대신
    // 위임 핸들러 1개로 처리한다 — 마크업 쪽은 role="button" tabindex="0" 만 붙인다.
    $('#rep').on('keydown', 'td.clickable, th.clickable', function(e){
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            $(this).trigger('click');
        }
    });

    // 조회 전에도 서식이 보이도록 빈 표를 먼저 그린다.
    fnRenderTable();
    MAIN_SEARCH_FILTER();
});
```

> ⚠️ **`setData()`(CREATE) 와 `fn_excelDown()`(EXCEL) 의 본문은 이 문서에 없습니다** — 툴바 `onClick` 이 직접 부르므로 반드시 직접 작성해야 합니다. 위 `MAIN_SEARCH_FILTER` 와 같은 4줄 프리앰블(`tagItems` → `createObjectForSearchAjax` → `STD_QTR === undefined` 가드 → `STD_YM`)을 공유합니다.
> ⚠️ 레퍼런스의 `setData` VO 필드명과 `downExcel` 좌표는 **미확정 TODO** 입니다. 백엔드와 맞춘 뒤 확정하십시오 (reference.md Part 9.1.5).

---

## Part 13: 검증열 렌더 + 토글

```js
// 검증 2열은 조건 없이 매 행 그리고, 노출은 CSS 클래스(.von)가 결정한다.
function fnVerifyCells(r, v, shade){
    if (!v) {
        // 데이터 없는 행도 빈 vcol 셀 2개를 그려 열 수를 유지한다.
        return '<td class="dt-right vcol' + shade + '"></td>'
             + '<td class="dt-right vcol' + shade + '"></td>';
    }
    let fx  = (v.A || 0) + (v.B || 0) - (v.C || 0) + (v.F || 0);
    let df  = (v.E || 0) - fx;
    let ok  = Math.abs(df) <= 0.5;                 // 부동소수 여유
    let tip = ok ? '원장 집계 = A+B-C+F'
                 : '원장 ' + fnCell(v.E, r.cnt) + ' vs 수식 ' + fnCell(fx, r.cnt) + ' · 차이 ' + fnCell(df, r.cnt);
    let ngc = ok ? '' : ' text-danger font-weight-bold';

    // title 툴팁은 키보드 포커스가 가야 읽힌다 → role/tabindex 필수 (SKILL.md 4.6).
    // Enter/Space 는 ready 의 위임 keydown 핸들러가 처리한다.
    let a11y = ' role="button" tabindex="0"';

    return '<td class="dt-right vcol clickable' + shade + ngc + '" title="' + tip + '"' + a11y
         + ' onclick="fnOpenVerify(\'' + r.code + '\')">' + fnCell(fx, r.cnt) + '</td>'
         + '<td class="dt-right vcol clickable' + shade + (ok ? ' text-success' : ngc) + '" title="' + tip + '"' + a11y
         + ' onclick="fnOpenVerify(\'' + r.code + '\')">'
         + (ok ? 'OK' : '불일치 ' + (df > 0 ? '+' : '') + fnCell(df, r.cnt)) + '</td>';
}

// 검증열은 항상 그려두고 CSS 클래스(.von)로만 노출한다.
// (KiiPS 유틸리티 클래스가 display:inline-block !important 를 걸어 show()/hide() 가 무력화되므로)
function fnToggleVerify(){
    G_VERIFY = !G_VERIFY;
    $('#rep').toggleClass('von', G_VERIFY);
    $('#btn_verify').toggleClass('btn-primary', G_VERIFY)
                    .toggleClass('btn-outline-primary', !G_VERIFY)
                    .attr('aria-pressed', G_VERIFY ? 'true' : 'false');
}

// 검증 셀 클릭 → 차이가 있을 때만 드릴다운으로 위임
function fnOpenVerify(rowCd){
    let r = G_RMAP[rowCd];
    let v = G_VALS[rowCd];
    if (!r || !v) return;
    let fx = (v.A || 0) + (v.B || 0) - (v.C || 0) + (v.F || 0);
    let df = (v.E || 0) - fx;
    if (Math.abs(df) <= 0.5) {
        MESSAGE_HANDLE('원장 집계와 양식 수식(A+B-C+F)이 일치합니다.');
        return;
    }
    fnOpenDetail(rowCd, 'V');
}
```

---

## Part 14: 드릴다운 모달 + RealGrid

### 14.1 모달 마크업

```jsp
<!--상세 S -->
<div class="modal fade" id="MI10xxMD" aria-hidden="true" style="display: none; z-index: 1060;" data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <header class="card-header">
                <h2 class="card-title" id="MI10xx_MD_TITLE">
                    <span id="MI10xx_MD_TITLE_MAIN"><%=SCREEN_NM%></span>
                    <small class="text-muted font-weight-normal" id="MI10xx_MD_TITLE_SUB"></small>
                </h2>
                <%-- KiiPS 표준 닫기 (Bootstrap btn-close/close 금지) --%>
                <div class="card-actions"><a href="#" class="card-action card-action-dismiss  modal-dismiss" data-dismiss="modal"></a></div>
            </header>
            <div class="card-body px-5 py-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <h5 class="text-sm-5 mb-0" id="MI10xx_MD_CAP"></h5>
                    <button type="button" class="btn btn-only-icon btn-xl btn-outline-primary buttons-row"
                            onclick="javascript:ExcelExportWithGrid(gridViewM)"
                            data-toggle="tooltip" data-placement="top" title="엑셀 다운로드">
                        <span class="icon_excel"></span>
                    </button>
                </div>
                <div id="TB_MI10xx_MD"></div>
                <%-- 검증(V) 클릭 시에만 채워지는 안내 (그리드 아래) --%>
                <div id="MI10xx_MD_VSUM" class="mt-2"></div>
                <div class="bottom-btn">
                    <button type="reset" id="btn_closeModal" class="btn btn-outline-secondary font-weight-semibold btn-py-2 px-4 modal-dismiss" data-dismiss="modal"> 닫기 </button>
                </div>
            </div>
        </div>
    </div>
</div>
<!--상세 E -->
```

> ⚠️ `<%=SCREEN_NM%>` 는 KiiPS-UI/CLAUDE.md #1(스크립틀릿 직접 출력 금지, `<c:out>`/`fn:escapeXml` 필수)의 **예외**로, 값이 메뉴 DB(`ScreenAuth`)에서만 오는 계열 관례입니다. 사용자 입력이 섞이는 문자열에는 절대 쓰지 마십시오.

### 14.2 그리드 초기화 (createSimpleGrid 강제값 되돌리기)

```js
// 초기 컬럼은 자리잡기용. 실제 컬럼은 명세 종류에 따라 fnDetailCols 가 매번 다시 만든다.
let columnsM = [
      { fieldName:"TRGT_NM", width:"220", header:{text:"투자기업명"}, editable:false }
    , { fieldName:"AMT",     width:"140", header:{text:"금액"},       editable:false }
];

let dataProviderM = new RealGrid.LocalDataProvider(true);
let gridViewM     = new RealGrid.GridView("TB_MI10xx_MD");
createSimpleGrid("TB_MI10xx_MD", dataProviderM, gridViewM, columnsM);
// ↓ createSimpleGrid 가 강제한 4가지를 호출 '이후에' 되돌린다 → reference.md 9.4.1
gridViewM.setRowIndicator({visible: true});
gridViewM.onDataLoadComplated = function(){};
gridViewM.displayOptions.fitStyle = "even";
$('#TB_MI10xx_MD').css('height', '410px');
gridViewM.setFooters({ visible:true, items:[{height:36}] });
copyToClipboardGrid(gridViewM);   // ★ 초기 1회만 — 재호출하면 표시 옵션을 덮어쓴다
```

### 14.3 모달 표시 (shown.bs.modal + footerSpans)

```js
function fnShowDetailModal(list, kindNm, cols, ctx){
    $('#MI10xx_MD_CAP').text(kindNm || '명세');
    // RealGrid 는 컨테이너가 숨겨진 상태에서 setRows 하면 렌더되지 않는다.
    // .one() 필수 — .on() 이면 열 때마다 핸들러가 누적된다.
    $('#MI10xxMD').one('shown.bs.modal', function(){
        dataProviderM.clearRows();
        if (cols && cols.length) {
            // createSimpleGrid 는 setFields + setColumns 를 함께 처리하므로 그대로 재사용한다.
            createSimpleGrid("TB_MI10xx_MD", dataProviderM, gridViewM, cols);
            gridViewM.setRowIndicator({visible: true});
            gridViewM.onDataLoadComplated = function(){};
            gridViewM.displayOptions.fitStyle = "even";
            $('#TB_MI10xx_MD').css('height', '410px');

            // footer 행 수는 컬럼이 정의한 footers 길이에서 역산한다 (하드코딩 금지)
            let fcnt = 1;
            for (let i=0; i<cols.length; i++) if (cols[i].footers && cols[i].footers.length > fcnt) fcnt = cols[i].footers.length;
            let fitems = [];
            for (let i=0; i<fcnt; i++) fitems.push({height:36});
            gridViewM.setFooters({ visible:true, items:fitems });

            /* footerSpans 는 레이아웃 아이템 속성 → layoutByColumn 으로 설정 후 되읽어 검증.
               reference.md 8.10 */
            if (ctx && ctx.footSpanField && ctx.footSpanCount > 1) {
                try {
                    let lay = gridViewM.layoutByColumn(ctx.footSpanField)
                           || gridViewM.layoutByColumn(gridViewM.columnByField(ctx.footSpanField));
                    if (!lay) {
                        console.warn('[MI10xx] footerSpans - 레이아웃 항목 없음:', ctx.footSpanField);
                    } else {
                        let sp = [];
                        for (let i=0; i<fcnt; i++) sp.push(ctx.footSpanCount);
                        lay.footerSpans = sp;
                        let got = lay.footerSpans;
                        if (!got || got[0] !== ctx.footSpanCount) {
                            console.warn('[MI10xx] footerSpans 미적용 - 기대', ctx.footSpanCount, '실제', got);
                        }
                    }
                } catch (e) {
                    console.warn('[MI10xx] footerSpans 실패:', e && e.message);
                }
            }
        }
        if (list && list.length > 0) { dataProviderM.setRows(list); }
        gridViewM.refresh();
    });
    $('#MI10xxMD').modal('show');   // 반드시 핸들러 등록 다음 줄
}
```

### 14.4 진입점 `fnOpenDetail`

```js
const COL_NM = { A:'전분기말 잔액', B:'당분기중 실행', C:'당분기중 회수'
               , D:'당분기중 순실행', F:'당분기중 기타', E:'당분기말 잔액', V:'검증(차이 유발 거래)' };

function fnLabelPath(r){
    if (r.spanLabel) return r.spanText;
    let out = [];
    for (let i=0; i<NLAB; i++) { if (r.labels && r.labels[i]) out.push(r.labels[i]); }
    return out.join(' > ');
}

function fnOpenDetail(rowCd, colCd){
    let r = G_RMAP[rowCd];
    if (!r) return;

    let tagItems   = $("#FILTER_INPUT_TAG").tagsinput('items');
    let searchCond = createObjectForSearchAjax(tagItems);
    if (searchCond.STD_QTR === undefined) { return; }
    searchCond.STD_YM = getSTD_YM(searchCond.STD_QTR);
    searchCond.ROW_CD = rowCd;
    searchCond.COL_CD = colCd;

    let mk    = fnDetailKind(r, colCd);
    let mkind = (colCd === 'V') ? '대사 차이 내역' : (KIND_NM[mk] || '명세');
    let mval  = G_VALS[rowCd];
    // footer 라벨 접두. 한 줄로 뭉개면 전 종류가 같은 라벨이 된다 → kind 별 6갈래 (reference.md Part 8.6)
    let mctx  = { basis : (mk === 'sum')      ? '개별 명세'
                        : (mk === 'cntsum')   ? '구성 항목'
                        : (mk === 'yakjeong') ? (r.cnt ? '조합수' : '약정액')
                        : (mk === 'chulja')   ? ({ B:'출자(Capital Call)', C:'분배(Distribution)'
                                                 , F:'양수도(조합지분 양수·양도)' }[colCd]
                                                 || '출자잔액(출자−분배±양수도 누계)')
                        : (mk === 'entcnt' || mk === 'concnt')
                                              ? ((r.labels && (r.labels[4] || r.labels[1])) || '명세 건수')
                        : ((r.labels && r.labels[4]) || '금액')
                , cell  : mval ? fnDisp(fnColVal(mval, colCd), !!r.cnt) : null   // 본표에 그려진 그 셀의 표시값
                , cnt   : !!r.cnt };

    // 제목 2단 : 큰 글씨 = 클릭한 열 이름 / 작은 글씨 = 행 라벨 경로 (검증 모달은 소제목 없음)
    $('#MI10xx_MD_TITLE_MAIN').text((mk === 'verify') ? '당분기말잔액 검증 — 불일치' : (COL_NM[colCd] || colCd));
    $('#MI10xx_MD_TITLE_SUB').text((mk === 'verify') ? '' : ('— ' + fnLabelPath(r)));
    $('#MI10xx_MD_VSUM').html('');

    logosAjax.requestToken(
         gToken
        ,"${KiiPS_SY}/SYAPI/MI10xx/DETAIL"
        ,"POST"
        ,searchCond
        ,function(data) {
            let list = (data && data.body && data.body.LIST) ? data.body.LIST : [];
            mctx.sum = fnSumOf(list, mk);
            fnShowDetailModal(list, mkind, fnDetailCols(mk, r, colCd, mctx), mctx);
        });
}
```

### 14.5 컬럼 팩토리

```js
// No. 는 RealGrid 행번호(rowIndicator)가 담당하므로 컬럼으로 넣지 않는다.
function fnDetailCols(kind, r, colCd, ctx) {
    let cols = [];

    /* 텍스트 컬럼. 좌측정렬 명시 필요(RealGrid 기본은 중앙). 배지 필드는 html 렌더러. */
    function C(f, w, t){
        let o = { fieldName: f, width: String(w), header: { text: t }, editable: false };
        if (f === "TRGT_NM" || f === "GDS_NM" || f === "FUND_NM" || f === "GP_NM") o.styleName = "left-column";
        if (f === "BLNC_CD" || f === "DIV") o.renderer = { type: "html" };   // 배지 표시 (→ fnBadge)
        cols.push(o);
    }

    /* 숫자 컬럼 : 우측정렬 + 천단위 + footer 3행(합계 / 표시값 / 대사 결과) → reference.md 9.4.3 */
    function N(f, w, t){
        let ft = [{ "expression": "sum", numberFormat: "#,##0", styleName: "right-column" }];
        if (ctx && ctx.cell !== null && ctx.cell !== undefined) {
            ft.push({ text: fnComma(ctx.cell), styleName: "right-column" });
            ft.push({ text: (ctx.sum === ctx.cell) ? "일치" : "불일치", styleName: "right-column" });
            if (cols.length) {
                // 라벨은 왼쪽 텍스트 컬럼 전체를 병합해 "라벨 | 값" 형태로 읽히게 한다.
                cols[0].footers = [
                      { text: (ctx.basis || "") + " 합계",                          styleName: "right-column" }
                    , { text: (ctx.cnt ? "표시 값 (본표)" : "표시 금액 (본표)"),      styleName: "right-column" }
                    , { text: "대사 결과",                                          styleName: "right-column" }
                ];
                ctx.footSpanField = cols[0].fieldName;   // fnShowDetailModal 이 소비
                ctx.footSpanCount = cols.length;
            }
        }
        cols.push({ fieldName: f, width: String(w), header: { text: t }, editable: false,
                    dataType: "number", numberFormat: "#,##0", styleName: "right-column",
                    footers: ft });
    }

    /* 조합분 블록(labels[0] = 신기술사업투자조합분 / 기타조합분)에만 붙는 선행 컬럼.
       기타조합분이면 조합유형이 하나 더 붙는다. */
    function fundCols(){
        if (!fnIsFundBlk(r)) return;
        C("FUND_NM", 118, "조합명");
        if (fnIsEtcBlk(r)) C("FUND_TP", 82, "조합유형");
    }
    // 조합분 여부 판정 — 행 라벨 기준
    function fnIsFundBlk(row){
        let g0 = (row.labels && row.labels[0]) || "";
        return g0 === "신기술사업투자조합분" || g0 === "기타조합분";
    }
    function fnIsEtcBlk(row){ return ((row.labels && row.labels[0]) || "") === "기타조합분"; }

    /* 금액 컬럼이 없는 명세(업체수·건수)는 footer 1행으로 건수 대사를 붙인다.
       단위는 라벨이 /건수$/ 면 '건', 아니면 '개'. 불일치는 같은 줄 끝에 덧붙여 묻히지 않게 한다. */
    function CNT_FOOT(){
        if (!ctx || ctx.cell === null || ctx.cell === undefined || !cols.length) return cols;
        let cntNm = ctx.basis || "명세 건수";
        let cntUn = /건수$/.test(cntNm) ? "건" : "개";
        let cntNg = (ctx.sum === ctx.cell) ? "" : " (명세 " + fnComma(ctx.sum) + " · 불일치)";
        cols[0].footers = [
            { text: cntNm + " = " + fnComma(ctx.cell) + " " + cntUn + cntNg, styleName: "right-column" }
        ];
        ctx.footSpanField = cols[0].fieldName;
        ctx.footSpanCount = cols.length;   // 값 컬럼이 없으므로 전체 폭 병합
        return cols;
    }

    let basis = (r.labels && r.labels[4]) || "금액";   // 취득원가 / 장부가액 …
    let unit  = r.cnt ? "건/개" : fnUnitNm();

    if (kind === "verify") {
        C("TRD_CD",  90,  "거래코드");
        C("TRD_NM",  160, "거래명");
        C("BLNC_CD", 100, "잔액증감");
        C("PRPL_CD", 100, "원금증감");
        C("TRD_DT",  100, "거래일자");
        cols[0].footers = [{ text: "차이 합계", styleName: "right-column" }];
        if (ctx) { ctx.footSpanField = cols[0].fieldName; ctx.footSpanCount = cols.length; }
        cols.push({ fieldName: "AMT", width: "110", header: { text: "금액(" + fnUnitNm() + ")" },
                    editable: false, dataType: "number", numberFormat: "#,##0", styleName: "right-column",
                    footers: [{ "expression": "sum", numberFormat: "#,##0", styleName: "right-column" }] });
        return cols;
    }
    if (kind === "cntsum") {
        C("PART_CD", 52,  "코드");
        C("PART_NM", 122, "구성 항목");
        N("AMT",     98,  (COL_NM[colCd] || colCd) + "(" + unit + ")");
        return cols;
    }
    if (kind === "sum") {          // 구성 항목 2열이 앞에 붙고, 뒤는 amt 기본 명세와 동일
        C("PART_NM", 122, "구성 항목");
        C("PART_CD", 52,  "코드");
    }
    if (kind === "entcnt") {       // 투자업체수 / 업무집행조합수 — 금액 컬럼 없음
        fundCols();
        C("TRGT_NM", 113, "투자기업명");
        C("BIZ_NO",  92,  "사업자번호");
        if (fnIsEtcBlk(r)) C("NTB_YN", 82, "신기술사업자");
        return CNT_FOOT();
    }
    if (kind === "concnt") {       // 투자건수 / 대출건수 — 금액 컬럼 없음
        fundCols();
        C("TRGT_NM", 113, "투자기업명");
        C("GDS_NM",  113, "투자상품");
        C("INV_DT",  82,  "투자일자");
        C("CNTR_NO", 82,  "계약번호");
        return CNT_FOOT();
    }
    if (kind === "yakjeong") {     // 조합출자 — 조합수 / 약정액
        C("FUND_NM", 118, "조합명");
        C("FUND_TP", 82,  "조합유형");
        if (fnIsEtcBlk(r) || (r.labels && r.labels[1]) === "기타조합") C("BASIS", 48, "근거");
        C("POS",     98,  "당사 참여지위");
        C("GP_NM",   132, "운용사명(업무집행조합원)");
        C("FORM_DT", 82,  "결성일");
        if (!r.cnt) N("AMT", 98, "약정액(" + fnUnitNm() + ")");
        return r.cnt ? CNT_FOOT() : cols;
    }
    if (kind === "chulja") {       // 조합출자 — 출자액 (B=출자 / C=분배 / F=양수도)
        let isTr = (colCd === "F");
        C("FUND_NM", 118, "조합명");
        C("FUND_TP", 82,  "조합유형");
        C("DIV",     60,  "구분");
        if (isTr) {
            C("FROM_NM", 108, "양도인 (출자자)");
            C("TO_NM",   108, "양수인 (출자자)");
        }
        C("INV_DT",  82,  (colCd === "C") ? "분배일자" : "출자일자");
        if (!isTr) C("SEQ", 50, "회차");
        N("AMT",     98,  "금액(" + fnUnitNm() + ")");
        return cols;
    }
    // amt · sum 공통 : 원천 금액 명세
    fundCols();
    C("TRGT_NM", 113, ((r.labels && r.labels[0]) === "조합출자") ? "조합명" : "투자기업명");
    C("CNTR_NO", 82,  "계약번호");
    C("GDS_NM",  113, "투자상품");
    C("INV_DT",  82,  "투자일자");
    N("AMT",     98,  basis + "(" + unit + ")");
    return cols;
}

/* 코드값 -> 배지 HTML. 배지 마크업은 반드시 화면이 만든다.
   서버가 HTML 문자열을 내려주는 설계는 이스케이프 우회이므로 금지 (reference.md Part 8.9).
   fnShowDetailModal 호출 직전에 매핑한다:
     list.forEach(function(x){ x.BLNC_CD = fnBadge(x.BLNC_CD); x.DIV = fnBadge(x.DIV); }); */
/* 코드 -> { 배지 클래스, 표시 문구 }. 표시 문구를 코드와 분리해야 '잔액증감' 컬럼에
   맨 P/M 만 뜨는 것을 막을 수 있다(레퍼런스 표기는 "BLNC P" / "BLNC M"). */
const BADGE_MAP = {
      'P'     : { cls:'badge-info',    txt:'BLNC P' }
    , 'M'     : { cls:'badge-danger',  txt:'BLNC M' }
    , '출자'   : { cls:'badge-info',    txt:'출자'   }
    , '분배'   : { cls:'badge-warning', txt:'분배'   }
    , '양수도' : { cls:'badge-success', txt:'양수도' }
};
function fnBadge(code){
    // 화이트리스트에 없는 값은 배지로 만들지 않는다 — 임의 문자열을 innerHTML 에 싣지 않기 위함
    let b = BADGE_MAP[code];
    if (!b) return '';
    return '<span class="badge ' + b.cls + '">' + b.txt + '</span>';
}

/* 명세 합계 : 금액 명세는 AMT 합, 건수 명세는 행 수가 곧 건수다. */
function fnSumOf(list, kind){
    if (!list || !list.length) return 0;
    if (kind === "entcnt" || kind === "concnt") return list.length;
    if (typeof list[0].AMT !== "number") return list.length;
    let t = 0;
    for (let i=0; i<list.length; i++) t += (Number(list[i].AMT) || 0);
    return t;
}
```

### 14.6 명세 종류 판정 (`fnDetailKind` / `KIND_NM`)

`fnOpenDetail`(14.4) 이 첫 줄에서 부르는 함수입니다. **이것이 없으면 셀 클릭 즉시 `fnDetailKind is not defined` 로 드릴다운이 통째로 죽습니다.**

⚠️ 이 두 심볼과 `fnDetailCols` 는 **운영 경로가 쓰는 코드**입니다. `USE_SAMPLE` 샘플 블록 **안에 두지 마십시오** — 블록을 통삭제하는 순간 드릴다운이 깨집니다 (reference.md Part 9.5.1.1).

```js
function fnDetailKind(r, colCd) {
    // 검증 열은 "차이를 만든 거래"만 보여주므로 전용 컬럼셋을 쓴다.
    if (colCd === "V") return "verify";
    let g0 = (r.labels && r.labels[0]) || "";
    if (g0 === "조합출자") {
        return ((r.labels && r.labels[4]) === "출자액") ? "chulja" : "yakjeong";
    }
    if (r.kind !== "data") return r.cnt ? "cntsum" : "sum";   // 소계/합계 행
    let l1 = (r.labels && r.labels[1]) || "";
    if (l1 === "투자업체수" || l1 === "업무집행조합수") return "entcnt";
    if (l1 === "투자건수") return "concnt";
    if (r.cnt) return "concnt";                               // 대출건수 등
    return "amt";
}

// 8종. fnDetailCols 의 분기와 1:1 로 맞춘다.
const KIND_NM = {
      amt      : "개별 명세"
    , sum      : "구성 내역"
    , cntsum   : "구성 내역"
    , entcnt   : "개별 명세"
    , concnt   : "개별 명세"
    , yakjeong : "개별 명세"
    , chulja   : "개별 명세"
    , verify   : "대사 차이 내역"
};
```

> Part 12.1 의 최소 `G_ROWS` 는 `amt`(A111 등) · `subtotal`→`sum`(A113/A1) · `total`→`sum`(A) · `entcnt`(AAA, 라벨 `투자업체수`) · `verify`(검증 셀 클릭) 5종을 발생시킵니다.
> `chulja` · `yakjeong` · `cntsum` · `concnt` 를 쓰려면 `G_ROWS` 에 조합출자 블록과 건수 소계 행을 먼저 추가해야 합니다(reference.md Part 5.2 팩토리).

---

## Part 15: 샘플 데이터 최소 세트

백엔드 연동 전 화면 확인용입니다. **주입 지점은 2곳을 넘기지 말고, 블록은 통째 삭제 가능해야 합니다.**

> 아래는 **최소 골격**입니다. 레퍼런스의 전체 생성기를 그대로 옮기지 마십시오 — 무효화된 불일치 주입 버그까지 복제됩니다 (reference.md Part 9.1.1).
>
> 코드 세트는 **Part 12.1 의 `G_ROWS` 와 정확히 일치**합니다(`AAA` · `A111` · `A1111` · `A113` · `A12` · `A13` · `A1` · `A2` · `A`).
> 행을 추가할 때는 `G_ROWS` 와 `fnSmpVals` · `SMP_PARTS` 를 **함께** 늘리십시오.

```js
//====================[샘플 데이터] 백엔드 연동 전 화면 확인용========================
/* =====================================================================
   USE_SAMPLE = false 로 내리면 아래 코드는 한 줄도 실행되지 않고
   실제 API(/SYAPI/MI10xx/LIST · DETAIL) 경로만 동작한다.
   백엔드가 붙으면 플래그를 내리고 이 블록을 통째로 삭제한다.
   주입 지점은 단 두 곳(getData · fnOpenDetail)뿐이다.

   ⚠️ 이 경계 안에는 샘플 전용 코드만 둔다. fnDetailKind / KIND_NM / fnDetailCols /
      fnBadge 는 운영 경로가 쓰므로 반드시 이 선 '위'에 둘 것 (reference.md 9.5.1.1).
   ===================================================================== */
const USE_SAMPLE = true;

// 명세 생성이 참조하는 기준년월. 선언은 여기지만 대입은 운영 코드(getData)가 한다.
// 샘플 블록을 삭제할 때는 이 선언을 운영 영역으로 옮길 것.
let G_STD_YM = "";

// 코드 문자열 -> 고정 시드. Math.random 을 쓰면 조회할 때마다 값이 바뀌어
// 회귀(버그)와 잡음을 구분할 수 없으므로 코드에서 결정적으로 만든다.
function fnSeed(s) {                                   // FNV-1a
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}
function fnRnd(seed) {                                 // LCG
    let x = seed >>> 0 || 1;
    return function () { x = (Math.imul(x, 1103515245) + 12345) >>> 0; return x / 4294967296; };
}

/* 원천(리프) 행 1건. A/B/C/F 를 만들고 E = A+B-C+F 로 닫는다.
   - 값은 반드시 백만원 정수배. 화면이 Math.round(n/1,000,000) 으로 환산하므로
     배수가 아니면 반올림 오차 때문에 소계와 구성행의 합이 어긋나 보인다.
   - 단위는 '원'. 서버가 원 단위 정수로 내려주는 계약과 동일하게 맞춘다. */
function fnSmpLeaf(code, scaleMil) {
    let r = fnRnd(fnSeed(code));
    let a = Math.max(1, Math.round(scaleMil * (0.4 + r() * 1.2)));
    let b = Math.round(a * (0.04 + r() * 0.16));
    let c = Math.round(a * (0.02 + r() * 0.12));
    let f = Math.round(a * (r() * 0.05 - 0.02));
    let A = a * G_WON, B = b * G_WON, C = c * G_WON, F = f * G_WON;
    return { A:A, B:B, C:C, F:F, E: A + B - C + F };
}
// 건수/개수 행은 환산 대상이 아니므로 작은 정수로 만든다.
function fnSmpCnt(code, base) {
    let r = fnRnd(fnSeed(code));
    let A = Math.max(1, Math.round(base * (0.5 + r())));
    let B = Math.round(A * (0.05 + r() * 0.15));
    let C = Math.round(A * (0.02 + r() * 0.10));
    return { A:A, B:B, C:C, F:0, E: A + B - C };
}
function fnSmpSum(V, codes) {
    let o = { A:0, B:0, C:0, F:0, E:0 };
    for (let i = 0; i < codes.length; i++) {
        let v = V[codes[i]];
        if (!v) continue;
        o.A += v.A; o.B += v.B; o.C += v.C; o.F += v.F; o.E += v.E;
    }
    return o;
}

/* 소계/합계가 어떤 행들의 합인지 — 단일 진실원.
   값 생성(롤업)과 드릴다운 '구성 내역'이 같은 정의를 공유하므로
   화면 숫자와 모달 내역이 어긋날 수 없다. */
let SMP_PARTS = {
      "A113" : ["A111", "A1111"]        // 투자주식 합계(취득원가)
    , "A1"   : ["A113", "A12", "A13"]   // 투자 소계(취득원가)
    , "A"    : ["A1", "A2"]             // 블록 합계
};

/* 검증열(E' vs E) 동작 확인용 불일치 주입 : ROW_CD -> delta
   - delta 는 원장 집계(E)에만 더한다. A/B/C/F 는 손대지 않으므로
     화면의 E'(= A+B-C+F) 와 원장 E 가 정확히 delta 만큼 벌어진다.
   - 금액 행은 반드시 G_WON 정수배 (50만원 미만 델타는 환산 후 같은 숫자로 찍혀 버그처럼 보인다).
   - 건수 행(cnt:true)은 작은 정수. */
let SMP_DIFF = { "A111": -12 * G_WON, "A1": 8 * G_WON };

function fnSmpVals() {
    let V = {};

    // 1) 리프 생성
    V["A111"]  = fnSmpLeaf("A111",  4200);
    V["A1111"] = fnSmpLeaf("A1111", 1800);
    V["A12"]   = fnSmpLeaf("A12",   2600);
    V["A13"]   = fnSmpLeaf("A13",    900);
    V["A2"]    = fnSmpLeaf("A2",    3100);
    V["AAA"]   = fnSmpCnt("AAA", 27);

    // 2) 롤업 (SMP_PARTS 정의를 그대로 따른다)
    ["A113", "A1", "A"].forEach(function(cd){ V[cd] = fnSmpSum(V, SMP_PARTS[cd]); });

    // 3) E 정의 강제. 리프·롤업 어느 경로로 만들어졌든 A+B-C+F 로 닫아
    //    검증열 정합과 부모/자식 E 합 정합을 동시에 보장한다.
    for (let k in V) { let x = V[k]; x.E = x.A + x.B - x.C + x.F; }

    // 4) ★ 불일치 주입은 반드시 (3) 뒤에. (3) 앞에 넣으면 전역 재계산에 통째로 지워진다.
    Object.keys(SMP_DIFF).forEach(function (cd) {
        if (V[cd]) V[cd].E += SMP_DIFF[cd];
    });

    return V;
}

// 실제 LIST 응답과 동일한 형태로 만들어 fnBindData 를 그대로 태운다
// → 샘플 경로와 실경로가 같은 바인딩 코드를 지난다.
function fnSampleList() {
    let V = fnSmpVals();
    let out = [];
    for (let i = 0; i < G_ROWS.length; i++) {
        let cd = G_ROWS[i].code, v = V[cd];
        if (!v) continue;
        out.push({ ROW_CD            : cd
                 , BEF_QTR_BLNC_AMT  : v.A
                 , NOW_QTR_EXEC_AMT  : v.B
                 , NOW_QTR_RCVR_AMT  : v.C
                 , NOW_QTR_ETC_AMT   : v.F
                 , NOW_QTR_BLNC_AMT  : v.E });
    }
    return out;
}
```

### 15.1 주입 지점 (2곳만)

```js
// 지점 1 — getData 첫 줄
function getData(searchCond){
    if (USE_SAMPLE) { fnBindData(fnSampleList()); return; }
    logosAjax.requestToken(gToken, "${KiiPS_SY}/SYAPI/MI10xx/LIST", "POST", searchCond, function(data){ /* ... */ });
}

// 지점 2 — fnOpenDetail 의 ajax 호출 직전
if (USE_SAMPLE) {
    let smp = fnSampleDetail(rowCd, colCd);
    mctx.sum = fnSumOf(smp, mk);
    fnShowDetailModal(smp, mkind, fnDetailCols(mk, r, colCd, mctx), mctx);
    return;
}
```

### 15.2 명세 분할 (잔차 흡수)

각 건의 **화면 표시값 합이 셀 표시값과 정확히 일치**하도록 마지막 건이 잔차를 흡수합니다.

```js
/* total 을 n 건으로 쪼갠다.
   - step 배수(금액=G_WON, 건수=1)로만 쪼개고 마지막 건이 잔차를 흡수한다.
   - 음수(기타 F열의 평가손실 등)도 부호를 유지한 채 분할한다. */
function fnSmpSplit(total, n, seed, step) {
    let u = Math.round(total / step);
    if (u === 0) return [total];
    let neg = u < 0;
    if (neg) u = -u;
    if (n > u) n = u;
    if (n < 1) n = 1;
    let r = fnRnd(seed), w = [], sw = 0;
    for (let i = 0; i < n; i++) { let x = 0.5 + r(); w.push(x); sw += x; }
    let out = [], acc = 0;
    for (let i = 0; i < n - 1; i++) {
        let part = Math.max(1, Math.round((u * w[i]) / sw));
        out.push(part); acc += part;
    }
    out.push(u - acc);                                   // 잔차 흡수
    return out.map(function (part) { return (neg ? -part : part) * step; });
}
```

### 15.3 `fnSampleDetail` — 주입 지점 2가 부르는 함수

`fnDetailKind` 와 **같은 kind 로 분기**해 명세 행을 만듭니다. 생성 행의 필드명은 `fnDetailCols` 의 `fieldName` 과 **1:1**(reference.md Part 8.3 표)이어야 하고, `AMT` 는 이미 `fnDisp` 로 **표시 단위 환산해서** 넣습니다(reference.md Part 6.1.1).

> ⚠️ 아래는 `verify` · `cntsum` · `sum` · `entcnt` · `concnt` · `amt` **6종만** 다루는 축약본입니다.
> `yakjeong` · `chulja`(조합출자 블록)를 쓰는 서식이라면 `MI1010.jsp` 의 `fnSampleDetail` 해당 분기를 참조해 직접 작성하십시오 — 그 두 종류는 조합 마스터(`SMP_FUND`/`SMP_GP`)가 추가로 필요합니다.

```js
// 명세 행에 쓰는 최소 마스터. 레퍼런스는 SMP_CO / SMP_FUND / SMP_GP / SMP_GDS 4종을 쓴다.
const SMP_CO  = [["가온바이오","124-81-00001"], ["넥스트소재","106-86-00002"]
                ,["다온로보틱스","220-88-00003"], ["라이트에너지","314-81-00004"]];
const SMP_GDS = ["보통주", "우선주", "전환사채", "조건부융자"];

function fnPick(arr, seed, i){ return arr[fnSeed(seed + "#" + i) % arr.length]; }
function fnSmpDt(seed, i){
    let ym = G_STD_YM || "202506";
    return ym.substring(0,4) + "-" + ym.substring(4,6) + "-"
         + ("0" + (1 + (fnSeed(seed + "d" + i) % 28))).slice(-2);
}
// KiiPS 계약번호 : I=투자 / L=대출 + 년도4 + 일련4
function fnCntrNo(seed, i){
    return "I" + (G_STD_YM || "202506").substring(0,4)
         + ("0000" + (fnSeed(seed + "c" + i) % 10000)).slice(-4);
}

/* 금액 total 을 개별 명세 N건으로 쪼갠다. AMT 는 표시단위로 넣는다. */
function fnSmpLines(r, colCd, total, seed, partNm, partCd){
    let isCnt = !!r.cnt;
    let parts = fnSmpSplit(total, 3 + (fnSeed(seed) % 5), fnSeed(seed), isCnt ? 1 : G_WON);
    let out = [];
    for (let i=0; i<parts.length; i++) {
        let co = fnPick(SMP_CO, seed, i);
        out.push({ PART_NM : partNm || ""
                 , PART_CD : partCd || ""
                 , TRGT_NM : co[0]
                 , BIZ_NO  : co[1]
                 , CNTR_NO : fnCntrNo(seed, i)
                 , GDS_NM  : fnPick(SMP_GDS, seed, i)
                 , INV_DT  : fnSmpDt(seed, i)
                 , AMT     : fnDisp(parts[i], isCnt) });   // ★ 표시단위
    }
    return out;
}

function fnSampleDetail(rowCd, colCd){
    let r = G_RMAP[rowCd], v = G_VALS[rowCd];
    if (!r || !v) return [];
    let total = fnColVal(v, colCd);
    if (total === null) return [];
    let kind = fnDetailKind(r, colCd);
    let seed = rowCd + colCd;

    // 검증(V) : 차이 E-(A+B-C+F) 를 만든 거래
    if (kind === "verify") {
        let fx = (v.A||0) + (v.B||0) - (v.C||0) + (v.F||0);
        let df = (v.E||0) - fx;
        if (Math.abs(df) < 0.5) return [];
        let parts = fnSmpSplit(df, 1 + (fnSeed(seed) % 2), fnSeed(seed), G_WON);
        let NMS = ["외화환산손익", "평가손익 반영", "대손충당금 설정", "지분법 손익"];
        let out = [];
        for (let i=0; i<parts.length; i++) {
            out.push({ TRD_CD  : String(300 + (fnSeed(seed + "t" + i) % 90))
                     , TRD_NM  : fnPick(NMS, seed, i)
                     , BLNC_CD : fnBadge(parts[i] >= 0 ? "P" : "M")   // 코드→배지는 화면이 조립
                     // 검증 명세는 '원금증감이 P/M 어디에도 없어 실행·회수로 안 잡힌 거래' 라
                     // 원금증감은 값이 없는 것이 정상이다 — 공란 대신 표식을 둔다.
                     , PRPL_CD : "PRPL —"
                     , TRD_DT  : fnSmpDt(seed, i)
                     , AMT     : fnDisp(parts[i], false) });
        }
        return out;
    }
    // 건수 소계/합계 : 구성 항목만
    if (kind === "cntsum") {
        let out = [];
        (SMP_PARTS[rowCd] || []).forEach(function(cd){
            let cv = G_VALS[cd], kr = G_RMAP[cd];
            if (!cv) return;
            out.push({ PART_CD : cd
                     , PART_NM : kr ? fnLabelPath(kr) : cd
                     , AMT     : fnDisp(fnColVal(cv, colCd), !!r.cnt) });
        });
        return out;
    }
    // 금액 소계/합계 : 말단 행까지 내려가 개별 명세를 이어붙인다
    if (kind === "sum") {
        let out = [], stack = (SMP_PARTS[rowCd] || []).slice(), guard = 0;
        while (stack.length && guard++ < 400) {
            let cd = stack.shift();
            if (SMP_PARTS[cd]) { stack = SMP_PARTS[cd].concat(stack); continue; }   // 하위 소계는 더 내려간다
            let cv = G_VALS[cd], kr = G_RMAP[cd];
            if (!cv || !kr) continue;
            let cval = fnColVal(cv, colCd);
            if (cval === null || cval === 0) continue;
            out = out.concat(fnSmpLines(kr, colCd, cval, cd + colCd, fnLabelPath(kr), cd));
        }
        return out;
    }
    // 업체수 / 건수 : 금액 컬럼이 없고 행 수가 곧 건수다
    if (kind === "entcnt" || kind === "concnt") {
        let n = Math.max(1, Math.round(fnDisp(total, true)));
        if (n > 300) n = 300;
        let out = [];
        for (let i=0; i<n; i++) {
            let co = fnPick(SMP_CO, seed, i);
            out.push({ TRGT_NM : co[0]
                     , BIZ_NO  : co[1]
                     , GDS_NM  : fnPick(SMP_GDS, seed, i)
                     , INV_DT  : fnSmpDt(seed, i)
                     , CNTR_NO : fnCntrNo(seed, i) });
        }
        return out;
    }
    // 원천 금액 명세
    return fnSmpLines(r, colCd, total, seed, "", "");
}
```

---

## Part 16: 페이지 전용 `<style>` 블록

**표시/숨김·폭은 자유롭게, 색은 반드시 라이트/다크 쌍으로.** 공통 SCSS 를 고치지 말고 `#화면ID` 셀렉터 특이도로 이겨 파급을 0으로 만듭니다.

```html
<style>
    /* 표시/숨김 전용 (색상은 셀 hover 만, 반드시 라이트/다크 쌍으로 선언) */
    #rep .vcol { display: none; }
    #rep.von .vcol { display: table-cell; }

    /* 검증(V) 열 폭. table-layout:auto 라 width 만으로는 내용에 밀리므로 min-width 병기. */
    #rep.von th.vcol:last-child, #rep.von td.vcol:last-child { width: 80px; min-width: 80px; }
    /* E'(수식) 열 : 폭이 좁으면 헤더가 여러 줄로 깨져 헤더 높이가 통째로 늘어난다. */
    #rep.von th.vcol:nth-last-child(2), #rep.von td.vcol:nth-last-child(2) { width: 120px; min-width: 120px; }

    #rep .code-c { font-size: 11px; white-space: nowrap; }
    #rep .spanlbl { text-align: center; }
    #rep td.clickable { cursor: pointer; }

    /* 링크 셀은 밑줄 대신 공통 primary 색(--primary 는 라이트/다크 각각 정의된 테마 토큰).
       단 검증열의 불일치(text-danger)·OK(text-success) 색은 덮지 않는다. */
    #rep td.clickable:not(.text-danger):not(.text-success) { color: var(--primary); }

    #rep td.col-net { font-style: italic; }   /* D 파생열 표시 */

    /* 셀 hover 강조. 소계/합계 음영(.bg_subsum)보다 명시도가 높아 !important 없이 덮는다. */
    #rep tbody td:hover { background-color: #f4f4f4; }
    [data-theme=dark] #rep tbody td:hover { background-color: var(--rgTable-hover-background); }

    /* 모달 제목의 소제목 — 테마의 `small` 규칙이 CSS 변수(--font-size)만 정의하고
       실제 font-size 를 선언하지 않아 <small> 태그만으로는 크기가 줄지 않는다. */
    #MI10xx_MD_TITLE_SUB { font-size: 0.7em; font-weight: 400; }

    /* 명세 배지 : 테마 기본 배경이 진해 어두운 글자가 묻힌다.
       배경은 그대로 두고 글자만 흰색으로 올려 대비를 확보한다. */
    #TB_MI10xx_MD .badge { color: #fff; font-weight: 600; }
</style>
```

### 16.1 가이드 서랍 목록 마커 복원 (서랍을 쓸 때만)

```html
<style>
    /* 테마 리셋(css/sass/themes/default/_styles.scss 의 bare `ol, ul { list-style: none }`
       → 산출물 css/sass/theme.css, header.jsp 가 링크)이 서랍 안 목록의 마커까지 지운다.
       공통 SCSS 는 건드리지 않고(전 화면 파급)
       이 화면 서랍 안에서만 되살린다. id 셀렉터라 전역 규칙을 특이도로 이긴다.
       색은 지정하지 않는다 — 마커는 글자색을 따라가므로 다크테마가 자동 대응된다. */
    #MI10xx_GUIDE ol { list-style: decimal outside; padding-left: 1.5rem; }
    #MI10xx_GUIDE ul { list-style: disc outside;    padding-left: 1.1rem; }
    /* 배지를 얹은 바깥 목록은 마커 없이 그대로 둔다. */
    #MI10xx_GUIDE ul.list-unstyled { list-style: none; padding-left: 0; }
</style>
```
