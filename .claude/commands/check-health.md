---
name: check-health
description: KiiPS 프로젝트 종합 상태 점검 - Maven 빌드, 테스트, 의존성 분석
---

# KiiPS Project Health Check

KiiPS Maven 멀티모듈 프로젝트의 종합적인 상태 점검을 수행합니다.

## Steps

### 1. Java Compile Check
```bash
cd KiiPS-HUB && mvn clean compile -DskipTests
```

**What it checks**:
- Java 컴파일 에러
- Import 누락
- 문법 오류
- 의존성 해결 상태

**Common Issues & Fixes**:
- `cannot find symbol` → Import 추가 또는 의존성 확인
- `package does not exist` → pom.xml 의존성 추가
- `incompatible types` → 타입 변환 또는 제네릭 수정

### 2. Unit Test Suite
```bash
cd KiiPS-HUB && mvn test -DskipTests=false
```

**What it checks**:
- JUnit 테스트 실행
- 테스트 성공/실패 여부
- 테스트 커버리지 (JaCoCo 설정 시)

**Common Issues & Fixes**:
- `Test failed` → 테스트 코드 또는 구현 수정
- `NullPointerException in test` → Mock 설정 확인
- `Connection refused` → 테스트용 DB/서비스 확인

### 3. Package Build
```bash
cd KiiPS-HUB && mvn clean package -DskipTests
```

**What it checks**:
- JAR/WAR 패키징 성공
- 리소스 복사 정상
- Spring Boot 실행 가능 아카이브 생성

**Common Issues & Fixes**:
- `Could not find artifact` → mvn clean install 후 재시도
- `Failed to execute goal` → 플러그인 버전 확인
- `No main manifest attribute` → spring-boot-maven-plugin 설정 확인

### 4. Dependency Analysis
```bash
cd KiiPS-HUB && mvn dependency:tree -DoutputType=text | head -100
```

**What it checks**:
- 의존성 충돌
- 중복 라이브러리
- 버전 불일치

**Common Issues & Fixes**:
- `Duplicate classes` → exclusion 추가
- `Version conflict` → dependencyManagement로 버전 통일
- `Missing transitive dependency` → 명시적 의존성 추가

### 5. SVN Status Check
```bash
svn status
```

**What it checks**:
- 커밋되지 않은 변경사항
- 충돌 파일
- 추적되지 않은 파일

### 6. Project Structure Validation

**What it checks**:
- CLAUDE.md 존재 여부
- 환경 설정 파일 (app-local.properties 등)
- 필수 디렉토리 구조

## Output Format

```markdown
# KiiPS Project Health Check
*Run at: 2026-02-04 15:00:00*

## Passed Checks (4/6)

1. **Compile**: 24 modules compiled successfully
2. **Package**: All artifacts packaged
3. **SVN Status**: Working copy clean
4. **Structure**: All required files present

## Failed Checks (2/6)

5. **Tests**: 3 tests failed
   - FundServiceTest.testCalculation - AssertionError
   - Recommendation: Run `mvn test -Dtest=FundServiceTest`

6. **Dependencies**: 12 duplicate declarations
   - jackson-databind duplicate in KiiPS-Utils
   - Recommendation: Check pom.xml warnings

## Summary

**Overall Health**: Good (4/6 passing)

**Action Items**:
1. Fix failing tests in FundServiceTest
2. Clean up duplicate dependencies in pom.xml
3. Run full build before deployment

## Quick Fixes

```bash
# Full rebuild
cd KiiPS-HUB && mvn clean install -DskipTests

# Run specific test
mvn test -Dtest=FundServiceTest

# Check dependencies
mvn dependency:analyze
```
```

## Health Score Calculation

```
Health Score = (Passed Checks / Total Checks) x 100

- 100%: Excellent - Production ready
- 80-99%: Good - Minor issues
- 60-79%: Fair - Several issues need attention
- <60%: Poor - Critical issues, do not deploy
```

## Maven Command Reference

| Check | Command |
|-------|---------|
| Compile | `mvn clean compile -DskipTests` |
| Test | `mvn test -DskipTests=false` |
| Package | `mvn clean package -DskipTests` |
| Specific Module | `mvn -pl :KiiPS-SERVICE -am compile` |
| Dependency Tree | `mvn dependency:tree` |
| Update Check | `mvn versions:display-dependency-updates` |

## KiiPS Module Health

| Module | Port | Check Command |
|--------|------|---------------|
| Gateway | 8088 | `curl http://localhost:8088/health` |
| Common | 8701 | `curl http://localhost:8701/health` |
| Login | 8801 | `curl http://localhost:8801/health` |
| UI | 8100 | `curl http://localhost:8100/health` |
| FD | 8601 | `curl http://localhost:8601/health` |
| IL | 8401 | `curl http://localhost:8401/health` |

---

*Use this command as a quality gate before deployments, commits, or starting new features.*
