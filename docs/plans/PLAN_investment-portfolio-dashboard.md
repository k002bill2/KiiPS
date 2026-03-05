# Feature Plan: 투자 포트폴리오 대시보드

**Status**: 🔄 진행 중
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Estimated Completion**: 2025-01-03
**Service**: KiiPS-IL (Port: 8401)
**Developer**: [담당자명]

---

## ⚠️ 진행 규칙

**각 Phase 완료 후 반드시**:
1. ✅ Task 체크박스 완료 표시
2. 🔧 Quality Gate 검증 (빌드 + 시작 + 테스트)
3. 📅 "Last Updated" 날짜 업데이트
4. 📝 이슈 발생 시 Notes 섹션 기록
5. 💾 SVN 커밋 (`svn commit -m "Phase X complete"`)
6. ➡️ 모든 검증 통과 후 다음 Phase 진행

⛔ **Quality Gate 실패 시 다음 Phase 진행 금지**

---

## 📋 Feature 개요

### 기능 설명
투자 현황을 한눈에 파악할 수 있는 종합 대시보드를 KiiPS-IL 서비스에 추가합니다.

**주요 기능**:
- **투자 현황 요약**: 총 투자금액, 투자 건수, 진행 상태별 건수
- **산업별/단계별 투자 분포 차트**: ApexCharts를 활용한 시각화
- **최근 투자 목록 테이블**: RealGrid 2.8.8로 페이징/정렬 지원
- **투자 성과 지표**: IRR, ROI, Exit 현황 등

### 완료 기준 (Success Criteria)
- [ ] API 응답 시간 < 500ms
- [ ] 전체 사용자가 권한에 따라 데이터 조회 가능
- [ ] 차트가 정상적으로 렌더링 (ApexCharts - Pie & Bar)
- [ ] 테이블에서 검색/정렬/페이징 동작 (RealGrid)
- [ ] 모바일/태블릿에서도 레이아웃 정상 표시

### 사용자 영향 (User Impact)
- 투자 현황을 실시간으로 모니터링 가능
- 의사결정에 필요한 핵심 지표를 시각적으로 제공
- 수작업 보고서 작성 시간 절감

---

## 🏗️ 기술 환경

### 영향받는 서비스
- **Primary Service**: KiiPS-IL (투자 관리, Port: 8401)
- **Dependencies**:
  - [x] KiiPS-COMMON (공통 서비스 - ApiResultBean)
  - [x] KiiPS-UTILS (DAO 프레임워크)
  - [x] KiiPS-Login (인증 - SessionInfo)
  - [x] API Gateway (라우팅 추가 필요)
  - [x] KiiPS-UI (JSP 페이지 신규 생성)

### 개발 환경 체크리스트
- [x] Java 8 확인: `java -version`
- [x] Maven 설정: `mvn -v`
- [ ] SVN 최신 상태: `svn up` (작업 전 실행)
- [x] IDE 설정 완료 (IntelliJ/Eclipse)
- [ ] 로컬 DB 접속 확인 (투자 데이터 테이블 확인)

### 환경별 설정 파일
- **Local**: `KiiPS-IL/app-local.properties`
- **Staging**: `KiiPS-IL/app-stg.properties`
- **Production**: `KiiPS-IL/app-kiips.properties`

---

## 🚀 구현 Phase

### Phase 1: 데이터 조회 Service 구현
**Goal**: 대시보드에 필요한 모든 데이터를 조회하는 비즈니스 로직 완성
**Estimated Time**: 3 hours
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 1.1**: DAO 인터페이스 및 쿼리 작성
  - File: `KiiPS-IL/src/main/java/com/kiips/il/dao/PortfolioDashboardDao.java` (또는 KiiPS-UTILS 활용)
  - Details:
    - 투자 요약 통계 쿼리 (총 금액, 건수, 상태별 집계)
    - 산업별/단계별 분포 쿼리 (GROUP BY)
    - 최근 투자 목록 쿼리 (ORDER BY + LIMIT)
    - 성과 지표 쿼리 (IRR, ROI 계산)

- [ ] **Task 1.2**: Service layer 구현
  - File: `KiiPS-IL/src/main/java/com/kiips/il/service/PortfolioDashboardService.java`
  - Details:
    - `getSummary()`: 투자 현황 요약 조회
    - `getIndustryDistribution()`: 산업별 분포 데이터
    - `getStageDistribution()`: 단계별 분포 데이터
    - `getRecentInvestments()`: 최근 투자 목록
    - `getPerformanceMetrics()`: 성과 지표 조회

