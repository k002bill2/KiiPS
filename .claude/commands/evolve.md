# /evolve — Instinct 클러스터링 → 스킬/커맨드/에이전트 진화

관련 instinct들을 클러스터링하여 상위 구조(커맨드, 스킬, 에이전트)로 진화시킵니다.

## 사용법

```
/evolve                           # 전체 instinct 분석 및 진화 제안
/evolve --domain mybatis          # MyBatis 도메인만
/evolve --dry-run                 # 미리보기 (파일 생성 안함)
/evolve --execute                 # 실제 파일 생성
/evolve --threshold 5             # 최소 5개 이상 관련 instinct 필요
```

## 실행 절차

### 1단계: Instinct 수집

`.claude/learning/instincts/personal/` 및 `inherited/`의 모든 instinct를 읽습니다.

### 2단계: 정제 (Deduplication & Conflict Resolution)

클러스터링 전에 기존 instinct를 정제합니다:

#### 2-1. 중복 감지

동일하거나 유사한 instinct를 병합:

```
중복 기준:
- 동일 도메인 + 유사 트리거 (편집거리 ≤ 30%)
- 동일 액션 패턴 (정규화 후 비교)

병합 규칙:
- 신뢰도가 높은 쪽을 기준으로 병합
- 관찰 횟수는 합산
- 트리거 패턴은 합집합 (OR)
```

출력 형식:
```
중복 감지: 3건
  [MERGE] mybatis-param-check + mybatis-binding-safety
    → mybatis-param-binding (신뢰도: 0.8, 관찰: 15회)
  [MERGE] realgrid-init-check + realgrid-setup-verify
    → realgrid-initialization (신뢰도: 0.7, 관찰: 9회)
```

#### 2-2. 상충 해결

서로 모순되는 instinct 감지 및 해결:

```
상충 기준:
- 동일 트리거에 대해 반대 액션 (예: "추가하라" vs "제거하라")
- 동일 도메인에서 상반된 규칙

해결 규칙:
1. 신뢰도 비교: 높은 쪽 우선
2. 최신 관찰 우선: 최근 관찰된 instinct 우선
3. 해결 불가 시: 사용자에게 질문
```

출력 형식:
```
상충 감지: 1건
  [CONFLICT] scss-use-important vs scss-avoid-important
    → scss-use-important 우선 (신뢰도: 0.85 vs 0.45)
    → scss-avoid-important 아카이브로 이동
```

#### 2-3. 저신뢰도 정리

```
정리 기준:
- 신뢰도 0.3 미만 + 30일 이상 관찰 없음 → 아카이브
- 신뢰도 0.2 미만 → 삭제 후보 (사용자 확인)
```

### 3단계: 클러스터링

정제된 instinct들을 그룹화:
- 동일 도메인
- 유사 트리거 패턴
- 관련 액션 시퀀스

최소 3개(기본값) 이상의 관련 instinct가 있어야 클러스터 형성.

### 4단계: 진화 유형 결정

| instinct 패턴 | 진화 유형 | 예시 |
|--------------|----------|------|
| 사용자가 명시적 호출하는 액션 | **Command** | `/fix-mybatis-binding` |
| 자동 트리거 행동 | **Skill** | `mybatis-safety-check` |
| 복합 멀티스텝 프로세스 | **Agent** | `realgrid-migration-agent` |

### 5단계: 제안 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Evolve — Instinct 진화 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  분석 대상: N개 instinct

  ## 클러스터 1: MyBatis 안전 쿼리 패턴
  Instincts: mybatis-like-concat, mybatis-param-binding, mybatis-dynamic-if
  유형: Skill
  신뢰도: 85% (12회 관찰)
  생성 대상: kiips-mybatis-safety skill

  ## 클러스터 2: RealGrid Excel 설정
  Instincts: realgrid-excel-header, realgrid-excel-format, realgrid-export-config
  유형: Command
  신뢰도: 72% (8회 관찰)
  생성 대상: /realgrid-excel command

  ---
  `/evolve --execute`로 파일을 생성합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6단계: --execute 시 파일 생성

승인된 클러스터에 대해:
- **Command** → `.claude/learning/evolved/commands/{name}.md`
- **Skill** → `.claude/learning/evolved/skills/{name}/SKILL.md`
- **Agent** → `.claude/learning/evolved/agents/{name}.md`

생성 후 사용자에게 `.claude/commands/`, `.claude/skills/`, `.claude/agents/`로 이동(배포)할지 확인.

### 7단계: KiiPS 에이전트 중복 확인

진화 전 기존 KiiPS 에이전트/스킬과 중복 검사:

| 기존 에이전트 | 커버 도메인 | 중복 시 |
|-------------|-----------|--------|
| security-reviewer | 보안 | 에이전트에 위임 |
| build-manager | Maven 빌드 | 에이전트에 위임 |
| kiips-developer | 백엔드 코딩 | 에이전트에 위임 |
| kiips-ui-designer | UI/JSP | 에이전트에 위임 |

기존 27개 스킬도 동일하게 중복 확인.
