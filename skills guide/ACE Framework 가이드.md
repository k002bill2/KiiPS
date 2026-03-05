# ACE Framework 가이드

**버전**: 3.0.1-KiiPS
**마지막 업데이트**: 2026-01-08

---

## 개요

**ACE (Autonomous Cognitive Entity) Framework**는 KiiPS 프로젝트에서 Claude Code의 병렬 에이전트 조정을 위한 프레임워크입니다.

### 핵심 개념

- **계층적 에이전트 구조**: Primary → Manager → Worker
- **도메인 기반 라우팅**: 작업 유형에 따른 자동 에이전트 할당
- **자원 관리**: 모듈 잠금, 토큰 예산, 충돌 방지

---

## 에이전트 계층 구조

```
┌─────────────────────────────────────────────┐
│           Primary Coordinator               │
│           (opus-4.5, 조정자)                │
│                                             │
│  - 작업 분해 및 분배                        │
│  - 공유 모듈 수정 권한                      │
│  - 최종 검증 및 사용자 커뮤니케이션         │
└─────────────────────────────────────────────┘
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Build   │  │ Feature │  │   UI    │
│ Manager │  │ Manager │  │ Manager │
│(sonnet) │  │(sonnet) │  │(sonnet) │
└────┬────┘  └────┬────┘  └────┬────┘
     ▼            ▼            ▼
┌─────────────────────────────────────────────┐
│              Worker Agents                   │
│  - kiips-architect (sonnet)                 │
│  - kiips-developer (sonnet)                 │
│  - kiips-ui-designer (sonnet)               │
│  - checklist-generator (haiku)              │
└─────────────────────────────────────────────┘
```

---

## 에이전트 상세

### Primary Coordinator

| 속성 | 값 |
|------|-----|
| **모델** | opus-4.5 |
| **역할** | 전체 조정자 |
| **토큰 예산** | 30% |

**전용 권한**:
- 공유 모듈 수정 (KiiPS-HUB, COMMON, UTILS)
- 충돌 병합
- Secondary Agent 제안 승인
- 사용자 직접 커뮤니케이션

### Manager Agents

| Manager | 도메인 | 관리 Skills | 위임 대상 |
|---------|--------|-------------|-----------|
| **Build Manager** | Maven 빌드 | kiips-maven-builder | kiips-developer |
| **Feature Manager** | 기능 개발 | kiips-feature-planner, checklist-generator | architect, developer, ui-designer |
| **UI Manager** | UI/UX | ui-component, realgrid, responsive, a11y, scss | kiips-ui-designer |
| **Deployment Manager** | 배포 | service-deployer, api-tester, log-analyzer | kiips-developer |

### Worker Agents

| Agent | 모델 | 역할 | 전문 분야 |
|-------|------|------|-----------|
| **kiips-architect** | sonnet-4.5 | 전략 자문 | 시스템 설계, 아키텍처 |
| **kiips-developer** | sonnet-4.5 | 실행자 | 코드 구현, 버그 수정 |
| **kiips-ui-designer** | sonnet-4.5 | UI 전문가 | JSP, RealGrid, SCSS |
| **checklist-generator** | haiku | 검증자 | 체크리스트 생성 |

---

## Layer 구조

ACE Framework는 6개 레이어로 구성됩니다:

```
Layer 1: Aspirational      ─ 윤리적 원칙 (모든 에이전트)
Layer 2: Global Strategy   ─ 장기 목표 (Primary + 사용자)
Layer 3: Agent Model       ─ 능력 자가 평가 (모든 에이전트)
Layer 4: Executive         ─ 작업 분해/할당 (Primary)
Layer 4.5: Orchestration   ─ 도메인별 조정 (Managers)
Layer 5: Cognitive Control ─ 충돌 방지 (모든 에이전트)
Layer 6: Task Prosecution  ─ 실제 실행 (Workers)
```

### Layer 4.5: Domain Orchestration (핵심)

Manager 에이전트가 담당하는 **도메인별 워크플로우 조정** 레이어:

```javascript
// 빌드 도메인 예시
Build Manager 수신: "KiiPS-FD, KiiPS-IL 빌드"
  ├─ 의존성 분석: COMMON → UTILS → FD, IL
  ├─ 병렬 그룹 식별: [FD, IL] 동시 빌드 가능
  ├─ Worker 할당: kiips-developer × 2
  └─ 결과 집계 및 Primary 보고
```

---

## 작업 라우팅

### 자동 활성화 규칙

작업 유형에 따라 자동으로 적절한 에이전트가 활성화됩니다:

