# KiiPS AI Agent Evaluation Report

**Date**: 2026-01-14T02:00:40.593Z
**Status**: ❌ FAILED
**Pass Rate**: 18.7%

---

## 📊 Quick Summary

| Metric | Value |
|--------|-------|
| **Total Suites** | 7 |
| **Total Tasks** | 75 |
| **Passed** | 14 |
| **Failed** | 61 |
| **Pass Rate** | 18.7% |
| **Threshold** | 85% |

```
Pass Rate: [████░░░░░░░░░░░░░░░░] 18.7%
```

## 📈 Metrics

### Pass Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **pass@1** | 18.7% | Single trial success rate |
| **pass@3** | 46.2% | At least 1 success in 3 trials |
| **pass^3** | 0.7% | All 3 trials succeed |

### Performance

| Metric | Value |
|--------|-------|
| **Average Latency** | 1ms |
| **Total Duration** | 16ms |

## 📦 Suite Details
### ⚠️ Analysis Skills Evaluation

**Pass Rate**: 0.0% (0/10)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| api-tester-activation-korean | ❌ Fail | 2ms | Missing skills: kiips-api-tester |
| api-tester-activation-english | ❌ Fail | 2ms | Missing skills: kiips-api-tester |
| api-tester-activation-endpoint | ❌ Fail | 2ms | Missing skills: kiips-api-tester |
| api-tester-activation-gateway | ❌ Fail | 1ms | Missing skills: kiips-api-tester |
| log-analyzer-activation-korean | ❌ Fail | 1ms | Missing skills: kiips-log-analyzer |
| log-analyzer-activation-english | ❌ Fail | 1ms | Missing skills: kiips-log-analyzer |
| log-analyzer-activation-error | ❌ Fail | 1ms | Missing skills: kiips-log-analyzer |
| log-analyzer-activation-debug | ❌ Fail | 2ms | Missing skills: kiips-log-analyzer |
| combined-api-log-analysis | ❌ Fail | 2ms | Missing skills: kiips-api-tester, kiips-log-analyz |
| analysis-manager-detection | ❌ Fail | 2ms | Missing skills: kiips-log-analyzer |
### ⚠️ Build Skills Evaluation

**Pass Rate**: 9.1% (1/11)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| maven-builder-activation-korean | ❌ Fail | N/A | Missing skills: kiips-maven-builder |
| maven-builder-activation-english | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
| maven-builder-activation-compile | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
| maven-builder-activation-package | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
| maven-builder-multi-module | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
| maven-builder-manager-detection | ✅ Pass | 1ms | - |
| test-runner-activation-korean | ❌ Fail | 1ms | Missing skills: kiips-test-runner |
| test-runner-activation-junit | ❌ Fail | 1ms | Missing skills: kiips-test-runner |
| test-runner-activation-karma | ❌ Fail | 1ms | Missing skills: kiips-test-runner |
| maven-builder-negative-deploy | ❌ Fail | 2ms | Missing skills: kiips-service-deployer |
| maven-builder-negative-ui | ❌ Fail | 2ms | Missing skills: kiips-ui-component-builder |
### ⚠️ Deploy Skills Evaluation

**Pass Rate**: 12.5% (1/8)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| deployer-activation-korean | ❌ Fail | N/A | Missing skills: kiips-service-deployer |
| deployer-activation-english | ❌ Fail | N/A | Missing skills: kiips-service-deployer |
| deployer-activation-start | ❌ Fail | N/A | Missing skills: kiips-service-deployer |
| deployer-activation-stop | ❌ Fail | N/A | Missing skills: kiips-service-deployer |
| deployer-activation-restart | ❌ Fail | 1ms | Missing skills: kiips-service-deployer |
| deployer-manager-detection | ✅ Pass | 1ms | - |
| build-and-deploy-activation | ❌ Fail | 1ms | Missing skills: kiips-maven-builder, kiips-service |
| deployer-negative-build-only | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
### ⚠️ Planning Skills Evaluation

