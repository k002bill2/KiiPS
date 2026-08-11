---
name: kiips-jsp-minimizer
description: "KiiPS 기존 JSP 화면에서 스크립트·마크업·컴포넌트 속성을 **제거**할 때 쓰는 안전 절차 — 삭제 전후 스냅샷을 delta 대조해 끊긴 참조·소실 속성·소실 계약을 검출하고, 제거 영향을 hard-break(에러 발생·제거 금지)와 silent-loss(무증상 기능상실·허용하되 반드시 보고)로 등급 분류한다. Use when: JSP 최소화, JSP 슬림화, 화면 스크립트 축소, 미사용 함수 제거, 안 쓰는 data-id 제거, hidden input 제거, minimize jsp, 경량화, 슬림화. NOT for: 일반 코드 단순화·리팩토링·가독성 개선(use code-simplifier), 신규 페이지 생성·표준 패턴 학습(use kiips-page-pattern-guide), JSP 공통 폼/AJAX 규칙(use kiips-frontend-guidelines), 모달·컴포넌트 추가(use kiips-regist-modal-guide / kiips-ui-component-builder), Java8/SCSS 호환성 검증(use legacy-compliance-checker), RealGrid 컬럼·API 설정(use kiips-realgrid-guide)"
---

# KiiPS JSP 화면 축소 (JSP Minimizer)

기존 JSP 화면에서 스크립트·마크업·컴포넌트 속성을 **제거**할 때 쓰는 안전 절차.
"지워도 되는가"를 감이 아니라 **grep 대조 증거**로 판정하고, 제거 영향을 등급으로 분류한다.

> **이 스킬은 한 세션에서 한 화면만 다룬다. 병렬·연속 실행 금지.**
> 환경 파일이 화면ID별로 분리돼 있어도, 같은 세션에서 두 화면을 번갈아 다루면 스냅샷 기준선이 뒤섞인다.
> 두 화면을 축소해야 하면 화면 A를 §3[9] 완료 보고까지 끝낸 뒤 화면 B를 시작한다.

## 0. 이 스킬이 존재하는 이유 — 실측 반례 2건

PG0445(경조사 신청) 축소 작업에서 **서로 반대 방향으로 망가진 산출물 2개**가 나왔다.

| 산출물 | 무엇을 지웠나 | 결과 |
|---|---|---|
| 축소본 326줄 | 스크립트 대량 삭제, 속성은 유지 | **hard-break 6건** — 버튼 클릭 시 ReferenceError |
| 백업 611줄 (`verified-backup`) | 모달 `data-id` 17건 삭제, 스크립트는 유지 | **silent-loss** — 에러 0건으로 빈 데이터 저장 |

교훈 3가지가 이 스킬 전체의 뼈대다.

1. **"원본에 있었으니 보존"은 판정 근거가 아니다.** 611줄 "검증된 완성본"조차 0-매칭 셀렉터 7건을 품고 있었다.
2. **파일명·타임스탬프는 신뢰 기준이 아니다.** `verified-backup`이 511줄본보다 30분 **늦게** 만들어졌고 더 망가져 있었다.
3. **사람이 손으로 뽑은 목록은 항상 빠진다.** 초기 인수인계는 끊긴 참조를 5건으로 봤으나 실제는 **6건**이었다.

### 0.1 게이트 자체가 거짓 통과한 실측 8건 (2026-08-06 적대검증)

v1 게이트는 **아래 8개 변조본을 전부 "9게이트 PASS"로 통과시켰다.** v2는 **7건을 검출하고 1건(mutG)은 원래 안전한 편집임을 밝혀냈다**(§10.1 사실 정정).

| 변조 | 무엇을 했나 | v1 | v2 검출 게이트 |
|---|---|---|---|
| mutA | `getValidYn` 삭제(JS→JS 호출 3곳) | PASS | #2c `편집 전 in-page 호출 3건` |
| mutB2 | `ScreenAuth.get("PG0443")`→`"PG0444"` | PASS | #7 `타 화면ID 혼입: PG0444` |
| mutC | 백틱 안 `\${` 이스케이프 3곳 제거 | PASS | #9 `\${ 3→0 감소` |
| mutD | Excel 오버라이드 3함수 51줄 삭제 | PASS | #2c `executeExcel 호출 2건` |
| mutE | `out_gbn = 'PG0443'` 2줄 삭제 | PASS | #7 `화면ID 등장 6→4 감소` |
| mutF | 스코프 셀렉터→`$('#APLY_DT')` 축약 | PASS | #6 `신규 0-매칭 셀렉터` |
| mutG | `<spring:eval var="KiiPS_PG"/>` 삭제 | PASS | #8b 체인 조회 후 **정당하게 통과** — §10.1 사실 정정 |
| SID오타 | `SID=ZZ9999` 로 헤더 실행 | 전 게이트 0건 PASS | §2 `ABORT … exit 1` (실측 종료코드 1) |

**증거**: §5의 게이트 블록 원문을 그대로 추출해 `base.jsp`(= `PG0443.jsp`, `diff -q` 동일) 대비 실행한 실측 출력 — reference.md §5.2.
부수 확인: 변조본을 `mutA.jsp` 파일명 그대로 검사하려 하면 프리앰블이 `ABORT: env 오염 — F=…/mutA.jsp, SID=PG0443` 으로 **거부**한다. basename 자가검증이 실제로 작동한다는 직접 증거다.

## 1. 판정 루브릭

| 등급 | 정의 | 처분 |
|---|---|---|
| **hard-break** | 제거 시 JSP 컴파일 500 또는 런타임 throw/ReferenceError | **예외 없이 제거 금지** |
| **silent-loss** | 에러 0건인데 기능·데이터가 사라짐 | 제거 허용, 단 **완료 보고 §3에 100% 명시** |
| **safe** | 소비처 0건 증명 완료, 동작 변화 없음 | 제거 가능 (증거 첨부 필수) |
| **판정 불가** | §4 진리표 어느 칸에도 안 들어감 | **보존 + 보고** (기본값) |

## 2. 시작 전 필수 — 공통 헤더 블록

⚠️ **모든 검증 명령은 이 블록을 먼저 실행해야 동작한다.** 에이전트 셸은 호출 간 cwd가 초기화되므로 상대 경로는 반드시 실패한다.

`<화면ID>`만 바꿔서 그대로 붙여넣는다. **ABORT가 출력되면 그 자리에서 중단한다 — 이 블록은 실제로 `exit 1` 한다.**

```bash
SID=PG0445                                        # ← 여기만 수정
ROOT=/Users/younghwankang/WORK/WORKSPACE/KiiPS
JSPROOT="$ROOT/KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips"
SP="${TMPDIR%/}/jsp-min-$SID"; mkdir -p "$SP"
BK="$ROOT/.claude/state/jsp-min"; mkdir -p "$BK"        # .gitignore:91 로 VCS 무오염 + 세션 넘어 보존
N=$(find "$JSPROOT" -name "$SID.jsp" | wc -l | tr -d ' ')
[ "$N" -eq 0 ] && { echo "ABORT: $SID.jsp 없음 — 절차 중단"; exit 1; }
[ "$N" -gt 1 ] && { echo "ABORT: $SID.jsp 다중 매칭 $N건 — 아래에서 경로를 골라 F= 로 수동 지정 후 이 블록 재실행";
                    find "$JSPROOT" -name "$SID.jsp"; exit 1; }
F=$(find "$JSPROOT" -name "$SID.jsp")
[ -f "$F" ] && [ "$(basename "$F" .jsp)" = "$SID" ] || { echo "ABORT: F 미설정/불일치 (F=$F)"; exit 1; }
BACKUP="$BK/$SID.jsp.before-minimize.$(date +%Y%m%d-%H%M%S)"; cp "$F" "$BACKUP"   # 타임스탬프 = 절대 덮어쓰기 없음
printf 'ROOT=%s\nSID=%s\nSP=%s\nJSPROOT=%s\nF=%s\nBACKUP=%s\n' "$ROOT" "$SID" "$SP" "$JSPROOT" "$F" "$BACKUP" > "$SP/env.sh"
# 정적 include 체인 해석 (<%@ include %> 만. <jsp:include> 는 page scope 미공유 → 제외)
: > "$SP/chain.txt"; echo "$F" > "$SP/q"
for d in 1 2 3 4; do : > "$SP/n"
  while read -r f; do [ -f "$f" ] || continue; grep -qxF "$f" "$SP/chain.txt" && continue; echo "$f" >> "$SP/chain.txt"
    dd=$(dirname "$f"); grep -ohE '<%@[[:space:]]*include[[:space:]]+file="[^"]+"' "$f" \
      | sed -E 's/.*file="//;s/"$//' | while read -r p; do echo "$dd/$p"; done >> "$SP/n"; done < "$SP/q"
  sort -u "$SP/n" > "$SP/q"; [ ! -s "$SP/q" ] && break; done
sort -u "$SP/chain.txt" -o "$SP/chain.txt"
cat "$SP/env.sh"; echo "정적 include 체인 $(wc -l < "$SP/chain.txt" | tr -d ' ')개"; sed "s|$JSPROOT/||" "$SP/chain.txt"
shasum -a 1 "$F" | tee "$SP/hash.before.txt"
[ -s "$SP/hash.before.txt" ] || { echo "ABORT: 해시 캡처 실패 — 절차 중단"; exit 1; }
```

