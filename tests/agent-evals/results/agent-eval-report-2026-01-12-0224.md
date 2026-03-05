# KiiPS AI Agent Evaluation Report

**Date**: 2026-01-12T02:24:23.306Z
**Status**: ✅ PASSED
**Pass Rate**: 100.0%

---

## 📊 Quick Summary

| Metric | Value |
|--------|-------|
| **Total Suites** | 5 |
| **Total Tasks** | 51 |
| **Passed** | 51 |
| **Failed** | 0 |
| **Pass Rate** | 100.0% |
| **Threshold** | 85% |

```
Pass Rate: [████████████████████] 100.0%
```

## 📈 Metrics

### Pass Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **pass@1** | 100.0% | Single trial success rate |
| **pass@3** | 100.0% | At least 1 success in 3 trials |
| **pass^3** | 100.0% | All 3 trials succeed |

### Performance

| Metric | Value |
|--------|-------|
| **Average Latency** | 1ms |
| **Total Duration** | 5ms |

## 📦 Suite Details
### ✅ Analysis Skills Evaluation

**Pass Rate**: 100.0% (10/10)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| api-tester-activation-korean | ✅ Pass | 3ms | - |
| api-tester-activation-english | ✅ Pass | 1ms | - |
| api-tester-activation-endpoint | ✅ Pass | 1ms | - |
| api-tester-activation-gateway | ✅ Pass | 1ms | - |
| log-analyzer-activation-korean | ✅ Pass | 1ms | - |
| log-analyzer-activation-english | ✅ Pass | 1ms | - |
| log-analyzer-activation-error | ✅ Pass | 1ms | - |
| log-analyzer-activation-debug | ✅ Pass | 1ms | - |
| combined-api-log-analysis | ✅ Pass | 1ms | - |
| analysis-manager-detection | ✅ Pass | 1ms | - |
### ✅ Build Skills Evaluation

**Pass Rate**: 100.0% (11/11)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| maven-builder-activation-korean | ✅ Pass | 1ms | - |
| maven-builder-activation-english | ✅ Pass | 1ms | - |
| maven-builder-activation-compile | ✅ Pass | 1ms | - |
| maven-builder-activation-package | ✅ Pass | 1ms | - |
| maven-builder-multi-module | ✅ Pass | 1ms | - |
| maven-builder-manager-detection | ✅ Pass | 1ms | - |
| test-runner-activation-korean | ✅ Pass | 1ms | - |
| test-runner-activation-junit | ✅ Pass | 1ms | - |
| test-runner-activation-karma | ✅ Pass | 1ms | - |
| maven-builder-negative-deploy | ✅ Pass | 1ms | - |
| maven-builder-negative-ui | ✅ Pass | 1ms | - |
### ✅ Deploy Skills Evaluation

**Pass Rate**: 100.0% (8/8)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| deployer-activation-korean | ✅ Pass | N/A | - |
| deployer-activation-english | ✅ Pass | N/A | - |
| deployer-activation-start | ✅ Pass | N/A | - |
| deployer-activation-stop | ✅ Pass | N/A | - |
| deployer-activation-restart | ✅ Pass | N/A | - |
| deployer-manager-detection | ✅ Pass | N/A | - |
| build-and-deploy-activation | ✅ Pass | N/A | - |
| deployer-negative-build-only | ✅ Pass | N/A | - |
### ✅ Planning Skills Evaluation

**Pass Rate**: 100.0% (9/9)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| feature-planner-activation-korean | ✅ Pass | N/A | - |
| feature-planner-activation-english | ✅ Pass | N/A | - |
| feature-planner-activation-plan | ✅ Pass | N/A | - |
| feature-planner-manager-detection | ✅ Pass | N/A | - |
| detail-planner-activation-korean | ✅ Pass | N/A | - |
| detail-planner-activation-detail | ✅ Pass | N/A | - |
| detail-planner-with-ui | ✅ Pass | N/A | - |
| combined-feature-with-detail | ✅ Pass | N/A | - |
| planner-negative-build | ✅ Pass | N/A | - |
### ✅ UI Skills Evaluation

