---
name: kiips-test-runner
description: "Automated test execution and validation for KiiPS microservices (JUnit, Jest, Karma). Use when: 테스트, test, junit, 검증, validation, 테스트 실행"
disable-model-invocation: true
---

# KiiPS Test Runner

## Purpose

**Boris Cherny's Core Principle**: "가장 중요한 요소는 Claude에게 작업 결과를 스스로 검증할 수 있는 방법을 제공하는 것입니다."

이 Skill은 코드 변경 후 자동으로 테스트를 실행하여 품질을 2-3배 향상시킵니다 (보리스 처니 언급).

### 자동 실행 조건
- Java 파일 (`.java`) 변경 감지 시 → JUnit 테스트 자동 실행
- JavaScript 파일 (`.js`) 변경 감지 시 → Jest/Karma 테스트 실행 (향후)
- `stopEvent.js` Hook을 통해 작업 완료 시 자동 트리거

## Key Features

### 1. 자동 테스트 실행
- **Java/JUnit**: Maven Surefire를 통한 단위 테스트 실행
- **JavaScript/Jest**: Frontend 테스트 (향후 구현)
- **JavaScript/Karma**: UI 통합 테스트 (향후 구현)

### 2. 테스트 결과 분석
- 성공/실패/스킵된 테스트 수 자동 집계
- 실패한 테스트 메서드명 상세 표시
- 테스트 실행 시간 측정

### 3. 피드백 루프 통합
- 테스트 결과를 ACE Framework Layer 6에 기록
- 실패 시 상세 로그 및 개선 제안 제공
- 성공 시 체크포인트 자동 생성

## Usage

### Automatic Activation (via Hook)

이 Skill은 `stopEvent.js` Hook을 통해 **자동으로 실행**됩니다:

```javascript
// .claude/hooks/stopEvent.js
async function onStopEvent(context) {
  // ...
  // 1.5. 자동 테스트 실행
  if (editedFiles.length > 0) {
    testResults = await runAutoTests(editedFiles);
  }
  // ...
}
```

### Manual Invocation

필요 시 수동으로도 실행 가능:

```bash
# 특정 모듈 테스트
cd KiiPS-HUB
mvn test -pl :KiiPS-FD -DskipTests=false

# 전체 프로젝트 테스트
mvn clean test
```

## Test Execution Flow

```
┌──────────────────────────────────────┐
│ 1. 코드 변경 감지                     │
│    (Java, JavaScript 파일)           │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 2. 테스트 대상 모듈 추출              │
│    - KiiPS-FD, KiiPS-IL 등           │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 3. 테스트 실행 (Maven/Jest/Karma)    │
│    - JUnit for Java                  │
│    - Jest for Frontend JS            │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 4. 결과 파싱 및 분석                  │
│    - 성공/실패/스킵 집계              │
│    - 실패 테스트 상세 정보            │
└──────────┬───────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ 5. 피드백 제공                        │
│    ✅ All passed → Checkpoint         │
│    ❌ Failed → Detailed log + Tips   │
└──────────────────────────────────────┘
```

## Examples

### Example 1: Java 파일 수정 후 자동 테스트

**상황**: `KiiPS-FD/src/.../FundService.java` 파일 수정

**자동 실행**:
```
🧪 AUTO TEST EXECUTION (Boris Cherny Feedback Loop)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Detected Java changes in: KiiPS-FD
🔄 Running JUnit tests...

Testing KiiPS-FD...
  ✅ KiiPS-FD: 23/24 passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 24 | Passed: 23 | Failed: 1 | Skipped: 0
Duration: 12.45s
❌ 1 test(s) failed - Review and fix before deployment
💡 Tip: Run tests locally with: cd KiiPS-HUB && mvn test -pl :<module>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Example 2: 모든 테스트 통과

**자동 실행**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 156 | Passed: 156 | Failed: 0 | Skipped: 2
Duration: 45.12s
✅ All tests passed!
💡 Quality improvement achieved (Boris Cherny: 2-3x better results)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Configuration

### KiiPS 프로젝트 기본 설정

```xml
<!-- KiiPS-HUB/pom.xml -->
<properties>
  <skipTests>true</skipTests> <!-- 기본적으로 비활성화 -->
