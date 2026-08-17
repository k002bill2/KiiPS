/**
 * Permission Gate Hook
 *
 * PreToolUse 게이트로 "사용자 명시 승인" 을 요구하는 민감 작업을 차단.
 *
 * ─── 설계 배경 (2026-04-22, ACE Framework 유산 정리) ─────────
 * 이전 primary-coordinator 에이전트가 담당하던 "배타적 권한" 역할을
 * 에이전트(부탁 수준) 가 아닌 훅(강제 수준) 으로 이관.
 *
 * 커버 영역:
 *   1. 서비스 제어: start.sh, stop.sh, kill -9, pkill, systemctl start/stop/restart
 *   2. 공유 빌드 파일: 모든 pom.xml (모듈 파급 고위험)
 *   3. 프로덕션/스테이징 설정: app-kiips.properties, app-stg.properties, app-production.properties
 *   4. VCS 배포 명령: svn commit (작업 영구 기록)
 *
 * 기존 게이트와의 분담 (중복 없음):
 *   - ethicalValidator.js : 파괴적 작업(rm/DROP/curl|bash)
 *   - multiFileGate.js    : 3+ 파일 동시 변경
 *   - impactAnalyzer.js   : KiiPS-COMMON/UTILS 의미적 영향
 *   - jspXssGuard.js      : JSP XSS
 *   - permissionGate.js   : (본 훅) 서비스 제어 + 공유 빌드 + 프로덕션 설정 + svn commit
 *
 * Rollback:
 *   - 전체 비활성: `KIIPS_PERMISSION_GATE=off`
 *   - AST 필터만 비활성: `KIIPS_PERMISSION_GATE_AST=off` (기존 정규식 동작으로 회귀)
 *
 * AST 필터 (v1.1.0, 2026-04-22):
 *   Bash 패턴 매치 offset 이 shell literal/comment/heredoc 내부이면 skip.
 *   실증 배경 — 본 훅 도입 commit 자체가 자기 훅에 차단됨 (메시지 내 "svn commit"
 *   문자열을 실제 명령으로 오판). ethicalValidator v3.4 에서 입증된 패턴을 재사용.
 *   Bash 도구에만 적용 (Edit/Write file_path 는 shell source 가 아님).
 *
 * Fail-closed:
 *   내부 예외 발생 시 block 유지 (보안 우선).
 *
 * @version 1.1.0 (ast-filter)
 */

"use strict";

const path = require("path");
const tokenizer = require("./shellContextTokenizer");

/**
 * 파일 경로 기반 차단 패턴 (Edit/Write 대상)
 */
const BLOCKED_PATHS = [
  {
    regex: /\/pom\.xml$/,
    reason: "공유 빌드 파일 (pom.xml) 변경은 모듈 파급 고위험",
  },
  { regex: /\/start\.sh$/, reason: "서비스 제어 스크립트 (start.sh) 변경" },
  { regex: /\/stop\.sh$/, reason: "서비스 제어 스크립트 (stop.sh) 변경" },
  { regex: /app-kiips\.properties$/i, reason: "프로덕션 설정 파일 변경" },
  { regex: /app-stg\.properties$/i, reason: "스테이징 설정 파일 변경" },
  { regex: /app-production\.properties$/i, reason: "프로덕션 설정 파일 변경" },
];

/**
 * Bash 명령 기반 차단 패턴
 */
const BLOCKED_BASH_PATTERNS = [
  {
    regex: /(?:^|[\s;&|])(?:\S*\/)?(start|stop)\.sh(?:\s|$|;|&|\|)/,
    reason: "서비스 제어 스크립트 실행",
  },
  { regex: /\bpkill\s+-f\b/, reason: "프로세스 일괄 종료 (pkill -f)" },
  { regex: /\bkill\s+-9\b/, reason: "프로세스 강제 종료 (kill -9)" },
  {
    regex: /\bsystemctl\s+(start|stop|restart)\b/,
    reason: "systemctl 서비스 제어",
  },
  { regex: /\bsvn\s+commit\b/, reason: "SVN commit (영구 기록)" },
];

