# KiiPS Skills 2.0 고도화 로드맵 — 세부 Task 분석서

> **Generated**: 2026-03-13
> **Completed**: 2026-03-13 (All 12 tasks)
> **Analyst**: Task Analyzer (Agent-system 수석 아키텍트)
> **Scope**: Phase 1~3, 총 12개 Task, 5개 병렬 그룹
> **Status**: **COMPLETED** - 전체 구현 및 검증 완료

---

## 현재 상태 요약

| 항목 | 현재 값 |
|------|---------|
| 스킬 수 | 34개 (`.claude/skills/`) — *완료 후: 30 → 34* |
| skill-rules.json 엔트리 | 33개 — *완료 후: 29 → 33* |
| enforcement 유형 | `require` (18), `suggest` (13), `block` (2) — *완료 후 업데이트* |
| 에이전트 | 9개 Specialist + 4개 Manager + 1 Primary |
| ACE 레이어 | 7-layer (Aspirational → Specialist) |
| 기존 block 룰 | `kiips-database-verification` (1건) |
| Hook 시스템 | `userPromptSubmit.js` → `skill-rules.json` 읽기 → 스킬 활성화 |

---

## Phase 1: Context-Aware 가드레일 스킬 구축

### 목표
- **legacy-compliance-checker** 스킬 신규 개발
- skill-rules.json에 `block` enforcement 룰 확장
- 기존 `kiips-database-verification`의 block 패턴을 일반화

### Task 1-1: legacy-compliance-checker 스킬 생성

**생성 파일:**
```
.claude/skills/legacy-compliance-checker/
├── SKILL.md              # 스킬 정의 (메인)
└── reference.md          # 상세 룰 레퍼런스
```

**SKILL.md 핵심 내용:**
```yaml
---
name: legacy-compliance-checker
description: "KiiPS 레거시 준수 검증 - Java 8 호환성, Spring Boot 2.4.x 패턴, jQuery/JSP 표준 검사"
user-invocable: false
---
```

**검증 대상 (Context-Aware 룰):**

| 카테고리 | 차단 패턴 | 허용 패턴 |
|----------|----------|----------|
| Java 버전 | `var` (Java 10+), `record` (Java 14+), `sealed` (Java 17+) | `final`, 명시적 타입 선언 |
| Spring Boot | `@SpringBootApplication(proxyBeanMethods=false)` (2.x 미지원) | `@SpringBootApplication` |
| JSP 금지 | React/Vue/Angular import, ES Module `import/export` | jQuery, JSTL, `<script>` 태그 |
| MyBatis | `${}` 직접 바인딩 (ORDER BY 제외) | `#{}` 파라미터 바인딩 |
| SCSS | `.dark`, `.theme-dark` 셀렉터 | `[data-theme=dark]` |
| 의존성 | Java 9+ 전용 라이브러리 추가 | Java 8 호환 라이브러리 |

**의존성:** 없음 (독립 생성 가능)

---

### Task 1-2: skill-rules.json에 legacy-compliance-checker 룰 추가

**수정 파일:** `.claude/skill-rules.json`

**추가할 JSON 조각:**
```json
{
  "legacy-compliance-checker": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "description": "KiiPS 레거시 호환성 검증 - Java 8, Spring Boot 2.4.x, jQuery/JSP 표준",
    "promptTriggers": {
      "keywords": ["Java", "코드 작성", "구현", "implement", "클래스", "메서드", "controller", "service"],
      "intentPatterns": [
        "(create|add|write|작성|생성).*?(class|method|controller|service|dao|mapper)",
        "(implement|구현).*?(feature|기능|API|endpoint)",
        "(upgrade|업그레이드|migration|마이그레이션).*?(java|spring|version)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["**/*.java", "**/*.jsp", "**/*.xml", "**/*.scss"],
      "contentPatterns": ["public class", "public interface", "<%@", "@import"]
    },
    "blockRules": [
      {
        "id": "java8-syntax",
        "pattern": "\\bvar\\s+\\w+\\s*=|\\brecord\\s+\\w+|\\bsealed\\s+(class|interface)",
        "message": "Java 8 호환성 위반: var/record/sealed는 Java 10+ 문법입니다",
        "severity": "critical"
      },
      {
        "id": "dark-theme-selector",
        "pattern": "\\.(dark|theme-dark)\\s*\\{",
        "message": "[data-theme=dark] 셀렉터만 사용하세요 (.dark, .theme-dark 금지)",
        "severity": "high"
      },
      {
        "id": "mybatis-injection",
        "pattern": "\\$\\{(?!sortColumn|sortDirection|orderBy)",
        "message": "MyBatis ${} 직접 삽입은 SQL Injection 위험 (ORDER BY 예외만 허용)",
        "severity": "critical"
      }
    ]
  }
}
```