⚠️ **§2 헤더를 편집 후에 재실행하지 말 것.** 재실행하면 `$BACKUP` 이 **이미 편집된 파일**의 사본이 되어, delta 블록 `[D]` 의 `#2c`(삭제 함수의 편집 전 호출 수)가 0을 세고 **거짓 통과**한다. `$SP` 는 `TMPDIR` 이라 세션이 바뀌면 사라지므로 이 상황은 실제로 발생한다.
→ 세션을 새로 시작해 이어서 작업한다면, `.claude/state/jsp-min/` 의 **기존 타임스탬프 백업**을 골라 `BACKUP=` 으로 수동 지정하고, before 스냅샷(게이트 1·2·4·5·6·7·9)은 그 백업 파일을 `F=` 로 두고 다시 뜬다.

### 게이트 공통 프리앰블 (모든 게이트 첫 3줄, 그대로 복사)

```bash
SID=PG0445; . "${TMPDIR%/}/jsp-min-$SID/env.sh" 2>/dev/null || { echo 'ABORT: env 없음 — §2 헤더 먼저'; exit 1; }
[ -f "$F" ] && [ "$(basename "$F" .jsp)" = "$SID" ] || { echo "ABORT: env 오염 — F=$F, SID=$SID"; exit 1; }
echo "[GATE @ $SID] $F"
```

⚠️ **환경 파일은 `$SP/env.sh`(화면ID 네임스페이스)이며 고정 경로가 아니다.** v1은 `jsp-min-env.sh` 단일 파일을 썼고, 형제 에이전트가 같은 스킬을 다른 화면으로 실행하자 **SID/F/SP가 통째로 뒤바뀐 채 게이트가 "0건 PASS"를 출력했다**(실측: PG0310 담당 세션이 PG0443 파일을 검사). 프리앰블의 `basename` 자가검증이 이 오염을 차단한다. **게이트 출력 첫 줄 `[GATE @ SID] 경로`를 보고서에 반드시 함께 붙인다** — 그것이 대상 무오염의 유일한 육안 증거다.

> `grep -r` 금지: 이 저장소의 `.gitignore:29`가 `static/js/*.js`를 제외시켜 공통 JS가 검색에서 통째로 누락된다. 반드시 `find … -print0 | xargs -0 grep` 을 쓴다.

## 3. 실행 절차 [0]~[9]

### [0] 스코프 확정 + 동시편집 가드
대상 JSP를 **지금 새로 Read** 한다(캐시 신뢰 금지 — 사용자가 IDE로 동시 편집 중일 수 있다). §2 헤더 블록을 실행해 해시를 `$SP/hash.before.txt`에 캡처한다. 파일명·타임스탬프·"verified" 같은 라벨을 신뢰 기준으로 쓰지 않는다.

### [1] 백업
§2 헤더가 `$ROOT/.claude/state/jsp-min/$SID.jsp.before-minimize.<타임스탬프>` 로 자동 생성한다.
**프로덕션 트리 안에 `.bak`을 만들지 않는다**(SVN 오염). 타임스탬프 파일명이라 재실행해도 이전 롤백 지점이 덮어써지지 않는다.
SVN 프로젝트이므로 `svn diff "$F"` / `svn revert "$F"` 도 대안 경로다 — 단 **revert는 사용자 승인 필수**(`.claude/rules/ralph-loop-detection.md`).

### [2] 인벤토리 스냅샷 (before) — **모든 delta 게이트의 전제**
게이트 **#1, #2, #4, #5, #6, #7, #9** 를 `SUF=before` 로 **편집 전에 반드시 1회씩** 실행한다.
개수가 아니라 **정렬된 값 목록**을 파일로 남긴다 — 개수만 세면 rename이 카운트를 유지한 채 필드를 소실시키는 것을 놓친다.

⚠️ **before 스냅샷이 없으면 delta 게이트는 "통과"가 아니라 "무효"다.** 이것이 v1의 최대 결함이었다: 게이트 #3/#4가 절대 기준(0건)으로 판정해, 원본이 이미 0이 아닌 화면(PG0310 실측 `2 / 2`)에서 **자기가 만들지도 않은 소실을 허위 보고하거나, 게이트를 통과시키려고 버튼에 `data-gbn`을 붙이는 "수리"를 유발**했다. 그 수리는 `common.js:726`의 `$(parentId+" [data-gbn]").each` 순회에 버튼을 편입시켜 저장 payload를 오염시킨다. **게이트를 통과시키려고 마크업을 추가하는 행위는 금지다.**

### [3] 크로스파일 호출부 전수 수집
**JSP 하나만 읽고 "최소 필요 스크립트"를 판정하는 것은 원리적으로 불가능하다.** 화면ID 분기 슬라이스를 동적으로 추출(줄번호 하드코딩 금지)하고, 전역 함수 allowlist를 차감한다.

⚠️ **게이트 #2는 3개 축으로 나뉘며 각 축의 커버리지가 다르다.**

| 축 | 무엇을 보는가 | 판정 |
|---|---|---|
| #2a | include 슬라이스 + 페이지의 **HTML 인라인 핸들러**(`on*=`, `href="javascript:"`) | 절대 0건 |
| #2b | 페이지의 **JS 등록 핸들러**(`.on('click',fn)`, `addEventListener`, RealGrid `onCellDblClicked=`) | 절대 0건 |
| #2c | 페이지 **JS 본문의 함수 호출**(`foo()`) | **delta 판정만** |

**#2a가 0건이라는 사실은 JS 본문 호출이 살아 있다는 증거가 전혀 아니다.** v1은 #2a만 갖고 "끊긴 참조 0건 = hard-break 없음"이라 선언했고, 그 결과 PG0443 전체 정의 19개 중 **7개(37%)가 게이트 사각지대**였다(`comm -23 defs.txt attrcalls.txt` 실측). #2c가 그 축을 덮는다.

### [4] 제거 후보 판정 — 진리표
후보마다 아래 5개를 **파일:줄 근거와 함께** 기록한다. 하나라도 못 대면 제거하지 않는다.

| # | 질문 | 측정 명령 |
|---|---|---|
| a | 소비처 grep 0건인가 (**슬라이스 + `$F` 전체**, `on*=` 만이 아니라) | `grep -nE "[^A-Za-z0-9_.$]NAME[[:space:]]*\(" "$F"` |
| b | 정의처가 페이지 로컬인가 전역인가 | 게이트 #5 OVERRIDE 목록 |
| c | `typeof` 가드 뒤에 있는가 | `grep -n "typeof.*NAME" 소비처파일` |
| d | 정적 include(`$SP/chain.txt`)가 그 심볼을 소비하는가 | `tr '\n' '\0' < "$SP/chain.txt" \| xargs -0 grep -l NAME` |
| e | 이 셀렉터/코드가 **마크업 2개 이상**을 의도적으로 겨냥하는가 | `grep -c 'data-id="X"' "$F"` |

**등급 결정표** (위에서부터 순서대로 적용, 처음 일치하는 행이 등급):

| 조건 | 등급 |
|---|---|
| d = yes (정적 include가 소비) | **hard-break** — 무조건 |
| a > 0건 (소비처 존재) | **hard-break** — 제거 금지 |
| e ≥ 2 (브로드캐스트 계약) | **hard-break** — 스코프 축소·삭제 모두 금지 |
| b = 전역 동명 존재하나 본문 diff 있음 (OVERRIDE) | **hard-break** — 사람이 본문 대조 전까지 제거 금지 |
| a = 0 & c = 가드 있음 | **safe** |
| a = 0 & c = 가드 없음 & b = 페이지 로컬 | **hard-break** |
| a = 0 & c = 가드 없음 & b = 전역 fallback 존재 | silent-loss |
| 위 어느 칸에도 해당 없음 | **판정 불가 → 보존 + 보고** |

### [5] 편집 직전 해시 재확인
```bash
SID=PG0445; . "${TMPDIR%/}/jsp-min-$SID/env.sh" 2>/dev/null || { echo 'ABORT: env 없음'; exit 1; }
[ -f "$F" ] && [ "$(basename "$F" .jsp)" = "$SID" ] || { echo "ABORT: env 오염"; exit 1; }
[ -s "$SP/hash.before.txt" ] || { echo "ABORT: before 해시 없음 — 이 비교는 무효"; exit 1; }
shasum -a 1 "$F" > "$SP/hash.now.txt"
diff "$SP/hash.before.txt" "$SP/hash.now.txt" && echo "OK: 편집 진행 가능" || echo "ABORT: 사용자가 편집함 — 인벤토리 무효, 중단하고 보고"
```
불일치면 **즉시 중단하고 사용자에게 보고한다**(우회 수단 없음). 일치할 때만 Edit하며, **한 번에 하나의 관심사만** 제거한다.

