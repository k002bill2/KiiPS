---
name: kiips-continuous-learning
description: "KiiPS 연속 학습 시스템 — 세션 관찰 기반 Instinct 생성, 패턴 감지, 스킬/커맨드 진화. Use when: 학습, 교훈 기록, 패턴 분석, instinct, evolve"
version: 1.0.0
---

# KiiPS Continuous Learning System

> Claude Forge continuous-learning-v2의 Instinct 아키텍처를 KiiPS 환경에 적응.
> "oh-my-zsh for Claude Code"의 자기학습 패턴을 KiiPS 도메인 지식으로 확장.

## 아키텍처

```
세션 활동
    │
    │ observe.js (PostToolUse hook, 100% 신뢰성)
    ▼
┌─────────────────────────────────────────┐
│       observations.jsonl                │
│  (도구 호출, 에러, 도메인 태그)           │
└─────────────────────────────────────────┘
    │
    │ /learn --from-session 또는 수동 입력
    ▼
┌─────────────────────────────────────────┐
│         패턴 감지                        │
│  • 사용자 교정 → instinct               │
│  • 에러 해결 → instinct                 │
│  • 반복 워크플로우 → instinct            │
└─────────────────────────────────────────┘
    │
    │ 생성/업데이트
    ▼
┌─────────────────────────────────────────┐
│     instincts/personal/                  │
│  • mybatis-like-concat.md (0.8)          │
│  • realgrid-excel-header.md (0.7)        │
│  • maven-build-order.md (0.9)            │
└─────────────────────────────────────────┘
    │
    │ /evolve 클러스터링
    ▼
┌─────────────────────────────────────────┐
│            evolved/                       │
│  • commands/fix-mybatis.md               │
│  • skills/realgrid-patterns.md           │
│  • agents/build-debugger.md              │
└─────────────────────────────────────────┘
```

## Instinct 모델

Instinct는 atomic 학습 단위입니다:

```yaml
---
id: mybatis-like-concat
trigger: "MyBatis LIKE 검색 쿼리 작성 시"
confidence: 0.8
domain: "mybatis-pattern"
source: "session-observation"
created: "2026-03-10"
updated: "2026-03-10"
observations: 5
---

# MyBatis LIKE 검색 시 CONCAT 사용

## Action
LIKE 검색 시 CONCAT('%', #{value}, '%') 사용. ${} 금지.

## Evidence
- 세션 관찰: mybatis-like-concat 패턴 5회 감지
- 사용자 교정: ${} 사용 후 #{} 로 수정 (2026-03-08)
```

### 속성
- **Atomic** — 하나의 트리거, 하나의 액션
- **신뢰도 가중** — 0.3(잠정) ~ 0.9(확정)
- **도메인 태그** — KiiPS 9개 도메인 분류
- **증거 기반** — 관찰 횟수 + 출처 추적

## KiiPS 도메인 분류

| 도메인 | 설명 | 예시 |
|--------|------|------|
| `mybatis-pattern` | MyBatis 쿼리/매퍼 패턴 | #{} vs ${}, 동적 SQL |
| `realgrid-pattern` | RealGrid 설정/이벤트 | GridView 초기화, Excel export |
| `build-pattern` | Maven 빌드/의존성 | 빌드 순서, SNAPSHOT 관리 |
| `security-pattern` | 보안 패턴 | XSS, CSRF, 인증 |
| `jsp-pattern` | JSP/Include 패턴 | inc_filter, JSTL |
| `scss-pattern` | SCSS/테마 패턴 | [data-theme=dark], 변수 |
| `api-pattern` | REST API 패턴 | Controller, Gateway |
| `error-pattern` | 에러 해결 패턴 | NullPointer, 빌드 실패 |
| `workflow-pattern` | 워크플로우 자동화 | 반복 작업, 수동 프로세스 |

## 신뢰도 시스템

| 점수 | 의미 | 행동 |
|------|------|------|
| 0.3 | 잠정적 | 제안만 (강제하지 않음) |
| 0.5 | 보통 | 관련 시 적용 |
| 0.7 | 강함 | 자동 적용 |
| 0.9 | 확정 | 핵심 행동 |

**신뢰도 증가**:
- 패턴 반복 관찰 (+0.05)
- 사용자가 제안 행동을 교정하지 않음 (+0.03)
- 다른 소스에서 동일 패턴 확인 (+0.1)

**신뢰도 감소**:
- 사용자가 명시적으로 교정 (-0.1)
- 장기간 관찰되지 않음 (-0.02/주)
- 반대 증거 출현 (-0.15)

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/learn` | 교훈 기록 (직접/에러/세션/제안) |
| `/instinct-status` | 학습된 패턴 조회 |
| `/evolve` | 패턴 클러스터링 → 스킬/커맨드 진화 |

## Hook

| Hook | 이벤트 | 역할 |
|------|--------|------|
| `observe.js` | PostToolUse (Bash, Edit, Write) | 도구 사용 패턴 수집 |

## 디렉토리 구조

```
.claude/learning/
├── observations.jsonl         # 현재 세션 관찰 로그
├── archive/                   # 아카이브된 관찰 로그
├── instincts/
│   ├── personal/              # 자동 학습된 instinct
│   └── inherited/             # 외부 임포트 instinct
└── evolved/
    ├── agents/                # 진화된 에이전트
    ├── skills/                # 진화된 스킬
    └── commands/              # 진화된 커맨드
```

## 메모리 연동

Instinct는 Claude Code 메모리 시스템과 양방향 연동:

| 방향 | 경로 | 설명 |
|------|------|------|
| Instinct → 메모리 | `.claude/memory/{domain}.md` | 학습 결과를 도메인별 메모리에 기록 |
| 메모리 → Instinct | SessionStart에서 로드 | 다음 세션에서 학습된 패턴 참조 |

## 프라이버시

- 관찰 데이터는 **로컬**에만 저장 (.claude/learning/)
- **Instinct**(패턴)만 공유 가능, 실제 코드/대화 내용은 포함하지 않음
- 사용자가 내보내기 제어

## 기존 KiiPS 스킬과의 관계

| 구분 | 기존 27개 스킬 | Continuous Learning |
|------|-------------|-------------------|
| 생성 방식 | 수동 작성 | 세션 관찰 → 자동 생성 |
| 도메인 | 고정 (미리 정의) | 동적 (관찰에서 추출) |
| 업데이트 | 직접 편집 | 관찰 누적 시 자동 |
| 신뢰도 | 없음 (항상 100%) | 0.3~0.9 가중치 |

**상호보완**: 기존 스킬은 "검증된 지식", Instinct는 "발견 중인 지식".
Instinct가 0.9 이상이면 기존 스킬에 통합을 제안합니다.
