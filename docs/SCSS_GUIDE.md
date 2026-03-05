# KiiPS SCSS & Theme Design Guide (통합)

> **Version**: 2.0 (Comprehensive Edition)
> **Last Updated**: 2026-01-13
> **Purpose**: KiiPS UI 개발 시 스타일링 참조를 위한 종합 가이드
> **Maintained By**: KiiPS Development Team

---

## 📍 Quick Reference

### 핵심 파일 경로
```
/KiiPS-UI/src/main/resources/static/css/sass/
├── theme.scss                    # 메인 엔트리 파일
├── config/
│   ├── _variables.scss           # ⭐ 모든 SCSS 변수
│   ├── _mixins.scss              # ⭐ 재사용 믹스인
│   ├── _functions.scss           # 유틸리티 함수
│   ├── _helpers.scss             # rem 변환 등
│   └── _directional.scss         # RTL 지원
├── themes/default/
│   ├── _colors.scss              # ⭐ 색상 팔레트
│   ├── _light.scss               # 라이트 테마 CSS Variables
│   └── _dark.scss                # 다크 테마 CSS Variables
├── gui/                          # 60+ UI 컴포넌트
└── custom.scss                   # 커스텀 스타일
```

### 색상 팔레트 (Quick Ref)

| Token | Value | Usage |
|-------|-------|-------|
| `$color-primary` | `#007bff` | 주요 액션, 링크, 버튼 |
| `$color-success` | `#47a447` | 성공, 완료, 승인 |
| `$color-warning` | `#FF9F43` | 경고, 주의, 대기 |
| `$color-danger` | `#d2322d` | 오류, 삭제, 거부 |
| `$color-info` | `#44b5bc` | 정보, 알림, 안내 |
| `$color-secondary` | `#a5a5a5` | 보조 텍스트, 비활성 |

### 간격 스케일 (Quick Ref)

| Token | Value | Usage |
|-------|-------|-------|
| `$spacement-xs` | `5px` | 아이콘-텍스트 간격 |
| `$spacement-sm` | `10px` | 인라인 요소 간격 |
| `$spacement-md` | `15px` | 폼 요소 간격 (기본) |
| `$spacement-lg` | `20px` | 카드 내부 패딩 |
| `$spacement-xl` | `25px` | 섹션 간격 |
| `$spacement-xlg` | `30px` | 페이지 섹션 구분 |

### 브레이크포인트 (Quick Ref)

| Name | Min Width | Max Width | Device |
|------|-----------|-----------|--------|
| `xs` | 0 | 575px | 폰(세로) |
| `sm` | 576px | 767px | 폰(가로) |
| `md` | 768px | 991px | 태블릿 |
| `lg` | 992px | 1199px | 데스크탑 |
| `xl` | 1200px+ | - | 대형 모니터 |

### 자주 사용하는 믹스인 (Quick Ref)

```scss
@include flex(center, center);           // 중앙 정렬
@include font-size(14);                  // font-size: 1rem
@include line-height(22);                // line-height: 1.571rem
@include media-breakpoint-up(md) { ... } // 반응형 (태블릿 이상)
@include clearfix;                       // float 해제
@include placeholder-color($color);      // placeholder 색상
```

---

## Part 1: Color System (색상 시스템)

### 1.1 Primary Theme Color

```scss
// 메인 테마 색상
$theme-color: #007bff;
$primarybgColor: #007bff;
$theme-color-bg: #f7f7f7;

// 자동 생성 변형
$theme-color-light: lighten($theme-color, 5%);
$theme-color-dark: darken($theme-color, 5%);

// CSS 필터 (SVG 아이콘 색상 변환용)
$theme-color-filter: brightness(0) saturate(100%) invert(67%) sepia(61%)
                     saturate(7314%) hue-rotate(178deg) brightness(79%) contrast(163%);
```

### 1.2 Semantic Colors (14개)

#### Primary Colors
```scss
$color-primary: #007bff;
$color-primary-inverse: #FFF;
$color-primary-lighten: lighten($color-primary, 15%);  // #4da3ff
$color-primary-darken: darken($color-primary, 35%);    // #003d80
```

#### State Colors
```scss
// Success - 성공, 완료, 승인
$color-success: #47a447;
$color-success-inverse: #FFF;

// Warning - 경고, 주의, 대기
$color-warning: #FF9F43;
$color-warning-inverse: #FFF;

// Danger - 오류, 삭제, 거부, 필수
$color-danger: #d2322d;
$color-danger-inverse: #FFF;

// Info - 정보, 알림, 안내
$color-info: #44b5bc;
$color-info-inverse: #242424;
$color-info-light: #d0f2f3;
$color-info-light-inverse: #242424;
```

#### Secondary Colors
```scss
$color-secondary: #a5a5a5;    // 보조 버튼
$color-tertiary: #3b4bb0;     // 3차 색상
$color-quaternary: #734BA9;   // 4차 색상 (보라)
```

#### Utility Colors
```scss
$color-required: #de2f2f;     // 필수 입력 표시
$color-init: #4E5DBF;         // 초기화/리셋
$color-muted: #CCC;           // 비활성 텍스트
$color-disable: #252525;      // 비활성 상태
```

#### Neutral Colors
```scss
$color-default: #fff;
$color-default-inverse: #6b6b6b;

$color-gray: #CCC;
$color-gray-inverse: #252525;

$color-blue-gray: #DAE0E5;
$color-blue-gray-inverse: #323435;

$color-dark: #171717;
$color-dark-inverse: #FFF;

$color-light: #f0f0f0;
$color-light-inverse: #111111;

$color-white: #fff;
$color-black: #333;
```