### [6] 게이트 실행 (after)
편집 직후 즉시 게이트 #1~#10을 **전부** `SUF=after` 로 실행하고, delta 판정 블록(§5 [D])을 돌린다.

> ⚠️ **"HTML 마크업은 남기고 JS만 삭제"는 항상 끊긴 참조를 만든다.** 모달은 (마크업 + 핸들러 세트)를 **원자 단위**로 통째 유지하거나 통째 제거한다.

### [7] 인벤토리 diff (after)
delta 블록이 before/after 값 목록을 `comm` 대조해 의도하지 않은 소실을 잡는다.
게이트 #3은 **신규 발생분만**(`comm -13 orphans.before orphans.after`) 본다 — 절대 0건이 아니다.

### [8] 실패 시 즉시 복원
게이트 중 하나라도 hard-break을 보고하면 논쟁 없이 백업으로 되돌린다(부분 되돌리기·재해석 금지).
```bash
SID=PG0445; . "${TMPDIR%/}/jsp-min-$SID/env.sh"
[ "$(basename "$F" .jsp)" = "$SID" ] && [ -f "$BACKUP" ] || { echo "ABORT: 복원 대상 불일치 — 수동 확인"; exit 1; }
cp "$BACKUP" "$F"; shasum -a 1 "$F" > "$SP/hash.restored.txt"; cat "$SP/hash.restored.txt"
diff "$SP/hash.before.txt" "$SP/hash.restored.txt" && echo "복원 확인 — 원본과 바이트 동일"
```
같은 접근으로 재시도하지 않는다. **동일 파일 3회 편집에 도달하면 Ralph Loop로 간주해 중단**한다.

⚠️ **게이트 #6이 편집 후 신규 TRUE-ORPHAN을 보고했는데 그 편집이 "주석 블록 제거"였다면**, 원인은 편집이 아니라 **주석 안에 있던 `id=`가 v1 grep에 매칭돼 셀렉터를 살아 있는 것처럼 보이게 했던 것**이다(PG0310 `$('#btn_registModal')` 실측). 이 경우 정답은 롤백이 아니라 **`$SP/clean.jsp`(주석 제거 사본) 기준 재측정**이다 — v2 게이트 #4/#6은 이미 clean.jsp를 본다.

### [9] 완료 보고
§8 템플릿을 그대로 쓴다. 게이트 출력(명령 + 실제 출력, `[GATE @ SID] 경로` 첫 줄 포함)을 붙이고, silent-loss를 한 건도 빠짐없이 명시하고, 검증 한계를 밝힌다.

## 4. 게이트 통과 기준

| # | 게이트 | 통과 기준 | 실패 시 등급 | 읽는 파일 |
|---|---|---|---|---|
| 1 | 함수 정의 인벤토리 | (스냅샷 — 판정 없음) | — | `$F` |
| 2a | 끊긴 참조 (HTML 인라인 핸들러) | **0건** | hard-break | `$F` + slice |
| 2b | 끊긴 참조 (JS 등록 핸들러) | **0건** | hard-break | `$F` |
| 2c | 삭제 함수의 편집 전 in-page 호출 / 신규 미정의 호출 | **delta 0건** | hard-break | before + after |
| 3 | 고아 정의 | **신규분 0건** (절대 0건 아님) | silent-loss | `$F` + slice |
| 4 | data-gbn↔data-id 쌍 | **before 대비 증가 0건** | silent-loss | `clean.jsp` |
| 5 | 속성 값 집합 diff (+`id` 축) / OVERRIDE 목록 | 소실분 **공집합** / OVERRIDE는 사람 대조 | silent-loss | `$F` |
| 6 | 셀렉터 3분류 | **신규 TRUE-ORPHAN 0건**, INCLUDE-OWNED 제거 0건 | hard-break | `clean.jsp` |
| 7 | 화면ID 무결성 + `<jsp:param>` 구조 | 타 화면ID 혼입 0 + 등장수 비감소 + param 소실 공집합 | **hard-break** | `$F` |
| 8a | `<%= %>` 스크립틀릿 변수 해소 | 미선언 **0건** | hard-break | `$F` + chain |
| 8b | `${EL}` 심볼 해소 | 미선언 **0건** | hard-break | `$F` + chain |
| 9 | 주석 내 `<%=`/`<%@` + `\${` 이스케이프 + `<%= %>` 집합 | 검출 0건 + 이스케이프 비감소 + 식 집합 소실 공집합 | hard-break | `$F` |
| 10 | 편집 후 바이트 무결성 | 인코딩·BOM·1행 디렉티브·한글 식별자·줄바꿈 | hard-break | `$F` (원본 바이트) |

⚠️ **게이트 통과는 hard-break 부재의 증명이 아니라, 위 표에 열거된 축에서 미검출이라는 뜻이다.** 동적 조립 onclick(문자열 연결·`eval`), `switch`/맵 조회로 분기하는 include, allowlist 동명이인은 여전히 사각지대다.

⚠️ **슬라이스가 비거나 중첩 `equals`가 잡히면 "통과"가 아니라 "경고"다.** 게이트 #2 종료 경계는 **최상위 `}else if(MENU_SCREEN_ID.equals(`** 로만 끊는다. v1은 아무 `MENU_SCREEN_ID.equals(` 에서나 멈춰, 중첩 분기가 있는 화면(PG0418/PG0435 실측: `start=2014 end=2027`, 뒤쪽 2028-2056의 onclick **10건 누락**)에서 슬라이스가 14줄로 잘렸다. 중첩이 발견되면 `중첩equals=N` WARN이 찍히므로 **사람이 범위를 눈으로 확정**한다.

## 5. 검증 명령

각 블록은 §2 헤더 블록 실행 후 그대로 복사·실행 가능하다. **모든 블록의 첫 3줄은 §2의 게이트 공통 프리앰블이다** — 아래에서는 `«P»` 로 표기하며, 실제 실행 시 그 3줄을 그대로 붙여넣는다.

```bash
# [1] 게이트1 함수 정의 인벤토리 — 편집 전 SUF=before, 편집 후 SUF=after 로 두 번
«P»
SUF=before   # ← 편집 후에는 after
grep -oE '^[[:space:]]*function[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*' "$F" \
  | sed -E 's/.*function[[:space:]]+//' | sort -u > "$SP/defs.$SUF.txt"
perl -0pe 's/<%--.*?--%>//gs' "$F" > "$SP/clean.$SUF.jsp"      # 게이트4/6 전용 주석제거 사본
echo "정의 $(wc -l < "$SP/defs.$SUF.txt" | tr -d ' ')개"; cat "$SP/defs.$SUF.txt"
```

