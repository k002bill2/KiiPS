---
name: kiips-ace-essentials
description: "KiiPS ACE 핵심 가드레일 - 위험 패턴 차단, 보호 모듈, 빌드 순서, 에이전트 라우팅. Use when: 병렬, parallel, 에이전트, agent, 조정, coordination"
user-invocable: false
---

# KiiPS ACE Essentials

## Danger Guards (차단 패턴)

ethicalValidator.js의 BLOCKED_OPERATIONS에서 차단하는 카테고리:
- **database**: DDL 파괴 명령 (구조 변경, 대량 삭제)
- **filesystem**: 재귀적 시스템 파일 삭제
- **deployment**: 위험한 VCS 명령 (강제 푸시, 전체 되돌리기)
- **credentials**: 소스코드 내 하드코딩된 자격증명

## Protected Modules (편집 주의)

| 모듈 | 역할 | 편집 시 주의사항 |
|------|------|-----------------|
| KiiPS-HUB | Parent POM | 빌드 순서 영향 |
| KiiPS-COMMON | 공통 서비스 | 모든 모듈 의존 |
| KiiPS-UTILS | 공통 DAO | 모든 모듈 의존 |
| KiiPS-APIGateway | API 라우팅 | 전체 서비스 라우팅 |
| KiiPS-Login | 인증 서비스 | 보안 민감 |

## Build Pattern (빌드 순서)

```
항상 KiiPS-HUB에서 실행:
  cd KiiPS-HUB && mvn clean package -pl :TARGET_MODULE -am

빌드 의존성 순서:
  COMMON -> UTILS -> 서비스 모듈(FD/IL/AC/SY/LP/EL) -> UI
```

## Task-to-Agent Routing

| 작업 유형 | 적합한 Agent |
|-----------|-------------|
| Maven 빌드 | Build Manager |
| 서비스 시작/중지/배포 | Deployment Manager |
| 기능 개발 (Controller+Service+JSP) | Feature Manager |
| UI 화면/그리드/차트 | UI Manager |
| 보안 검토 | Security Reviewer |
| 코드 단순화 | Code Simplifier |

## Complexity Routing

| 복잡도 | 기준 | 에이전트 수 |
|--------|------|------------|
| TRIVIAL | 슬래시 명령, yes/no, 3단어 이하 | 0 (주입 없음) |
| STANDARD | 일반 개발 요청 | 1 (스킬 활성화만) |
| COMPLEX | 다중 모듈, 병렬 작업, 아키텍처 | 2-5 (팀 구성) |
