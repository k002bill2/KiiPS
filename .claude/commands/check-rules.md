---
description: Scan codebase for rule violations defined in .claude/rules/
---

# 규칙 위반 스캔 (/check-rules)

`.claude/rules/` 7개 규칙 파일에 정의된 패턴을 코드베이스 전체에 대해 자동 검증합니다.

## 사용법

```
/check-rules              # 전체 규칙 스캔
/check-rules security     # 보안 규칙만 (validation, dark-theme)
/check-rules mybatis      # MyBatis SQL Injection 패턴만
/check-rules dark-theme   # 다크테마 위반만
```

## 스캔 규칙 매핑

인자에 따라 해당 카테고리만 실행합니다. 인자가 없으면 전체 실행.

### 1. SQL Injection (validation.md + verification.md)
```bash
# MyBatis ${} 사용 검출 (#{} 대신 ${} 사용은 SQL Injection 위험)
grep -rn '\$\{' --include='*.xml' KiiPS-*/src/
```
- 심각도: 🔴 Critical
- 규칙: `${}` 바인딩은 동적 컬럼/테이블명에만 허용, 사용자 입력에 사용 금지
- 예외: `<include>`, `<sql>` 내 테이블/컬럼 동적 참조

### 2. 다크테마 위반 (dark-theme.md)
```bash
# 금지 셀렉터 검출 (.dark, .theme-dark)
grep -rn '\.dark\b\|\.theme-dark' --include='*.scss' KiiPS-UI/
# [data-theme=dark] 블록 내 레이아웃 속성 검출
grep -rn 'data-theme=dark' --include='*.scss' -A 20 KiiPS-UI/ | grep -E '(width|height|display|position|margin|padding)\s*:'
# CSS 직접 수정 검출 (SCSS만 수정해야 함)
find KiiPS-UI/ -name '*.css' -newer KiiPS-UI/src/main/resources/static/css/sass/ -type f
```
- 심각도: 🔴 Critical (셀렉터), ⚠️ Warning (레이아웃)

### 3. Controller 입력 검증 (validation.md)
```bash
# @PostMapping이 있지만 isBlank/isEmpty 검증이 없는 Controller 확인
grep -rn '@PostMapping\|@PutMapping' --include='*Controller.java' KiiPS-*/src/
# 위 결과의 메서드 내에서 StringUtils.isBlank 또는 isEmpty 호출 여부 확인
```
- 심각도: ⚠️ Warning
- 규칙: 모든 외부 입력은 Controller에서 검증 후 Service로 전달

### 4. XSS 취약점 (validation.md + security)
```bash
# JSP에서 escapeXml 없이 EL 직접 출력
grep -rn '\${' --include='*.jsp' KiiPS-UI/ | grep -v 'fn:escapeXml\|c:out\|pageContext\|requestScope\|sessionScope'
```
- 심각도: 🔴 Critical

### 5. 하드코딩된 비밀 (editing.md - Secrets in Environment Variables)
```bash
# password, secret, apikey 등 하드코딩 검출
grep -rn -i 'password\s*=\s*"[^"]\+"\|secret\s*=\s*"[^"]\+"\|apikey\s*=\s*"[^"]\+"\|api_key\s*=\s*"[^"]\+' --include='*.java' --include='*.properties' KiiPS-*/src/
```
- 심각도: 🔴 Critical
- 예외: test/ 디렉토리 내 "test"/"dummy" 접두사

### 6. 보호 모듈 변경 감지 (anti-rationalization.md)
```bash
# 최근 변경된 KiiPS-COMMON, KiiPS-UTILS 파일 확인
svn status KiiPS-COMMON/ KiiPS-UTILS/ 2>/dev/null || git diff --name-only HEAD~5 -- KiiPS-COMMON/ KiiPS-UTILS/
```
- 심각도: ⚠️ Warning (변경 시 영향 범위 분석 필요)

### 7. SCSS 컴파일 검증 (editing.md)
```bash
# 최근 변경된 SCSS 파일에 대해 sass 컴파일 검증
find KiiPS-UI/src/main/resources/static/css/sass/ -name '*.scss' -newer .claude/.last-scss-check -type f
```
- 심각도: ⚠️ Warning

## 실행 절차

1. **SCAN**: 위 7개 카테고리에 대해 Grep/Bash 도구로 패턴 검출
2. **CLASSIFY**: 결과를 Critical / Warning / Info로 분류
3. **REPORT**: 아래 형식으로 리포트 출력
4. **SUGGEST**: Critical 항목에 대해 수정 방안 제안

## 출력 형식

```markdown
## 규칙 위반 스캔 리포트

📅 스캔 일시: {날짜}
📂 스캔 범위: {모듈 목록}

### 🔴 Critical ({N}건)
| # | 규칙 | 파일:라인 | 설명 |
|---|------|----------|------|
| 1 | SQL Injection | mapper.xml:42 | ${userId} 사용 |

### ⚠️ Warning ({N}건)
| # | 규칙 | 파일:라인 | 설명 |
|---|------|----------|------|
| 1 | Controller 검증 | XxxController.java:30 | @PostMapping에 입력 검증 없음 |

### ✅ Passed ({N}개 규칙 통과)
- SQL Injection: 0건
- 다크테마: 0건

### 📊 요약
- 총 스캔 파일: {N}개
- Critical: {N}건 (즉시 수정 필요)
- Warning: {N}건 (수정 권장)
- 전체 규칙 준수율: {N}%
```

## 주의사항

- 이 커맨드는 **읽기 전용** — 코드를 수정하지 않음
- Critical 항목 수정은 사용자 확인 후 별도 작업으로 진행
- 대규모 코드베이스에서는 특정 모듈 지정 권장: `/check-rules mybatis KiiPS-FD`
