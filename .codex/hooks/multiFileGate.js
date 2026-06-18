/**
 * Multi-File Change Gate Hook
 * PreToolUse 이벤트에서 실행되어 세션 내 다중 파일 편집을 추적하고
 * anti-rationalization 규칙(CLAUDE.md) 위반 시 경고를 출력합니다.
 *
 * - exit(0) always: WARN gate, never blocks
 * - Fail-open: any error → exit(0)
 *
 * @version 1.0.0-KiiPS
 */

"use strict";

const fs = require("fs");
const path = require("path");

/** 경고를 발생시킬 고유 파일 수 임계값 */
const THRESHOLD = 3;

const STATE_FILE =
  "/Users/younghwankang/WORK/WORKSPACE/KiiPS/.claude/state/.session-edits.json";

/** 세션 스탈니스 판정 기준 (30분, ms) */
const STALE_MS = 30 * 60 * 1000;

/**
 * 상태 파일 로드. 파일이 없으면 빈 상태 반환.
 * @returns {{ files: string[], lastEdit: number, approved: boolean, sessionId: string }}
 */
function loadState() {
  const defaults = { files: [], lastEdit: 0, approved: false, sessionId: "" };
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (_) {
    return defaults;
  }
}

/**
 * 상태 파일 저장.
 * @param {{ files: string[], lastEdit: number, approved: boolean, sessionId: string }} state
 */
function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

/**
 * 박스 경고 메시지 생성.
 * @param {string[]} files - 현재 세션에서 편집된 파일 목록 (full path)
 * @param {string} newFile - 이번에 새로 추가된 파일 (full path)
 * @returns {string}
 */
function buildWarning(files, newFile) {
  const n = files.length;
  const lines = [];

  lines.push("");
  lines.push("┌─── MULTI-FILE CHANGE GATE ─────────────────────┐");
  lines.push(`│ ${n} unique files modified in this session.`.padEnd(51) + "│");
  lines.push("│                                                  │");
  lines.push("│ Modified files:                                  │");

  files.forEach((f, i) => {
    const base = path.basename(f);
    const isNew = f === newFile;
    const label = isNew ? `  ${i + 1}. ${base}  (NEW)` : `  ${i + 1}. ${base}`;
    lines.push(("│" + label).padEnd(51) + "│");
  });

  lines.push("│                                                  │");
  lines.push("│ Per anti-rationalization rules (CLAUDE.md),      │");
  lines.push("│ 3+ file changes need user approval.              │");
  lines.push("│                                                  │");
  lines.push(`│ Ask user: "I need to modify ${n} files.`.padEnd(51) + "│");
  lines.push('│ Should I continue?"'.padEnd(51) + "│");
  lines.push("│                                                  │");
  lines.push('│ User can say "approve multi-file" to suppress.   │');
  lines.push("└──────────────────────────────────────────────────┘");
  lines.push("");

  return lines.join("\n");
}

/**
 * Multi-file gate 핵심 로직.
 * 세션 상태를 추적하고 임계값 초과 시 stderr에 경고를 기록합니다.
 *
 * @param {string} filePath - 편집 대상 파일의 절대 경로
 * @returns {void}
 */
function checkMultiFile(filePath) {
  // .claude/ 내부 파일 무시 (훅 상태 파일 등)
  if (filePath.includes("/.claude/")) {
    return;
  }

  const now = Date.now();
  let state = loadState();

  // 세션 스탈니스 검사: 마지막 편집이 30분 이상 전이면 초기화
  if (state.lastEdit && now - state.lastEdit > STALE_MS) {
    state = { files: [], lastEdit: 0, approved: false, sessionId: "" };
    saveState(state);
    return;
  }

  // 최초 편집이면 sessionId 설정
  if (!state.sessionId) {
    state.sessionId = String(now);
  }

  // 이미 승인된 세션이면 파일만 추적하고 종료
  if (state.approved === true) {
    if (!state.files.includes(filePath)) {
      state.files.push(filePath);
    }
    state.lastEdit = now;
    saveState(state);
    return;
  }

  // 동일 파일 재편집이면 타임스탬프만 갱신
  if (state.files.includes(filePath)) {
    state.lastEdit = now;
    saveState(state);
    return;
  }

  // 새 파일 추가
  state.files.push(filePath);
  state.lastEdit = now;
  saveState(state);

  // 임계값 이상이면 경고 출력
  if (state.files.length >= THRESHOLD) {
    process.stderr.write(buildWarning(state.files, filePath));
  }
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
        process.exit(0);
      }

      const event = JSON.parse(input);
      const toolName = event.tool_name || "";
      const toolInput = event.tool_input || {};

      // Edit 또는 Write 도구만 처리
      if (!["Edit", "Write"].includes(toolName)) {
        process.exit(0);
      }

      const filePath = toolInput.file_path;
      if (!filePath) {
        process.exit(0);
      }

      checkMultiFile(filePath);
    } catch (_) {
      // Fail-open: 어떤 에러도 차단하지 않음
    }
    process.exit(0);
  });
  process.stdin.resume();
}

module.exports = { checkMultiFile, THRESHOLD };