### 1.3 Gray Scale (HSL 기반)

```scss
// 기본 회색 (hue: 0, saturation: 0%)
$grey-hue: 0;

$grey-5: hsl($grey-hue, 0%, 98%);    // #fafafa - 가장 밝음
$grey-10: hsl($grey-hue, 0%, 94%);   // #f0f0f0
$grey-50: hsl($grey-hue, 0%, 90%);   // #e6e6e6
$grey-100: hsl($grey-hue, 0%, 80%);  // #cccccc
$grey-200: hsl($grey-hue, 0%, 77%);  // #c4c4c4
$grey-300: hsl($grey-hue, 0%, 68%);  // #adadad
$grey-400: hsl($grey-hue, 0%, 59%);  // #969696
$grey-500: hsl($grey-hue, 0%, 50%);  // #808080 - 중간
$grey-600: hsl($grey-hue, 0%, 47%);  // #787878
$grey-700: hsl($grey-hue, 0%, 32%);  // #525252
$grey-800: hsl($grey-hue, 0%, 23%);  // #3b3b3b
$grey-900: hsl($grey-hue, 0%, 15%);  // #262626 - 가장 어두움
```

### 1.4 Primary Color Scale (HSL 기반)

```scss
$primary-hue: 216deg;  // Blue hue

$primary-50: hsl($primary-hue, 90%, 94%);   // 가장 밝음
$primary-100: hsl($primary-hue, 88%, 86%);
$primary-200: hsl($primary-hue, 86%, 77%);
$primary-300: hsl($primary-hue, 84%, 68%);
$primary-400: hsl($primary-hue, 82%, 59%);
$primary-500: hsl($primary-hue, 80%, 50%);  // 기본
$primary-600: hsl($primary-hue, 85%, 41%);
$primary-700: hsl($primary-hue, 90%, 32%);
$primary-800: hsl($primary-hue, 95%, 23%);
$primary-900: hsl($primary-hue, 100%, 15%); // 가장 어두움
```

### 1.5 Additional Color Scales

#### Amber (노란색 계열)
```scss
$amber-50: #fff8e1;
$amber-100: #ffecb3;
$amber-200: #ffe082;
$amber-300: #ffd54f;
$amber-400: #ffca28;
$amber-500: #ffc107;   // 기본
$amber-600: #ffb300;
$amber-700: #ffa000;
$amber-800: #ff8f00;
$amber-900: #ff6f00;
```

#### Green (녹색 계열)
```scss
$green-50: #e8f5e9;
$green-100: #c8e6c9;
$green-200: #a5d6a7;
$green-300: #81c784;
$green-400: #66bb6a;
$green-500: #4caf50;   // 기본
$green-600: #43a047;
$green-700: #388e3c;
$green-800: #2e7d32;
$green-900: #1b5e20;
```

#### Red (빨간색 계열)
```scss
$red-50: #ffebee;
$red-100: #ffcdd2;
$red-200: #ef9a9a;
$red-300: #e57373;
$red-400: #ef5350;
$red-500: #f44336;     // 기본
$red-600: #e53935;
$red-700: #d32f2f;
$red-800: #c62828;
$red-900: #b71c1c;
```

### 1.6 Colors List (반복 생성용)

```scss
// 버튼, 배지, 알림 등 자동 생성에 사용
$colors-list: (
  (primary $color-primary $color-primary-inverse)
  (success $color-success $color-success-inverse)
  (warning $color-warning $color-warning-inverse)
  (danger $color-danger $color-danger-inverse)
  (secondary $color-secondary $color-secondary-inverse)
  (tertiary $color-tertiary $color-tertiary-inverse)
  (quaternary $color-quaternary $color-quaternary-inverse)
  (info $color-info $color-info-inverse)
  (required $color-required $color-required-inverse)
  (init $color-init $color-init-inverse)
  ("gray" $color-gray $color-gray-inverse)
  ("blue" $color-blue $color-blue-inverse)
  ("dark" $color-dark $color-dark-inverse)
  ("light" $color-light $color-light-inverse)
);

// 사용 예시: 버튼 색상 자동 생성
@each $state in $states {
  .btn-#{nth($state, 1)} {
    background-color: #{nth($state, 2)};
    color: #{nth($state, 3)};
  }
}
```

### 1.7 Dark Mode Colors

```scss
// 다크 모드 배경
$dark-bg: #1d2127;
$dark-default-text: #eeeeee;

// 다크 모드 레벨별 색상
$dark-color-1: $dark-bg;                        // 가장 어두움
$dark-color-2: lighten($dark-color-1, 2%);
$dark-color-3: lighten($dark-color-1, 5%);
$dark-color-4: lighten($dark-color-1, 8%);
$dark-color-5: lighten($dark-color-1, 3%);
$dark-color-6: lighten($dark-color-1, 9%);      // 가장 밝음
$darken-color-1: darken($dark-color-1, 2%);

// Body 색상
$body-color: #FFFFFF;       // 라이트 모드
$sidebar-color: #33363F;    // 사이드바
```

### 1.8 Color Usage Guidelines

```scss
// ✅ 올바른 사용
.btn-action {
    background-color: $color-primary;
    color: $color-primary-inverse;

    &:hover {
        background-color: $color-primary-darken;
    }
}

.alert-message {
    &.success { background-color: $color-success; }
    &.error { background-color: $color-danger; }
    &.warning { background-color: $color-warning; }
    &.info { background-color: $color-info; }
}

.required-field::after {
    content: '*';
    color: $color-required;
}

// ❌ 피해야 할 사용
.bad-example {
    color: #007bff;           // 하드코딩 금지
    background-color: blue;   // 명명된 색상 금지
}
```

