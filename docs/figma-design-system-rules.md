# KiiPS Design System Rules (Figma MCP 연동용)

> Figma 디자인을 KiiPS 코드로 변환(design-to-code)하거나 KiiPS 화면을 Figma로 보낼 때(code-to-design) 반드시 따라야 할 디자인 시스템 규칙.
> KiiPS는 SPA가 아닌 **서버 렌더링 JSP 멀티페이지 앱**이다. React/Vue 컴포넌트 개념이 없으며, "컴포넌트" = JSP include 조각 + 표준 마크업 패턴 + SCSS 클래스.

---

## 1. Token Definitions (디자인 토큰)

**단일 정의 위치**: `KiiPS-UI/src/main/resources/static/css/sass/config/_variables.scss` (SCSS 변수 형식, 별도 토큰 변환 시스템 없음 — JSON/Style Dictionary 미사용)

### 색상 (시맨틱)
```scss
$color-primary: #007bff;    $color-success: #47a447;
$color-danger:  #d2322d;    $color-warning: #FF9F43;
$color-info:    #44b5bc;    $color-required: #de2f2f;
$color-dark:    #171717;    $color-light:   #f0f0f0;
```

### 타이포그래피
```scss
$font-primary: "NexonLv2Gothic", "Open Sans", Tahoma, ...;
$body-font-size: 13;   // px 단위 숫자
$root-font-size: 14;
$font-weight-normal: 500;  $font-weight-bold: 600;
```

### 스페이싱 (5px 증분 스케일)
```scss
$spacement-xs: 5px;  $spacement-sm: 10px;  $spacement-md: 15px;
$spacement-lg: 20px; $spacement-xl: 25px;  $spacement-xlg: 30px;
```

### 다크테마 토큰
```scss
$dark-bg: #1d2127;             // 기본 배경
$dark-default-text: #eeeeee;   // 기본 텍스트
$dark-color-2: lighten($dark-color-1, 2%);  // 카드/패널 배경
$dark-color-3: lighten($dark-color-1, 5%);  // 보더 등
```

**Figma 매핑 규칙**: Figma 색상 스타일 → 위 SCSS 변수로 매핑. 새 hex 값을 SCSS에 하드코딩하지 말고 기존 변수 재사용. 변수에 없는 색이 디자인에 있으면 사용자에게 확인.

---

## 2. Component Library (컴포넌트)

Storybook/문서화 도구 없음. 컴포넌트 = **JSP include + 표준 마크업 패턴**. 기준 위치:

- 공통 include: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/`
  - `header.jsp` — HTML 골격, CSS/JS 로드 (전역 selectpicker 패치 포함 — 수정 주의)
  - `sidemenu.jsp` — 좌측 메뉴 (param: `MENU_SCREEN_ID`)
  - `inc_page_header.jsp` — 페이지 제목/권한
  - `inc_filter_main.jsp` — 검색 필터 영역 (param: `MAIN_SCREEN_ID`)
  - `inc_main_button.jsp` — 화면ID로 분기하는 액션 버튼 툴바 ⚠️ ScreenAuth DB 직조회 — 메뉴 미등록 화면이면 500
- 페이지: `WEB-INF/jsp/kiips/{도메인}/{화면ID}.jsp` (도메인: FD, IL, AC, EL, SY, PG, PR, ST, RM, MI, MG, IV, RT, COM, POPUP, signup)

### 표준 페이지 골격 (검색필터 + 버튼 + 그리드)
```jsp
<%@ include file="../include/header.jsp"%>
<jsp:include page="../include/sidemenu.jsp">
  <jsp:param name="MENU_SCREEN_ID" value="FD0201" />
</jsp:include>
<section role="main" class="content-body">
  <%@ include file="../include/inc_page_header.jsp"%>
  <div class="card">
    <jsp:include page="../include/inc_filter_main.jsp">
      <jsp:param name="MAIN_SCREEN_ID" value="FD0201" /></jsp:include>
    <jsp:include page="../include/inc_main_button.jsp">
      <jsp:param name="MENU_SCREEN_ID" value="FD0201" /></jsp:include>
    <div id="TB_FD0201"></div>   <%-- RealGrid 마운트 지점 --%>
    <div id="paging"></div>
  </div>
</section>
```

### 표준 폼 컴포넌트 (Figma의 input/select/checkbox/date를 이 마크업으로 변환)

체크박스 — 반드시 `checkbox-custom` (네이티브 checkbox 단독 금지):
```jsp
<div class="checkbox-custom checkbox-default">
  <input type="checkbox" id="FLAG_YN" name="FLAG_YN" data-gbn="checkbox" value="Y">
  <label for="FLAG_YN">라벨</label>
</div>
```

셀렉트 — bootstrap-select (`selectpicker`):
```jsp
<select class="selectpicker show-tick form-control" data-gbn="select"
        name="TPCD" multiple data-max-options="1"></select>
