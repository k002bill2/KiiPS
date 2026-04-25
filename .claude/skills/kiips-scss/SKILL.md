---
name: kiips-scss
description: "SCSS 테마 시스템, 시스템 변수(디자인 토큰) 기반 색상 작성, 다크테마 적용 통합. Use when: SCSS, 스타일, 테마, 다크테마, dark theme, 다크모드, CSS 변수, 시스템 변수, 디자인 토큰, color token, var(--*), 새 페이지, 화면 수정"
disable-model-invocation: true
---

# KiiPS SCSS & Theme (통합)

> kiips-scss-theme-manager + kiips-darktheme-applier 통합. v3.1.0 부터 "시스템 변수 우선 원칙" 추가.

---

## 파일 구조

```
KiiPS-UI/src/main/resources/static/css/sass/
├── config/_variables.scss    # 라이트/다크 변수 정의 (레거시)
├── themes/default/
│   ├── _colors.scss          # SCSS 색상 변수 ($grey-*, $primary-*)
│   ├── _light.scss           # 라이트 모드 CSS 커스텀 프로퍼티 (--*)
│   ├── _dark.scss            # 다크 모드 CSS 커스텀 프로퍼티 오버라이드
│   ├── _styles.scss
│   └── _variables.scss       # 라이트 테마 변수
├── layouts/
│   └── _dark.scss            # 다크 테마 컴포넌트 스타일 (레거시 클래스 오버라이드)
├── index/_index_style.scss   # 페이지/위젯별 정의
├── custom.scss               # 커스텀 컴포넌트 (라이트+다크)
└── theme.scss                # 엔트리포인트
```

**컴파일**: Maven `mvn clean package -DskipTests` 또는 `sass theme.scss theme.css --no-source-map`
**로드**: `header.jsp` → `theme.css`

---

## 🆕 시스템 변수 우선 원칙 (신규 페이지/화면 수정 시 1순위)

> **새 페이지 생성 또는 화면 수정 시 색상은 반드시 `themes/default/` 의 시스템 변수 기반으로 작성.**
> hex 하드코딩 금지. 예외 시 사유 주석 필수.

### 색상 선택 결정 트리

```
1. 라이트/다크 자동 적응 필요?
   → CSS 커스텀 프로퍼티 var(--*) 사용  ← 1순위
   예: var(--primary), var(--color), var(--muted-color)

2. 라이트/다크 동일한 정적 색상?
   → SCSS 변수 ($grey-*, $primary-*) 사용  ← 2순위
   예: $grey-5, $primary-50

3. 위 둘 다 매핑 안 되는 특수 색상?
   → 하드코딩 허용 + 사유 주석 필수  ← 예외
   예: rgba 가 있는 alpha tint, 시스템에 없는 hex

4. 레거시 다크 전용 변수가 이미 사용 중인 영역?
   → $dark-color-* 호환 유지 가능 (신규 작성 시는 var(--*) 우선)
```

### 시스템 변수 카탈로그

#### A. CSS 커스텀 프로퍼티 (`themes/default/_light.scss` + `_dark.scss`)
런타임에 `[data-theme=dark]` 토글로 자동 적응. **별도 다크 오버라이드 블록 불필요**.

| 변수 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `--primary` | `#007bff` | `$primary-400` ≈ `#5b95eb` | 강조/링크/active |
| `--primary-hover` | `hsl(211 100% 32%)` ≈ `#005fa3` | `$primary-600` | hover 진한 파랑 |
| `--secondary` | `#6c757d` | `$grey-600` | 보조 |
| `--success` | `#5EDC98` | (동일) | 성공 |
| `--info` | `#40a8ad` | `#6ee6eb` | 정보 |
| `--warning` | `#FFAE55` | (동일) | 경고 |
| `--danger` | `#dc3545` | (동일) | 위험/삭제 |
| `--color` | `$grey-900` ≈ `#262626` | `$grey-50` ≈ `#e6e6e6` | 본문 텍스트 |
| `--h1-color` ~ `--h6-color` | `$grey-900` 계열 | `$grey-50` 계열 | 헤딩 텍스트 |
| `--muted-color` | `$grey-400` ≈ `#969696` | `$grey-500` ≈ `#808080` | 보조/캡션 |
| `--border-color` / `--border-color-light` / `--border-color-dark` | `$grey-50/50/200` | `$grey-700/400/900` | 테두리 |
| `--background-color` | (미정의 — 라이트는 흰색 기본) | `$black-body-background` ≈ `#282d36` | 다크 카드 배경 |

#### B. SCSS 변수 (`themes/default/_colors.scss`)
컴파일 시점 hex 치환. 라이트/다크 동일하게 정적.

| 변수 | hex | 용도 |
|------|-----|------|
| `$grey-5` | `#fafafa` | 가장 밝은 배경 |
| `$grey-10` | `#f0f0f0` | 라이트 보조 배경 |
| `$grey-50` ~ `$grey-900` | hsl(0 0% 90%~15%) | 회색 9단계 |
| `$primary-50` | `#e3edfe` | primary 밝은 배경(badge, active bg) |
| `$primary-100` ~ `$primary-900` | hsl(216 …) | primary 9단계 |
| `$black`, `$white` | `#000`, `#fff` | 순색 |
| `$black-body-background` | `rgb(40, 45, 54)` | 다크 페이지 배경 (=`var(--background-color)` 다크) |

