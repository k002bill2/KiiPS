---
name: kiips-session-wrap
description: "KiiPS 세션 종료 정리 — 변경 요약, 학습 패턴 수집, 컨텍스트 저장, 인수인계. Use when: 세션 정리, 세션 종료, 마무리, 인수인계, session wrap, wrap up"
disable-model-invocation: true
---

# kiips-session-wrap

> 세션 종료 정리 스킬 - Forge session-wrap를 KiiPS 환경에 적응

## Description

세션 종료 시 변경 요약, 학습 패턴 수집, Dev Docs 업데이트, 다음 세션 인수인계를 구조화합니다.
기존 `/save-and-compact` 커맨드를 포함하는 상위 워크플로우입니다.

## Trigger

- `/session-wrap` 커맨드 실행 시
- 세션 종료 전 정리 요청 시
- "세션 정리", "오늘 작업 마무리", "인수인계" 키워드

## Workflow

### Phase 1: COLLECT (변경 수집)

```bash
# SVN 변경사항 수집
svn status

# 세션 관찰 데이터 확인
cat .claude/learning/observations.jsonl | tail -20
```

수집 항목:
- 변경/추가/삭제된 파일 목록
- 영향받은 KiiPS 모듈
- 빌드/테스트 최종 실행 결과 (세션 내 실행했다면)

### Phase 2: SUMMARIZE (요약)

출력 형식:
```markdown
## 세션 요약 (YYYY-MM-DD)

### 완료
- 작업 1
- 작업 2

### 미완료
- 작업 3 (이유)

### 발견된 이슈
- 이슈 설명

### 기술 부채
- 부채 항목
```

### Phase 3: LEARN (학습)

- `.claude/learning/observations.jsonl`에서 세션 관찰 패턴 요약
- 반복 패턴 발견 시 `/learn` 호출 제안
- 메모리 파일 업데이트 (필요 시)

### Phase 4: HANDOFF (인수인계)

1. `/update-dev-docs` 또는 `/save-and-compact` 호출
2. 다음 세션 시작 가이드 출력:
   ```
   다음 세션: /resume 으로 컨텍스트 복원
   미완료: [작업 목록]
   주의: [있다면]
   ```
3. SVN 커밋 필요 여부 안내

## Dependencies

- `observe.js` hook: 세션 관찰 데이터 소스
- `save-and-compact`: 컨텍스트 저장 + 압축
- `update-dev-docs`: Dev Docs 업데이트
- `resume`: 다음 세션 복원
- `learn`: 패턴 학습 기록
