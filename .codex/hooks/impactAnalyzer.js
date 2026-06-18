/**
 * Impact Analyzer Hook
 *
 * KiiPS-COMMON/ 또는 KiiPS-UTILS/ Java 파일 변경 시:
 * - 해당 클래스를 참조하는 도메인 모듈 개수 분석
 * - 5개 이상 모듈에서 참조 시 사용자 명시 승인 게이트 (경고)
 *
 * - exit(0) always: WARN gate, never blocks (multiFileGate.js 패턴)
 * - Fail-open: 모든 에러 → exit(0)
 *
 * @version 1.0.0-KiiPS
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SHARED_MODULE_PATTERN = /(KiiPS-COMMON|KiiPS-UTILS)\//;
const STATE_FILE = path.join(
  PROJECT_ROOT,
  ".claude/state/.impact-analysis.json",
);
const NOTIFY_INTERVAL_MS = 30 * 60 * 1000; // 동일 파일 30분에 한 번만 알림
const REFERENCE_THRESHOLD = 5; // 5개 모듈 이상 참조 시 경고

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (_) {
    return { notified: {} };
  }
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (_) {}
}

/**
 * Java 파일 경로에서 클래스명 추출
 * @param {string} filePath - 절대 경로
 * @returns {string|null} 클래스명 (basename without .java)
 */
function extractClassName(filePath) {
  if (!filePath.endsWith(".java")) return null;
  const baseName = path.basename(filePath, ".java");
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(baseName)) return null;
  return baseName;
}

/**
 * KiiPS-* 모듈 디렉토리 중 해당 클래스를 참조하는 모듈 식별
 * @param {string} className
 * @returns {string[]} 참조 모듈 디렉토리 이름 목록
 */
function findReferencingModules(className) {
  const referenced = new Set();
  try {
    // ripgrep 우선, 없으면 grep fallback
    let cmd = "";
    try {
      execSync("which rg", { stdio: "ignore" });
      cmd = `rg -l --no-ignore -g '!.claude' -g '*.java' '\\b${className}\\b' "${PROJECT_ROOT}"`;
    } catch (_) {
      cmd = `grep -rl --include='*.java' --exclude-dir=.claude '\\b${className}\\b' "${PROJECT_ROOT}"`;
    }

    const output = execSync(cmd, {
      timeout: 8000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    output
      .split("\n")
      .filter(Boolean)
      .forEach((p) => {
        const m = p.match(/(KiiPS-[A-Z]+|KIIPS-[A-Z]+)/);
        if (m) referenced.add(m[1]);
      });
  } catch (_) {
    // grep returns exit 1 when no matches; fail-open
  }

  // 자기 자신 모듈은 제외
  return Array.from(referenced);
}

/**
 * 변경된 공유 모듈 파일에 대한 영향 분석 + 경고
 */
function analyzeImpact(filePath) {
  // 공유 모듈 파일이 아니면 패스
  if (!SHARED_MODULE_PATTERN.test(filePath)) return;
  if (!filePath.endsWith(".java")) return;

  const className = extractClassName(filePath);
  if (!className) return;

  // 알림 중복 방지 (30분 인터벌)
  const state = loadState();
  const lastNotified = (state.notified || {})[filePath] || 0;
  if (Date.now() - lastNotified < NOTIFY_INTERVAL_MS) return;

  const modules = findReferencingModules(className);
  // 자기 모듈만 매치된 경우 (실질 외부 참조 없음) → 경고 불필요
  const ownModule = filePath.match(/(KiiPS-[A-Z]+|KIIPS-[A-Z]+)/);
  const externalModules = modules.filter(
    (m) => !ownModule || m !== ownModule[1],
  );

  if (externalModules.length < REFERENCE_THRESHOLD) {
    // 임계값 미만이면 알림하지 않지만 시각은 갱신 (반복 검사 방지)
    state.notified = state.notified || {};
    state.notified[filePath] = Date.now();
    saveState(state);
    return;
  }

  // 경고 출력 (multiFileGate 스타일 박스)
  const lines = [];
  lines.push("");
  lines.push("┌─── IMPACT ANALYSIS — SHARED MODULE GATE ─────────┐");
  lines.push(`│ Class: ${className}`.padEnd(51) + "│");
  lines.push(`│ Modified file: ${path.basename(filePath)}`.padEnd(51) + "│");
  lines.push(
    `│ Referenced by ${externalModules.length} modules`.padEnd(51) + "│",
  );
  lines.push("│                                                  │");
  lines.push("│ Affected modules:                                │");
  externalModules.slice(0, 8).forEach((m) => {
    lines.push(`│   - ${m}`.padEnd(51) + "│");
  });
  if (externalModules.length > 8) {
    lines.push(
      `│   ... and ${externalModules.length - 8} more`.padEnd(51) + "│",
    );
  }
  lines.push("│                                                  │");
  lines.push("│ Per Golden Principle #1 (Immutability):          │");
  lines.push("│   - 시그니처 변경 금지, 새 메서드 추가로 확장      │");
  lines.push("│   - 사용자 명시 승인 필요                         │");
  lines.push("│                                                  │");
  lines.push("│ Reference: KiiPS-COMMON/CLAUDE.md                │");
  lines.push("└──────────────────────────────────────────────────┘");
  lines.push("");

  process.stderr.write(lines.join("\n"));

  state.notified = state.notified || {};
  state.notified[filePath] = Date.now();
  saveState(state);
}

// ─── CLI Entry Point (multiFileGate.js 패턴) ──────────────────
if (require.main === module) {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => {
    try {
      const input = chunks.join("");
      if (!input.trim()) process.exit(0);
      const event = JSON.parse(input);
      const toolName = event.tool_name || "";
      const toolInput = event.tool_input || {};
      if (!["Edit", "Write"].includes(toolName)) process.exit(0);
      const filePath = toolInput.file_path;
      if (!filePath) process.exit(0);
      analyzeImpact(filePath);
    } catch (_) {
      // fail-open
    }
    process.exit(0);
  });
  process.stdin.resume();
}

module.exports = {
  analyzeImpact,
  extractClassName,
  findReferencingModules,
  REFERENCE_THRESHOLD,
};
