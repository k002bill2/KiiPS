---
name: RealGrid text-center 불필요
description: RealGrid 기본 정렬이 중앙이므로 styleName:"text-center" 사용 금지
type: feedback
---

RealGrid는 기본 정렬이 중앙정렬이므로 `styleName:"text-center"`를 사용할 필요가 없다.

**Why:** 불필요한 스타일 지정은 코드 노이즈이며, RealGrid 기본값과 중복된다.

**How to apply:** RealGrid 컬럼 정의 시 `text-center`를 단독으로 사용하지 말 것. 다른 스타일과 함께 쓰일 때도 `text-center` 부분은 제거 (예: `"text-center green-column"` → `"green-column"`).
