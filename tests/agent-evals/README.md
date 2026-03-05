# KiiPS AI Agent Evaluation System

AI Agent 평가 시스템 - Anthropic의 ["Demystifying Evals for AI Agents"](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 가이드를 기반으로 구축.

## 📋 개요

이 시스템은 KiiPS 프로젝트의 AI Agent, Skills, Workflows를 체계적으로 평가합니다.

### 핵심 개념

| 개념 | 설명 |
|------|------|
| **Task** | 정의된 입력과 성공 기준이 있는 단일 테스트 |
| **Trial** | 작업에 대한 한 번의 시도 |
| **Grader** | 에이전트 성능을 점수화하는 로직 |
| **Harness** | 평가를 실행하는 인프라 |

### 메트릭

- **pass@k**: k번 시도 중 최소 1개 성공 확률
- **pass^k**: k번 모두 성공 확률
- **Latency**: 실행 시간

## 🚀 빠른 시작

```bash
# 모든 평가 실행
cd tests/agent-evals
node run-agent-evals.js

# 특정 스위트만 실행
node run-agent-evals.js --suite skill
node run-agent-evals.js --suite agent
node run-agent-evals.js --suite workflow

# 상세 출력
node run-agent-evals.js --verbose

# 실제 실행 모드 (Mock 대신)
node run-agent-evals.js --real
```

## 📊 현재 평가 스위트

### Skill Evals (51 tasks)

| 스위트 | 테스트 수 | 대상 Skills |
|--------|----------|-------------|
| Build Skills | 11 | maven-builder, test-runner |
| Deploy Skills | 8 | service-deployer |
| Analysis Skills | 10 | api-tester, log-analyzer |
| Planning Skills | 9 | feature-planner, detail-page-planner |
| UI Skills | 13 | ui-component-builder, realgrid-builder |

### Agent Evals (13 tasks)

| 스위트 | 테스트 수 | 대상 Agents |
|--------|----------|-------------|
| Manager Agents | 13 | build-manager, deployment-manager, feature-manager, ui-manager |

### Workflow Evals (11 tasks)

| 스위트 | 테스트 수 | 시나리오 |
|--------|----------|----------|
| E2E Workflows | 11 | build-deploy, feature-dev, ui-dev, error-investigation |

**총계**: 7 스위트, 75 테스트

## 📁 디렉토리 구조

```
tests/agent-evals/
├── evals.config.json         # 중앙 설정
├── run-agent-evals.js        # 메인 실행기
├── README.md                 # 이 문서
│
├── lib/                      # 핵심 라이브러리
│   ├── eval-harness.js       # 평가 엔진
│   ├── graders/
│   │   └── code-grader.js    # 결정론적 채점
│   ├── reporters/
│   │   ├── console-reporter.js
│   │   └── markdown-reporter.js
│   └── utils/
│       └── sandbox.js        # Mock/실제 환경
│
├── suites/                   # 평가 스위트
│   ├── skill-evals/          # Skill 평가
│   │   ├── build-skills.eval.js
│   │   ├── deploy-skills.eval.js
│   │   ├── analysis-skills.eval.js
│   │   ├── planning-skills.eval.js
│   │   └── ui-skills.eval.js
│   ├── agent-evals/          # Agent 평가
│   │   └── manager-agents.eval.js
│   └── workflow-evals/       # E2E 워크플로우
│       └── e2e-workflows.eval.js
│
├── fixtures/                 # 테스트 데이터
│   ├── tasks/
│   ├── mocks/
│   └── expected/
│
└── results/                  # 평가 결과
    └── *.md                  # Markdown 리포트
```

## 🔧 설정

### evals.config.json

```json
{
  "environment": {
    "mode": "hybrid",         // mock | real | hybrid
    "mockByDefault": true,
    "realExecutionSkills": ["kiips-maven-builder"]
  },
  "graders": {
    "default": "code",        // code | llm
    "llm": { "enabled": false }
  },
  "metrics": {
    "passRateThreshold": 0.85,
    "trackLatency": true
  }
}
```

## 📝 새 평가 추가하기

### 1. Skill Eval 추가

```javascript
// suites/skill-evals/my-skill.eval.js
module.exports = {
  name: 'My Skill Evaluation',
  parallel: true,
  tasks: [
    {
      id: 'my-skill-test-1',
      input: { prompt: '테스트 프롬프트' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['my-skill-name']
        }
      ]
    }
  ]
};
```

### 2. Grader 타입

| 타입 | 용도 | 예시 |
|------|------|------|
| `activation` | Skill 활성화 검증 | `expect: ['skill-name']` |
| `pattern` | 출력 패턴 매칭 | `pattern: /BUILD SUCCESS/` |
| `state` | 상태 검증 | `expect: { 'output.field': 'value' }` |
| `artifact` | 파일 존재 확인 | `path: 'target/*.jar'` |
| `command` | 명령 결과 검증 | `expect: { exitCode: 0 }` |

## 📊 출력 예시

```
🚀 Starting KiiPS AI Agent Evaluation...

Found 7 evaluation suite(s)

▶ Running suite: Build Skills Evaluation
◼ Completed: Build Skills Evaluation (100%)

═══════════════════════════════════════════════════════════════
                        OVERALL SUMMARY
═══════════════════════════════════════════════════════════════

  Pass Rate: 100.0% (threshold: 85%)
  [████████████████████████████████████████]

  Statistics:
    Total Suites:  7
    Total Tasks:   75
    Passed:        75
    Failed:        0

  Pass Metrics:
    pass@1:        100.0%
    pass@3:        100.0%
    pass^3:        100.0%

═══════════════════════════════════════════════════════════════
✓ EVALUATION PASSED (6ms)
═══════════════════════════════════════════════════════════════
```

## 🔗 참조

- [Anthropic: Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [KiiPS CLAUDE.md](../../CLAUDE.md)
- [KiiPS skill-rules.json](../../skill-rules.json)

---

**Last Updated**: 2026-01-12
**Version**: 1.0.0
