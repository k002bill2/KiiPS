---
name: kiips-credit-report-page
description: "여신전문금융업무보고서(MI10 계열, AC285/286/287/361/362/410/411/412 금감원 서식) 화면을 새로 만들 때 쓰는 도메인 스킬. **신용조회(credit bureau) 보고서가 아니라 여신전문금융업 감독 업무보고서입니다.** 고정 서식 표(HTML table + 병합 라벨) · 단위 전환 · 검증열 대사 · 드릴다운 모달 · 샘플 데이터 블록 패턴을 MI1010 레퍼런스 구현체에서 이식한다. Use when: 여신전문금융, 업무보고서, 금감원 보고서, 보고서 서식, AC285, AC286, AC287, AC361, AC362, AC410, AC411, AC412, MI1010, MI10 화면, 고정 서식 표, 검증열, 검증열 대사, 단위 전환, 백만원 환산, 드릴다운 명세. NOT for: 일반 JSP 페이지 표준 구조·include 체계(use kiips-page-pattern-guide), 페이지 자동 생성 파이프라인(use kiips-page-harness), RealGrid 컬럼·에디터·Excel 일반 설정(use kiips-realgrid-guide), 기존 화면 스크립트 축소·정리(use kiips-jsp-minimizer), 검색필터 빌더 문법(use kiips-search-filter-guide), 툴바 버튼 일반 규칙(use kiips-button-guide)"
---

# KiiPS Credit Report Page Guide

여신전문금융업무보고서(MI10 계열) 하위 화면의 표준 구현 패턴입니다. 금감원 제출 서식을 그대로 화면에 옮기는 계열이라, 일반 CRUD 목록 화면과는 구조가 다릅니다.

레퍼런스 구현체는 `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/MI/MI1010.jsp` 입니다. 이 스킬의 모든 패턴은 그 파일에서 추출했습니다.

## Purpose

### What This Skill Does
- **서식 화면 신규 생성 절차**: 파일 4종(UI 필수) + 5종(백엔드) 체크리스트
- **고정 서식 표**: `G_ROWS` 선언적 행 정의 + rowspan/colspan 병합 행렬 + 소계/합계 음영
- **단위 전환**: 재조회 없는 백만원/원 토글, 건수 행 환산 제외 계약
- **검증열 대사**: `E' = A+B-C+F` 와 원장 집계 `E` 의 대사, CSS 클래스 토글 노출
- **드릴다운 모달**: 셀 클릭 → 명세 종류 판정 → RealGrid 컬럼 재생성 → footer 대사
- **샘플 데이터 블록**: `USE_SAMPLE` 경계 규약과 백엔드 연동 시 제거 절차

### What This Skill Does NOT Do
- 페이지 include 골격·검색필터 빌더 문법 자체 (kiips-page-pattern-guide / kiips-search-filter-guide 참조)
- RealGrid 일반 API·에디터·성능 최적화 (kiips-realgrid-guide 참조)
- 백엔드 SY 모듈 Controller/Service/Dao 구현 (본 스킬은 **무엇을 만들어야 하는지 목록만** 제시)
- 메뉴 DB 등록 (코드로 불가 — 운영 작업)

### Related Skills
| Skill | 연동 포인트 |
|-------|------------|
| `kiips-page-pattern-guide` | include 골격·`MAIN_SEARCH_FILTER` 데이터 흐름 (본 가이드 Part 1 이 전제로 삼음) |
| `kiips-search-filter-guide` | `SEARCH_CONDITION` 빌더 — 이 계열은 기준분기 단일 조건 |
| `kiips-button-guide` | `inc_main_button.jsp` 라우팅 — 이 계열은 `inc_mi_button.jsp` 분기 (본 가이드 Part 2) |
| `kiips-realgrid-guide` | 드릴다운 모달 그리드 (본 가이드 Part 8 은 이 계열 특수 처리만 다룸) |
| `kiips-a11y-guide` | 검증 토글 버튼 `aria-pressed`, 아이콘 전용 버튼 `aria-label` |
| `kiips-jsp-minimizer` | 백엔드 연동 후 샘플 블록 제거 시 (본 가이드 Part 9) |

## When to Use

### User Prompt Keywords
```
"여신전문금융", "업무보고서", "금감원 보고서", "보고서 서식",
"AC285", "AC286", "AC287", "AC361", "AC362", "AC410", "AC411", "AC412",
"MI1010", "MI10 화면", "고정 서식 표",
"검증열", "검증열 대사", "단위 전환", "백만원 환산", "드릴다운 명세"
```

