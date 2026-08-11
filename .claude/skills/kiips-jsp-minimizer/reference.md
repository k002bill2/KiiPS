# JSP Minimizer — 상세 레퍼런스

> [SKILL.md](SKILL.md)의 판정 근거. 모든 항목은 grep/read 실측(L1)이며 파일:줄을 붙였다.
> 검증 시점 기준 해시: `PG0445.jsp` = `f26133b0ea5e0ed61d3196818b0816cad1ce0c7c`

⚠️ 이 문서의 명령을 재현할 때 `grep -r`로 `static/js`를 검색하지 말 것. 저장소 `.gitignore:29`가 `static/js/*.js`를 제외시켜 공통 JS가 **통째로 누락**된다. `find … -print0 | xargs -0 grep -n`을 쓴다.

---

## 1. 공통 함수별 속성 의존성

`gatherComponent`(저장) / `mapPage`(조회) / `initComponent`(초기화)가 어떤 속성을 어떤 **축**으로 쓰는지가 등급 판정의 전부다.

| 속성 | 사용 함수 | 역할 | 제거 시 | 등급 |
|---|---|---|---|---|
| `data-gbn` | gather `common.js:726` / init `:669` / map `:574` | **순회 선택 축** | 요소가 순회에서 탈락 → payload에 키 자체가 없음 | silent-loss |
| `data-id` | gather `:729,858` / map `:569-573` | **payload 키** | 모든 필드가 `objects["undefined"]` 한 칸으로 붕괴 | silent-loss |
| `data-pass` | gather `:730,733-735` | 수집 **제외** 스위치 | 필드가 payload에 **추가**됨 (역방향) | silent-loss |
| `data-desc` | gather `:738,859-861` | 필터 칩 표시 | 조건은 걸리는데 화면에 안 보임 | silent-loss |
| `data-max-options` | gather `:760-763` | 반환 **shape** 결정 | 스칼라 → 배열, 서버 파싱만 깨짐 | silent-loss |
| `data-provider-id` | gather `:775-776` / map `:600-602` / init `:687-689` | `eval()` 대상 | `eval(undefined)` 후 멤버 접근 → TypeError | **hard-break** |
| `name` (select) | init `:707` | 초기화 셀렉터 | 모달 재오픈에 이전 값 잔존 | silent-loss |
| `name` (radio) | gather `:772` / init `:683` / map `:590` | **값 읽기 축** | gather 결과 undefined | silent-loss |
| 컨테이너 `id` (file) | `inc_files.jsp:154-155`, gather `:803-811` | Dropzone 키 | 0매칭 → Dropzone throw (`.then` 안이라 콘솔만) | silent-loss |
| 컨테이너 `id` (grid) | `new RealGrid.GridView(t)` | 생성자 인자 | `Invalid grid container element` throw | **hard-break** |

### 1.1 왜 `data-id` 제거가 최악인가

```js
// common.js:726  — 순회 축은 data-gbn
$(parentId + " [data-gbn]").each(function (index, item) {
// common.js:729
  let dataId = $(item).attr("data-id");
// common.js:858 — undefined + "" === "undefined"
      objects[dataId + ""] = result;
```

