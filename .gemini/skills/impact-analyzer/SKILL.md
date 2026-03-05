---
name: KiiPS Impact Analyzer
description: 공통 모듈(COMMON, UTILS) 변경 시 전체 서비스 영향 범위를 1M 토큰으로 한번에 파악
version: 1.0.0
priority: high
enforcement: strict
category: analysis
tags:
  - impact-analysis
  - read-only
  - change-management
  - cross-module
author: KiiPS Development Team
lastUpdated: 2026-02-24
---

# KiiPS Impact Analyzer

> **Read-Only Skill**: 영향도 분석 및 보고만 수행합니다. 코드 수정 절대 금지.

KiiPS-COMMON, KiiPS-UTILS 등 공통 모듈 변경 시, 전체 서비스(FD, IL, AC, SY, LP, EL, BATCH)에
미치는 영향을 Gemini의 1M 토큰으로 한 세션에서 전수 분석합니다.

Claude Code의 primary-coordinator가 이 보고서를 읽고 Agent Teams 작업을 분배합니다.

---

## 분석 시나리오

### 시나리오 1: COMMON API 메서드 시그니처 변경

```
변경 전: public List<CommonCode> getCommonCodeList(String groupCd)
변경 후: public List<CommonCode> getCommonCodeList(String groupCd, String langCd)

분석 목표:
- getCommonCodeList()를 호출하는 모든 Service/Controller 파악
- 파라미터 변경이 필요한 호출 위치 목록
- 테스트 케이스 영향 범위
```

### 시나리오 2: UTILS DAO 기반 클래스 변경

```
변경 대상: AbstractDao.java (모든 DAO의 부모)
분석 목표:
- AbstractDao를 상속하는 모든 DAO 클래스 목록
- 오버라이드된 메서드 목록
- 변경 호환성 영향 여부
```

### 시나리오 3: 공통 DTO/VO 변경

```
변경 대상: CommonUser.java (사용자 정보 VO)
분석 목표:
- CommonUser를 import하는 모든 파일
- 변경된 필드를 직접 참조하는 코드
- JSP/JS에서 해당 필드를 사용하는 부분
```

---

## 출력 형식

```json
{
  "task": "impact-analyzer",
  "change_target": "KiiPS-COMMON/CommonCodeService.java",
  "change_type": "method_signature_change",
  "analyzed_at": "2026-02-24T10:00:00",
  "impact_summary": {
    "total_affected_files": 23,
    "critical_changes_needed": 8,
    "backward_compatible": false
  },
  "impact_by_module": {
    "KiiPS-FD": {
      "affected_files": 5,
      "files": [
        {
          "path": "KiiPS-FD/src/main/java/.../FundService.java",
          "line": 145,
          "usage": "getCommonCodeList(\"FUND_TYPE\")",
          "change_needed": "파라미터 추가: getCommonCodeList(\"FUND_TYPE\", \"KO\")",
          "complexity": "low"
        }
      ]
    },
    "KiiPS-IL": {"affected_files": 3, "files": [...]},
    "KiiPS-AC": {"affected_files": 2, "files": [...]},
    "KiiPS-SY": {"affected_files": 4, "files": [...]},
    "KiiPS-LP": {"affected_files": 1, "files": [...]},
    "KiiPS-EL": {"affected_files": 3, "files": [...]}
  },
  "test_impact": {
    "affected_test_files": 5,
    "mock_updates_needed": 3
  },
  "claude_action_items": [
    "KiiPS-FD FundService.java L145 - 파라미터 추가",
    "KiiPS-SY SystemCodeService.java L89 - 파라미터 추가",
    "... (총 8개)"
  ],
  "recommended_team_structure": {
    "FD-teammate": ["KiiPS-FD 내 5개 파일"],
    "IL-teammate": ["KiiPS-IL 내 3개 파일"],
    "AC-SY-teammate": ["KiiPS-AC + KiiPS-SY 내 6개 파일"]
  }
}
```

---

## 실행 프롬프트 템플릿

```bash
# COMMON API 변경 영향도 분석
gemini -p "
KiiPS-COMMON에서 [변경 대상 메서드/클래스] 변경을 계획하고 있어.

## 변경 내용
- 대상: KiiPS-COMMON/src/main/java/.../CommonCodeService.java
- 변경: getCommonCodeList(String groupCd) → getCommonCodeList(String groupCd, String langCd)

## 분석 요청
1. 전체 서비스 모듈(FD, IL, AC, SY, LP, EL, BATCH)에서 getCommonCodeList() 호출 위치 전수 조사
2. 각 호출에서 파라미터 변경이 필요한지 여부 판단
3. 테스트 파일 영향 범위

## 출력
.temp/coordination/cross-tool/responses/impact-common-$(date +%Y%m%d).json 에 저장
코드 수정은 절대 하지 말 것. claude_action_items 에 수정 필요 목록만 작성할 것.
"

# 빠른 참조 체인 확인
gemini -p "KiiPS 전체에서 AbstractDao를 상속하는 클래스 목록과 각각 오버라이드한 메서드 목록을 .temp/coordination/cross-tool/responses/impact-abstractdao-$(date +%Y%m%d).json 에 저장해줘"
```

---

## Claude 후속 워크플로우

```
[Gemini 완료] impact-{모듈}-{날짜}.json 생성
    ↓
[Claude] /gemini-handoff read → 결과 파일 읽기
    ↓
[Claude] recommended_team_structure 기반 Agent Teams 구성:
  ```
  Create an agent team based on impact analysis:
  - FD-teammate: KiiPS-FD 내 [파일 목록] 수정
  - IL-teammate: KiiPS-IL 내 [파일 목록] 수정
  Require plan approval before making changes.
  ```
    ↓
[Claude] verification-loop으로 각 모듈 빌드 검증
```

---

## 제약사항

- **코드 수정 절대 금지**
- **추정 금지**: 파일을 실제 읽어서 확인한 경우만 보고 (추측 금지)
- **SVN revision 기록**: 분석 시점 명시 (이후 SVN 업데이트 시 재분석 필요)
- **출력 위치 제한**: `.temp/coordination/cross-tool/responses/` 에만 쓰기
