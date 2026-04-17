/**
 * Gemini Auto-Trigger — Lazy Daemon + Socket IPC
 *
 * 기존 gemini-auto-reviewer.js (상주 daemon) + gemini-collector.sh (shell collector)를
 * 단일 파일로 대체합니다.
 *
 * 모드:
 *   trigger  — PostToolOrchestrator에서 require()로 호출 (동기, socket 전송)
 *   daemon   — Lazy daemon (UDS 서버, in-memory debounce, 자동 종료)
 *   status   — daemon 상태 조회
 *
 * 동작 흐름:
 *   Edit/Write → trigger(filePath) → socket 전송 (또는 lazy start)
 *   → daemon: in-memory debounce(30초) → spawn bridge.js review
 *   → 10분 유휴 → 자동 종료
 *
 * @version 1.0.0
 */

"use strict";

const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawn, execFileSync } = require("child_process");

// ─── 경로 상수 ─────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const BRIDGE_DIR = path.join(PROJECT_ROOT, ".claude/gemini-bridge");
const REVIEWS_DIR = path.join(BRIDGE_DIR, "reviews");
const PENDING_FILE = path.join(BRIDGE_DIR, "pending-files.txt");
const STATE_FILE = path.join(BRIDGE_DIR, "gemini-state.json");
const LAST_REVIEW_FILE = path.join(BRIDGE_DIR, ".last-review-at");
const LOG_FILE = path.join(BRIDGE_DIR, "trigger.log");
const SOCKET_PATH = path.join(BRIDGE_DIR, "gemini.sock");
const BRIDGE_JS = path.join(__dirname, "gemini-bridge.js");

// ─── 설정 상수 ─────────────────────────────────────────
const DEBOUNCE_MS = 30_000; // 30초 debounce
const IDLE_TIMEOUT_MS = 600_000; // 10분 유휴 자동 종료
const MIN_INTERVAL_MS = 300_000; // 5분 리뷰 간격 쿨다운
const DAILY_LIMIT = 900; // 일일 호출 한도
const MAX_FILES = 20; // 배치 크기
const REVIEW_TIMEOUT_MS = 150_000; // bridge.js 타임아웃

// ─── 공통 유틸리티 ──────────────────────────────────────