---

## Part 2: Typography (타이포그래피)

### 2.1 Font Families

```scss
// 기본 폰트 (본문)
$font-primary: "NexonLv2Gothic", "Open Sans", Tahoma, Verdana, Arial,
               Helvetica, -apple-system, BlinkMacSystemFont, sans-serif;

// 장식용 폰트 (특수 목적)
$font-secondary: "Shadows Into Light", cursive;
```

### 2.2 Font Sizes

```scss
// 기준 값 (px)
$root-font-size: 14;      // rem 계산 기준 (1rem = 14px)
$body-font-size: 13;      // 본문 기본 크기
$menu-font-size: 14;      // 메뉴 텍스트
$body-line-height: 22;    // 본문 줄 높이

// rem 변환 예시
// 14px → 1rem
// 16px → 1.143rem
// 18px → 1.286rem
// 20px → 1.429rem
// 24px → 1.714rem
// 32px → 2.286rem
```

### 2.3 Font Weights

```scss
$font-weight-light: 300;       // 얇은 텍스트
$font-weight-normal: 500;      // 일반 텍스트 (기본)
$font-weight-semibold: 600;    // 약간 굵은 텍스트
$font-weight-bold: 600;        // 굵은 텍스트
$font-weight-extra-bold: 600;  // 매우 굵은 텍스트
$font-weight-black: 700;       // 가장 굵은 텍스트
```

### 2.4 CSS Custom Properties (Typography)

```scss
:root {
  --font-size: 0.875rem;       // 14px
  --line-height: 1.5;
  --font-weight: 500;
}
```

### 2.5 Typography Usage Examples

```scss
.page-title {
    font-family: $font-primary;
    @include font-size(24);            // 1.714rem
    font-weight: $font-weight-bold;
    @include line-height(32);          // 2.286rem
}

.body-text {
    @include font-size($body-font-size);
    font-weight: $font-weight-normal;
    @include line-height($body-line-height);
}

.card-title {
    @include font-size(18);
    font-weight: $font-weight-semibold;
}

.small-text {
    @include font-size(12);
    font-weight: $font-weight-light;
}
```

---

## Part 3: Spacing System (간격 시스템)

### 3.1 Base Unit & Scale

```scss
// 기준 단위: 5px
$spacement-increment: 5px;

// 간격 스케일 (5px 씩 증가)
$spacement-xs: $spacement-increment;                          // 5px
$spacement-sm: $spacement-xs + $spacement-increment;          // 10px
$spacement-md: $spacement-sm + $spacement-increment;          // 15px
$spacement-lg: $spacement-md + $spacement-increment;          // 20px
$spacement-xl: $spacement-lg + $spacement-increment;          // 25px
$spacement-xlg: $spacement-xl + $spacement-increment;         // 30px
```

### 3.2 Spacing Usage Guide

| Token | Value | 사용처 |
|-------|-------|--------|
| `$spacement-xs` | 5px | 아이콘-텍스트 간격, 배지 패딩 |
| `$spacement-sm` | 10px | 인라인 요소 간격, 버튼 아이콘 간격 |
| `$spacement-md` | 15px | 폼 요소 간격, 카드 내부 패딩 (기본) |
| `$spacement-lg` | 20px | 카드 헤더/푸터 패딩, 리스트 아이템 간격 |
| `$spacement-xl` | 25px | 섹션 간 마진, 모달 패딩 |
| `$spacement-xlg` | 30px | 페이지 섹션 구분, 대형 카드 패딩 |

### 3.3 CSS Custom Properties (Spacing)

```scss
:root {
  --block-spacing-vertical: 1rem;      // 16px (수직)
  --block-spacing-horizontal: 1rem;    // 16px (수평)
}

// 버튼 패딩 예시
.btn {
    padding: calc(var(--block-spacing-vertical) * 0.375)
             calc(var(--block-spacing-horizontal) * 0.75);
}
```

### 3.4 Spacing Examples

```scss
// 카드 컴포넌트
.card {
    padding: $spacement-md;           // 15px
    margin-bottom: $spacement-lg;     // 20px

    .card-header {
        padding: $spacement-lg $spacement-md;  // 20px 15px
    }

    .card-body {
        padding: $spacement-md;       // 15px
    }
}

// 폼 그룹
.form-group {
    margin-bottom: $spacement-md;     // 15px

    label {
        margin-bottom: $spacement-xs; // 5px
    }
}

// 버튼 그룹
.btn-group {
    gap: $spacement-sm;               // 10px
}

// 섹션 구분
.section + .section {
    margin-top: $spacement-xlg;       // 30px
}
```

---

## Part 4: Border & Radius

### 4.1 Border Widths

```scss
$border-thin: 1px;     // 기본 테두리
$border-normal: 2px;   // 강조 테두리
$border-thick: 3px;    // 두꺼운 테두리 (featured cards 등)
```

### 4.2 Border Radius (CSS Variables)

```scss
:root {
  --border-radius: 0.375rem;      // 6px (기본)
  --border-radius-xl: 0.75rem;    // 12px (대형 카드)
}
```

### 4.3 Border Usage Examples

