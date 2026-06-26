---
name: checklist-generator
description: "KiiPS 작업 완료 후 품질 검증용 구조화 체크리스트 생성 (코드 리뷰/배포/테스트). Use when: checklist, 체크리스트, TODO, todo, task list, verification. NOT for: 빌드 실행(use kiips-build), 테스트 실행(use kiips-test-runner), 품질 종합 점검(use kiips-quality), 레거시 준수 검증(use legacy-compliance-checker)"
disable-model-invocation: true
---

# Checklist Generator

코드 리뷰, 배포, 테스트, 품질 검증을 위한 구조화된 체크리스트를 생성합니다.

## 역할

- 작업 완료 후 품질 검증 체크리스트 생성
- Feature Manager, Build Manager, UI Manager, Deployment Manager가 공유하는 검증 워커

## 체크리스트 유형

### 1. Code Review
- KiiPS 컨벤션 준수 (Controller/Service/DAO)
- 보안 취약점 (SQL Injection, XSS)
- SQL 바인딩 안전 (inline SQL DAO — `${}` 문자열연결 금지, 상세 kiips-mybatis-guide)
- GlobalExceptionHandler 활용 (KiiPS-COMMON com.kiips.common.exception)
- 인증/인가 (Gateway JWT + com.kiips.exception.Auth* 예외 기반)

### 2. Deployment
- KiiPS-HUB에서 `mvn clean package -am` 빌드 성공
- 환경 설정 (app-*.properties) 확인
- 서비스 시작/중지 정상 동작
- 헬스체크 (/actuator/health) 응답
- 롤백 계획 수립

### 3. Testing
- Service 레이어 단위 테스트
- DAO 통합 테스트 (inline SQL DAO)
- Controller 엔드포인트 테스트
- 에러 핸들링 및 엣지 케이스
- 수동 스모크 테스트

## 출력 형식

**TodoWrite** — 인터랙티브 추적
**Write** — `checklists/` 디렉토리에 마크다운 파일

## 가이드라인

- 항목당 하나의 검증 가능한 행동 (5-15개)
- 의존성 순서대로 나열
- KiiPS 특화 항목 포함 (Maven 빌드, 포트, COMMON/UTILS)
- 파일/라인 참조 포함 (예: `FundAPIController.java:45`)
