#!/bin/bash

# Skills 자동 활성화 시스템 검증 스크립트
# 2025-12-30 생성

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Skills 자동 활성화 시스템 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. skill-rules.json 확인
echo "1️⃣  skill-rules.json 확인..."
if [ -f "skill-rules.json" ]; then
    echo -e "${GREEN}✓${NC} skill-rules.json 존재"

    # JSON 유효성 검사
    if node -e "JSON.parse(require('fs').readFileSync('skill-rules.json', 'utf-8'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} JSON 형식 유효"

        # 규칙 수 확인
        RULE_COUNT=$(node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('skill-rules.json', 'utf-8'))).length)")
        echo -e "${GREEN}✓${NC} $RULE_COUNT개의 규칙 정의됨"
    else
        echo -e "${RED}✗${NC} JSON 형식 오류"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} skill-rules.json 없음"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Hooks 파일 확인
echo "2️⃣  Hooks 파일 확인..."

if [ -f ".claude/hooks/userPromptSubmit.js" ]; then
    echo -e "${GREEN}✓${NC} userPromptSubmit.js 존재"

    # 문법 검사
    if node -c .claude/hooks/userPromptSubmit.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} userPromptSubmit.js 문법 유효"
    else
        echo -e "${RED}✗${NC} userPromptSubmit.js 문법 오류"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} userPromptSubmit.js 없음"
    ERRORS=$((ERRORS + 1))
fi

if [ -f ".claude/hooks/stopEvent.js" ]; then
    echo -e "${GREEN}✓${NC} stopEvent.js 존재"

    # 문법 검사
    if node -c .claude/hooks/stopEvent.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} stopEvent.js 문법 유효"
    else
        echo -e "${RED}✗${NC} stopEvent.js 문법 오류"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} stopEvent.js 없음"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. .claudecode.json 설정 확인
echo "3️⃣  .claudecode.json 설정 확인..."

if [ -f ".claudecode.json" ]; then
    echo -e "${GREEN}✓${NC} .claudecode.json 존재"

    # UserPromptSubmit Hook 설정 확인
    if grep -q "userPromptSubmit.js" .claudecode.json; then
        echo -e "${GREEN}✓${NC} UserPromptSubmit Hook 설정됨"
    else
        echo -e "${YELLOW}⚠${NC} UserPromptSubmit Hook 미설정"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Stop Hook 설정 확인
    if grep -q "stopEvent.js" .claudecode.json; then
        echo -e "${GREEN}✓${NC} Stop Event Hook 설정됨"
    else
        echo -e "${YELLOW}⚠${NC} Stop Event Hook 미설정"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} .claudecode.json 없음"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Skills 디렉토리 확인
echo "4️⃣  Skills 디렉토리 확인..."

if [ -d ".claude/skills" ]; then
    SKILL_COUNT=$(find .claude/skills -name "SKILL.md" | wc -l | tr -d ' ')
    echo -e "${GREEN}✓${NC} .claude/skills 디렉토리 존재 ($SKILL_COUNT개 Skill)"

    # 주요 Skills 확인
    REQUIRED_SKILLS=("kiips-maven-builder" "kiips-service-deployer" "kiips-api-tester" "kiips-log-analyzer" "kiips-feature-planner")

    for skill in "${REQUIRED_SKILLS[@]}"; do
        if [ -f ".claude/skills/$skill/SKILL.md" ]; then
            echo -e "${GREEN}  ✓${NC} $skill"
        else
            echo -e "${YELLOW}  ⚠${NC} $skill (권장)"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} .claude/skills 디렉토리 없음"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 5. Node.js 버전 확인
echo "5️⃣  Node.js 환경 확인..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js 설치됨 ($NODE_VERSION)"

    # 버전 확인 (v16 이상 권장)
    MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 16 ]; then
        echo -e "${GREEN}✓${NC} Node.js 버전 적합 (v16 이상)"
    else
        echo -e "${YELLOW}⚠${NC} Node.js v16 이상 권장 (현재: $NODE_VERSION)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js 미설치"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 6. 권한 확인
echo "6️⃣  파일 권한 확인..."

if [ -x ".claude/hooks/userPromptSubmit.js" ]; then
    echo -e "${GREEN}✓${NC} userPromptSubmit.js 실행 가능"
else
    echo -e "${YELLOW}⚠${NC} userPromptSubmit.js 실행 권한 없음 (정상)"
fi

if [ -x ".claude/hooks/stopEvent.js" ]; then
    echo -e "${GREEN}✓${NC} stopEvent.js 실행 가능"
else
    echo -e "${YELLOW}⚠${NC} stopEvent.js 실행 권한 없음 (정상)"
fi
echo ""

# 최종 결과
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 검증 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 완벽! 모든 검사 통과${NC}"
    echo ""
    echo "🎉 Skills 자동 활성화 시스템이 정상적으로 구성되었습니다!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  경고 ${WARNINGS}개${NC}"
    echo ""
    echo "⚠️  일부 권장 사항이 누락되었지만, 시스템은 작동합니다."
    exit 0
else
    echo -e "${RED}❌ 오류 ${ERRORS}개, 경고 ${WARNINGS}개${NC}"
    echo ""
    echo "❌ 오류를 수정해야 시스템이 정상 작동합니다."
    echo ""
    echo "해결 방법:"
    echo "1. skill-rules.json 생성 및 유효성 검사"
    echo "2. .claude/hooks/ 디렉토리에 Hook 파일 배치"
    echo "3. .claudecode.json에 Hook 설정 추가"
    echo "4. Node.js v16 이상 설치"
    echo ""
    echo "자세한 내용: SKILLS-AUTO-ACTIVATION-GUIDE.md"
    exit 1
fi