**의존성:** Task 1-1 (스킬 정의 먼저 필요)

---

### Task 1-3: skill-rules.json 스키마에 blockRules 필드 도입

**수정 파일:**
- `.claude/skill-rules.json` — 스키마 확장
- `.claude/hooks/userPromptSubmit.js` — blockRules 처리 로직 추가

**userPromptSubmit.js 변경 내용:**

```javascript
// activateSkills() 함수 내부에 추가
function checkBlockRules(prompt, rules) {
  const violations = [];
  for (const [skillName, rule] of Object.entries(rules)) {
    if (rule.enforcement !== 'block' || !rule.blockRules) continue;
    for (const blockRule of rule.blockRules) {
      try {
        if (new RegExp(blockRule.pattern, 'i').test(prompt)) {
          violations.push({
            skill: skillName,
            ruleId: blockRule.id,
            message: blockRule.message,
            severity: blockRule.severity
          });
        }
      } catch (_) { continue; }
    }
  }
  return violations;
}
```

**출력 형식 예시:**
```
[BLOCKED] legacy-compliance-checker:java8-syntax
  ⛔ Java 8 호환성 위반: var/record/sealed는 Java 10+ 문법입니다
```

**의존성:** Task 1-2

---

### Task 1-4: 기존 block 룰 마이그레이션

**수정 파일:** `.claude/skill-rules.json`

기존 `kiips-database-verification`에 `blockRules` 배열 추가:
```json
{
  "kiips-database-verification": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "critical",
    "blockRules": [
      {
        "id": "ddl-destructive",
        "pattern": "\\b(DROP|TRUNCATE|ALTER)\\s+(TABLE|INDEX|COLUMN)",
        "message": "DDL 파괴 명령 차단: DBA 승인 필수",
        "severity": "critical"
      },
      {
        "id": "delete-without-where",
        "pattern": "DELETE\\s+FROM\\s+\\w+\\s*(?!WHERE)",
        "message": "WHERE 없는 DELETE 차단: 대량 삭제 위험",
        "severity": "critical"
      }
    ]
  }
}
```

**의존성:** Task 1-3 (blockRules 스키마 먼저 필요)
**병렬 가능:** Task 1-1과 병렬 (파일 충돌 없음)

---

## Phase 2: Read-only Data Skills 구축

### 목표
- 조회 전용 스킬 개발 (DB 구조 탐색, 로그 분석 강화)
- 실제 DB 연결 없이 메타데이터/MyBatis mapper 기반 분석
- 기존 `kiips-log-analyzer` 확장

### Task 2-1: kiips-db-inspector 스킬 생성

**생성 파일:**
```
.claude/skills/kiips-db-inspector/
├── SKILL.md              # 스킬 정의
└── reference.md          # DB 메타데이터 레퍼런스
```

**SKILL.md 핵심 설계:**
```yaml
---
name: kiips-db-inspector
description: "KiiPS DB 구조 조회 전용 스킬 - MyBatis mapper 분석, 테이블/컬럼 탐색, 관계 추적"
user-invocable: false
---
```

**핵심 기능 (Read-only):**

| 기능 | 데이터 소스 | 구현 방식 |
|------|------------|----------|
| 테이블 구조 탐색 | MyBatis mapper XML | `<resultMap>`, `<sql>` 분석 |
| 컬럼 목록 추출 | Mapper XML + Java Entity | `<result>` 태그 파싱 |
| 테이블 관계 추적 | JOIN 쿼리 분석 | `JOIN`, `LEFT JOIN` 패턴 탐색 |
| 쿼리 패턴 분석 | Mapper XML | SELECT/INSERT/UPDATE/DELETE 통계 |
| DAO-Mapper 매핑 | Java DAO + XML | `@Mapper`, namespace 매칭 |

**⚠️ DO NOT:**
- 실제 DB 연결 로직 구현
- DDL/DML 실행 기능
- DB 스키마 변경 제안

**의존성:** 없음 (독립 생성)

---