> ⚠️ **현재 이 스킬은 저장소 루트 `skill-rules.json` 에 등록돼 있지 않습니다** (키 부재 — 실측 확인).
> 발동 채널은 두 개인데 지금은 하나만 삽니다:
> - **채널① 네이티브 Skill 목록** — 위 `description` 만으로 동작합니다. **현재 유일하게 살아 있는 경로.**
> - **채널② 훅 주입**(`.claude/hooks/userPromptSubmit.js`) — `skill-rules.json` 의 `promptTriggers` 가 결정합니다. **등록 전까지 영구히 0건입니다.**
>
> 등록하면 위 키워드 목록을 `promptTriggers.keywords` 와 **동일하게 유지**하십시오(두 채널이 갈라지면 드리프트). 등록 없이 description 만 고치는 것은 채널①에만 영향을 줍니다.
>
> ⚠️ 채널②에는 키워드보다 앞선 **복잡도 게이트**가 있습니다. `classifyPromptComplexity` 는 공백 기준 **3단어 이하**이면서 `KiiPS|빌드|배포|기능|아키텍처|설계|리팩토링|테스트|분석` 등이 없는 프롬프트를 `TRIVIAL` 로 분류하고, 그 경우 **주입 없이 원본을 반환**합니다. 즉 `여신전문금융업무보고서 화면 만들어줘` · `AC286 화면 만들어줘` · `MI1010 만들어줘` 같은 짧은 대표 프롬프트는 등록 후에도 채널②에 도달하지 못합니다(채널①만 동작). 5단어 이상이면 정상입니다.

### File Patterns
```
새 파일: KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/MI/MI10{xx}.jsp
수정 파일: KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/button/inc_mi_button.jsp
          KiiPS-UI/src/main/java/com/kiips/ui/controller/MIUIController.java
내용: "fnRenderTable", "G_ROWS", "UNIT_SEL", "SYAPI/MI10"
```

> `fnRenderTable` · `G_ROWS` 는 JSP 트리 전체에서 **MI1010.jsp 1파일에만** 존재하는 고유 식별자입니다. `dataTable_body`(11파일) · `UNIT_SEL`(9파일, FD0109 포함)은 MI 고유가 아니므로 식별에 쓰지 마십시오.

---

# ⛔ 시작 전 필수 경고 — JSP 1개만 만들면 화면은 500 이다

**"파일 정상 ≠ 화면 동작"** 입니다. 이 계열 화면은 JSP 파일 하나로 절대 뜨지 않습니다.

메뉴 DB 미등록 상태로 접속하면 **NullPointerException → 500** 이 나며, null 체크가 없는 지점이 **두 곳**입니다:

1. 페이지 JSP 상단 — `ScreenAuth.get("MI10xx").split("\\|")`
   `ScreenAuth` 는 클래스가 아니라 `header.jsp` 가 static include 로 스코프에 넣어 준 `Map<String,String>` 입니다. 미등록 화면 ID 는 `null` 을 반환하고 `.split()` 에서 터집니다.
2. `include/inc_main_button.jsp` — 같은 맵을 **독립적으로 다시 조회**해 `.split("\\|")[0]` 합니다.
   페이지 JSP 에서 `ScreenAuth` 를 안 쓰더라도 툴바를 include 하는 순간 여기서 터집니다.
3. **등록은 됐지만 `|` 구분 필드가 4개 미만** — 페이지 JSP 는 `SCREEN_DATA[3]`(단축번호)까지 읽으므로 `ArrayIndexOutOfBoundsException` 이 납니다. **NPE 와 증상·스택트레이스가 달라 오진하기 쉽습니다.**

그리고 `inc_mi_button.jsp` 의 if/else-if 체인에는 **종단 `else` 가 없습니다.** 화면 ID 분기를 추가하지 않으면 에러 없이 **툴바가 통째로 비어 렌더**됩니다(조회·생성·엑셀·도움말 전부 사라짐). "화면은 떴는데 버튼이 없다"는 증상은 거의 항상 이것입니다.

---

# Part 1: 신규 화면 생성 체크리스트

## 1.1 UI 필수 4종 — 없으면 화면이 안 뜬다

