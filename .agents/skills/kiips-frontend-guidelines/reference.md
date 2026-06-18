# KiiPS Frontend Guidelines - 참조

> 다크모드 자동 연동 상세 규칙 (SKILL.md에서 분리)

## 다크모드 자동 연동 (CRITICAL)

모든 프론트엔드 코드에서 다크모드를 자동 지원해야 합니다.

### HTML/JSP 규칙

```jsp
<%-- ❌ 인라인 색상 → 다크모드에서 깨짐 --%>
<div style="background:#f8f9fa; color:#333;">

<%-- ✅ CSS 클래스 사용 --%>
<div class="summary-bar">
```

### JavaScript 동적 DOM 규칙

```javascript
// 테마 감지 유틸 (페이지 상단에 1회 선언)
var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

// ❌ 하드코딩
el.style.color = "#333";

// ✅ 방법 1: CSS 클래스 (권장)
el.classList.add("my-component");

// ✅ 방법 2: 불가피 시 분기
el.style.color = isDark ? "#ddd" : "#333";
```

### HTML 문자열 연결 시

```javascript
// ❌ 인라인 색상
html += '<span style="color:#333;">내용</span>';

// ✅ 클래스 사용
html += '<span class="text-body">내용</span>';
```

### 새 CSS 클래스 추가 시

`custom.scss`에 라이트+다크 **쌍으로** 정의:

```scss
.my-component { background: #f8f9fa; color: #333; }
[data-theme=dark] .my-component { background: $dark-color-3; color: $dark-default-text; }
```

> 색상 매핑, 변수 목록: [kiips-scss](../kiips-scss/SKILL.md) 참조