**Pass Rate**: 100.0% (13/13)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| ui-builder-activation-korean | ✅ Pass | 1ms | - |
| ui-builder-activation-english | ✅ Pass | 1ms | - |
| ui-builder-activation-page | ✅ Pass | N/A | - |
| ui-builder-manager-detection | ✅ Pass | N/A | - |
| realgrid-activation-korean | ✅ Pass | N/A | - |
| realgrid-activation-english | ✅ Pass | N/A | - |
| realgrid-activation-table | ✅ Pass | N/A | - |
| realgrid-with-excel | ✅ Pass | N/A | - |
| combined-ui-with-grid | ✅ Pass | N/A | - |
| combined-full-ui-page | ✅ Pass | N/A | - |
| ui-with-detail-planning | ✅ Pass | N/A | - |
| ui-negative-backend | ✅ Pass | N/A | - |
| ui-negative-build | ✅ Pass | N/A | - |

## ❌ Failed Tasks

🎉 No failed tasks!

## ⚙️ Configuration

<details>
<summary>Click to expand configuration</summary>

```json
{
  "$schema": "./evals.schema.json",
  "version": "1.0.0",
  "description": "KiiPS AI Agent Evaluation System Configuration",
  "environment": {
    "mode": "hybrid",
    "mockByDefault": true,
    "realExecutionSkills": [
      "kiips-maven-builder"
    ],
    "timeout": {
      "default": 30000,
      "build": 300000,
      "deploy": 120000
    },
    "retries": {
      "enabled": true,
      "maxAttempts": 3,
      "backoffMs": 1000
    }
  },
  "skills": {
    "all": [
      "kiips-maven-builder",
      "kiips-service-deployer",
      "kiips-api-tester",
      "kiips-log-analyzer",
      "kiips-feature-planner",
      "kiips-detail-page-planner",
      "kiips-ui-component-builder",
      "kiips-realgrid-builder",
      "kiips-test-runner"
    ],
    "groups": {
      "build": [
        "kiips-maven-builder",
        "kiips-test-runner"
      ],
      "deploy": [
        "kiips-service-deployer"
      ],
      "analysis": [
        "kiips-api-tester",
        "kiips-log-analyzer"
      ],
      "planning": [
        "kiips-feature-planner",
        "kiips-detail-page-planner"
      ],
      "ui": [
        "kiips-ui-component-builder",
        "kiips-realgrid-builder"
      ]
    }
  },
  "agents": {
    "managers": [
      "build-manager",
      "deployment-manager",
      "feature-manager",
      "ui-manager"
    ],
    "workers": [
      "kiips-developer",
      "kiips-architect",
      "kiips-ui-designer"
    ]
  },
  "graders": {
    "default": "code",
    "types": {
      "code": {
        "enabled": true,
        "strictMode": false,
        "tolerateWhitespace": true
      },
      "llm": {
        "enabled": false,
        "model": null,
        "rubricPath": "fixtures/rubrics/"
      }
    }
  },
  "metrics": {
    "passRateThreshold": 0.85,
    "trackLatency": true,
    "trackResourceUsage": true,
    "trackTokens": false,
    "collectTranscripts": true
  },
  "output": {
    "format": [
      "console",
      "markdown"
    ],
    "resultsDir": "results/",
    "transcriptsDir": "results/transcripts/",
    "verbose": false,
    "colors": true
  },
  "suites": {
    "skill-evals": {
      "enabled": true,
      "path": "suites/skill-evals/",
      "parallel": true
    },
    "agent-evals": {
      "enabled": true,
      "path": "suites/agent-evals/",
      "parallel": false
    },
    "workflow-evals": {
      "enabled": true,
      "path": "suites/workflow-evals/",
      "parallel": false
    }
  },
  "hooks": {
    "beforeAll": null,
    "afterAll": null,
    "beforeEach": null,
    "afterEach": null
  }
}
```

</details>

---

## 📝 Notes

- **Environment**: hybrid
- **Grader**: code
- **Duration**: 5ms

---

*Generated by KiiPS AI Agent Evaluation System*
*Based on [Anthropic's Eval Guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)*