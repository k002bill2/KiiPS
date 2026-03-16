---
name: checklist-generator
description: "컨텍스트 기반 체크리스트 생성 — 코드 리뷰, 배포, 테스트, ACE 검증"
disable-model-invocation: true
---

# Checklist Generator

코드 리뷰, 배포, 테스트, ACE Framework 검증을 위한 구조화된 체크리스트를 생성합니다.

## 역할

- ACE Framework Layer 6 (Task Prosecution) 검증 담당
- Feature Manager, Build Manager, UI Manager, Deployment Manager가 공유하는 검증 워커

## 체크리스트 유형

### 1. Code Review
- KiiPS 컨벤션 준수 (Controller/Service/DAO)
- 보안 취약점 (SQL Injection, XSS)
- MyBatis #{} 사용 (${} 금지)
- GlobalExceptionHandler 활용
- JWT 인증 (@PreAuthorize)

### 2. Deployment
- KiiPS-HUB에서 `mvn clean package -am` 빌드 성공
- 환경 설정 (app-*.properties) 확인
- 서비스 시작/중지 정상 동작
- 헬스체크 (/actuator/health) 응답
- 롤백 계획 수립

### 3. Testing
- Service 레이어 단위 테스트
- DAO 통합 테스트 (MyBatis mapper)
- Controller 엔드포인트 테스트
- 에러 핸들링 및 엣지 케이스
- 수동 스모크 테스트

### 4. ACE Compliance
- Layer 1: 윤리 검증 (위험 패턴 차단)
- Layer 3: 에이전트 할당 적정성
- Layer 4: 작업 분해 타당성
- Layer 5: 모듈 잠금/해제 정상
- Layer 6: 작업 완료 기준 충족

## 출력 형식

**TodoWrite** — 인터랙티브 추적
**Write** — `checklists/` 디렉토리에 마크다운 파일

## 가이드라인

- 항목당 하나의 검증 가능한 행동 (5-15개)
- 의존성 순서대로 나열
- KiiPS 특화 항목 포함 (Maven 빌드, 포트, COMMON/UTILS)
- 파일/라인 참조 포함 (예: `FundController.java:45`)
