---
name: kiips-stitch-bridge
description: "Stitch/Pencil 디자인(.pen, .stitch)을 KiiPS JSP/Bootstrap/RealGrid로 변환. Use when: stitch 디자인, pencil, .pen 파일, 디자인 변환, 디자인을 JSP로. NOT for: 디자인 없이 새 페이지(kiips-page-pattern-guide), 컴포넌트만 추가(kiips-ui-component-builder)"
allowed-tools:
  - "mcp__pencil__*"
  - "Read"
  - "Write"
  - "Bash"
globs:
  - ".stitch/**"
  - "**/*.pen"
  - "KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/**/*.jsp"
---

# KiiPS-Stitch Bridge

사용자가 사전 준비한 Stitch/Pencil 디자인(.pen, .stitch)을 KiiPS JSP 페이지로 변환하는 브리지 스킬입니다.

> **Prerequisite:** Pencil MCP가 연결되어 있어야 `.pen` 파일을 직접 읽을 수 있습니다.
> MCP 미연결 시에는 사용자가 PNG/HTML 산출물을 첨부하거나 `kiips-page-pattern-guide`를 사용하세요.

## 워크플로우: Design-to-JSP

### 1단계: 디자인 입력 수집
사용자가 제공한 Pencil `.pen` 파일은 `mcp__pencil__get_editor_state`(`include_schema: true`)로 스키마를 먼저 확인한 뒤 `mcp__pencil__get_screenshot`/`mcp__pencil__batch_get`으로 내용을 읽거나, 첨부 이미지/HTML을 분석합니다.

### 2단계: 디자인 분석
디자인의 구조를 파악하여 KiiPS 컴포넌트로 매핑합니다.

| Stitch 컴포넌트 | KiiPS JSP 컴포넌트 |
|-----------------|-------------------|
| Search/Filter bar | `inc_filter_main.jsp` (검색필터 영역) |
| Button toolbar | `inc_main_button.jsp` (버튼 영역) |
| Data table | RealGrid 2.6.3 그리드 |
| Modal dialog | Bootstrap 모달 (`registModal`) |
| Tab panel | Bootstrap 탭 (`nav-tabs`) |
| Card layout | Bootstrap 카드 (`card` > `card-body`) |
| Chart area | ApexCharts |
| Form fields | Bootstrap 폼 그룹 (`form-group`) |
| Navigation | KiiPS 좌측 메뉴 (자동 처리) |

### 3단계: JSP 페이지 생성

디자인을 기반으로 KiiPS 표준 JSP 구조로 변환합니다:

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!--
  Design Reference: .stitch/designs/{pageId}.png
  Generated from Stitch design on YYYY-MM-DD
-->

<!-- 검색필터 영역 (Stitch: Search/Filter bar) -->
<%@ include file="inc_filter_main.jsp" %>

<!-- 버튼 영역 (Stitch: Button toolbar) -->
<%@ include file="inc_main_button.jsp" %>

<!-- 그리드 영역 (Stitch: Data table) — RealGrid는 빈 <div id="xxxGrid">에 바인딩 (id는 화면별로 명명, 예: fairValueGrid) -->
<div id="mainGrid" style="height:calc(100% - 80px)"></div>

<!-- 등록/수정 모달 (Stitch: Modal dialog) — registModal 인라인 HTML, 상세는 kiips-regist-modal-guide -->

<script>
$(document).ready(function() {
    // KiiPS 표준 초기화 (그리드 생성, 이벤트 바인딩 — MainComponent는 서버사이드 태그빌더이므로 클라 호출 없음)
});
</script>
```

### 4단계: 스타일 변환

디자인의 색상/스타일을 KiiPS SCSS 변수로 매핑합니다:

| Stitch Token | KiiPS SCSS Variable |
|-------------|-------------------|
| Primary color | `$theme-color` / `$primarybgColor` / `$primary-color-hue` (`config/_variables.scss`) |
| 배경·카드·보더·텍스트·성공·위험 등 그 외 토큰 | 실제 변수명은 **kiips-scss 스킬 + `config/_variables.scss` 참조** (변수명을 추측하지 말 것), 다크테마는 `themes/default/_dark.scss` |

## 사용 시나리오

### 새 페이지 생성 (Full Workflow)

```
사용자: "PG0500 펀드 운용현황 페이지 만들어줘 — 디자인은 PG0500.pen 첨부"

1. kiips-stitch-bridge      → .pen 디자인 분석 + KiiPS 컴포넌트 매핑 + JSP 변환
2. kiips-page-pattern-guide → JSP 표준 패턴 적용 (Include, 레이아웃)
3. kiips-search-filter-guide → 검색필터 구성
4. kiips-button-guide       → 버튼 영역 구성
5. kiips-realgrid-guide     → 그리드 설정
```

### 기존 페이지 리디자인

```
사용자: "PG0357 페이지를 첨부 디자인대로 리디자인해줘"

1. 기존 JSP 분석            → 구조 파악 (kiips-page-pattern-guide 참조)
2. kiips-stitch-bridge      → 디자인 요소를 기존 JSP에 반영
```

## 디렉토리 구조

```
.stitch/                     # (선택) Pencil 작업물 저장소 — 현재 실제 구성:
├── DESIGN.md                # 디자인 가이드
└── SITE.md                  # 페이지 목록 및 로드맵
    # designs/·*.pen 등은 작업 시 생성 (현재 미존재) — Pencil 원본은 사용자가 별도 제공

KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/
└── {domain}/                # 도메인별 JSP (FD, IL, AC 등)
    └── PG0500.jsp           # 변환된 메인 페이지
        # inc_filter_main.jsp·inc_main_button.jsp는 kiips/include/ 의 공유 파일 (도메인 폴더에 생성 X)
        # 등록/수정 모달은 별도 include 파일 없이 registModal 인라인 (kiips-regist-modal-guide)
```

## 주의사항

- 디자인은 시각적 참조용이며, JSP 코드는 KiiPS 표준 패턴을 따릅니다
- React/Tailwind 출력은 KiiPS에서 사용하지 않습니다 (JSP/Bootstrap/jQuery 사용)
- 다크테마는 `[data-theme=dark]` 셀렉터로 별도 SCSS에서 처리합니다
- RealGrid는 디자인의 테이블과 1:1 매핑되지 않을 수 있으므로 별도 설정이 필요합니다
- Pencil MCP가 연결되지 않은 환경에서는 사용자가 첨부 이미지나 HTML 산출물을 제공해야 합니다