function log(msg) {
  try {
    ensureDirs();
    fs.appendFileSync(
      LOG_FILE,
      `[${new Date().toISOString()}] ${msg}\n`,
      "utf8",
    );
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

function saveState(state) {
  try {
    ensureDirs();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (_) {}
}

function readPendingFiles() {
  try {
    if (!fs.existsSync(PENDING_FILE)) return [];
    const content = fs.readFileSync(PENDING_FILE, "utf8").trim();
    if (!content) return [];
    return [...new Set(content.split("\n").filter(Boolean))];
  } catch (_) {
    return [];
  }
}

function writePendingFiles(files) {
  try {
    ensureDirs();
    fs.writeFileSync(PENDING_FILE, files.join("\n") + "\n", "utf8");
  } catch (_) {}
}

function clearPendingFiles() {
  try {
    fs.writeFileSync(PENDING_FILE, "", "utf8");
  } catch (_) {}
}

function appendPending(filePath) {
  try {
    ensureDirs();
    const existing = readPendingFiles();
    if (!existing.includes(filePath)) {
      fs.appendFileSync(PENDING_FILE, filePath + "\n", "utf8");
    }
  } catch (_) {}
}

function readLastReviewAt() {
  try {
    if (!fs.existsSync(LAST_REVIEW_FILE)) return 0;
    return parseInt(fs.readFileSync(LAST_REVIEW_FILE, "utf8").trim(), 10) || 0;
  } catch (_) {
    return 0;
  }
}

function writeLastReviewAt() {
  try {
    fs.writeFileSync(LAST_REVIEW_FILE, String(Date.now()), "utf8");
  } catch (_) {}
}

// ─── MODE: trigger ──────────────────────────────────────
// PostToolOrchestrator에서 require()로 호출

function trigger(filePath) {
  if (!filePath) return;

  try {
    ensureDirs();

    // 가드 1: 일일 한도
    const state = loadState();
    if (state.callCount >= DAILY_LIMIT) return;

    // 가드 2: 5분 쿨다운 — pending에만 추가하고 return
    const lastAt = readLastReviewAt();
    if (Date.now() - lastAt < MIN_INTERVAL_MS) {
      appendPending(filePath);
      return;
    }

    // Socket 전송 시도
    const client = net.createConnection({ path: SOCKET_PATH });

    client.on("connect", () => {
      client.write(JSON.stringify({ file: filePath }) + "\n");
      client.end();
    });

    client.on("error", () => {
      lazyStart(filePath);
    });

    // 타임아웃: 2초 내 접속 안 되면 lazy start
    client.setTimeout(2000, () => {
      client.destroy();
      lazyStart(filePath);
    });
  } catch (_) {
    lazyStart(filePath);
  }
}

function lazyStart(filePath) {
  // stale socket 정리
  try {
    if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  } catch (_) {}

  // pending에 기록 (daemon 시작 시 읽음)
  appendPending(filePath);

  // detached daemon spawn (sandbox 외부)
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDE_SANDBOX;
  delete cleanEnv.SANDBOX_MODE;

  try {
    const child = spawn("node", [__filename, "daemon"], {
      detached: true,
      stdio: "ignore",
      cwd: PROJECT_ROOT,
      env: cleanEnv,
    });
    child.unref();
  } catch (e) {
    log(`lazyStart failed: ${e.message}`);
  }
}

// ─── MODE: daemon ───────────────────────────────────────
// Lazy daemon: UDS 서버, in-memory debounce, 자동 종료

function runDaemon() {
  ensureDirs();

  let fileQueue = new Set();
  let debounceTimer = null;
  let idleTimer = null;
  let shuttingDown = false;
  let reviewInProgress = false;

  // 시작 시 pending-files.txt 읽기 (lazy start 전 쌓인 파일)
  const pending = readPendingFiles();
  if (pending.length > 0) {
    pending.forEach((f) => fileQueue.add(f));
    clearPendingFiles();
    log(`Loaded ${pending.length} pending file(s) from previous session`);
  }

  // ─── UDS 서버 ─────────────────────────────────────
  const server = net.createServer((conn) => {
    if (shuttingDown) {
      conn.destroy();
      return;
    }
    resetIdleTimer();

    let buf = "";
    conn.on("data", (chunk) => {
      buf += chunk.toString();
      // newline-delimited JSON parsing
      const lines = buf.split("\n");
      buf = lines.pop(); // 불완전 라인 보존
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.file) {
            fileQueue.add(msg.file);
            resetDebounceTimer();
            log(`Queued: ${msg.file} (queue: ${fileQueue.size})`);
          }
          if (msg.action === "status") {
            conn.write(
              JSON.stringify({
                queue: fileQueue.size,
                files: [...fileQueue],
                reviewInProgress,
                uptime: process.uptime(),
              }) + "\n",
            );
          }
        } catch (_) {}
      }
    });

    conn.on("error", () => {}); // client disconnect 무시
  });

  // stale socket 정리 후 listen
  try {
    if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  } catch (_) {}

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      // 다른 daemon이 이미 실행 중
      log("Another daemon already running (EADDRINUSE). Exiting.");
      process.exit(0);
    }
    log(`Server error: ${e.message}`);
  });

  server.listen(SOCKET_PATH, () => {
    log(
      `═══════════════════════════════════════════\n` +
        `[${new Date().toISOString()}] Lazy daemon started\n` +
        `[${new Date().toISOString()}] PID: ${process.pid}\n` +
        `[${new Date().toISOString()}] Socket: ${SOCKET_PATH}\n` +
        `[${new Date().toISOString()}] Debounce: ${DEBOUNCE_MS / 1000}s | Idle: ${IDLE_TIMEOUT_MS / 60000}min\n` +
        `[${new Date().toISOString()}] ═══════════════════════════════════════════`,
    );

    // pending이 있었으면 즉시 debounce 시작
    if (fileQueue.size > 0) {
      resetDebounceTimer();
    }
  });

  // ─── Debounce Timer ───────────────────────────────
  function resetDebounceTimer() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => executeReview(), DEBOUNCE_MS);
  }

  // ─── Idle Timer ───────────────────────────────────
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => shutdown("idle"), IDLE_TIMEOUT_MS);
  }

  // ─── Review 실행 ──────────────────────────────────
  // gemini-auto-reviewer.js:158-237 패턴 재사용
  function executeReview() {
    if (fileQueue.size === 0) return;
    if (reviewInProgress) {
      // 이전 리뷰 진행 중 → 재스케줄
      debounceTimer = setTimeout(() => executeReview(), 10_000);
      return;
    }

    const state = loadState();
    if (state.callCount >= DAILY_LIMIT) {
      log(
        `Daily limit reached (${state.callCount}/${DAILY_LIMIT}). Clearing queue.`,
      );
      fileQueue.clear();
      return;
    }

    const files = [...fileQueue].slice(0, MAX_FILES);
    const remaining = [...fileQueue].slice(MAX_FILES);
    fileQueue = new Set(remaining);

    reviewInProgress = true;
    log(`Starting review for ${files.length} file(s): ${files.join(", ")}`);

    const child = spawn("node", [BRIDGE_JS, "review", ...files], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env, // daemon은 이미 sandbox 외부
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    const timeout = setTimeout(() => {
      log("Review timed out. Killing child.");
      child.kill("SIGKILL");
    }, REVIEW_TIMEOUT_MS);

    child.on("close", (code) => {
      clearTimeout(timeout);
      reviewInProgress = false;

      if (code === 0) {
        log("Review completed successfully.");
        if (stdout.trim()) log(`Output: ${stdout.trim().slice(0, 500)}`);

        state.callCount += 1;
        saveState(state);
        writeLastReviewAt();

        notifyIfCritical();
      } else {
        const errMsg = stderr.trim() || `Exit code ${code}`;
        log(`Review failed: ${errMsg.slice(0, 300)}`);
      }

      // 남은 파일이 있으면 다음 리뷰 스케줄
      if (fileQueue.size > 0) {
        resetDebounceTimer();
      }

      resetIdleTimer();
    });

    child.on("error", (e) => {
      clearTimeout(timeout);
      reviewInProgress = false;
      log(`Review spawn error: ${e.message}`);
      resetIdleTimer();
    });
  }

  // ─── macOS 알림 ───────────────────────────────────
  // gemini-auto-reviewer.js:241-282 재사용
  function notifyIfCritical() {
    try {
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

        log(`Notification: ${msg}`);
      }
    } catch (_) {}
  }

  // ─── Graceful Shutdown ─────────────────────────────
  function shutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    clearTimeout(debounceTimer);
    clearTimeout(idleTimer);

    log(`Shutting down (${reason}). Queue: ${fileQueue.size} file(s).`);

    // 큐에 남은 파일 → pending-files.txt 백업
    if (fileQueue.size > 0) {
      writePendingFiles([...fileQueue]);
      log(`Backed up ${fileQueue.size} file(s) to pending-files.txt`);
    }

    server.close(() => {
      try {
        fs.unlinkSync(SOCKET_PATH);
      } catch (_) {}
      log("Daemon stopped.");
      process.exit(0);
    });

    // server.close가 3초 내 완료되지 않으면 강제 종료
    setTimeout(() => {
      try {
        fs.unlinkSync(SOCKET_PATH);
      } catch (_) {}
      process.exit(0);
    }, 3000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (e) => {
    log(`Uncaught exception: ${e.message}`);
    if (fileQueue.size > 0) writePendingFiles([...fileQueue]);
    try {
      fs.unlinkSync(SOCKET_PATH);
    } catch (_) {}
    process.exit(1);
  });

  resetIdleTimer();
}

