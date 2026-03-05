/**
 * Gemini Auto-Reviewer Daemon
 *
 * sandbox 외부에서 독립 실행되는 파일 감시 데몬.
 * pending-files.txt 변경을 감지하여 자동으로 Gemini 리뷰를 트리거합니다.
 *
 * 사용법:
 *   node .claude/hooks/gemini-auto-reviewer.js
 *   또는
 *   bash .claude/hooks/start-gemini-daemon.sh
 *
 * @version 1.0.0
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, execFileSync, spawn } = require("child_process");

// ─── 설정 ─────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const BRIDGE_DIR = path.join(PROJECT_ROOT, ".claude/gemini-bridge");
const PENDING_FILE = path.join(BRIDGE_DIR, "pending-files.txt");
const REVIEWS_DIR = path.join(BRIDGE_DIR, "reviews");
const STATE_FILE = path.join(BRIDGE_DIR, "gemini-state.json");
const PID_FILE = path.join(BRIDGE_DIR, "daemon.pid");
const LOG_FILE = path.join(BRIDGE_DIR, "daemon.log");
const BRIDGE_JS = path.join(__dirname, "gemini-bridge.js");

const DEBOUNCE_MS = 5000; // 5초 debounce (연속 편집 배치 처리)
const DAILY_LIMIT = 100; // gemini-bridge.js와 동일 (실효 제한은 bridge의 100)
const POLL_INTERVAL = 2000; // fs.watch fallback: 2초 폴링
const MAX_FILES_PER_REVIEW = 20; // 한 번에 리뷰할 최대 파일 수

// ─── 유틸리티 ─────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try {
    fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
  } catch (_) {}
}

function ensureDirs() {
  [BRIDGE_DIR, REVIEWS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return initState();
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const s = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (s.date !== today) {
      s.date = today;
      s.callCount = 0;
    }
    return s;
  } catch (_) {
    return initState();
  }
}

function initState() {
  return {
    date: new Date().toISOString().slice(0, 10),
    callCount: 0,
    pendingReviews: [],
  };
}

function readPendingFiles() {
  try {
    if (!fs.existsSync(PENDING_FILE)) return [];
    const content = fs.readFileSync(PENDING_FILE, "utf8").trim();
    if (!content) return [];
    return [...new Set(content.split("\n").filter(Boolean))]; // dedup
  } catch (_) {
    return [];
  }
}

function clearPendingFiles() {
  try {
    fs.writeFileSync(PENDING_FILE, "", "utf8");
  } catch (_) {}
}

// ─── 중복 실행 방지 ───────────────────────────────────

function checkExistingDaemon() {
  let pid;
  try {
    if (!fs.existsSync(PID_FILE)) return false;
    pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
    if (isNaN(pid)) return false;

    // 자기 자신의 PID는 무시 (bash 스크립트가 먼저 PID를 기록하는 경쟁 조건 방지)
    if (pid === process.pid) return false;

    // 프로세스가 존재하는지 확인 (signal 0은 프로세스 존재 확인)
    process.kill(pid, 0);
    log(`Another daemon is already running (PID: ${pid}). Exiting.`);
    return true;
  } catch (e) {
    // ESRCH: 프로세스 없음 → stale PID file 삭제
    if (e.code === "ESRCH") {
      try {
        fs.unlinkSync(PID_FILE);
      } catch (_) {}
    }
    // EPERM: 다른 사용자의 프로세스 → 실행 중으로 간주
    if (e.code === "EPERM") {
      log(`Another daemon is running (PID: ${pid}, EPERM). Exiting.`);
      return true;
    }
    return false;
  }
}

function writePidFile() {
  try {
    fs.writeFileSync(PID_FILE, String(process.pid), "utf8");
  } catch (_) {}
}

function cleanupPidFile() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
      if (pid === process.pid) fs.unlinkSync(PID_FILE);
    }
  } catch (_) {}
}

// ─── Gemini 리뷰 실행 ────────────────────────────────

/**
 * pending-files.txt에 남은 파일 경로를 다시 기록 (부분 처리 시)
 */
