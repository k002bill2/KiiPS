---
name: legacy-compliance-checker
description: "KiiPS 레거시 준수 검증 - Java 8 호환성, Spring Boot 2.4.x 패턴, jQuery/JSP 표준 검사"
user-invocable: false
---

# Legacy Compliance Checker

KiiPS 프로젝트의 레거시 기술 스택 호환성을 검증하는 가드레일 스킬입니다.

## Purpose

### What This Skill Does
- **Java 8 호환성 검증**: Java 10+ 문법 사용 차단 (var, record, sealed 등)
- **Spring Boot 2.4.x 패턴 검증**: 2.4.x 비호환 설정/어노테이션 감지
- **jQuery/JSP 표준 검증**: React/Vue/Angular 등 프론트엔드 프레임워크 혼입 차단
- **MyBatis 안전 패턴 검증**: ${} 직접 바인딩 차단 (ORDER BY 예외)
- **SCSS 테마 규칙 검증**: [data-theme=dark] 외 셀렉터 차단
- **의존성 호환성 검증**: Java 9+ 전용 라이브러리 추가 차단

### What This Skill Does NOT Do
- 코드 수정 또는 자동 변환
- 빌드 실행 (kiips-maven-builder 사용)
- 테스트 실행 (kiips-test-runner 사용)

## When to Use

### Automatic Activation
- Java 코드 생성/수정 시
- JSP/SCSS 파일 생성/수정 시
- pom.xml 의존성 변경 시
- MyBatis mapper XML 수정 시

### User Prompt Keywords
```
"Java", "코드 작성", "구현", "implement", "클래스", "메서드",
"controller", "service", "업그레이드", "마이그레이션"
```

---

## Compliance Rules

### 1. Java 8 호환성

| 차단 패턴 | Java 버전 | 허용 대안 |
|-----------|----------|----------|
| `var` 키워드 | Java 10+ | 명시적 타입 선언 |
| `record` 클래스 | Java 14+ | 일반 class + getter/setter |
| `sealed` class/interface | Java 17+ | abstract class/interface |
| `switch` 표현식 (arrow) | Java 14+ | 전통적 switch-case |
| `text block` (""") | Java 13+ | 문자열 연결 |
| `pattern matching` instanceof | Java 16+ | 캐스팅 후 변수 할당 |
| `Stream.toList()` | Java 16+ | `Collectors.toList()` |
| `List.of()`, `Map.of()` | Java 9+ | `Arrays.asList()`, `Collections.unmodifiableMap()` |

### 2. Spring Boot 2.4.x 호환성

| 차단 패턴 | 이유 | 허용 대안 |
|-----------|------|----------|
| `spring.config.import` | 2.4+ 전용 (KiiPS는 2.4.2 사용하지만 레거시 패턴 유지) | `spring.profiles.include` |
| `@ConstructorBinding` (클래스 레벨) | 2.6+ 동작 변경 | 생성자에 `@ConstructorBinding` |
| `spring.mvc.pathmatch.matching-strategy=path_pattern_parser` | 2.6+ 전용 | 기본값 사용 |

### 3. 프론트엔드 호환성

| 차단 패턴 | 이유 | 허용 대안 |
|-----------|------|----------|
| `import React` / `import Vue` / `import Angular` | SPA 프레임워크 혼입 | jQuery + JSP |
| `import ... from '...'` (ES Module) | ES Module 미지원 | `<script>` 태그 |
| `export default` / `export const` | ES Module 미지원 | 전역 함수/변수 |
| `fetch()` API | 표준화 미흡 | `$.ajax()` / `logosAjax` |
| `async/await` (JSP 내 직접 사용) | IE 호환성 | jQuery Deferred/Promise |

### 4. MyBatis 안전 패턴

| 차단 패턴 | 예외 | 허용 대안 |
|-----------|------|----------|
| `${...}` 직접 바인딩 | `${sortColumn}`, `${sortDirection}`, `${orderBy}` | `#{...}` 파라미터 바인딩 |

### 5. SCSS 테마 규칙

| 차단 패턴 | 이유 | 허용 대안 |
|-----------|------|----------|
| `.dark { ... }` | KiiPS 표준 위반 | `[data-theme=dark] { ... }` |
| `.theme-dark { ... }` | KiiPS 표준 위반 | `[data-theme=dark] { ... }` |
| `prefers-color-scheme: dark` | 시스템 설정 의존 금지 | `[data-theme=dark]` |

---

## Violation Response

### Severity Levels

| Level | 조치 | 예시 |
|-------|------|------|
| **critical** | 즉시 차단 + 코드 생성 거부 | `var` 사용, `${}` SQL Injection |
| **high** | 경고 + 대안 제시 | `.dark` 셀렉터, ES Module |
| **medium** | 정보 제공 | Spring Boot 2.4.x 비권장 패턴 |

### Violation Report Format

```
[COMPLIANCE] {severity} - {rule-id}
  Pattern: {detected pattern}
  File: {file path}:{line}
  Message: {human-readable message}
  Alternative: {suggested fix}
```

---

## Integration

### With skill-rules.json
- `enforcement: "block"` — 위반 감지 시 blockRules 적용
- `blockRules` 배열로 패턴별 차단 규칙 정의

### With Chain of Skills
- Feature Lifecycle 파이프라인의 Phase 1 (설계 검증) 단계에서 활용
- 설계 완료 후, 구현 전 호환성 사전 검증

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
**Related**: kiips-backend-guidelines, kiips-frontend-guidelines, kiips-mybatis-guide, kiips-darktheme-applier