// ─── MODE: status ───────────────────────────────────────

function showStatus() {
  const state = loadState();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("GEMINI AUTO-TRIGGER STATUS (lazy daemon)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Date       : ${state.date}`);
  console.log(`Call count : ${state.callCount} / ${DAILY_LIMIT}`);
  console.log(`Socket     : ${SOCKET_PATH}`);

  const socketExists = fs.existsSync(SOCKET_PATH);
  console.log(`Daemon     : ${socketExists ? "active" : "idle"}`);

  if (socketExists) {
    // daemon에 status 요청
    const client = net.createConnection({ path: SOCKET_PATH });
    client.on("connect", () => {
      client.write(JSON.stringify({ action: "status" }) + "\n");
    });
    client.on("data", (data) => {
      try {
        const status = JSON.parse(data.toString().trim());
        console.log(`Queue      : ${status.queue} file(s)`);
        console.log(`Reviewing  : ${status.reviewInProgress ? "yes" : "no"}`);
        console.log(`Uptime     : ${Math.round(status.uptime)}s`);
      } catch (_) {}
      client.end();
    });
    client.on("error", () => {
      console.log("(daemon not responding)");
    });
    client.setTimeout(3000, () => {
      client.destroy();
    });
  }

  const lastAt = readLastReviewAt();
  if (lastAt > 0) {
    const ago = Math.round((Date.now() - lastAt) / 1000);
    console.log(`Last review: ${ago}s ago`);
  }

  const pending = readPendingFiles();
  if (pending.length > 0) {
    console.log(`Pending    : ${pending.length} file(s)`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── 진입점 ─────────────────────────────────────────────

const mode = process.argv[2];
if (mode === "daemon") {
  runDaemon();
} else if (mode === "status") {
  showStatus();
} else {
  // require()로 로드 시 trigger만 export
  module.exports = { trigger };
}
