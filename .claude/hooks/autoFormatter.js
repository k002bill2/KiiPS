/**
 * Auto Formatter Hook (PostToolUse)
 * Boris Cherny's Principle: "PostToolUse 훅을 통해 코드 포매팅을 처리하여 CI 오류를 방지"
 *
 * Write/Edit 도구 사용 후 자동으로 코드 포매팅 및 린팅을 수행합니다.
 *
 * @version 1.0.0
 * @layer PostToolUse Hook
 */

const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");

// ─── 도구 존재 여부 캐시 (프로세스 수명 동안 유지) ────────────
const _toolCache = {};
function isToolAvailable(toolName) {
  if (toolName in _toolCache) return _toolCache[toolName];
  try {
    execFileSync("which", [toolName], { stdio: "pipe", timeout: 3000 });
    _toolCache[toolName] = true;
  } catch (_) {
    _toolCache[toolName] = false;
  }
  return _toolCache[toolName];
}

/**
 * Hook entry point
 * @param {object} event - PostToolUse 이벤트 객체
 */
async function onPostToolUse(event) {
  try {
    // Write 또는 Edit 도구만 처리
    if (event.tool !== "Write" && event.tool !== "Edit") {
      return { success: true, skipped: true, reason: "Not a Write/Edit tool" };
    }

    const filePath = event.parameters.file_path;

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "File not found" };
    }

    // 포매팅 대상 파일 확인
    const ext = path.extname(filePath);
    const supportedExtensions = [
      ".java",
      ".js",
      ".scss",
      ".css",
      ".xml",
      ".sql",
    ];

    if (!supportedExtensions.includes(ext)) {
      return {
        success: true,
        skipped: true,
        reason: `Unsupported file type: ${ext}`,
      };
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ AUTO FORMATTER (Boris Cherny PostToolUse Hook)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`📄 File: ${path.basename(filePath)}`);

    const results = {
      formatted: false,
      linted: false,
      formatter: null,
      linter: null,
      issues: [],
      timestamp: new Date().toISOString(),
    };

    // 1. 포매팅 실행
    results.formatter = await runFormatter(filePath, ext);
    if (results.formatter.success) {
      results.formatted = true;
      console.log(`✅ Formatted with: ${results.formatter.tool}`);
    } else {
      console.log(`⚠️  Formatting skipped: ${results.formatter.reason}`);
    }

    // 2. 린팅 실행
    results.linter = await runLinter(filePath, ext);
    if (results.linter.success) {
      results.linted = true;
      console.log(`✅ Linted with: ${results.linter.tool}`);

      if (results.linter.issues.length > 0) {
        console.log(
          `\n⚠️  ${results.linter.issues.length} linter issue(s) found:`,
        );
        results.linter.issues.slice(0, 5).forEach((issue) => {
          console.log(`   • ${issue}`);
        });
        if (results.linter.issues.length > 5) {
          console.log(`   ... and ${results.linter.issues.length - 5} more`);
        }
      } else {
        console.log(`✅ No linter issues found`);
      }
    } else {
      console.log(`ℹ️  Linting skipped: ${results.linter.reason}`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return { success: true, results };
  } catch (error) {
    console.error("[AutoFormatter] Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 파일 타입별 포매터 실행
 */
async function runFormatter(filePath, ext) {
  try {
    switch (ext) {
      case ".java":
        return await formatJava(filePath);

      case ".js":
        return await formatJavaScript(filePath);

      case ".scss":
      case ".css":
        return await formatStylesheet(filePath);

      default:
        return { success: false, reason: `No formatter for ${ext}` };
    }
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Java 파일 포매팅 (google-java-format)
 */
async function formatJava(filePath) {
  if (!isToolAvailable("google-java-format")) {
    return { success: false, reason: "google-java-format not installed" };
  }
  try {
    execFileSync("google-java-format", ["--replace", filePath], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { success: true, tool: "google-java-format" };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * JavaScript 파일 포매팅 (Prettier)
 */
async function formatJavaScript(filePath) {
  const prettierCmd = isToolAvailable("prettier") ? "prettier" : null;
  if (!prettierCmd) {
    return { success: false, reason: "prettier not installed" };
  }
  try {
    execFileSync(prettierCmd, ["--write", filePath], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { success: true, tool: "prettier" };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * SCSS/CSS 파일 포매팅 (stylelint + prettier)
 */
async function formatStylesheet(filePath) {
  const prettierCmd = isToolAvailable("prettier") ? "prettier" : null;
  if (!prettierCmd) {
    return { success: false, reason: "prettier not installed" };
  }
  try {
    execFileSync(prettierCmd, ["--write", filePath], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { success: true, tool: "prettier (SCSS)" };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * 파일 타입별 린터 실행
 */
async function runLinter(filePath, ext) {
  try {
    switch (ext) {
      case ".java":
        return await lintJava(filePath);

      case ".js":
        return await lintJavaScript(filePath);

      case ".scss":
      case ".css":
        return await lintStylesheet(filePath);

      default:
        return { success: false, reason: `No linter for ${ext}` };
    }
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Java 파일 린팅 (Checkstyle)
 */
async function lintJava(filePath) {
  if (!isToolAvailable("checkstyle")) {
    return { success: false, reason: "checkstyle not installed" };
  }
  try {
    const output = execFileSync(
      "checkstyle",
      ["-c", "/google_checks.xml", filePath],
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    const issues = parseCheckstyleOutput(output);
    return { success: true, tool: "checkstyle", issues };
  } catch (error) {
    const issues = parseCheckstyleOutput(error.stdout || error.message);
    return { success: true, tool: "checkstyle", issues };
  }
}

/**
 * JavaScript 파일 린팅 (ESLint)
 */
async function lintJavaScript(filePath) {
  if (!isToolAvailable("eslint")) {
    return { success: false, reason: "eslint not installed" };
  }
  try {
    const output = execFileSync("eslint", ["--format", "json", filePath], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const results = JSON.parse(output);
    const issues = [];
    if (results.length > 0 && results[0].messages) {
      results[0].messages.forEach((msg) => {
        issues.push(`Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
      });
    }
    return { success: true, tool: "eslint", issues };
  } catch (error) {
    try {
      const results = JSON.parse(error.stdout || "[]");
      const issues = [];
      if (results.length > 0 && results[0].messages) {
        results[0].messages.forEach((msg) => {
          issues.push(`Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
        });
      }
      return { success: true, tool: "eslint", issues };
    } catch (e) {
      return { success: false, reason: error.message };
    }
  }
}

/**
 * SCSS/CSS 파일 린팅 (stylelint)
 */
async function lintStylesheet(filePath) {
  if (!isToolAvailable("stylelint")) {
    return { success: false, reason: "stylelint not installed" };
  }
  try {
    const output = execFileSync(
      "stylelint",
      ["--formatter", "json", filePath],
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    const results = JSON.parse(output);
    const issues = [];
    if (results.length > 0 && results[0].warnings) {
      results[0].warnings.forEach((warning) => {
        issues.push(`Line ${warning.line}: ${warning.text}`);
      });
    }
    return { success: true, tool: "stylelint", issues };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Checkstyle 출력 파싱
 */
function parseCheckstyleOutput(output) {
  const issues = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Checkstyle 오류 패턴: "[ERROR] /path/to/file.java:42: ..."
    if (line.includes("[ERROR]") || line.includes("[WARN]")) {
      const match = line.match(/:(\d+):\s*(.+)/);
      if (match) {
        issues.push(`Line ${match[1]}: ${match[2]}`);
      }
    }
  }

  return issues;
}

// ─── CLI Entry Point (stdin JSON 파싱) ───────────────────────
if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", async () => {
    try {
      const event = JSON.parse(input);
      // PostToolUse 이벤트 구조 매핑
      const hookEvent = {
        tool: event.tool_name || event.tool || "",
        parameters: event.tool_input || event.parameters || {},
      };
      await onPostToolUse(hookEvent);
      process.exit(0);
    } catch (e) {
      process.stderr.write(`[AutoFormatter] Parse error: ${e.message}\n`);
      process.exit(0);
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 30000); // 포맷팅은 시간이 걸릴 수 있음
}

// Export for Claude Code Hook system
module.exports = { onPostToolUse };
