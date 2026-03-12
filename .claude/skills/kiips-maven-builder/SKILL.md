---
name: kiips-maven-builder
description: "KiiPS Maven Multi-Module 빌드 전문 스킬. Maven 빌드, 컴파일, 패키징, 의존성 해결"
disable-model-invocation: true
---

# KiiPS Maven Builder Skill

KiiPS Maven Multi-Module 프로젝트 빌드를 위한 전문 스킬입니다.

## Purpose

### What This Skill Does
- **Maven 빌드**: clean, compile, package, install 실행
- **의존성 해결**: KiiPS-COMMON, KiiPS-UTILS 의존성 체인 관리
- **모듈별 빌드**: 단일 서비스 또는 멀티 서비스 빌드
- **빌드 오류 분석**: 컴파일 에러, 의존성 충돌 해결

### What This Skill Does NOT Do
- 서비스 배포 (kiips-service-deployer 사용)
- 런타임 테스트 (kiips-api-tester 사용)

## When to Use

### User Prompt Keywords
```
"빌드", "build", "maven", "mvn", "컴파일", "compile",
"패키지", "package", "의존성", "dependency",
"clean", "install", "war", "jar"
```

### File Patterns
```
pom.xml, **/*.java (수정 후 빌드 필요 시)
```

---

## KiiPS Build Architecture

### Module Dependency Chain

```
┌─────────────────────────────────────────────────┐
│                   KiiPS-HUB                      │
│            (Parent POM - 항상 여기서 빌드)         │
└─────────────┬───────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐       ┌──────────┐
│ COMMON  │──────▶│  UTILS   │
└────┬────┘       └────┬─────┘
     │                 │
     └────────┬────────┘
              ▼
    ┌─────────────────────┐
    │   Business Services  │
    │  FD, IL, PG, LOGIN,  │
    │  COMMON-SERVICE, UI  │
    └─────────────────────┘
```

### Service Ports Reference

| 서비스 | 포트 | 모듈명 |
|--------|------|--------|
| Gateway | 8088 | KiiPS-APIGateway |
| Login | 8801 | KiiPS-LOGIN |
| Common | 8701 | KiiPS-COMMON-SERVICE |
| UI | 8100 | KiiPS-UI |
| FD | 8601 | KiiPS-FD |
| IL | 8401 | KiiPS-IL |
| PG | 8301 | KiiPS-PG |

---

## Build Commands

### 1. 전체 빌드 (권장)

```bash
# KiiPS-HUB 디렉토리에서 실행 (필수!)
# [빌드담당자] cd KiiPS-HUB && mvn clean package -DskipTests
```

**소요 시간**: ~3-5분

### 2. 특정 서비스만 빌드

```bash
# 의존성 포함 빌드 (-am: also make dependencies)
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD -am -DskipTests
```

**주의**: `-am` 플래그는 COMMON, UTILS를 먼저 빌드합니다.

### 3. 빠른 빌드 (의존성 스킵)

```bash
# COMMON/UTILS가 이미 빌드된 경우만 사용
# [빌드담당자] cd KiiPS-HUB && mvn package -pl :KiiPS-FD -DskipTests -o
```

**`-o` (offline)**: 로컬 캐시만 사용 (더 빠름)

### 4. 멀티 서비스 빌드

```bash
# 여러 서비스 동시 빌드
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD,:KiiPS-IL,:KiiPS-PG -am -DskipTests
```

### 5. 테스트 포함 빌드

```bash
# 테스트 실행
# [빌드담당자] cd KiiPS-HUB && mvn clean verify -pl :KiiPS-FD -am
```

---

## Build Troubleshooting

### Error 1: "Could not find artifact kr.co.logos:KiiPS-COMMON"

**원인**: COMMON 모듈이 빌드되지 않음

**해결**:
```bash
# -am 플래그로 의존성 포함 빌드
# [빌드담당자] cd KiiPS-HUB && mvn clean install -pl :KiiPS-COMMON,:KiiPS-UTILS -DskipTests
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD -DskipTests
```

### Error 2: "Cannot resolve symbol"

**원인**: 컴파일 에러 (타입, 메서드 불일치)

**해결**:
1. 에러 메시지 확인
2. 해당 Java 파일 수정
3. 재빌드

### Error 3: "Non-resolvable parent POM"

**원인**: KiiPS-HUB 디렉토리가 아닌 곳에서 빌드 시도

**해결**:
```bash
# 항상 KiiPS-HUB에서 빌드!
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-HUB
# [빌드담당자] mvn clean package -pl :KiiPS-FD -am -DskipTests
```

### Error 4: OutOfMemoryError

**원인**: Maven 메모리 부족

**해결**:
```bash
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"
# [빌드담당자] mvn clean package
```

---

## Build Verification

### 빌드 성공 확인

```bash
# JAR/WAR 파일 존재 확인
ls -la KiiPS-FD/target/*.jar
# 또는
ls -la KiiPS-UI/target/*.war
```

### 빌드 결과물

| 서비스 | 결과물 |
|--------|--------|
| KiiPS-FD | `KiiPS-FD/target/KiiPS-FD-1.0.jar` |
| KiiPS-IL | `KiiPS-IL/target/KiiPS-IL-1.0.jar` |
| KiiPS-UI | `KiiPS-UI/target/KiiPS-UI-1.0.war` |

---

## Best Practices

### Do's
- 항상 `KiiPS-HUB`에서 빌드
- `-am` 플래그로 의존성 포함
- 빌드 전 `svn up`으로 최신 코드 동기화
- 빌드 후 결과물 존재 확인

### Don'ts
- 개별 서비스 디렉토리에서 직접 `mvn` 실행 ❌
- COMMON/UTILS 수정 후 서비스만 빌드 ❌
- 빌드 실패 시 `-DskipTests` 없이 재시도 ❌

---

## Integration

### With Build Manager Agent
이 스킬은 `build-manager` 에이전트와 연동됩니다:
- Build Manager가 빌드 워크플로우 조율
- 이 스킬이 실제 Maven 명령 실행

### With Deployment Manager Agent
빌드 완료 후 `deployment-manager`로 배포 진행:
- 빌드 결과물 확인
- 서비스 중지/시작
- 헬스 체크

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Related**: build-manager, kiips-service-deployer
