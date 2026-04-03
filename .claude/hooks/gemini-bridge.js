/**
 * Gemini Bridge - Claude Code ↔ Gemini CLI 검증 전용
 *
 * 모드:
 *   review   - 코드 diff를 Gemini에게 전달해 2nd opinion 리뷰 (검증)
 *   scan     - security 보안 취약점 스캔 (검증)
 *   status   - 현재 상태(카운터, 미표시 리뷰) 출력
 *
 * @version 2.0.0-KiiPS
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");

// ─── 핵심 상수 ─────────────────────────────────────────────
const GEMINI_BIN =
  process.env.GEMINI_BIN ||
  (() => {
    try {
      return execSync("which gemini", {
        encoding: "utf8",
        timeout: 3000,
      }).trim();
    } catch (_) {
      return "gemini";
    }
  })();
const BRIDGE_DIR = path.join(__dirname, "../gemini-bridge");
const REVIEWS_DIR = path.join(BRIDGE_DIR, "reviews");
const STATE_FILE = path.join(BRIDGE_DIR, "gemini-state.json");
const ERROR_LOG = path.join(BRIDGE_DIR, "errors.log");
const DAILY_LIMIT = 100;
const TIMEOUT_REVIEW = 120_000; // 120초
const TIMEOUT_SCAN = 180_000; // 180초

// ─── 유틸리티 ───────────────────────────────────────────────

/** 셸 인젝션 방지: 파일 경로에서 위험한 문자 제거 + 경로 탈출 방지 + 민감 파일 차단 */
const SENSITIVE_FILE_PATTERNS = [
  /\.env($|\.)/i,
  /app-kiips\.properties/i,
  /app-stg\.properties/i,
  /credentials/i,
  /\.secret/i,
  /password/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /\.pgpass/i,
];

function sanitizePath(p, options = {}) {
  // 허용: 알파벳, 숫자, /, ., -, _, 공백, 한글 (allowGlob: true 시 * 허용)
  const pattern = options.allowGlob
    ? /[^a-zA-Z0-9/.\-_ *\u3131-\uD79D]/g
    : /[^a-zA-Z0-9/.\-_ \u3131-\uD79D]/g;
  const cleaned = p.replace(pattern, "");

  // 민감 파일 차단
  if (SENSITIVE_FILE_PATTERNS.some((pat) => pat.test(cleaned))) {
    logError(`sanitizePath: Blocked sensitive file: ${cleaned}`);
    return "";
  }

  const resolved = path.resolve(cleaned);
  const projectRoot = path.resolve(process.cwd());
  if (
    !resolved.startsWith(projectRoot + path.sep) &&
    resolved !== projectRoot
  ) {
    return "";
  }
  return cleaned;
}

function ensureDirs() {
  [BRIDGE_DIR, REVIEWS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function logError(msg) {
  try {
    ensureDirs();
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(ERROR_LOG, line, "utf8");
  } catch (_) {
    /* 에러 로깅 실패는 무시 */
  }
}

function loadState() {
  try {
    ensureDirs();
    if (!fs.existsSync(STATE_FILE)) return initState();
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const s = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (s.date !== today) {
      s.date = today;
      s.callCount = 0;
    }
    return s;
  } catch (e) {
    logError(`loadState: ${e.message}`);
    return initState();
  }
}

/**
 * 오래된 리뷰 파일 자동 삭제
 * @param {number} maxAgeDays - 보존 기간 (일)
 */
function cleanupOldReviews(maxAgeDays) {
  try {
    if (!fs.existsSync(REVIEWS_DIR)) return;
    const cutoffMs = Date.now() - maxAgeDays * 86_400_000;
    const files = fs
      .readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith(".json"));
    let deleted = 0;
    for (const f of files) {
      // 파일명: review-{timestamp_ms}-{rand}.json
      const match = f.match(/review-(\d+)-/);
      if (match) {
        const fileTs = parseInt(match[1], 10);
        if (fileTs < cutoffMs) {
          try {
            fs.unlinkSync(path.join(REVIEWS_DIR, f));
            deleted++;
          } catch (_) {}
        }
      }
    }
    if (deleted > 0) {
      console.log(
        `[GeminiBridge] Cleaned up ${deleted} old review(s) (>${maxAgeDays}d)`,
      );
    }
  } catch (e) {
    logError(`cleanupOldReviews: ${e.message}`);
  }
}

function initState() {
  const today = new Date().toISOString().slice(0, 10);
  return { date: today, callCount: 0, pendingReviews: [] };
}

function saveState(state) {
  try {
    ensureDirs();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    logError(`saveState: ${e.message}`);
  }
}

function checkDailyLimit(state) {
  if (state.callCount >= DAILY_LIMIT) {
    console.log(
      `[GeminiBridge] Daily limit reached (${state.callCount}/${DAILY_LIMIT}). Skipping.`,
    );
    return false;
  }
  return true;
}

function genReviewId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `review-${ts}-${rand}`;
}