```bash
# [2] ★게이트2 끊긴 참조 — 슬라이스 + 3개 축
«P»
SUF=before   # ← 편집 후에는 after
: > "$SP/slice.txt"
for B in "$JSPROOT"/include/button/inc_*_button.jsp; do
  s=$(grep -nE "MENU_SCREEN_ID\.equals\(\"$SID\"\)" "$B" | cut -d: -f1 | head -1); [ -z "$s" ] && continue
  e=$(awk -v s="$s" 'NR>s && /^[[:space:]]*\}?[[:space:]]*else[[:space:]]*if[[:space:]]*\([[:space:]]*MENU_SCREEN_ID\.equals\(/ {print NR; exit}' "$B")
  [ -z "$e" ] && e=$(( $(wc -l < "$B") + 1 ))
  nested=$(awk -v s="$s" -v e="$e" 'NR>s && NR<e && /MENU_SCREEN_ID\.equals\(/ {c++} END{print c+0}' "$B")
  echo "  slice $(basename "$B"): ${s}..$((e-1)) ($((e-s))줄) 중첩equals=$nested"
  [ "$nested" -gt 0 ] && echo "  !! WARN: 중첩 분기 있음 — 슬라이스 범위를 육안 확정할 것"
  sed -n "${s},$((e-1))p" "$B" >> "$SP/slice.txt"
done
[ ! -s "$SP/slice.txt" ] && echo "!! WARN: 화면ID 분기 미발견 — 게이트2/3 무효(통과 아님). 수동 조사 필요"
{ find "$ROOT/KiiPS-UI/src/main/resources/static/js" -maxdepth 1 -name 'common*.js' ! -name '*.min.*' -print0 \
    | xargs -0 grep -hoE 'function[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*' | sed -E 's/.*function[[:space:]]+//'
  grep -hoE 'function[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*' "$JSPROOT/include/header.jsp" | sed -E 's/.*function[[:space:]]+//'
  printf '%s\n' if else for while do switch case try catch finally return function typeof instanceof delete in of let var const new throw class super this void await async yield \
    alert confirm eval parseInt parseFloat isNaN String Number Boolean Array Object JSON Math Date console RegExp Error Promise Map Set Symbol Function \
    document window setTimeout setInterval clearTimeout clearInterval encodeURIComponent decodeURIComponent encodeURI decodeURI jQuery require equals split
} | sort -u > "$SP/globals.txt"
# 2a — HTML 인라인 핸들러 축 (양따옴표·홑따옴표 모두, javascript: 접두 포함)
{ grep -ohE "\bon[A-Za-z]+=[\"'][[:space:]]*(return[[:space:]]+)?(javascript:)?[A-Za-z_\$][A-Za-z0-9_\$]*" "$SP/slice.txt" "$F" 2>/dev/null \
    | sed -E "s/.*[\"'][[:space:]]*(return[[:space:]]+)?(javascript:)?//"
  grep -ohE "href=[\"']javascript:[A-Za-z_\$][A-Za-z0-9_\$]*" "$SP/slice.txt" "$F" 2>/dev/null | sed -E 's/.*javascript://'
  grep -rhoE '\bMAIN_SEARCH_FILTER\b' "$JSPROOT/include/inc_filter_main.jsp" "$JSPROOT/include/inc_main_button.jsp"
} | grep -E '^[A-Za-z_$][A-Za-z0-9_$]*$' | sort -u | comm -23 - "$SP/globals.txt" > "$SP/calls.$SUF.txt"
echo "=== 2a 인라인 핸들러 끊긴 참조 (0건이어야 함) ==="
comm -23 "$SP/calls.$SUF.txt" "$SP/defs.$SUF.txt" | sed 's/^/  DANGLING-ATTR: /'
echo "  총 $(comm -23 "$SP/calls.$SUF.txt" "$SP/defs.$SUF.txt" | wc -l | tr -d ' ')건"
# 2b — JS 등록 핸들러 축
{ grep -ohE "\.on\([[:space:]]*[\"'][a-zA-Z.]+[\"'][[:space:]]*,[[:space:]]*[A-Za-z_\$][A-Za-z0-9_\$]*[[:space:]]*[,)]" "$F" | sed -E "s/.*,[[:space:]]*//;s/[[:space:]]*[,)]$//"
  grep -ohE "addEventListener\([[:space:]]*[\"'][a-z]+[\"'][[:space:]]*,[[:space:]]*[A-Za-z_\$][A-Za-z0-9_\$]*" "$F" | sed -E "s/.*,[[:space:]]*//"
  grep -ohE "\.on[A-Z][A-Za-z]+[[:space:]]*=[[:space:]]*[A-Za-z_\$][A-Za-z0-9_\$]*[[:space:]]*;" "$F" | sed -E "s/.*=[[:space:]]*//;s/;$//"
} | grep -E '^[A-Za-z_$][A-Za-z0-9_$]*$' | sort -u | comm -23 - "$SP/globals.txt" > "$SP/jscalls.$SUF.txt"
echo "=== 2b JS 등록 핸들러 끊긴 참조 (0건이어야 함) ==="
comm -23 "$SP/jscalls.$SUF.txt" "$SP/defs.$SUF.txt" | sed 's/^/  DANGLING-JSREG: /'
echo "  총 $(comm -23 "$SP/jscalls.$SUF.txt" "$SP/defs.$SUF.txt" | wc -l | tr -d ' ')건"
# 2c — JS 본문 호출 축 (절대 판정 금지. delta 블록 [D]에서만 판정)
grep -ohE '(^|[^A-Za-z0-9_.$])[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*\(' "$F" \
  | grep -oE '[A-Za-z_$][A-Za-z0-9_$]*' | sort -u | comm -23 - "$SP/globals.txt" > "$SP/inpage.$SUF.txt"
comm -23 "$SP/inpage.$SUF.txt" "$SP/defs.$SUF.txt" > "$SP/dangling-inpage.$SUF.txt"
echo "=== 2c in-page 미정의 호출 $(wc -l < "$SP/dangling-inpage.$SUF.txt" | tr -d ' ')건 (기준선 — 절대 판정 아님) ==="
```

```bash
# [3] 게이트3 고아 정의 — 신규분만 판정
«P»
SUF=before   # ← 편집 후에는 after
[ ! -s "$SP/slice.txt" ] && echo "!! WARN: slice 없음 — 아래 결과는 신뢰 불가"
: > "$SP/orphans.$SUF.txt"
while read -r f; do
  loc=$(grep -E "[^A-Za-z0-9_.\$]${f}[[:space:]]*\(" "$F" | grep -vcE "function[[:space:]]+${f}")
  x=$(grep -cE "[^A-Za-z0-9_.\$]${f}[[:space:]]*\(|\"${f}\"" "$SP/slice.txt")
  [ "$loc" -eq 0 ] && [ "$x" -eq 0 ] && echo "$f" >> "$SP/orphans.$SUF.txt"
done < "$SP/defs.$SUF.txt"; sort -u "$SP/orphans.$SUF.txt" -o "$SP/orphans.$SUF.txt"
echo "고아 정의 $(wc -l < "$SP/orphans.$SUF.txt" | tr -d ' ')건:"; sed 's/^/  ORPHAN-DEF: /' "$SP/orphans.$SUF.txt"
```

```bash
# [4] ★게이트4 data-gbn↔data-id 쌍 — clean 사본 기준, delta 판정
«P»
SUF=before   # ← 편집 후에는 after
C="$SP/clean.$SUF.jsp"
grep -oE '<[^>]*data-gbn="[^"]*"[^>]*>' "$C" | grep -vc 'data-id=' > "$SP/g4a.$SUF"
grep -oE '<[^>]*data-id="[^"]*"[^>]*>' "$C" | grep -vc 'data-gbn=' > "$SP/g4b.$SUF"
echo "data-gbn 있고 data-id 없음: $(cat "$SP/g4a.$SUF") / data-id 있고 data-gbn 없음: $(cat "$SP/g4b.$SUF")"
echo "※ 절대 0건이 기준이 아니다. 판정은 [D] delta(증가 0건). 통과시키려고 마크업 추가 금지."
```

```bash
# [5] ★게이트5 속성 값 집합 diff + 로컬 OVERRIDE 검출
«P»
SUF=before   # ← 편집 후에는 after
for a in data-id data-gbn name id data-pass data-desc data-max-options data-provider-id; do
  grep -oE "$a=\"[^\"]*\"" "$F" | sed 's/.*="//;s/"//' | sort > "$SP/$a.$SUF.txt"; done
grep -oE '<[^>]*type="hidden"[^>]*>' "$F" | grep -oE 'data-id="[^"]*"' | sed 's/.*="//;s/"//' | sort > "$SP/hidden.$SUF.txt"
grep -oE 'for="[^"]*"' "$F" | sed 's/.*="//;s/"//' | sort > "$SP/labelfor.$SUF.txt"
echo "=== OVERRIDE (동명 전역이 있으나 로컬 재정의 = 자동 safe 금지, 본문 diff 사람 대조 필수) ==="
comm -12 "$SP/defs.$SUF.txt" "$SP/globals.txt" | sed 's/^/  OVERRIDE: /'
[ "$SUF" = after ] && for a in data-id data-gbn name id data-pass data-desc data-max-options data-provider-id hidden labelfor; do
  if [ ! -f "$SP/$a.before.txt" ]; then echo "  FAIL: $a before 스냅샷 없음 — 이 게이트는 무효"; else
    echo "--- $a 소실분(공집합이어야 함): $(comm -23 "$SP/$a.before.txt" "$SP/$a.after.txt" | tr '\n' ' ')"; fi; done
```

```bash
# [6] ★게이트6 셀렉터 3분류 (page-owned / include-owned / TRUE-ORPHAN)
«P»
SUF=before   # ← 편집 후에는 after
C="$SP/clean.$SUF.jsp"
grep -ohE "\\\$\([\"']#[A-Za-z0-9_-]+|getElementById\([\"'][A-Za-z0-9_-]+" "$C" \
  | sed -E "s/.*[\"'#]//" | sort -u > "$SP/sel.$SUF.txt"
: > "$SP/orphansel.$SUF.txt"
while read -r s; do [ -z "$s" ] && continue
  if grep -qE "(^|[^-A-Za-z0-9_])id=[\"']$s[\"']" "$C"; then continue; fi
  own=$(find "$JSPROOT/include" -name '*.jsp' -print0 | xargs -0 grep -lE "(^|[^-A-Za-z0-9_])id=\"$s\"" 2>/dev/null | head -1)
  if [ -n "$own" ]; then echo "  INCLUDE-OWNED(제거 금지): \$('#$s') <- $(basename "$own")"
  else echo "$s" >> "$SP/orphansel.$SUF.txt"; echo "  TRUE-ORPHAN: \$('#$s')"; fi
done < "$SP/sel.$SUF.txt"
echo '--- 컨테이너 id 계약 (JS 인자 문자열과 HTML id 일치 육안 확인) ---'
grep -nE 'new RealGrid\.GridView\(|initDropzoneById\(|gatherComponent\(|setPaging\(' "$F"
grep -nE 'id="(TB_|paging|form|notie)[A-Za-z0-9_]*"' "$F"
```

