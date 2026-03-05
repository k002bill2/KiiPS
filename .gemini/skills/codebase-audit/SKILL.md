---
name: KiiPS Codebase Auditor
description: 1M 토큰 컨텍스트로 전체 모노레포를 한 세션에서 감사 - Cross-module 의존성, API 네이밍, 패턴 통계
version: 1.0.0
priority: high
enforcement: strict
category: analysis
tags:
  - audit
  - read-only
  - cross-module
  - statistics
author: KiiPS Development Team
lastUpdated: 2026-02-24
---

# KiiPS Codebase Auditor

> **Read-Only Skill**: 분석과 보고서 생성만 수행합니다. 코드 수정 절대 금지.

Gemini의 1M 토큰 컨텍스트 강점을 활용하여 KiiPS 전체 모노레포를 한 세션에서 감사합니다.
Claude Code의 200K 토큰 한계를 보완하는 전체 스캔 전담 스킬입니다.

---

## 감사 항목

### 1. Cross-Module 의존성 맵

**목적**: 어떤 서비스가 어떤 공통 모듈에 의존하는지 파악

```
분석 대상:
- 각 서비스 pom.xml의 <dependency> 블록
- Java import문 (특히 com.kiips.common.*)
- Spring @Autowired / constructor injection 패턴

출력 형식:
{
  "dependency_map": {
    "KiiPS-FD": ["KiiPS-COMMON", "KiiPS-UTILS"],
    "KiiPS-IL": ["KiiPS-COMMON", "KiiPS-UTILS", "KiiPS-FD"]
  },
  "circular_dependencies": [],
  "most_depended_modules": [{"module": "KiiPS-COMMON", "dependents": 8}]
}
```

### 2. API 네이밍 일관성 검증

**목적**: 전체 서비스의 REST URL 패턴 통일성 확인

```
수집 항목:
- @RequestMapping, @GetMapping, @PostMapping, @PutMapping, @DeleteMapping
- URL 패턴: /api/{서비스}/{도메인}/{액션}
- 파라미터 네이밍: camelCase vs snake_case

출력 형식:
{
  "url_patterns": [...],
  "inconsistencies": [
    {"pattern_a": "/api/getFundList", "pattern_b": "/api/fund/list", "recommendation": "/api/fd/fund/list"}
  ],
  "naming_stats": {"camelCase": 45, "snake_case": 12, "kebab-case": 3}
}
```

### 3. JSP 패턴 통계

**목적**: 전체 JSP에서 표준 패턴 준수 현황 파악

```
수집 항목:
- <%@ include file="..." %> 패턴
- <c:import url="..." /> 패턴
- 인라인 이벤트 핸들러 (onclick="", onchange="")
- 직접 DB 접근 패턴 (있으면 위험)

출력 형식:
{
  "total_jsp_files": 120,
  "include_patterns": {"include_directive": 80, "c_import": 35, "jsp_include": 5},
  "inline_event_handlers": [{"file": "경로", "count": 3}],
  "non_standard_patterns": [...]
}
```

---

## 실행 프롬프트 템플릿

```bash
gemini -p "
KiiPS 모노레포 전체를 감사해줘.

## 작업 범위
- 루트: /Users/younghwankang/WORK/WORKSPACE/KiiPS/
- 대상 모듈: KiiPS-FD, KiiPS-IL, KiiPS-AC, KiiPS-SY, KiiPS-LP, KiiPS-EL, KiiPS-COMMON, KiiPS-UTILS

## 감사 항목
1. 각 서비스 pom.xml에서 의존성 맵 추출
2. 전체 Controller에서 @RequestMapping URL 패턴 수집 및 네이밍 일관성 분석
3. 전체 JSP에서 인라인 이벤트 핸들러 통계

## 출력
.temp/coordination/cross-tool/responses/codebase-audit-$(date +%Y%m%d).json 에 저장
코드 수정은 절대 하지 말 것. 분석 결과만 JSON으로 저장.
"
```

---

## 출력 파일

- **위치**: `.temp/coordination/cross-tool/responses/codebase-audit-{날짜}.json`
- **소비자**: Claude Code (primary-coordinator)
- **후속 작업**: Claude가 불일치 항목을 `scope-lock`으로 격리하여 수정

---

## 제약사항

- **코드 수정 절대 금지** - 이 스킬은 읽기 전용
- **민감 파일 접근 금지** - .env, app-kiips.properties 제외
- **출력 위치 제한** - `.temp/coordination/cross-tool/responses/` 에만 쓰기
