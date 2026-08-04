---
name: kiips-securl-external-page
description: "KIIPS-SECURL 외부접속 페이지 생성 패턴 — 메일 링크로 여는 세션 없는(비로그인) 화면을 /SEC/UI/{화면명}에 만드는 표준. OutWebController 1:1 매핑, header.jsp 관례, whole-wrap/box-div 스타일, 토큰 검증, EmailTemplate 메일 짝, 렌더 사전검증 레시피 포함. Use when: 외부 링크 화면, 메일로 여는 페이지, 세션 없는 화면, 비로그인 접근, SECURL 페이지, /SEC/UI/, security.kiips.co.kr, 토큰 링크 화면, 비밀번호 설정/서약서/설문 류 외부 진입 화면. NOT for: 로그인 후 내부 화면(use kiips-page-pattern-guide), 메일 본문 템플릿만 필요(EmailTemplate.java 직접 — 이 스킬의 '메일 짝' 섹션 참조), 모달(use kiips-regist-modal-guide)"
---

# KIIPS-SECURL 외부접속 페이지 패턴

메일 링크로 진입해 **로그인 세션 없이** 열려야 하는 화면(비밀번호 설정, 서약서 서명, 설문, 의견서 등)을 만드는 표준 패턴.

**왜 SECURL인가**: 수신자는 아직 로그인할 수 없으므로 `KiiPS-UI`의 헤더·메뉴·권한(ScreenAuth) include 체계를 쓸 수 없다. KIIPS-SECURL은 `permitAll` + 외부 도메인(`https://security.kiips.co.kr`)으로 이 용도에 맞게 설계된 모듈이다.

**실전 표준 예시**: `KIIPS-SECURL/src/main/webapp/WEB-INF/jsp/PWD_SET.jsp` (비밀번호 설정, 2026-07) — 새 화면은 이 파일을 먼저 읽고 복제·수정하는 것이 가장 빠르다.

## 1. 라우팅 3요소

| # | 위치 | 규칙 |
|---|------|------|
| 1 | `KIIPS-SECURL/.../control/OutWebController.java` | 클래스 `@RequestMapping("/SEC/UI/")` 아래 메서드 추가. **메서드명 = URL = JSP 파일명** 1:1 |
| 2 | `KIIPS-SECURL/.../webapp/WEB-INF/jsp/{화면명}.jsp` | 뷰 파일 (하위 디렉토리 없이 평면 배치) |
| 3 | 접근제어 | `WebSecurityConfiguration`이 `anyRequest().permitAll()` — 등록 불필요. **따라서 토큰 검증은 컨트롤러가 직접 해야 한다** |

```java
@RequestMapping(value="/{화면명}", method={RequestMethod.GET,RequestMethod.POST})
public String 화면명(HttpServletRequest req, @RequestParam(value="token", required=false) String token) {
    req.setAttribute("TOKEN", StringUtils.defaultString(token, ""));
    // 토큰 검증(만료/사용여부) → 실패 시 error.jsp forward, 성공 시 화면표기 값 주입
    return "/{화면명}";
}
```

## 2. JSP 골격 관례

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="org.springframework.web.util.HtmlUtils" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ include file="header.jsp"%>
<style> /* 페이지 전용 스타일은 여기 (공통 SCSS 금지) */ </style>
<body>
<div class="whole-wrap">
    <div class="logo-div"><img src="/img/logo_KiiPS.svg" alt="kiipslogo" class="logo"></div>
    <div class="box-div"> ... 본문 ... </div>
