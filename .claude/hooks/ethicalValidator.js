/**
 * Ethical Validator Hook
 * PreToolUse 이벤트에서 실행되어 위험 작업을 사전 차단합니다.
 *
 * ─── 패턴 카테고리 작성 컨벤션 (하네스 엔지니어링) ──────────
 *
 * BLOCKED_OPERATIONS 에 새 카테고리를 추가할 때 반드시 결정할 것:
 *
 * Q: 이 패턴이 셸 명령/스크립트에서만 위험한가, 모든 파일에서 위험한가?
 *
 * - **셸 컨텍스트 전용** (예: rm -rf, curl|bash, ssh user@host)
 *   → `shellContextOnly: true` 추가 필수
 *   → Bash 도구 또는 .sh/.bash 파일에서만 검사
 *   → 마크다운/JSP/Java/JSON 등에 텍스트로 포함돼도 false positive 안 남
 *
 * - **모든 컨텍스트 위험** (예: 하드코딩 API 키, JWT 토큰)
 *   → `shellContextOnly` 생략 (기본값 false)
 *   → 모든 Edit/Write/Bash에서 검사
 *
 * 규칙: 애매하면 `shellContextOnly: true` 시작 → false positive 신고 쌓이면 false로.
 * 이유: false negative(실제 공격 누락)가 false positive(오차단)보다 훨씬 드물지만
 *       반대 방향의 피해 비용은 false positive가 더 큼 (하네스가 개발 막음).
 *
 * 현재 적용 상태:
 *   - remoteExecution: shellContextOnly ✓ (ssh, curl|bash 등)
 *   - filesystem:      shellContextOnly ✓ (rm -rf 등)
 *   - deployment:      생략 (universal) — git push --force 같은 건 SH 파일/Bash 모두 위험
 *   - credentials:     생략 (universal) — 어떤 파일에 하드코딩돼도 유출
 *   - database:        생략 (universal) — SQL migration 파일에도 적용돼야 함
 *
 * @version 3.5.3-KiiPS (ast-filter + .sh edit/write segmented)
 *
 * ─── AST 레이어 (Phase 3, 2026-04-22) ─────────────────────────
 * shellContextOnly 카테고리(filesystem, remoteExecution)는 정규식 매치 후
 * shellContextTokenizer 로 offset이 literal/comment/heredoc 내부인지 판정하여
 * false positive 를 제거합니다.
 *
 * v3.5.3 Issue #2 해결: .sh 계열 파일 Edit/Write 에도 AST 필터 확장.
 * 합성 content 의 state 누출 방지를 위해 `extractShellSegments()` 로 각 필드
 * (command / content / new_string / old_string) 를 독립 세그먼트로 분리, 세그먼트
 * 별로 `tokenizer.isWellFormed()` 확인 후 AST 적용 (unclosed 시 regex-only fallback).
 *
 * Rollback: `KIIPS_VALIDATOR_AST=off` 환경변수로 AST 레이어 즉시 비활성 가능.
 *           비활성 시 기존 정규식 직접 매치 동작으로 회귀.
 */

const path = require("path");
const fs = require("fs");
const tokenizer = require("./shellContextTokenizer");

let SCOPE_CACHE = { value: null, expiresAt: 0 };
const SCOPE_CACHE_TTL_MS = 5000;

function readScopeCached(scopePath) {
  const now = Date.now();
  if (now < SCOPE_CACHE.expiresAt) return SCOPE_CACHE.value;

  let value = null;
  if (fs.existsSync(scopePath)) {
    try {
      value = JSON.parse(fs.readFileSync(scopePath, "utf8"));
    } catch (_) {
      value = null;
    }
  }
  SCOPE_CACHE = { value, expiresAt: now + SCOPE_CACHE_TTL_MS };
  return value;
}

/**
 * 차단된 작업 패턴 (Layer 1 기반)
 */
