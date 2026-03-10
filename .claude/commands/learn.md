# /learn — 교훈 기록 + 자동화 제안

세션에서 발견한 교훈을 기록하고, 반복 패턴을 자동화로 전환합니다.

## 사용법

```
/learn "MyBatis에서 LIKE 검색 시 #{} 안에 CONCAT 사용해야 함"
/learn --from-error          # 최근 에러에서 패턴 추출
/learn --from-session        # 현재 세션에서 패턴 추출
/learn --suggest             # SVN 로그 기반 자동화 제안
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
```bash
# SVN 히스토리에서 반복 패턴 식별
svn log -l 50 --verbose | head -200
```
반복 커밋 패턴 → 자동화 제안 (커맨드/스킬/훅)

### 2단계: 패턴 분류

추출된 교훈을 KiiPS 도메인으로 태깅:

| 분류 | KiiPS 도메인 |
|------|-------------|
| `mybatis-pattern` | MyBatis #{}/동적SQL/mapper 패턴 |
| `realgrid-pattern` | RealGrid 설정/이벤트/Excel 패턴 |
| `build-pattern` | Maven 빌드/의존성/순서 패턴 |
| `security-pattern` | XSS/CSRF/인증/인가 패턴 |
| `jsp-pattern` | JSP/Include/JSTL 패턴 |
| `scss-pattern` | SCSS/다크테마/변수 패턴 |
| `error-pattern` | 반복 에러/디버깅 패턴 |
| `workflow-pattern` | 워크플로우/자동화 기회 |
| `api-pattern` | REST API/Gateway 패턴 |

### 3단계: Instinct 생성

교훈을 atomic instinct로 변환하여 저장:

```yaml
---
id: mybatis-like-concat
trigger: "MyBatis LIKE 검색 쿼리 작성 시"
confidence: 0.7
domain: "mybatis-pattern"
source: "direct-input"
created: "2026-03-10"
updated: "2026-03-10"
observations: 1
---

# MyBatis LIKE 검색 시 CONCAT 사용

## Action
LIKE 검색 시 `#{value}` 안에 직접 `%`를 넣지 말고, `CONCAT('%', #{value}, '%')` 사용.

## Evidence
- 직접 입력: "MyBatis에서 LIKE 검색 시 #{} 안에 CONCAT 사용해야 함"
```

저장 경로: `.claude/learning/instincts/personal/{id}.md`

### 4단계: observations.jsonl 기록

```json
{"timestamp":"2026-03-10T12:00:00Z","type":"learn","source":"direct","domain":"mybatis-pattern","instinct_id":"mybatis-like-concat","summary":"LIKE 검색 CONCAT 패턴"}
```

저장 경로: `.claude/learning/observations.jsonl`

### 5단계: 메모리 연동

교훈 도메인에 따라 관련 메모리 파일에도 기록:

| 도메인 | 메모리 파일 |
|--------|-----------|
| mybatis-pattern | `.claude/memory/mybatis-patterns.md` |
| realgrid-pattern | `.claude/memory/realgrid-patterns.md` |
| build-pattern | `.claude/memory/build-patterns.md` |
| security-pattern | `.claude/memory/security-patterns.md` |
| error-pattern | `.claude/memory/error-resolutions.md` |
| 기타 | `.claude/memory/common-patterns.md` |

### 6단계: 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Learn — KiiPS 연속 학습 시스템
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  모드: {직접입력 / from-error / from-session / suggest}
  도메인: {mybatis-pattern / realgrid-pattern / ...}
  신뢰도: {0.3~0.9}

  기록된 교훈:
    {교훈 요약}

  Instinct 저장: .claude/learning/instincts/personal/{id}.md
  메모리 업데이트: .claude/memory/{domain}.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
