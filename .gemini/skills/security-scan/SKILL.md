---
name: KiiPS Security Scanner
description: MyBatis ${} SQL Injection, XSS 취약점 전수 스캔 - 1M 토큰으로 전체 Mapper XML 일괄 분석
version: 1.0.0
priority: critical
enforcement: strict
category: security
tags:
  - security
  - sql-injection
  - xss
  - read-only
  - vulnerability
author: KiiPS Development Team
lastUpdated: 2026-02-24
---

# KiiPS Security Scanner

> **Read-Only Skill**: 취약점 발견 및 보고만 수행합니다. 코드 수정 절대 금지.

Gemini의 1M 토큰 컨텍스트로 KiiPS 전체 MyBatis Mapper XML과 JSP 파일을 일괄 스캔하여
보안 취약점을 발견합니다. Claude Code가 이 보고서를 읽고 수정합니다.

---

## 스캔 항목

### 1. MyBatis `${}` SQL Injection (최우선)

**위험도**: CRITICAL

```xml
<!-- ❌ 위험한 패턴 - ${} 는 문자열 직접 삽입 (SQL Injection 가능) -->
SELECT * FROM fund WHERE fund_nm LIKE '%${searchKeyword}%'
SELECT * FROM ${tableName}
ORDER BY ${sortColumn} ${sortOrder}

<!-- ✅ 안전한 패턴 - #{} 는 PreparedStatement 파라미터 -->
SELECT * FROM fund WHERE fund_nm LIKE CONCAT('%', #{searchKeyword}, '%')
```

**스캔 대상**: `**/mapper/**/*.xml`, `**/*Mapper.xml`

**출력**:
```json
{
  "sql_injection_risks": [
    {
      "file": "KiiPS-FD/src/main/resources/mapper/FundMapper.xml",
      "line": 45,
      "query_id": "selectFundList",
      "pattern": "${searchKeyword}",
      "context": "SELECT * FROM fund WHERE fund_nm LIKE '%${searchKeyword}%'",
      "risk": "high",
      "recommendation": "#{searchKeyword} 로 교체 필요"
    }
  ]
}
```

### 2. XSS 취약점 패턴

**위험도**: HIGH

```jsp
<!-- ❌ 위험: EL 표현식 미이스케이프 -->
<div>${param.userInput}</div>
<script>var name = '${userName}';</script>

<!-- ✅ 안전: c:out 또는 fn:escapeXml 사용 -->
<div><c:out value="${param.userInput}"/></div>
```

**스캔 대상**: `**/*.jsp`

### 3. 하드코딩된 민감 정보

**위험도**: HIGH

```
스캔 패턴:
- password = "..."
- passwd = "..."
- api_key = "..."
- secret = "..."
- 192.168.x.x 직접 IP
```

**스캔 대상**: `**/*.java`, `**/*.properties` (app-local만)

### 4. 인증/인가 누락 패턴

**위험도**: MEDIUM

```java
// 스캔 패턴: @RequestMapping이 있지만 @PreAuthorize/@Secured 없는 Controller 메서드
@PostMapping("/delete")
public ResponseEntity<?> deleteRecord(...) {  // 인가 어노테이션 없음!
```

---

## 실행 프롬프트 템플릿

```bash
# 전체 보안 스캔
gemini -p "
KiiPS 전체 보안 취약점을 스캔해줘.

## 스캔 항목
1. 전체 MyBatis Mapper XML에서 \${} 패턴 전수 조사 (SQL Injection)
2. 전체 JSP에서 미이스케이프 EL 표현식 (XSS)
3. Java 소스에서 하드코딩된 패스워드/시크릿

## 출력 형식
{
  'task': 'security-scan',
  'scan_date': '날짜',
  'findings': {
    'sql_injection': [...],
    'xss': [...],
    'hardcoded_secrets': [...]
  },
  'risk_summary': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
  'claude_action_items': ['수정 필요 항목 목록']
}

## 저장 위치
.temp/coordination/cross-tool/responses/security-scan-$(date +%Y%m%d).json

코드 수정은 절대 하지 말 것. 발견된 취약점 보고만 할 것.
"

# FD 모듈만 빠른 스캔
gemini -p "KiiPS-FD/src/main/resources/mapper/ 하위 전체 XML에서 \${} 사용 패턴만 전수 조사해서 .temp/coordination/cross-tool/responses/security-scan-fd-$(date +%Y%m%d).json 에 저장해줘"
```

---

## Claude 후속 작업 가이드

이 스킬의 출력을 받은 Claude Code는:

1. **risk=critical**: 즉시 `scope-lock` + `diagnose` 스킬로 수정
2. **risk=high**: `kiips-feature-planner`로 수정 계획 수립 후 패치
3. **risk=medium**: 다음 스프린트에 일괄 수정
4. **risk=low**: 기술부채 등록

```
Claude 실행 명령 예시:
"security-scan 결과 파일을 읽고 SQL Injection risk=high 항목들의 수정 계획을 수립해줘"
```

---

## 제약사항

- **코드 수정 절대 금지**
- **민감 파일 열람 금지**: app-kiips.properties, .env, app-stg.properties
- **보고서만 생성**: `.temp/coordination/cross-tool/responses/` 에만 쓰기
- **거짓 양성 표시**: 불확실한 항목은 risk=low + note: "확인 필요" 로 표시
