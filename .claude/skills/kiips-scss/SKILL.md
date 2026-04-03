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
├── config/_variables.scss    # 라이트/다크 변수 정의
├── themes/default/
│   ├── _variables.scss       # 라이트 테마 변수
│   └── _dark.scss            # 다크 테마 mixin
├── layouts/
│   └── _dark.scss            # 다크 테마 컴포넌트 스타일
├── custom.scss               # 커스텀 컴포넌트 (라이트+다크)
└── theme.scss                # 엔트리포인트 (@import "custom")
```

**컴파일**: `sass theme.scss theme.css --no-source-map`
**로드**: `header.jsp` → `theme.css`

---

## 다크 테마 변수 (config/_variables.scss)

```scss
$dark-bg: #1d2127;
$dark-default-text: #eeeeee;
$dark-color-1: $dark-bg;                    // 기본 배경
$dark-color-2: lighten($dark-color-1, 2%);  // 약간 밝은 배경
$dark-color-3: lighten($dark-color-1, 5%);  // 카드/패널 배경
$dark-color-4: lighten($dark-color-1, 8%);  // 테두리
$dark-color-5: lighten($dark-color-1, 3%);
$dark-color-6: lighten($dark-color-1, 9%);
$darken-color-1: darken($dark-color-1, 2%);
```

---

## 다크 테마 규칙 (CRITICAL)

### 셀렉터
```scss
// SCSS에서
[data-theme=dark] .my-component { ... }
// 또는 nesting
.my-component {
  [data-theme=dark] & { ... }
}

// 금지
.dark { ... }           // ❌
.theme-dark { ... }     // ❌
```

### 색상만 변경 (레이아웃 금지)

**변경 가능**: `color`, `background-color`, `border-color`, `box-shadow`, `fill`, `stroke`

**변경 불가**: `width`, `height`, `display`, `position`, `margin`, `padding`, `font-size`

---

## 안티패턴 & 올바른 패턴

### 1. 인라인 style 배경색/글자색 금지

```html
<!-- ❌ 다크테마 오버라이드 불가 -->
<div style="background-color:#f8f9fa; color:#333;">

<!-- ✅ CSS 클래스 사용 -->
<div class="summary-bar">
```

```scss
// ✅ 라이트 + 다크 쌍으로 정의
.summary-bar {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}
[data-theme=dark] .summary-bar {
  background-color: $dark-color-3;
  border-color: $dark-color-4;
  color: $dark-default-text;
}
```

### 2. RealGrid 커스텀 렌더러 다크테마 처리

```javascript
// ❌ 하드코딩 색상 → 다크모드에서 글씨 안 보임
label.style.cssText = "color:#333;";
barBg.style.cssText = "background:#e9ecef;";

// ✅ 테마 감지 후 분기
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
label.style.color = isDark ? "#ddd" : "#333";
barBg.style.background = isDark ? "#3a3f47" : "#e9ecef";
```

### 3. JS로 동적 생성하는 DOM 요소

```javascript
// ❌ JS에서 인라인 색상 하드코딩
el.style.color = "#333";
el.style.backgroundColor = "#fff";

// ✅ 방법 1: CSS 클래스 부여 → SCSS에서 다크테마 처리
el.classList.add("my-dynamic-element");

// ✅ 방법 2: 불가피 시 테마 감지
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
el.style.color = isDark ? "$dark-default-text 값" : "#333";
```

### 4. Bootstrap 유틸 클래스 주의

```html
<!-- ⚠️ bg-light, bg-white 등은 다크테마에서 오버라이드 확인 필요 -->
<!-- bg-white는 layouts/_dark.scss에서 $dark-color-2로 오버라이드됨 -->
<div class="bg-white">  <!-- ✅ 다크 지원됨 -->

<!-- ⚠️ text-dark, text-muted 등은 다크에서 안 보일 수 있음 -->
<span class="text-dark">  <!-- ❌ 다크모드에서 안 보임 -->
```

---

## 다크테마 체크리스트 (UI 요소 추가 시)

새 UI 요소를 추가할 때 반드시 확인:

1. [ ] 인라인 `style`에 `color`, `background-color`, `border-color` 없는지
2. [ ] CSS 클래스에 `[data-theme=dark]` 오버라이드가 있는지
3. [ ] JS 커스텀 렌더러에서 하드코딩 색상 없는지
4. [ ] `text-dark`, `bg-light` 등 Bootstrap 유틸이 다크 지원되는지
5. [ ] SCSS 컴파일 후 `theme.css`에 반영 확인

---

## 커스텀 컴포넌트 추가 프로세스

1. `custom.scss` 끝에 라이트 스타일 추가
2. 바로 아래에 `[data-theme=dark]` 오버라이드 추가
3. SCSS 컴파일: `sass theme.scss theme.css --no-source-map`
4. 컴파일 결과에서 새 클래스 포함 확인

```scss
/* 예시: 새 컴포넌트 */
.my-component {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}
[data-theme=dark] .my-component {
  background-color: $dark-color-3;
  color: $dark-default-text;
  border-color: $dark-color-4;
}
```

---

## 색상 매핑 가이드

| 용도 | 라이트 | 다크 (변수) |
|------|--------|------------|
| 페이지 배경 | `#f8f9fa` | `$dark-bg` (#1d2127) |
| 카드/패널 배경 | `#fff` | `$dark-color-3` |
| 텍스트 | `#333` | `$dark-default-text` (#eee) |
| 보조 텍스트 | `#666` | `#aaa` |
| 테두리 | `#dee2e6` | `$dark-color-4` |
| 입력 배경 | `#e9ecef` | `#3a3f47` |
| 비활성 | `#6c757d` | `#888` |

---

**Version**: 3.0.0