// ─── Git diff 획득 ──────────────────────────────────────────

function getGitDiff(files) {
  try {
    let combinedDiff = "";

    if (files && files.length > 0) {
      for (const f of files) {
        const safe = sanitizePath(f);
        if (!safe) continue;

        // 1) git diff 시도
        try {
          const tracked = execFileSync("git", ["diff", "HEAD", "--", safe], {
            encoding: "utf8",
            timeout: 5_000,
            stdio: "pipe",
          }).trim();
          if (tracked) {
            combinedDiff += tracked + "\n";
            continue;
          }
        } catch (_) {}

        // 2) svn diff 시도 (KiiPS는 SVN 프로젝트)
        try {
          const svnDiff = execFileSync("svn", ["diff", safe], {
            encoding: "utf8",
            timeout: 5_000,
            stdio: "pipe",
          }).trim();
          if (svnDiff) {
            combinedDiff += svnDiff + "\n";
            continue;
          }
        } catch (_) {}

        // 3) 파일 내용 직접 읽기 (fallback)
        try {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, "utf8").slice(0, 4000);
            combinedDiff += `--- /dev/null\n+++ b/${f}\n@@ -0,0 +1 @@\n`;
            combinedDiff +=
              content
                .split("\n")
                .map((l) => "+" + l)
                .join("\n") + "\n";
          }
        } catch (_) {}
      }
      if (combinedDiff.trim()) return combinedDiff.slice(0, 8000);
    }

    // fallback: git diff → svn diff
    try {
      const fallback = execFileSync("git", ["diff", "HEAD"], {
        encoding: "utf8",
        timeout: 10_000,
        stdio: "pipe",
      });
      if (fallback && fallback.trim()) return fallback.slice(0, 8000);
    } catch (_) {
      try {
        const fallback2 = execFileSync("git", ["diff"], {
          encoding: "utf8",
          timeout: 10_000,
          stdio: "pipe",
        });
        if (fallback2 && fallback2.trim()) return fallback2.slice(0, 8000);
      } catch (_) {}
    }

    try {
      const svnFallback = execFileSync("svn", ["diff"], {
        encoding: "utf8",
        timeout: 10_000,
        stdio: "pipe",
      });
      if (svnFallback && svnFallback.trim()) return svnFallback.slice(0, 8000);
    } catch (_) {}

    return "";
  } catch (e) {
    logError(`getGitDiff: ${e.message}`);
    return "";
  }
}

// ─── 코드 샘플 수집 (security 전용) ────────────────────────

const CODE_SAMPLE_LIMIT = 15_000;