</properties>
```

**자동 테스트 실행 시**:
- Hook에서 `-DskipTests=false` 플래그로 강제 활성화
- 변경된 모듈만 선택적으로 테스트 (성능 최적화)

### Timeout 설정

```javascript
// stopEvent.js
execSync(`cd KiiPS-HUB && mvn test -pl :${moduleName} -DskipTests=false`, {
  timeout: 120000 // 2분 타임아웃
});
```

## Test Coverage Goals

보리스 처니가 강조한 **검증 피드백 루프** 품질 기준:

| 항목 | 목표 | 현재 |
|------|------|------|
| 단위 테스트 커버리지 | ≥ 80% | 측정 필요 |
| 통합 테스트 커버리지 | ≥ 70% | 측정 필요 |
| 자동 테스트 실행율 | 100% | ✅ 100% (Java) |
| 테스트 실패 시 배포 차단 | Yes | ⚠️ 경고만 (향후 차단) |

## Integration with ACE Framework

### Layer 6 (Task Prosecution) 통합

```javascript
// stopEvent.js
async function onStopEvent(context) {
  // Layer 6: 실제 작업 수행 후 자가 검증
  testResults = await runAutoTests(editedFiles);

  // 피드백 루프에 결과 기록
  await recordExecutionFeedback({
    testResults // 테스트 성공/실패 여부 포함
  });
}
```

### Feedback Loop 학습

```javascript
// 실패 시 학습 이벤트 기록
if (!testResults.javaTests.success) {
  feedbackLoop.recordLearningEvent({
    eventType: 'test_failure',
    suggestion: 'Review test failures before proceeding'
  });
}
```

## Boris Cherny's Principles Applied

### 원칙 1: 검증 피드백 루프
> "견고한 검증 루프를 구축하면 최종 결과물의 품질이 2-3배 향상됩니다."

**적용**:
- ✅ 코드 변경 시 자동 테스트 실행
- ✅ 테스트 결과 상세 리포팅
- ✅ 실패 시 즉시 피드백

### 원칙 2: 결정론적 검증
> "백그라운드 에이전트나 플러그인을 사용해 작업을 결정론적으로 검증합니다."

**적용**:
- ✅ 동일한 코드 변경 → 동일한 테스트 실행
- ✅ JUnit/Maven 표준 테스트 러너 사용
- ✅ 예측 가능한 테스트 결과

## Troubleshooting

### 문제: 테스트가 실행되지 않음

**원인**: `skipTests=true` 기본 설정

**해결**:
```bash
# 강제 실행
mvn test -pl :KiiPS-FD -DskipTests=false
```

### 문제: 타임아웃 에러

**원인**: 테스트 실행 시간 > 2분

**해결**:
```javascript
// stopEvent.js에서 타임아웃 증가
timeout: 300000 // 5분으로 증가
```

### 문제: 테스트 실패 시 배포 차단 안 됨

**현재**: 경고만 표시
**향후**: CI/CD 파이프라인 통합으로 배포 차단

## Related Skills

- **kiips-maven-builder** - 빌드 전 테스트 실행
- **kiips-service-deployer** - 배포 전 테스트 검증
- **checklist-generator** - 테스트 체크리스트 생성
- **kiips-feature-planner** - 기능 개발 시 테스트 계획

## Future Enhancements

### Phase 1 (현재 구현)
- ✅ Java/JUnit 자동 테스트 실행
- ✅ 테스트 결과 파싱 및 리포팅
- ✅ stopEvent Hook 통합

### Phase 2 (계획)
- ⏳ JavaScript/Jest 테스트 지원
- ⏳ Karma UI 통합 테스트
- ⏳ 테스트 커버리지 측정 (JaCoCo)

### Phase 3 (계획)
- ⏳ 테스트 실패 시 자동 재시도 (3회)
- ⏳ 성능 테스트 통합 (JMeter)
- ⏳ 배포 전 자동 회귀 테스트

## References

- **Boris Cherny's Workflow #10**: "가장 중요한 팁은 Claude에게 검증 피드백 루프 제공"
- **ACE Framework Layer 6**: Task Prosecution - 자가 검증 및 피드백
- **Maven Surefire Plugin**: https://maven.apache.org/surefire/maven-surefire-plugin/
- **JUnit 5**: https://junit.org/junit5/

---

**Last Updated**: 2026-01-05
**Author**: KiiPS Development Team (inspired by Boris Cherny's principles)
**Status**: ✅ Production Ready (Java/JUnit)