const BLOCKED_OPERATIONS = {
  database: {
    patterns: [
      /DROP\s+(TABLE|DATABASE|INDEX)/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*(?:WHERE\s+1\s*=\s*1)?$/i, // DELETE without proper WHERE
      /ALTER\s+TABLE.*DROP/i,
      /--\s*production|prod\s*database/i,
    ],
    message: "데이터베이스 구조 변경 또는 대량 삭제는 차단됩니다.",
    severity: "CRITICAL",
  },
  filesystem: {
    patterns: [
      /rm\s+-rf\s+[\/~]/,
      /rmdir\s+\/s\s+\/q/i,
      /del\s+\/f\s+\/s\s+\/q/i,
      /(?:rm|rmdir|del|shred)\s+.*>\s*\/dev\/null/i,
    ],
    message: "시스템 전체 파일 삭제는 차단됩니다.",
    severity: "CRITICAL",
    // shell-context 가드: 비-실행 파일(.md, .json, .java 등)에 위 패턴이 텍스트로
    // 포함되어 있을 때 false positive 방지. Bash 도구 또는 shell script 에서만 검사.
    shellContextOnly: true,
  },
  deployment: {
    patterns: [
      /--force\s+push.*(main|master)/i,
      /git\s+push\s+--force\s+origin\s+(main|master)/i,
      /kubectl\s+delete\s+--all/i,
      /docker\s+system\s+prune\s+-a\s+-f/i,
      /svn\s+revert\s+-R\s+\./i, // SVN 전체 되돌리기
      /svn\s+delete\s+--force/i,
    ],
    message: "강제 배포 또는 전체 삭제 작업은 차단됩니다.",
    severity: "HIGH",
  },
  credentials: {
    patterns: [
      /password\s*=\s*["'][^"']+["']/i,
      /api[_-]?key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/i,
    ],
    message: "하드코딩된 자격 증명은 차단됩니다.",
    severity: "HIGH",
  },
  remoteExecution: {
    patterns: [
      /curl\s+(-X\s+POST\s+|--data\s+)(?!.*localhost)(?!.*127\.0\.0\.1)(?!.*0\.0\.0\.0)/i,
      /wget\s+(?!.*localhost)(?!.*127\.0\.0\.1).*--post/i,
      /ssh\s+\w+@/i,
      /\b(nc|netcat|ncat)\s+-[elp]/i,
      /\|\s*bash\b/i,
      /\bcurl\s+.*\|\s*sh\b/i,
      /\beval\s*\(\s*["'`]\s*\$\(/i,
    ],
    message: "원격 명령 실행은 차단됩니다. localhost 제외.",
    severity: "CRITICAL",
    shellContextOnly: true,
  },
};

/**
 * Shell-context 가드: 패턴을 적용해야 하는 컨텍스트인지 판정
 * - Bash 도구: 항상 true
 * - Edit/Write: file_path 가 실행 가능한 셸 스크립트일 때만 true
 *
 * 마크다운/JSP/Java/JSON 등 비-실행 파일에 셸 패턴이 단순 텍스트로 포함되어
 * 있을 때 false positive 를 방지합니다.
 *
 * 주의: 정규식의 alternation 표기를 피하기 위해 endsWith 체인을 사용합니다
 * (소스 코드에 alternation 패턴이 들어가면 본 validator 자신이 다음 편집을 차단함).
 */
function isShellContext(toolName, toolInput) {
  const t = (toolName || "").toLowerCase();
  if (t === "bash") return true;
  if (t !== "edit" && t !== "write") return false;
  const fp = (toolInput.file_path || "").toLowerCase();
  if (fp.endsWith(".sh")) return true;
  if (fp.endsWith(".bash")) return true;
  if (fp.endsWith(".zsh")) return true;
  if (fp.endsWith(".ksh")) return true;
  if (fp.endsWith(".fish")) return true;
  return false;
}

/**
 * 경고 수준 작업 패턴 (사용자 확인 필요)
 */
const WARNING_OPERATIONS = {
  production: {
    patterns: [
      /app-kiips\.properties/i,
      /production|prod/i,
      /--env\s*(=\s*)?prod/i,
    ],
    message: "프로덕션 환경 변경이 감지되었습니다. 계속하시겠습니까?",
  },
  bulkData: {
    patterns: [
      /UPDATE\s+\w+\s+SET\s+.*WHERE/i,
      /INSERT\s+INTO\s+.*SELECT/i,
      /BATCH\s+INSERT/i,
    ],
    message: "대량 데이터 작업이 감지되었습니다. 백업을 확인하셨습니까?",
  },
  schema: {
    patterns: [/ALTER\s+TABLE/i, /CREATE\s+INDEX/i, /ADD\s+COLUMN/i],
    message: "스키마 변경 작업입니다. DBA 승인이 필요할 수 있습니다.",
  },
  configFiles: {
    patterns: [
      /app-kiips\.properties/i,
      /app-stg\.properties/i,
      /\.env\.production/i,
    ],
    message: "프로덕션/스테이징 설정 파일 변경입니다. 검토 후 진행하세요.",
  },
  mavenBuild: {
    patterns: [/mvn\s+.*-DskipTests/i, /mvn\s+clean\s+deploy/i],
    message: "Maven 빌드 주의: 테스트 스킵 또는 배포 명령입니다.",
  },
};

/**
 * KiiPS 서비스 모듈 보호 패턴
 */
const PROTECTED_MODULES = [
  "KiiPS-HUB",
  "KiiPS-COMMON",
  "KiiPS-UTILS",
  "KiiPS-APIGateway",
  "KiiPS-Login",
];

/**
 * scope-state.json을 로드해 현재 파일이 초기 요청 범위 내인지 확인
 * - scope 없음 / 만료(30분) / expanded=true → 항상 inScope
 * - .claude/ 내부 파일 → 항상 inScope
 * - Bash 도구 → 검사 안 함
 *
 * @param {string} filePath - 편집/쓰기 대상 파일 경로
 * @returns {{ inScope: boolean, message?: string }}
 */
function checkScopeExpansion(filePath) {
  try {
    const scopePath = path.join(__dirname, "../state/.scope-state.json");

    // .claude/ 내부 파일은 항상 허용
    if (filePath.includes("/.claude/") || filePath.includes("\\.claude\\")) {
      return { inScope: true };
    }

    const scope = readScopeCached(scopePath);
    if (!scope) return { inScope: true };

    // 만료 또는 이미 확장된 scope
    const ageMs = Date.now() - (scope.capturedAt || 0);
    if (scope.expanded || ageMs >= 30 * 60 * 1000) return { inScope: true };

    // scope에 파일/모듈이 아무것도 없으면 검사 생략
    const hasFiles = scope.files && scope.files.length > 0;
    const hasModules = scope.modules && scope.modules.length > 0;
    if (!hasFiles && !hasModules) return { inScope: true };

    // 모듈 경로 포함 여부
    if (hasModules) {
      for (const mod of scope.modules) {
        if (filePath.includes(mod)) return { inScope: true };
      }
    }

    // 파일 경로 일치 여부
    if (hasFiles) {
      for (const f of scope.files) {
        if (filePath.includes(f) || filePath.endsWith(path.sep + f)) {
          return { inScope: true };
        }
      }
    }

    return {
      inScope: false,
      message: `Scope expansion detected: "${filePath}" is outside the initial request scope (modules: ${(scope.modules || []).join(", ") || "none"}).`,
    };
  } catch (_) {
    return { inScope: true };
  }
}

/**
 * 윤리적 검증 수행
 *
 * @param {string} toolName - 실행할 도구 이름
 * @param {object} toolInput - 도구 입력 파라미터
 * @param {object} context - 실행 컨텍스트
 * @returns {object} 검증 결과 { allowed: boolean, message?: string, warnings?: string[] }
 */
function validateEthically(toolName, toolInput, context) {
  const result = {
    allowed: true,
    warnings: [],
    blockedReasons: [],
    layer: "Layer 1 (Aspirational)",
    timestamp: new Date().toISOString(),
  };

  // 입력 내용 추출
  const content = extractContent(toolName, toolInput);
  if (!content) {
    return result;
  }

  // 1. 차단 패턴 검사 (CRITICAL)
  const inShellContext = isShellContext(toolName, toolInput);
  const astFilterEnabled = process.env.KIIPS_VALIDATOR_AST !== "off";
  // v3.5.3 Issue #2: shellContextOnly 카테고리는 깨끗한 세그먼트 배열에서 독립 검사.
  // Edit 은 [new_string, old_string] 두 세그먼트 모두 검사 (회귀 가드
  // sh-edit-unclosed-quote-regression: old_string 의 위험 패턴도 차단 유지).
  const shellSegments = extractShellSegments(toolName, toolInput);
  for (const [category, config] of Object.entries(BLOCKED_OPERATIONS)) {
    // shell-context 가드: shellContextOnly 카테고리는 Bash/스크립트에서만 검사
    if (config.shellContextOnly && !inShellContext) continue;

    // shellContextOnly 카테고리: 깨끗한 세그먼트 배열에서만 매칭 & AST 필터.
    // 비-shellContextOnly 는 기존 합성 content 유지 (넓은 prose 탐색 범위).
    const matchTargets = config.shellContextOnly ? shellSegments : [content];

    for (const target of matchTargets) {
      if (!target) continue;

      // 세그먼트별 AST 적용 조건:
      //   shellContextOnly + astFilterEnabled + 세그먼트 well-formed.
      // unclosed quote/heredoc 세그먼트는 regex-only fallback (fail-closed) —
      // state 누출 false-negative 공격을 구조적으로 차단.
      const applyAst =
        config.shellContextOnly &&
        astFilterEnabled &&
        tokenizer.isWellFormed(target);

      for (const pattern of config.patterns) {
        const globalPattern = pattern.global
          ? pattern
          : new RegExp(pattern.source, pattern.flags + "g");
        globalPattern.lastIndex = 0;

        let realMatch = null;
        let m;
        while ((m = globalPattern.exec(target)) !== null) {
          if (applyAst) {
            if (!tokenizer.isRealCodeMatch(target, m)) continue;
          }
          realMatch = m;
          break;
        }

        if (realMatch) {
          result.allowed = false;
          result.blockedReasons.push({
            category,
            severity: config.severity,
            message: config.message,
            pattern: pattern.toString(),
          });
        }
      }
    }
  }

  // 2. 경고 패턴 검사 (WARNING)
  for (const [category, config] of Object.entries(WARNING_OPERATIONS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(content)) {
        result.warnings.push({
          category,
          message: config.message,
        });
      }
    }
  }

  // 3. 보호된 모듈 접근 검사
  const moduleAccess = checkProtectedModuleAccess(toolName, toolInput, context);
  if (moduleAccess.restricted) {
    result.warnings.push({
      category: "protected_module",
      message: moduleAccess.message,
    });
  }

  // 4. Scope 확장 검사 (Edit/Write 전용, 소프트 경고)
  if (["edit", "write"].includes(toolName.toLowerCase())) {
    const filePath = toolInput.file_path || "";
    if (filePath) {
      const scopeCheck = checkScopeExpansion(filePath);
      if (!scopeCheck.inScope) {
        result.warnings.push({
          category: "scope_expansion",
          message: scopeCheck.message,
        });
      }
    }
  }

  return result;
}

/**
 * Shell-context 매칭용 깨끗한 세그먼트 배열 (v3.5.3, Issue #2 해결).
 *
 * extractContent 가 합성하는 `new_string+old_string+file_path` 를 그대로 AST 필터에
 * 넣으면, 공격자가 new_string 의 unclosed quote 로 뒤이은 old_string 의 위험 패턴을
 * DQUOTE 내부로 오판시켜 skip 시키는 state 누출 공격이 가능.
 *
 * 해결: 각 필드를 독립 세그먼트로 분리하여 tokenizer state 를 세그먼트 경계에서
 * 초기화. 호출부에서 `tokenizer.isWellFormed()` 로 완결성 확인 후 AST 적용, unclosed
 * 세그먼트는 regex-only fallback (fail-closed).
 *
 * 세그먼트 구성:
 *   - Bash:  [command]
 *   - Write: [content]            (file_path 제외 — shell source 아님)
 *   - Edit:  [new_string, old_string]
 *            (old_string 포함 이유: 회귀 가드 sh-edit-unclosed-quote-regression.
 *             파일에 실제 존재했던 위험 패턴이므로 엄격 차단 기준 유지.)
 */
function extractShellSegments(toolName, toolInput) {
  const t = (toolName || "").toLowerCase();
  if (t === "bash") return [toolInput.command || ""];
  if (t === "write") return [toolInput.content || ""];
  if (t === "edit")
    return [toolInput.new_string || "", toolInput.old_string || ""];
  return [];
}

/**
 * 도구 입력에서 검증할 내용 추출 (WARNING + 비-shellContextOnly 용도).
 *
 * 합성 content 는 넓은 prose 탐색 용도. shell AST 와 호환되지 않으므로
 * shellContextOnly 카테고리는 extractShellSegments 를 사용.
 */
function extractContent(toolName, toolInput) {
  switch (toolName.toLowerCase()) {
    case "bash":
      return toolInput.command || "";
    case "write":
      return (toolInput.content || "") + " " + (toolInput.file_path || "");
    case "edit":
      return (
        (toolInput.new_string || "") +
        " " +
        (toolInput.old_string || "") +
        " " +
        (toolInput.file_path || "")
      );
    case "read":
    case "glob":
    case "grep":
      return toolInput.file_path || toolInput.pattern || "";
    default:
      return JSON.stringify(toolInput);
  }
}

/**
 * 보호된 모듈 접근 검사
 *
 * 2026-04-22: ACE Framework 제거로 primary-coordinator agent 삭제됨.
 * 이전 "Primary Coordinator만 수정 가능" 규칙은 dead code.
 * 대체 정책: 경고만 발동 + impactAnalyzer.js 가 의미적 영향 별도 분석.
 * 추가 고위험 모듈 변경은 multiFileGate + 사용자 명시 승인에 위임.
 */
function checkProtectedModuleAccess(toolName, toolInput, _context) {
  // 편집/쓰기 작업에서만 검사
  if (!["edit", "write"].includes(toolName.toLowerCase())) {
    return { restricted: false };
  }

  const filePath = toolInput.file_path || "";

  for (const moduleName of PROTECTED_MODULES) {
    if (filePath.includes(moduleName)) {
      return {
        restricted: true,
        message: `고위험 모듈 변경: ${moduleName} (${path.basename(filePath)}). 의존 모듈 영향 분석 + 사용자 승인 권장.`,
      };
    }
  }

  return { restricted: false };
}

/**
 * 검증 결과를 사용자 메시지로 포맷
 */
function formatValidationResult(result) {
  if (result.allowed && result.warnings.length === 0) {
    return null; // 문제 없음
  }

  let message = "";

  if (!result.allowed) {
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "🛑 ETHICAL VETO - Layer 1 Violation\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    for (const reason of result.blockedReasons) {
      message += `❌ [${reason.severity}] ${reason.category}\n`;
      message += `   ${reason.message}\n\n`;
    }

    message += "**대안:**\n";
    message += "• 스테이징 환경에서 먼저 테스트\n";
    message += "• 백업 후 진행\n";
    message += "• DBA/관리자 승인 후 수동 실행\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  }

  if (result.warnings.length > 0) {
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "⚠️  ETHICAL WARNING - Review Required\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    for (const warning of result.warnings) {
      message += `⚠️  [${warning.category}] ${warning.message}\n`;
    }

    message += "\n진행하시겠습니까? (Y/N)\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  }

  return message;
}

/**
 * PreToolUse Hook Entry Point
 *
 * @param {object} event - Hook 이벤트 객체
 * @returns {object} { decision: 'allow'|'block', message?: string }
 */
async function onPreToolUse(event) {
  try {
    const { tool_name, tool_input } = event;
    const context = {
      agentId: event.agent_id || process.env.CLAUDE_AGENT_ID || "default-agent",
      workspaceRoot: event.workspace_root || process.cwd(),
    };

    const validationResult = validateEthically(tool_name, tool_input, context);

    if (!validationResult.allowed) {
      return {
        decision: "block",
        message: formatValidationResult(validationResult),
      };
    }

    if (validationResult.warnings.length > 0) {
      // 경고가 있어도 일단 허용, 메시지만 표시
      console.log(formatValidationResult(validationResult));
    }

    return { decision: "allow" };
  } catch (error) {
    console.error("[EthicalValidator] Error:", error.message);
    // 에러 발생 시 안전하게 차단 (fail-close)
    return {
      decision: "block",
      message: `[EthicalValidator] Internal error - blocking for safety: ${error.message}`,
    };
  }
}

// ─── CLI Entry Point (stdin JSON 파싱) ───────────────────────
if (require.main === module) {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", async () => {
    try {
      const input = chunks.join("");
      if (!input.trim()) {
        // 빈 입력 → 안전하게 차단 (fail-closed)
        process.stderr.write(
          "[EthicalValidator] Empty input - blocking for safety\n",
        );
        process.exit(2);
      }
      const event = JSON.parse(input);
      const result = await onPreToolUse(event);
      if (result.decision === "block") {
        if (result.message) process.stderr.write(result.message);
        process.exit(2); // exit 2 = block
      }
      process.exit(0); // exit 0 = allow
    } catch (e) {
      // JSON 파싱 실패 또는 기타 에러 → fail-closed (차단)
      // 악의적 입력으로 안전 검사 우회 방지
      process.stderr.write(
        `[EthicalValidator] Parse error - blocking for safety: ${e.message}\n`,
      );
      process.exit(2);
    }
  });
  // stdin 미수신 시 안전 타임아웃 (fail-closed)
  const safetyTimer = setTimeout(() => {
    process.stderr.write(
      "[EthicalValidator] stdin timeout - blocking for safety\n",
    );
    process.exit(2);
  }, 10_000);
  process.stdin.on("end", () => clearTimeout(safetyTimer));
  process.stdin.resume();
}

// Export for Claude Code Hook system
module.exports = {
  onPreToolUse,
  validateEthically,
  formatValidationResult,
  checkScopeExpansion,
  BLOCKED_OPERATIONS,
  WARNING_OPERATIONS,
  PROTECTED_MODULES,
};