#### C. 다크 전용 변수 (`config/_variables.scss`) — 레거시 호환
`$dark-bg`, `$dark-color-1`~`6`, `$dark-default-text` 등. **신규 작성 시 비권장 — `var(--*)` 우선.**
기존 코드 호환을 위해 유지. `layouts/_dark.scss` 에서 광범위하게 사용 중.

### 매핑 룰 (신규 위젯 색상 작성 시 1순위)

| 용도 | 권장 매핑 |
|------|----------|
| 본문 텍스트 (#222, #333 류) | `var(--color)` |
| 제목/셀 텍스트 (#333, #444 류) | `var(--h3-color)` 또는 `var(--color)` |
| 보조/캡션/회색 텍스트 (#666, #888 류) | `var(--muted-color)` |
| primary 강조/링크/active 텍스트 | `var(--primary)` |
| primary 밝은 배경 (badge bg, active bg) | `$primary-50` |
| 일반 카드 배경 (라이트만 강제 시) | `$grey-5` 또는 `$grey-10` |
| 다크 카드 배경 (다크 오버라이드 영역) | `var(--background-color)` |
| 테두리 | `var(--border-color-light)` |
| primary hover | `var(--primary-hover)` |
| 상태 색상 | `var(--success / --info / --warning / --danger)` |

### 다크테마 오버라이드 최소화

`var(--*)` 사용 시 다크 자동 적응되므로 **별도 `[data-theme=dark]` 블록 작성 불필요**. 코드 절반으로 축소.

```scss
// ✅ 권장 — 한 번 작성으로 라이트/다크 모두 적용
.my-widget {
  color: var(--color);
  background-color: var(--background-color);
  border: 1px solid var(--border-color-light);
}

// ❌ 비권장 — var(--*) 가 자동 적응됨에도 불필요한 오버라이드
.my-widget {
  color: #333;
  background-color: #fafafa;
}
[data-theme=dark] .my-widget {
  color: #e5e7eb;
  background-color: #272d36;
}
```

### 예외 처리 — alpha / 매칭 없는 색상

```scss
// alpha 가 들어간 primary tint — 변수화 시 --primary-rgb 도입 필요
&:hover { background-color: rgba(0, 95, 238, 0.04); }

// 시스템 변수에 대응 hex 없음 (themes/default 추가 검토)
.dark-special-bg {
  background-color: #1f2a44;  // 사유: 다크 primary tint, 추후 $primary-900 도입 검토
}
```

---

## 다크 테마 변수 (config/_variables.scss) — 레거시

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

이 변수들은 `layouts/_dark.scss` 의 광범위한 컴포넌트 오버라이드에서 사용 중. 신규 작성 시 `var(--*)` 우선이지만 기존 컴포넌트 수정 시 호환 유지 가능.

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
// ✅ 라이트 + 다크 쌍으로 정의 (시스템 변수 우선)
.summary-bar {
  background-color: var(--background-color);
  border: 1px solid var(--border-color-light);
  color: var(--color);
}
// var(--*) 사용 시 [data-theme=dark] 오버라이드 불필요
```

### 2. RealGrid 커스텀 렌더러 다크테마 처리

```javascript
// ❌ 하드코딩 색상 → 다크모드에서 글씨 안 보임
label.style.cssText = "color:#333;";
barBg.style.cssText = "background:#e9ecef;";

// ✅ 테마 감지 후 분기 (CSS 변수는 인라인 style 에서 직접 못 읽으므로 분기)
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
label.style.color = isDark ? "#e6e6e6" : "#262626";
barBg.style.background = isDark ? "#3a3f47" : "#e9ecef";
```

### 3. JS로 동적 생성하는 DOM 요소

```javascript
// ❌ JS에서 인라인 색상 하드코딩
el.style.color = "#333";
el.style.backgroundColor = "#fff";

// ✅ 방법 1: CSS 클래스 부여 → SCSS 에서 var(--*) 처리
el.classList.add("my-dynamic-element");

// ✅ 방법 2: 불가피 시 테마 감지
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
el.style.color = isDark ? "#e6e6e6" : "#262626";
```

### 4. Bootstrap 유틸 클래스 주의

```html
<!-- ⚠️ bg-light, bg-white 등은 다크테마에서 오버라이드 확인 필요 -->
<!-- bg-white는 layouts/_dark.scss에서 $dark-color-2로 오버라이드됨 -->
<div class="bg-white">  <!-- ✅ 다크 지원됨 -->

<!-- ⚠️ text-dark, text-muted 등은 다크에서 안 보일 수 있음 -->
<span class="text-dark">  <!-- ❌ 다크모드에서 안 보임 -->
```

### 5. 🆕 시스템 변수 무시하고 hex 하드코딩 금지

```scss
// ❌ 디자인 토큰 일관성 깨짐, 다크테마 자동 적응 불가
.new-widget {
  color: #005fee;            // primary 인데 하드코딩
  background-color: #fafafa; // grey-5 인데 하드코딩
  border: 1px solid #e6e6e6; // grey-50 인데 하드코딩
}
[data-theme=dark] .new-widget {  // 불필요한 오버라이드 추가 발생
  color: #5ea0ff;
  background-color: #272d36;
  border-color: #969696;
}

// ✅ 시스템 변수 기반 — 다크 오버라이드도 자동
.new-widget {
  color: var(--primary);
  background-color: $grey-5;
  border: 1px solid var(--border-color-light);
}
```

---

## 신규 페이지/화면 작성 체크리스트

새 UI 요소 추가 시 반드시 확인:

1. [ ] 인라인 `style`에 `color`, `background-color`, `border-color` 없는지
2. [ ] **색상은 `var(--*)` 또는 `$grey-*`/`$primary-*` 시스템 변수 사용했는지** 🆕
3. [ ] hex 하드코딩이 있다면 **사유 주석** 있는지 (alpha/매칭 없는 색상만 허용) 🆕
4. [ ] `var(--*)` 사용 시 별도 `[data-theme=dark]` 오버라이드를 **추가하지 않았는지** (자동 적응) 🆕
5. [ ] CSS 클래스에 `[data-theme=dark]` 오버라이드가 필요한 경우만 추가했는지 (레거시 변수 사용 시)
6. [ ] JS 커스텀 렌더러에서 하드코딩 색상이 테마 분기로 처리됐는지
7. [ ] `text-dark`, `bg-light` 등 Bootstrap 유틸이 다크 지원되는지
8. [ ] SCSS 컴파일 후 `theme.css`에 반영 확인 (`mvn clean package -DskipTests`)

---

## 커스텀 컴포넌트 추가 프로세스 (시스템 변수 기반)

1. `custom.scss` 또는 `index/_index_style.scss` 끝에 컴포넌트 추가
2. **색상은 `var(--*)` / `$grey-*` / `$primary-*` 우선 사용**
3. `var(--*)` 만 쓰면 다크 오버라이드 블록 작성 불필요
4. SCSS 컴파일: `mvn clean package -DskipTests` 또는 `sass theme.scss theme.css`
5. 컴파일 결과에서 새 클래스 포함 확인

```scss
/* ✅ 권장 패턴 — 시스템 변수만 사용, 한 블록으로 라이트/다크 동시 지원 */
.my-component {
  background-color: $grey-5;
  color: var(--color);
  border: 1px solid var(--border-color-light);

  &.active {
    background-color: $primary-50;
    color: var(--primary);
  }

  .heading {
    color: var(--h3-color);
  }

  .caption {
    color: var(--muted-color);
  }
}

/* 다크 전용 추가 조정이 필요할 때만 — 흔치 않음 */
[data-theme=dark] .my-component {
  background-color: var(--background-color);  // 다크에서 카드 배경 명시
}
```

---

## 색상 매핑 가이드 (통합)

| 용도 | 1순위: 시스템 변수 | 2순위: SCSS 변수 | 레거시 (`$dark-*`) |
|------|------------------|----------------|--------------------|
| 페이지 배경 (다크) | `var(--background-color)` | `$black-body-background` | `$dark-bg` |
| 카드/패널 배경 (라이트) | — | `$grey-5` | `#fff` |
| 카드/패널 배경 (다크) | `var(--background-color)` | — | `$dark-color-3` |
| 본문 텍스트 | `var(--color)` | — | `$dark-default-text` (다크) |
| 제목 텍스트 | `var(--h3-color)` | — | `$dark-default-text` |
| 보조 텍스트 | `var(--muted-color)` | — | `#aaa` (다크) |
| 테두리 | `var(--border-color-light)` | `$grey-50` | `$dark-color-4` |
| 입력 배경 (다크) | — | — | `#3a3f47` |
| 비활성 | `var(--secondary)` 또는 `var(--muted-color)` | — | `#888` |
| primary 강조 | `var(--primary)` | — | — |
| primary 밝은 배경 | — | `$primary-50` | — |
| primary hover | `var(--primary-hover)` | `$primary-600` | — |

> 신규 작성 시 1순위 컬럼에서 선택. 1순위에 없을 때만 2순위/레거시 사용.

---

## 검증 명령

```bash
# SCSS 컴파일 검증
cd KiiPS-UI && mvn clean package -DskipTests   # BUILD SUCCESS 확인

# 시스템 변수 사용 여부 grep (특정 위젯 영역)
grep -nE "color: #[0-9a-fA-F]" path/to/_xxx.scss   # 0건이면 OK
grep -nE "var\(--|^\\\$grey-|^\\\$primary-" path/to/_xxx.scss   # 시스템 변수 사용 카운트
```

---

**Version**: 3.1.0 (시스템 변수 우선 원칙 + 카탈로그 추가)
