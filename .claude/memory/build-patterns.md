# 빌드 패턴 메모리

> `/learn` 명령이 build-pattern 도메인 교훈을 자동 기록합니다.

## Maven 빌드

- 항상 KiiPS-HUB에서 실행: `cd KiiPS-HUB && mvn clean package -pl :MODULE -am`
- 의존성 순서: COMMON → UTILS → 서비스 모듈 → UI
- COMMON/UTILS 변경 시 전체 재빌드 필요

## 빌드 실패 패턴

<!-- /learn이 추가할 영역 -->

## 의존성 관리

<!-- /learn이 추가할 영역 -->

## 환경별 빌드

- local: `app-local.properties`
- staging: `app-stg.properties`
- production: `app-kiips.properties`