| # | 대상 | 내용 | 빌드 |
|---|------|------|------|
| 1 | `KiiPS-UI/.../jsp/kiips/MI/MI10xx.jsp` | 페이지 본체 (Part 3~9) | 불필요 (로컬 라이브 반영) |
| 2 | `KiiPS-UI/.../include/button/inc_mi_button.jsp` | 화면 ID **전용 분기** 신설 (Part 2) | 불필요 |
| 3 | `KiiPS-UI/src/main/java/com/kiips/ui/controller/MIUIController.java` | `@RequestMapping` 메서드 1개 수동 추가 | **필요** |
| 4 | 메뉴 DB 등록 | 화면 ID + `\|` 구분 **4필드 이상**(권한 / 화면명 / breadcrumb 원본 / 단축번호). 실제 필드 배치는 login 모듈 `getMenuAuth()` 산출물이라 JSP 만 봐서는 알 수 없으므로, **운영자에게 기존 MI1001 행을 그대로 복제해 달라고 요청**하십시오 | 코드로 불가 |

`MIUIController` 는 `@RequestMapping("/MI/*")` 클래스에 **화면 1개당 메서드 1개**를 수동으로 다는 방식입니다. 컨벤션 기반 자동 매핑이 전혀 없으므로 JSP 만 추가하면 URL 이 없어 404 입니다.

```java
//투자 및 융자 현황(AC285)
@RequestMapping(value="/MI1010", method={RequestMethod.GET,RequestMethod.POST})
public String MI1010() { return "kiips/MI/MI1010"; }
```

> Java 파일이므로 빌드가 필요합니다. JSP 는 로컬 실행 중 라이브 반영되지만 컨트롤러는 아닙니다.
> 빌드는 **사용자가 명시적으로 요청할 때만** 하십시오 (자동 `mvn` 빌드/clean 금지).

## 1.2 백엔드 5종 — 없으면 화면은 뜨지만 조회·생성·엑셀이 죽는다

| # | 대상 | 내용 |
|---|------|------|
| 5 | `KiiPS-SY/.../controll/MI10xxAPIController.java` | `LIST` / `CREATE` / `EXCEL` 3 엔드포인트 (+ 드릴다운 쓰면 `DETAIL`) |
| 6 | `KiiPS-SY/.../service/MI10xxAPIService.java` | — |
| 7 | `KiiPS-SY/.../dao/MI10xxAPIDao.java` | inline SQL DAO (kiips-db-inspector 참조) |
| 8 | `KiiPS-SY/.../model/MI10xxVO.java` | `CREATE` 요청 VO |
| 9 | `KiiPS-UTILS/.../Constant.java` `getExcelHeader()` | 엑셀 헤더↔컬럼 매핑 case |

**#9 는 공유 모듈(`KiiPS-UTILS`)이므로 변경 전 사용자 승인이 필요합니다.**

`MI1001APIController` ~ `MI1008APIController` 가 표준 세트이며 `MI1008APIController` 를 참고하십시오.
**MI1010 은 이 체크아웃 기준으로 SY 백엔드가 존재하지 않습니다** — 즉 레퍼런스는 프론트만 완성된 상태입니다(Part 9 · Part 4 함정 참조).

## 1.3 선택

- `KIIPS-HELP/src/main/webapp/MI10xx.jsp` — 도움말. `btn_help` 가 `ScreenHelp(window.location.pathname)` 로 호출합니다.
  이 계열의 **서식 코드(AC285 등) 유일한 소스 근거가 HELP 도움말 제목**입니다(MI1001~MI1008 의 JSP 본문에는 서식 코드가 없음).

## 1.4 화면 ↔ 서식 대응 (기존 자산)

| 화면 | 서식 | 제목 |
|---|---|---|
| MI1001 | AC285 | 투자 및 융자현황 |
| MI1002 | AC286 | 업종별 투자현황 |
| MI1003 | AC287 | 신기술사업투자조합의 투자재원 현황 |
| MI1004 | AC361 | 업력별 투자 현황 (반기/분기 이중 서식) |
| MI1005 | AC362 | 신기술사업투자조합 등 결성현황 |
| MI1006 | AC410 | 유형별 투자·회수 현황 |
| MI1007 | AC411 | 업종별 융자현황 |
| MI1008 | AC412 | 업력별 융자현황 |
| **MI1010** | **AC285** | **투자 및 융자 현황 — 본 스킬의 레퍼런스 구현체** |

**화면번호와 서식은 1:1 이 아닙니다.** MI1010 은 새 서식이 아니라 MI1001 과 같은 AC285 의 2번째 구현체입니다. (MI1009 는 HELP 도움말만 있는 고아 화면이라 번호가 비어 있습니다.)