```

날짜 — flatpickr:
```jsp
<input type="text" class="form-control flatpickr-basic" data-gbn="date"
       name="START_DT" placeholder="YYYY-MM-DD" />
```

모달 폼 레이아웃 — `form-group new` + Bootstrap grid (⚠️ `d-flex gap3x` + `flex-fill` 금지):
```jsp
<div class="form-group new row">
  <div class="col-sm-6 col-lg-4">
    <label class="control-label">라벨</label>
    <input type="text" class="form-control" name="FIELD" />
  </div>
</div>
```

### 표준 모달 (Figma 다이얼로그 → 이 골격; Bootstrap `btn-close`/`close` 금지)
```jsp
<div class="modal fade" id="registModal" aria-hidden="true">
  <div class="modal-dialog modal-xl"><div class="modal-content">
    <section class="card">
      <header class="card-header">
        <h2 class="card-title">제목
          <div class="card-actions">
            <a href="#" class="card-action card-action-dismiss modal-dismiss"
               data-dismiss="modal"></a>
          </div>
        </h2>
      </header>
      <div class="card-body px-5 py-4"><!-- 내용 --></div>
    </section>
  </div></div>
</div>
```

### 버튼 컨벤션
- 툴바(main_gridRow) 단일 액션: `btn-outline-primary`
- 드롭다운 트리거만: `btn-primary` (+ 아이콘 색 반전)
- 상세: `.claude/skills/kiips-button-guide` 참조

### 데이터 테이블 = RealGrid (HTML `<table>` 금지)
- 버전 이중 배포: `/vendor/realgrid.2.6.3/` (기본) + `/vendor/realgrid.2.8.8/` (쿠키 `INDEX_PATH=/LOGOS_ERP1`일 때) — 새 API는 두 버전 모두 확인
- 생성은 `js/common_grid.js` 헬퍼 경유 (`setDataSource` 직접 호출 금지)
- Figma의 테이블 디자인 → RealGrid `columnLayout` 설정으로 변환 (셀 정렬 기본 중앙 — `text-center` 불필요)

---

## 3. Frameworks & Libraries

| 계층 | 기술 | 비고 |
|------|------|------|
| 템플릿 | **JSP** (Spring Boot 2.4.2, Java 8) | React/Vue 없음 |
| JS | **jQuery** | 모든 동적 UI |
| CSS 프레임워크 | **Bootstrap 4.4.1** (`/vendor/bootstrap/`) | ⚠️ v5 아님 — `data-dismiss`(v4) 사용, `data-bs-*`(v5) 금지 |
| 그리드 | RealGrid 2.6.3 / 2.8.8 | |
| 차트 | ApexCharts, AnyChart 8.x | |
| 셀렉트/날짜 | bootstrap-select, flatpickr | |
| 빌드 | Maven (`cd KiiPS-HUB && mvn package -pl :KiiPS-UI -am`) | 프론트 번들러 없음 (webpack/vite 미사용) |
| SCSS 컴파일 | 수동: `sass --no-source-map theme.scss theme.css` | 소스맵 주석 금지 |

**Figma 변환 시 절대 규칙**: React/JSX/Tailwind/CSS-in-JS 코드 생성 금지. 산출물은 JSP + jQuery + SCSS.

---

## 4. Asset Management

- 정적 루트: `KiiPS-UI/src/main/resources/static/`
  - `/img` — 이미지 (favicon.ico, dealpipe.svg 등), 절대경로 참조: `<link href="/img/favicon.ico">`
  - `/vendor` — 40+ 서드파티 라이브러리 전부 **로컬 번들** (CDN 미사용, 폐쇄망 고려)
  - `/js`, `/css`, `/fonts`, `/editor`(SynapEditor), `/clipsoft5`
- 최적화 파이프라인 없음 (이미지 수동 최적화, SVG 선호)
- **캐시버스팅**: `?ver=YYMMDD` 쿼리 파라미터, `header.jsp`에서 관리
  ```jsp
  <link rel="stylesheet" href="/css/sass/theme.css?ver=260707" />
  ```
  CSS 변경 시 `?ver=` 범프 필수. theme.css는 Spring resource chain **인메모리 캐시**로 서빙 — 앱 재시작 전 미반영.
- Figma에서 에셋 다운로드 시: SVG는 `/img`에 저장, JSP에서 절대경로(`/img/...`)로 참조.

---

## 5. Icon System

아이콘 폰트 3종 병용 (SVG 아이콘 컴포넌트 시스템 없음):

| 라이브러리 | 위치 | 클래스 예 |
|-----------|------|----------|
| **Font Awesome Free 6.0.0** (주력) | `/vendor/font-awesome/` | `fa-solid fa-ellipsis`, `fa-solid fa-circle-info`, `fas fa-question` |
| Themify | `/fonts/themify/` | `ti-*` |
| IcoFont | `/fonts/ico/` | |

- 사용법: `<i class="fa-solid fa-plus"></i>` 인라인 (import 없음, header.jsp가 전역 로드)
- Figma 아이콘 → 가장 유사한 **Font Awesome 6 Free** 아이콘으로 대체. 없으면 SVG로 `/img`에 추가.
- 아이콘만 있는 버튼은 접근성 라벨 필수 (`kiips-a11y-guide` 스킬 참조).

---

## 6. Styling Approach

**방법론**: 전역 SCSS 단일 번들 (CSS Modules/Styled Components/BEM 미사용). 시맨틱 클래스 + Bootstrap 유틸리티.

- 엔트리포인트: `sass/theme.scss` → `config/variables` → `themes/default` → `base/*`(구조 25개) → `gui/*`(컴포넌트 120개) → `layouts/*`(변형)
- 산출물: `static/css/sass/theme.css` (+ `theme.min.css`)
- **SCSS만 수정, 컴파일된 CSS 직접 수정 금지**
- 인라인 `style=""` 배경색 금지 — 다크테마 오버라이드가 불가능해짐

### 다크테마 (필수 준수)
- 셀렉터는 `[data-theme=dark]`만 사용 (`.dark`, `.theme-dark` 금지)
- 변수 정의: `themes/default/_dark.scss` (mixin/CSS 변수 그룹) / 컴포넌트 매핑: `layouts/_dark.scss`
- 다크테마에서 변경 가능한 속성: `color`, `background-color`, `border-color`, `box-shadow`, `fill/stroke`만 — 레이아웃 속성(width/margin/display 등) 변경 금지
```scss
[data-theme=dark] {
  .my-panel { background-color: $dark-color-2; color: $dark-default-text; }
}
```
- **Figma 규칙**: 라이트 기준으로 디자인 받고, 다크는 위 변수 매핑으로 파생. Figma의 다크 시안 색을 하드코딩하지 말 것.

### 반응형
- 브레이크포인트 (`config/_variables.scss`): `$screen-xs:576 / sm:768 / md:992 / lg:1200 / xl:1600`
- 믹스인: `@include media-breakpoint-up(md) { ... }` (`config/_mixins.scss`)
- 그리드: Bootstrap 4 `row`/`col-sm-*`/`col-lg-*`

---

## 7. Project Structure

```
KiiPS/  (Maven 멀티모듈, 빌드는 반드시 KiiPS-HUB에서)
├── KiiPS-HUB/          # parent POM
├── KiiPS-UI/           # ★ 프론트엔드 전체
│   └── src/main/
│       ├── webapp/WEB-INF/jsp/kiips/
│       │   ├── include/        # 공통 include (header, sidemenu, inc_*)
│       │   ├── {FD,IL,AC,...}/ # 도메인별 페이지 ({화면ID}.jsp)
│       │   └── POPUP/          # 공통 팝업
│       └── resources/static/   # css/sass, js, img, vendor, fonts
├── KiiPS-{FD,IL,AC,SY,LP,EL}/  # 도메인 백엔드 (REST)
└── KiiPS-COMMON, KiiPS-UTILS   # 공유 모듈 (수정 시 승인 필요)
```

### 신규 화면 4대 요건 (JSP 파일 하나로는 동작 안 함)
1. 페이지 JSP 생성
2. `inc_main_button.jsp`(구 inc_ac_button) 화면ID 분기 추가
3. Controller 화면별 매핑 (빌드 필요)
4. **메뉴 DB 등록** — 미등록이면 well-formed JSP도 500(NPE)

### Figma → KiiPS 변환 체크리스트
1. 산출물은 JSP + jQuery + SCSS (React/Tailwind 금지)
2. Bootstrap **4.4.1** 문법 (`data-dismiss`, `data-toggle`)
3. 폼 요소는 표준 패턴: checkbox-custom / selectpicker / flatpickr-basic / form-group new
4. 데이터 테이블은 RealGrid (common_grid.js 헬퍼)
5. 색상은 `_variables.scss` 변수로 매핑, 다크테마는 `[data-theme=dark]`
6. 신규 화면이면 4대 요건 안내
7. 접근성: `kiips-a11y-guide` 스킬 규칙 적용 (label-input 연결, 아이콘 버튼 라벨, 명도 대비)
8. 자동 생성 파이프라인은 `kiips-page-harness`, 수동 패턴은 `kiips-page-pattern-guide` 스킬 참조

---
*생성: 2026-07-07 · 근거: 코드베이스 실측 분석 (Bootstrap 4.4.1·FA 6.0.0 직접 확인) + 프로젝트 규칙(.claude/rules/) + 세션 메모리*
₩