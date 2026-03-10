# Dark Theme Rules

> CLAUDE.md에서 분리된 다크테마 상세 규칙

## 규칙 테이블

| 규칙 | 상세 |
|------|------|
| 셀렉터 | `[data-theme=dark]` 만 사용 (`.dark`, `.theme-dark` 금지) |
| !important | 인라인 스타일 오버라이드 시에만 사용 |
| 파일 대상 | SCSS 파일만 수정 (CSS 직접 수정 금지) |
| 레이아웃 금지 | width/height/display/position/margin/padding 변경 금지 |
| 변수 사용 | `$dark-bg`, `$dark-color-2` 등 기존 변수 활용 |
| 참조 파일 | `themes/default/_dark.scss` (변수), `layouts/_dark.scss` (컴포넌트) |

## 색상 전용 변경 원칙

다크테마에서 변경 가능한 속성:
- `color`, `background-color`, `border-color`
- `box-shadow`, `outline-color`
- `fill`, `stroke` (SVG)

변경 불가 속성:
- `width`, `height`, `max-width`, `min-height`
- `display`, `position`, `float`, `flex`
- `margin`, `padding`
- `font-size`, `font-weight` (접근성 예외 제외)

## SCSS 변수 참조

```scss
// themes/default/_dark.scss에서 정의된 변수 사용
[data-theme=dark] {
  background-color: $dark-bg;
  color: $dark-color-2;
}
```