> **서식 코드의 출처**: 위 표의 AC 코드는 **`KIIPS-HELP/src/main/webapp/MI10xx.jsp` 9행의 도움말 제목**에서 옵니다(예: `MI1007.jsp` → `업종별 융자현황(AC411)`, `MI1008.jsp` → `업력별 융자현황(AC412)`). UI JSP 본문에는 서식 코드가 없으므로 **HELP 파일이 유일한 근거**입니다. 새 화면의 서식 코드를 확인할 때 `KiiPS-UI` 트리만 grep 하면 못 찾습니다.

---

# Part 2: inc_mi_button.jsp 분기 — 공유 분기에 얹지 말고 전용 분기를 파라

`inc_main_button.jsp` 가 화면 ID 앞 2자리(`MENU_SCREEN_ID.substring(0,2)`)로 도메인을 판별해 `inc_mi_button.jsp` 로 라우팅하고, 그 안에서 화면 ID 문자열 if/else-if 체인을 탑니다.

MI1001~MI1008 은 **하나의 공유 OR 묶음 분기**를 씁니다(Total + 조회 + 생성 + 엑셀 + 도움말). MI1010 은 여기에 ID 를 추가하지 않고 `MENU_SCREEN_ID.equals("MI1010")` 전용 분기를 신설했습니다.

**판단 기준:**

| 새 화면이 필요한 것 | 어디에 |
|---|---|
| 조회 + 생성 + 엑셀 + 도움말만 | 기존 MI1001~MI1008 공유 묶음에 `\|\| MENU_SCREEN_ID.equals("MI10xx")` 추가 |
| 단위 셀렉트 / 검증 토글 등 추가 컨트롤 | **전용 `else if` 분기 신설** |

⚠️ **공유 분기 수정은 그 분기에 나열된 모든 화면에 즉시 파급됩니다.** MI1010 의 버튼을 공유 묶음에 넣었다면 MI1001~MI1008 8개 화면 전부에 `btn_verify` 가 생기고, 각 화면에 정의되지 않은 `fnToggleVerify()` / `fnSetUnit()` 을 참조하게 됩니다.

MI1010 분기가 공유 묶음과 다른 델타는 **정확히 2개**입니다 — `#UNIT_SEL` selectpicker 와 `#btn_verify`.

> 전체 마크업 → [examples.md](examples.md) Part 11

---

# Part 3: 이 계열의 구조적 특징 4가지

## 3.1 본표는 RealGrid 가 아니라 순수 HTML `<table>`

프로젝트 일반 규칙은 "데이터 테이블 = RealGrid, HTML table 금지" 이지만, **이 계열은 예외**입니다. 금감원 서식이 rowspan/colspan 병합 투성이라 그리드로 표현되지 않기 때문입니다.

- `<thead>` 는 JSP 에 정적으로 박습니다 (다단 헤더 + `<col>` 폭 선언)
- 데이터 행은 JS 문자열을 조립해 `$('#dataTable_body').html(html)` 로 **1회 주입**합니다
- RealGrid 는 **드릴다운 모달 안에서만** 씁니다

MI1001~MI1008 + MI1010 9개 화면 전부 이 구조입니다(`dataTable_body` 공유). 규칙만 보고 본표를 RealGrid 로 바꾸면 계열에서 이탈합니다.

⚠️ **공유되는 것은 여기까지입니다.** 이 스킬이 가르치는 기계장치 — `G_ROWS` · `UNIT_SEL` 단위 전환 · 검증열 대사 · 드릴다운 모달 — 는 **MI1010 단독 패턴**입니다. 실측: `UNIT_SEL` · `fnRenderTable` · `G_ROWS` 는 MI1001 · MI1002 · MI1005 · MI1008 에서 **전부 0건**이고, 툴바 분기도 MI1001~MI1008 공유 묶음과 MI1010 단독 분기로 갈려 있습니다. "MI10 계열이니 다 이렇다" 고 일반화하지 마십시오.

## 3.2 서식은 데이터가 아니라 화면 구조다

행 정의(`G_ROWS`)는 하드코딩된 선언이고, 서버는 값만 채웁니다. 조회 결과가 0건이어도 서식 전체가 공란으로 유지됩니다.

## 3.3 건수가 '행'이냐 '열'이냐가 서식별 최대 분기점

- **행**형 (AC285 = MI1001/MI1010): 투자업체수·투자건수·대출건수·조합수가 별도 **행**. 해당 행에 `cnt:true` 를 달아 단위 환산 대상에서 제외합니다.
- **열**형 (MI1003/MI1004/MI1008): `업체수|금액` 컬럼 쌍이 반복됩니다.

