/**
 * Stop Event Hook (Lightweight v4.0)
 *
 * Claude 응답 완료 후 실행:
 * 1. 코드 변경사항 자가 검증 체크리스트 표시
 * 2. Gemini 백그라운드 코드 리뷰 트리거
 *
 * 제거됨 (v4.0):
 * - runAutoTests (Stop 이벤트에서 Maven 테스트 자동 실행은 과도)
 * - recordExecutionFeedback (dead feedback-loop에 쓰기)
 * - considerAutoCheckpoint (체크포인트 누적, 정리 없음)
 * - aggregateSessionMetrics (존재하지 않을 수 있는 traces 읽기)
 * - ACE Feedback 요약 (dead feedback-loop에서 읽기)
 *
 * @version 4.0.0-KiiPS
 */

const fs = require("fs");
const path = require("path");

/**
 * Hook entry point
 */
async function onStopEvent(context) {
  try {
    const editedFiles = context.editedFiles || [];

    // 1. 코드 변경사항 분석
    if (editedFiles.length > 0) {
      analyzeCodeChanges(editedFiles);
    }

    // 2. Gemini 백그라운드 코드 리뷰
    if (editedFiles.length > 0) {
      triggerGeminiReview(editedFiles);
    }
  } catch (error) {
    console.error("[StopEvent] Error:", error.message);
  }
}

/**
 * Gemini 백그라운드 리뷰 트리거
 */
function triggerGeminiReview(editedFiles) {
  try {
    const daemonPidFile = path.join(__dirname, "../gemini-bridge/daemon.pid");
    let daemonRunning = false;

    if (fs.existsSync(daemonPidFile)) {
      try {
        const pid = parseInt(fs.readFileSync(daemonPidFile, "utf8").trim(), 10);
        if (!isNaN(pid)) {
          process.kill(pid, 0);
          daemonRunning = true;
        }
      } catch (e) {
        if (e.code === "ESRCH") {
          try {
            fs.unlinkSync(daemonPidFile);
          } catch (_) {}
        }
      }
    }

    if (daemonRunning) {
      console.log("[StopEvent] Gemini auto-reviewer daemon active.");
    } else {
      const { spawn } = require("child_process");
      const bridgePath = path.join(__dirname, "gemini-bridge.js");
      const child = spawn("node", [bridgePath, "review", ...editedFiles], {
        detached: true,
        stdio: "ignore",
        cwd: process.cwd(),
        // SECURITY EXEMPTION: Gemini review를 위한 sandbox 해제 (Stop 이벤트 fallback 전용)
        env: {
          ...process.env,
          CLAUDE_SANDBOX: undefined,
          SANDBOX_MODE: undefined,
        },
      });
      child.unref();
      console.log("[StopEvent] Gemini review spawned (fallback).");
    }
  } catch (e) {
    try {
      const errLog = path.join(__dirname, "../gemini-bridge/errors.log");
      fs.appendFileSync(
        errLog,
        `[${new Date().toISOString()}] stopEvent: ${e.message}\n`,
        "utf8",
      );
    } catch (_) {}
  }
}

/**
 * 코드 변경사항 분석
 */
