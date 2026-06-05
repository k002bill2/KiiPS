---
name: 다크테마 인라인 스타일 금지
description: UI 요소 추가 시 인라인 style로 배경색/테두리 지정하면 다크테마에서 오버라이드 불가 — 반드시 CSS 클래스 사용
type: feedback
---

UI 요소를 새로 추가할 때 인라인 `style="background-color:...; border:..."` 사용 금지. 다크테마(`[data-theme=dark]`)에서 오버라이드가 불가능하다.

**Why:** PG0916 요약 바를 인라인 스타일로 추가했더니 다크테마에서 흰 배경이 그대로 노출되어 시각적으로 어색했음.

**How to apply:**
- 새 UI 요소의 배경색/테두리는 반드시 CSS 클래스로 정의
- 라이트 기본 스타일 + `[data-theme=dark]` 오버라이드 쌍으로 작성
- 기존 Bootstrap 유틸 클래스(bg-light 등)도 다크테마 지원 여부 확인 후 사용
- 인라인 스타일은 gap, font-size 등 테마 무관 속성에만 허용