**판정**: (1) `INCLUDE-OWNED` 는 **제거 금지**다 — 페이지에 `id`가 없어도 `inc_*_button.jsp`/`inc_filter_main.jsp` 가 런타임에 발행한다(PG0310 `#btn_setAdmin` ← `inc_pg_button.jsp:686`, `#FILTER_INPUT_TAG` ← `inc_filter_main.jsp` 실측). (2) `TRUE-ORPHAN` 은 **검출 = 조사 대상**이지 자동 safe가 아니다 — §7의 "0-매칭 셀렉터" 항목과 §4 진리표로 등급을 정한다. (3) 컨테이너 계약: `new RealGrid.GridView("X")`의 X가 `id="X"`로 존재해야 한다. 어긋나면 hard-break.

```bash
# [7] ★게이트7 화면ID 무결성 + jsp:param 구조 (불일치 = ScreenAuth NPE 500 / getParameter NPE 500)
«P»
SUF=before   # ← 편집 후에는 after
grep -nE 'MENU_SCREEN_ID|MAIN_SCREEN_ID|ScreenAuth\.get\(|out_gbn' "$F"
echo "=== 파일 내 화면ID 형태 리터럴 (양따옴표·홑따옴표 모두. \"$SID\" 단독이어야 함) ==="
grep -ohE "[\"'](PG|IL|FD|AC|SY|LP|EL|RT|CO|BT|HP|MN)[0-9]{4}[\"']" "$F" | tr -d "\"'" | sort -u | sed 's/^/  ID: /'
grep -coE "[\"']$SID[\"']" "$F" > "$SP/sidcnt.$SUF"
echo "  \"$SID\" 총 등장 $(cat "$SP/sidcnt.$SUF")건 (편집 후 감소하면 FAIL)"
echo "=== <jsp:param> 구조 (집합 소실 = hard-break) ==="
grep -ohE '<jsp:param[^>]*name="[^"]*"[^>]*value="[^"]*"' "$F" | sort -u | tee "$SP/jspparam.$SUF.txt" | sed 's/^/  /'
```

```bash
# [8] ★게이트8 <%= %> / ${EL} 심볼 해소 — 4변수 하드코딩이 아니라 파생 검사
«P»
# 8a — <%= %> 안의 스크립틀릿 변수 (미선언 = JSP 컴파일 500)
grep -oE '<%=[^%]*%>' "$F" | sed -E 's/^<%=[[:space:]]*//' \
  | grep -oE '^[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*[.(]?' | sed -E 's/[[:space:]]*$//' > "$SP/expr.raw"
grep -vE '[.(]$' "$SP/expr.raw" | sort -u > "$SP/expr.vars"     # 뒤에 . 또는 ( 오면 클래스·메서드 → 제외
while read -r v; do [ -z "$v" ] && continue
  grep -qE "(^|[^A-Za-z0-9_\$])$v[[:space:]]*=" "$F" && continue
  grep -qE "var=\"$v\"" "$F" && continue
  tr '\n' '\0' < "$SP/chain.txt" | xargs -0 grep -lE "(^|[^A-Za-z0-9_\$])$v[[:space:]]*=|var=\"$v\"" 2>/dev/null | head -1 | grep -q . \
    && { echo "  체인선언 OK: $v"; continue; }
  echo "  FAIL(hard-break) 미선언 스크립틀릿 변수: $v"
done < "$SP/expr.vars"
echo "  <%= %> 변수 $(wc -l < "$SP/expr.vars" | tr -d ' ')개 검사 / 클래스·메서드 형태 제외 $(grep -cE '[.(]$' "$SP/expr.raw")건"
# 8b — ${EL} 심볼 (미선언 = 조용한 빈 문자열 = URL 붕괴 404)
grep -oE '\$\{[A-Za-z_][A-Za-z0-9_]*\}' "$F" | tr -d '${}' | sort -u > "$SP/el.txt"
while read -r v; do [ -z "$v" ] && continue
  grep -qE "var=\"$v\"" "$F" && continue
  tr '\n' '\0' < "$SP/chain.txt" | xargs -0 grep -lE "var=\"$v\"" 2>/dev/null | head -1 | grep -q . && { echo "  체인선언 OK(EL): $v"; continue; }
  echo "  FAIL(hard-break) 미선언 EL: $v"
done < "$SP/el.txt"
echo "  EL 심볼 $(wc -l < "$SP/el.txt" | tr -d ' ')개 검사"
```

⚠️ **선언 공급원은 `$SP/chain.txt`(정적 `<%@ include %>` 체인)뿐이다.** `<jsp:include>` 는 별도 request dispatch라 page scope를 공유하지 않으므로 체인에서 제외돼 있다. `include/` 디렉토리 전체를 뒤지면 **실제로 include되지 않는 파일의 선언까지 "있음"으로 오판**한다.

```bash
# [9] ★게이트9 주석 내 JSP 표현식/디렉티브 + 이스케이프·표현식 집합 (원본 바이트 기준, clean 사본 금지)
«P»
SUF=before   # ← 편집 후에는 after
echo "=== // 또는 /* 뒤의 <%= / <%@ (주석이어도 서버 평가 → 컴파일 500). 0건이어야 함 ==="
grep -nE '(//|/\*).*<%[=@]' "$F"; echo "  검출 $(grep -cE '(//|/\*).*<%[=@]' "$F")건"
echo "=== /* 블록 주석 시작점 (종료까지 <%= 포함 여부 육안 확인) ==="; grep -nE '/\*' "$F" | head -20
grep -coF '\${' "$F" > "$SP/esc.$SUF"
grep -oE '<%=[^%]*%>' "$F" | sort -u > "$SP/expr.$SUF.txt"
echo "  \\\${ EL 이스케이프 $(cat "$SP/esc.$SUF")건 (감소하면 FAIL) / <%= 식 $(wc -l < "$SP/expr.$SUF.txt" | tr -d ' ')종"
```

```bash
# [10] ★게이트10 편집 후 바이트 무결성 (편집 후에만 실행)
«P»
file "$F"
head -1 "$F" | grep -q 'pageEncoding="UTF-8"' || echo '  FAIL: 1행 page 디렉티브 소실/변형'
head -c 3 "$F" | xxd | grep -q 'efbb bf' && echo '  FAIL: BOM 주입'
grep -ohE '\.[가-힣][가-힣_A-Za-z0-9]*' "$F" | sed 's/^\.//' | sort -u | while read -r k; do
  grep -q "$k" "$ROOT/KiiPS-UTILS/src/main/java/com/kiips/util/Constant.java" || echo "  FAIL: 한글 식별자 미해소 $k"; done
[ "$(grep -c $'\r' "$F")" -eq "$(grep -c $'\r' "$BACKUP")" ] || echo "  WARN: 줄바꿈(CRLF/LF) 변경 — SVN diff 전 줄 오염"
echo "  CR줄 $(grep -c $'\r' "$F") / 백업 $(grep -c $'\r' "$BACKUP")"
```