function collectSecuritySamples() {
  const samples = [];
  const auditLog = []; // 감사 로그: Gemini로 전송되는 파일 목록 추적
  let totalSize = 0;

  function addFile(filePath, label) {
    if (totalSize >= CODE_SAMPLE_LIMIT) return;
    try {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, "utf8");
      const slice = content.slice(
        0,
        Math.min(content.length, CODE_SAMPLE_LIMIT - totalSize),
      );
      samples.push(`\n--- [${label}] ${filePath} ---\n${slice}`);
      totalSize += slice.length;
      auditLog.push({ file: filePath, label, bytes: slice.length });
    } catch (_) {}
  }

  function findFiles(pattern, maxFiles) {
    try {
      const safePattern = sanitizePath(pattern, { allowGlob: true });
      const safeMax = parseInt(maxFiles, 10) || 10;
      const result = execSync(
        `find . -path "${safePattern}" -type f 2>/dev/null | head -${safeMax}`,
        {
          encoding: "utf8",
          timeout: 10_000,
          stdio: "pipe",
        },
      );
      return result.trim().split("\n").filter(Boolean);
    } catch (_) {
      return [];
    }
  }

  // DAO Java에서 SQL 직접 작성 패턴 수집
  const daoFiles = findFiles("./*/src/main/java/**/*DAO*.java", 20);
  const dangerousDao = [];
  for (const f of daoFiles) {
    try {
      const c = fs.readFileSync(f, "utf8");
      if (
        /\+\s*["'].*(?:WHERE|AND|OR|INSERT|UPDATE|DELETE)/i.test(c) ||
        /String\.format.*(?:WHERE|SELECT)/i.test(c)
      ) {
        dangerousDao.push(f);
      }
    } catch (_) {}
  }
  dangerousDao.slice(0, 5).forEach((f) => addFile(f, "DAO-SQL-RISK"));
  if (dangerousDao.length === 0)
    daoFiles.slice(0, 3).forEach((f) => addFile(f, "DAO"));

  // JSP에서 EL 표현식 사용 파일 (XSS 위험)
  const jspFiles = findFiles(
    "./KiiPS-UI/src/main/webapp/WEB-INF/jsp/**/*.jsp",
    30,
  );
  const xssRisk = [];
  for (const f of jspFiles) {
    try {
      const c = fs.readFileSync(f, "utf8");
      if (/\$\{.*\}/.test(c) && !/fn:escapeXml/.test(c) && !/c:out/.test(c))
        xssRisk.push(f);
    } catch (_) {}
  }
  xssRisk.slice(0, 5).forEach((f) => addFile(f, "JSP-XSS-RISK"));

  // Controller에서 인증/인가 체크 패턴
  const controllers = findFiles("./*/src/main/java/**/*Controller.java", 15);
  controllers.slice(0, 3).forEach((f) => addFile(f, "CONTROLLER"));

  // APIService에서 throws Exception 패턴
  const apiServices = findFiles("./*/src/main/java/**/*APIService.java", 15);
  apiServices.slice(0, 3).forEach((f) => addFile(f, "API-SERVICE"));

  // AUDIT: Gemini API로 전송되는 파일 목록을 로그에 기록 (소스코드 외부 전송 추적)
  if (auditLog.length > 0) {
    try {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: "security_scan_file_collection",
        fileCount: auditLog.length,
        totalBytes: totalSize,
        files: auditLog.map((a) => `[${a.label}] ${a.file} (${a.bytes}B)`),
      };
      const auditFile = path.join(BRIDGE_DIR, "audit.log");
      fs.appendFileSync(auditFile, JSON.stringify(auditEntry) + "\n", "utf8");
    } catch (_) {
      // 감사 로그 기록 실패는 스캔을 차단하지 않음
    }
  }

  return samples.join("\n");
}

// ─── 프롬프트 생성 ─────────────────────────────────────────