```scss
.card {
    border: $border-thin solid var(--border-color);
    border-radius: var(--border-radius-xl);
}

.btn {
    border: $border-thin solid transparent;
    border-radius: var(--border-radius);
}

.input {
    border: $border-thin solid var(--border-color);
    border-radius: var(--border-radius);

    &:focus {
        border-color: var(--primary);
    }
}

// Featured 카드 (강조)
.card-featured {
    border-top: $border-thick solid $color-primary;
}
```

---

## Part 5: Responsive Design (반응형)

### 5.1 Breakpoint Map

```scss
$grid-breakpoints: (
  xs: 0,        // 0px ~ 575px (폰 세로)
  sm: 576px,    // 576px ~ 767px (폰 가로)
  md: 768px,    // 768px ~ 991px (태블릿)
  lg: 992px,    // 992px ~ 1199px (데스크탑)
  xl: 1200px    // 1200px+ (대형 모니터)
);

// 추가 브레이크포인트
$screen-xl: 1600px;
$screen-lg-max: $screen-xl - 1;
```

### 5.2 Viewport Widths (Container)

```scss
$viewports: (
  sm: 510px,    // 소형 디바이스 최대 너비
  md: 700px,    // 중형 디바이스 최대 너비
  lg: 920px,    // 대형 디바이스 최대 너비
  xl: 1130px    // 초대형 디바이스 최대 너비
);
```

### 5.3 Media Query Examples

```scss
// 태블릿 이상
@include media-breakpoint-up(md) {
    .container {
        max-width: 700px;
    }
    .grid-2-cols {
        grid-template-columns: repeat(2, 1fr);
    }
}

// 데스크탑 이상
@include media-breakpoint-up(lg) {
    .container {
        max-width: 920px;
    }
    .grid-3-cols {
        grid-template-columns: repeat(3, 1fr);
    }
}

// 대형 모니터
@include media-breakpoint-up(xl) {
    .container {
        max-width: 1130px;
    }
}

// 모바일 전용 (수동)
@media (max-width: 767px) {
    .mobile-only {
        display: block;
    }
    .desktop-only {
        display: none;
    }
}
```

### 5.4 Responsive Component Example

```scss
.responsive-card {
    // 모바일 기본
    width: 100%;
    padding: $spacement-sm;

    @include media-breakpoint-up(sm) {
        padding: $spacement-md;
    }

    @include media-breakpoint-up(md) {
        width: 50%;
        padding: $spacement-lg;
    }

    @include media-breakpoint-up(lg) {
        width: 33.333%;
    }

    @include media-breakpoint-up(xl) {
        width: 25%;
        padding: $spacement-xl;
    }
}
```

---

## Part 6: Mixins Library (믹스인 라이브러리)

### 6.1 Flexbox Mixins

#### `@mixin flex()`
```scss
// 정의
@mixin flex($justify-content, $align-items) {
    display: flex;
    justify-content: $justify-content;
    align-items: $align-items;
}

// 사용 예시
.centered {
    @include flex(center, center);
}

.space-between {
    @include flex(space-between, center);
}

.flex-start {
    @include flex(flex-start, flex-start);
}

.flex-end {
    @include flex(flex-end, center);
}
```

#### `@mixin flexbox()`
```scss
// 정의
@mixin flexbox($grow, $shrink, $basis) {
    -webkit-box-flex: $grow;
    -ms-flex: $grow $shrink $basis;
    flex: $grow $shrink $basis;
    max-width: $basis;
}

// 사용 예시
.flex-item-half {
    @include flexbox(1, 0, 50%);
}

.flex-item-third {
    @include flexbox(1, 0, 33.333%);
}

.flex-item-auto {
    @include flexbox(1, 1, auto);
}
```

### 6.2 Typography Mixins

#### `@mixin font-size()` & `@mixin line-height()`
```scss
// 정의 (px → rem 자동 변환, 기준: 14px = 1rem)
@mixin font-size($size) {
    font-size: rem-calc($size);
}

@mixin line-height($size) {
    line-height: rem-calc($size);
}

// 사용 예시
h1 {
    @include font-size(32);      // font-size: 2.286rem
    @include line-height(40);    // line-height: 2.857rem
}

h2 {
    @include font-size(24);      // font-size: 1.714rem
    @include line-height(32);    // line-height: 2.286rem
}

.body-text {
    @include font-size(14);      // font-size: 1rem
    @include line-height(22);    // line-height: 1.571rem
}

.small {
    @include font-size(12);      // font-size: 0.857rem
}
```

#### `@mixin placeholder-color()`
```scss
// 정의 (모든 브라우저 대응)
@mixin placeholder-color($color) {
    &::-webkit-input-placeholder { color: $color; }
    &::-moz-placeholder { color: $color; }
    &:-ms-input-placeholder { color: $color; }
}

// 사용 예시
.custom-input {
    @include placeholder-color($color-muted);
}

.search-input {
    @include placeholder-color(#bdbdbd);
}
```

### 6.3 Responsive Mixin

#### `@mixin media-breakpoint-up()`
```scss
// 정의
@mixin media-breakpoint-up($name, $breakpoints: $grid-breakpoints) {
    $min: breakpoint-min($name, $breakpoints);
    @if $min {
        @media (min-width: $min) {
            @content;
        }
    } @else {
        @content;
    }
}

// 사용 예시
.responsive-element {
    width: 100%;

    @include media-breakpoint-up(sm) {
        width: 80%;
    }

    @include media-breakpoint-up(md) {
        width: 50%;
    }

    @include media-breakpoint-up(lg) {
        width: 33.333%;
    }
}
```

### 6.4 Utility Mixins