```bash
# [D] ★delta 판정 블록 — 편집 후 게이트 1~9를 SUF=after 로 돌린 다음 실행
«P»
# ★스냅샷 완전성 가드 — 하나라도 없거나 비면 delta 판정은 "통과"가 아니라 "무효"다.
# 이 가드가 없으면 `[ "" -gt "" ]` 가 'integer expression expected' 로 죽고 && 체인이
# 조용히 건너뛰어져, 해당 축이 FAIL 없이 사라진다(v1 ABORT-without-exit 와 같은 fail-open).
for f in g4a.before g4a.after g4b.before g4b.after sidcnt.before sidcnt.after esc.before esc.after; do
  [ -s "$SP/$f" ] || { echo "ABORT: $f 없음/빈 파일 — delta 판정 무효. 게이트 1~9를 before/after 각각 다시 실행"; exit 1; }
  grep -qE '^[0-9]+$' "$SP/$f" || { echo "ABORT: $f 가 숫자가 아님 — delta 판정 무효"; exit 1; }
done
# 목록 파일은 정상적으로 빈 파일일 수 있으므로 존재만 확인(-f)
for f in defs.before.txt defs.after.txt dangling-inpage.before.txt dangling-inpage.after.txt \
         orphans.before.txt orphans.after.txt orphansel.before.txt orphansel.after.txt \
         jspparam.before.txt jspparam.after.txt expr.before.txt expr.after.txt; do
  [ -f "$SP/$f" ] || { echo "ABORT: $f 없음 — 해당 게이트를 before/after 각각 실행"; exit 1; }
done
[ -f "$BACKUP" ] || { echo "ABORT: BACKUP 없음 — #2c 판정 불가"; exit 1; }
FAILN=0
del=$(comm -23 "$SP/defs.before.txt" "$SP/defs.after.txt")
[ -n "$del" ] && { echo "삭제된 함수: $(echo $del)"
  for f in $del; do n=$(( $(grep -cE "[^A-Za-z0-9_.\$]${f}[[:space:]]*\(" "$BACKUP") - $(grep -cE "function[[:space:]]+${f}[[:space:]]*\(" "$BACKUP") ))
    [ "$n" -gt 0 ] && { echo "  #2c FAIL(hard-break): $f — 편집 전 in-page 호출 ${n}건"; FAILN=1; }; done; }
nd=$(comm -13 "$SP/dangling-inpage.before.txt" "$SP/dangling-inpage.after.txt")
[ -n "$nd" ] && { echo "  #2c FAIL(hard-break) 신규 미정의 호출: $(echo $nd)"; FAILN=1; }
no=$(comm -13 "$SP/orphans.before.txt" "$SP/orphans.after.txt")
[ -n "$no" ] && echo "  #3 신규 고아 정의(silent-loss, 보고 필수): $(echo $no)"
[ "$(cat "$SP/g4a.after")" -gt "$(cat "$SP/g4a.before")" ] && { echo "  #4 FAIL gbn有id無 $(cat "$SP/g4a.before")→$(cat "$SP/g4a.after") 증가"; FAILN=1; }
[ "$(cat "$SP/g4b.after")" -gt "$(cat "$SP/g4b.before")" ] && { echo "  #4 FAIL id有gbn無 $(cat "$SP/g4b.before")→$(cat "$SP/g4b.after") 증가"; FAILN=1; }
ns=$(comm -13 "$SP/orphansel.before.txt" "$SP/orphansel.after.txt")
[ -n "$ns" ] && { echo "  #6 FAIL(hard-break) 신규 0-매칭 셀렉터: $(echo $ns)"; FAILN=1; }
extra=$(grep -ohE "[\"'](PG|IL|FD|AC|SY|LP|EL|RT|CO|BT|HP|MN)[0-9]{4}[\"']" "$F" | tr -d "\"'" | sort -u | grep -v "^$SID$")
[ -n "$extra" ] && { echo "  #7 FAIL(hard-break) 타 화면ID 혼입: $(echo $extra)"; FAILN=1; }
[ "$(cat "$SP/sidcnt.after")" -lt "$(cat "$SP/sidcnt.before")" ] && { echo "  #7 FAIL(hard-break) 화면ID 등장 $(cat "$SP/sidcnt.before")→$(cat "$SP/sidcnt.after") 감소"; FAILN=1; }
dp=$(comm -23 "$SP/jspparam.before.txt" "$SP/jspparam.after.txt")
[ -n "$dp" ] && { echo "  #7 FAIL(hard-break) <jsp:param> 소실: $dp"; FAILN=1; }
[ "$(cat "$SP/esc.after")" -lt "$(cat "$SP/esc.before")" ] && { echo "  #9 FAIL(hard-break) \\\${ 이스케이프 $(cat "$SP/esc.before")→$(cat "$SP/esc.after") 감소"; FAILN=1; }
de=$(comm -23 "$SP/expr.before.txt" "$SP/expr.after.txt")
[ -n "$de" ] && { echo "  #9 FAIL(hard-break) <%= %> 식 소실: $de"; FAILN=1; }
echo ">>> delta 판정: $([ $FAILN -eq 0 ] && echo '이상 없음' || echo 'FAIL 검출 — §3[8] 즉시 복원')"
```

## 6. 보존 화이트리스트 (hard-break — 제거 금지)