function buildReviewPrompt(diff) {
  return `You are reviewing code changes as a 2nd opinion for KiiPS project \
[Spring Boot 2.4.2, Java 8, MyBatis, JSP/jQuery, RealGrid 2.6.3].

Focus ONLY on issues static analysis would miss:
1. Code flow consistency (logic errors, edge cases)
2. Performance at scale (N+1 queries, unnecessary DB calls)
3. Security (MyBatis \${} SQL Injection, JSP XSS, CSRF)
4. Business logic errors
5. KiiPS anti-pattern violations (inline style, raw $.ajax, .dark selector, onclick handler)

Skip: formatting, naming conventions, simple type issues.

Output format (strict):
ISSUES:
- [severity:critical|warning|info] file:line — [WHY] rule/reason — [HOW] specific fix
VERDICT: needs-attention|looks-good (1 sentence)
SUMMARY: (1 sentence)

Every issue MUST include all 3 elements:
- WHERE: file:line (exact location)
- WHY: which rule or principle is violated
- HOW: concrete fix (not "please fix" but "change X to Y")

DIFF:
${diff || "(no diff available)"}`;
}

function buildSecurityScanPrompt() {
  const codeSamples = collectSecuritySamples();

  const prompt = `You are a security auditor reviewing ACTUAL CODE from KiiPS [Spring Boot 2.4.2, Java 8, MyBatis].
Analyze the code below and find:
- SQL Injection: MyBatis \${} usage (should be #{})
- XSS: unescaped EL expressions in JSP (missing fn:escapeXml or c:out)
- CSRF: missing token validation
- Authentication bypass: missing @PreAuthorize or session checks
- Hardcoded secrets: passwords, API keys in source

Output format (strict):
ISSUES:
- [CRITICAL] file:line - description
- [WARNING] file:line - description
- [INFO] file:line - description
VERDICT: needs-attention|looks-good
SUMMARY: (1 sentence)`;

  if (codeSamples) {
    return `${prompt}\n\n========== SOURCE CODE ==========\n${codeSamples}\n========== END SOURCE CODE ==========`;
  }
  return prompt;
}

// ─── Gemini 실행 ────────────────────────────────────────────

