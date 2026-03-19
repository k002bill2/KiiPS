---
name: kiips-darktheme-applier
description: "다크테마 전용 적용 워크플로우 - [data-theme=dark] 셀렉터 패턴, 색상 전용 변경, SCSS 변수 활용. Use when: 다크테마, dark theme, 다크모드, dark mode, 다크 적용"
---

# KiiPS Dark Theme Applier

다크테마 적용 전용 워크플로우 Skill입니다. 일반 SCSS 테마 관리(`kiips-scss-theme-manager`)와 달리, **다크테마 적용에 특화**된 규칙과 체크리스트를 제공합니다.

## 📋 Purpose

### What This Skill Does
- **다크테마 전용 적용**: `[data-theme=dark]` 셀렉터 기반 색상 변경
- **레이아웃 보호**: 다크테마에서 레이아웃 속성 변경 방지
- **SCSS 변수 활용**: 기존 다크테마 변수 일관 사용
- **단계별 워크플로우**: 안전한 적용 절차 제공

### What This Skill Does NOT Do
- 일반 SCSS 테마/디자인 토큰 관리 → `kiips-scss-theme-manager` 사용
- 반응형 디자인 검증 → `kiips-responsive-validator` 사용
- CSS 파일 직접 수정 (SCSS만 수정)

## 🎯 When to Use

### Keywords
```
"다크테마", "다크모드", "dark theme", "dark mode", "테마 적용",
"[data-theme=dark]", "야간 모드", "어두운 테마"
```

### File Patterns
```
수정 대상: KiiPS-UI/src/main/resources/static/css/sass/**/*.scss
변수 참조: themes/default/_dark.scss
컴포넌트 참조: layouts/_dark.scss
```

---

## 🚫 Strict Rules

### 1. 셀렉터 패턴

**허용:**
```scss
[data-theme=dark] {
    .component { color: $dark-color-2; }
}

[data-theme=dark] .sidebar { background: $dark-bg; }
```

**금지:**
```scss
// ❌ 절대 사용하지 말 것
.dark { ... }
.theme-dark { ... }
body.dark-mode { ... }
html.dark { ... }
```

### 2. 허용/금지 CSS 속성

| 허용 (색상 관련) | 금지 (레이아웃 관련) |
|------------------|---------------------|
| `color` | `width` |
| `background-color` | `height` |
| `background` | `display` |
| `border-color` | `position` |
| `box-shadow` | `margin` |
| `outline-color` | `padding` |
| `fill` (SVG) | `flex` |
| `stroke` (SVG) | `grid` |
| `opacity` | `float` |
| `filter` (brightness 등) | `top/right/bottom/left` |

### 3. `!important` 사용 규칙

```scss
// ✅ 허용: 인라인 스타일 오버라이드
[data-theme=dark] .element[style*="color"] {
    color: $dark-color-2 !important;
}

// ❌ 금지: 일반 스타일에 !important
[data-theme=dark] .card {
    background: $dark-bg !important;  // ← 불필요
}
```

### 4. SCSS 변수 사용

기존 다크테마 변수를 반드시 활용합니다:

```scss
// 주요 변수 (themes/default/_dark.scss 참조)
$dark-bg             // 기본 배경색
$dark-color-2        // 보조 텍스트/배경
$dark-color-3        // 3차 배경
$dark-border         // 테두리 색상
$dark-text           // 기본 텍스트
$dark-text-muted     // 비활성 텍스트
$dark-hover          // 호버 상태
$dark-active         // 활성 상태
$dark-shadow         // 그림자
```

**새 색상이 필요하면**: `_dark.scss`에 변수를 먼저 추가한 후 사용

---

## 📝 적용 워크플로우

### Step 1: 대상 파일 확인
```
□ 수정할 SCSS 파일 경로 확인
□ 해당 파일에 기존 [data-theme=dark] 블록 있는지 확인
□ themes/default/_dark.scss에서 사용 가능한 변수 확인
```

### Step 2: 기존 스타일 분석
```
□ 라이트 테마에서의 현재 색상 값 파악
□ 대응되는 다크 테마 변수 매핑
□ 인라인 스타일 사용 여부 확인 (!important 필요성 판단)
```

### Step 3: SCSS 수정
```
□ [data-theme=dark] 셀렉터 사용
□ 색상 관련 속성만 변경
□ SCSS 변수 사용 (raw hex 금지)
□ !important는 인라인 오버라이드 시에만
```

### Step 4: 검증
```
□ .dark / .theme-dark 셀렉터 미사용 확인
□ 레이아웃 속성 미변경 확인
□ 기존 라이트 테마 스타일 영향 없음 확인
□ SCSS 컴파일 오류 없음 확인
```

---

## 📂 참조 파일

| 파일 | 역할 |
|------|------|
| `themes/default/_dark.scss` | 다크테마 변수 정의 |
| `layouts/_dark.scss` | 레이아웃 컴포넌트 다크테마 |
| `CLAUDE.md > Dark Theme Rules` | 프로젝트 전역 규칙 |

---

## 💡 Common Patterns

### 카드 컴포넌트
```scss
[data-theme=dark] {
    .card {
        background-color: $dark-color-2;
        border-color: $dark-border;
        color: $dark-text;
    }
    .card-header {
        background-color: $dark-color-3;
        border-color: $dark-border;
    }
}
```

### 테이블
```scss
[data-theme=dark] {
    .table {
        color: $dark-text;
        border-color: $dark-border;

        th { background-color: $dark-color-3; }
        td { background-color: $dark-color-2; }
        tr:hover td { background-color: $dark-hover; }
    }
}
```

### 폼 요소
```scss
[data-theme=dark] {
    .form-control {
        background-color: $dark-color-2;
        border-color: $dark-border;
        color: $dark-text;

        &::placeholder { color: $dark-text-muted; }
        &:focus { border-color: $primary; }
    }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2026-02-06
