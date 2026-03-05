# CLAUDE.md 템플릿
#template #claude-code #project-setup

## 개요
이 문서는 Claude Code가 프로젝트를 이해하고 효과적으로 작업할 수 있도록 돕는 핵심 문서입니다. 프로젝트 루트에 `CLAUDE.md` 파일로 저장하세요.

---

```markdown
# Project Context for Claude Code

## 🎯 Project Overview
- **Name**: [프로젝트 이름]
- **Purpose**: [프로젝트의 주요 목적과 목표]
- **Tech Stack**: 
  - Frontend: [React, Vue, Next.js 등]
  - Backend: [Node.js, Python, Go 등]
  - Database: [PostgreSQL, MongoDB 등]
  - Infrastructure: [AWS, Docker, Kubernetes 등]
- **Current Phase**: [개발/테스트/배포 단계]
- **Team Size**: [혼자/팀 규모]

## 📁 Project Structure
\`\`\`
project-root/
├── src/                 # 소스 코드
│   ├── components/     # UI 컴포넌트
│   ├── services/       # 비즈니스 로직
│   ├── utils/          # 유틸리티 함수
│   └── types/          # TypeScript 타입 정의
├── tests/              # 테스트 파일
│   ├── unit/          # 단위 테스트
│   └── e2e/           # E2E 테스트
├── docs/              # 문서
├── scripts/           # 빌드/배포 스크립트
└── config/            # 설정 파일
\`\`\`

## 🛠️ Development Guidelines

### Code Style
- **Language**: [JavaScript/TypeScript/Python]
- **Style Guide**: [ESLint/Prettier/Black 설정]
- **Linting**: \`npm run lint\` 또는 \`pylint\`
- **Formatting**: \`npm run format\` 또는 \`black .\`

### Naming Conventions
- **Functions**: camelCase (예: getUserData)
- **Classes**: PascalCase (예: UserService)
- **Constants**: UPPER_SNAKE_CASE (예: MAX_RETRY_COUNT)
- **Files**: 
  - Components: PascalCase.tsx
  - Utilities: camelCase.ts
  - Tests: *.test.ts 또는 *.spec.ts

### Git Workflow
- **Branch Naming**:
  - feature/[feature-name]
  - bugfix/[bug-description]
  - hotfix/[issue-number]
  - release/[version]
  
- **Commit Format**:
  \`\`\`
  [type]: [description]
  
  Types:
  - feat: 새로운 기능
  - fix: 버그 수정
  - docs: 문서 수정
  - style: 코드 포맷팅
  - refactor: 코드 리팩토링
  - test: 테스트 추가
  - chore: 빌드 관련 수정
  \`\`\`

### Testing Requirements
- **Unit Test Coverage**: 최소 80%
- **Test Framework**: [Jest/Pytest/Go test]
- **E2E Tests**: 핵심 사용자 플로우 필수
- **Test Command**: \`npm test\` 또는 \`pytest\`

## ⚡ Common Tasks

### Task 1: Add New Feature
1. Create feature branch from main
2. Implement feature in src/
3. Write unit tests (min 80% coverage)
4. Add integration tests if needed
5. Update documentation
6. Run linter and formatter
7. Create pull request with description

### Task 2: Fix Bug
1. Create bugfix branch
2. Write failing test that reproduces the bug
3. Implement fix
4. Verify all tests pass
5. Update changelog
6. Create PR with issue reference

### Task 3: Code Review
1. Check code quality and readability
2. Verify test coverage
3. Review security implications
4. Check performance impact
5. Validate documentation updates

### Task 4: Deploy
1. Run all tests
2. Build production bundle
3. Update version number
4. Generate release notes
5. Deploy to staging
6. Run smoke tests
7. Deploy to production

## 🔒 Security & Permissions

### Protected Files
- **Never Modify**:
  - .env.production
  - secrets/
  - certificates/
  
### Sensitive Operations
- **Always Test Before**:
  - Database migrations
  - API schema changes
  - Authentication changes
  - Payment processing

### Required Reviews
- Security-related changes
- Database schema modifications
- API breaking changes
- Infrastructure updates

## 🎨 Output Styles

### Error Handling
\`\`\`typescript
try {
  // Operation
} catch (error) {
  logger.error('Descriptive error message', {
    error,
    context: relevantData
  });
  // Handle gracefully
}
\`\`\`

### Logging
- Use structured logging
- Include context and metadata
- Follow log levels: ERROR, WARN, INFO, DEBUG

### Comments
- JSDoc for all public functions
- Inline comments for complex logic
- TODO comments with assignee and date

## 📊 Performance Guidelines

### Frontend
- Bundle size < 200KB (gzipped)
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

### Backend
- API response time < 200ms (p95)
- Database query time < 50ms
- Memory usage < 512MB
- CPU usage < 70%

## 🔄 CI/CD Pipeline

### Stages
1. **Lint & Format Check**
2. **Unit Tests**
3. **Integration Tests**
4. **Build**
5. **Security Scan**
6. **Deploy to Staging**
7. **E2E Tests**
8. **Deploy to Production**

### Deployment Environments
- **Development**: auto-deploy from develop branch
- **Staging**: auto-deploy from main branch
- **Production**: manual approval required

## 📝 Important Notes

### Current Challenges
- [현재 직면한 기술적 과제]
- [알려진 버그나 이슈]
- [성능 병목 지점]

### Technical Debt
- [리팩토링이 필요한 부분]
- [레거시 코드 위치]
- [업데이트 필요한 의존성]

### Future Considerations
- [계획된 주요 기능]
- [아키텍처 변경 사항]
- [확장성 고려사항]

## 🔗 Resources

### Internal Documentation
- [API Documentation](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Database Schema](./docs/database.md)

### External Resources
- [Design System]()
- [API Documentation]()
- [Deployment Guide]()

## 👥 Contacts

- **Project Lead**: [이름/연락처]
- **Tech Lead**: [이름/연락처]
- **DevOps**: [이름/연락처]

---

*Last Updated: [날짜]*
*Version: 1.0.0*
\`\`\`

---

## 사용 가이드

### 1. 필수 섹션
- Project Overview
- Project Structure
- Development Guidelines
- Common Tasks

### 2. 프로젝트별 커스터마이징
- 기술 스택에 맞게 수정
- 팀 규칙 반영
- 실제 디렉토리 구조 업데이트

### 3. 유지보수
- 주요 변경사항 발생시 업데이트
- 버전 관리
- 팀과 공유

### 4. 효과적인 활용
- Claude Code 세션 시작시 자동 로드
- 일관된 코드 스타일 유지
- 빠른 온보딩 지원

---

## 📘 KiiPS 프로젝트 예시

### KiiPS 특화 CLAUDE.md 템플릿

```markdown
# KiiPS Project Context for Claude Code