### Task 2-2: skill-rules.json에 kiips-db-inspector 룰 추가

**수정 파일:** `.claude/skill-rules.json`

```json
{
  "kiips-db-inspector": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "normal",
    "description": "DB 구조 조회 전용 - MyBatis mapper 분석, 테이블/컬럼 탐색",
    "promptTriggers": {
      "keywords": ["테이블 구조", "컬럼", "DB 구조", "스키마 확인", "mapper 분석", "TB_", "DAO 매핑"],
      "intentPatterns": [
        "(테이블|table|TB_).*?(구조|structure|확인|조회)",
        "(컬럼|column).*?(목록|list|확인|what)",
        "(mapper|매퍼).*?(분석|analyze|확인)",
        "(DB|database|디비).*?(구조|schema|inspect)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["**/mapper/**/*.xml", "**/dao/**/*.java"],
      "contentPatterns": ["resultMap", "namespace", "@Mapper"]
    },
    "readOnlyConstraint": true
  }
}
```

**의존성:** Task 2-1

---

### Task 2-3: kiips-log-reader 스킬 생성 (kiips-log-analyzer 확장)

**생성 파일:**
```
.claude/skills/kiips-log-reader/
├── SKILL.md              # 스킬 정의 (읽기 전용 강조)
└── reference.md          # 로그 포맷 레퍼런스
```

**기존 kiips-log-analyzer와의 차이:**

| 항목 | kiips-log-analyzer (기존) | kiips-log-reader (신규) |
|------|-------------------------|----------------------|
| 목적 | 에러 탐지, 문제 진단 | 구조화된 로그 조회/필터링 |
| 출력 | 분석 리포트 | 구조화된 JSON/테이블 |
| 트리거 | "에러", "분석" | "로그 보기", "검색", "필터" |
| 레이어 | Worker (deployment-manager) | Worker (standalone) |
| 위험도 | 낮음 | 최소 (읽기 전용) |

**핵심 기능:**
1. 시간 범위 기반 로그 필터링
2. 로그 레벨별 분류 (ERROR/WARN/INFO/DEBUG)
3. 서비스별 로그 집계
4. 스택 트레이스 그루핑
5. 로그 패턴 통계 (Top-N 에러)

**의존성:** 없음 (독립 생성, kiips-log-analyzer와 병렬)

---

### Task 2-4: skill-rules.json에 kiips-log-reader 룰 추가

**수정 파일:** `.claude/skill-rules.json`

```json
{
  "kiips-log-reader": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "normal",
    "description": "구조화된 로그 조회/필터링 전용 스킬",
    "promptTriggers": {
      "keywords": ["로그 보기", "로그 검색", "로그 필터", "log search", "log filter", "최근 로그", "오늘 로그"],
      "intentPatterns": [
        "(로그|log).*?(보기|보여|조회|search|filter|읽기|read)",
        "(최근|오늘|어제|recent|today).*?(로그|log)",
        "(서비스|service).*?(로그|log).*?(확인|check)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["**/logs/*.log"]
    },
    "readOnlyConstraint": true
  }
}
```

**의존성:** Task 2-3

---

## Phase 3: ACE Framework 기반 Chain of Skills 파이프라인

### 목표
- Primary Coordinator가 Manager/Worker를 조율하는 자동화 시나리오 구축
- 스킬 체이닝 메커니즘 (Skill A 결과 → Skill B 입력)
- 3개 파이프라인 시나리오 정의

### Task 3-1: Chain of Skills 파이프라인 정의서 작성

**생성 파일:**
```
.claude/skills/chain-of-skills/
├── SKILL.md                    # 파이프라인 오케스트레이션 스킬
├── reference.md                # 파이프라인 상세 가이드
└── pipelines/
    ├── build-deploy-verify.md  # 파이프라인 1: 빌드→배포→검증
    ├── feature-lifecycle.md    # 파이프라인 2: 설계→구현→테스트→리뷰
    └── incident-response.md   # 파이프라인 3: 에러탐지→분석→수정→검증
```

**파이프라인 시나리오:**

#### 파이프라인 1: Build-Deploy-Verify
```
Primary Coordinator
  └─ Build Manager
       ├─ kiips-maven-builder (Worker)     → BUILD_RESULT
       └─ kiips-test-runner (Worker)        → TEST_RESULT
  └─ Deployment Manager (WAIT FOR: BUILD_RESULT.success)
       ├─ kiips-service-deployer (Worker)   → DEPLOY_RESULT
       ├─ kiips-log-reader (Worker)         → LOG_RESULT
       └─ kiips-api-tester (Worker)         → API_RESULT
  └─ Checklist Generator
       └─ 종합 검증 리포트                    → FINAL_REPORT
```

