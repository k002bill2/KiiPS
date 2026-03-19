---
id: security-xss-prevention
trigger: "JSP에서 사용자 입력 출력 시, jQuery .html() 사용 시"
confidence: 0.85
domain: "security-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 30
---

# XSS 방지: 출력 이스케이프 필수

## Action
1. JSP에서 `${value}` 대신 `<c:out value="${value}"/>` 사용
2. jQuery에서 `.html(userInput)` 대신 `.text(userInput)` 사용
3. HTML 문자열 조립 시 사용자 입력은 반드시 이스케이프

```jsp
<%-- 안전 --%>
<c:out value="${data.TITLE}" escapeXml="true"/>

<%-- 위험 --%>
${data.TITLE}
```

```javascript
// 안전
$('#target').text(userData);

// 위험 - XSS 취약
$('#target').html(userData);
```

## Evidence
- 30회 security-pattern 관찰
- Gemini 리뷰에서 반복 지적: `.html()` XSS 취약점 (COMM_OFCIAL_DOC.jsp)