| 작업 유형 | Primary Agent | Manager | 필수 Skill |
|-----------|---------------|---------|------------|
| **Maven 빌드** | build-manager | ○ | kiips-maven-builder |
| **서비스 배포** | deployment-manager | ○ | kiips-service-deployer |
| **기능 개발** | feature-manager | ○ | kiips-feature-planner |
| **UI 컴포넌트** | ui-manager | ○ | kiips-ui-component-builder |
| **RealGrid 설정** | ui-manager | ○ | kiips-realgrid-guide |
| **코드 리뷰** | checklist-generator | - | - |
| **아키텍처 검토** | kiips-architect | - | - |

### skill-rules.json 키워드

```json
{
  "kiips-maven-builder": {
    "keywords": ["빌드", "build", "maven", "mvn", "compile", "package"],
    "intentPatterns": ["(build|compile).*?(service|module)"]
  },
  "kiips-service-deployer": {
    "keywords": ["배포", "deploy", "start", "stop", "restart"],
    "intentPatterns": ["(start|stop|restart).*?service"]
  }
}
```

---

## 자원 관리

### 모듈 잠금

공유 모듈은 Primary만 수정 가능:

| 모듈 | Primary Only | 설명 |
|------|--------------|------|
| KiiPS-HUB | ✅ | Parent POM |
| KiiPS-COMMON | ✅ | 공유 서비스 |
| KiiPS-UTILS | ✅ | 공유 DAO |
| KiiPS-APIGateway | ✅ | Gateway 설정 |
| KiiPS-Login | ✅ | 인증 |
| KiiPS-UI | ⚠️ | UI 파일만 ui-designer 허용 |
| KiiPS-FD, IL, PG... | ❌ | Secondary 수정 가능 |

### 토큰 예산 분배

```
Primary Coordinator: 30%
├─ Build Manager:      10%
├─ Feature Manager:    12%
├─ UI Manager:         10%
├─ Deployment Manager:  8%
└─ Worker Agents:      30%
```

---

## 설정 파일

### 주요 파일 위치

| 파일 | 위치 | 용도 |
|------|------|------|
| **ace-config.json** | `.claude/ace-framework/` | 프레임워크 전체 설정 |
| **layer3-agent-model.json** | `.claude/ace-framework/` | 에이전트 능력/제한 정의 |
| **skill-rules.json** | 루트 | Skill 자동 활성화 규칙 |
| **에이전트 파일** | `.claude/agents/` | 각 에이전트 상세 설정 |

### 설정 예시

```json
// ace-config.json 발췌
{
  "agentHierarchy": {
    "primary": {
      "id": "primary-coordinator",
      "model": "opus-4.5",
      "role": "coordinator"
    },
    "managers": [
      {
        "id": "build-manager",
        "model": "sonnet",
        "managesSkills": ["kiips-maven-builder"],
        "delegatesTo": ["kiips-developer"]
      }
    ]
  }
}
```

---

## 실전 예제

### 예제 1: 멀티 서비스 빌드

```
사용자: "KiiPS-FD, KiiPS-IL, KiiPS-PG 빌드해줘"

1. Primary Coordinator 수신
2. Build Manager 라우팅 (keyword: "빌드")
3. Build Manager 분석:
   - 공통 의존성: COMMON, UTILS (먼저 빌드)
   - 병렬 가능: FD, IL, PG
4. Worker 할당: kiips-developer × 3
5. 결과 집계 → Primary 보고 → 사용자 응답
```

### 예제 2: UI 개발

```
사용자: "펀드 목록 페이지 만들어줘. RealGrid 사용"

1. Primary Coordinator 수신
2. UI Manager 라우팅 (keywords: "페이지", "RealGrid")
3. UI Manager 분석:
   - Skills 활성화: ui-component-builder, realgrid-builder
4. Worker 할당: kiips-ui-designer
5. 검증 파이프라인: responsive → a11y
6. 결과 → Primary → 사용자
```

---

## 문제 해결

### Q: 에이전트가 활성화되지 않음

**확인 사항**:
1. `skill-rules.json`에 키워드 등록 확인
2. 요청 문구에 트리거 키워드 포함 확인
3. Hook 활성화 상태 확인 (`.claudecode.json`)

### Q: 모듈 수정 권한 오류

**해결**:
- 공유 모듈(HUB, COMMON, UTILS)은 Primary만 수정 가능
- Secondary Agent가 제안 → Primary 승인 → 수정 실행

### Q: 토큰 예산 초과

**대응**:
- Manager가 작업 분할하여 Worker 분배
- 복잡한 작업은 여러 세션으로 분리

---

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [architecture.md](../architecture.md) - 시스템 아키텍처
- [skill-rules.json](../skill-rules.json) - Skill 활성화 규칙
- [Parallel Agents Safety Protocol v3.0.1.md](./Parallel%20Agents%20Safety%20Protocol%20v3.0.1.md) - 병렬 에이전트 안전 프로토콜

---

*마지막 업데이트: 2026-01-08*
