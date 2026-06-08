---
name: kiips-test-runner
description: "KiiPS JUnit 테스트 명시 실행 + 결과 분석. 명시 호출 전용(disable-model-invocation). Use when: JUnit 실행, 테스트 실행, mvn test, 테스트 돌려, 단위 테스트, KiiPS 검증 실행. NOT for: 테스트 코드 작성(use kiips-backend), TDD 가이드(use ecc:springboot-tdd)"
disable-model-invocation: true
---

# KiiPS Test Runner

## Purpose

**Boris Cherny's Core Principle**: "가장 중요한 요소는 Claude에게 작업 결과를 스스로 검증할 수 있는 방법을 제공하는 것입니다."

이 Skill은 명시 호출 시 JUnit 테스트를 실행하고 결과를 파싱·분석하여 검증 피드백 루프를 제공합니다.

> 명시 호출 전용입니다. (과거 `stopEvent.js` Hook 자동 실행 연동은 v4.0에서 "Stop 이벤트 자동 테스트는 과도"로 제거되었습니다 — 자동 트리거 없음.)

## Key Features

### 1. 테스트 실행
- **Java/JUnit**: Maven Surefire를 통한 단위 테스트 실행
- **JavaScript/Jest·Karma**: Frontend/UI 테스트 (향후 구현)

### 2. 테스트 결과 분석
- 성공/실패/스킵된 테스트 수 자동 집계
- 실패한 테스트 메서드명 상세 표시
- 테스트 실행 시간 측정

### 3. 피드백 루프 통합
- 테스트 결과를 피드백 루프에 기록
- 실패 시 상세 로그 및 개선 제안 제공

## Usage (수동 실행)

```bash
# 특정 모듈 테스트
cd KiiPS-HUB
mvn test -pl :KiiPS-FD -DskipTests=false

# 전체 프로젝트 테스트
mvn clean test
```

> 커버리지 리포트(JaCoCo)가 목적이면 `/test-coverage` 커맨드를 사용하세요. 본 스킬은 테스트 실행·결과 분석 정본입니다.

## Test Execution Flow

```
1. 테스트 대상 모듈 확인 (KiiPS-FD, KiiPS-IL 등)
2. 테스트 실행 (Maven Surefire / JUnit)
3. 결과 파싱 — 성공/실패/스킵 집계 + 실패 테스트 상세
4. 피드백 제공 — ✅ 통과 / ❌ 실패 시 상세 로그 + 개선 팁
```

## 결과 출력 예시

### 일부 실패

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 24 | Passed: 23 | Failed: 1 | Skipped: 0
Duration: 12.45s
❌ 1 test(s) failed - Review and fix before deployment
💡 Tip: cd KiiPS-HUB && mvn test -pl :<module> -DskipTests=false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 전체 통과

```
Total: 156 | Passed: 156 | Failed: 0 | Skipped: 2
Duration: 45.12s
✅ All tests passed!
```

## Configuration

```xml
<!-- KiiPS-HUB/pom.xml -->
<properties>
  <skipTests>true</skipTests> <!-- 기본 비활성화 — 실행 시 -DskipTests=false 로 강제 -->
</properties>
```

- 실행 시 `-DskipTests=false` 플래그로 활성화, 변경된 모듈만 선택적으로 테스트(성능).
- 장시간 테스트는 모듈을 좁혀 실행(`-pl :<module>`).

## Test Coverage Goals

보리스 처니가 강조한 **검증 피드백 루프** 품질 기준:

| 항목 | 목표 | 현재 |
|------|------|------|
| 단위 테스트 커버리지 | ≥ 80% | 측정 필요 (`/test-coverage`) |
| 통합 테스트 커버리지 | ≥ 70% | 측정 필요 |
| 테스트 실패 시 배포 차단 | Yes | ⚠️ 경고만 (향후 CI 차단) |

## Boris Cherny's Principles Applied

- **검증 피드백 루프**: 코드 변경 후 테스트 실행 → 결과 리포팅 → 실패 시 즉시 피드백.
- **결정론적 검증**: 동일 코드 변경 → 동일 테스트 결과. JUnit/Maven 표준 러너 사용.

## Troubleshooting

### 테스트가 실행되지 않음
`skipTests=true` 기본 설정 때문 → `mvn test -pl :KiiPS-FD -DskipTests=false` 로 강제 실행.

### 타임아웃 / 장시간 실행
모듈 범위를 좁혀 실행(`-pl :<module>`)하거나 느린 테스트를 분리.

## Related Skills

- **kiips-build** - 빌드/배포 전 테스트 실행
- **/test-coverage** - JUnit + JaCoCo 커버리지 리포트
- **kiips-feature-planner** - 기능 개발 시 테스트 계획

## Future Enhancements

- ⏳ JavaScript/Jest·Karma 테스트 지원
- ⏳ 테스트 커버리지 측정 통합 (JaCoCo)
- ⏳ CI/CD 파이프라인 테스트 실패 시 배포 차단

## References

- **Boris Cherny's Workflow #10**: "가장 중요한 팁은 Claude에게 검증 피드백 루프 제공"
- **Maven Surefire Plugin**: https://maven.apache.org/surefire/maven-surefire-plugin/
- **JUnit 5**: https://junit.org/junit5/

---

**Status**: 명시 호출 전용 (Java/JUnit)
