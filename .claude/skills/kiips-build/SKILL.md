---
name: kiips-build
description: "KiiPS 빌드/배포/기동 통합 스킬. Maven 빌드, 서비스 배포, Pre-flight 체크, 헬스체크. Use when: 빌드, 배포, build, deploy, maven, mvn, start, stop, restart, startup"
disable-model-invocation: true
---

# KiiPS Build & Deploy (통합)

> kiips-maven-builder + kiips-service-deployer + kiips-build-deploy + kiips-startup 통합

---

## Quick Reference

```bash
# 1. 빌드 (항상 KiiPS-HUB에서)
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am -DskipTests

# 2. 서비스 중지/시작
./stop.sh && ./start.sh

# 3. 로그 확인
tail -f logs/log.$(date "+%Y-%m-%d")-0.log

# 4. 헬스체크
curl -s http://localhost:{port}/actuator/health
```

---

## 빌드 파이프라인

```
[Pre-flight] → [빌드] → [테스트] → [배포] → [헬스체크]
  환경점검      maven    JUnit    start.sh   curl
  DB/Java/포트  compile  verify   stop.sh    /health
```

---

## Module Dependency Chain

```
KiiPS-HUB (Parent POM - 항상 여기서 빌드)
    ├── COMMON → UTILS → Business Services
    └── FD(8601), IL(8401), PG(8301), Login(8801), Common(8701), UI(8100), Gateway(8088)
```

---

## Build Commands

| 빌드 유형 | 명령어 |
|-----------|--------|
| 전체 빌드 | `cd KiiPS-HUB && mvn clean package -DskipTests` |
| 특정 서비스 | `cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD -am -DskipTests` |
| 빠른 빌드 | `cd KiiPS-HUB && mvn package -pl :KiiPS-FD -DskipTests -o` |
| 멀티 서비스 | `cd KiiPS-HUB && mvn clean package -pl :KiiPS-FD,:KiiPS-IL -am -DskipTests` |
| 테스트 포함 | `cd KiiPS-HUB && mvn clean verify -pl :KiiPS-FD -am` |

---

## Pre-flight Checklist

서비스 시작 전 5가지 검증 (하나라도 실패하면 중단):

1. **DB 접속**: PostgreSQL 연결 테스트
2. **Java 버전**: `java -version` → 1.8.x
3. **포트 충돌**: `lsof -i :8088 :8100 :8601 :8401 :8701 :8801`
4. **설정 파일**: `app-local.properties` 존재 확인
5. **의존 서비스**: Gateway(8088), Common(8701), Login(8801) 실행 확인

---

## 서비스 기동 순서

```
1. Gateway (8088)     - API 라우팅
2. Login (8801)       - 인증
3. Common (8701)      - 공통 서비스
4. FD/IL/PG           - 비즈니스 서비스
5. UI (8100)          - 웹 인터페이스 (마지막)
```

---

## Build Troubleshooting

| 에러 | 원인 | 해결 |
|------|------|------|
| "Could not find artifact KiiPS-COMMON" | COMMON 미빌드 | `-am` 플래그 추가 |
| "Non-resolvable parent POM" | 잘못된 디렉토리 | KiiPS-HUB에서 실행 |
| OutOfMemoryError | 메모리 부족 | `MAVEN_OPTS="-Xmx2g"` |
| 포트 충돌 | 이전 프로세스 잔존 | `./stop.sh` 후 `lsof` 확인 |

---

## Best Practices

- 항상 `KiiPS-HUB`에서 빌드
- `-am` 플래그로 의존성 포함
- 빌드 전 `svn up`으로 최신 코드 동기화
- 개별 서비스 디렉토리에서 직접 `mvn` 실행 금지

---

**Merged from**: kiips-maven-builder, kiips-service-deployer, kiips-build-deploy, kiips-startup
**Version**: 2.0.0