#### `@mixin clearfix`
```scss
// 정의
@mixin clearfix {
    &::after {
        clear: both;
        content: "";
        display: block;
    }
}

// 사용 예시
.float-container {
    @include clearfix;

    .left { float: left; }
    .right { float: right; }
}
```

#### `@mixin performance()`
```scss
// 정의 (애니메이션 성능 향상)
@mixin performance() {
    perspective: 1000px;
}

// 사용 예시
.animated-element {
    @include performance();
    transition: transform 0.3s ease;
}
```

### 6.5 Calendar/Widget Mixins

#### `@mixin cal-color()`
```scss
// 정의 (캘린더 이벤트 색상)
@mixin cal-color($bgcolor, $fcolor) {
    background-color: $bgcolor !important;
    color: $fcolor !important;
    border-left: solid 6px $fcolor !important;

    &.category-badge {
        border: 1px solid $fcolor !important;
    }
    &.schedule-item {
        background: var(--background-color) !important;
    }
}

// 사용 예시
.event-urgent {
    @include cal-color(#ffe5e5, #d2322d);
}

.event-meeting {
    @include cal-color(#e5f1ff, #007bff);
}

.event-complete {
    @include cal-color(#e5f7e5, #47a447);
}

.event-pending {
    @include cal-color(#fff5e5, #FF9F43);
}
```

### 6.6 Card Mixins

#### `@mixin card-header-transparent()`
```scss
// 정의
@mixin card-header-transparent() {
    background: none;
    border: 0;
    padding-left: 0;
    padding-right: 0;

    .card-actions {
        right: 0;
    }

    + .card-body {
        border-radius: var(--border-radius-xl);
    }
}

// 사용 예시
.card-transparent > .card-header {
    @include card-header-transparent();
}
```

---

## Part 7: Helper Functions (함수)

### 7.1 `rem()` - px → rem 변환

```scss
// 정의
@function rem($px, $base: 14px) {
    @return $px / $base * 1rem;
}

// 사용 예시
.element {
    padding: rem(20px);        // 1.429rem (20/14)
    margin: rem(16px, 16px);   // 1rem (기준 변경)
}
```

### 7.2 `rem-calc()` - px → rem 계산

```scss
// 정의 (기준: $root-font-size = 14px)
@function rem-calc($pixel) {
    $rem: $pixel / $root-font-size;
    @return #{$rem}rem;
}

// 사용 예시
.box {
    width: rem-calc(280);   // 20rem (280 / 14)
    height: rem-calc(140);  // 10rem (140 / 14)
    padding: rem-calc(21);  // 1.5rem (21 / 14)
}
```

### 7.3 `breakpoint-min()` / `breakpoint-infix()`

```scss
// breakpoint-min: 브레이크포인트 최소값 반환
@function breakpoint-min($name, $breakpoints: $grid-breakpoints) {
    $min: map-get($breakpoints, $name);
    @return if($min != 0, $min, null);
}

// breakpoint-infix: 반응형 클래스 접미사 생성
@function breakpoint-infix($name, $breakpoints: $grid-breakpoints) {
    @return if(breakpoint-min($name, $breakpoints) == null, "", "-#{$name}");
}

// 사용 예시
// breakpoint-min(md) → 768px
// breakpoint-min(xs) → null
// breakpoint-infix(md) → "-md"
// breakpoint-infix(xs) → ""
```

### 7.4 `str-replace()` - 문자열 치환

```scss
// 정의
@function str-replace($string, $search, $replace: '') {
    $index: str-index($string, $search);
    @if $index {
        @return str-slice($string, 1, $index - 1) + $replace +
                str-replace(str-slice($string, $index + str-length($search)), $search, $replace);
    }
    @return $string;
}

// 사용 예시
$class-name: str-replace("btn-primary", "primary", "custom");
// 결과: "btn-custom"
```

### 7.5 `to-string()` - 값을 문자열로 변환

```scss
// 정의
@function to-string($value) {
    @return inspect($value);
}

// 사용 예시
$number: 42;
$string: to-string($number);  // "42"
```

---

## Part 8: RTL (Right-to-Left) Support

### 8.1 Directional Variables

```scss
// 기본 방향 설정
$dir: ltr !default;

// 방향에 따른 left/right 자동 전환
$left: if-ltr(left, right);
$right: if-ltr(right, left);
```

### 8.2 RTL Functions

```scss
// LTR일 때 첫 번째 값, RTL일 때 두 번째 값 반환
@function if-ltr($if, $else: null) {
    @if $dir != rtl {
        @return $if;
    } @else {
        @return $else;
    }
}

@function if-rtl($if, $else: null) {
    @return if-ltr($else, $if);
}

// 4방향 값 재정렬 (RTL용)
@function side-values($values) {
    @if $dir == rtl and length($values) >= 4 {
        @return nth($values, 1) nth($values, 4) nth($values, 3) nth($values, 2);
    } @else {
        @return $values;
    }
}
```

### 8.3 RTL Mixins

```scss
// LTR 전용 스타일
@mixin if-ltr {
    @if $dir != rtl {
        @content;
    }
}

// RTL 전용 스타일
@mixin if-rtl {
    @if $dir == rtl {
        @content;
    }
}
```

### 8.4 RTL Usage Example

```scss
// 아이콘 위치 (LTR/RTL 자동 대응)
.btn-icon i {
    margin-#{$right}: 10px;  // LTR: margin-right, RTL: margin-left
}

.btn-icon-right i {
    margin-#{$right}: 0;
    margin-#{$left}: 10px;
}

// 패딩 (4방향 자동 재정렬)
.element {
    padding: side-values(10px 20px 10px 5px);
    // LTR: 10px 20px 10px 5px
    // RTL: 10px 5px 10px 20px
}
```