**Pass Rate**: 0.0% (0/9)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| feature-planner-activation-korean | ❌ Fail | N/A | Missing skills: kiips-feature-planner |
| feature-planner-activation-english | ❌ Fail | N/A | Missing skills: kiips-feature-planner |
| feature-planner-activation-plan | ❌ Fail | N/A | Missing skills: kiips-feature-planner |
| feature-planner-manager-detection | ❌ Fail | 1ms | Missing skills: kiips-feature-planner |
| detail-planner-activation-korean | ❌ Fail | 1ms | Missing skills: kiips-detail-page-planner |
| detail-planner-activation-detail | ❌ Fail | 1ms | Missing skills: kiips-detail-page-planner |
| detail-planner-with-ui | ❌ Fail | 1ms | Missing skills: kiips-detail-page-planner, kiips-u |
| combined-feature-with-detail | ❌ Fail | 1ms | Missing skills: kiips-feature-planner, kiips-detai |
| planner-negative-build | ❌ Fail | 1ms | Missing skills: kiips-maven-builder |
### ⚠️ UI Skills Evaluation

**Pass Rate**: 0.0% (0/13)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| ui-builder-activation-korean | ❌ Fail | 1ms | Missing skills: kiips-ui-component-builder |
| ui-builder-activation-english | ❌ Fail | 1ms | Missing skills: kiips-ui-component-builder |
| ui-builder-activation-page | ❌ Fail | 1ms | Missing skills: kiips-ui-component-builder |
| ui-builder-manager-detection | ❌ Fail | 2ms | Missing skills: kiips-ui-component-builder |
| realgrid-activation-korean | ❌ Fail | 1ms | Missing skills: kiips-realgrid-builder |
| realgrid-activation-english | ❌ Fail | 1ms | Missing skills: kiips-realgrid-builder |
| realgrid-activation-table | ❌ Fail | 1ms | Missing skills: kiips-realgrid-builder |
| realgrid-with-excel | ❌ Fail | 1ms | Missing skills: kiips-realgrid-builder |
| combined-ui-with-grid | ❌ Fail | 1ms | Missing skills: kiips-ui-component-builder, kiips- |
| combined-full-ui-page | ❌ Fail | 2ms | Missing skills: kiips-realgrid-builder, kiips-ui-c |
| ui-with-detail-planning | ❌ Fail | 1ms | Missing skills: kiips-detail-page-planner, kiips-u |
| ui-negative-backend | ❌ Fail | 2ms | Missing skills: kiips-api-tester |
| ui-negative-build | ❌ Fail | 2ms | Missing skills: kiips-maven-builder |
### ✅ Manager Agents Evaluation

**Pass Rate**: 92.3% (12/13)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| build-manager-single-service | ✅ Pass | N/A | - |
| build-manager-multi-module | ❌ Fail | N/A | Missing skills: kiips-maven-builder |
| build-manager-maven-compile | ✅ Pass | N/A | - |
| deployment-manager-deploy | ✅ Pass | N/A | - |
| deployment-manager-restart | ✅ Pass | N/A | - |
| deployment-manager-logs | ✅ Pass | N/A | - |
| feature-manager-planning | ✅ Pass | N/A | - |
| feature-manager-development | ✅ Pass | N/A | - |
| ui-manager-component | ✅ Pass | N/A | - |
| ui-manager-realgrid | ✅ Pass | N/A | - |
| ui-manager-page | ✅ Pass | N/A | - |
| manager-priority-ui-over-feature | ✅ Pass | N/A | - |
| manager-priority-build-over-deploy | ✅ Pass | N/A | - |
### ⚠️ E2E Workflow Evaluation

**Pass Rate**: 0.0% (0/11)

