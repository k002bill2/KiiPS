---
description: Gemini CLI 보안 취약점 스캔 (검증 전용)
---

# /gemini-scan — Gemini 보안 스캔

KiiPS 코드베이스에 대해 Gemini CLI가 보안 취약점 분석을 수행합니다.

## 실행

```bash
node .claude/hooks/gemini-bridge.js scan
```

## 검증 범위

- SQL Injection: DAO에서 문자열 연결로 SQL 생성하는 패턴
- XSS: JSP EL 표현식 미이스케이프 (`fn:escapeXml`, `c:out` 누락)
- CSRF: 토큰 검증 누락
- Authentication bypass: `@PreAuthorize` / 세션 체크 누락
- Hardcoded secrets: 소스 내 비밀번호, API 키

## 결과 확인

스캔 완료 시 `.claude/gemini-bridge/reviews/`에 저장됩니다.

현재 상태 확인:
```bash
node .claude/hooks/gemini-bridge.js status
```

## 주의사항

- Gemini API 일일 한도: 900회
- scan 타임아웃: 180초
- 코드 수정 없음 — 분석 및 보고만 수행
