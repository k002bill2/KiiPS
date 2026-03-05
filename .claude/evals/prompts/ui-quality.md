# UI Quality Rubric

KiiPS UI 컴포넌트 품질 평가 기준

## 평가 항목

### 1. 구조적 완성도 (30%)
- [ ] JSP 템플릿이 올바른 구조를 가짐
- [ ] JSTL/EL 태그가 적절히 사용됨
- [ ] XSS 방어가 적용됨 (c:out 또는 fn:escapeXml)

### 2. RealGrid 표준 준수 (25%)
- [ ] KiiPS 표준 그리드 함수 사용 (createMainGrid, createEditGrid 등)
- [ ] DataProvider와 GridView 분리
- [ ] KiiPS 표준 상수 사용 (footerSummaryKiips, textFormatDateKiips)

### 3. 스타일 일관성 (20%)
- [ ] Bootstrap 클래스 활용
- [ ] SCSS 변수/믹스인 사용
- [ ] KiiPS 디자인 토큰 적용

### 4. 코드 품질 (15%)
- [ ] 중복 코드 없음
- [ ] 적절한 주석
- [ ] 함수 분리가 적절함

### 5. 사용성 (10%)
- [ ] 로딩 인디케이터 포함
- [ ] 에러 메시지 처리
- [ ] 사용자 피드백 제공

## 점수 기준

| 점수 | 설명 |
|------|------|
| 90-100 | 우수: 모든 기준 충족, 베스트 프랙티스 적용 |
| 70-89 | 양호: 대부분 기준 충족 |
| 50-69 | 보통: 기본 기준만 충족 |
| 0-49 | 미흡: 기준 미달 |