`data-id`만 지우면 **에러가 하나도 안 난다.** 모든 필드가 문자열 키 `"undefined"` 한 칸에 덮어써져 마지막 값만 남고, 저장 요청은 200 OK로 돌아온다. 611줄 `verified-backup`이 정확히 이 상태였다(모달 17건 소실 — 게이트 #4가 `17 / 0`으로 검출).

조회 쪽도 조용하다.

```js
// common.js:569-573
let inComp = document.querySelector(parentId + ' [data-id="' + dataId + '"]');
...
if (inComp == null) return;     // ← 조용히 return
```

그래서 판정은 **개수 일치가 아니라 요소 단위 쌍 검사 + 값 집합 diff**여야 한다(게이트 #4, #5). 개수만 세면 rename이 카운트를 유지한 채 필드를 소실시킨다.

### 1.2 `data-pass`의 방향 역전

```js
// common.js:733-735
if (dataPass) {
  return true; // continue → gather에서 제외
}
```

`mapPage`는 `data-pass`를 **검사하지 않는다**(`common.js:564-573`). 즉 `data-pass="true"` 필드는 "표시 전용"이고, 그 코드값은 오직 hidden에만 실린다. PG0445의 `TGT_EMP_CUST_NM`/`DEPT_NM`/`PSTN_TPNM`(`:76,82,86`)이 여기 해당한다.

따라서 **"저장 경로 영향 없음 = safe"로 단정하면 틀린다.** `data-pass` 필드의 `data-id` 제거는 저장에는 무영향, 상세보기에는 값 공백이다.

### 1.3 hidden은 장식이 아니다

PG0445 실측 6건: `OUT_ACT_REQ_UUID`, `MAK_EMP_CUST_NO`, `TGT_EMP_CUST_NO`, `TGT_DEPT_CD`, `PSTN_TPCD`(`:65-69`), `FILE_NO_UQE`(`:126`). 전부 `type="hidden"` + `data-id` + `data-gbn="text"`다.

`OUT_ACT_REQ_UUID`(PK) 유실은 **모든 수정이 신규 INSERT로 바뀌는 무증상 데이터 오염**이다. "화면에 안 보이니 삭제 가능"은 이 축에서 가장 위험한 휴리스틱이다.

### 1.4 방어 코드가 결함을 은폐한다

```js
obj.FILE_LIST = temp.FILE_LIST || [];   // 첨부가 사라져도 빈 배열로 정상 진행
```

`|| []` 같은 코드가 첨부 소실을 완전히 감춘다. 파일 영역의 `data-id`(`data-gbn="file"`)를 별도 필수 체크 항목으로 둔다.

---

## 2. 파손 사례 — PG0445 실측

### 2.1 hard-break 6건 (끊긴 참조)

축소본 326줄에 정의된 함수는 6개뿐이다: `adminAlrm`, `callRGST_POP`, `getAttFiles`, `getData`, `getDetailData`, `MAIN_SEARCH_FILTER`.

| # | 함수 | 호출부 | 렌더 조건 |
|---|---|---|---|
| 1 | `fn_confirm` | `inc_pg_button.jsp:2143` | `AUTH == "A"` |
| 2 | `apprv` | `inc_pg_button.jsp:2150` | `AUTH == "A" \|\| "C"` |
| 3 | `fn_delete` | `inc_pg_button.jsp:2151` | `AUTH == "A" \|\| "C"` |
| 4 | `SAVE_RGST` | `PG0445.jsp:129` | 항상 |
| 5 | `RESET_ARLM` | `PG0445.jsp:155` | 항상 |
| 6 | `SAVE_ARLM` | `PG0445.jsp:156` | 항상 |

**#2 `apprv`가 이 스킬의 존재 이유다.** 초기 인수인계 목록은 5건(#1,#3,#4,#5,#6)이었고 `apprv`가 빠져 있었다. 3개 축의 독립 분석이 모두 `inc_pg_button.jsp:2150`의 `onClick="apprv()"`를 찾아냈다. **사람이 손으로 뽑은 목록은 항상 1건씩 빠진다** — 그래서 게이트 #2가 자동·전수여야 한다.

**#1~#3은 조건부 렌더 블록 안에 있다**(`inc_pg_button.jsp:2138`이 `if("A".equals(AUTH))`, `:2148`이 `if("A".equals(AUTH) || "C".equals(AUTH))`). 저권한 계정으로 화면을 열어 클릭해보는 실측 검증은 이 3건을 **전부 통과시킨다**. "클릭해보니 정상"은 증거가 아니다.

**#4~#6은 같은 파일 안의 onclick이다.** 모달 HTML은 남기고 `<script>`만 지운 결과 — 그래서 "HTML 마크업은 남기고 JS만 삭제"는 항상 끊긴 참조를 만든다.

`apprv`/`fn_delete`가 전역이 아니라는 것도 중요하다.
```
find KiiPS-UI/src -name '*.js' -o -name '*.jsp' | xargs grep -ln 'function apprv *('
  → AC2020.jsp, AC1012.jsp, AC0522.jsp …  (페이지 파일만)
```
`common.js`/`common_grid.js`/`header.jsp`에 정의가 없다 = **복구할 전역 fallback이 없다.** "공통 함수처럼 생긴 이름"을 전역으로 가정하면 안 된다.

### 2.2 silent-loss — 정의는 살고 진입점이 죽음

축소본은 `gridView.onCellDblClicked` 핸들러를 통째로 잃었다(백업 `:276-299`). 그 결과:

- `getDetailData`(`PG0445.jsp:244`)는 정의가 남아 있으나 **호출부 0건** → 조회·수정 진입로 완전 소실
- 결재이력 분기 `POP_APPRV(apprdata)`도 함께 소실
- **거짓 어포던스가 남는다**: 결재상태 컬럼 `styleCallback`(`:194-209`)이 여전히 `ret.styleName = "blue-column cursor"`를 칠해 클릭 가능해 보인다

"함수 정의 개수 14→6" 같은 정의 기준 체크로는 이 유형을 못 잡는다. **정의-호출 양방향 콜그래프**(게이트 #2 + #3)를 둘 다 돌려야 한다. 그리고 게이트 #3이 `getDetailData`를 단독 검출했을 때, 정답은 함수 제거가 아니라 **핸들러 복원**이다.

추가로: `styleName`에 `cursor`가 있는 컬럼은 대응 핸들러 존재를 함께 확인한다. 렌더 스크린샷 검증으로는 절대 안 잡힌다.

### 2.3 silent-loss — 함수는 있으나 본문이 스텁

`adminAlrm()`이 3줄(`PG0445.jsp:305-307`)로 축소되어 `modal('show')`만 남았다. 백업(`:403-426`)에는 `fnCustListWithRTIR().then(...)` + `PGAPI/PG0445/ALRM_LIST` 조회 + `selectpicker('val', str)`가 있었다. **모달은 열리지만 항상 빈 셀렉트다.**

"함수가 존재한다"는 hard-break만 막는다. 본문의 `logosAjax.requestToken` URL 집합을 원본과 대조해야 축소를 탐지한다.

### 2.4 백업(611줄)의 0-매칭 셀렉터 7건 — ⚠️ 이 수치는 **미검증**

v1 게이트 #6을 백업에 돌리면 `ACT_CNTS`, `ACT_END_DT`, `ACT_RSN`, `ACT_STR_DT`, `ALRM_EMP_CUST_NOL`, `APLY_DT`, `ORG_NM` 7건이 나왔다고 기록돼 있다. 대응 요소는 전부 `id=""`다(`PG0445.jsp:76,82,86,95,99,105,109,115,121,152` — 10건).

**그러나 v1 게이트 #6의 존재 확인식은 `grep -qE "id=\"$s\""` 라서 `data-id="X"` 를 부분 문자열로 매칭한다.** 해당 요소들이 `data-id` 를 달고 있었다면 같은 명령이 그때도 검출할 수 없었다는 모순이 생긴다. 그리고 셀렉터 수집식 `\$\('#…` 이 홑따옴표 전용이라 `$("#FILTER_INPUT_TAG")`(`PG0445.jsp:287`) 같은 쌍따옴표 형태는 애초에 스캔되지 않았다.

→ **이 7건 수치와 §5 실효성 표의 해당 칸은 백업 파일이 남아 있지 않아 v2 명령으로 재실증하지 못했다. "미검증"으로 표시한다.**
v2 게이트 #6은 (a) 앞자리 경계 `(^|[^-A-Za-z0-9_])id="X"` (b) 양따옴표 + `getElementById` (c) `<%-- --%>` 제거 사본 기준 (d) page-owned / include-owned / TRUE-ORPHAN 3분류 로 교체했다. v2 실측(2026-08-06): PG0445 `INCLUDE-OWNED: $('#FILTER_INPUT_TAG') <- inc_filter_main.jsp` 1건 — v1이 아예 보지 못했던 축이다.

`setEditableAndDisabled`(결재 완료건 편집 잠금)가 **원본에서부터 동작한 적이 없다**는 결론 자체는 유효하다. 이것이 "원본에 있었으니 보존"을 보존 규칙으로 쓸 수 없는 이유다.

기술적 정답은 삭제도 방치도 아닌 **스코프 셀렉터로 재작성**이다: `$('#registModal [data-id=APLY_DT]')`. 참조 화면 PG0444가 이 형태를 쓴다(`PG0444.jsp:641-646`).
**단 재작성은 축소 작업의 범위 밖이다** — SKILL.md §7 마지막 경고 참조. 보고서 4번 항목에 제안으로만 적고, 별도 승인 후 별도 작업으로 처리한다(`.claude/rules/anti-rationalization.md` "bonus fix 금지").

### 2.5 id 축 — 채워 넣지 말 것

```js
// bootstrap-select.js:904-905
var that = this,
    id = this.$element.attr('id');
// bootstrap-select.js:934-935
if (typeof id !== 'undefined') { this.$button.attr('data-id', id); }
```

bootstrap-select는 select의 **`id`**를 버튼에 `data-id`로 복사한다(select의 `data-id`가 아니다). 따라서 `id == data-id`가 되는 순간 `$('[data-id=X]')`가 select+button **2매칭**이 된다. `id=""`를 "정리 차원에서 채우는" 리팩토링이 오히려 새 버그를 만든다.

버튼에는 `.selectpicker` 클래스가 없으므로(`:1082` `options.styleBase + ' dropdown-toggle'`) `common.js:710`의 `$('.selectpicker[data-id=X]')`는 안전하다.

> 참조구현 충돌: PG0310은 `id` + `data-id` 쌍을 쓰고(`PG0310.jsp:312-313`), PG0444는 `name` + `data-id`만 쓴다(`PG0444.jsp:61-125`). 이 스킬은 더 가까운 형제 화면 PG0444 + 위 2매칭 기전을 근거로 **"id 부여 금지"** 방향을 채택했다. 사내에 PG0310을 표준으로 보는 다른 판단이 있다면 이 규칙은 재검토가 필요하다.
>
> 실제로 PG0310은 2매칭을 **의도적으로 회피**하고 있다: `id="ALRM_EMP_CUST_NOL"` 과 `data-id="ALRM_EMP_CUST_NO"` 를 **다르게** 두어(`:313`) bootstrap-select 가 버튼에 복사하는 `data-id` 가 `ALRM_EMP_CUST_NOL` 이 되게 했고, 그래서 `:637-638` 의 언스코프 `$('[data-id="ALRM_EMP_CUST_NO"]')` 가 안전하다. 이 `id` 를 지우면 `label for="ALRM_EMP_CUST_NOL"`(`:312`) 연결도 함께 끊긴다 — 그래서 게이트 #5에 `id`·`for` 축을 추가했다.

### 2.5.1 언스코프 셀렉터 = 브로드캐스트 계약 (스코프화 금지 케이스)

"셀렉터는 `$('#모달ID [data-id=X]')` 로 통일" 은 **2매칭 해소 목적에 한정된 해소책**이지 무조건 규칙이 아니다.

PG0310 실측 — 같은 `data-id` 가 **두 모달에 동시 배포**된다:

| data-id | 마크업 위치 | 채움 코드 |
|---|---|---|
| `DEPT_CD` | `:172`(POP2 부서), `:256`(POP3 청구부서) | `:614` 언스코프 1회 |
| `CMBT_CUST_NO` | `:149`(POP2), `:233`(POP3) | `:625` 언스코프 |
| `CERS_MNG_TPCD` | `:156`(POP2), `:240`(POP3) | `:631` 언스코프 |
| `APLY_EMP_CUST_NO` | `:167`(POP2), `:251`(POP3) | `:619` 언스코프 |

결정적 반증: `:632` 는 같은 `then` 블록 안에서 `$('#PG0310_POP2 [data-id=CERS_MNG_TPCD]').html(...)` 로 **일부러 POP2만** 필터링된 목록으로 덮어쓴다. 즉 **언스코프(`:631`) → 스코프(`:632`) 순서가 계약**이다. `:631` 을 스코프화하면 POP3 구분 셀렉트가 빈다.

→ 좁히기 전에 반드시 `grep -c 'data-id="X"' "$F"` 로 마크업 대상 수를 센다. **2건 이상 = 브로드캐스트 = 언스코프 유지.**

### 2.6 `//` 주석도 서버에서 평가된다

```jsp
// RT0127.jsp:1240
//fn_fileLpDown(...,<%=Constant.LP_전송구분_국민연금%>);
```

JS `//` 주석 안이어도 `<%= %>`는 JSP 엔진이 서버에서 평가한다. 없는 상수를 주석에 적으면 **컴파일 500**이다. 올바른 억제 형태는 `header.jsp:376`처럼 `<%-- --%>`이거나, boolean 가드다.

백업 `:306-318`은 이를 의식해 `DOC_ID_CONFIGURED = false` 가드 패턴을 남겼다. **"주석 처리로 비활성화"는 안전 조작이 아니다.**

⚠️ **이 기전은 줄 선두 `//` 에 국한되지 않는다.** v1 게이트 #9의 정규식 `^[[:space:]]*//.*<%=` 는 세 겹으로 좁았다:
(1) `^` 앵커 → **행 중간 후행 주석**(`fnX(); // <%=Constant.NOPE%>`)을 놓침
(2) `//` 만 → **`/* … */` 블록 주석**을 놓침
(3) `<%=` 만 → §7 safe 표가 검사하라고 지시한 **`<%@ %>` 디렉티브**를 검사하지 않음
v2는 `(//|/\*).*<%[=@]` 로 교체하고 `/*` 시작점을 별도 나열해 사람이 종료 위치까지 확인하게 한다.

또한 같은 축에 **실행 코드 줄의 `<%= %>`** 가 있다. `PG0443.jsp:652,795` 의 `'<%=Constant.결재_연계_선물신청2%>'` 는 JS 문자열 안의 스크립틀릿이라 오타·삭제 시 컴파일 500이다. 게이트 #9의 `<%= %>` **집합 diff**(편집 전후 `grep -oE '<%=[^%]*%>' | sort -u` 가 공집합 소실)가 이 축을 지킨다.

### 2.7 `\${` 는 이스케이프이지 군더더기가 아니다

`PG0443.jsp:645,773,917`:
```js
MESSAGE_HANDLE(`수령자 \${[...names].join(', ')} 님은 …`)
```
`od -c` 로 보면 `\ $ { [ . . . n a m e s ]` 다. **이 백슬래시는 JSP EL 리터럴 이스케이프**이며, "템플릿 리터럴에 불필요한 이스케이프"로 보고 지우면 JSP 엔진이 `${[...names].join(', ')}` 를 EL로 파싱 시도 → **EL 구문 오류 → 번역 단계 HTTP 500**.
게이트 #9의 `grep -coF '\${'` **비감소** 검사가 이 축이다(실측: mutC = `3→0 감소` FAIL 검출).

---

## 3. 파일별 계약 (include ↔ 페이지)

### 3.1 include → 페이지 방향 (페이지가 반드시 제공해야 할 것)

| 심볼 | 요구하는 파일:줄 | 미제공 시 |
|---|---|---|
| `MAIN_SEARCH_FILTER()` | `inc_filter_main.jsp:201`, `inc_main_button.jsp:38`, `inc_pg_button.jsp:2147` | 태그 삭제·F2·조회 버튼 전부 ReferenceError |
| 화면ID 분기 함수들 | `inc_*_button.jsp`의 해당 분기 | 버튼 클릭 ReferenceError |
| `SCREEN_DATA` 등 4개 변수 | `inc_page_header.jsp:11,21-22` · `footer_sidemenu.jsp:49,328,330,515,520,525` | JSP 컴파일 500 |
| 화면ID가 메뉴 권한 맵에 존재 | `inc_main_button.jsp:16-17` | NPE 500 |
| **`<jsp:param name="MENU_SCREEN_ID">`** | `inc_main_button.jsp:9` `convNvl(request.getParameter("MENU_SCREEN_ID"),"XX")` → `:17` `ScreenAuth.get("XX")` null → `.split()` | **NPE 500** (hard-break) |
| **`<jsp:param name="MAIN_SEARCH_CONDITION">`** | `inc_filter_main.jsp:10` `HtmlUtils.htmlUnescape(request.getParameter(...))` → `HtmlCharacterEntityDecoder` 생성자가 `original.length()` 호출(null 가드 없음, spring-web-5.3.21 바이트코드 실측) | **NPE 500** (hard-break) |
| **`<jsp:param name="MAIN_SCREEN_ID">`** | `inc_filter_main.jsp:7` → `:20` 으로 문자열 `"null"` 전파 | 필터 SEARCH_CONDITION 계약 불일치 (무증상) |

⚠️ **`<jsp:param>` 은 "상단에 같은 param 이 이미 있으니 중복" 이 아니다.** `<jsp:include>` 는 매번 독립 request dispatch 이므로 include 마다 자기 param 이 필요하다. 게이트 #7의 `<jsp:param>` 집합 diff 가 이 축을 hard-break 등급으로 지킨다.

`MAIN_SEARCH_FILTER`는 화면과 무관한 **상수급 필수 심볼**이다. 3개 include가 호출한다.

```jsp
<%-- inc_main_button.jsp:16-17 — null 체크 없음 --%>
Map<String,String>  ScreenAuth = sessionInfo.getMenuAuth();
String tempAuth = ScreenAuth.get(MENU_SCREEN_ID).split("\\|")[0];
```

> ScreenAuth NPE의 **실제 발생 여부는 메뉴 DB 등록 상태에 의존**하므로 미확인(불확실성 Medium)이다. 신규 화면은 JSP 파일만으로 동작하지 않는다 — 메뉴 DB 등록·ACUIController 매핑까지 필요하며, "JSP가 well-formed"는 화면 동작의 근거가 아니다.

### 3.2 페이지 → include 방향 (건드리지 말 것)

| 대상 | 사실 |
|---|---|
| 검색필터 DOM | `search_condition_main.jsp:607`이 `id="MAIN_SEARCH_*"`로 렌더. **`data-id` 속성 자체가 없다** |
| 필터 옵션 채우기 | `search_condition_main.jsp:652-660`이 서버에서 `fnCustListWithRTIR().then(fnInitSelectBox(...))`를 직접 출력 |
| 필터 위젯 종류 | selectpicker가 **아니라** vanillaSelectBox (`header.jsp:2333-2345`) |
| `#ADJ_GRID_COLUMN` | `inc_pg_button.jsp:2134`가 발행. `setPaging`(`common_grid.js:1813-1816`)이 읽음 |

**규칙 (2026-08-06 재정정 — 범위 한정)**: `ScriptFuncName`이 지정된 **필터 셀렉트**를 페이지에서 다시 채우는 코드는 0-매칭 데드코드일 수 있으나, **화면마다 다르므로 기억이 아니라 측정으로 판정한다.**

삭제 전 필수 2단계:
1. `grep -c 'data-id="X"' "$F"` 가 **0** 이어야 한다. 1건 이상이면 그 코드는 **페이지 자신의 마크업을 채우는 라이브 코드**다.
2. 필터 소유 여부는 `MainComponent.java:225` `getTag()` 가 `return "MAIN_SEARCH_"+id.toUpperCase()+…` 로 접두어를 강제하므로 **`data-id="MAIN_SEARCH_<대문자ID>"` 형태로만 성립**한다. 접두어 없는 `data-id` 는 **절대 필터 소유가 아니다**. (비교: `search_condition_main.jsp:2358` `data-id="MAIN_SEARCH_KIJUNDT"`)

반례 실측 — PG0310에서 `APLY_EMP_CUST_NO`/`CMBT_CUST_NO` 는 필터가 아니라 **모달 필수 입력**이다:
검색필터 정의는 `PG0310.jsp:12-16` 이고 ID 는 `RSC_CUST_NO`/`APLY_DT`/`CERS_MNG_TPCD`/`Constant.검색조건_문서관리_수신처` 뿐. 실제 소비처는 `PG0310.jsp:167`(POP2 담당자), `:251`(POP3 청구자), `:149`·`:233`(재원) 이며 넷 다 required(`:656,:660,:668,:670`). 이 코드를 지우면 셀렉트가 영구히 비고 저장이 원천 불가가 된다 — **에러 0건으로**.
또한 `PG0310.jsp:12` 의 `fnSelectFundKindCmbtNmCodeSearch(true,false)` 와 `:624` 의 `fnSelectFundKindCmbtNmCodeSearch(true,true)` 는 **함수명만 같고 인자·대상이 다른 별개 코드**다 — 함수명 일치로 중복 판정하지 말 것.

이 정정이 중요한 이유(양방향): "include 소유 요소를 참조하니 보존"이라는 과잉 규칙을 세우면 데드코드까지 붙들려 축소가 성립하지 않는다. 반대로 "필터 채움 코드는 다 데드"라는 일반화는 라이브 코드를 지운다. **보존 판정은 include가 실제로 내보내는 속성 이름(`MAIN_SEARCH_` 접두)과 페이지 자신의 `data-id` 마크업 개수를 둘 다 grep으로 확인한 뒤**에 내린다.

### 3.3 전역 레지스트리 (에러 없이 기능만 죽는 축)

```js
// common_grid.js:1630 — createMainGrid 내부
screenGrid.set(container + "_main", gridView);
// common_grid.js:2016-2020 — 엑셀 버튼이 이 레지스트리를 순회
for (let [key, value] of screenGrid) { if (key.indexOf('_main') > 0) ... }
```

`createMainGrid` 호출을 지우면 **에러 없이 엑셀만 빈 결과**가 된다. 툴바 엑셀 버튼은 페이지 변수명이 아니라 이 전역 레지스트리에 의존한다.

`setPaging`도 마찬가지로 페이지의 `#paging` 컨테이너와 include 소유 `#ADJ_GRID_COLUMN`을 함께 요구한다. 후자가 없으면 그리드 높이가 `NaNpx`가 된다(`common_grid.js:1836,1860`).

### 3.4 선언 형태별 등급

| 형태 | 미선언 시 | 등급 |
|---|---|---|
| `${X}` (EL) | 조용히 빈 문자열 → **URL이 host-relative 로 붕괴 → 404** | silent-loss (단, API URL 축이면 사실상 기능 전멸) |
| `<%= X %>` (스크립틀릿) | 컴파일 500 | hard-break |
| `\${X}` (백틱 안 EL 이스케이프) | 백슬래시 제거 시 EL 파싱 시도 → **구문 오류 500** | **hard-break** |

⚠️ `${X}` 를 "조용한 빈 문자열 = 위험도 낮음" 으로 읽으면 안 된다. `requestToken` 의 `errorCallback` 은 무응답을 포착하지 못하므로(`project_kiips_requesttoken_error_crlf_pitfalls`) 404가 사용자에게 **표면화조차 되지 않는다**.

단 **정적 include가 선언을 공급하는지 먼저 확인**한다. `${KiiPS_GATE}`는 페이지에 선언이 없어도 `header.jsp:14`의 `<spring:eval var="KiiPS_GATE"/>`가 공급하므로 정상이다. "페이지에 선언이 없다"만으로 결함 판정하면 오탐이다.

**공급원 판정 범위 (중요)**: `<%@ include file="…" %>`(정적)만 page scope를 공유한다. `<jsp:include page="…">`는 별도 request dispatch라 **공급원이 아니다**. `include/` 디렉토리를 통째로 grep 하면 실제로 포함되지 않는 파일의 선언까지 "있음"으로 오판한다 — SKILL.md §2 헤더가 만드는 `$SP/chain.txt` 만 조회 대상으로 쓴다.

실측 예 (PG0443, 2026-08-06):
```
$ head -1 $SP/chain.txt … (8개) header.jsp / inc_page_header.jsp / footer_sidemenu.jsp /
  message-proc.jsp / form-validator.jsp / Menu/sidemenu_right.jsp / COM/COMM_REASON.jsp / PG0443.jsp
$ grep -n 'KiiPS_PG' include/inc_page_header.jsp
2:<spring:eval expression="@environment.getProperty('KiiPS.PG.URL')" var="KiiPS_PG" />
```
→ `PG0443.jsp:8` 의 `var="KiiPS_PG"` 는 `inc_page_header.jsp:2`(정적 include, `PG0443.jsp:24`)와 **실제 중복**이다. 반면 `header.jsp` 가 선언하는 것은 `KiiPS_GRID`(:13)/`KiiPS_GATE`(:14)/`KiiPS_LOGIN`(:16)/`KiiPS_COMMON`(:18) 4개뿐이다. **"KiiPS_* 는 다 중복" 같은 일괄 판단은 금지 — 이름마다 개별 grep.**

`header.jsp` 소유 전역 `gToken`(`:374`)·`gLoginId`(`:377`)·`gEmpCustNo`(`:378`)는 재선언도 삭제도 금지다.

### 3.5 typeof 가드 — 등급을 가르는 단일 기준

| 콜백 | 가드 위치 | 부재 시 |
|---|---|---|
| `arrpovalReportcallBack` | `COMM_POPUP_CHECKLIST_*.jsp:589-590` `typeof window.opener.X === 'function'` | silent-loss (결재 후 목록 미갱신) |
| `fileSearchCallBack` | `inc_files.jsp:1306,1397` `typeof X == "function"` | safe |

가드가 없으면 **즉시 hard-break으로 재분류**한다. 이것이 등급 판정에서 가장 기계적으로 확인 가능한 신호다.

---

## 4. 게이트의 한계 (자동 신뢰 금지)

게이트 출력은 결론이 아니라 **사람이 각 항목을 확인할 목록**이다.

| 한계 | 결과 |
|---|---|
| 게이트 #2/#3은 `MENU_SCREEN_ID.equals("화면ID")` 패턴 의존 | 다른 분기 형태(switch·맵 조회)는 놓침. **슬라이스가 비면 WARN = 통과 아님** |
| 슬라이스 **종료** 경계는 최상위 `}else if(MENU_SCREEN_ID.equals(` | 중첩 분기 화면은 `중첩equals=N` WARN → **사람이 범위 육안 확정 필수**. v1은 중첩에서 멈춰 PG0418/PG0435 슬라이스가 14줄로 잘리고 뒤쪽 onclick **10건**을 놓쳤다(2028-2056) |
| 동적 조립 onclick(문자열 연결·eval) | 정적 grep으로 안 잡힘 |
| allowlist는 `common*.js` + `header.jsp`에서만 수집 | 벤더/도메인 공통 JS 전역 → **오탐**. allowlist에 우연히 동명이 있으면 → **false negative**. **게이트 #5 `OVERRIDE:` 목록이 이 축을 부분 완화**(로컬 재정의를 자동 safe에서 제외)하지만, 본문 diff는 여전히 사람 몫이다 |
| **delta 게이트(#2c/#3/#4/#6/#7/#9)는 before 스냅샷이 필수** | before가 없으면 "통과"가 아니라 **무효**. 스냅샷은 `$SP/*.before.txt`(TMPDIR, 세션 스코프) — 세션이 바뀌면 소실되므로 편집 전 반드시 새로 뜬다. 롤백 백업만 `.claude/state/jsp-min/`(영속, `.gitignore:91`) |
| 게이트 #8 선언 공급원 = 정적 include 체인만 | `<jsp:include>` 로만 들어오는 변수는 애초에 page scope 공유가 아니므로 검사 대상이 아니다. 반대로 include 디렉토리 전체 grep은 오탐 |
| 게이트 #10은 원본 바이트(`$F`)를 읽는다 | `clean.jsp`(주석 제거 사본)로 대체하면 바이트 수·줄바꿈이 달라져 **검출하려던 손상을 스스로 가린다** |
| 전부 정적 분석(L1) | JSP 컴파일·브라우저 렌더·Edge/팝업 런타임 미검증 |

**가장 중요한 한계**: 게이트 통과는 hard-break 부재의 **증명이 아니다.** 2026-08-06 적대검증에서 v1의 hard-break 등급 게이트가 거짓 통과하는 독립 경로가 **8개** 확인됐다(SKILL.md §0.1). v2는 그 8개를 모두 검출하지만, "다음 결함은 또 다른 축에 있다"는 전제로 운용한다.

---

## 5. 게이트 실효성 실증

### 5.1 v1 실증 (PG0445 두 산출물) — ⚠️ 일부 미검증

| 게이트 | 축소본 326줄 | 백업 611줄 | 상태 |
|---|---|---|---|
| #2 끊긴 참조 | **6건** (apprv 포함) | — | 유효 |
| #3 고아 정의 | `getDetailData` 단독 | — | 유효 |
| #4 gbn↔id 쌍 | `0 / 0` | **`17 / 0`** (data-id 소실) | 유효. **단 `0/0` 은 PG0445 의 값이지 모든 화면의 통과 기준이 아니다** — PG0310 무수정 실측은 `2 / 2`(clean 사본 기준). v2는 delta 로 판정한다 |
| #6 0-매칭 셀렉터 | 0건 | 7건 | **미검증** — §2.4 참조. v1 명령의 부분문자열 매칭·홑따옴표 한정 결함으로 재현 불가 |
| #7 화면ID 고유값 | 1개 / 총 8건 | — | **무효** — `sort -u | wc -l` 은 항등식(항상 1). v2로 교체 |
| #8 include 소비 변수 | 4개 모두 잔존 | — | 부분 유효 — 4변수 하드코딩이라 `SEARCH_CONDITION` 등은 무방비였다 |
| #9 //주석 내 `<%=` | 0건 | — | 부분 유효 — 후행 주석·`/* */`·`<%@` 미검사 |

**즉 정답은 어느 한쪽이 아니라 "백업의 스크립트 + 축소본의 속성"이다.**

### 5.2 v2 실증 (2026-08-06, PG0443 변조본 8종)

`base.jsp`(= `PG0443.jsp` 원본, `diff -q` 동일 확인) 대비 변조본 7종 + SID 오타 1종.
**v1은 8/8 을 PASS 시켰다. v2는 7건을 FAIL 검출하고, 1건(mutG)은 원래 안전한 편집임을 근거와 함께 밝혀냈다**(SKILL.md §10.1).

SKILL.md §5의 게이트 블록 원문을 그대로 추출해 실행한 delta 판정 실측 (2026-08-06):
```
===== base   >>> delta 판정: 이상 없음
===== mutA   삭제된 함수: getValidYn
             #2c FAIL(hard-break): getValidYn — 편집 전 in-page 호출 3건
             #2c FAIL(hard-break) 신규 미정의 호출: getValidYn
===== mutB2  #7 FAIL(hard-break) 타 화면ID 혼입: PG0444
             #7 FAIL(hard-break) 화면ID 등장 6→5 감소
===== mutC   #9 FAIL(hard-break) \${ 이스케이프 3→0 감소
===== mutD   삭제된 함수: ExcelExportAllCustom ExcelExportOriginCustom executeExcel
             #2c FAIL(hard-break): ExcelExportOriginCustom — 편집 전 in-page 호출 1건
             #2c FAIL(hard-break): executeExcel — 편집 전 in-page 호출 2건
===== mutE   #7 FAIL(hard-break) 화면ID 등장 6→4 감소
===== mutF   #6 FAIL(hard-break) 신규 0-매칭 셀렉터: APLY_DT
===== mutG   >>> delta 판정: 이상 없음   ← §10.1 사실 정정 (inc_page_header.jsp:2 가 공급)
```

무수정 프로덕션 파일 오탐 검사 (advisor 요구 — hard-break 게이트가 깨끗한 파일에서 울면 다음 운용자가 무시하게 된다):

| 화면 | 결과 |
|---|---|
| PG0443 (943줄, 무수정) | 게이트 #2a/#2b **0건**, #3 0건, #4 `0/0`, #6 TRUE-ORPHAN 0건, #7 `ID: PG0443` 단독, #8a/#8b **FAIL 0건**, #9 0건, #10 전부 OK. **#5 `OVERRIDE: ExcelExportAllCustom / ExcelExportOriginCustom` 2건 정상 보고** |
| PG0310 (1020줄, 무수정) | #2a/#2b 0건, #7 `ID: PG0310` 단독, #8a/#8b FAIL 0건, #9 0건, #10 OK(CRLF 1020/1020 — v1엔 줄바꿈 축이 없었다). **#3 `arrpovalReportcallBack`/`disableSelect`/`enableSelect` 3건, #4 `2/2`, #6 TRUE-ORPHAN 2건 = 원본 기준선** → 절대 0건 기준이 왜 틀렸는지의 직접 증거 |
| PG0445 (326줄, **현재 디스크 상태가 파손된 축소본**) | #2a **7건** DANGLING, #3 `getDetailData` — 파손을 정확히 재현. #6 `INCLUDE-OWNED: $('#FILTER_INPUT_TAG') <- inc_filter_main.jsp` (v1이 홑따옴표 한정이라 아예 못 보던 축) |

즉 v2 게이트는 **무수정 파일에서 FAIL을 만들지 않으면서**(PG0443 기준) 8종 변조를 전부 잡는다.