- [ ] **Task 1.3**: VO (Value Object) 클래스 작성
  - File: `KiiPS-IL/src/main/java/com/kiips/il/model/PortfolioDashboardVO.java`
  - Details: API 응답 구조에 맞는 DTO 정의

#### Quality Gate ✋

**⚠️ STOP: 다음 항목 모두 통과 필요**

**Build Verification**:
```bash
cd KiiPS-HUB/
mvn clean package -pl :KiiPS-IL -am
```
- [ ] 빌드 성공 (compilation errors 없음)
- [ ] target/KiiPS-IL-*.jar 생성 확인
- [ ] 의존성 해결 완료

**Deployment Check**:
```bash
cd ../KiiPS-IL/
./start.sh
tail -f logs/log.$(date "+%Y-%m-%d")-0.log
```
- [ ] 서비스 정상 시작 (Spring context loaded)
- [ ] 로그에 Exception/Error 없음
- [ ] Health check 통과: `curl http://localhost:8401/actuator/health`

**Manual Test**:
- [ ] Service 메서드 단위 테스트 (직접 호출 또는 간단한 테스트 코드)
- [ ] 쿼리 결과 확인 (데이터베이스에서 직접 실행)
- [ ] Null 처리 확인 (데이터가 없을 경우)

**Code Quality**:
- [ ] 코드 리뷰 가능한 수준
- [ ] SQL Injection 방지 (PreparedStatement 사용)
- [ ] 적절한 로깅 추가 (DEBUG 레벨)

**SVN Commit**:
```bash
svn status
svn diff | less  # 변경사항 검토
svn commit -m "Phase 1: 포트폴리오 대시보드 데이터 조회 Service 구현"
```
- [ ] SVN 커밋 완료

---

### Phase 2: API 엔드포인트 구현
**Goal**: REST API를 통해 대시보드 데이터 제공
**Estimated Time**: 2 hours
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 2.1**: Controller 구현
  - File: `KiiPS-IL/src/main/java/com/kiips/il/controll/PortfolioDashboardAPIController.java`
  - Details:
    - `@RestController` + `@RequestMapping("/ILAPI/DASHBOARD/*")`
    - `POST /ILAPI/DASHBOARD/SUMMARY`: 요약 데이터 조회
    - `POST /ILAPI/DASHBOARD/DISTRIBUTION`: 분포 차트 데이터
    - `POST /ILAPI/DASHBOARD/RECENT`: 최근 투자 목록
    - `POST /ILAPI/DASHBOARD/PERFORMANCE`: 성과 지표
    - SessionInfo 기반 권한 처리 (LIB 파라미터)

- [ ] **Task 2.2**: Request/Response DTO 정의
  - File: `KiiPS-IL/src/main/java/com/kiips/il/model/`
  - Details: ApiResultBean<Object> 래핑

- [ ] **Task 2.3**: Swagger Annotation 추가
  - Details: `@Tag`, `@Operation` 설명 추가

#### Quality Gate ✋

**Build & Deploy**:
```bash
cd KiiPS-HUB/
mvn clean package -pl :KiiPS-IL -am
cd ../KiiPS-IL/
./stop.sh && sleep 2 && ./start.sh
```
- [ ] 빌드 및 재시작 성공

**API Test (Postman/curl)**:
```bash
# 요약 데이터 조회
curl -X POST http://localhost:8401/ILAPI/DASHBOARD/SUMMARY \
  -H "Content-Type: application/json" \
  -H "X-AUTH-TOKEN: test-token" \
  -d '{}'

# 분포 차트 데이터
curl -X POST http://localhost:8401/ILAPI/DASHBOARD/DISTRIBUTION \
  -H "Content-Type: application/json" \
  -H "X-AUTH-TOKEN: test-token" \
  -d '{}'
```
- [ ] API 응답 정상 (200 OK)
- [ ] Response body에 올바른 데이터 포함
- [ ] 에러 처리 동작 확인 (잘못된 토큰, 파라미터)

**SVN Commit**:
```bash
svn commit -m "Phase 2: 포트폴리오 대시보드 API 엔드포인트 구현"
```
- [ ] SVN 커밋 완료

---

