# Claude Code Quick Reference
#claude-code #reference #cheatsheet

## 🚀 빠른 시작 체크리스트

### 설치 (macOS)
```bash
# 1. Node.js 설치 확인 (v18+)
node --version

# 2. Claude Code CLI 설치
npm install -g @anthropic-ai/claude-code

# 3. 버전 확인 (현재 최신: v2.0.76)
claude --version

# 4. 로그인
claude
/login
```

### 프로젝트 초기 설정
```bash
# 1. 프로젝트 디렉토리 생성
mkdir my-project && cd my-project

# 2. 필수 디렉토리 구조 생성
mkdir -p .claude/skills .claude/agents .claude/commands

# 3. CLAUDE.md 생성 (가장 중요!)
touch CLAUDE.md

# 4. 설정 파일 생성
touch .claudecode.json .mcp.json

# 5. Git 초기화
git init
echo ".env" >> .gitignore
```

## 📁 필수 파일 구조

```
my-project/
├── CLAUDE.md                    # ⭐ 프로젝트 가이드 (필수)
├── .claudecode.json             # 권한 & Hooks 설정
├── .mcp.json                    # MCP 서버 설정
├── .claude/
│   ├── skills/                  # Agent Skills
│   │   └── [skill-name]/
│   │       └── SKILL.md
│   ├── agents/                  # Sub-agents
│   │   └── [agent-name].md
│   └── commands/                # 커스텀 명령어
│       └── [command].md
└── PRD.md                       # 프로젝트 요구사항
```

## 🎮 주요 명령어

### 기본 명령어
| 명령어 | 설명 | 사용 예시 |
|--------|------|-----------|
| **`double-esc`** | 이전 프롬프트 분기 | 다른 결과 시도 |
| **Planning Mode** | 계획 모드 시작 | 모든 작업 전 필수! |
| `/clear` | 컨텍스트 초기화 | 새 작업 시작 전 |
| `/agents` | Sub-agents 관리 | agent 생성/수정 |
| `/model` | 모델 변경 | sonnet/opus/haiku |
| `/help` | 도움말 | 명령어 목록 확인 |
| `/bug` | 버그 리포트 | 문제 발생 시 |

### 고급 명령어
| 명령어 | 설명 | 사용 예시 |
|--------|------|-----------|
| `/statusline` | 상태 표시줄 설정 | 토큰/비용 표시 |
| `/hooks` | Hooks 설정 | 자동화 설정 |
| `/permissions` | 권한 관리 | 도구 권한 설정 |
| `/rewind` | 이전 상태로 복원 | 실수 되돌리기 |
| `Ctrl+B` | 백그라운드 실행 | dev server 실행 |
| `Ctrl+R` | Transcript 모드 | 대화 기록 모드 |

## 🔥 실전 핵심 워크플로우

### 1. Planning Mode (필수!)
```bash
# 계획 없이 시작 = 실패
"I need to implement [feature]. Let's start with planning mode."

# Strategic planner 사용
"@strategic-plan-architect Create a plan for [feature]"
```

### 2. Dev Docs 시스템
```bash
# 대규모 작업시 필수
mkdir -p dev/active/[task-name]/
# plan.md, context.md, tasks.md 생성
/dev-docs  # Custom command
```

### 3. Skills 강제 활성화
```bash
# skill-rules.json 생성
# UserPromptSubmit Hook 설정  
# Stop Event Hook 추가
# Claude가 Skills 무시 못함!
```

### 4. PM2 백엔드 관리
```bash
pnpm pm2:start      # 모든 서비스 시작
pm2 logs [service]  # Claude가 직접 로그 확인
pm2 restart [service]  # 문제 해결
```

## 🌟 Agent Skills 빠른 생성

### 방법 1: skill-creator 사용 (권장)
```bash
"Use the skill-creator skill to create a skill for [task]"
```

