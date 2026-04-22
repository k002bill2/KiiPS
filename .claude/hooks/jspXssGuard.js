/**
 * JSP XSS Guard Hook
 *
 * PreToolUse 이벤트에서 .jsp 파일의 XSS 위험 패턴을 사전 차단:
 * 1. `<%= request.getParameter(...) %>` - 사용자 입력 직접 출력
 * 2. `<%= request.getAttribute(...) %>` - 검증되지 않은 속성 출력
 * 3. `<%= session.getAttribute(...) %>` - 세션 데이터 직접 출력
 * 4. `${param.xxx}` - JSTL 직접 출력 (c:out 또는 escapeXml 미적용)
 *
 * mybatisBindingGuard.js 와 동일한 인터페이스 (PreToolUse, exit 2 = block)
 *
 * @version 1.0.0-KiiPS
 */

/**
 * 안전 마커: 파일에 다음 중 하나가 있으면 해당 줄은 통과 가능
 * - <c:out value="${...}"/>
 * - <c:out value="${...}" escapeXml="true"/>
 * - fn:escapeXml(...)
 */
function isSafeLine(line) {
  return (
    /<c:out\s+value=/.test(line) ||
    /fn:escapeXml\s*\(/.test(line) ||
    /escapeXml\s*=\s*["']true["']/.test(line)
  );
}

/**
 * JSP 콘텐츠에서 XSS 위험 패턴을 검사합니다.
 *
 * @param {string} filePath
 * @param {string} content
 * @returns {{ violations: Array<{ pattern: string, line: string, lineNo: number }> }}
 */
function checkXssPatterns(filePath, content) {
  const violations = [];
  const lines = content.split("\n");

  // 패턴 1-3: <%= ... %> scriptlet output of user input
  const scriptletPattern =
    /<%=\s*(?:request\.getParameter|request\.getAttribute|session\.getAttribute|cookie\s*\[|param\.)[^%]+%>/i;

  // 패턴 4: ${param.xxx} 또는 ${requestScope.xxx} 인라인 출력
  const elPattern = /\$\{\s*(?:param|requestScope|sessionScope|cookie)\./;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 주석 라인은 건너뜀
    if (/^\s*<%--/.test(line) || /^\s*\/\//.test(line)) continue;

    if (scriptletPattern.test(line)) {
      violations.push({
        pattern: "scriptlet-direct-output",
        line: line.trim(),
        lineNo: i + 1,
      });
      continue;
    }

    if (elPattern.test(line) && !isSafeLine(line)) {
      // <input value="${param.x}"> 같이 attribute 컨텍스트도 위험
      violations.push({
        pattern: "el-direct-output",
        line: line.trim(),
        lineNo: i + 1,
      });
    }
  }

  return { violations };
}

/**
 * PreToolUse Hook Entry Point
 */
function onPreToolUse(event) {
  const { tool_name, tool_input } = event;

  if (!["edit", "write"].includes((tool_name || "").toLowerCase())) {
    return { decision: "allow" };
  }

  const filePath = tool_input.file_path || "";
  if (!filePath.endsWith(".jsp") && !filePath.endsWith(".jspf")) {
    return { decision: "allow" };
  }

  const content =
    (tool_name || "").toLowerCase() === "write"
      ? tool_input.content || ""
      : tool_input.new_string || "";

  if (!content) return { decision: "allow" };

  const { violations } = checkXssPatterns(filePath, content);
  if (violations.length === 0) return { decision: "allow" };

  const lines = violations
    .map((v) => `  L${v.lineNo} [${v.pattern}]: ${v.line}`)
    .join("\n");

  const message =
    `━━━ JSP XSS GUARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `File: ${filePath}\n\n` +
    `Unescaped user input detected (XSS risk):\n` +
    `${lines}\n\n` +
    `Fix options:\n` +
    `  1. <c:out value="\${...}"/>            (JSTL, recommended)\n` +
    `  2. \${fn:escapeXml(value)}             (function-based)\n` +
    `  3. <%= StringEscapeUtils.escapeHtml4(...) %>  (Apache Commons)\n\n` +
    `Reference: .claude/rules/validation.md (Boundary Validation)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return { decision: "block", message };
}

// ─── CLI Entry Point (mybatisBindingGuard.js 패턴 그대로) ─────
if (require.main === module) {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => {
    try {
      const input = chunks.join("");
      if (!input.trim()) process.exit(0);
      const event = JSON.parse(input);
      const result = onPreToolUse(event);
      if (result.decision === "block") {
        if (result.message) process.stderr.write(result.message);
        process.exit(2);
      }
      process.exit(0);
    } catch (e) {
      process.stderr.write(
        `[JspXssGuard] Parse error - allowing: ${e.message}\n`,
      );
      process.exit(0);
    }
  });
  const safetyTimer = setTimeout(() => {
    process.stderr.write("[JspXssGuard] stdin timeout - allowing\n");
    process.exit(0);
  }, 5_000);
  process.stdin.on("end", () => clearTimeout(safetyTimer));
  process.stdin.resume();
}

module.exports = {
  onPreToolUse,
  checkXssPatterns,
  isSafeLine,
};
