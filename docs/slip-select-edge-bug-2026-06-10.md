# 전표(SLIP) 팝업 셀렉트박스 Edge 표시 버그 — 해결 방법

> 작성일: 2026-06-10
> 대상: `COM/COMM_SLIP.jsp`, `COM/COMM_SLIP_NEW.jsp` (전표등록 팝업)
> 라우터: `COM/COMM_POPUP_SLIP.jsp` (세션 `AC_REG_TYPEB_YN`로 두 파일 중 하나 include)

---

## TL;DR — 해결 요약

| # | 문제 | 해결 방법 | 종류 | 상태 |
|---|------|----------|------|------|
| 1 | **통화(CRC_TPCD)** 신규전표에서 Edge만 빈값 | KRW 기본값을 옵션로드 후·`setDetail`에서 재적용 | **근본 수정** | ✅ Edge 검증완료 |
| 2 | **재원/전표구분/전표발생구분/작성자**(V1) Edge만 빈값 | 선택 텍스트를 bootstrap-select 버튼에 직접 주입 | **우회(워크어라운드)** | ✅ Edge 검증완료 (우회) |

- 공통: **Chrome 정상 / Edge 비정상** (둘 다 Chromium 엔진, IE모드 아님 — `documentMode=undefined` 확인).
- 공통 진단 도구: **팝업 창의 DevTools 콘솔 1줄** (브라우저 자동화 도구는 `window.open` 팝업창에 attach 불가).

---

## 해결 1: 통화(CRC_TPCD) — 근본 수정 ✅

### 원인 (비동기 race)
신규모드(`line 988`: `isNull(slipno) || 'AC0513'==SCREEN_ORIGIN || iw_work=='Y'`)에서 통화 기본값을 `selectpicker('val','KRW')`로 세팅하지만, **옵션로드(`fnCommCode("CRC_TPCD").then()`)·`setDetail`(그리드 빈 통화를 `.val(undefined)`로 세팅)** 과 조율 없이 경합. Edge에서는 `setDetail`이 KRW를 **null로 나중에 덮어** 빈값이 됨. Chrome은 덮는 타이밍이 앞서 KRW 생존.

### 적용 코드 (`[edge-fix]` 2곳/파일)

**① 옵션 로더 `.then()` — 옵션 로드 후 신규모드면 KRW 재적용** (COMM_SLIP.jsp ~347, NEW ~364)
```js
fnCommCode("CRC_TPCD").then(function(data) {
    $('[data-id="CRC_TPCD"]').html(fnCreateSelectOpt(data));
    $('[data-id="CRC_TPCD"]').selectpicker('refresh');
    //[edge-fix] 신규모드 KRW 기본값을 옵션 로드 후 재적용
    var _slipno = (typeof localStorage != 'undefined') ? localStorage.getItem('SLIPNO') : '';
    var _scrOri = (typeof localStorage != 'undefined') ? localStorage.getItem('SCREEN_ORIGIN') : '';
    var _isIw = (typeof KEYS_DATA !== 'undefined' && KEYS_DATA && KEYS_DATA.IW_WORK == 'Y');
    if (StringUtil.isNull(_slipno) || 'AC0513' == _scrOri || _isIw) {
        $('#AC02011V2 [data-id="CRC_TPCD"]').selectpicker('val','KRW').selectpicker('refresh');
    }
});
```

**② `setDetail()` — 그리드 통화 빈값 + 신규모드면 KRW 기본** (COMM_SLIP.jsp ~1473, NEW ~1933) — *확정 범인 차단*
```js
let CRC_TPCD = gridView1.getValue(newRow, "CRC_TPCD"); //통화   (NEW는 grid.getValue)
//[edge-fix] 신규모드인데 그리드 통화값이 없으면 KRW 기본 (setDetail의 null 덮어쓰기 차단)
if (StringUtil.isNull(CRC_TPCD)) {
    var _sln2 = (typeof localStorage != 'undefined') ? localStorage.getItem('SLIPNO') : '';
    var _so2  = (typeof localStorage != 'undefined') ? localStorage.getItem('SCREEN_ORIGIN') : '';
    var _iw2  = (typeof KEYS_DATA !== 'undefined' && KEYS_DATA && KEYS_DATA.IW_WORK == 'Y');
    if (StringUtil.isNull(_sln2) || 'AC0513' == _so2 || _iw2) { CRC_TPCD = 'KRW'; }
}
```