/**
 * 시크릿/민감 파일 접근 차단 패턴 (Read/Grep/Edit/Write file_path 대상)
 *
 * P0-2026-06-09: permissionRules(비공식 키, inert) 가 담당하던 시크릿 보호를
 * 작동하는 fail-CLOSED 게이트로 이관. Read 축(cat/Read 도구) 무방비 해소.
 */
// 주: app-local.properties 는 로컬 dev 설정(편집 허용 + 로컬 DB 디버깅 시 열람 필요)
// 이므로 read-block 대상에서 의도적으로 제외. 실 크리덴셜(prod/stg/production/tibero)만 차단.
const SECRET_FILE_PATTERNS = [
  { regex: /app-kiips\.properties$/i, reason: "프로덕션 설정 파일 접근" },
  { regex: /app-stg\.properties$/i, reason: "스테이징 설정 파일 접근" },
  { regex: /app-production\.properties$/i, reason: "프로덕션 설정 파일 접근" },
  { regex: /app-tibero\.properties$/i, reason: "Tibero DB 설정 파일 접근" },
  { regex: /(^|\/)\.env(\.[\w.-]+)?$/i, reason: "환경변수 시크릿(.env) 접근" },
  { regex: /credentials(\.[\w.-]+)?$/i, reason: "자격증명 파일 접근" },
  { regex: /\.secret(s)?$/i, reason: "시크릿 파일 접근" },
];

/**
 * Bash 명령에서 시크릿 파일을 읽/복사/전송하려는 시도 차단.
 * AST 필터로 따옴표/주석 내부 문자열 매치는 skip (false-positive 방지).
 * 파일명 토큰을 직접 매칭하므로 cat/less/head/cp/scp/tee 등 동사 무관하게 보호.
 */