| # | 대상 | 파손 시 증상 | 근거 |
|---|---|---|---|
| 1 | 화면ID 분기가 호출하는 페이지 로컬 함수 | 클릭 시 ReferenceError | `inc_pg_button.jsp:2142-2151` |
| 2 | **파일 내 화면ID 리터럴 전량** (큰따옴표 4곳 + 홑따옴표 `out_gbn` 등 포함) | ScreenAuth NPE 500 / 결재 라우팅 오류 | `inc_main_button.jsp:17`, `PG0443.jsp:656,799` |
| 3 | **페이지가 선언하고 페이지 안 `<%= %>` 가 소비하는 모든 스크립틀릿 변수** (`SCREEN_DATA`/`SCREEN_NM`/`SCREEN_SHORT_CUT`/`SCREEN_NM_LINE`/`SEARCH_CONDITION`/…) | JSP 컴파일 500 | `inc_page_header.jsp:11,21-22`, `PG0443.jsp:12-18,36` |
| 4 | `data-gbn` + `data-id` **쌍** | 빈 데이터 저장(무증상) | `common.js:726,858,569-573` |
| 5 | `type="hidden"` + `data-id` | 수정이 신규 INSERT로 변질 | `PG0445.jsp:65-69,126` |
| 6 | select/radio의 `name` (radio는 값까지 `data-id`와 동일) | 이전 값 잔존 → 데이터 오염 | `common.js:707,772` |
| 7 | 그리드/첨부/폼 컨테이너 id | GridView throw → 화면 백지 | `common.js:257`, `inc_files.jsp:154-155` |
| 8 | 그리드 이벤트 핸들러 + 진입점 | 정의는 살고 기능만 사망 | `getDetailData` 실측 |
| 9 | `data-pass`/`data-desc`/`data-max-options` | 제거 방향이 역전됨 | `common.js:733,760,861` |
| 10 | `data-gbn="table"`의 `data-provider-id`, `createMainGrid`/`setPaging` | TypeError / 엑셀 빈 결과 | `common.js:775-776`, `common_grid.js:1630` |
| 11 | **`<jsp:param>` 전량** — include 체인이 `request.getParameter(X)` 를 null 체크 없이 역참조 | NPE 500 | `inc_main_button.jsp:17`, `sidemenu.jsp:14`, `inc_filter_main.jsp:7,10` |
| 12 | **백틱 템플릿 리터럴 안의 `\${` 이스케이프** | EL 구문 오류 → 번역 단계 500 | `PG0443.jsp:645,773,917` |
| 13 | **JS 문자열 안의 `<%=Constant.*%>` 스크립틀릿** | 컴파일 500 | `PG0443.jsp:652,795` |
| 14 | **1행 `<%@ page … pageEncoding="UTF-8" %>`** — 정적 include는 이 속성을 상위로 공급하지 않는다 | 한글 식별자(`Constant.검색조건_일자_TYPE2`) 미해소 → 컴파일 500 | `Constant.java:234`, 프로젝트에 `web.xml` 0건 |
| 15 | **include가 발행하는 id를 겨냥한 셀렉터**(게이트 #6 `INCLUDE-OWNED`) | 버튼 무반응 껍데기 (에러 0건) | `inc_pg_button.jsp:686` `#btn_setAdmin` |
| 16 | **`data-id` 마크업을 2개 이상 겨냥하는 언스코프 셀렉터**(브로드캐스트) | 형제 모달 셀렉트 영구 공백 → required 로 저장 불가 | `PG0310.jsp:614,625,631` vs `:172,256` |

각 항목의 전체 기전과 파일:줄 근거는 [reference.md](reference.md) 참조.

**#2 화면ID가 특히 위험한 이유**: `ScreenAuth.get(MENU_SCREEN_ID).split("\\|")[0]`이 null 체크 없이 split한다 — 값 오타·누락 **모두** 500이다. 오타가 **다른 실존 화면ID**면 더 나쁘다: 엉뚱한 버튼 분기가 렌더되어 이 페이지가 정의한 적 없는 함수를 onclick으로 호출한다. v1 게이트 #7은 `grep -oE "\"$SID\"" | sort -u | wc -l` 이라 **1건이라도 있으면 항상 1을 반환하는 항등식**이었고, `"PG0443"`→`"PG0444"` 변조를 그대로 통과시켰다(§0.1 mutB2). v2는 **파일 내 모든 화면ID 형태 리터럴의 집합**과 **총 등장수 비감소**를 본다.

**#9가 반직관적인 이유**: `data-pass` 제거는 필드를 payload에서 빼는 게 아니라 **추가**한다. `data-max-options="1"` 제거는 반환값이 스칼라→배열로 **shape**이 바뀐다. "여분 속성 = 삭제 가능" 휴리스틱을 정면으로 반증하는 그룹이다.

**#12·#13이 반직관적인 이유**: `\${...}` 의 백슬래시는 "템플릿 리터럴의 불필요한 이스케이프"가 아니라 **JSP EL 리터럴 이스케이프**다. 지우면 JSP 엔진이 `${[...names].join(', ')}` 를 EL로 파싱해 500. `od -c` 로 바이트를 확인할 것.

## 7. 제거 가능 목록

### safe (증거 첨부 시 제거 가능)

| 대상 | 사전조건 (**전부 실측 명령으로 증명**) |
|---|---|
| `SCREEN_AUTH` 스크립틀릿 선언 | 게이트 #8에서 소비처 0건 (`SCREEN_AUTH_MAP`은 별개 심볼 — grep에서 배제) |
| header.jsp 중복 `<spring:eval var="X">` 선언 | ① `tr '\n' '\0' < "$SP/chain.txt" \| xargs -0 grep -l 'var="X"'` 가 **페이지 외 1건 이상** ② 게이트 #8b 가 편집 후에도 FAIL 0건. **"KiiPS_* 는 다 중복" 같은 일괄 판단 금지** — `header.jsp` 가 선언하는 것은 `KiiPS_GRID`/`KiiPS_GATE`/`KiiPS_LOGIN`/`KiiPS_COMMON` 4개뿐이고 `KiiPS_PG` 는 **`inc_page_header.jsp:2`** 가 공급한다(§10 실측). 이름마다 개별 grep |
| 필터 셀렉트 중복 채움 코드 | ① `grep -c 'data-id="X"' "$F"` 가 **0** 이어야 한다 — 1건 이상이면 페이지 자신의 마크업을 채우는 **라이브 코드**다 ② 필터 소유는 `MAIN_SEARCH_<대문자ID>` 형태로만 성립한다(`MainComponent.java:225` `getTag()` 가 `"MAIN_SEARCH_"+id.toUpperCase()` 강제) → **접두어 없는 `data-id` 는 절대 필터 소유가 아니다** ③ 함수명(`ScriptFuncName`) 일치만으로 중복 판정 금지 — 인자·대상 `data-id` 가 다르면 별개 코드다 |
| 게이트 #6이 `TRUE-ORPHAN` 으로 분류한 `$('#X')` 블록 | ① `INCLUDE-OWNED` 가 아님이 출력으로 확인됨 ② §4 진리표에서 safe 칸 ③ **"의도된 기능"이면 삭제가 아니라 보고**(아래 주의) |
| 폼 필드의 빈 `id=""` | 그 요소를 겨냥하는 `$('#X')` 없음 확인 |
| typeof 가드 뒤 `fileSearchCallBack` | `inc_files.jsp:1306,1397` 가드 확인 |
| 주석 처리된 미구현 TODO 블록 | 게이트 #9 가 0건 + 블록 안에 `<%= %>`/`<%@ %>` 없음. **비활성화는 `//`·`/* */` 가 아니라 `<%-- --%>` 또는 boolean 가드로만 한다** — JS 주석 안이어도 `<%= %>` 는 서버에서 평가돼 컴파일 500이다 |
| 미사용 지역 변수 | 파일 내 참조 0건 |

⚠️ **"중복 전역 재선언"은 자동 safe가 아니다.** 게이트 #5가 `OVERRIDE:` 로 보고한 함수(동명 전역이 `common*.js`/`header.jsp` 에 있는 로컬 정의)는 **본문이 다르면 오버라이드**다. PG0443의 `ExcelExportAllCustom`/`ExcelExportOriginCustom`(실측 OVERRIDE 2건)은 `screenGrid` 레지스트리의 `'TB_PG0443RGST_edit'` 키를 따로 처리해 등록 편집그리드를 엑셀에 포함시킨다(`PG0443.jsp:713-727`). 지우면 에러 없이 등록그리드가 빠진 엑셀이 내려간다. **전역 구현과 본문을 사람이 diff 하기 전까지 제거 금지.**

⚠️ **`id=""`를 "채워 넣는" 리팩토링은 금지.** bootstrap-select가 select의 **id**를 버튼에 `data-id`로 복사하므로(`bootstrap-select.js:905,934-935`) `id == data-id`가 되면 `$('[data-id=X]')`가 select+button 2매칭이 되어 새 버그를 만든다.

⚠️ **스코프 셀렉터(`$('#모달ID [data-id=X]')`)로의 "통일"은 무조건 규칙이 아니다.** 스코프화는 select와 bootstrap-select 버튼이 **동시 매칭될 때만** 쓰는 해소책이다. 좁히기 전에 반드시 `grep -c 'data-id="X"' "$F"` 로 마크업 대상 수를 세고, **2건 이상이면 브로드캐스트 계약이므로 언스코프를 유지한다**(PG0310 `DEPT_CD`/`CMBT_CUST_NO`/`CERS_MNG_TPCD` 가 POP2·POP3 두 모달에 동시 배포 — `:614,625,631` 언스코프 채움 → `:632` 스코프 덮어쓰기 순서가 계약이다).

⚠️ **0-매칭 셀렉터가 "의도된 기능"이면 재작성이 기술적 정답이지만, 재작성은 축소 작업의 범위 밖이다.**
PG0445의 `setEditableAndDisabled`(결재 완료건 편집 잠금)가 그 예 — `$('#APLY_DT')`가 0-매칭이라 **원본에서부터 동작한 적이 없다**. 기술적으로는 `$('#registModal [data-id=APLY_DT]')`가 옳다. 그러나 사용자는 **코드 축소**를 요청했지 동작 변경을 요청하지 않았다.
`.claude/rules/anti-rationalization.md` — "발견한 것은 보고하세요. 승인 없이 확장하지 마세요 / 'Bonus fix' 금지" —
→ **§8 보고 템플릿 4번 항목에 "재작성 제안"으로 기록만 하고, 별도 승인 후 별도 작업으로 수정한다.** 축소 커밋에 섞지 않는다.
그리고 "원본에 있었으니 보존"은 보존 근거가 될 수 없다는 사실을 함께 보고한다.

### silent-loss (제거 허용, 보고 필수)

| 대상 | 사용자에게 보이는 증상 |
|---|---|
| 빈 `label for=""` / 존재하지 않는 id를 가리키는 `for` | 스크린리더 label-input 연결 상실 (렌더 검증으로 안 잡힘). **게이트 #5 `labelfor`/`id` 축이 소실을 검출** |
| typeof 가드 뒤 `arrpovalReportcallBack` | 결재 팝업 종료 후 목록 자동 갱신 안 됨 (에러는 없음) |
| 고아 정의 함수 (게이트 #3 **신규분**) | 이미 도달 불가 — 동작 변화 없음 |
| `${EL}` 미선언으로의 전락 | URL이 host-relative 로 붕괴 → 404. `requestToken` errorCallback 이 무응답을 미포착하므로 **사용자에게 표면화조차 되지 않는다** |

⚠️ 고아 정의는 **"왜 진입점이 사라졌는가"를 먼저 보고**한다. `getDetailData`처럼 핸들러가 잘못 삭제된 결과일 수 있고, 그 경우 정답은 함수 제거가 아니라 **핸들러 복원**이다.

⚠️ a11y 속성을 "장식"으로 분류하지 않는다. 표준 셀렉터가 data-id 기반이라 id 부여로 해결할 수 없으므로, `aria-label` 또는 label 중첩(wrapping)으로 대체를 검토한다.

## 8. 완료 보고 템플릿

아래 5개 항목은 **전부 필수**다. 하나라도 비면 완료가 아니다.

```markdown
## JSP 축소 완료 보고 — {화면ID}

### 1. 게이트 결과 (정적 대조 결과 — 증명 아님)
대상 무오염 증거: 모든 게이트 출력 첫 줄 `[GATE @ {화면ID}] {절대경로}` 를 함께 붙인다.

| 게이트 | 기준 | 결과 |
|---|---|---|
| #2a 인라인 핸들러 끊긴 참조 | 0건 | {N}건 |
| #2b JS 등록 핸들러 끊긴 참조 | 0건 | {N}건 |
| #2c 삭제 함수 / 신규 미정의 호출 | delta 0건 | {목록 또는 없음} |
| #3 고아 정의 | 신규 0건 | {목록 또는 없음} |
| #4 gbn↔id 쌍 | before 대비 증가 0 | {before}/{after} |
| #5 값 집합 소실 + OVERRIDE | 공집합 / OVERRIDE 대조 완료 | {축별 결과} |
| #6 셀렉터 3분류 | 신규 TRUE-ORPHAN 0건 | {N}건, INCLUDE-OWNED {목록} |
| #7 화면ID + jsp:param | 혼입 0 / 등장수 비감소 / param 공집합 | {결과} |
| #8a `<%= %>` 변수 / #8b `${EL}` | 미선언 0건 | {결과} |
| #9 주석 내 `<%=` / `\${` / `<%= %>` 집합 | 0건 / 비감소 / 공집합 | {결과} |
| #10 바이트 무결성 | 전 항목 OK | {결과} |
| [D] delta 판정 | 이상 없음 | {출력} |

<실제 명령 + 실제 출력 붙여넣기>

### 2. 제거 내역 (등급별)
- safe: {항목 + 파일:줄 근거 + §7 사전조건 실측 명령·출력}
- silent-loss: {항목}

### 3. ★silent-loss 상세 (한 건도 빠짐없이)
| 사라진 것 | 사용자에게 보이는 모습 | 되살리려면 |
|---|---|---|

### 4. 보고만 하고 수정하지 않은 발견 사항
{범위 밖 결함 — "bonus fix" 금지. 0-매칭 셀렉터 재작성 제안도 여기에만 적는다}

### 5. ★검증 한계 (필수 고정 문구)
- **정적 대조만 수행했고 런타임 실측은 하지 않았다. 게이트 통과는 hard-break 부재의 증명이 아니라,
  §4 표에 열거된 축에서 미검출이라는 뜻이다.**
- 여전히 사각지대: 동적 조립 onclick(문자열 연결·eval), switch·맵 조회로 분기하는 include,
  allowlist 동명이인, JSP 컴파일·브라우저 렌더.
- 백엔드 API 부재 화면은 저장·삭제·결재 경로를 브라우저로 확인할 수 없다.
- 실행 검증을 한다면 **AUTH=A 계정이 필수**다. 저권한 계정의 클릭 테스트는
  조건부 렌더 블록(`inc_pg_button.jsp:2138,2148`) 안의 파손을 전부 통과시킨다.
- 백업 경로: {BACKUP 절대경로}
```

**왜 §5가 고정 문구인가**: 이 프로젝트의 `.claude/rules/verification.md`는 실행 증거 없는 완료 선언을 금지한다. 그러나 축소 대상 화면의 백엔드가 없으면(PG0445 실측: `KiiPS-PG`에 관련 Controller/Dao/VO 0건 → `PGAPI/PG0445/*` 전부 404) 런타임 검증은 **원천 불가능**하다. 완료 기준을 실행 증거로 잡으면 영원히 충족 불가 상태가 되므로, 정적 계약 검사로 게이트를 구성하고 **그 한계를 명시적으로 선언**해 규칙과의 긴장을 해소한다. 이 문구를 지우고 "검증 완료"라고 쓰는 것이 정확히 금지 대상이다.

## 9. 적대검증 지적 → 반영 위치 대조표 (2026-08-06, 28건)

| 지적 | 등급 | 반영 위치 |
|---|---|---|
| 1 JS→JS 호출 미수집 | hard-break | §3[3] 3축 표, §5[2] 2c, §5[D] |
| 2 EL 선언↔사용 대조 게이트 부재 | silent-loss | §5[8] 8b, §7 safe 행 (사실 일부 정정 → §10) |
| 3 `\${` 이스케이프 훼손 | hard-break | §5[9], §5[D], §6 #12·#13 |
| 4 게이트6 부분문자열·홑따옴표 한정 | silent-loss | §5[6] 앞자리 경계 + 양따옴표, reference §2.4 정정 |
| 5 로컬 OVERRIDE 오판 | silent-loss | §5[5] OVERRIDE, §7 경고 |
| 6 게이트7 항등식 | hard-break | §5[7], §5[D], §6 #2 |
| 7 ABORT fail-open | silent-loss | §2 `exit 1` + `F` 가드 + `hash.before` 가드 |
| 8 env 파일 전역 경로 오염 | hard-break | §2 `$SP/env.sh` + basename 자가검증 + 병렬 금지 |
| 9 필터 채움 코드 일반화 오류 | silent-loss | §7 safe 행 사전조건 3개 (`MAIN_SEARCH_` 규칙) |
| 10 게이트2를 콜그래프 증명으로 광고 | hard-break | §3[3] 표, §4 하단, §8 제목 "증명 아님" |
| 11 게이트4 절대 0건 기준 | silent-loss | §3[2] 경고, §5[4] delta, `clean.jsp` |
| 12 include 소유 id 오탐 | silent-loss | §5[6] 3분류, §6 #15, §3[8] 주석 함정 |
| 13 스코프화 무조건 지침 | silent-loss | §7 브로드캐스트 경고, §4 질문 e, §5[5] `id` 축 |
| 14 `<jsp:param>` 삭제 | hard-break | §5[7] param 집합, §5[D], §6 #11 |
| 15 `MAIN_SEARCH_CONDITION` NPE | hard-break | §6 #11, reference §3.1 행, §3.2 범위 제한 |
| 16 게이트8 4변수 하드코딩 | hard-break | §5[8] 8a 파생 검사, §6 #3 |
| 17 인코딩·1행 디렉티브 | hard-break | §5[10] 게이트10 신설, §6 #14 |
| 18 게이트9 정규식 3중 협소 | hard-break | §5[9] `^` 제거 + `/*` + `<%@` |
| 19 병렬 실행 env 충돌 | hard-break | §2 (지적 8과 동일 수정) |
| 20 슬라이스 종료 경계 | hard-break | §5[2] 최상위 else-if + 중첩 WARN, §4 하단 |
| 21 게이트6 오탐/미탐 | hard-break | §5[6] (지적 4·12와 동일 수정) |
| 22 SID 오타 fail-open | hard-break | §2 (지적 7과 동일 수정) |
| 23 게이트7 4곳 주장 불일치 | hard-break | §5[7], §6 #2 "리터럴 전량" |
| 24 홑따옴표 핸들러·JS 등록 미수집 | hard-break | §5[2] 2a 양따옴표 + 2b |
| 25 판정 매핑표 부재 | silent-loss | §4 등급 결정표 + "판정 불가" 기본값 |
| 26 before 기준선 소실 | silent-loss | §5 전 게이트 `$SUF` 네임스페이싱, §2 타임스탬프 백업 |
| 27 트리거 미등록·충돌 | silent-loss | `.claude/skill-rules.json` 등록, description NOT-for |
| 28 재작성 지시 vs bonus-fix 금지 자가모순 | silent-loss | §7 "보고만", §8 제목·§5 문구 강등 |

## 10. 검토했으나 미반영 / 사실 정정

### 10.1 지적 2 — `KiiPS_PG` 삭제가 hard-break 이라는 **사실 주장은 반증됨** (게이트는 반영)

지적 2는 "`header.jsp` 가 `KiiPS_PG` 를 선언하지 않으므로(`grep -c 'KiiPS_PG' header.jsp = 0`) `PG0443.jsp:8` 삭제 시 `${KiiPS_PG}` 가 빈 문자열이 되어 API URL 11곳이 404" 라고 했다.
`header.jsp` 에 없다는 부분은 맞지만, **`KiiPS_PG` 는 `inc_page_header.jsp:2` 가 선언**하고 `PG0443.jsp:24` 가 그것을 `<%@ include %>`(정적, page scope 공유)로 포함한다. 실행 순서도 안전하다 — include 지점 24행 < 최초 사용 221행.

실측:
```
$ grep -n 'include\|spring:eval' PG/PG0443.jsp | head
2:<%@ include file="../include/header.jsp" %>
8:<spring:eval expression="@environment.getProperty('KiiPS.PG.URL')" var="KiiPS_PG"/>
24:    <%@ include file="../include/inc_page_header.jsp"%>
$ grep -n 'KiiPS_PG' include/inc_page_header.jsp
2:<spring:eval expression="@environment.getProperty('KiiPS.PG.URL')" var="KiiPS_PG" />
$ grep -on 'KiiPS_PG' PG/PG0443.jsp | head -1
221:KiiPS_PG
```
delta 실측에서도 mutG(8행 삭제본)는 게이트 #8b 를 **정당하게** 통과했다(§0.1 표).

**따라서 반영 방식**: "삭제하면 500/404" 라는 결론은 채택하지 않고, **선언 공급원을 정적 include 체인으로 실제 해석해 대조하는 게이트 #8b** 를 채택했다. 이것이 지적의 실질(“대조 게이트가 아예 없다”)을 해결하면서 오탐을 만들지 않는 형태다. §7 safe 표에는 "이름마다 개별 grep, 일괄 판단 금지"를 명시했다.

### 10.2 지적 11 — PG0310 게이트4 수치는 `3 / 3` 이 아니라 `2 / 2`

지적 11은 `gbn有id無 = 3`(그중 `PG0310.jsp:60` 은 JSP 주석 내부), `id有gbn無 = 3`(그중 `:126` 은 주석 내부)이라고 했다.
v2가 도입한 `<%-- --%>` 제거 사본(`clean.jsp`) 기준 실측은 **`2 / 2`** 다 — 주석 안의 2건이 정확히 걸러졌다. 즉 지적이 요구한 전처리가 실제로 효과를 냈고, 수치는 그만큼 달라진다. 결론(절대 0건 기준은 틀렸다 → delta 로 바꿔야 한다)은 그대로 채택했다.

### 10.3 지적 9 — "PG0310 필터에 `APLY_EMP_CUST_NO` 없음"은 게이트로 자동 판정하지 않는다

`MainComponent.java:225` 의 `MAIN_SEARCH_` 접두 규칙은 사실이나, 이를 게이트로 자동화하면 "접두어 없는 `data-id` 채움 코드는 전부 라이브"라는 과잉 보존이 되어 축소가 성립하지 않는다.
**§7 safe 표의 사전조건(측정 2단계)으로만 반영**했다 — `grep -c 'data-id="X"' "$F"` 가 1 이상이면 라이브. 게이트로 승격하지 않은 이유는 이 값이 화면마다 정상적으로 0도 되고 2도 되기 때문에 절대 기준을 세울 수 없어서다(지적 11과 같은 구조의 함정).

### 10.4 지적 26 중 "`svn revert` 대안 경로" — 조건부 반영

§3[1]·§3[8] 에 `svn diff`/`svn revert` 를 병기했으나 **기본 롤백 경로는 파일 백업**이다.
이유: 이 저장소 루트에서 `svn status` 는 `W155007: '…/KiiPS' is not a working copy` 를 반환한다(2026-08-06 실측). SVN 작업 사본은 사용자 IDE 쪽에만 존재할 수 있으므로, 스킬의 기본 경로가 SVN에 의존하면 그대로 실패한다. 그리고 `svn revert` 는 `.claude/rules/ralph-loop-detection.md` 상 **사용자 승인 필수**다.