function analyzeCodeChanges(editedFiles) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("CODE CHANGES SELF-CHECK");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Changes detected in ${editedFiles.length} file(s)\n`);

  const reminders = new Set();
  const moduleChanges = new Map();

  for (const filePath of editedFiles) {
    analyzeFile(filePath, reminders);
    const moduleName = extractModuleName(filePath);
    if (moduleName) {
      if (!moduleChanges.has(moduleName)) moduleChanges.set(moduleName, []);
      moduleChanges.get(moduleName).push(filePath);
    }
  }

  if (moduleChanges.size > 0) {
    console.log("**Module Changes:**");
    for (const [module, files] of moduleChanges) {
      console.log(`  ${module}: ${files.length} file(s)`);
    }
    console.log("");
  }

  if (reminders.size > 0) {
    console.log("**Self-check:**");
    Array.from(reminders).forEach((r) => console.log(`  ? ${r}`));
  } else {
    console.log("No critical patterns detected");
  }

  console.log("");
  console.log(
    "TIP: 세션 종료 전 /session-wrap 으로 변경 요약 및 인수인계를 정리하세요.",
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * 파일 분석 및 리스크 패턴 검사
 */
function analyzeFile(filePath, reminders) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath);

    if (ext === ".java") checkJavaPatterns(content, reminders);
    if (ext === ".js" || ext === ".jsp") checkJsPatterns(content, reminders);
    if (ext === ".xml" && content.includes("<!DOCTYPE mapper"))
      checkMyBatisPatterns(content, reminders);
    if (ext === ".scss") checkScssPatterns(content, reminders);
    if (ext === ".properties" || ext === ".yml" || ext === ".yaml")
      checkConfigPatterns(content, path.basename(filePath), reminders);
    if (path.basename(filePath) === "pom.xml")
      checkPomPatterns(content, reminders);
  } catch (_) {}
}

function checkJavaPatterns(content, reminders) {
  if (/@Transactional/.test(content))
    reminders.add("Transaction rollback configured for exceptions?");
  if (/@RestController|@Controller/.test(content))
    reminders.add("@Valid for request body validation?");
  if (/Common_API_Service|commonApiService/.test(content))
    reminders.add("Service-to-Service calls using x-api-key header?");
}

function checkJsPatterns(content, reminders) {
  if (/\$\.ajax|\$\.get|\$\.post|fetch\(/.test(content))
    reminders.add("Error handling for AJAX/fetch requests?");
  if (/RealGrid|GridView|DataProvider/.test(content))
    reminders.add("RealGrid initialized properly with dataProvider?");
}

function checkMyBatisPatterns(content, reminders) {
  if (/\$\{[^}]+\}/.test(content))
    reminders.add("WARNING: ${} syntax - ensure no SQL injection!");
  if (/<delete|<update/.test(content))
    reminders.add("WHERE clause for DELETE/UPDATE queries?");
}

function checkScssPatterns(content, reminders) {
  if (/\.dark\s*\{|\.theme-dark\s*\{/.test(content))
    reminders.add("[data-theme=dark] only! .dark, .theme-dark forbidden");
  if (
    /\[data-theme.*dark\]/.test(content) &&
    /width:|height:|display:|position:|margin:|padding:/.test(content)
  )
    reminders.add("No layout changes in dark theme!");
}

function checkConfigPatterns(content, fileName, reminders) {
  if (fileName.includes("kiips") || fileName.includes("prod"))
    reminders.add("Production config modified - verify before deployment");
  if (/password|secret|key|token/i.test(content))
    reminders.add("No sensitive credentials committed to VCS?");
}

function checkPomPatterns(content, reminders) {
  if (/<version>[^<]*SNAPSHOT/i.test(content))
    reminders.add("SNAPSHOT version - ensure stability for production");
}

function extractModuleName(filePath) {
  const match = filePath.match(/KiiPS-([A-Z]{2,10})/i);
  return match ? `KiiPS-${match[1].toUpperCase()}` : null;
}

// ─── stdin 진입점 ─────────────────────────────────────────────

const PENDING_FILES_PATH = path.join(
  __dirname,
  "../gemini-bridge/pending-files.txt",
);

function readPendingFiles() {
  try {
    if (!fs.existsSync(PENDING_FILES_PATH)) return [];
    const content = fs.readFileSync(PENDING_FILES_PATH, "utf8").trim();
    return content ? content.split("\n").filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function clearPendingFiles() {
  try {
    if (fs.existsSync(PENDING_FILES_PATH))
      fs.writeFileSync(PENDING_FILES_PATH, "", "utf8");
  } catch (_) {}
}

(async () => {
  try {
    let stdinData = "";
    if (!process.stdin.isTTY) {
      stdinData = await new Promise((resolve) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => {
          data += chunk;
        });
        process.stdin.on("end", () => resolve(data));
        setTimeout(() => resolve(data), 3000);
      });
    }

    let context = {};
    if (stdinData.trim()) {
      try {
        context = JSON.parse(stdinData);
      } catch (_) {}
    }

    const pendingFiles = readPendingFiles();
    context.editedFiles =
      pendingFiles.length > 0 ? pendingFiles : context.editedFiles || [];

    await onStopEvent(context);
    clearPendingFiles();
  } catch (e) {
    console.error("[StopEvent] Entry point error:", e.message);
  }
})();

module.exports = { onStopEvent };
