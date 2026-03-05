# CLAUDE.md

> KiiPS (Korea Investment Information Processing System) - Claude Code 가이드

---

## Quick Reference

```bash
# Build (항상 KiiPS-HUB에서 실행)
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am

# Run
./start.sh && tail -f logs/log.$(date "+%Y-%m-%d")-0.log

# Stop
./stop.sh
```

---

## Key Rules

1. **Always build from KiiPS-HUB** - 의존성 해결 필수
2. **Read subdirectory CLAUDE.md first** - 하위 디렉토리 작업 전 해당 CLAUDE.md 확인
3. **Use SVN** (not Git) - `svn up` 으로 업데이트

---

## Dark Theme Rules

| 규칙 | 상세 |
|------|------|
| 셀렉터 | `[data-theme=dark]` 만 사용 (`.dark`, `.theme-dark` 금지) |
| !important | 인라인 스타일 오버라이드 시에만 사용 |
| 파일 대상 | SCSS 파일만 수정 (CSS 직접 수정 금지) |
| 레이아웃 금지 | width/height/display/position/margin/padding 변경 금지 |
| 변수 사용 | `$dark-bg`, `$dark-color-2` 등 기존 변수 활용 |
| 참조 파일 | `themes/default/_dark.scss` (변수), `layouts/_dark.scss` (컴포넌트) |

---

## Revert & Change Management

1. **체크포인트** - 다중 파일 편집 전 변경 대상 파일 목록 확인
2. **정확한 복원** - '되돌리기' 시 원본 그대로 복원 (부분 되돌리기/재해석 금지)
3. **최소 편집** - 광범위한 리팩토링보다 정밀 수정 선호
4. **관심사 분리** - 버그 수정과 리팩토링을 혼합하지 말 것
5. **즉시 응답** - 사용자가 "되돌려"라고 하면 논쟁 없이 즉시 실행

---

## Project Structure (Monorepo)