| Task | Status | Latency | Details |
|------|--------|---------|---------|
| workflow-build-deploy | ❌ Fail | N/A | Missing skills: kiips-maven-builder, kiips-service |
| workflow-build-test-deploy | ❌ Fail | N/A | Missing skills: kiips-maven-builder, kiips-test-ru |
| workflow-feature-planning | ❌ Fail | N/A | Missing skills: kiips-feature-planner |
| workflow-feature-with-api | ❌ Fail | N/A | Missing skills: kiips-feature-planner, kiips-api-t |
| workflow-ui-page-creation | ❌ Fail | N/A | Missing skills: kiips-realgrid-builder, kiips-ui-c |
| workflow-ui-with-detail | ❌ Fail | N/A | Missing skills: kiips-detail-page-planner, kiips-u |
| workflow-ui-grid-table | ❌ Fail | N/A | Missing skills: kiips-realgrid-builder |
| workflow-error-investigation | ❌ Fail | N/A | Missing skills: kiips-log-analyzer, kiips-api-test |
| workflow-log-debug | ❌ Fail | N/A | Missing skills: kiips-log-analyzer |
| workflow-fullstack-feature | ❌ Fail | N/A | Missing skills: kiips-feature-planner, kiips-ui-co |
| workflow-complete-release | ❌ Fail | N/A | Missing skills: kiips-maven-builder, kiips-test-ru |

## ❌ Failed Tasks

### api-tester-activation-korean

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-api-tester"
  }
]
```

### api-tester-activation-english

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-api-tester"
  }
]
```

### api-tester-activation-endpoint

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-api-tester"
  }
]
```

### api-tester-activation-gateway

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-api-tester"
  }
]
```

### log-analyzer-activation-korean

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### log-analyzer-activation-english

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### log-analyzer-activation-error

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### log-analyzer-activation-debug

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### combined-api-log-analysis

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester",
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester",
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-api-tester, kiips-log-analyzer"
  }
]
```

### analysis-manager-detection

**Suite**: Analysis Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### maven-builder-activation-korean

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### maven-builder-activation-english

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### maven-builder-activation-compile

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### maven-builder-activation-package

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### maven-builder-multi-module

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### test-runner-activation-korean

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-test-runner"
    ],
    "actual": [],
    "missing": [
      "kiips-test-runner"
    ],
    "reason": "Missing skills: kiips-test-runner"
  }
]
```

### test-runner-activation-junit

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-test-runner"
    ],
    "actual": [],
    "missing": [
      "kiips-test-runner"
    ],
    "reason": "Missing skills: kiips-test-runner"
  }
]
```

### test-runner-activation-karma

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-test-runner"
    ],
    "actual": [],
    "missing": [
      "kiips-test-runner"
    ],
    "reason": "Missing skills: kiips-test-runner"
  }
]
```

### maven-builder-negative-deploy

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### maven-builder-negative-ui

**Suite**: Build Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder"
  }
]
```

### deployer-activation-korean

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### deployer-activation-english

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### deployer-activation-start

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### deployer-activation-stop

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### deployer-activation-restart

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-service-deployer"
  }
]
```

### build-and-deploy-activation

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder",
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder",
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-maven-builder, kiips-service-deployer"
  }
]
```

### deployer-negative-build-only

**Suite**: Deploy Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### feature-planner-activation-korean

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner"
  }
]
```

### feature-planner-activation-english

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner"
  }
]
```

### feature-planner-activation-plan

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner"
  }
]
```

### feature-planner-manager-detection

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner"
  }
]
```

### detail-planner-activation-korean

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-detail-page-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-detail-page-planner"
    ],
    "reason": "Missing skills: kiips-detail-page-planner"
  }
]
```

### detail-planner-activation-detail

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-detail-page-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-detail-page-planner"
    ],
    "reason": "Missing skills: kiips-detail-page-planner"
  }
]
```

### detail-planner-with-ui

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-detail-page-planner, kiips-ui-component-builder"
  }
]
```

### combined-feature-with-detail

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner",
      "kiips-detail-page-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner",
      "kiips-detail-page-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner, kiips-detail-page-planner"
  }
]
```

### planner-negative-build

**Suite**: Planning Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### ui-builder-activation-korean

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder"
  }
]
```

### ui-builder-activation-english

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder"
  }
]
```

### ui-builder-activation-page

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder"
  }
]
```

### ui-builder-manager-detection

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder"
  }
]
```

### realgrid-activation-korean

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder"
  }
]
```

### realgrid-activation-english

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder"
  }
]
```

### realgrid-activation-table

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder"
  }
]
```