### Phase 3: API Gateway 라우팅 설정
**Goal**: API Gateway를 통해 대시보드 API 호출 가능
**Estimated Time**: 1 hour
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 3.1**: API Gateway 라우팅 추가
  - File: `KIIPS-APIGateway/src/main/resources/application.yml`
  - Details:
    ```yaml
    - id: il-dashboard-route
      uri: http://localhost:8401
      predicates:
        - Path=/api/il/dashboard/**
      filters:
        - RewritePath=/api/il/dashboard/(?<segment>.*), /ILAPI/DASHBOARD/${segment}
    ```

- [ ] **Task 3.2**: JWT 인증 필터 확인
  - Details: 대시보드 API가 인증 필요한지 확인

- [ ] **Task 3.3**: CORS 설정 확인 (UI 연동 시)
  - Details: KiiPS-UI에서 AJAX 호출 가능하도록 설정

#### Quality Gate ✋

**Gateway Routing Test**:
```bash
# API Gateway를 통한 호출 (port 8000)
curl -X POST http://localhost:8000/api/il/dashboard/summary \
  -H "Content-Type: application/json" \
  -H "X-AUTH-TOKEN: your-jwt-token" \
  -d '{}'
```
- [ ] Gateway를 통한 호출 성공
- [ ] 인증/인가 정상 동작
- [ ] 에러 응답 정상 (GlobalExceptionHandler)

**Error Notification Test**:
- [ ] Slack 알림 동작 확인 (에러 발생 시)

**SVN Commit**:
```bash
cd KIIPS-APIGateway/
svn commit -m "Phase 3: 포트폴리오 대시보드 API Gateway 라우팅 설정"
```
- [ ] SVN 커밋 완료

---

### Phase 4: JSP 페이지 + 차트 구현 (UI)
**Goal**: 대시보드 화면 완성 및 차트 시각화
**Estimated Time**: 4 hours
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 4.1**: JSP 페이지 작성
  - File: `KiiPS-UI/src/main/resources/templates/il/portfolio_dashboard.jsp`
  - Details:
    - Bootstrap 레이아웃 (Grid system)
    - 4개 영역: 요약 카드, 차트(2개), 테이블

- [ ] **Task 4.2**: JavaScript/jQuery AJAX 구현
  - File: Inline `<script>` 또는 `KiiPS-UI/src/main/resources/static/js/il/dashboard.js`
  - Details:
    - API 호출 함수 (`$.ajax`)
    - 데이터 로딩 및 화면 렌더링
    - 에러 처리 (Toast/Alert)

- [ ] **Task 4.3**: ApexCharts 차트 구현
  - Details:
    - Pie Chart: 산업별 분포 (`/vendor/apexcharts/apexcharts.min.js`)
    - Bar Chart: 단계별 분포
    - 차트 설정 (색상, 레이블, 반응형)
    - 참고: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/AC/AC1004.jsp`

- [ ] **Task 4.4**: RealGrid 테이블 구현
  - Details:
    - RealGrid 2.6.3 사용 (`/vendor/realgrid.2.6.3/realgrid.2.6.3.min.js`)
    - RealGrid 라이선스 설정 (`web.realgrid.lic` 환경변수)
    - 최근 투자 목록 표시
    - 금액 포맷팅 렌더러 적용
    - 참고: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/SY/SY0202.jsp`

- [ ] **Task 4.5**: 반응형 레이아웃 조정
  - Details: 모바일/태블릿에서도 정상 표시

#### Quality Gate ✋

