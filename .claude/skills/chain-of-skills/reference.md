# Chain of Skills — Reference

> 파이프라인 실행 상세 가이드

---

## Pipeline Execution Protocol

### 1. 초기화

```
1. 파이프라인 선택 (promptTriggers 매칭)
2. Stage 목록 로드
3. 필수 스킬 가용성 확인
4. 초기 체크포인트 생성
```

### 2. Stage 실행

```
for each stage in pipeline.stages:
    if stage.condition and not evaluate(stage.condition):
        skip(stage)
        continue

    if stage.parallel:
        results = parallel_execute(stage.skills)
    else:
        results = sequential_execute(stage.skills)

    checkpoint(stage, results)

    if any(r.status == 'failure' and r.severity == 'critical' for r in results):
        rollback(pipeline)
        break
```

### 3. 체크포인트 형식

```json
{
  "pipeline": "build-deploy-verify",
  "stage": "build",
  "timestamp": "ISO8601",
  "results": {
    "kiips-maven-builder": { "status": "success", "output": "BUILD SUCCESS" },
    "kiips-test-runner": { "status": "success", "output": "Tests: 42 passed" }
  },
  "nextStage": "deploy"
}
```

---

## Stage Dependency Matrix

### build-deploy-verify

| Stage | Skills | Depends On | Parallel |
|-------|--------|------------|----------|
| build | maven-builder, test-runner | none | Yes |
| deploy | service-deployer | build.success | No |
| verify | log-reader, api-tester | deploy.success | Yes |
| report | checklist-generator | verify.complete | No |

### feature-lifecycle

| Phase | Skills | Depends On | Parallel |
|-------|--------|------------|----------|
| design | architect, compliance-checker | none | No |
| backend | developer, backend-guidelines | design.reviewed | No |
| frontend | ui-designer, frontend-guidelines | design.reviewed | Yes (with backend) |
| test | test-runner | backend + frontend | No |
| review | code-simplifier | test.passed | No |

### incident-response

| Step | Skills | Depends On | Parallel |
|------|--------|------------|----------|
| collect | log-reader, db-inspector | none | Yes |
| analyze | log-analyzer | collect.complete | No |
| verify | api-tester | analyze.complete | No |
| fix | developer, test-runner | analyze.requires_fix | No |

---

## Error Handling

### Retry Policy

| Error Type | Max Retries | Backoff |
|------------|-------------|---------|
| Tool timeout | 3 | 1s, 5s, 15s |
| Skill not found | 0 | N/A (abort) |
| Partial failure | 2 | 2s, 10s |
| Network error | 3 | 1s, 3s, 10s |

### Rollback Strategy

```
Critical failure detected:
1. Log failure details
2. Save current state (checkpoint)
3. Revert any partial changes (if applicable)
4. Notify user with failure summary
5. Suggest manual intervention steps
```

---

## Manager-Pipeline Mapping

| Pipeline | Primary Manager | Secondary Manager |
|----------|-----------------|-------------------|
| build-deploy-verify | build-manager | deployment-manager |
| feature-lifecycle | feature-manager | ui-manager |
| incident-response | deployment-manager | feature-manager (if fix needed) |

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