</div>
<script> ... </script>
</body>
</html>
```

- **header.jsp는 `<body>`를 열지 않는다** — `<!doctype>`~`</head>`까지만 제공(끝에 message-proc.jsp include). 본문 JSP가 `<body>`를 직접 열고 닫는다.
- header.jsp가 jQuery·Bootstrap4·font-awesome·theme.css·signup.css를 절대경로로 전부 로드 → 별도 링크 불필요.
- 값 출력은 `<%= %>` 관례이나 **사용자 유래 값은 반드시 `HtmlUtils.htmlEscape()`** (TextUtil에 escape 없음, commons-text 의존성 없음).
- 실패 화면은 신규 제작하지 말고 기존 `error.jsp`로 forward (`errorCode`/`mesage` 속성 분기).

## 3. 스타일 규칙 — SECURL은 KiiPS-UI와 CSS 번들이 다르다

⚠️ KiiPS-UI 표준인 `form-group new`, `.eyes`(비밀번호 토글), `.grey-box`, `.selfauth-*`는 **SECURL theme.css에 없다**. 쓰면 스타일이 조용히 깨진다. 클래스 존재 여부는 `KIIPS-SECURL/src/main/resources/static/css/`를 grep으로 확인할 것.

SECURL에서 실제 동작하는 표준(TokenCreater.jsp 선례):
- 래퍼: `whole-wrap` + `logo-div` + `box-div` (signup.css, 카드 기본 max-width 500px / radius 0.8rem / padding 20px)
- 폼: `form-group` + `label.control-label` + `input.form-control`, 에러는 `is-invalid`(BS4) + `text-danger`
- 안내문: `div.d-info` + `i.fas.fa-info-circle` (파란 안내색 #006b9f)
- 버튼: `btn btn-primary font-weight-semibold btn-py-2 px-4` 중앙 정렬
- 카드 폭/여백 조정은 signup.css를 고치지 말고 **페이지 `<style>`에서 `.box-div` 재선언**(페이지 스코프 오버라이드 — 다른 화면 영향 0)

**아이콘**: 번들 FA는 무료판이라 **regular(라인) 세트에 lock 등 대부분 아이콘이 없다**(Pro 전용). 라인 아이콘이 필요하면 인라인 SVG(stroke 기반, Feather 스타일)를 쓴다. FA CSS 존재 확인은 `::before`(이중 콜론) 패턴으로 grep.

## 4. 메일 짝 (EmailTemplate)

외부 화면은 대부분 안내 메일과 짝이다. 메일 템플릿은 `KiiPS-UTILS/.../util/EmailTemplate.java` 단일 fluent 빌더에 메서드 추가:

- 버튼은 `<button>`이 아니라 **인라인 스타일 `<a>`** (메일 클라이언트가 외부 CSS 제거) — 기존 `IL0113` 메서드의 버튼 스타일 복사.
- `setTitle()`에 `[KiiPS]` 넣지 말 것 — `getTempate()`이 `[제목]`으로 대괄호를 씌운다.
- "※ 발신 전용" 문구 본문에 넣지 말 것 — 공통 푸터에 이미 있다.
- 링크는 `https://security.kiips.co.kr/SEC/UI/{화면명}?token=...` 형태로 호출부(Service)에서 조립.

## 5. 렌더 사전검증 (앱 재기동 없이)

Java/JSP 변경은 재기동 전 확인이 안 되므로, 정적 사본으로 선검증한다:

1. JSP에서 지시자·스크립틀릿 제거, `<%= %>`만 샘플값 치환한 HTML 사본 생성 (python 스크립트 권장 — 미치환 `<% %>` 잔존 검사 포함)
2. `KIIPS-SECURL/src/main/resources/static/{vendor,css,js,img}`를 사본 디렉토리에 **심볼릭 링크** → 실제 CSS/폰트 그대로 재현
3. `python3 -m http.server`로 서빙(샌드박스 해제 필요) 후 브라우저 실측. `file://`은 navigate가 https로 바꿔 실패.
4. ⚠️ 미리보기에서 메일 버튼/링크 클릭 금지 — **실제 운영 도메인으로 이동**한다. href는 grep으로 확인.
5. 폼 검증(빈값/불일치/성공)까지 클릭 실측 후 완료 보고.

컴파일 검증(mvn 없이): `javac -cp KiiPS-UTILS/target/classes:(m2 jar들)` 로 단건 컴파일 가능. EmailTemplate은 commons-lang3 하나로 충분.

## 6. 백엔드 연동 체크리스트 (UI-first 진행 시 TODO 주석으로 남길 것)

- [ ] 1회용 토큰 발급/만료/사용후폐기 테이블 + DAO
- [ ] 토큰 검증: 컨트롤러에서 만료·사용여부 확인, 실패 시 error.jsp forward
- [ ] 저장 API: `/SEC/API/...` (BaseAPIController 계열 참조), 성공 시 토큰 폐기
- [ ] 호출부 Service에서 EmailTemplate 메서드 호출 + 링크 URL 조립
- [ ] JSP의 `*_DEMO = true` 플래그 제거
