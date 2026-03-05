---
name: verification-loop
description: Boris Cherny style verification feedback loop automation. Run type check, lint, test, and build verification.
type: workflow
priority: high
triggers:
  keywords:
    - verify
    - verification
    - feedback loop
    - check
    - validate
  patterns:
    - "(verify|validate).*?(code|app)"
    - "(feedback|verification).*?loop"
---

# Verification Loop Skill

Boris Cherny가 강조하는 **검증 피드백 루프**를 자동화하는 스킬입니다.

## 핵심 원칙

> "검증 피드백 루프는 Claude Code 워크플로우에서 가장 중요한 요소입니다."
> — Boris Cherny

## 자동 검증 시점

### 필수 검증 (반드시 실행)
| 시점 | 커맨드 | 검증 항목 |
|------|--------|----------|
| 기능 구현 완료 | `/verify-app` | 타입, 린트, 테스트, 빌드 |
| PR 생성 전 | `/check-health` | 전체 상태 점검 |
| 리팩토링 후 | `/verify-app` | 변경 영향 확인 |

### 권장 검증 (상황별)
| 시점 | 커맨드 | 목적 |
|------|--------|------|
| 복잡한 코드 발견 | `/simplify-code` | 복잡도 분석 |
| 커버리지 확인 | `/test-coverage` | 테스트 충분성 |

## 검증 체크리스트

### Level 1: Quick Check (1분 이내)
```bash
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am
```
- 컴파일 에러 0개 확인
- 빠른 피드백 루프

### Level 2: Standard Check (2-3분)
```bash
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am
cd KiiPS-HUB && mvn test -pl :KiiPS-FD
```
- 컴파일 + 테스트
- 기능 구현 완료 시

### Level 3: Full Check (5분 이상)
```bash
cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD -am
```
- 전체 검증 (컴파일 + 테스트 + 패키징)
- SVN 커밋 전 필수

## 검증 기준

### Java 컴파일
| 기준 | 상태 |
|------|------|
| 컴파일 에러 0개 | 필수 |
| Deprecated 경고 최소화 | 권장 |
| Java 8 호환성 | 필수 |

### MyBatis
| 기준 | 상태 |
|------|------|
| #{} 파라미터 바인딩 | 필수 |
| ${} 사용 금지 | 필수 |

### 테스트 (JUnit)
| 지표 | 목표 |
|------|------|
| 테스트 통과율 | 100% |
| 신규 기능 커버리지 | ≥70% |

### 빌드 (Maven)
| 기준 | 상태 |
|------|------|
| mvn package 성공 | 필수 |
| WAR/JAR 정상 생성 | 필수 |

## 자동화 설정

### PostToolUse 훅 (선택사항)
```json
{
  "event": "PostToolUse",
  "hooks": [{
    "matcher": "Edit|Write",
    "commands": ["cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am 2>&1 | tail -5"]
  }]
}
```

### 백그라운드 검증
복잡한 작업 완료 후 백그라운드에서 자동 검증:
```
Task(subagent_type="general-purpose", prompt="Maven 빌드 검증 실행", run_in_background=true)
```

## 실패 시 대응

### 우선순위
1. **컴파일 에러**: 즉시 수정 (블로커)
2. **테스트 실패**: 코드 또는 테스트 수정
3. **MyBatis ${} 사용**: 즉시 #{} 으로 변경
4. **커버리지 미달**: 테스트 추가

### 수정 후 재검증
```bash
# 수정 후 반드시 재검증
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am && mvn test -pl :KiiPS-FD
```

## 팀 협업 패턴

### SVN 커밋 전 검증
```bash
# 커밋 전 실행
/verify-app
```

### 코드 리뷰 기준
- [ ] 컴파일 에러 없음
- [ ] MyBatis #{} 바인딩 사용
- [ ] 모든 테스트 통과
- [ ] 커버리지 목표 충족
- [ ] Maven 빌드 성공

## 관련 리소스

- [/verify-app 커맨드](../../commands/verify-app.md)
- [/check-health 커맨드](../../commands/check-health.md)