새 서식이 열형이면 `G_ROWS` 의 `cnt` 플래그 대신 `G_COLS` 구조를 바꿔야 합니다.

## 3.4 API 계약은 9개 화면이 동일

```
POST ${KiiPS_SY}/SYAPI/MI10xx/LIST     — 조회   getData()
POST ${KiiPS_SY}/SYAPI/MI10xx/CREATE   — 생성   setData()
POST ${KiiPS_SY}/SYAPI/MI10xx/EXCEL    — 엑셀   fn_excelDown()
POST ${KiiPS_SY}/SYAPI/MI10xx/DETAIL   — 드릴다운 (MI1010 이 추가)
```

JS 함수명 `getData` / `setData` / `fn_excelDown` / `MAIN_SEARCH_FILTER` 도 9개 화면 공통입니다. **이름을 바꾸지 마십시오.** 다만 이유는 두 가지로 나뉩니다:

- `inc_mi_button.jsp` 의 `onClick` 이 **직접 호출**하는 것: `MAIN_SEARCH_FILTER()`(조회) · `setData()`(생성) · `fn_excelDown()`(엑셀) · `ScreenHelp(...)`(도움말) — 여기에 MI1010 전용 `fnToggleVerify()` 가 더해집니다.
- `getData` 는 툴바가 부르지 않습니다. `MAIN_SEARCH_FILTER` 가 부르는 **페이지 내부 함수**이며, 계열 관례상 이름을 맞춥니다.

→ 완료 체크리스트의 "onClick 함수 정의 확인" 은 **앞줄 4~5개**를 대상으로 하십시오.

호출은 전부 `logosAjax.requestToken(gToken, URL, "POST", data, successCallback)` 5인자 형태이며 errorCallback 은 쓰지 않습니다.

> 이는 KiiPS-UI/CLAUDE.md #4("jQuery AJAX — error 콜백 필수")와 겉으로 충돌합니다. `logosAjax.requestToken` 의 6번째 인자 `errorCallback` 은 **무응답을 포착하지 못하는 데다 공통 오류 알림까지 억제**하므로 이 계열은 의도적으로 생략합니다. 개별 실패 처리가 필요하면 `errorCallback` 대신 `$(document).ajaxComplete` + URL 필터를 쓰십시오.

⚠️ **`/DETAIL` 의 `AMT` 는 '원'이 아닙니다.** `/LIST` 는 원 단위 정수지만, 모달 그리드는 재환산을 하지 않고 footer 도 표시값끼리 대사합니다 — 단위 계약이 갈라지는 지점이라 **반드시** [reference.md](reference.md) Part 6.1.1 을 읽고 (a)서버가 표시단위로 내려주기 / (b)화면이 매핑하기 중 하나를 고르십시오. 열린 모달은 단위 토글에도 반응하지 않습니다.

---

# Part 4: 함정 (요약)

각 항목의 **증상 → 원인 → 올바른 코드** 전문은 [reference.md](reference.md) Part 9 에 있습니다. 여기서는 신규 화면 작업 중 반드시 기억할 것만 추립니다.

## 4.1 레퍼런스 구현체 자체의 결함 — 복제 금지

MI1010.jsp 는 잘 다듬어진 레퍼런스이지만, **주석이 현재 코드 동작을 설명하지 못하는 지점과 죽은 코드가 있습니다.** 그대로 베끼면 결함까지 물려받습니다.

