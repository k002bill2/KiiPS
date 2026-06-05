---
description: "Instinct 클러스터링 → 스킬/커맨드/에이전트 진화"
---

# /evolve — Instinct 클러스터링 → 스킬/커맨드/에이전트 진화

관련 instinct들을 클러스터링하여 상위 구조(커맨드, 스킬, 에이전트)로 진화시킵니다.

## 사용법

```
/evolve                           # 전체 instinct 분석 및 진화 제안
/evolve --domain <domain>         # 특정 도메인만
/evolve --dry-run                 # 미리보기 (파일 생성 안함)
/evolve --execute                 # 실제 파일 생성
/evolve --threshold 5             # 최소 5개 이상 관련 instinct 필요
```

## 실행 절차

### 1단계: Instinct 수집

`.claude/learning/instincts/personal/` 및 `inherited/`의 모든 instinct를 읽습니다.

### 2단계: 정제 (Deduplication & Conflict Resolution)

#### 2-1. 중복 감지

동일하거나 유사한 instinct를 병합:
- 동일 도메인 + 유사 트리거 (편집거리 ≤ 30%)
- 신뢰도가 높은 쪽을 기준으로 병합
- 관찰 횟수는 합산

#### 2-2. 상충 해결

서로 모순되는 instinct 감지:
1. 신뢰도 비교: 높은 쪽 우선
2. 최신 관찰 우선
3. 해결 불가 시: 사용자에게 질문

#### 2-3. 저신뢰도 정리

- 신뢰도 0.3 미만 + 30일 이상 관찰 없음 → 아카이브
- 신뢰도 0.2 미만 → 삭제 후보 (사용자 확인)

### 3단계: 클러스터링

정제된 instinct들을 그룹화:
- 동일 도메인
- 유사 트리거 패턴
- 관련 액션 시퀀스

최소 3개(기본값) 이상의 관련 instinct가 있어야 클러스터 형성.

### 4단계: 진화 유형 결정

| instinct 패턴 | 진화 유형 | 예시 |
|--------------|----------|------|
| 사용자가 명시적 호출하는 액션 | **Command** | `/fix-binding` |
| 자동 트리거 행동 | **Skill** | `safety-check` |
| 복합 멀티스텝 프로세스 | **Agent** | `migration-agent` |

### 5단계: 제안 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Evolve — Instinct 진화 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  분석 대상: N개 instinct

  ## 클러스터 1: {도메인} 패턴
  Instincts: {목록}
  유형: {Command/Skill/Agent}
  신뢰도: {%} ({N}회 관찰)

  ---
  `/evolve --execute`로 파일을 생성합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6단계: --execute 시 파일 생성

- **Command** → `.claude/learning/evolved/commands/{name}.md`
- **Skill** → `.claude/learning/evolved/skills/{name}/SKILL.md`
- **Agent** → `.claude/learning/evolved/agents/{name}.md`

생성 후 `.claude/commands/`, `.claude/skills/`, `.claude/agents/`로 이동(배포)할지 확인.

### 7단계: 기존 에이전트/스킬 중복 확인

진화 전 기존 에이전트/스킬과 중복 검사를 수행하고, 중복 시 기존 구조에 위임합니다.