#### 파이프라인 2: Feature Lifecycle
```
Primary Coordinator
  └─ Feature Manager
       ├─ Phase 1: kiips-architect (설계)
       │     └─ legacy-compliance-checker (검증)  → DESIGN_REVIEWED
       ├─ Phase 2: kiips-developer (구현, WAIT FOR: DESIGN_REVIEWED)
       │     └─ kiips-backend-guidelines (가이드)
       ├─ Phase 3: kiips-ui-designer (UI, 병렬 with Phase 2)
       │     └─ kiips-frontend-guidelines (가이드)
       ├─ Phase 4: kiips-test-runner (테스트)      → TEST_PASSED
       └─ Phase 5: code-simplifier (리뷰)          → REVIEW_DONE
```

#### 파이프라인 3: Incident Response
```
Primary Coordinator
  └─ Deployment Manager
       ├─ Step 1: kiips-log-reader (로그 수집)     → ERROR_LOGS
       ├─ Step 2: kiips-log-analyzer (분석)         → ROOT_CAUSE
       ├─ Step 3: kiips-db-inspector (DB 확인)      → DB_STATUS
       └─ Step 4: kiips-api-tester (API 검증)       → API_STATUS
  └─ Feature Manager (IF ROOT_CAUSE requires code fix)
       ├─ kiips-developer (수정)
       └─ kiips-test-runner (회귀 테스트)
```

**의존성:** Phase 1, Phase 2 완료 (legacy-compliance-checker, kiips-db-inspector, kiips-log-reader 사용)

---

### Task 3-2: skill-rules.json에 파이프라인 연결 룰 추가

**수정 파일:** `.claude/skill-rules.json`

```json
{
  "chain-of-skills": {
    "type": "workflow",
    "enforcement": "suggest",
    "priority": "high",
    "description": "ACE Framework 기반 스킬 체이닝 파이프라인 오케스트레이션",
    "promptTriggers": {
      "keywords": ["파이프라인", "pipeline", "워크플로우", "workflow", "자동화", "automation", "체인", "chain"],
      "intentPatterns": [
        "(빌드|build).*?(배포|deploy).*?(검증|verify)",
        "(에러|error|장애).*?(분석|분석|diagnose|investigate)",
        "(기능|feature).*?(설계|design).*?(구현|implement).*?(테스트|test)"
      ]
    },
    "pipelines": {
      "build-deploy-verify": {
        "trigger": "(빌드|build).*(배포|deploy)",
        "stages": ["kiips-maven-builder", "kiips-test-runner", "kiips-service-deployer", "kiips-log-reader", "kiips-api-tester"],
        "manager": "build-manager → deployment-manager"
      },
      "feature-lifecycle": {
        "trigger": "(기능|feature).*(개발|develop|구현|implement)",
        "stages": ["kiips-architect", "legacy-compliance-checker", "kiips-developer", "kiips-ui-designer", "kiips-test-runner", "code-simplifier"],
        "manager": "feature-manager"
      },
      "incident-response": {
        "trigger": "(에러|error|장애|incident).*(분석|analyze|조사|investigate)",
        "stages": ["kiips-log-reader", "kiips-log-analyzer", "kiips-db-inspector", "kiips-api-tester"],
        "manager": "deployment-manager"
      }
    }
  }
}
```

**의존성:** Task 3-1

---

### Task 3-3: ACE Framework ace-framework.md 업데이트

**수정 파일:** `.claude/agents/shared/ace-framework.md`

**추가 섹션:**
```markdown
## Chain of Skills Protocol

### Skill Chaining Mechanism

스킬 간 데이터 전달은 `proposals/` 디렉토리를 통해 이루어집니다:

1. Skill A가 결과를 `proposals/skill-a-result.json`에 저장
2. Primary Coordinator가 결과를 읽고 Skill B에 전달
3. Skill B가 Skill A 결과를 입력으로 사용

### Pipeline Execution Rules

| 규칙 | 설명 |
|------|------|
| Sequential Gate | 이전 단계 성공 시에만 다음 단계 진행 |
| Parallel Branch | 독립 스킬은 병렬 실행 가능 |
| Rollback Trigger | 임계 스킬 실패 시 전체 파이프라인 중단 |
| Checkpoint | 각 단계 완료 시 자동 체크포인트 |
```

