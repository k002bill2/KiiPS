# Accessibility Rubric

WCAG 2.1 AA 웹 접근성 평가 기준

## 평가 항목

### 1. 지각 가능 (Perceivable) - 30%
- [ ] 모든 이미지에 alt 텍스트
- [ ] 색상 대비 4.5:1 이상
- [ ] 텍스트 크기 조절 가능
- [ ] 멀티미디어 대체 콘텐츠

### 2. 운용 가능 (Operable) - 30%
- [ ] 키보드로 모든 기능 접근 가능
- [ ] 포커스 순서 논리적
- [ ] 포커스 표시 가시적
- [ ] 충분한 시간 제공 (타임아웃 경고)

### 3. 이해 가능 (Understandable) - 25%
- [ ] 페이지 언어 명시 (lang 속성)
- [ ] 입력 필드에 레이블 연결
- [ ] 에러 메시지 명확
- [ ] 일관된 네비게이션

### 4. 견고함 (Robust) - 15%
- [ ] 유효한 HTML 마크업
- [ ] ARIA 속성 올바르게 사용
- [ ] name, role, value 프로그래밍 방식 결정

## ARIA 체크리스트

```html
<!-- 필수 ARIA 패턴 -->
<button aria-label="닫기">×</button>
<input aria-describedby="help-text" />
<div role="alert" aria-live="polite">메시지</div>
<nav aria-label="주 메뉴">...</nav>
```

## 점수 기준

| 점수 | 설명 |
|------|------|
| 90-100 | 우수: WCAG 2.1 AA 완전 준수 |
| 70-89 | 양호: 대부분 준수, 경미한 이슈 |
| 50-69 | 보통: 주요 기능 접근 가능, 개선 필요 |
| 0-49 | 미흡: 접근성 심각한 문제 |