function runGemini(prompt, timeoutMs) {
  let bin = GEMINI_BIN;
  if (!fs.existsSync(bin)) {
    try {
      bin = execSync("which gemini", {
        encoding: "utf8",
        timeout: 3000,
      }).trim();
    } catch (_) {
      throw new Error(`Gemini binary not found at ${GEMINI_BIN}`);
    }
  }

  // SECURITY NOTE: sandbox 환경 감지 — Gemini CLI는 네트워크 접근이 필요하므로
  // sandbox 내부에서는 제한될 수 있음. gemini-auto-reviewer 데몬(sandbox 외부)을 권장.
  // 이 함수 자체는 sandbox 환경변수를 삭제하지 않음 (호출자가 판단).
  const isSandboxed = !!(
    process.env.CLAUDE_SANDBOX || process.env.SANDBOX_MODE
  );
  if (isSandboxed) {
    logError(
      "runGemini: Running inside sandbox - network may be restricted. Consider using gemini-auto-reviewer daemon.",
    );
  }

  // 샌드박스 호환 임시 디렉토리: BRIDGE_DIR > TMPDIR > /private/tmp/claude-501 > os.tmpdir()
  const os = require("os");
  const tmpCandidates = [
    BRIDGE_DIR, // 항상 쓰기 가능
    process.env.TMPDIR, // sandbox TMPDIR
    "/private/tmp/claude-501",
    os.tmpdir(),
  ].filter(Boolean);

  let tmpDir = tmpCandidates[0];
  for (const candidate of tmpCandidates) {
    try {
      if (!fs.existsSync(candidate))
        fs.mkdirSync(candidate, { recursive: true });
      // 쓰기 테스트
      const testFile = path.join(candidate, ".write-test");
      fs.writeFileSync(testFile, "test", "utf8");
      fs.unlinkSync(testFile);
      tmpDir = candidate;
      break;
    } catch (_) {
      continue;
    }
  }

  const tmpFile = path.join(tmpDir, `gemini-prompt-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, prompt, "utf8");

    const promptContent = fs.readFileSync(tmpFile, "utf8");
    const result = execFileSync(bin, ["-p", "-"], {
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      input: promptContent,
    });
    return result.trim();
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) {}
  }
}

// ─── 리뷰 저장 및 파싱 ─────────────────────────────────────

function saveReview(id, data) {
  ensureDirs();
  const file = path.join(REVIEWS_DIR, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function parseReviewOutput(raw) {
  const issues = [];

  const re1 = /- \[(severity:)?(critical|warning|info)\]\s+(.+)/gi;
  const re2 =
    /\*?\*?\[(CRITICAL|HIGH|MEDIUM|LOW|WARNING|INFO)\]\*?\*?\s+(.+)/gi;
  const re3 =
    /\d+\.\s+\*?\*?\[(CRITICAL|HIGH|MEDIUM|LOW|WARNING|INFO)\]\s*(.+?)(?:\*\*)?$/gim;

  const severityMap = {
    critical: "critical",
    high: "critical",
    medium: "warning",
    warning: "warning",
    low: "info",
    info: "info",
  };

  let m;
  while ((m = re1.exec(raw)) !== null) {
    issues.push({ severity: m[2].toLowerCase(), text: m[3].trim() });
  }
  if (issues.length === 0) {
    while ((m = re2.exec(raw)) !== null) {
      const sev = severityMap[m[1].toLowerCase()] || "info";
      issues.push({ severity: sev, text: m[2].replace(/\*+/g, "").trim() });
    }
  }
  if (issues.length === 0) {
    while ((m = re3.exec(raw)) !== null) {
      const sev = severityMap[m[1].toLowerCase()] || "info";
      issues.push({ severity: sev, text: m[2].replace(/\*+/g, "").trim() });
    }
  }

  const verdictM = raw.match(/VERDICT:\s*(.+)/i);
  const summaryM = raw.match(/SUMMARY:\s*(.+)/i);
  return {
    issues,
    verdict: verdictM
      ? verdictM[1].trim()
      : issues.some((i) => i.severity === "critical")
        ? "needs-attention"
        : "looks-good",
    summary: summaryM ? summaryM[1].trim() : raw.slice(0, 200),
  };
}

// ─── MODE: review ───────────────────────────────────────────

async function modeReview(files) {
  const state = loadState();
  if (!checkDailyLimit(state)) process.exit(0);

  const diff = getGitDiff(files);
  if (!diff) {
    process.exit(0);
  }

  const id = genReviewId();
  const prompt = buildReviewPrompt(diff);

  saveReview(id, {
    id,
    status: "pending",
    files,
    createdAt: new Date().toISOString(),
    prompt,
  });

  try {
    const raw = runGemini(prompt, TIMEOUT_REVIEW);
    const parsed = parseReviewOutput(raw);
    const hasIssues = parsed.issues.some((i) => i.severity === "critical");

    saveReview(id, {
      id,
      status: "completed",
      files,
      createdAt: new Date().toISOString(),
      raw,
      ...parsed,
      needsAttention:
        hasIssues || parsed.verdict.toLowerCase().includes("needs-attention"),
    });

    state.callCount += 1;
    saveState(state);
  } catch (e) {
    logError(`review(${id}): ${e.message}`);
    saveReview(id, {
      id,
      status: "error",
      files,
      createdAt: new Date().toISOString(),
      error: e.message,
      raw: e.stdout || "",
    });
    process.exit(0);
  }
}

// ─── MODE: scan (security 전용) ─────────────────────────────

async function modeScan() {
  const state = loadState();
  if (!checkDailyLimit(state)) process.exit(0);

  console.log("[GeminiBridge] Starting security scan...");

  const id = genReviewId();
  const prompt = buildSecurityScanPrompt();

  try {
    const raw = runGemini(prompt, TIMEOUT_SCAN);
    const parsed = parseReviewOutput(raw);

    const reviewData = {
      id,
      status: "completed",
      scanType: "security",
      createdAt: new Date().toISOString(),
      raw,
      ...parsed,
      needsAttention: parsed.issues.some((i) => i.severity === "critical"),
    };

    saveReview(id, reviewData);

    // cross-tool coordination 경로에도 저장
    const coordDir = path.join(
      process.cwd(),
      ".temp/coordination/cross-tool/responses",
    );
    if (!fs.existsSync(coordDir)) fs.mkdirSync(coordDir, { recursive: true });
    fs.writeFileSync(
      path.join(coordDir, `gemini-security-${Date.now()}.json`),
      JSON.stringify(reviewData, null, 2),
      "utf8",
    );

    state.callCount += 1;
    saveState(state);

    console.log(`[GeminiBridge] Scan complete: ${id}`);
    console.log(`VERDICT: ${parsed.verdict}`);
    console.log(`SUMMARY: ${parsed.summary}`);
    if (parsed.issues.length > 0) {
      console.log(`\nISSUES (${parsed.issues.length}):`);
      parsed.issues.slice(0, 10).forEach((i) => {
        const icon =
          i.severity === "critical"
            ? "🔴"
            : i.severity === "warning"
              ? "🟡"
              : "🟢";
        console.log(`  ${icon} [${i.severity}] ${i.text}`);
      });
    }
  } catch (e) {
    logError(`scan(security): ${e.message}`);
    console.error(`[GeminiBridge] Scan failed: ${e.message}`);
    process.exit(1);
  }
}

// ─── MODE: status ────────────────────────────────────────────

function modeStatus() {
  const state = loadState();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("GEMINI BRIDGE STATUS (review + security)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Date       : ${state.date}`);
  console.log(`Call count : ${state.callCount} / ${DAILY_LIMIT}`);
  console.log(`Gemini bin : ${GEMINI_BIN}`);
  console.log(`Reviews dir: ${REVIEWS_DIR}`);

  if (fs.existsSync(REVIEWS_DIR)) {
    const files = fs
      .readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith(".json"));
    const completed = [];
    const pending = [];
    files.forEach((f) => {
      try {
        const d = JSON.parse(
          fs.readFileSync(path.join(REVIEWS_DIR, f), "utf8"),
        );
        if (d.status === "completed") completed.push(d);
        else if (d.status === "pending") pending.push(d);
      } catch (_) {}
    });

    console.log(`\nCompleted reviews : ${completed.length}`);
    const unshown = completed.filter((d) => d.status !== "shown");
    console.log(`Unshown reviews   : ${unshown.length}`);
    if (pending.length > 0)
      console.log(`Pending reviews   : ${pending.length}`);

    if (unshown.length > 0) {
      console.log("\nLatest unshown:");
      unshown.slice(-3).forEach((d) => {
        const icon = d.needsAttention ? "!! " : "OK";
        console.log(
          `  ${icon} ${d.id}: ${d.summary || d.verdict || "(no summary)"}`,
        );
      });
    } else {
      console.log("\nNo pending reviews");
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── 진입점 ─────────────────────────────────────────────────

(async () => {
  const [, , mode, ...args] = process.argv;

  // 시작 시 1회만 오래된 리뷰 정리
  cleanupOldReviews(7);

  switch (mode) {
    case "review":
      await modeReview(args);
      break;
    case "scan":
      await modeScan();
      break;
    case "status":
      modeStatus();
      break;
    default:
      console.log(
        "Usage: node gemini-bridge.js <review|scan|status> [args...]",
      );
      console.log("  review [files...]  - 코드 변경 2nd opinion 검증");
      console.log("  scan               - security 보안 취약점 스캔");
      console.log("  status             - 상태 확인");
      process.exit(1);
  }
})();