### 방법 2: 수동 생성
```bash
# 1. 디렉토리 생성
mkdir -p .claude/skills/my-skill

# 2. SKILL.md 생성
cat > .claude/skills/my-skill/SKILL.md << EOF
---
name: my-skill
description: What this skill does and when to use it
---

# My Skill

## Instructions
1. Step one
2. Step two
3. Step three

## Examples
Example usage here
EOF

# 3. Claude 재시작
```

## 🤖 Sub-agent 빠른 생성

### 인터랙티브 생성
```bash
/agents
# 메뉴에서 선택:
# 1. Create new agent
# 2. Project-specific
# 3. Define purpose
# 4. Select tools
# 5. Choose color
```

### 수동 생성
```markdown
# .claude/agents/specialist.md
---
name: specialist
description: Specializes in specific tasks
tools: edit, create, analyze
model: sonnet
---

You are a specialist in...
```

## ⚙️ Hooks 예시

### .claudecode.json
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.py)",
        "hooks": [{
          "type": "command",
          "command": "black \"$file\""
        }]
      }
    ]
  }
}
```

## 🔒 권한 설정

### .claudecode.json
```json
{
  "permissions": {
    "allowedTools": [
      "Read",
      "Write(src/**)",
      "Bash(npm *)",
      "Bash(git *)"
    ],
    "deny": [
      "Read(.env*)",
      "Bash(sudo *)",
      "Bash(rm -rf *)"
    ]
  }
}
```

## 💡 실전 Pro Tips (6개월 경험)

### "Ask not what Claude can do for you, ask what context you can give to Claude"

### 핵심 교훈
1. **Planning 없이 시작 = 망함**
2. **Skills 만들기만 하면 안 씀 → Hook 필수**
3. **Dev Docs = Claude의 기억**
4. **때로는 인간이 2분에 할 일 Claude가 30분 → 개입하라**
5. **Re-prompt often** - double-esc로 다시 시도

## 💡 프로 팁

### 효율성 극대화
1. **매일 시작**: `/clear`로 깨끗한 컨텍스트
2. **작업 분할**: 큰 작업은 여러 agents로
3. **Skill 재사용**: 자주 쓰는 작업은 Skill로
4. **백그라운드**: `Ctrl+B`로 서버 실행
5. **Git 통합**: Skills/Agents를 버전 관리

### 문제 해결
| 증상 | 해결 |
|------|------|
| Skill 미작동 | **Hook 시스템 확인**, skill-rules.json 점검 |
| Agent 미호출 | description 구체화 |
| 권한 오류 | .claudecode.json 확인 |
| 컨텍스트 오버 | `/clear` 사용 |
| 느린 응답 | 모델을 haiku로 변경 |

## 📊 모델 선택 가이드 (2025.12 기준)

| 모델 | 모델 ID | 용도 | 속도 | 비용 | 출시일 |
|------|---------|------|------|------|--------|
| **Haiku 4.5** | claude-haiku-4-5-20251015 | 간단한 작업, 빠른 반복 | 🚀🚀🚀 | 💰 | 2025.10 |
| **Sonnet 4.5** | claude-sonnet-4-5-20250929 | 일반 개발, 코딩, 에이전트 | 🚀🚀 | 💰💰 | 2025.09 |
| **Opus 4.5** | claude-opus-4-5-20251101 | 복잡한 추론, 엔터프라이즈 | 🚀 | 💰💰💰 | **2025.11** |

## 🔗 필수 링크

- [공식 문서](https://docs.claude.com/en/docs/claude-code)
- [Skills 문서](https://docs.claude.com/en/docs/claude-code/skills)
- [Sub-agents 가이드](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [커뮤니티](https://discord.gg/anthropic)

---

*빠른 참조를 위한 체크리스트. 마지막 업데이트: 2025-12-28*
*환경: macOS (Antigravity 호환), KiiPS 프로젝트 특화*

#quick-reference #cheatsheet #claude-code #kiips