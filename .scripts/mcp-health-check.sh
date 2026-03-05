#!/bin/bash
#
# MCP Configuration Check Script
# .mcp.json 파일의 설정을 검증합니다.
#
# Note: mcp-cli는 Claude Code 내부에서만 사용 가능합니다.
#       이 스크립트는 설정 파일의 유효성만 확인합니다.
#
# Usage: bash .scripts/mcp-health-check.sh
#

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 MCP Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0;m' # No Color

MCP_CONFIG="/Users/younghwankang/WORK/WORKSPACE/KiiPS/.mcp.json"

# 1. .mcp.json 파일 존재 확인
echo "1️⃣  Checking .mcp.json file..."
if [ -f "$MCP_CONFIG" ]; then
    echo -e "${GREEN}✅ .mcp.json found${NC}"
else
    echo -e "${RED}❌ .mcp.json not found at: $MCP_CONFIG${NC}"
    exit 1
fi
echo ""

# 2. JSON 유효성 검사
echo "2️⃣  Validating JSON syntax..."
if command -v jq &> /dev/null; then
    if jq empty "$MCP_CONFIG" 2>/dev/null; then
        echo -e "${GREEN}✅ Valid JSON format${NC}"
    else
        echo -e "${RED}❌ Invalid JSON syntax${NC}"
        exit 1
    fi
else
    if python3 -c "import json; json.load(open('$MCP_CONFIG'))" 2>/dev/null; then
        echo -e "${GREEN}✅ Valid JSON format${NC}"
    else
        echo -e "${RED}❌ Invalid JSON syntax${NC}"
        exit 1
    fi
fi
echo ""

# 3. MCP 서버 설정 확인
echo "3️⃣  Checking MCP server configurations..."
echo ""

# filesystem 서버 확인
echo "   📁 filesystem server:"
if grep -q '"filesystem"' "$MCP_CONFIG" && grep -q '"disabled": false' "$MCP_CONFIG"; then
    echo -e "   ${GREEN}✅ filesystem server configured and enabled${NC}"
    echo "      Command: npx @modelcontextprotocol/server-filesystem"
else
    echo -e "   ${YELLOW}⚠️  filesystem server not found or disabled${NC}"
fi
echo ""

# serena 서버 확인
echo "   🧠 serena server:"
if grep -A 5 '"serena"' "$MCP_CONFIG" | grep -q '"disabled": false'; then
    echo -e "   ${GREEN}✅ serena server configured and enabled${NC}"
    echo "      Command: uvx serena start-mcp-server"
else
    echo -e "   ${YELLOW}⚠️  serena server disabled or not configured${NC}"
fi
echo ""

# context7 서버 확인
echo "   📚 context7 server:"
if grep -q '"context7"' "$MCP_CONFIG"; then
    if grep -A 3 '"context7"' "$MCP_CONFIG" | grep -q '"disabled": true'; then
        echo -e "   ${YELLOW}⚠️  context7 server is disabled${NC}"
    else
        echo -e "   ${GREEN}✅ context7 server configured and enabled${NC}"
    fi
else
    echo -e "   ${RED}❌ context7 server not found${NC}"
fi
echo ""

# playwright 서버 확인
echo "   🎭 playwright server:"
if grep -q '"playwright"' "$MCP_CONFIG"; then
    if grep -A 3 '"playwright"' "$MCP_CONFIG" | grep -q '"disabled": true'; then
        echo -e "   ${YELLOW}⚠️  playwright server is disabled${NC}"
    else
        echo -e "   ${GREEN}✅ playwright server configured and enabled${NC}"
    fi
else
    echo -e "   ${RED}❌ playwright server not found${NC}"
fi
echo ""

# 4. 필수 도구 확인
echo "4️⃣  Checking required tools..."
echo ""

# Node.js/npm 확인
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "   ${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "   ${RED}❌ Node.js not installed${NC}"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "   ${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "   ${RED}❌ npm not installed${NC}"
fi

# Python/uvx 확인 (serena용)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "   ${GREEN}✅ Python: $PYTHON_VERSION${NC}"
else
    echo -e "   ${YELLOW}⚠️  Python3 not found (required for serena)${NC}"
fi

if command -v uvx &> /dev/null; then
    echo -e "   ${GREEN}✅ uvx installed${NC}"
else
    echo -e "   ${YELLOW}⚠️  uvx not found (required for serena)${NC}"
fi
echo ""

# 5. 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Configured MCP servers:"
echo "   - filesystem: 로그 파일 모니터링 및 파일 시스템 접근"
echo "   - serena: 코드 분석 및 심볼 검색"
echo "   - context7: 라이브러리 문서 검색"
echo "   - playwright: 브라우저 자동화"
echo ""
echo "💡 Next steps:"
echo "   1. Restart Claude Code CLI to load new MCP servers"
echo "   2. MCP servers will start automatically on next session"
echo "   3. Test MCP integration from within Claude Code:"
echo "      • Ask Claude: 'List available MCP servers'"
echo "      • Ask Claude: 'Read .mcp.json using filesystem MCP'"
echo ""
echo "📖 Reference:"
echo "   • MCP 명령어는 Claude Code 내부에서만 사용 가능"
echo "   • 일반 터미널에서는 mcp-cli 사용 불가"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