### realgrid-with-excel

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder"
  }
]
```

### combined-ui-with-grid

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-ui-component-builder",
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-ui-component-builder",
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-ui-component-builder, kiips-realgrid-builder"
  }
]
```

### combined-full-ui-page

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder, kiips-ui-component-builder"
  }
]
```

### ui-with-detail-planning

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-detail-page-planner, kiips-ui-component-builder"
  }
]
```

### ui-negative-backend

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-api-tester"
  }
]
```

### ui-negative-build

**Suite**: UI Skills Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### build-manager-multi-module

**Suite**: Manager Agents Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder"
    ],
    "reason": "Missing skills: kiips-maven-builder"
  }
]
```

### workflow-build-deploy

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder",
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder",
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-maven-builder, kiips-service-deployer"
  }
]
```

### workflow-build-test-deploy

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder",
      "kiips-test-runner",
      "kiips-service-deployer"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder",
      "kiips-test-runner",
      "kiips-service-deployer"
    ],
    "reason": "Missing skills: kiips-maven-builder, kiips-test-runner, kiips-service-deployer"
  }
]
```

### workflow-feature-planning

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner"
    ],
    "reason": "Missing skills: kiips-feature-planner"
  }
]
```

### workflow-feature-with-api

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner",
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner",
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-feature-planner, kiips-api-tester"
  }
]
```

### workflow-ui-page-creation

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder, kiips-ui-component-builder"
  }
]
```

### workflow-ui-with-detail

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-detail-page-planner",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-detail-page-planner, kiips-ui-component-builder"
  }
]
```

### workflow-ui-grid-table

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-realgrid-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-realgrid-builder"
    ],
    "reason": "Missing skills: kiips-realgrid-builder"
  }
]
```

### workflow-error-investigation

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer",
      "kiips-api-tester"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer",
      "kiips-api-tester"
    ],
    "reason": "Missing skills: kiips-log-analyzer, kiips-api-tester"
  }
]
```

### workflow-log-debug

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-log-analyzer"
  }
]
```

### workflow-fullstack-feature

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-feature-planner",
      "kiips-ui-component-builder"
    ],
    "actual": [],
    "missing": [
      "kiips-feature-planner",
      "kiips-ui-component-builder"
    ],
    "reason": "Missing skills: kiips-feature-planner, kiips-ui-component-builder"
  }
]
```

### workflow-complete-release

**Suite**: E2E Workflow Evaluation
**Error**: See grading results

**Grading Results**:
```json
[
  {
    "type": "activation",
    "passed": false,
    "score": 0,
    "expected": [
      "kiips-maven-builder",
      "kiips-test-runner",
      "kiips-service-deployer",
      "kiips-log-analyzer"
    ],
    "actual": [],
    "missing": [
      "kiips-maven-builder",
      "kiips-test-runner",
      "kiips-service-deployer",
      "kiips-log-analyzer"
    ],
    "reason": "Missing skills: kiips-maven-builder, kiips-test-runner, kiips-service-deployer, kiips-log-analyzer"
  }
]
```

## ⚙️ Configuration

<details>
<summary>Click to expand configuration</summary>

```json
{
  "$schema": "./evals.schema.json",
  "version": "2.0.0",
  "description": "KiiPS AI Agent Evaluation System Configuration - Enhanced with Pass@k, LLM Grader, Transcripts",
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
  "trials": {
    "defaultK": 3,
    "passAtKThreshold": 0.8,
    "passKThreshold": 0.6
  },
  "transcript": {
    "enabled": true,
    "storePath": "./results/transcripts/",
    "retention": "30d"
  },
  "humanCheckpoint": {
    "enabled": true,
    "triggerOn": [
      "critical",
      "ambiguous"
    ],
    "timeout": 300000
  },
  "trend": {
    "enabled": true,
    "retentionDays": 90,
    "storePath": "./results/trends/"
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
        "enabled": true,
        "model": "claude-sonnet-4",
        "rubricPath": "./rubrics/",
        "timeout": 60000,
        "maxRetries": 2
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
- **Duration**: 16ms

---

*Generated by KiiPS AI Agent Evaluation System*
*Based on [Anthropic's Eval Guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)*