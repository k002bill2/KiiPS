---
name: kiips-startup
description: "KiiPS 서비스 시작 전 Pre-flight 체크 및 순차 기동 스킬. Use when: startup, preflight, 시작전점검, 기동, 서비스 시작, start"
disable-model-invocation: true
---

# KiiPS Service Startup Skill

서비스 시작 전 환경을 자동 점검하고, 순차적으로 기동하며, 헬스체크까지 완료하는 스킬입니다.

## Purpose

### What This Skill Does
- **Pre-flight 체크**: DB, Java, 포트, 설정 파일 사전 검증
- **순차 기동**: 의존 순서에 따라 서비스 시작
- **헬스체크**: 각 서비스 시작 후 포트 응답 확인
- **실패 보고**: 실패 단계를 명확히 보고하고 수정 제안

### What This Skill Does NOT Do
- Maven 빌드 (kiips-maven-builder 사용)
- 배포 파이프라인 (kiips-service-deployer 사용)
- 로그 분석 (kiips-log-analyzer 사용)

## When to Use

### User Prompt Keywords
```
"startup", "서비스시작", "시작", "start", "서비스 시작",
"서비스 올려", "기동", "환경 점검"
```

---

## Pre-flight Checklist (모두 통과해야 진행)

아래 5개 항목을 **순서대로** 체크합니다. 하나라도 실패하면 서비스 시작을 진행하지 않고 수정 방법을 안내합니다.

### 1. PostgreSQL 접속 확인

```bash
pg_isready -h localhost -p 5432
# 또는
psql -h localhost -p 5432 -U kiips -c "SELECT 1" 2>/dev/null
```

**실패 시**: `brew services start postgresql@16` 또는 DB 설정 확인 안내

### 2. Java 버전 확인

```bash
java -version 2>&1 | head -1
# 기대: openjdk version "1.8.x" 또는 java version "1.8.x"
```

**실패 시**: JAVA_HOME 설정 안내, `export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home`

### 3. 포트 충돌 점검

```bash
lsof -i :8088 -i :8100 -i :8601 -i :8401 -i :8701 -i :8801 2>/dev/null
```

**충돌 발견 시**: 점유 프로세스 PID와 이름 보고, `kill <PID>` 제안 (사용자 확인 필요)

### 4. 설정 파일 확인

각 서비스 디렉토리에서 `app-local.properties` 또는 적절한 프로파일 설정 존재 확인:

```bash
# 예시: KiiPS-FD
ls KiiPS-FD/src/main/resources/app-local.properties 2>/dev/null
```

**누락 시**: 어떤 서비스의 설정이 없는지 구체적으로 보고

### 5. Maven 빌드 아티팩트 확인

```bash
# 각 서비스의 target/*.jar 존재 확인
ls KiiPS-FD/target/*.jar 2>/dev/null
ls KiiPS-COMMON-SERVICE/target/*.jar 2>/dev/null
# ... 필요한 서비스들
```

**누락 시**: `cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am` 빌드 제안

---

## 시작 순서 (의존성 기반)

Pre-flight 통과 후 아래 순서로 시작합니다. **각 단계에서 헬스체크 통과 후 다음으로 진행**.

```
1. PostgreSQL (이미 실행 중이면 스킵)
   ↓
2. KIIPS-APIGateway (8088)
   ↓ [헬스체크: curl localhost:8088/actuator/health]
3. KiiPS-COMMON-SERVICE (8701)
   ↓ [헬스체크: curl localhost:8701/actuator/health]
4. KiiPS-LOGIN (8801)
   ↓ [헬스체크: curl localhost:8801/actuator/health]
5. KiiPS-UI (8100)
   ↓ [헬스체크: curl localhost:8100/]
6. 도메인 서비스 (필요한 것만)
   - KiiPS-FD (8601)
   - KiiPS-IL (8401)
   - 기타 요청된 서비스
```

### 각 서비스 시작 패턴

```bash
cd <SERVICE_DIR> && ./start.sh
# 10초 대기 후 헬스체크
sleep 10
curl -s http://localhost:<PORT>/actuator/health
```

### 헬스체크 기준

- **최대 대기**: 60초 (10초 간격 x 6회)
- **성공 기준**: HTTP 200 + `{"status":"UP"}` 또는 HTTP 200 응답
- **포트 응답 확인 전 "실행 중"이라 보고하지 말 것**

---

## 실패 처리

### 원칙
1. 실패한 단계를 **구체적으로** 보고 (어떤 서비스, 어떤 에러)
2. **다음 단계 진행 금지** — 의존 서비스가 실패하면 하위 서비스 시작하지 않음
3. **수정 제안** 제공 (포트 해제 명령, 설정 파일 경로, 로그 위치 등)

### 일반적인 실패 원인과 해결

| 실패 유형 | 원인 | 해결 |
|-----------|------|------|
| DB 연결 실패 | PostgreSQL 미실행 | `brew services start postgresql@16` |
| 포트 충돌 | 이전 프로세스 잔존 | `lsof -i :<PORT>` → `kill <PID>` |
| Java 버전 불일치 | JAVA_HOME 잘못 설정 | `export JAVA_HOME=...` |
| JAR 미존재 | 빌드 미완료 | `cd KiiPS-HUB && mvn clean package` |
| 설정 파일 누락 | 프로파일 미설정 | `app-local.properties` 생성 안내 |
| 메모리 부족 | JVM 힙 초과 | start.sh의 `-Xmx` 설정 확인 |

---

## 사용 예시

### 전체 서비스 시작
```
"서비스 시작해줘" / "startup" / "start"
→ Pre-flight 5항목 → Gateway → Common → Login → UI 순서로 기동
```

### 특정 서비스만 시작
```
"FD 서비스만 시작" / "펀드 서비스 시작"
→ Pre-flight (DB + Java + 포트 8601) → FD 시작
→ 단, 의존 서비스(Gateway, Common) 미실행 시 경고
```

---

## Integration

### With kiips-service-deployer
- startup: 환경 점검 + 기동 (개발 환경)
- deployer: 빌드→배포→검증 파이프라인 (스테이징/프로덕션)

### With kiips-maven-builder
- Pre-flight에서 JAR 누락 발견 시 빌드 스킬로 연계

---

**Version**: 1.0.0
**Last Updated**: 2026-02-09
**Related**: kiips-service-deployer, kiips-maven-builder, kiips-api-tester