---

## Part 9: CSS Custom Properties (Design Tokens)

### 9.1 Light Theme Variables

```scss
:root,
[data-theme="light"] {
  // 배경 & 테두리
  --background-color: #fff;
  --border-color: #{$grey-50};
  --border-color-light: #{$grey-50};
  --border-color-dark: #{$grey-200};

  // 텍스트 색상
  --color: #{$grey-900};
  --h1-color: #{$grey-900};
  --h2-color: #{mix($grey-900, $grey-800)};
  --h3-color: #{$grey-800};
  --muted-color: #{$grey-500};

  // Primary 색상
  --primary: #0065D1;
  --primary-hover: hsl(211deg 100% 32%);
  --primary-inverse: #fff;

  // 폼 요소
  --form-element-background-color: #FFFFFF;
  --form-element-border-color: #{$grey-300};
  --form-element-active-border-color: var(--primary);

  // RealGrid 테이블
  --rgTable-background: #fff;
  --rgTable-header-background: #{$grey-5};
  --rgTable-hover-background: #{$grey-10};
  --rgTable-border-color: #{$grey-50};
}
```

### 9.2 Dark Theme Variables

```scss
[data-theme="dark"] {
  // 배경 & 테두리
  --background-color: #{$black-body-background};
  --border-color: #{$grey-700};
  --border-color-light: #{$grey-400};

  // 텍스트 색상
  --color: #{$grey-50};
  --h1-color: #{$grey-50};
  --muted-color: #{$grey-500};

  // Primary 색상
  --primary: #007bff;
  --primary-hover: #{$primary-600};
  --primary-inverse: #fff;

  // 폼 요소
  --form-element-background-color: #{mix($black, $grey-900, 37.5%)};
  --form-element-border-color: #{mix($grey-800, $grey-700)};

  // RealGrid 테이블
  --rgTable-background: #{$dark-color-4};
  --rgTable-header-background: #474F59;
  --rgTable-hover-background: #{$grey-800};
  --rgTable-border-color: #{$grey-600};
}
```

### 9.3 Using CSS Variables

```scss
// 테마 대응 컴포넌트
.themed-card {
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    color: var(--color);

    .card-header {
        border-bottom: 1px solid var(--border-color);
    }

    .card-title {
        color: var(--h2-color);
    }

    .card-text {
        color: var(--muted-color);
    }
}

// 폼 요소
.form-control {
    background-color: var(--form-element-background-color);
    border: 1px solid var(--form-element-border-color);
    color: var(--color);

    &:focus {
        border-color: var(--form-element-active-border-color);
    }
}
```

---

## Part 10: Component Styling Guidelines

### 10.1 Buttons (버튼)

```scss
// 기본 버튼 구조
.btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: calc(var(--block-spacing-vertical) * 0.375)
             calc(var(--block-spacing-horizontal) * 0.75);
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    font-size: 0.815rem;
    font-weight: var(--font-weight);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
}

// 크기 변형
.btn-xs { font-size: 0.7rem; }
.btn-sm { font-size: 0.815rem; }
.btn-lg { font-size: 0.815rem; padding: ... }
.btn-xl { font-size: 1rem; }

// 색상 변형 (자동 생성)
.btn-primary { background-color: $color-primary; }
.btn-success { background-color: $color-success; }
.btn-danger { background-color: $color-danger; }
.btn-outline-primary { border-color: $color-primary; }

// 특수 버튼
.btn-rounded { border-radius: 2rem; }
.btn-only-icon { width: 34px; height: 33px; }
```

### 10.2 Forms (폼)

```scss
// 폼 컨트롤
.form-control {
    width: 100%;
    padding: calc(var(--block-spacing-vertical) * 0.375)
             calc(var(--block-spacing-horizontal) * 0.75);
    font-size: var(--font-size);
    font-weight: $font-weight-normal;
    color: var(--color);
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);

    &:focus {
        box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
        border-color: #CCC;
    }

    &[disabled] {
        background-color: $grey-50;
        opacity: 0.65;
        filter: grayscale(90%);
    }
}

// 유효성 검사
input.valid-error {
    border-color: var(--danger) !important;
    background: url('../../img/require_icon.svg') no-repeat right 6px top 4px !important;
}

// 필수 필드
.required {
    color: $color-danger;
    font-size: 0.8em;
    font-weight: $font-weight-bold;
}
```

### 10.3 Cards (카드)

```scss
// 기본 카드
.card {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: var(--border-radius-xl);
}

.card-header {
    padding: 18px;
    background: #f6f6f6;
    border-bottom: 1px solid #DADADA;
    border-radius: calc(var(--border-radius-xl) * 0.6) calc(var(--border-radius-xl) * 0.6) 0 0;
}

.card-body {
    flex: 1 1 auto;
    padding: 1.25rem;
    background: var(--background-color);
    border-radius: var(--border-radius-xl);
}

.card-title {
    color: #33353F;
    font-size: 1.438rem;
    font-weight: $font-weight-bold;
    margin: 0;
}

// Featured 카드
.card-featured {
    border-top: $border-thick solid #33353F;
}

.card-featured-primary {
    border-color: $color-primary;
}
```

### 10.4 RealGrid Styling

