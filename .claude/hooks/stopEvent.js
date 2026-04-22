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
 * - Feedback 요약 (dead feedback-loop에서 읽기)
 *
 * @version 4.0.0-KiiPS
 */

const fs = require("fs");
const path = require("path");

// ─── Evidence State Path ────────────────────────────────────
const EVIDENCE_PATH = path.join(
  __dirname,
  "../gemini-bridge/.completion-evidence.json",
);

/**
 * Check whether verification steps were run after compilable files were edited.
 * Emits a warning to stderr if evidence is missing, then resets the state file.
 */
function checkCompletionEvidence() {
  try {
    if (!fs.existsSync(EVIDENCE_PATH)) return;

    let state;
    try {
      state = JSON.parse(fs.readFileSync(EVIDENCE_PATH, "utf8"));
    } catch (_) {
      return; // fail-open
    }

    // Nothing was edited — skip
    if (
      !state ||
      !Array.isArray(state.editedFileTypes) ||
      state.editedFileTypes.length === 0
    ) {
      return;
    }

    const missing = [];
    if (state.editedFileTypes.includes(".java") && !state.buildRun) {
      missing.push("Maven build not run after .java changes");
    }
    if (state.editedFileTypes.includes(".scss") && !state.scssCompileRun) {
      missing.push("SCSS compile not verified after .scss changes");
    }
    if (state.editedFileTypes.includes(".xml") && !state.mybatisCheckRun) {
      missing.push("MyBatis syntax not verified after .xml changes");
    }

    if (missing.length > 0) {
      const lines = [
        "",
        "┌─── EVIDENCE-BASED COMPLETION CHECK ────────────────┐",
        "│ Code changed but verification incomplete:           │",
      ];
      missing.forEach((m) => {
        const padded = `│  - ${m}`.padEnd(53) + "│";
        lines.push(padded);
      });
      lines.push("│                                                     │");
      lines.push("│ Run verification before claiming completion.        │");
      lines.push("│ Ref: .claude/rules/verification.md                  │");
      lines.push("└─────────────────────────────────────────────────────┘");
      lines.push("");
      process.stderr.write(lines.join("\n"));
    }
  } catch (_) {
    // fail-open
  } finally {
    // Reset evidence state for the next response cycle
    try {
      fs.writeFileSync(
        EVIDENCE_PATH,
        JSON.stringify(
          {
            buildRun: false,
            scssCompileRun: false,
            mybatisCheckRun: false,
            editedFileTypes: [],
            lastEditAt: null,
            lastVerifyAt: null,
          },
          null,
          2,
        ),
        "utf8",
      );
    } catch (_) {}
  }
}

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

    // 3. Evidence-based completion check
    checkCompletionEvidence();

    // 4. Garbage collection: old reviews & oversized logs
    gcGeminiBridge();

    // 5. Weekly cleanup: backups + observations rolling (7d interval)
    gcWeeklyCleanup();
  } catch (error) {
    console.error("[StopEvent] Error:", error.message);
  }
}

/**
 * Weekly Cleanup: 7일에 한 번 백업 GC + observations 롤링 실행
 * 마지막 실행 시각은 .claude/.last-cleanup 에 기록
 * fail-open: 실패해도 작업 진행
 */
