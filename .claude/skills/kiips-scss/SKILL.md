---
name: kiips-scss
description: "SCSS 테마 시스템, 다크테마 적용, 디자인 토큰 관리 통합. Use when: SCSS, 스타일, 테마, 다크테마, dark theme, 다크모드, CSS 변수, 믹스인"
disable-model-invocation: true
---

# KiiPS SCSS & Theme (통합)

> kiips-scss-theme-manager + kiips-darktheme-applier 통합

---

## 파일 구조

```
KiiPS-UI/src/main/resources/static/css/sass/
├── themes/default/
│   ├── _variables.scss      # 라이트 테마 변수
│   └── _dark.scss           # 다크 테마 변수 ($dark-bg, $dark-color-2, ...)
├── layouts/
│   └── _dark.scss           # 다크 테마 컴포넌트 스타일
└── components/              # 개별 컴포넌트 스타일
```

---

## 다크 테마 규칙 (CRITICAL)

### 셀렉터
```scss
// 올바른 셀렉터
[data-theme=dark] { ... }

// 금지 셀렉터
.dark { ... }           // ❌
.theme-dark { ... }     // ❌
```

### 색상만 변경 (레이아웃 금지)

**변경 가능**: `color`, `background-color`, `border-color`, `box-shadow`, `fill`, `stroke`

**변경 불가**: `width`, `height`, `display`, `position`, `margin`, `padding`, `font-size`

### SCSS 변수 사용

```scss
[data-theme=dark] {
  background-color: $dark-bg;         // 배경
  color: $dark-color-2;               // 텍스트
  border-color: $dark-border-color;   // 테두리
}
```

---

## 디자인 토큰

### 라이트 테마 (기본값)
```scss
$primary: #0d6efd;
$body-bg: #f8f9fa;
$body-color: #212529;
```

### 다크 테마
```scss
$dark-bg: #1a1a2e;
$dark-color-2: #e0e0e0;
$dark-border-color: #333;
$dark-card-bg: #16213e;
```

---

## 작업 프로세스

1. `_dark.scss` (themes/) 에서 변수 확인
2. `_dark.scss` (layouts/) 에서 컴포넌트 스타일 작업
3. `[data-theme=dark]` 셀렉터만 사용
4. 색상만 변경 (레이아웃 절대 금지)
5. SCSS 컴파일 확인 (scssValidator.sh 자동 실행)

---

**Merged from**: kiips-scss-theme-manager, kiips-darktheme-applier
**Version**: 2.0.0
