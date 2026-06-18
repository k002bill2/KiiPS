/**
 * MyBatis Binding Guard Hook
 * PreToolUse 이벤트에서 실행되어 XML 파일의 위험한 ${} 바인딩(SQL Injection 위험)을
 * 사전 차단합니다. MyBatis에서는 #{} 만 안전합니다.
 *
 * @version 1.0.0-KiiPS
 */

/**
 * 화이트리스트: ${} 사용이 허용된 파라미터명
 * (동적 테이블명, ORDER BY, 컬럼 선택 등 불가피한 동적 SQL 용도)
 */
const WHITELIST = [
  "tableName",
  "TABLE_NAME",
  "tblName",
  "orderBy",
  "ORDER_BY",
  "ORDER_COLUMN",
  "sortColumn",
  "SORT_COLUMN",
  "sortOrder",
  "SORT_ORDER",
  "columns",
  "COLUMNS",
  "schemaName",
  "SCHEMA_NAME",
  "direction",
  "DIR",
  "prefix",
  "suffix",
];

/**
 * XML 콘텐츠에서 위험한 ${} 바인딩을 검사합니다.
 *
 * @param {string} filePath - 대상 파일 경로
 * @param {string} content - 검사할 XML 콘텐츠
 * @returns {{ dangerous: string[] }} 위험한 바인딩 목록
 */
function checkDangerousBindings(filePath, content) {
  const dangerous = [];
  const pattern = /\$\{([^}]+)\}/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const paramName = match[1].trim();
    if (!WHITELIST.includes(paramName)) {
      // 해당 바인딩이 포함된 줄 추출
      const lineStart = content.lastIndexOf("\n", match.index) + 1;
      const lineEnd = content.indexOf("\n", match.index);
      const line = content
        .slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
        .trim();
      dangerous.push(line);
    }
  }

  return { dangerous };
}

/**
 * PreToolUse Hook Entry Point
 *
 * @param {object} event - Hook 이벤트 객체 { tool_name, tool_input }
 * @returns {object} { decision: 'allow'|'block', message?: string }
 */
function onPreToolUse(event) {
  const { tool_name, tool_input } = event;

  // Edit / Write 만 검사
  if (!["edit", "write"].includes(tool_name.toLowerCase())) {
    return { decision: "allow" };
  }

  const filePath = tool_input.file_path || "";

  // XML 파일만 대상
  if (!filePath.endsWith(".xml")) {
    return { decision: "allow" };
  }

  // 검사할 콘텐츠 선택
  const content =
    tool_name.toLowerCase() === "write"
      ? tool_input.content || ""
      : tool_input.new_string || "";

  if (!content) {
    return { decision: "allow" };
  }

  const { dangerous } = checkDangerousBindings(filePath, content);

  if (dangerous.length === 0) {
    return { decision: "allow" };
  }

  const lines = dangerous.map((l) => `  - ${l}`).join("\n");
  const message =
    `━━━ MYBATIS SQL INJECTION GUARD ━━━━━━━━━━━━━━━\n` +
    `File: ${filePath}\n\n` +
    `Dangerous bindings detected (use #{} instead):\n` +
    `${lines}\n\n` +
    `Whitelisted: tableName, orderBy, sortColumn, columns, schemaName, direction\n` +
    `To add to whitelist: edit mybatisBindingGuard.js WHITELIST array\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return { decision: "block", message };
}

// ─── CLI Entry Point (stdin JSON 파싱) ───────────────────────
if (require.main === module) {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => {
    try {
      const input = chunks.join("");
      if (!input.trim()) {
        // 빈 입력 → 안전하게 허용 (fail-open: 보안 차단이 아닌 코드 품질 가드)
        process.exit(0);
      }
      const event = JSON.parse(input);
      const result = onPreToolUse(event);
      if (result.decision === "block") {
        if (result.message) process.stderr.write(result.message);
        process.exit(2); // exit 2 = block
      }
      process.exit(0); // exit 0 = allow
    } catch (e) {
      // JSON 파싱 실패 → fail-open (코드 품질 가드이므로 작업을 막지 않음)
      process.stderr.write(
        `[MyBatisBindingGuard] Parse error - allowing: ${e.message}\n`,
      );
      process.exit(0);
    }
  });
  // stdin 미수신 시 안전 타임아웃 (fail-open)
  const safetyTimer = setTimeout(() => {
    process.stderr.write("[MyBatisBindingGuard] stdin timeout - allowing\n");
    process.exit(0);
  }, 5_000);
  process.stdin.on("end", () => clearTimeout(safetyTimer));
  process.stdin.resume();
}

// Export for Claude Code Hook system and potential sub-module use
module.exports = {
  onPreToolUse,
  checkDangerousBindings,
  WHITELIST,
};
