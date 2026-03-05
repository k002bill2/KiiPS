# Agent Teams (에이전트 팀)

> 실험적 기능: 여러 Claude Code 인스턴스를 팀으로 조율합니다.

## 활성화

`settings.local.json`에 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` 설정 완료.

## 표시 모드

- **In-process** (기본): 메인 터미널 내 실행, Shift+Up/Down으로 팀원 선택
- **분할 창**: `claude --teammate-mode tmux` (tmux 3.6a 설치됨)

## KiiPS 팀 구성 패턴

### 1. 기능 개발 팀 (Feature Development)

```
Create an agent team for developing the [기능명] feature:
- Frontend teammate: JSP/jQuery/RealGrid UI 구현 (KiiPS-UI)
- Backend teammate: Spring Controller/Service/DAO 구현 (KiiPS-FD 등)
- Test teammate: JUnit 테스트 작성 및 검증
Require plan approval before making changes.
Use Sonnet for each teammate.
```

### 2. 코드 리뷰 팀 (Code Review)

```
Create an agent team to review recent changes:
- Security reviewer: SQL Injection, XSS, 인증/인가 검증
- Performance reviewer: N+1 쿼리, 캐시, 인덱스 확인
- Quality reviewer: 코딩 컨벤션, CLAUDE.md 규칙 준수 확인
Have them each review and report findings.
```

### 3. 버그 조사 팀 (Bug Investigation)

```
[에러 설명] 현상이 발생합니다.
Spawn 3 agent teammates to investigate different hypotheses:
- DB/쿼리 문제 가설 조사
- Spring Service 로직 문제 가설 조사
- 프론트엔드 요청 데이터 문제 가설 조사
Have them talk to each other to disprove theories.
```

### 4. 다크테마 적용 팀 (Dark Theme)

```
Create an agent team for dark theme on [페이지명]:
- SCSS specialist: [data-theme=dark] 스타일 작성 (색상만, 레이아웃 변경 금지)
- Validator: 라이트/다크 전환 시 깨지는 요소 검증
- A11y checker: WCAG 2.1 AA 대비 비율 검증
```

### 5. 모듈 리팩토링 팀 (Cross-Module Refactoring)

```
Create an agent team with 4 teammates to refactor [대상]:
- Each teammate owns a separate module (KiiPS-FD, KiiPS-IL, KiiPS-AC, KiiPS-SY)
- Ensure backward-compatible API changes
- Require plan approval before making changes.
Wait for your teammates to complete their tasks before proceeding.
```

## 팀 운영 규칙

| 규칙 | 설명 |
|------|------|
| **파일 소유권 분리** | 팀원 간 동일 파일 편집 금지 (덮어쓰기 방지) |
| **위임 모드** | 리더가 직접 코딩하지 않게 하려면 Shift+Tab으로 위임 모드 |
| **계획 승인** | 위험한 작업은 `Require plan approval` 사용 |
| **팀원당 5-6 작업** | 적절한 작업 분배로 병렬성 극대화 |
| **정리** | 완료 후 반드시 `Clean up the team` 실행 |

## 팀 제어 명령

```
# 팀원과 직접 대화 (In-process 모드)
Shift+Up/Down    → 팀원 선택
Enter            → 팀원 세션 보기
Escape           → 현재 턴 중단
Ctrl+T           → 작업 목록 전환

# 팀 관리
Ask the [name] teammate to shut down    → 팀원 종료
Clean up the team                        → 팀 정리
Wait for your teammates to complete      → 리더 대기
```

## 사용하지 말아야 할 경우

- 단일 파일 수정, 간단한 버그 수정 → 기본 세션 사용
- 순차적 종속성이 많은 작업 → subagent(Task 도구) 사용
- 동일 파일 동시 편집 필요 → 단일 세션 사용
