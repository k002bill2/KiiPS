---
description: "교훈 기록 + 자동화 제안"
argument-hint: "<패턴 설명> | --from-error | --from-session | --suggest"
---

# /learn — 교훈 기록 + 자동화 제안

세션에서 발견한 교훈을 기록하고, 반복 패턴을 자동화로 전환합니다.

## 사용법

```
/learn "패턴 설명"
/learn --from-error          # 최근 에러에서 패턴 추출
/learn --from-session        # 현재 세션에서 패턴 추출
/learn --suggest             # VCS 로그 기반 자동화 제안
/learn --list                # 기록된 교훈 목록
/learn --edit N              # N번 항목 수정
/learn --remove N            # N번 항목 삭제
```

## 실행 절차

$ARGUMENTS 파싱:
- `--list`: 교훈 목록 표시 후 종료
- `--edit N`: N번 항목 수정 후 종료
- `--remove N`: N번 항목 삭제 후 종료
- `--from-error`: 에러 기반 학습
- `--from-session`: 세션 기반 학습
- `--suggest`: 자동화 제안
- 플래그 없음: 직접 입력

### 1단계: 학습 소스 분석

#### 직접 입력 (기본)
사용자가 제공한 텍스트를 교훈으로 기록.

#### --from-error
1. 최근 대화에서 에러 메시지를 탐지
2. 근본 원인 분석
3. 해결 방법을 교훈으로 정리

#### --from-session
1. 현재 세션에서 수행한 작업 요약
2. 반복된 패턴, 실수, 발견사항 추출
3. 각 항목을 교훈으로 정리

#### --suggest
VCS 히스토리에서 반복 패턴을 식별하여 자동화 제안 (커맨드/스킬/훅)

### 2단계: 패턴 분류

추출된 교훈을 프로젝트 도메인으로 태깅합니다.
프로젝트별 도메인 태그는 `.claude/learning/` 디렉토리의 구성에 따릅니다.

### 3단계: Instinct 생성

교훈을 atomic instinct로 변환하여 저장:

```yaml
---
id: example-pattern-name
trigger: "특정 상황 설명"
confidence: 0.7
domain: "pattern-domain"
source: "direct-input"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
observations: 1
---

# 패턴 제목

## Action
구체적인 행동 지침.

## Evidence
- 소스: 학습 경로
```

저장 경로: `.claude/learning/instincts/personal/{id}.md`

### 4단계: observations.jsonl 기록

```json
{"timestamp":"...","type":"learn","source":"direct","domain":"...","instinct_id":"...","summary":"..."}
```

### 5단계: 메모리 연동

교훈 도메인에 따라 관련 메모리 파일에 기록합니다.

### 6단계: 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Learn — 연속 학습 시스템
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  모드: {직접입력 / from-error / from-session / suggest}
  도메인: {감지된 도메인}
  신뢰도: {0.3~0.9}

  기록된 교훈:
    {교훈 요약}

  Instinct 저장: .claude/learning/instincts/personal/{id}.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
