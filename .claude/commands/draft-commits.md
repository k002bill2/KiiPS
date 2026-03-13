---
description: SVN/Git 변경사항 분석 및 Conventional Commits 형식 커밋 초안 생성
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(svn status:*), Bash(svn diff:*)
argument-hint: [--staged | --all | --svn]
---

# Draft Commits - 변경사항 분석

변경사항을 분석하여 Conventional Commits 형식으로 커밋 초안을 생성합니다.

## 실행 단계

### 1. 변경사항 수집

```bash
# SVN 모드 (KiiPS 기본)
svn status
svn diff --summarize

# Git 모드 (보조)
git status --porcelain
git diff --cached --stat
git diff --stat
git log --oneline -5
```

### 2. 파일 그룹화 규칙 (KiiPS)

| 경로 패턴 | 그룹명 | 기본 Type |
|----------|--------|-----------|
| `.claude/hooks/` | Claude Hooks | chore(hooks) |
| `.claude/skills/` | Claude Skills | docs(skills) |
| `.claude/commands/` | Claude Commands | docs(commands) |
| `.claude/agents/` | Claude Agents | docs(agents) |
| `.claude/*.json` | Claude Config | chore(config) |
| `KiiPS-FD/` | Fund Module | feat(fd) |
| `KiiPS-IL/` | Investment Ledger | feat(il) |
| `KiiPS-AC/` | Accounting | feat(ac) |
| `KiiPS-SY/` | System | feat(sy) |
| `KiiPS-LP/` | LP Management | feat(lp) |
| `KiiPS-EL/` | Electronic Ledger | feat(el) |
| `KiiPS-COMMON/` | Common Service | feat(common) |
| `KiiPS-UTILS/` | Utilities | feat(utils) |
| `KiiPS-UI/` | Web Interface | feat(ui) |
| `KIIPS-APIGateway/` | API Gateway | feat(gateway) |
| `**/resources/static/css/sass/` | SCSS Styles | style(scss) |
| `**/webapp/WEB-INF/jsp/` | JSP Views | feat(view) |
| `**/mapper/*.xml` | MyBatis Mapper | feat(mapper) |

### 3. Commit Type 결정

- **feat**: 새 기능 추가
- **fix**: 버그 수정
- **refactor**: 리팩토링
- **docs**: 문서 변경
- **test**: 테스트 추가/수정
- **chore**: 설정, 빌드, 의존성 변경
- **style**: SCSS/CSS 스타일 변경

### 4. 출력 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMIT DRAFT SUMMARY (KiiPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overview
│ Total: N files │ Modified: N │ Added: N │ Deleted: N │

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[그룹명] (N files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Suggested Commit:
  │ type(scope): 간결한 변경 설명 │

  Files:
  ├── file1.ext    [M]
  └── file2.ext    [A]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SVN commit:
  │ svn commit -m "type(scope): 설명" │

  Git commit (.claude/ 설정):
  │ git add && git commit │

  SVN commit (소스 코드):
  │ IntelliJ에서 수동 커밋 │

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 연계 명령어

- `/review` - 변경사항 코드 리뷰
- `/verify` - 커밋 전 검증

$ARGUMENTS