| 결함 | 실체 |
|------|------|
| `SMP_DIFF` 불일치 주입 | 주입 직후 도는 `x.E = x.A+x.B-x.C+x.F` 전역 재계산이 **전부 지웁니다**. 실제 불일치는 그 뒤에 도는 `SMP_NG` 만 만듭니다. 파일의 장문 주석("롤업 뒤에 넣으면 정확히 SMP_DIFF 건수만 어긋난다")은 **더 이상 사실이 아닙니다.** 규약의 기준선은 '롤업 뒤'가 아니라 **'E 강제 재계산 뒤'** 입니다. `SMP_DIFF[].why` 는 어디서도 참조되지 않습니다. |
| `fnReconHtml` | 정의만 있고 **호출 0건**. 동일 역할은 RealGrid footer(`N()` 의 3행 `ft`)로 대체됐습니다. 복제하지 마십시오. |
| `fnVerifySumHtml` | 인자 `r` 을 쓰지 않고 `v` 는 null 가드로만 씁니다. 어떤 행이든 `PRPL_AMT_INCDEC_CD` 를 언급하는 **동일한 하드코딩 문구**를 반환하는데, `SMP_NG` 로 만들어진 행에는 맞지 않는 설명입니다. |
| `USE_SAMPLE = true` 로 출하 | 실 API `/LIST`·`/DETAIL` 을 **한 번도 타지 않았습니다.** 복제하면 '동작하는 것처럼 보이지만 백엔드에 안 붙은' 화면을 그대로 물려받습니다. |
| `// TODO 확인필요` 2건 | ① `requestData.TB_RP1011M` — '화면ID → 테이블 +1 오프셋' 관례로 **추정한 이름** ② `downExcel(param, "${KiiPS_COMMON}", 11, 3)` 의 `(11,3)` — 서식 xlsx 등록 시 맞춰야 할 **자리표시자**. **`fn_excelDown` 을 검증된 패턴으로 취급하지 마십시오.** |
| 엑셀 파일명 공백 | `fileName` 이 `"투자 및 융자 현황.xlsx"`(공백 포함)라 `Constant.getExcelHeader()` 의 기존 `case "투자 및 융자현황"`(MI1001)과 매칭되지 않습니다. **공유 모듈을 고칠 게 아니라 파일명을 MI1001 과 통일**하십시오 → ref 9.1.5 |
| `/DETAIL` payload 주석 | 주석의 `BLNC_INCDEC_CD`·`PRPL_AMT_INCDEC_CD`·`TRD_AMT` 가 실제 `fnDetailCols` 의 `BLNC_CD`·`PRPL_CD`·`AMT` 와 어긋납니다. **주석을 복제하면 백엔드가 빈 그리드를 만듭니다** → ref 8.3 표 · 9.1.6 |
| 샘플 경계 오염 | `USE_SAMPLE` 블록 안에 운영 코드(`fnDetailKind`·`KIND_NM`·`fnDetailCols`·`G_STD_YM` 등)가 섞이면 **블록을 통삭제할 때 드릴다운이 죽습니다.** 운영 경로가 참조하는 심볼은 처음부터 경계 **위**에 두십시오(MI1010 은 2026-08-11 교정됨) → ref 9.5.1.1 |

## 4.2 CSS / 테마

| 함정 | 요지 |
|------|------|
| 소계/합계 음영 미정의 | `bg_totsum` 은 정의 0건. `bg_subsum` 은 `css/datatables.scss` 에만 있는데 **그 스타일시트는 MI 페이지 include 체인에서 로드되지 않습니다**(서빙되는 `css/sass/theme.css` 에 0건). → **두 클래스 모두 런타임에 미정의일 수 있습니다. 음영 유무는 브라우저 실측으로 확인**하십시오. 공통 SCSS 수정은 기존 업무보고서 화면 전체에 파급됩니다 → ref 9.2.1 |
| `.in-bl` / `.ib` / `.dis_in_bl` | `display:inline-block !important` 라 jQuery `show()`/`hide()` 가 **무력화**됩니다. 검증열 토글을 show/hide 로 만들지 마십시오 — CSS 클래스 토글을 쓰십시오. |
| 전역 `ul` 리셋 | 테마 리셋 `ol, ul { list-style: none; }` 이 안내 서랍 목록 마커를 지웁니다. 출처는 `css/sass/themes/default/_styles.scss:303`(산출물 `css/sass/theme.css:301`, `header.jsp` 85행이 링크). `style_pc.scss` 는 **MI 페이지에 로드되지 않으므로 원인이 아닙니다** → ref 9.2.3 |
| `<small>` 로 감싸도 글자가 안 작아짐 | 테마의 `small` 규칙이 `--font-size` CSS **변수만** 선언하고 실제 `font-size` 를 선언하지 않습니다. id 셀렉터로 직접 주십시오. |
| 색 하드코딩 | 페이지 `<style>` 에서 색을 선언할 땐 **반드시 라이트/다크 쌍**. 단색은 `var(--primary)` / `var(--rgTable-hover-background)` 토큰(양쪽 정의 확인됨). 강조는 `text-danger`/`text-success` 유틸만. |

## 4.3 컴포넌트

