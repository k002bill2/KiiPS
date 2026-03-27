---
name: kiips-quality
description: "웹 접근성(WCAG 2.1 AA) + 반응형 디자인 검증 통합. Use when: 접근성, WCAG, ARIA, 반응형, responsive, 모바일, 브레이크포인트, 터치 타겟, a11y"
disable-model-invocation: true
---

# KiiPS Quality Validation (통합)

> kiips-a11y-checker + kiips-responsive-validator 통합

---

## 접근성 (WCAG 2.1 AA)

### 필수 검증 항목

| 항목 | 기준 | 검증 방법 |
|------|------|----------|
| 색상 대비 | ≥ 4.5:1 (텍스트), ≥ 3:1 (대형) | devtools contrast checker |
| 키보드 내비게이션 | 모든 인터랙티브 요소 접근 가능 | Tab 순서 테스트 |
| ARIA 라벨 | 모든 인터랙티브 요소에 label/aria-label | grep 검증 |
| alt 텍스트 | 모든 `<img>`에 alt 속성 | grep 검증 |
| 포커스 표시 | `:focus` 스타일 visible | 시각적 확인 |

### KiiPS JSP 패턴

```jsp
<%-- 올바른 패턴 --%>
<input type="text" id="fundNm" aria-label="펀드명" />
<button type="button" aria-label="검색"><i class="fas fa-search"></i></button>
<img src="logo.png" alt="KiiPS 로고" />

<%-- 잘못된 패턴 --%>
<input type="text" id="fundNm" />          <%-- aria-label 누락 --%>
<button><i class="fas fa-search"></i></button>  <%-- aria-label 누락 --%>
<img src="logo.png" />                     <%-- alt 누락 --%>
```

---

## 반응형 디자인

### Bootstrap Breakpoints

| 브레이크포인트 | 크기 | 클래스 접두사 |
|---------------|------|-------------|
| xs | <576px | `.col-` |
| sm | ≥576px | `.col-sm-` |
| md | ≥768px | `.col-md-` |
| lg | ≥992px | `.col-lg-` |
| xl | ≥1200px | `.col-xl-` |

### 터치 타겟
- 최소 크기: **44px × 44px** (WCAG 2.5.5)
- 버튼, 링크, 입력 필드 모두 적용

### 검증 체크리스트
1. 모든 `col-*` 클래스에 반응형 대응 존재?
2. `img-fluid` 또는 `max-width: 100%` 적용?
3. 터치 타겟 ≥ 44px?
4. `@media` 쿼리에서 레이아웃 전환 정상?
5. 가로 스크롤 발생하지 않음?

---

**Merged from**: kiips-a11y-checker, kiips-responsive-validator
**Version**: 2.0.0
