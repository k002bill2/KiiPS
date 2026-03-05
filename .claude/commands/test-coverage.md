---
name: test-coverage
description: JUnit 테스트 실행 및 JaCoCo 커버리지 리포트 생성
---

# Test Coverage Analysis

KiiPS 프로젝트의 JUnit 테스트를 실행하고 JaCoCo 커버리지 리포트를 분석합니다.

## Steps

### 1. Run Tests with Coverage
```bash
cd KiiPS-HUB && mvn clean test jacoco:report -DskipTests=false
```

### 2. View Coverage Report
```bash
# 특정 모듈 커버리지 리포트 열기
open KiiPS-SERVICE/target/site/jacoco/index.html
```

### 3. Analyze Coverage Report
- Line coverage 75% 미만 파일 식별
- Branch coverage 60% 미만 파일 식별
- 테스트되지 않은 클래스 목록화

### 4. Prioritize Coverage Gaps
- **High Priority**: Service 클래스 (*Service.java)
- **Medium Priority**: Controller 클래스 (*Controller.java)
- **Low Priority**: DTO/Model 클래스

## Coverage Thresholds

| Metric | Target | Description |
|--------|--------|-------------|
| Line | 75% | 코드 라인 커버리지 |
| Branch | 60% | 조건문 분기 커버리지 |
| Method | 70% | 메서드 커버리지 |
| Class | 80% | 클래스 커버리지 |

## Output Format

```markdown
# KiiPS Test Coverage Report

## Summary
- Overall Line Coverage: X%
- Branch Coverage: X%
- Method Coverage: X%
- Class Coverage: X%

## Modules Coverage

| Module | Line | Branch | Status |
|--------|------|--------|--------|
| KiiPS-COMMON | 82% | 65% | Pass |
| KiiPS-FD | 71% | 58% | Fail |
| KiiPS-LP | 45% | 30% | Critical |

## Files Below Threshold

### High Priority (Service Classes)
1. **FundService.java** (45% coverage)
   - Missing tests: calculateReturn(), validateFund()
   - Suggested tests: 8 new tests

2. **LPService.java** (60% coverage)
   - Missing tests: error scenarios
   - Suggested tests: 5 new tests

### Medium Priority (Controllers)
1. **FundController.java** (55% coverage)
   - Missing tests: exception handling
   - Suggested tests: 4 new tests

## Untested Classes
1. BatchJobService.java (0%)
2. NotificationHelper.java (0%)

## Recommended Actions
1. Add tests for FundService core methods
2. Add exception scenario tests
3. Test batch job scheduling logic
```

## Maven Commands

| Action | Command |
|--------|---------|
| Run all tests | `mvn test -DskipTests=false` |
| Run specific test | `mvn test -Dtest=FundServiceTest` |
| Run with coverage | `mvn test jacoco:report` |
| Skip tests | `mvn package -DskipTests` |
| Specific module | `mvn test -pl :KiiPS-FD -am` |

## JaCoCo Configuration

pom.xml에 JaCoCo 플러그인이 필요합니다:

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.7</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## Follow-up Actions

1. **테스트 생성 제안**: "Service 클래스 테스트를 생성할까요?"
2. **커버리지 개선 확인**: 테스트 추가 후 재실행
3. **CI/CD 연동**: Jenkins/GitLab CI에서 커버리지 체크

---

*Use this command to improve test coverage systematically.*