| 함정 | 요지 |
|------|------|
| selectpicker 전역 패치 없음 | MEMORY 에 기록된 `header.jsp`/`header_popup.jsp` 의 `$.fn.selectpicker` refresh/render/val 전역 패치는 **현재 워킹카피에 존재하지 않습니다**(header.jsp·header_popup.jsp·common.min.js 모두 grep 0건). 전역에서 해결됐다고 가정하지 마십시오. |
| `changed.bs.select` vs `change` | 코드로 `.selectpicker('val', v)` 를 호출하면 native `change` 가 **발화하지 않습니다**. 단위 셀렉트 바인딩은 반드시 `changed.bs.select`. |
| `data-id` 는 2개 매칭 | bootstrap-select 가 원본 select 의 `data-id` 를 **생성한 버튼에도 복사**합니다. `$('[data-id=UNIT_SEL]')` 는 select + button 2개를 잡습니다. **`$('#UNIT_SEL')` id 셀렉터를 쓰십시오.** |
| `UNIT_SEL` id 중복 | 같은 id 가 MI0333 분기(`AK`/`WON`)와 MI1010 분기(`M`/`W`)에 각각 있고 **option value 가 다릅니다.** 분기는 배타적이라 DOM 충돌은 없지만 다른 화면 핸들러를 복사하면 값이 조용히 어긋납니다. |
| 안내 서랍 체크박스 | `kiips-guide-drawer` 는 헤더·하단 '자동 열림 방지' 체크박스·왼쪽 손잡이 탭을 **공통 JS 가 만들어 붙입니다.** 직접 넣으면 하나가 더 생깁니다. 스크립트는 `?ver=` 캐시버스터 필수. |

## 4.4 RealGrid (드릴다운 모달)

> 증상만 적습니다. 원인·해법 전문은 앵커를 따라가십시오 (중복 서술 금지).

| 증상 | 앵커 |
|------|------|
| 모달 그리드에 가로 스크롤 · 높이 210px 고정 · footer/행번호 실종 | `createSimpleGrid` 강제 4종 → ref 9.4.1 |
| 모달을 열었는데 그리드가 비어 있음 | 숨겨진 컨테이너 `setRows` → ref 9.4.2 (`.one('shown.bs.modal')` 필수) |
| footer 라벨 병합이 안 먹음 | `footerSpans` 는 레이아웃 속성 → ref 8.10 |
| 렌더 중 TypeError | `dataType:"number"` 에 `numberFormat` 누락 → ref 9.4.3 |
| 재생성 후 `fitStyle` 이 초기화됨 | `copyToClipboardGrid` 재호출 → ref 9.4.4 (**초기 1회만**) |
| 셀 정렬 | 기본 중앙정렬. `text-center` 금지 → ref 9.4.5 |

## 4.5 파일 / 환경

- **줄바꿈 혼재**: MI1010·MI1001·inc_mi_button·header 는 **CRLF**, 같은 폴더의 MI0333 은 LF 입니다. "이 폴더는 CRLF" 라고 뭉뚱그리면 틀립니다. python 편집 시 `open(..., newline='')` 필수, `sed`/`awk` 리다이렉트 편집은 줄바꿈을 통째로 바꿔 전체 diff 를 만듭니다. 인코딩은 UTF-8(BOM 없음).
- **자동 빌드 금지**: 앱이 로컬 실행 중이라 `mvn clean` 은 target 잠금으로 실패합니다. JSP 는 라이브 반영되므로 편집 후 정적 검증 + 새로고침 안내로 끝내십시오.

## 4.6 접근성 — 클릭 셀은 기본이 키보드 불가

이 계열이 만드는 최대 접근성 위반 지점은 툴바가 아니라 **본표의 드릴다운 셀**입니다. 아무 처리 없이 렌더하면 `<td class="clickable" onclick="fnOpenDetail(...)">` 에는 `tabindex` · `role` · 키보드 핸들러가 전부 없습니다. AC285 규모면 95행 × 6열 + 검증 2열 = **마우스로만 도달 가능한 인터랙티브 셀 수백 개**입니다. 검증 셀의 `title` 툴팁도 포커스가 가지 않으면 스크린리더가 읽지 못합니다.

> `MI1010.jsp` 는 **2026-08-11 적용 완료** — 값 셀 3곳(A·B·C·F·E / 검증 E′ / 검증 V)에 `role="button" tabindex="0"` 가 붙고 `ready` 에 위임 `keydown` 핸들러 1개가 등록돼 있습니다. 신규 화면은 아래 규칙을 그대로 쓰십시오.

**규칙 2줄:**

