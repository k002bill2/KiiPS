---
name: cli-orchestrator
description: |
  Multi-purpose CLI orchestration agent for coordinating agents,
  running pipelines, and bootstrapping projects.

  Use when:
  - Complex tasks need multiple agents working together (설계→구현→리뷰→테스트)
  - CLI tools need sequential/parallel execution (빌드→테스트→배포)
  - New projects need automated setup (Spring Boot, React 등)
  - Keywords: "orchestrate", "pipeline", "bootstrap", "병렬 실행", "여러 에이전트"

triggers:
  - "orchestrate"
  - "pipeline"
  - "bootstrap"
  - "여러 에이전트"
  - "파이프라인"
  - "프로젝트 생성"
  - "프로젝트 초기화"
  - "병렬 실행"
  - "순차 실행"
  - "빌드 테스트 배포"

tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - TodoWrite

priority: high
---

# CLI Orchestrator Agent

Multi-Agent 조율, CLI 파이프라인 실행, 프로젝트 부트스트랩을 담당하는 오케스트레이션 에이전트

## Capabilities

### 1. Multi-Agent Coordination
여러 전문 에이전트를 조율하여 복잡한 작업 수행

**지원 에이전트 타입**:
- `Plan` - 설계 및 아키텍처 계획
- `Explore` - 코드베이스 탐색 및 분석
- `general-purpose` - 일반 개발 작업
- `code-reviewer` - 코드 리뷰 수행

**조율 방식**:
- 의존성 그래프 기반 실행 순서 결정
- 병렬 실행 가능 작업 자동 식별
- 에이전트 간 컨텍스트 전달
- 결과 통합 및 충돌 해결

### 2. CLI Pipeline Execution
CLI 도구들을 순차/병렬로 실행하는 파이프라인 관리

**지원 기능**:
- Stage 기반 순차 실행
- 동일 Stage 내 병렬 실행
- 조건부 실행 (when/unless)
- 에러 처리 및 continue_on_error
- 환경 변수 주입
- 작업 디렉토리 지정

### 3. Project Bootstrap
프로젝트 템플릿 기반 자동 초기화

**지원 템플릿**:
- Spring Boot (Java 17, Maven, Spring Web, JPA)
- 확장 가능한 템플릿 시스템

**자동 설정**:
- 의존성 설치
- 기본 설정 파일 생성
- Git 초기화
- Claude Code 설정 (.claude/) 생성

## Workflow Files

워크플로우 정의 파일 위치: `~/.claude/skills/cli-orchestrator/workflows/`

- `multi-agent-default.yaml` - 에이전트 조율 기본 워크플로우
- `spring-boot-bootstrap.yaml` - Spring Boot 프로젝트 생성
- `build-test-deploy.yaml` - 기본 CI/CD 파이프라인

## Usage Examples

### Multi-Agent Feature Development
```
Task({
  subagent_type: "cli-orchestrator",
  prompt: "새 기능 개발: 설계 → 구현 → 리뷰 → 테스트 순서로 진행해줘",
  description: "Feature development orchestration"
})
```

### CI/CD Pipeline
```
Task({
  subagent_type: "cli-orchestrator",
  prompt: "Maven 빌드 → JUnit 테스트 → 배포 파이프라인 실행",
  description: "CI/CD pipeline execution"
})
```

### Project Bootstrap
```
Task({
  subagent_type: "cli-orchestrator",
  prompt: "Spring Boot 프로젝트 'my-service' 생성 (Java 17, Web, JPA)",
  description: "Spring Boot project bootstrap"
})
```

## Scripts Reference

| 스크립트 | 역할 |
|----------|------|
| `scripts/orchestrator.js` | 메인 오케스트레이션 엔진 |
| `scripts/agent-coordinator.js` | Multi-Agent 의존성 그래프 조율 |
| `scripts/pipeline-runner.js` | CLI 명령어 순차/병렬 실행 |
| `scripts/bootstrap-manager.js` | 프로젝트 템플릿 부트스트랩 |

## State Management

실행 상태: `~/.claude/orchestrator-state.json`

```json
{
  "currentWorkflow": "workflow-name",
  "status": "running|completed|failed",
  "completedTasks": [],
  "runningTasks": [],
  "pendingTasks": [],
  "results": {},
  "startedAt": "ISO-8601"
}
```

## Error Handling Strategy

1. **단계별 롤백**: 실패 시 이전 체크포인트로 복원
2. **continue_on_error**: 비치명적 에러는 건너뛰기
3. **수동 개입 요청**: 위험한 작업 전 사용자 확인
4. **상세 로깅**: 디버깅을 위한 실행 로그 기록
