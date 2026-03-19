---
id: scss-dark-theme-selector
trigger: "다크테마 스타일 작성 시"
confidence: 0.9
domain: "scss-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 15
---

# 다크테마: [data-theme=dark] 셀렉터 전용

## Action
다크테마는 반드시 `[data-theme=dark]` 셀렉터만 사용. 색상 관련 속성만 변경 가능.

```scss
[data-theme=dark] {
  .component {
    background-color: $dark-bg;
    color: $dark-color-2;
    border-color: $dark-border;
  }
}
```

금지: `.dark`, `.theme-dark`, `!important` (인라인 오버라이드 제외)
금지: width, height, display, position, margin, padding 변경

## Evidence
- CLAUDE.md Dark Theme 규칙
- `.claude/rules/dark-theme.md` 정의
- 15회 scss-pattern 관찰