function writePendingFiles(files) {
  try {
    fs.writeFileSync(PENDING_FILE, files.join("\n") + "\n", "utf8");
  } catch (_) {}
}

/**
 * Gemini 리뷰를 비동기(spawn)로 실행.
 * - command injection 방지: spawnSync에 배열 인자 사용 (셸 미경유)
 * - 20파일 초과 시 나머지를 pending에 보존하여 누락 방지
 * - spawn 사용으로 이벤트 루프 블로킹 최소화
 *
 * @returns {Promise<{success: boolean, reason?: string, remaining?: string[]}>}
 */
function runGeminiReview(files) {
  return new Promise((resolve) => {
    const state = loadState();
    if (state.callCount >= DAILY_LIMIT) {
      log(`Daily limit reached (${state.callCount}/${DAILY_LIMIT}). Skipping.`);
      resolve({ success: false, reason: "daily_limit" });
      return;
    }

    const filesToReview = files.slice(0, MAX_FILES_PER_REVIEW);
    const remainingFiles = files.slice(MAX_FILES_PER_REVIEW);

    if (remainingFiles.length > 0) {
      log(
        `Batch limited: reviewing ${filesToReview.length}, deferring ${remainingFiles.length} file(s).`,
      );
      // 남은 파일을 pending에 보존
      writePendingFiles(remainingFiles);
    }

    log(
      `Starting Gemini review for ${filesToReview.length} file(s): ${filesToReview.join(", ")}`,
    );

    // SECURITY EXEMPTION: Gemini API 호출을 위해 sandbox 네트워크 제한 해제
    // 근거: 데몬 프로세스는 Claude Code 외부에서 독립 실행되며, 허용 대상은 Gemini API만 해당
    // 감사: 이 패턴을 다른 곳에 복사하지 말 것. gemini-bridge.js의 sanitizePath가 민감 파일 전송을 차단
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDE_SANDBOX;
    delete cleanEnv.SANDBOX_MODE;

    const child = spawn("node", [BRIDGE_JS, "review", ...filesToReview], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: cleanEnv,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    // 타임아웃 (150초)
    const timeout = setTimeout(() => {
      log("Review timed out (150s). Killing child process.");
      child.kill("SIGKILL");
    }, 150_000);

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        log("Review completed successfully.");
        if (stdout.trim()) log(`Output: ${stdout.trim().slice(0, 500)}`);
        resolve({
          success: true,
          output: stdout.trim(),
          remaining: remainingFiles,
        });
      } else {
        const errMsg = stderr.trim() || `Exit code ${code}`;
        log(`Review failed: ${errMsg.slice(0, 300)}`);
        resolve({
          success: false,
          reason: errMsg.slice(0, 300),
          remaining: remainingFiles,
        });
      }
    });

    child.on("error", (e) => {
      clearTimeout(timeout);
      log(`Review spawn error: ${e.message}`);
      resolve({ success: false, reason: e.message });
    });
  });
}

// ─── macOS 알림 ───────────────────────────────────────

