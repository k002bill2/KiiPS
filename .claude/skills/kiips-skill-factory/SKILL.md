---
description: "세션 활동 분석 → 기존 스킬 중복 검사 → 자동 스킬/커맨드 생성. Use when: 스킬 생성, 자동화 제안, skill factory, 스킬 팩토리"
---

# KiiPS Skill Factory

세션 활동을 분석하여 반복 패턴을 스킬/커맨드로 자동 생성합니다.

## 실행 절차

### 1단계: 활동 분석

현재 세션 또는 observations.jsonl에서 반복 패턴을 추출합니다.

```bash
# 도메인별 관찰 빈도 확인
cat .claude/learning/observations.jsonl | python3 -c "
import json, sys, collections
domains = collections.Counter()
tools = collections.Counter()
for line in sys.stdin:
    try:
        obj = json.loads(line.strip())
        for d in obj.get('domains', []):
            if d != 'general': domains[d] += 1
        tools[obj.get('tool', '')] += 1
    except: pass
print('Domain frequencies:')
for d, c in domains.most_common(10):
    print(f'  {d}: {c}')
print('\\nTool frequencies:')
for t, c in tools.most_common(5):
    print(f'  {t}: {c}')
"
```

### 2단계: 기존 스킬 중복 검사

기존 36+ 스킬과 중복 여부 확인:

```bash
# 기존 스킬 목록
ls -1 .claude/skills/*/SKILL.md | sed 's|.claude/skills/||;s|/SKILL.md||'
```

중복 판단 기준:
- 동일 도메인 + 유사 기능 → **기존 스킬 확장** (신규 생성 금지)
- 새로운 도메인 또는 교차 도메인 → **신규 스킬 후보**
- 3개 이상의 관련 instinct가 클러스터를 형성 → **진화 후보** (`/evolve` 위임)

### 3단계: 스킬 템플릿 생성

KiiPS 스킬 표준 구조를 따라 생성:

```markdown
---
description: "{한줄 설명}. Use when: {트리거 키워드}"
---

# {스킬명}

## 개요
{스킬 목적 1-2문장}

## 실행 절차

### 1단계: {사전 확인}
### 2단계: {핵심 작업}
### 3단계: {검증}

## KiiPS 특화 규칙
{도메인 특화 규칙}

## 관련 스킬
- {기존 관련 스킬 목록}
```

### 4단계: 등록

생성된 스킬을 `skill-rules.json`에 등록하고 CLAUDE.md Active Skills 테이블에 추가.

## 제약 사항

- **기존 스킬과 70% 이상 기능 중복 시 신규 생성 금지** → 기존 스킬 확장
- **instinct 3개 미만으로 뒷받침되는 패턴은 스킬 생성 불가** → 관찰 지속
- **스킬 총 수 50개 초과 금지** → 현재 36+, 여유 14개
- **반드시 사용자 승인 후 생성** → 자동 생성 후 즉시 배포 금지