```scss
// RealGrid 테마 변수 (CSS Custom Properties)
:root {
    --rgTable-background: #fff;
    --rgTable-header-background: #{$grey-5};
    --rgTable-footer-background: #{$grey-5};
    --rgTable-summary-background: #{$grey-10};
    --rgTable-hover-background: #{$grey-10};
    --rgTable-border-color: #{$grey-50};
}

[data-theme="dark"] {
    --rgTable-background: #{$dark-color-4};
    --rgTable-header-background: #474F59;
    --rgTable-footer-background: #474F59;
    --rgTable-summary-background: #282d33;
    --rgTable-hover-background: #{$grey-800};
    --rgTable-border-color: #{$grey-600};
}

// RealGrid 내 스타일
.grid-container {
    .rg-grid {
        background-color: var(--rgTable-background);
    }

    .rg-header {
        background-color: var(--rgTable-header-background);
    }

    .rg-cell:hover {
        background-color: var(--rgTable-hover-background);
    }
}
```

---

## Part 11: File Structure (파일 구조)

### 11.1 Directory Layout

```
css/sass/
├── theme.scss                    # ⭐ 메인 엔트리 (모든 파일 import)
│
├── config/                       # 설정 파일
│   ├── _variables.scss           # ⭐ 모든 SCSS 변수
│   ├── _mixins.scss              # ⭐ 재사용 믹스인
│   ├── _functions.scss           # 유틸리티 함수
│   ├── _helpers.scss             # rem 변환, font-size 등
│   └── _directional.scss         # RTL 지원
│
├── themes/                       # 테마 설정
│   └── default/
│       ├── default.scss          # 테마 엔트리
│       ├── _colors.scss          # ⭐ 색상 팔레트 정의
│       ├── _styles.scss          # 공통 스타일
│       ├── _light.scss           # ⭐ 라이트 테마 CSS Variables
│       └── _dark.scss            # ⭐ 다크 테마 CSS Variables
│
├── base/                         # 기본 레이아웃 (12 files)
│   ├── _skeleton.scss            # 기본 구조
│   ├── _layout-base.scss
│   ├── _sidebar-left.scss
│   ├── _header.scss
│   └── _menu.scss
│
├── gui/                          # UI 컴포넌트 (60+ files)
│   ├── _buttons.scss             # ⭐ 버튼
│   ├── _cards.scss               # ⭐ 카드
│   ├── _forms.scss               # ⭐ 폼
│   ├── _tables.scss              # 테이블
│   ├── _modals.scss              # 모달
│   ├── _alerts.scss              # 알림
│   ├── _badges.scss              # 배지
│   └── ... (60+ 컴포넌트)
│
├── partials/                     # 페이지별 스타일
│   ├── _calendar.scss
│   ├── _invoice.scss
│   └── _company-detail.scss
│
├── layouts/                      # 레이아웃 변형
│   └── _dark.scss                # 다크 모드 레이아웃
│
└── custom.scss                   # ⭐ 프로젝트별 커스텀 스타일
```

### 11.2 Import Order (theme.scss)

```scss
// 1. Config (변수, 함수, 믹스인)
@import "config/variables";
@import "config/functions";
@import "config/helpers";
@import "config/mixins";
@import "config/directional";

// 2. Fonts
@import "base/fonts";

// 3. Theme
@import "themes/default";

// 4. Base Layout
@import "base/skeleton";
@import "base/layout-base";
@import "base/header";
// ...

// 5. GUI Components
@import "gui/buttons";
@import "gui/cards";
@import "gui/forms";
// ... (60+ files)

// 6. Partials
@import "partials/calendar";
// ...

// 7. Layouts
@import "layouts/dark";

// 8. Custom (항상 마지막)
@import "custom";
```

### 11.3 Naming Conventions

```scss
// 파일명: 언더스코어 + 소문자
_variables.scss
_mixins.scss
_buttons.scss

// 변수: 하이픈 구분
$color-primary: #007bff;
$font-weight-bold: 600;
$spacement-md: 15px;

// 클래스: BEM-like (하이픈, 언더스코어)
.card { }
.card-header { }
.card-title { }
.btn-primary { }
.btn-outline-primary { }

// 상태: 하이픈
.btn-lg { }
.is-active { }
.has-error { }
```

---

## Part 12: Best Practices

### 12.1 변수 사용 원칙

```scss
// ✅ Good - 변수 사용
.element {
    color: $color-primary;
    padding: $spacement-md;
    font-weight: $font-weight-bold;
    border: $border-thin solid var(--border-color);
}

// ❌ Bad - 하드코딩
.element {
    color: #007bff;           // 변수 사용!
    padding: 15px;            // $spacement-md 사용!
    font-weight: 600;         // $font-weight-bold 사용!
    border: 1px solid #ccc;   // 변수 사용!
}
```

### 12.2 rem 단위 사용

```scss
// ✅ Good - 믹스인/함수 사용
.text {
    @include font-size(16);    // 자동 rem 변환
    @include line-height(24);
    padding: rem-calc(20);     // 20 / 14 = 1.429rem
}

// ❌ Bad - px 하드코딩
.text {
    font-size: 16px;           // rem 사용!
    line-height: 24px;
    padding: 20px;
}
```

### 12.3 믹스인 vs 직접 작성

```scss
// ✅ Good - 믹스인 활용
.centered-box {
    @include flex(center, center);
}

.responsive {
    @include media-breakpoint-up(md) {
        width: 50%;
    }
}

// ❌ Bad - 반복 작성
.centered-box {
    display: flex;
    justify-content: center;
    align-items: center;
}

.responsive {
    @media (min-width: 768px) {
        width: 50%;
    }
}
```

### 12.4 다크모드 고려사항