**UI Test**:
- [ ] 페이지 정상 렌더링 (http://localhost:8100/il/portfolio_dashboard)
- [ ] AJAX 호출 성공 (Network tab 확인)
- [ ] 요약 데이터 정상 표시 (카드 영역)
- [ ] 차트 정상 렌더링 (ApexCharts - Pie & Bar)
- [ ] 테이블 정상 동작 (RealGrid - 데이터 로딩, 금액 포맷팅)
- [ ] 브라우저 콘솔 에러 없음
- [ ] RealGrid 라이선스 정상 동작 (콘솔 경고 없음)
- [ ] 모바일 화면에서도 레이아웃 깨지지 않음

**Lucy XSS Filter Check**:
- [ ] 입력값 XSS 필터링 동작 확인 (검색 필터 등)

**Cross-browser Test**:
- [ ] Chrome 정상 동작
- [ ] Firefox/Safari 정상 동작 (선택)

**SVN Commit**:
```bash
cd KiiPS-UI/
svn commit -m "Phase 4: 포트폴리오 대시보드 UI 구현 (JSP + ApexCharts + RealGrid)"
```
- [ ] SVN 커밋 완료

---

### Phase 5: 성능 최적화 및 에러 처리
**Goal**: 성능 개선 및 안정성 강화
**Estimated Time**: 2 hours
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 5.1**: 쿼리 최적화
  - Details:
    - 인덱스 확인 및 추가 제안
    - N+1 쿼리 문제 해결
    - 집계 쿼리 성능 측정

- [ ] **Task 5.2**: 캐싱 적용 (선택)
  - Details:
    - 요약 데이터 Redis 캐싱 (5분 TTL)
    - 차트 데이터 캐싱

- [ ] **Task 5.3**: 에러 처리 보강
  - Details:
    - DB 연결 실패 시 처리
    - 데이터 없을 때 안내 메시지
    - Timeout 설정

- [ ] **Task 5.4**: 로깅 추가
  - Details:
    - API 호출 로그 (DEBUG)
    - 느린 쿼리 로그 (WARN)
    - 에러 로그 (ERROR)

- [ ] **Task 5.5**: 코드 리팩토링
  - Details:
    - 중복 코드 제거
    - 변수/메서드명 명확화
    - 주석 추가

#### Quality Gate ✋

**Performance Check**:
- [ ] API 응답 시간 < 500ms (쿼리 실행 시간 측정)
- [ ] 대용량 데이터 처리 확인 (투자 건수 1000+ 시나리오)
- [ ] 메모리 사용량 정상 (VisualVM/JProfiler)

**Final Verification**:
- [ ] 전체 기능 end-to-end 테스트
  - 로그인 → 메뉴 클릭 → 대시보드 로딩 → 차트 상호작용
- [ ] 에러 시나리오 테스트
  - DB 연결 실패 시
  - 권한 없는 사용자 접근 시
  - 빈 데이터 시나리오
- [ ] 로그 레벨 적절 (DEBUG → INFO)

**Load Test (선택)**:
```bash
# Apache Bench로 부하 테스트
ab -n 100 -c 10 http://localhost:8401/ILAPI/DASHBOARD/SUMMARY
```
- [ ] 동시 사용자 10명 처리 가능

**SVN Commit**:
```bash
svn commit -m "Phase 5: 포트폴리오 대시보드 성능 최적화 및 에러 처리"
```
- [ ] SVN 커밋 완료

---

## 🔄 Rollback Strategy

### Phase 1 실패 시
```bash
cd KiiPS-IL/
svn revert -R src/main/java/com/kiips/il/dao/
svn revert -R src/main/java/com/kiips/il/service/
svn revert -R src/main/java/com/kiips/il/model/
svn up
```
- 변경사항: DAO, Service, VO 파일 제거

### Phase 2 실패 시
```bash
svn update -r <Phase-1-revision>
```
- 변경사항: Controller 제거

### Phase 3 실패 시
```bash
cd KIIPS-APIGateway/
svn revert src/main/resources/application.yml
```
- 변경사항: Gateway 설정 원복

### Phase 4 실패 시
```bash
cd KiiPS-UI/
svn revert -R src/main/resources/templates/il/
svn revert -R src/main/resources/static/js/il/
```
- 변경사항: JSP, JavaScript 파일 제거

### Phase 5 실패 시
- 이전 Phase까지 동작하므로 해당 Phase만 재작업

---

## 📊 진행 상황 추적

### Phase 완료율
| Phase | 예상 시간 | 실제 시간 | 상태 |
|-------|----------|----------|------|
| Phase 1: Data Service | 3 hours | - | ⏳ |
| Phase 2: API Endpoint | 2 hours | - | ⏳ |
| Phase 3: Gateway Routing | 1 hour | - | ⏳ |
| Phase 4: UI Implementation | 4 hours | - | ⏳ |
| Phase 5: Optimization | 2 hours | - | ⏳ |
| **Total** | **12 hours** | **- hours** | **0%** |

**Overall Progress**: 0% → 20% → 40% → 60% → 80% → 100%

---

## 📝 Notes & Issues

### 구현 중 발견사항
- [날짜] [발견한 이슈 또는 개선사항]

### 해결된 문제
- **문제**: [문제 설명]
  - **원인**: [근본 원인]
  - **해결**: [해결 방법]

### 기술적 결정 사항
- **결정**: ApexCharts 사용
  - **이유**: KiiPS 프로젝트에서 주력으로 사용 중 (38개 JSP 파일), MIT 라이선스로 무료
  - **Trade-off**: D3.js 대비 커스터마이징 제한적

- **결정**: 캐싱 Optional
  - **이유**: 초기 버전은 실시간 데이터 우선, 성능 이슈 발생 시 적용
  - **Trade-off**: 응답 시간 약간 증가 가능

---

## ⚠️ 위험 요소 (Risk Assessment)

| 위험 | 확률 | 영향도 | 대응 방안 |
|------|------|--------|-----------|
| 쿼리 성능 지연 (투자 건수 증가 시) | 중 | 높음 | 인덱스 추가, 페이징 처리, 캐싱 적용 |
| 차트 렌더링 실패 (브라우저 호환성) | 낮 | 중간 | ApexCharts 최신 버전 사용, 모던 브라우저 권장 |
| 데이터 정합성 이슈 (집계 오류) | 중 | 높음 | 쿼리 검증, 테스트 데이터로 검증 |
| 권한 처리 복잡도 | 낮 | 중간 | SessionInfo 기반 LIB 파라미터로 간단히 처리 |

---

## ✅ 최종 완료 체크리스트

**배포 전 확인사항**:
- [ ] 모든 Phase Quality Gate 통과
- [ ] 전체 빌드 성공: `cd KiiPS-HUB/ && mvn clean package`
- [ ] 모든 의존 서비스 정상 동작
  - [ ] KiiPS-Login (8801)
  - [ ] KiiPS-COMMON (8701)
  - [ ] API Gateway (8000)
  - [ ] KiiPS-UI (8100)
- [ ] API Gateway 라우팅 검증
- [ ] UI 정상 동작 (모든 브라우저)
- [ ] 에러 처리 및 로깅 적절
- [ ] 성능 요구사항 충족 (응답 시간 < 500ms)
- [ ] SVN 커밋 완료 (모든 Phase)
- [ ] 코드 리뷰 준비 완료
- [ ] 사용자 매뉴얼 작성 (필요 시)

**환경별 배포 체크**:
- [ ] **Local**: 테스트 완료
- [ ] **Staging**: 배포 및 검증 완료
- [ ] **Production**: 배포 준비 완료 (승인 대기)

---

## 🧪 테스트 전략 (Optional - 미래 개선용)

**현재 상태**: 테스트 스킵 (`<skipTests>true</skipTests>`)

**향후 개선 시 고려사항**:

### Unit Tests (Service Layer)
```java
@Test
void shouldReturnDashboardSummary() {
    // Given
    String lib = "TEST_LIB";

    // When
    Map<String, Object> summary = dashboardService.getSummary(lib);

    // Then
    assertNotNull(summary);
    assertTrue(summary.containsKey("totalAmount"));
    assertTrue(summary.containsKey("totalCount"));
}
```

### Integration Tests (Controller)
```java
@SpringBootTest
@AutoConfigureMockMvc
class PortfolioDashboardAPIControllerTest {
    @Autowired MockMvc mockMvc;

    @Test
    void shouldReturnSummaryData() throws Exception {
        mockMvc.perform(post("/ILAPI/DASHBOARD/SUMMARY")
            .header("X-AUTH-TOKEN", "test-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.body.totalAmount").exists());
    }
}
```

---

## 📚 참고 자료

### 프로젝트 문서
- [Architecture](../../architecture.md) - KiiPS 시스템 아키텍처
- [API Spec](../../api.md) - API 개발 가이드
- [Deployment](../../deployment.md) - 배포 프로세스
- [Troubleshooting](../../troubleshooting.md) - 문제 해결 가이드

### 관련 이슈/PR
- Issue #X: [설명]
- PR #Y: [설명]

### 외부 참고자료
- [ApexCharts Documentation](https://apexcharts.com/docs/)
- [RealGrid 2.8.8 Documentation](http://help.realgrid.com/)
- [Bootstrap Grid System](https://getbootstrap.com/docs/4.6/layout/grid/)

---

**Plan Status**: 🔄 진행 대기
**Next Action**: 사용자 승인 후 Phase 1 시작
**Blocked By**: None
**Completion Date**: [완료 시 날짜 기록]