const SECRET_BASH_PATTERNS = [
  {
    regex: /app-kiips\.properties/i,
    reason: "Bash 를 통한 프로덕션 설정 파일 접근",
  },
  {
    regex: /app-stg\.properties/i,
    reason: "Bash 를 통한 스테이징 설정 파일 접근",
  },
  {
    regex: /app-production\.properties/i,
    reason: "Bash 를 통한 프로덕션 설정 파일 접근",
  },
  {
    regex: /app-tibero\.properties/i,
    reason: "Bash 를 통한 Tibero DB 설정 파일 접근",
  },
  {
    // 앞 구분자는 반드시 제로폭(lookbehind)이어야 한다. 매치에 포함시키면
    // m.index 가 따옴표(= 리터럴 경계 = 코드)를 가리켜, 아래 AST 필터가
    // 리터럴 내부 매치를 걸러낼 기회를 영영 얻지 못한다.
    // 예: jq -c '.env // {}' 가 파일 접근으로 오탐됐던 원인.
    regex: /(?<=^|[\s=:/'"])\.env(?:\.[\w.-]+)?\b/i,
    reason: "Bash 를 통한 .env 시크릿 접근",
  },
  {
    // `\b` 는 이미 제로폭이라 위와 같은 오프셋 문제가 없다.
    regex: /\bcredentials(?:\.[\w.-]+)?\b/i,
    reason: "Bash 를 통한 자격증명 파일 접근",
  },
];

/**
 * 권한 게이트 검증
 *
 * @param {string} toolName
 * @param {object} toolInput
 * @returns {{blocked: boolean, reason?: string, detail?: string}}
 */
function checkPermission(toolName, toolInput) {
  const t = (toolName || "").toLowerCase();

  if (t === "bash") {
    const cmd = (toolInput && toolInput.command) || "";
    const astFilterEnabled = process.env.KIIPS_PERMISSION_GATE_AST !== "off";

    for (const entry of BLOCKED_BASH_PATTERNS.concat(SECRET_BASH_PATTERNS)) {
      // g flag 를 보장한 복사본으로 매치 순회 (literal/comment 내부 매치는 skip)
      const globalPattern = entry.regex.global
        ? entry.regex
        : new RegExp(entry.regex.source, entry.regex.flags + "g");
      globalPattern.lastIndex = 0;

      let realMatch = null;
      let m;
      while ((m = globalPattern.exec(cmd)) !== null) {
        if (astFilterEnabled) {
          // AST 필터: match offset 이 shell literal/comment/heredoc 내부면 skip
          if (!tokenizer.isRealCodeMatch(cmd, m)) continue;
        }
        realMatch = m;
        break;
      }

      if (realMatch) {
        return {
          blocked: true,
          reason: entry.reason,
          detail: realMatch[0].trim(),
        };
      }
    }
    return { blocked: false };
  }

  if (t === "edit" || t === "write") {
    // Edit/Write 는 기존 계약 유지 (prod/staging/pom/start/stop).
    // 시크릿 파일 Edit/Write 차단은 인라인 python 가드(fail-closed)가 담당하고,
    // app-local 등 로컬 dev 설정 편집은 의도적으로 허용. (Read/Grep 분기에서만 SECRET 차단)
    const fp = (toolInput && toolInput.file_path) || "";
    if (!fp) return { blocked: false };
    for (const entry of BLOCKED_PATHS) {
      if (entry.regex.test(fp)) {
        return {
          blocked: true,
          reason: entry.reason,
          detail: path.basename(fp),
        };
      }
    }
  }

  // Read/Grep: 시크릿 파일 직접 열람/검색 차단 (P0-2026-06-09 Read 축 보호)
  if (t === "read" || t === "grep") {
    const fp = (toolInput && (toolInput.file_path || toolInput.path)) || "";
    if (!fp) return { blocked: false };
    for (const entry of SECRET_FILE_PATTERNS) {
      if (entry.regex.test(fp)) {
        return {
          blocked: true,
          reason: entry.reason,
          detail: path.basename(fp),
        };
      }
    }
  }

  return { blocked: false };
}

/**
 * 차단 메시지 포맷
 */
function formatBlockMessage(result) {
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "🔒 PERMISSION GATE - User Approval Required",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    `❗ ${result.reason}`,
    `   대상: ${result.detail}`,
    "",
    "이 작업은 **사용자 명시 승인** 이 필요합니다.",
    "",
    "진행 방법:",
    "  1. 사용자와 변경 의도·영향 범위를 확인",
    "  2. 필요 시 KIIPS_PERMISSION_GATE=off 환경변수로 게이트 비활성화",
    "  3. 또는 작업을 수동 실행 후 결과 보고",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
  ].join("\n");
}

/**
 * PreToolUse Hook Entry
 */
async function onPreToolUse(event) {
  try {
    if (process.env.KIIPS_PERMISSION_GATE === "off") {
      return { decision: "allow" };
    }
    const result = checkPermission(event.tool_name, event.tool_input || {});
    if (result.blocked) {
      return { decision: "block", message: formatBlockMessage(result) };
    }
    return { decision: "allow" };
  } catch (e) {
    // fail-closed
    return {
      decision: "block",
      message: `[PermissionGate] Internal error - blocking for safety: ${e.message}`,
    };
  }
}

// ─── CLI Entry (stdin JSON) ─────────────────────────────
if (require.main === module) {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", async () => {
    try {
      const input = chunks.join("");
      if (!input.trim()) {
        process.stderr.write(
          "[PermissionGate] Empty input - blocking for safety\n",
        );
        process.exit(2);
      }
      const event = JSON.parse(input);
      const result = await onPreToolUse(event);
      if (result.decision === "block") {
        if (result.message) process.stderr.write(result.message);
        process.exit(2);
      }
      process.exit(0);
    } catch (e) {
      process.stderr.write(
        `[PermissionGate] Parse error - blocking for safety: ${e.message}\n`,
      );
      process.exit(2);
    }
  });
  const timer = setTimeout(() => {
    process.stderr.write(
      "[PermissionGate] stdin timeout - blocking for safety\n",
    );
    process.exit(2);
  }, 10_000);
  process.stdin.on("end", () => clearTimeout(timer));
  process.stdin.resume();
}

module.exports = {
  onPreToolUse,
  checkPermission,
  formatBlockMessage,
  BLOCKED_PATHS,
  BLOCKED_BASH_PATTERNS,
  SECRET_FILE_PATTERNS,
  SECRET_BASH_PATTERNS,
};