```scss
// ✅ Good - CSS Variables 사용 (자동 대응)
.card {
    background-color: var(--background-color);
    color: var(--color);
    border-color: var(--border-color);
}

// ✅ Good - 명시적 다크모드 스타일
[data-theme=dark] {
    .custom-element {
        background-color: $dark-color-3;
        color: $dark-default-text;
    }
}

// ❌ Bad - 테마 미고려
.card {
    background-color: #fff;   // 다크모드에서 깨짐
    color: #333;
}
```

### 12.5 성능 최적화

```scss
// ✅ Good - 필요한 곳에만 import
// custom.scss 에서만 사용
@use "../config/variables";

// ✅ Good - 중첩 최소화 (3레벨 이하)
.card {
    .card-header {
        .card-title { }  // OK - 3레벨
    }
}

// ❌ Bad - 과도한 중첩 (4레벨 이상)
.page {
    .section {
        .card {
            .card-header {
                .card-title { }  // 너무 깊음!
            }
        }
    }
}
```

### 12.6 파일 수정 원칙

```
📁 수정 가능한 파일:
├── custom.scss              # ⭐ 모든 커스텀 스타일
├── config/_variables.scss   # 변수 추가/수정 (주의)
└── config/_mixins.scss      # 믹스인 추가 (주의)

📁 수정 금지 파일:
├── gui/*                    # 기본 컴포넌트
├── base/*                   # 기본 레이아웃
└── themes/*                 # 테마 설정
```

---

## Part 13: Examples (실전 예제)

### 13.1 새 컴포넌트 추가하기

```scss
// custom.scss에 추가

// 대시보드 카드
.dashboard-card {
    // 색상 변수 사용
    background-color: var(--background-color);
    border: $border-thin solid var(--border-color);

    // 간격 변수 사용
    padding: $spacement-lg;
    margin-bottom: $spacement-md;

    // 믹스인 사용
    @include flex(space-between, center);

    // 제목
    .dashboard-card-title {
        @include font-size(18);
        font-weight: $font-weight-bold;
        color: var(--h2-color);
    }

    // 값
    .dashboard-card-value {
        @include font-size(24);
        font-weight: $font-weight-black;
        color: $color-primary;
    }

    // 반응형
    @include media-breakpoint-up(md) {
        padding: $spacement-xl;
    }

    // 다크 모드
    [data-theme=dark] & {
        border-color: $dark-color-3;
    }
}
```

### 13.2 상태별 버튼 그룹

```scss
// 승인 상태 버튼 그룹
.approval-buttons {
    @include flex(center, center);
    gap: $spacement-sm;

    .btn-approve {
        background-color: $color-success;
        color: $color-success-inverse;

        &:hover {
            background-color: darken($color-success, 10%);
        }
    }

    .btn-reject {
        background-color: $color-danger;
        color: $color-danger-inverse;

        &:hover {
            background-color: darken($color-danger, 10%);
        }
    }

    .btn-pending {
        background-color: $color-warning;
        color: $color-warning-inverse;
    }
}
```

### 13.3 반응형 그리드 레이아웃

```scss
// 반응형 카드 그리드
.card-grid {
    display: grid;
    gap: $spacement-md;

    // 모바일: 1열
    grid-template-columns: 1fr;

    // 태블릿: 2열
    @include media-breakpoint-up(md) {
        grid-template-columns: repeat(2, 1fr);
        gap: $spacement-lg;
    }

    // 데스크탑: 3열
    @include media-breakpoint-up(lg) {
        grid-template-columns: repeat(3, 1fr);
    }

    // 대형: 4열
    @include media-breakpoint-up(xl) {
        grid-template-columns: repeat(4, 1fr);
        gap: $spacement-xl;
    }
}
```

### 13.4 테마 대응 폼

```scss
// 완전한 테마 대응 폼 그룹
.form-group-themed {
    margin-bottom: $spacement-md;

    label {
        display: block;
        margin-bottom: $spacement-xs;
        @include font-size(13);
        font-weight: $font-weight-normal;
        color: var(--color);
    }

    .form-control {
        width: 100%;
        padding: $spacement-sm $spacement-md;
        background-color: var(--form-element-background-color);
        border: $border-thin solid var(--form-element-border-color);
        border-radius: var(--border-radius);
        color: var(--color);
        @include placeholder-color(var(--muted-color));

        &:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.2rem var(--primary-focus);
        }

        &[disabled] {
            background-color: var(--form-element-disabled-background-color);
            opacity: var(--form-element-disabled-opacity);
        }
    }

    .form-text {
        @include font-size(12);
        color: var(--muted-color);
        margin-top: $spacement-xs;
    }
}
```

---

## 🔗 관련 문서

- **팝업 가이드**: [POPUP_GUIDE.md](./POPUP_GUIDE.md) - 팝업 디자인 및 템플릿
- **Frontend 리소스**: [RESOURCES.md](./RESOURCES.md) - 라이브러리 버전 정보
- **프로젝트 구조**: [../CLAUDE.md](../CLAUDE.md) - 전체 프로젝트 가이드
- **KiiPS-UI**: [../KiiPS-UI/CLAUDE.md](../KiiPS-UI/CLAUDE.md) - UI 모듈 상세

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-13 | 종합 가이드로 대폭 확장 (13KB → 30KB+) |
| 1.0 | 2025-12-29 | 초기 버전 - Quick Reference 중심 |

---

**Version**: 2.0 (Comprehensive Edition)
**Maintained By**: KiiPS Development Team
**Source**: `/KiiPS-UI/src/main/resources/static/css/sass/`
