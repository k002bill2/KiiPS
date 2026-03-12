---
name: kiips-scss-theme-manager
description: "SCSS 테마 시스템 및 디자인 토큰 관리"
---

# KiiPS SCSS Theme Manager

SCSS 기반 테마 시스템 관리 Skill입니다. 디자인 토큰, 믹스인, 컴포넌트 스타일 모듈화를 제공합니다.

## 필수 참조 문서

**PRIMARY REFERENCE**: [SCSS & Theme Design Guide](../../../docs/SCSS_GUIDE.md)

이 가이드에는 전체 색상 시스템, 타이포그래피, 간격 시스템, 반응형 브레이크포인트, 믹스인 라이브러리, 컴포넌트 스타일링 가이드라인, 다크모드 CSS Variables가 포함됩니다.

## Purpose

- **디자인 토큰 관리**: 색상, 폰트, 간격, 그림자 변수
- **SCSS 믹스인**: 반응형, 애니메이션, 유틸리티 믹스인
- **컴포넌트 스타일 모듈화**: BEM 네이밍 권장
- **테마 전환**: 라이트/다크 모드 지원 (선택)
- **일관된 스타일 시스템**: Bootstrap 확장

## When to Use

### Keywords
```
"SCSS", "스타일", "테마", "디자인 토큰", "CSS 변수",
"믹스인", "스타일 가이드"
```

### File Patterns
```
새 파일: **/*.scss, **/_*.scss
수정: **/*.scss
```

## Directory Structure

```
KiiPS-UI/src/main/resources/static/scss/
├── abstracts/
│   ├── _variables.scss      # 디자인 토큰
│   ├── _mixins.scss          # 믹스인
│   ├── _functions.scss       # 함수
│   └── _placeholders.scss    # Extend용
├── base/
│   ├── _reset.scss           # CSS 리셋
│   ├── _typography.scss      # 폰트
│   └── _utilities.scss       # 유틸리티 클래스
├── components/
│   ├── _buttons.scss
│   ├── _cards.scss
│   ├── _forms.scss
│   ├── _tables.scss
│   └── _modals.scss
├── layout/
│   ├── _header.scss
│   ├── _sidebar.scss
│   ├── _footer.scss
│   └── _grid.scss
├── pages/
│   ├── _fund-list.scss
│   ├── _fund-detail.scss
│   └── _dashboard.scss
├── themes/
│   ├── _light.scss           # 라이트 테마
│   └── _dark.scss            # 다크 테마 (선택)
└── main.scss                 # 메인 진입점
```

## Quick Reference - 핵심 변수

### Color Tokens
```scss
$primary: #007bff;       $secondary: #6c757d;
$success: #28a745;       $danger: #dc3545;
$warning: #ffc107;       $info: #17a2b8;
```

### Grayscale
```scss
$gray-100: #f8f9fa;  $gray-200: #e9ecef;  $gray-300: #dee2e6;
$gray-400: #ced4da;  $gray-500: #adb5bd;  $gray-600: #6c757d;
$gray-700: #495057;  $gray-800: #343a40;  $gray-900: #212529;
```

### Semantic Colors
```scss
$text-primary: $gray-900;   $text-secondary: $gray-600;
$text-muted: $gray-500;     $bg-body: $white;
$bg-surface: $gray-100;
```

### Typography
```scss
$font-size-base: 1rem;      // 16px
$font-size-sm: 0.875rem;    // 14px
$font-size-lg: 1.125rem;    // 18px
```

### Spacing
```scss
$spacer: 1rem;
// 0: 0, 1: 4px, 2: 8px, 3: 16px, 4: 24px, 5: 48px
```

## Quick Reference - 핵심 믹스인

```scss
// 반응형
@include media-breakpoint-up(md) { ... }
@include media-breakpoint-down(sm) { ... }

// Flexbox
@include flex-center;     // center + center
@include flex-between;    // center + space-between
@include flex-column;     // column direction

// Typography
@include text-truncate;           // 한줄 말줄임
@include text-clamp(2);           // N줄 말줄임
@include font-smoothing;          // 안티앨리어싱

// Transition
@include transition(color, background-color);

// Shadow
@include card-shadow;             // hover 시 lg shadow

// Button
@include button-variant($bg, $border, $color);
```

## Compilation

### Dart Sass (권장)
```bash
npm install -D sass
sass scss/main.scss css/main.css --style=compressed --source-map
sass scss/main.scss css/main.css --watch
```

## Success Metrics
- 디자인 토큰 사용률: > 90%
- 믹스인 재사용률: > 80%
- CSS 파일 크기: < 200KB (압축)
- 스타일 일관성: > 95%

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