**의존성:** Task 3-1

---

### Task 3-4: parallel-coordinator 스킬에 파이프라인 지원 추가

**수정 파일:** `.claude/skills/parallel-coordinator/SKILL.md`

**추가 내용:**
- Chain of Skills 파이프라인 실행 가이드
- 스킬 체이닝 시 순차/병렬 판단 기준
- 파이프라인 실행 상태 추적 (`metadata.json` 확장)

**의존성:** Task 3-1, Task 3-3

---

## 개발 순서 및 의존성 그래프

```
Phase 1 (Context-Aware 가드레일)
═══════════════════════════════
  Task 1-1 ─────────────────→ Task 1-2 ──→ Task 1-3 ──→ Task 1-4
  (스킬 생성)               (룰 추가)   (스키마 확장)  (마이그레이션)
      │                                      │
      │  ┌────── 병렬 그룹 A ─────────────┐   │
      │  │                                │   │
      ▼  ▼                                │   │
Phase 2 (Read-only Data Skills)            │   │
═══════════════════════════════            │   │
  Task 2-1 ──→ Task 2-2                   │   │
  (DB 스킬)   (DB 룰)                     │   │
                                           │   │
  Task 2-3 ──→ Task 2-4      ◄────────────┘   │
  (Log 스킬)  (Log 룰)       병렬 그룹 B       │
                                               │
                              ◄────────────────┘
Phase 3 (Chain of Skills)
═══════════════════════════════
  Task 3-1 ──┬──→ Task 3-2
  (파이프라인) │   (룰 추가)
              │
              ├──→ Task 3-3
              │   (ACE 업데이트)
              │
              └──→ Task 3-4
                  (coordinator 확장)
```

---

## 병렬 실행 가능 Task 식별

### 병렬 그룹 A (Phase 1 + Phase 2 초기)
동시 개발 가능, 파일 충돌 없음:
- **Task 1-1** (`.claude/skills/legacy-compliance-checker/`)
- **Task 2-1** (`.claude/skills/kiips-db-inspector/`)
- **Task 2-3** (`.claude/skills/kiips-log-reader/`)

### 병렬 그룹 B (Phase 2 룰 추가)
Task 1-2 완료 후, 동시 가능 (skill-rules.json 내 다른 키):
- **Task 2-2** (`kiips-db-inspector` 룰)
- **Task 2-4** (`kiips-log-reader` 룰)

### 병렬 그룹 C (Phase 3 후속)
Task 3-1 완료 후:
- **Task 3-2** (skill-rules.json 수정)
- **Task 3-3** (ace-framework.md 수정)
- **Task 3-4** (parallel-coordinator 수정)

### 순차 필수
- Task 1-2 → 1-3 → 1-4 (skill-rules.json 스키마 의존)
- Task 3-1 → 3-2/3-3/3-4 (파이프라인 정의 먼저)

---

## 전체 파일 변경 매트릭스

| 파일 경로 | 작업 | Task |
|-----------|------|------|
| `.claude/skills/legacy-compliance-checker/SKILL.md` | 신규 생성 | 1-1 |
| `.claude/skills/legacy-compliance-checker/reference.md` | 신규 생성 | 1-1 |
| `.claude/skill-rules.json` | 수정 (4회) | 1-2, 1-3, 1-4, 2-2, 2-4, 3-2 |
| `.claude/hooks/userPromptSubmit.js` | 수정 | 1-3 |
| `.claude/skills/kiips-db-inspector/SKILL.md` | 신규 생성 | 2-1 |
| `.claude/skills/kiips-db-inspector/reference.md` | 신규 생성 | 2-1 |
| `.claude/skills/kiips-log-reader/SKILL.md` | 신규 생성 | 2-3 |
| `.claude/skills/kiips-log-reader/reference.md` | 신규 생성 | 2-3 |
| `.claude/skills/chain-of-skills/SKILL.md` | 신규 생성 | 3-1 |
| `.claude/skills/chain-of-skills/reference.md` | 신규 생성 | 3-1 |
| `.claude/skills/chain-of-skills/pipelines/*.md` | 신규 생성 (3개) | 3-1 |
| `.claude/agents/shared/ace-framework.md` | 수정 | 3-3 |
| `.claude/skills/parallel-coordinator/SKILL.md` | 수정 | 3-4 |