- **Parent POM**: `KiiPS-HUB/` (항상 여기서 빌드)
- **빌드 순서**: COMMON → UTILS → 서비스 모듈
- **SCSS 위치**: `KiiPS-UI/src/main/resources/static/css/sass/`
- **JSP 위치**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`
- **모듈 검색**: API/공통 코드 추적 시 모든 모듈 검색 (루트만 보지 말 것)
- **주요 모듈**: KiiPS-FD(펀드), KiiPS-IL(투자원장), KiiPS-AC(회계), KiiPS-SY(시스템), KiiPS-LP(LP관리), KiiPS-EL(전자원장), KIIPS-BATCH, KIIPS-HELP

---

## Service Startup Checklist

`./start.sh` 실행 전:
1. DB 접속 가능? (PostgreSQL 연결 테스트)
2. `app-local.properties` 또는 `.env` 설정 확인?
3. Java 8 활성? (`java -version` → 1.8.x)
4. 포트 충돌 없음? (`lsof -i :8088 :8100 :8601 :8401 :8701 :8801`)
5. 의존 서비스 실행 중? (Gateway 8088, Common 8701, Login 8801)
6. 포트 응답 확인 전 "실행 중"이라 보고하지 말 것

---

## Error Handling Rules

1. **근본 원인 우선** - 코드 변경 전 가설을 먼저 제시
2. **캐시 삭제 금지** - 사용자 확인 없이 `.m2`, `node_modules` 등 삭제 금지
3. **악화 시 중단** - 수정이 상황을 악화시키면 즉시 되돌리기
4. **한 번에 하나** - 5개 변경을 동시에 하지 말고, 하나씩 검증
5. **상태 보존** - 디버깅 중 관련 없는 작동 중인 파일 수정 금지

---

## Editing Rules

1. **범위 제한** - 요청된 내용만 수정, 기능/레이아웃/로직 변경 금지
2. **대상 파일 확인** - JSP 편집 시 유사 파일이 있으면 사용자에게 먼저 확인
3. **점진적 적용** - 벌크 편집(10+ 파일) 시 2-3개 먼저 적용 후 사용자 확인
4. **주석 검색 포함** - 파일 참조 검색 시 주석 처리된 코드도 포함
5. **컴파일 검증** - SCSS 편집 후 컴파일 성공 확인 전 완료 보고 금지
6. **회귀 즉시 복원** - 변경이 컴파일/기능을 깨뜨리면 즉시 되돌리고 보고

---

## Documentation

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 시스템 구조, 모듈, 통신 패턴 |
| [api.md](./api.md) | API Gateway, 엔드포인트, 인증 |
| [deployment.md](./deployment.md) | 빌드, 배포, 환경 관리 |
| [troubleshooting.md](./troubleshooting.md) | 문제 해결, 디버깅 |
| [docs/REALGRID_GUIDE.md](./docs/REALGRID_GUIDE.md) | RealGrid 2.6.3 가이드 |
| [docs/SCSS_GUIDE.md](./docs/SCSS_GUIDE.md) | SCSS 테마 시스템 |
| [docs/AGENT_TEAMS_GUIDE.md](./docs/AGENT_TEAMS_GUIDE.md) | Agent Teams 팀 운영 가이드 |

---

## Service Ports

| Service | Port | Service | Port |
|---------|------|---------|------|
| Gateway | 8088 | Login | 8801 |
| Common | 8701 | UI | 8100 |
| FD | 8601 | IL | 8401 |

---

## Tech Stack

- **Backend**: Spring Boot 2.4.2, Java 8
- **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.6.3, ApexCharts
- **Build**: Maven Multi-Module
- **VCS**: SVN

---

## Active Skills

| Skill | 용도 |
|-------|------|
| `kiips-ace-essentials` | ACE 핵심 가드레일 (위험 차단, 보호 모듈, 빌드 순서, 에이전트 라우팅) |
| `kiips-page-pattern-guide` | JSP 페이지 표준 패턴 (레이아웃, Include, 연동) |
| `kiips-search-filter-guide` | 검색필터 (MainComponent, Constant, 필터바) |
| `kiips-button-guide` | 버튼 영역 (inc_main_button, 권한, 아이콘) |
| `kiips-realgrid-guide` | RealGrid 그리드 생성, 설정, Excel, 성능 |
| `kiips-ui-component-builder` | JSP 컴포넌트 템플릿 생성 |
| `kiips-scss-theme-manager` | SCSS 테마 및 디자인 토큰 |
| `kiips-responsive-validator` | 반응형 디자인 검증 |
| `kiips-darktheme-applier` | 다크테마 전용 적용 워크플로우 |
| `kiips-regist-modal-guide` | 등록/수정 모달 생성 (폼, 그리드, columnGroup) |
| `kiips-a11y-checker` | WCAG 2.1 AA 접근성 검증 |
| `kiips-api-tester` | API 엔드포인트 테스트, 헬스 체크 |
| `kiips-backend-guidelines` | Controller/Service/DAO 표준 패턴, API 설계 |
| `kiips-build-deploy` | 빌드+배포 통합 워크플로우 (빌드→테스트→배포→헬스체크) |
| `kiips-common-patterns` | KiiPS-COMMON/UTILS 공통 코드, 예외 처리 |
| `kiips-database-verification` | DB 변경 검증, MyBatis 안전 패턴, DBA 승인 |
| `kiips-detail-page-planner` | 상세페이지 개발 계획서 자동 생성 |
| `kiips-feature-planner` | Feature 개발 계획 수립 (마이크로서비스) |
| `kiips-frontend-guidelines` | JSP/jQuery/Bootstrap 표준 패턴, AJAX 규칙 |
| `kiips-log-analyzer` | 로그 분석, 에러 탐지, 모니터링 |
| `kiips-maven-builder` | Maven Multi-Module 빌드, 의존성 해결 |
| `kiips-mybatis-guide` | MyBatis mapper, 동적 SQL, SQL Injection 방지 |
| `kiips-security-guide` | Spring Security, XSS/CSRF 방어, 인증/인가 |
| `kiips-service-deployer` | 서비스 배포, 중지, 재시작 |
| `kiips-startup` | 서비스 시작 Pre-flight 체크 및 순차 기동 |
| `kiips-test-runner` | JUnit/Jest/Karma 테스트 실행 및 검증 |
| `parallel-coordinator` | 병렬 에이전트 실행 조정 (ACE Framework) |

---

## Core Modules

| 모듈 | 역할 |
|------|------|
| **KiiPS-HUB** | Parent POM |
| **KiiPS-COMMON** | 공통 서비스 |
| **KiiPS-UTILS** | 공통 DAO |
| **KiiPS-UI** | 웹 인터페이스 (WAR) |
| **KIIPS-APIGateway** | API 라우팅 |

---

## Environment Files

- `app-local.properties` - 로컬 개발
- `app-stg.properties` - 스테이징
- `app-kiips.properties` - 프로덕션

---

## Agent Teams (에이전트 팀)

> 상세 가이드: [docs/AGENT_TEAMS_GUIDE.md](./docs/AGENT_TEAMS_GUIDE.md)

---

**상세 정보는 위 Documentation 링크 참조**
