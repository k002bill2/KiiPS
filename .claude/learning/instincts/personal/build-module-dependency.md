---
id: build-module-dependency
trigger: "빌드 실패 시 의존성 오류 진단"
confidence: 0.8
domain: "build-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 15
---

# Maven 빌드 의존성 체인

## Action
빌드 실패 시 의존성 체인 순서 확인:
1. KiiPS-COMMON (공통 서비스)
2. KiiPS-UTILS (공통 DAO)
3. 서비스 모듈 (FD, IL, AC, SY, LP, EL 등)
4. KiiPS-UI (WAR, 최종)

COMMON 또는 UTILS 변경 시 의존 모듈 전체 재빌드 필요.

## Evidence
- KiiPS Parent POM 모듈 정의 기반
- COMMON/UTILS 변경 후 개별 모듈만 빌드하여 실패한 사례
