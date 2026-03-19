---
id: security-csrf-check
trigger: "POST 요청 처리 또는 폼 제출 시"
confidence: 0.7
domain: "security-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 8
---

# CSRF 방지: 토큰 검증

## Action
모든 상태 변경 요청(POST/PUT/DELETE)에 CSRF 토큰 포함. KiiPS는 Spring Security CSRF 활성화 상태.

```jsp
<form method="POST">
  <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
</form>
```

AJAX 요청 시 헤더에 포함:
```javascript
$.ajax({
  headers: { 'X-CSRF-TOKEN': $('meta[name="_csrf"]').attr('content') }
});
```

## Evidence
- Spring Security 설정에서 CSRF 활성화 확인
- KiiPS 보안 가이드라인