조건은 `localStorage`(SLIPNO/SCREEN_ORIGIN) + `KEYS_DATA.IW_WORK`로 line 988과 동일하게 재현. **기존 전표는 신규모드 게이트로 보호 → 회귀 없음.**

### 검증
Edge 새 팝업에서 재적용 없이 `$('#AC02011V2 [data-id=CRC_TPCD]').val()` → `'KRW'`, 화면에 `대한민국 (원)` 자동 표시 확인. (Node 거동 시뮬 회귀 테스트 5/5 통과)

---

## 해결 2: 재원/V1 셀렉트 — 우회(워크어라운드) ⚠️

### 원인 (bootstrap-select Edge 렌더 버그)
연동전표(IL0801)에서 `#AC02011V1` 셀렉트들(재원 RSC_CUST_NO·전표구분 SLIP_TPCD·전표발생구분 SLIP_OGRN_TPCD·작성자 MAK_EMP_CUST_NO)이 **네이티브 `<select>`는 완벽**(option selected, 텍스트 존재, 중복 없음)한데 **bootstrap-select 버튼만 "선택해주세요"** 로 표시. Edge만.

> 콘솔 실측: `selectCount=1, opt101count=1, selected=[101:(주)로고스인베스트먼트]` — 네이티브 정상. 그런데 위젯 placeholder.

### ⛔ 기각된 접근 (시간 낭비 방지 — 모두 콘솔 실측으로 무효 확인)
| 시도 | 결과 |
|------|------|
| `data-hide-disabled="true"` 제거 | ❌ disabled 옵션 0/154개, 제거+재초기화해도 placeholder |
| `selectpicker('render')` 호출 | ❌ placeholder |
| `BootstrapVersion='4'` 명시 + 재초기화 | ❌ (감지값 undefined였으나 설정해도 무효) |
| native `.val()` → `selectpicker('val')` (문자열·배열) | ❌ placeholder |
| `selectpicker('destroy')` + 재초기화 | ❌ 이미 selected인 option도 렌더 못 함 |
| 값 재적용 타이밍 조정(.then 이후 등) | ❌ 비결정적(같은 명령이 때마다 다른 결과) |

→ **표준 API로는 해결 불가. bootstrap-select 라이브러리 자체의 Edge 렌더 결함.**

### ✅ 우회책: 선택 텍스트를 버튼에 직접 주입
네이티브 select가 완벽하므로, **선택된 option의 텍스트를 bootstrap-select 버튼 요소(`.filter-option-inner-inner`)에 직접 write**. V1 필드들은 연동전표에서 **disabled(잠김)** 라 주입값이 안정적(사용자 조작으로 리셋 안 됨).

### 적용 코드 — top-level 함수 1개 + setTimeout 호출 4곳/파일 (신규모드 2 + 상세/MOD 2)
**⚠️ 적용 범위 주의:** 신규전표 생성(IL0801 등)뿐 아니라 **기존 전표 상세 조회(MOD, 예: AC0401 분개장조회 → 행 더블클릭 상세 팝업)** 도 같은 desync가 발생. **두 경로 모두** 커버해야 함.

함수는 `setDetail` 위 **top-level로 정의**(양쪽 호출 가능):
```js
//[edge-fix] bootstrap-select Edge 렌더 버그 우회 — V1 셀렉트(disabled 표시필드)의 선택 텍스트를 버튼에 직접 주입.
function _syncV1SelectBtnText(){
    $('#AC02011V1 .selectpicker').each(function(){
        var $s = $(this), op = $s.find('option:selected');
        if(op.length && op.val() != null && op.val() !== ''){
            var $b = $s.closest('.bootstrap-select').find('.filter-option-inner-inner');
            if($b.length && $.trim($b.text()) !== $.trim(op.text())){ $b.text(op.text()); }
        }
    });
}
```
호출(각 경로의 값 세팅 후):
```js
setTimeout(_syncV1SelectBtnText, 800);
setTimeout(_syncV1SelectBtnText, 2500);
```
- **신규모드 블록** 끝(값 세팅 후) + **상세(MOD) `setDetail(gridView1,0,0)` 직후** 양쪽에 배치.
- `setTimeout` 2회(800/2500ms)로 비동기 로드 완료 후 실행. disabled 표시필드라 다소 늦게 떠도 무방. 텍스트 이미 맞으면 안 건드림(idempotent).

