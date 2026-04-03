---
name: kiips-stitch-bridge
description: Stitch 디자인을 KiiPS JSP 페이지로 변환하는 브리지 스킬 - 디자인 → JSP/Bootstrap/RealGrid 변환
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

Stitch/Pencil 디자인을 KiiPS JSP 페이지로 변환하는 브리지 스킬입니다.

## 워크플로우: Design-to-JSP

### 1단계: Stitch 디자인 생성
`stitch-design` 스킬을 사용하여 UI 디자인을 생성합니다.

### 2단계: 디자인 분석
생성된 디자인의 구조를 분석하여 KiiPS 컴포넌트로 매핑합니다.

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

<!-- 그리드 영역 (Stitch: Data table) -->
<div class="grid_wrap" id="mainGrid" style="height:calc(100% - 80px)"></div>

<!-- 등록/수정 모달 (Stitch: Modal dialog) -->
<%@ include file="inc_regist_modal.jsp" %>

<script>
$(document).ready(function() {
    // KiiPS 표준 초기화
    MainComponent.init();
});
</script>
```

### 4단계: 스타일 변환

Stitch 디자인의 색상/스타일을 KiiPS SCSS 변수로 매핑합니다:

| Stitch Token | KiiPS SCSS Variable |
|-------------|-------------------|
| Primary color | `$brand-primary` |
| Background | `$body-bg` |
| Card surface | `$card-bg` |
| Border color | `$border-color` |
| Text primary | `$text-color` |
| Text secondary | `$text-muted` |
| Success | `$brand-success` |
| Danger | `$brand-danger` |

## 사용 시나리오

### 새 페이지 생성 (Full Workflow)

```
사용자: "PG0500 펀드 운용현황 페이지 만들어줘"

1. enhance-prompt → 디자인 프롬프트 최적화
2. stitch-design → Pencil로 UI 디자인 생성 (.pen 파일)
3. kiips-stitch-bridge → 디자인을 JSP로 변환
4. kiips-page-pattern-guide → JSP 표준 패턴 적용
5. kiips-search-filter-guide → 검색필터 구성
6. kiips-button-guide → 버튼 영역 구성
7. kiips-realgrid-guide → 그리드 설정
```

### 기존 페이지 리디자인

```
사용자: "PG0357 페이지를 Stitch로 리디자인해줘"

1. 기존 JSP 분석 → 구조 파악
2. stitch-design → 새 디자인 생성
3. kiips-stitch-bridge → 디자인 요소를 기존 JSP에 반영
```

## 디렉토리 구조

```
.stitch/
├── DESIGN.md           # KiiPS 디자인 시스템 (design-md 스킬로 생성)
├── SITE.md             # 페이지 목록 및 로드맵
├── next-prompt.md      # 다음 생성할 페이지 (stitch-loop용)
├── metadata.json       # Stitch 프로젝트 메타데이터
└── designs/            # 디자인 산출물
    ├── PG0500.html     # 생성된 HTML
    ├── PG0500.png      # 스크린샷
    └── PG0500.pen      # Pencil 원본

KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/
└── {domain}/           # 도메인별 JSP (FD, IL, AC 등)
    ├── PG0500.jsp      # 변환된 메인 페이지
    ├── inc_filter_main.jsp
    ├── inc_main_button.jsp
    └── inc_regist_modal.jsp
```

## 주의사항

- Stitch 디자인은 시각적 참조용이며, JSP 코드는 KiiPS 표준 패턴을 따릅니다
- React/Tailwind 출력은 KiiPS에서 사용하지 않습니다 (JSP/Bootstrap/jQuery 사용)
- 다크테마는 `[data-theme=dark]` 셀렉터로 별도 SCSS에서 처리합니다
- RealGrid는 Stitch 테이블과 1:1 매핑되지 않을 수 있으므로 별도 설정이 필요합니다