**총 파일:** 신규 12개 + 수정 4개 = **16개 파일**

---

## 위험 평가 및 안전장치

### ⚠️ Security Sensitive
- **Task 1-3**: `userPromptSubmit.js` 수정 시 기존 스킬 활성화 로직 회귀 위험
  - **안전장치**: 기존 `shouldActivateSkill()` 함수는 수정하지 않고, `checkBlockRules()` 함수를 별도 추가
  - **검증**: 수정 후 `node userPromptSubmit.js < test-input.json` 테스트

### ⚠️ Breaking Change
- **Task 1-4**: `kiips-database-verification`에 `blockRules` 추가 시 기존 동작 보존 필수
  - **안전장치**: `enforcement: "block"` 기존 동작은 유지, `blockRules`는 추가 검증 레이어
  - **STOP IF**: `blockRules` 추가로 기존 `shouldActivateSkill()` 동작이 변경되는 경우

### skill-rules.json 스키마 보호
- **STOP IF**: JSON 파싱 에러 발생
- **STOP IF**: 기존 25개 엔트리의 `enforcement` 값이 변경되는 경우
- **검증**: `node -e "JSON.parse(require('fs').readFileSync('skill-rules.json'))"` 필수 실행

---

## 예상 소요 시간

| Phase | Task 수 | 예상 시간 | 병렬 시 |
|-------|---------|----------|---------|
| Phase 1 | 4 | 2-3시간 | 1.5시간 |
| Phase 2 | 4 | 2-3시간 | 1.5시간 |
| Phase 3 | 4 | 3-4시간 | 2시간 |
| **합계** | **12** | **7-10시간** | **5시간** |

---

## 실행 권장 순서

```
[Round 1] 병렬 그룹 A - 3개 스킬 동시 생성
  → Task 1-1 + Task 2-1 + Task 2-3

[Round 2] Phase 1 순차 + Phase 2 룰 병렬
  → Task 1-2 → Task 1-3 → Task 1-4
  → Task 2-2 + Task 2-4 (병렬 그룹 B, Round 1 이후)

[Round 3] Phase 3 파이프라인
  → Task 3-1

[Round 4] 병렬 그룹 C
  → Task 3-2 + Task 3-3 + Task 3-4
```

---

## 실행 결과 (2026-03-13)

### Task 완료 상태

| Task | 상태 | 비고 |
|------|------|------|
| 1-1 | ✅ 완료 | `legacy-compliance-checker` SKILL.md + reference.md |
| 1-2 | ✅ 완료 | skill-rules.json에 엔트리 + blockRules 추가 |
| 1-3 | ✅ 완료 | userPromptSubmit.js에 `checkBlockRules()` 추가 |
| 1-4 | ✅ 완료 | `kiips-database-verification`에 blockRules 배열 추가 |
| 2-1 | ✅ 완료 | `kiips-db-inspector` SKILL.md + reference.md |
| 2-2 | ✅ 완료 | skill-rules.json에 엔트리 추가 (readOnlyConstraint) |
| 2-3 | ✅ 완료 | `kiips-log-reader` SKILL.md + reference.md |
| 2-4 | ✅ 완료 | skill-rules.json에 엔트리 추가 (readOnlyConstraint) |
| 3-1 | ✅ 완료 | `chain-of-skills` SKILL.md + reference.md + 3 pipelines |
| 3-2 | ✅ 완료 | skill-rules.json에 chain-of-skills 엔트리 추가 |
| 3-3 | ✅ 완료 | ace-framework.md v5.0.0-KiiPS (Chain of Skills Protocol 추가) |
| 3-4 | ✅ 완료 | parallel-coordinator에 Pipeline Support 섹션 추가 |

### 부수 수정

- `ethicalValidator.js` regex 버그 수정: `/--force\s+push.*main|master/i` → `/--force\s+push.*(main|master)/i`
  - 원인: OR 연산자 우선순위 버그로 "master" 단독 매칭 → TB_FUND_MASTER 같은 테이블명에서 오탐

### 최종 검증

- skill-rules.json: 33 엔트리, JSON 유효, enforcement 분포 require:18/suggest:13/block:2
- userPromptSubmit.js: exit code 0, 구문 에러 없음
- 신규 파일 14개 전체 생성 확인