**+ 재렌더 대응 (MutationObserver):** `setTimeout`은 **로드 시 1회(one-shot)** 라, **행삭제·행추가 등 이후 액션**으로 selectpicker가 재렌더되면 다시 placeholder가 됨(우회 미재실행). → `#AC02011V1`을 MutationObserver로 감시해 **재렌더 시 자동 재주입**:
```js
//[edge-fix] 행삭제/추가 등으로 V1 selectpicker가 재렌더(placeholder)되면 자동 재주입
if(window.MutationObserver){
    var _v1obsEl = document.getElementById('AC02011V1');
    if(_v1obsEl){
        new MutationObserver(function(){ _syncV1SelectBtnText(); })
            .observe(_v1obsEl, {childList:true, subtree:true, characterData:true});
    }
}
```
- ⚠️ #AC02011V1 폼은 그리드(AC0201DVIEW1)를 포함하지만 **RealGrid 2.6.3은 canvas 기반**이라 그리드 편집으론 DOM 변이가 거의 없음 → observer 과다 발화 없음. 콜백(`_syncV1SelectBtnText`)은 idempotent라 무한루프 없음.
- ✅ **신규(IL0801)·상세(AC0401 MOD)·행삭제 후 유지 — 모두 Edge 검증 완료** (2026-06-10).

### ⚠️ 한계 / 검증
- **근본 수정 아님(우회)**. bootstrap-select 렌더 버그 자체는 잔존.
- 적용 범위: **신규모드(IL0801 등) 경로만**. 기존 전표 조회(MOD)에서 같은 desync가 있으면 별도 적용 필요(미확인).
- `setTimeout` 고정 지연(800/2500ms)이 느린 네트워크에서 부족할 수 있음 → 안 뜨면 지연값 상향.
- **검증 상태: ✅ Edge 새 팝업에서 자동실행(setTimeout) 검증완료 — 4필드 정상 표시 확인 (2026-06-10). SVN 커밋됨.**

---

## 적용 변경 요약 (SVN 커밋 대상)
| 파일 | 통화(근본 수정) | 재원/V1(우회) |
|------|----------------|--------------|
| `COMM_SLIP.jsp` | CRC `.then()` KRW 재적용 + `setDetail` KRW 기본 | `_syncV1SelectBtnText` top-level 함수 1 + setTimeout 4곳(신규모드 2 + 상세/MOD 2) |
| `COMM_SLIP_NEW.jsp` | (동일) | (동일) |

- 모든 변경은 `//[edge-fix]` 주석으로 표시 (`grep edge-fix`로 위치 확인).
- ✅ 통화·재원(신규+MOD) **모두 Edge 검증 완료**.
- `.claude/` 메모리·`/tmp` 테스트는 SVN 커밋 대상 아님.

---

## 부록: 진단 도구 (재사용)
> ⚠️ 반드시 **팝업 창(window.open)의 DevTools** 콘솔에서 실행. 작은따옴표만 사용(마크다운 복사 시 스마트따옴표 → `Invalid token`).

```js
// 필드 saved/inOpts/shown
(function(){var g=gridView1;function f(n){var v=g.getValue(0,n);var $s=$('#AC02011V2 [data-id='+n+']');var o=$s.find('option').map(function(){return this.value}).get();return n+': saved=['+v+'] inOpts='+(o.indexOf(String(v))>=0)+' shown=['+$s.val()+']';}return [f('CRC_TPCD'),f('PL_DEPT_CD')].join('\n');})()

// 브라우저 모드 (IE모드 여부)
'documentMode='+document.documentMode+' compatMode='+document.compatMode

// 셀렉트 구조 (중복/선택텍스트)
(function(){var r=$('#AC02011V1 [data-id=RSC_CUST_NO]');return 'count='+r.length+' opt101='+r.find('option[value=101]').length+' selected=['+r.find('option:selected').map(function(){return this.value+':'+this.text}).get().join('|')+']';})()

// bootstrap-select 버튼 표시 텍스트
$('#AC02011V1 [data-id=RSC_CUST_NO]').closest('.bootstrap-select').find('.filter-option-inner-inner').text()
```

## 교훈
1. **런타임 증거 우선** — 정적 분석/추측으로 단정 금지. 콘솔 1줄 진단이 결정적이었음.
2. **브라우저 차이 = IE모드(userAgent) + 비동기 race + 라이브러리 렌더버그** 순으로 의심.
3. **같은 명령의 비결정적 결과 = 구조적 문제 신호** → 단발 수정 반복(Ralph Loop) 중단, 우회로 전환.
4. 통화(값 소실)와 재원(위젯 desync)은 증상 유사하나 **메커니즘이 달라 해법도 다름**.