1. 클릭 셀 조립 시 속성에 `role="button" tabindex="0"` 를 함께 넣는다.
2. Enter/Space 는 셀마다 인라인 `onkeydown` 을 붙이지 말고 **`ready` 에서 위임 핸들러 1개**로 처리한다 — 인라인은 JS 문자열 안에서 따옴표 이스케이프가 조용히 깨집니다.

```js
$('#rep').on('keydown', 'td.clickable, th.clickable', function(e){
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); $(this).trigger('click'); }
});
```

> 코드 전문 → [examples.md](examples.md) Part 12.3 · 12.4 · 13. 그 외 마크업 접근성은 `kiips-a11y-guide` 를 함께 참조하십시오.

---

# Quick Reference

| 하고 싶은 것 | 어디를 보나 |
|---|---|
| 페이지 골격 통째로 | [examples.md](examples.md) Part 10 |
| 툴바 분기 마크업 | [examples.md](examples.md) Part 11 |
| `G_ROWS` 행 정의 스키마 | [reference.md](reference.md) Part 5 |
| 단위 전환 계약 | [reference.md](reference.md) Part 6 · [examples.md](examples.md) Part 12 |
| 검증열 대사 규칙 | [reference.md](reference.md) Part 7 · [examples.md](examples.md) Part 13 |
| 드릴다운 요청/응답 스키마 | [reference.md](reference.md) Part 8 (8.3 = kind 별 필드 표) · [examples.md](examples.md) Part 14 |
| 명세 종류 판정 코드 | [examples.md](examples.md) Part 14.6 (`fnDetailKind` / `KIND_NM`) |
| `/DETAIL` 금액 단위 계약 | [reference.md](reference.md) Part 6.1.1 |
| 샘플 데이터 경계 규약 | [reference.md](reference.md) Part 9.1 · [examples.md](examples.md) Part 15 |
| 페이지 `<style>` 규칙 | [reference.md](reference.md) Part 9.2 · [examples.md](examples.md) Part 16 |
| 함정 전체 목록 | [reference.md](reference.md) Part 9 |

---

# 완료 전 체크리스트

작업을 완료로 선언하기 전에 아래를 **실제로 확인**하십시오 (증거 기반 완료 규칙).

- [ ] `inc_mi_button.jsp` 에 새 화면 ID 분기가 있는가? (없으면 툴바가 조용히 빈다)
- [ ] `MIUIController` 에 매핑 메서드를 추가했는가? (Java → 빌드 필요, 사용자 요청 시에만)
- [ ] 메뉴 DB 등록을 사용자에게 안내했는가? (미등록 = NPE 500)
- [ ] `inc_mi_button.jsp` 의 `onClick` 이 **직접** 부르는 함수(`MAIN_SEARCH_FILTER` / `setData` / `fn_excelDown` / `ScreenHelp` / 커스텀 토글)가 페이지 JSP 에 **전부 정의**돼 있는가? (`getData` 는 툴바가 부르지 않는 내부 함수)
- [ ] 단위 셀렉트를 넣었다면 `changed.bs.select` 로 바인딩했는가? (`change` 아님)
- [ ] 검증열을 넣었다면 show/hide 가 아니라 **CSS 클래스 토글**인가?
- [ ] 페이지 `<style>` 의 색 선언이 라이트/다크 **쌍**인가? 하드코딩 hex 대신 테마 토큰인가?
- [ ] `USE_SAMPLE` 샘플 블록을 넣었다면 주입 지점이 **2곳 이하**이고, **블록을 통째 삭제한 뒤에도 `fnOpenDetail` 이 참조하는 심볼(`fnDetailKind`·`KIND_NM`·`fnDetailCols`·배지 매핑·`G_STD_YM`)이 전부 살아 있는가?** 통과 기준은 "옮겼다" 가 아니라 **경계 위 영역 `grep "SMP_\|fnSmp\|fnSample"` 0건**(주입 지점 제외)입니다. (ref 9.5.1.1)
- [ ] 클릭 가능한 셀에 `role="button" tabindex="0"` 와 Enter/Space 핸들러가 있는가? (4.6)
- [ ] `/DETAIL` 의 `AMT` 단위를 (a)서버 표시단위 / (b)화면 매핑 중 하나로 **명시적으로 정했는가?** (ref 6.1.1)
- [ ] `dataType:"number"` 컬럼에 `numberFormat` 이 전부 붙어 있는가?
- [ ] 줄바꿈(CRLF/LF)을 보존했는가? `svn diff` 가 의도한 줄만 보여주는가?

---

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
- 실전 예제: [examples.md](examples.md)