function gcWeeklyCleanup() {
  try {
    const projectRoot = path.resolve(__dirname, "../..");
    const lastCleanupFile = path.join(projectRoot, ".claude/.last-cleanup");
    const INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

    // 7일 인터벌 체크
    if (fs.existsSync(lastCleanupFile)) {
      const lastMs = fs.statSync(lastCleanupFile).mtimeMs;
      if (Date.now() - lastMs < INTERVAL_MS) return;
    }

    // 1. 백업 디렉토리/임시 파일 후보 식별 알림 (자동 삭제 안함)
    try {
      const { execSync } = require("child_process");
      const backupGc = path.join(__dirname, "backupGc.sh");
      if (fs.existsSync(backupGc)) {
        execSync(`bash "${backupGc}"`, {
          stdio: ["ignore", "ignore", "inherit"],
          timeout: 5000,
        });
      }
    } catch (_) {
      // fail-open
    }

    // 2. observations.jsonl 90일 롤링
    try {
      const { rollObservations } = require("./observationsRoller.js");
      // 비동기지만 fire-and-forget (로그는 stderr로 직접)
      rollObservations().catch(() => {});
    } catch (_) {
      // fail-open
    }

    // 3. 사용자 권장 커맨드 알림 (수동 실행 권유)
    try {
      const suggestion = [
        "",
        "┌─── WEEKLY HOUSEKEEPING SUGGESTIONS ─────────────────┐",
        "│ 마지막 cleanup 후 7일 경과. 다음 명령 검토 권장:    │",
        "│                                                     │",
        "│  /check-rules        - rules/ 위반 스캔             │",
        "│  /periodic-cleanup   - 코드 위생 스캔               │",
        "│  /instinct-gc        - Instinct 수명 정리 (dry-run) │",
        "│                                                     │",
        "│ 자동 실행 안 됨 - 검토 후 수동 실행하세요.          │",
        "└─────────────────────────────────────────────────────┘",
        "",
      ].join("\n");
      process.stderr.write(suggestion);
    } catch (_) {}

    // 4. 마커 갱신
    try {
      fs.writeFileSync(lastCleanupFile, new Date().toISOString(), "utf8");
    } catch (_) {}
  } catch (_) {
    // fail-open
  }
}

/**
 * Gemini Bridge GC: 최신 리뷰 20개만 보존, 로그 100KB 초과 시 truncate
 */
function gcGeminiBridge() {
  try {
    const reviewsDir = path.join(__dirname, "../gemini-bridge/reviews");
    if (!fs.existsSync(reviewsDir)) return;

    const files = fs
      .readdirSync(reviewsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse(); // newest first (timestamp in filename)

    const MAX_REVIEWS = 20;
    if (files.length > MAX_REVIEWS) {
      const toDelete = files.slice(MAX_REVIEWS);
      for (const f of toDelete) {
        try {
          fs.unlinkSync(path.join(reviewsDir, f));
        } catch (_) {}
      }
    }

    // Log rotation: truncate logs over 100KB
    const LOG_MAX = 100 * 1024;
    const logs = ["trigger.log", "errors.log"].map((f) =>
      path.join(__dirname, "../gemini-bridge", f),
    );
    for (const logPath of logs) {
      try {
        if (fs.existsSync(logPath) && fs.statSync(logPath).size > LOG_MAX) {
          fs.writeFileSync(logPath, "", "utf8");
        }
      } catch (_) {}
    }
  } catch (_) {
    // GC failure is non-critical
  }
}

/**
 * Gemini 백그라운드 리뷰 트리거
 * lazy daemon이 활성이면 socket으로 전달, 아니면 direct spawn fallback
 */
function triggerGeminiReview(editedFiles) {
  try {
    const socketPath = path.join(__dirname, "../gemini-bridge/gemini.sock");

    if (fs.existsSync(socketPath)) {
      // daemon 활성 → socket으로 파일 전송
      const net = require("net");
      const client = net.createConnection({ path: socketPath });
      client.on("connect", () => {
        editedFiles.forEach((f) =>
          client.write(JSON.stringify({ file: f }) + "\n"),
        );
        client.end();
        console.log("[StopEvent] Files sent to lazy daemon via socket.");
      });
      client.on("error", () => {
        spawnDirectReview(editedFiles);
      });
      client.setTimeout(2000, () => {
        client.destroy();
        spawnDirectReview(editedFiles);
      });
      return;
    }

    spawnDirectReview(editedFiles);
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

function spawnDirectReview(files) {
  try {
    const { spawn } = require("child_process");
    const bridgePath = path.join(__dirname, "gemini-bridge.js");
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDE_SANDBOX;
    delete cleanEnv.SANDBOX_MODE;
    const child = spawn("node", [bridgePath, "review", ...files], {
      detached: true,
      stdio: "ignore",
      cwd: process.cwd(),
      env: cleanEnv,
    });
    child.unref();
    console.log("[StopEvent] Gemini review spawned (direct fallback).");
  } catch (_) {}
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
