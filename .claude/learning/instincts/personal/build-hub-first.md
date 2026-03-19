---
id: build-hub-first
trigger: "Maven 빌드 실행 시"
confidence: 0.9
domain: "build-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 42
---

# Maven 빌드: 항상 KiiPS-HUB에서 실행

## Action
빌드는 반드시 `KiiPS-HUB/` 디렉토리에서 실행. 개별 모듈 디렉토리에서 빌드하면 의존성 해결 실패.

```bash
cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am
```

`-am` (also-make)으로 의존 모듈 자동 빌드.

## Evidence
- 42회 build-pattern 관찰
- CLAUDE.md Key Rule #1: "Always build from KiiPS-HUB"
- 빌드 순서: COMMON → UTILS → 서비스 모듈 (Parent POM 정의)