## 🎯 Project Overview
- **Name**: KiiPS (Korea Investment Information Processing System)
- **Purpose**: 벤처투자 종합관리 시스템 - 펀드, 투자, 회계, LP 관리
- **Architecture**: 마이크로서비스 기반 엔터프라이즈 플랫폼
- **Tech Stack**:
  - Backend: Spring Boot 2.4.2, Java 8
  - Gateway: Spring Cloud Gateway
  - Frontend: JSP, jQuery, Bootstrap, DataTables, AmCharts, RealGrid
  - Build: Maven Multi-Module
  - VCS: SVN
  - Deployment: Linux, Tomcat
- **Service Count**: 20+ 독립 마이크로서비스
- **Current Phase**: 운영 중 (지속적 기능 개선)

## 📁 Project Structure (Maven Multi-Module)
\`\`\`
KiiPS/
├── KiiPS-HUB/              # ⭐ Parent POM (모든 빌드의 시작점)
│   └── pom.xml             # 공통 의존성, 플러그인, 버전 관리
├── KIIPS-APIGateway/       # API Gateway & Routing (Port 8000)
├── KiiPS-COMMON/           # 공통 서비스 (Port 8701)
│   ├── GlobalExceptionHandler
│   ├── ErrorNotificationService (Slack)
│   └── Common_API_Service
├── KiiPS-UTILS/            # 공통 DAO & 유틸리티
│   └── dao/                # 데이터베이스 접근 레이어
├── KiiPS-UI/               # 웹 인터페이스 (WAR, Port 8100)
│   ├── src/main/resources/static/
│   └── src/main/webapp/WEB-INF/views/
├── KiiPS-Login/            # 인증 & JWT (Port 8801)
├── KiiPS-FD/               # 펀드 관리 (Port 8601)
├── KiiPS-IL/               # 투자 관리 (Port 8401)
├── KiiPS-PG/               # 프로그램 관리 (Port 8201)
├── KiiPS-AC/               # 회계 관리
├── KiiPS-LP/               # LP 관리
└── [기타 20+ 비즈니스 모듈]
\`\`\`

## 🛠️ Development Guidelines

### Build Rules (매우 중요!)
\`\`\`bash
# ⚠️ CRITICAL: 항상 KiiPS-HUB에서 빌드
cd KiiPS-HUB/

# 전체 빌드
mvn clean package

# 특정 서비스 + 의존성 자동 빌드
mvn clean package -pl :KiiPS-FD -am

# 빌드 순서 (자동 처리됨)
# COMMON → UTILS → 각 서비스
\`\`\`

### Environment Configuration
\`\`\`
각 서비스/
├── app-local.properties     # 로컬 개발
├── app-stg.properties       # 스테이징
└── app-kiips.properties     # 프로덕션
\`\`\`

### Service Communication
\`\`\`java
// Service-to-Service 호출
@Autowired
private Common_API_Service commonApiService;

String url = "http://localhost:8401/api/investments/...";
Map<String, String> headers = Map.of("x-api-key", "key");
Result result = commonApiService.get(url, Result.class, headers);
\`\`\`

### Code Style
- **Language**: Java 8
- **Framework**: Spring Boot 2.4.2
- **Packaging**: JAR (서비스), WAR (UI 모듈)
- **Dependency Management**: Maven

## ⚡ Common Tasks

### Task 1: Add New REST Endpoint
1. Controller: \`src/main/java/com/kiips/{domain}/controll/\`
2. Service: \`src/main/java/com/kiips/{domain}/service/\`
3. DAO: KiiPS-UTILS 사용 또는 \`dao/\` 추가
4. API Gateway routing 설정 확인

### Task 2: Build & Deploy Service
\`\`\`bash
# 1. SVN 업데이트
cd KiiPS-ServiceName/ && svn up

# 2. 빌드 (KiiPS-HUB에서!)
cd ../KiiPS-HUB/
mvn clean package -pl :KiiPS-ServiceName -am

# 3. 배포
cd ../KiiPS-ServiceName/
./start.sh

# 4. 로그 확인
tail -f logs/log.$(date "+%Y-%m-%d")-0.log
\`\`\`

### Task 3: Handle Exceptions
- **Global**: KiiPS-COMMON의 \`GlobalExceptionHandler\` 자동 처리
- **Slack 알림**: \`ErrorNotificationService\` 자동 전송
- **Custom**: Service layer에서 비즈니스 예외 throw

### Task 4: Test Service Integration
\`\`\`bash
# 서비스 상태 확인
curl http://localhost:8000/health

# API Gateway를 통한 호출
curl -H "X-AUTH-TOKEN: jwt-token" \
     http://localhost:8000/api/funds/list
\`\`\`

## 🔒 Security & Permissions

### Authentication Flow
\`\`\`
Client → API Gateway (8000)
  ↓ JWT 검증
Service (KiiPS-Login)
  ↓ 인증 성공
Business Service (8xxx)
\`\`\`

### Custom Headers
- \`X-AUTH-TOKEN\`: JWT 인증 토큰
- \`logostoken\`: 커스텀 인증 토큰
- \`x-api-key\`: Service-to-Service 호출

## 📊 Service Ports (Local)

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8000 | 라우팅 & 인증 |
| UI | 8100 | 웹 인터페이스 |
| Login | 8801 | 인증 |
| Common | 8701 | 공통 서비스 |
| FD (펀드) | 8601 | 펀드 관리 |
| IL (투자) | 8401 | 투자 관리 |
| PG (프로그램) | 8201 | 프로그램 관리 |

## 📝 Important Notes

### Critical Build Rules
1. **항상 KiiPS-HUB에서 빌드** - 의존성 해결 필수
2. **빌드 순서** - COMMON → UTILS → 서비스
3. **\`-am\` 플래그 사용** - 의존성 자동 빌드
4. **SVN 통합** - 빌드 스크립트에 \`svn up\` 포함

### Testing Guidelines
- 기본적으로 비활성화 (\`<skipTests>true</skipTests>\`)
- 활성화 시 \`pom.xml\` 수정 필요

### UI Module Specifics
- **패키징**: WAR (다른 서비스는 JAR)
- **뷰**: JSP
- **보안**: Lucy XSS 필터
- **리소스**: \`src/main/resources/static/\`

## 🔗 Resources

### Internal Documentation
- [Architecture Guide](./architecture.md) - 시스템 설계, 모듈 구조
- [API Documentation](./api.md) - API Gateway, 인증, 엔드포인트
- [Deployment Guide](./deployment.md) - 빌드, 배포, 환경 관리
- [Troubleshooting](./troubleshooting.md) - 문제 해결 가이드

### Quick Links
- 🏗️ [Architecture](./architecture.md) - 시스템 설계
- 🌐 [API Spec](./api.md) - API 개발
- 🚀 [Deployment](./deployment.md) - 배포 운영
- 🔧 [Troubleshooting](./troubleshooting.md) - 문제 해결

---

*Last Updated: 2025-12-28*
*Version: KiiPS 2.x*
*Environment: Local Development*
\`\`\`

---

## KiiPS 템플릿 사용 가이드

### 1. 핵심 특징
- **Maven Multi-Module**: KiiPS-HUB 중심 빌드 필수
- **마이크로서비스**: 20+ 독립 서비스 구조
- **SVN 통합**: 버전 관리 및 빌드 자동화
- **환경별 설정**: local/stg/kiips 프로퍼티 관리

### 2. 빌드 워크플로우
1. KiiPS-HUB로 이동
2. \`mvn clean package -pl :ServiceName -am\`
3. 서비스 디렉토리로 이동
4. \`./start.sh\` 실행

### 3. 주의사항
- 절대 서비스 디렉토리에서 직접 빌드하지 말 것
- 의존성 변경 시 COMMON/UTILS 우선 빌드
- 환경별 프로퍼티 파일 확인 필수

---

*태그: #template #claude-code #project-setup #documentation #kiips #enterprise*