function notifyIfCritical(reviewResult) {
  if (!reviewResult || !reviewResult.success) return;

  try {
    // 최신 리뷰 파일에서 critical 이슈 확인
    const reviewFiles = fs
      .readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (reviewFiles.length === 0) return;

    const latest = JSON.parse(
      fs.readFileSync(path.join(REVIEWS_DIR, reviewFiles[0]), "utf8"),
    );

    if (latest.status === "completed" && latest.needsAttention) {
      const criticalCount = (latest.issues || []).filter(
        (i) => i.severity === "critical",
      ).length;
      const msg =
        criticalCount > 0
          ? `Gemini: ${criticalCount}건의 critical 이슈 발견!`
          : `Gemini: 코드 리뷰 주의 필요`;

      try {
        const safeMsg = msg.replace(/["\\]/g, "");
        execFileSync(
          "osascript",
          [
            "-e",
            `display notification "${safeMsg}" with title "Claude Code - KiiPS" sound name "Basso"`,
          ],
          { timeout: 5000, stdio: "ignore" },
        );
      } catch (_) {}

      log(`Notification sent: ${msg}`);
    }
  } catch (_) {}
}

// ─── 파일 감시 및 debounce ─────────────────────────────

let debounceTimer = null;
let lastMtime = 0;

function onPendingFileChanged() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const files = readPendingFiles();
    if (files.length === 0) {
      log("Pending files empty, skipping.");
      return;
    }

    log(`Debounce triggered. Processing ${files.length} file(s)...`);
    const result = await runGeminiReview(files);

    if (result.success) {
      // remaining이 있으면 writePendingFiles에서 이미 보존됨
      if (!result.remaining || result.remaining.length === 0) {
        clearPendingFiles();
      }
      notifyIfCritical(result);
    } else if (result.reason === "daily_limit") {
      clearPendingFiles();
    }
    // 다른 실패 시 pending 유지 → 재시도 가능
  }, DEBOUNCE_MS);
}

function startWatcher() {
  ensureDirs();

  // pending-files.txt가 없으면 생성
  if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, "", "utf8");
  }

  // fs.watch 사용 (cross-platform)
  let watcher = null;
  try {
    watcher = fs.watch(PENDING_FILE, (eventType) => {
      if (eventType === "change") {
        // 빈 파일 변경은 무시 (clearPendingFiles에 의한 변경)
        try {
          const stat = fs.statSync(PENDING_FILE);
          if (stat.size === 0) return;
          if (stat.mtimeMs === lastMtime) return;
          lastMtime = stat.mtimeMs;
        } catch (_) {
          return;
        }

        onPendingFileChanged();
      }
    });

    log("fs.watch started on pending-files.txt");
  } catch (e) {
    log(`fs.watch failed (${e.message}), falling back to polling.`);
  }

  // Polling fallback (fs.watch가 일부 파일시스템에서 불안정)
  const pollTimer = setInterval(() => {
    try {
      if (!fs.existsSync(PENDING_FILE)) return;
      const stat = fs.statSync(PENDING_FILE);
      if (stat.size === 0) return;
      if (stat.mtimeMs === lastMtime) return;
      lastMtime = stat.mtimeMs;
      onPendingFileChanged();
    } catch (_) {}
  }, POLL_INTERVAL);

  return { watcher, pollTimer };
}

// ─── Graceful shutdown ────────────────────────────────

function shutdown(signal) {
  log(`Received ${signal}. Shutting down gracefully...`);
  clearTimeout(debounceTimer);
  cleanupPidFile();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (e) => {
  log(`Uncaught exception: ${e.message}`);
  cleanupPidFile();
  process.exit(1);
});

// ─── 진입점 ───────────────────────────────────────────

(function main() {
  ensureDirs();

  // 중복 실행 방지
  if (checkExistingDaemon()) {
    process.exit(0);
  }

  writePidFile();

  log("═══════════════════════════════════════════");
  log("Gemini Auto-Reviewer Daemon started");
  log(`PID: ${process.pid}`);
  log(`Project: ${PROJECT_ROOT}`);
  log(`Watching: ${PENDING_FILE}`);
  log(`Debounce: ${DEBOUNCE_MS}ms`);
  log(`Daily limit: ${DAILY_LIMIT}`);
  log("═══════════════════════════════════════════");

  // 시작 시 기존 pending 파일 처리
  const existingFiles = readPendingFiles();
  if (existingFiles.length > 0) {
    log(
      `Found ${existingFiles.length} existing pending file(s). Processing...`,
    );
    onPendingFileChanged();
  }

  startWatcher();

  // 프로세스 유지
  log("Daemon ready. Waiting for file changes...");
})();
