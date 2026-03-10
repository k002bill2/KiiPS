/**
 * Continuous Learning Observer Hook
 * PostToolUse 이벤트에서 도구 사용 패턴을 수집합니다.
 *
 * Forge의 observe.sh를 KiiPS 환경에 맞게 JS로 재구현.
 * 수집된 데이터는 background observer 또는 /learn --from-session에서 분석합니다.
 *
 * @version 1.0.0-KiiPS
 *
 * Hook trigger: PostToolUse (모든 도구)
 * Exit codes: 0 = 항상 허용 (관찰만, 차단 없음)
 */

const fs = require("fs");
const path = require("path");

// ─── 설정 ───────────────────────────────────────
const CONFIG = {
  observationsFile: path.join(
    process.cwd(),
    ".claude",
    "learning",
    "observations.jsonl",
  ),
  healthFile: path.join(
    process.cwd(),
    ".claude",
    "learning",
    "observer-health.json",
  ),
  maxFileSizeMB: 10,
  archiveDir: path.join(process.cwd(), ".claude", "learning", "archive"),
  // 관찰하지 않을 도구 (노이즈 감소)
  skipTools: ["Glob", "LS", "Read", "Grep"],
  // 입력/출력 최대 길이 (토큰 절약)
  maxInputLength: 2000,
  maxOutputLength: 1000,
  // 런타임 모니터링
  healthCheckIntervalMs: 60000,
};

// ─── KiiPS 도메인 감지 ───────────────────────────────────────

const DOMAIN_PATTERNS = [
  {
    domain: "mybatis-pattern",
    patterns: [
      /mapper\.xml/i,
      /mybatis/i,
      /#{|$\{/i,
      /sqlSession/i,
      /<select|<insert|<update|<delete/i,
    ],
  },
  {
    domain: "realgrid-pattern",
    patterns: [
      /realgrid/i,
      /GridView|DataProvider/i,
      /setColumns|setFields/i,
      /gridExport/i,
    ],
  },
  {
    domain: "build-pattern",
    patterns: [/mvn\s/i, /maven/i, /pom\.xml/i, /BUILD\s+(SUCCESS|FAILURE)/i],
  },
  {
    domain: "security-pattern",
    patterns: [
      /XSS|CSRF|injection/i,
      /password|credential|secret/i,
      /Spring\s*Security/i,
    ],
  },
  {
    domain: "jsp-pattern",
    patterns: [/\.jsp/i, /<%|%>/i, /JSTL|taglib/i, /inc_filter|inc_main/i],
  },
  {
    domain: "scss-pattern",
    patterns: [/\.scss/i, /data-theme.*dark/i, /\$dark-/i, /sass/i],
  },
  {
    domain: "api-pattern",
    patterns: [
      /Controller|RestController/i,
      /RequestMapping|GetMapping/i,
      /ResponseEntity/i,
    ],
  },
  {
    domain: "error-pattern",
    patterns: [/Exception|Error|FAIL/i, /stack\s*trace/i, /NullPointer/i],
  },
];

// ─── 파일 경로 기반 도메인 감지 ───────────────────────────────────────

const FILE_PATH_DOMAINS = [
  {
    domain: "mybatis-pattern",
    patterns: [/mapper\.xml$/i, /Mapper\.java$/i, /DAO\.java$/i, /Dao\.java$/i],
  },
  { domain: "jsp-pattern", patterns: [/\.jsp$/i] },
  { domain: "scss-pattern", patterns: [/\.scss$/i, /\.sass$/i] },
  {
    domain: "api-pattern",
    patterns: [/Controller\.java$/i, /Service\.java$/i],
  },
  { domain: "build-pattern", patterns: [/pom\.xml$/i, /\.properties$/i] },
  { domain: "realgrid-pattern", patterns: [/realgrid/i, /grid/i] },
  {
    domain: "security-pattern",
    patterns: [/Security\.java$/i, /Auth\.java$/i],
  },
];

/**
 * 파일 경로에서 도메인 감지
 */
function detectDomainsFromPath(filePath) {
  if (!filePath) return [];
  const domains = new Set();
  for (const { domain, patterns } of FILE_PATH_DOMAINS) {
    for (const pattern of patterns) {
      if (pattern.test(filePath)) {
        domains.add(domain);
        break;
      }
    }
  }
  return Array.from(domains);
}

/**
 * Bash 명령어에서 파일 경로 추출
 */
function extractPathsFromCommand(command) {
  if (!command) return [];
  const paths = [];
  // 일반적인 파일 경로 패턴 (확장자 있는 것만)
  const pathMatches = command.match(/[\w./-]+\.\w{1,5}/g);
  if (pathMatches) paths.push(...pathMatches);
  return paths;
}

/**
 * Bash 명령어 패턴에서 도메인 감지
 */
const BASH_COMMAND_DOMAINS = [
  {
    domain: "build-pattern",
    patterns: [/\bmvn\b/, /\bmaven\b/, /\bnpm\b/, /\bgradle\b/],
  },
  { domain: "build-pattern", patterns: [/\bjava\b/, /\bjavac\b/] },
  {
    domain: "scss-pattern",
    patterns: [/\bsass\b/, /\bnode-sass\b/, /\bsass-loader\b/],
  },
];

function detectDomainsFromCommand(command) {
  if (!command) return [];
  const domains = new Set();
  for (const { domain, patterns } of BASH_COMMAND_DOMAINS) {
    for (const pattern of patterns) {
      if (pattern.test(command)) {
        domains.add(domain);
        break;
      }
    }
  }
  // 명령어 내 파일 경로에서도 도메인 감지
  const paths = extractPathsFromCommand(command);
  for (const p of paths) {
    for (const d of detectDomainsFromPath(p)) {
      domains.add(d);
    }
  }
  return Array.from(domains);
}

/**
 * 텍스트에서 KiiPS 도메인 감지
 */
function detectDomains(text) {
  const domains = new Set();
  for (const { domain, patterns } of DOMAIN_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        domains.add(domain);
        break;
      }
    }
  }
  return Array.from(domains);
}

/**
 * 텍스트를 최대 길이로 자르기
 */
function truncate(text, maxLen) {
  if (!text) return "";
  const str = typeof text === "string" ? text : JSON.stringify(text);
  return str.length > maxLen
    ? str.substring(0, maxLen) + "...[truncated]"
    : str;
}

// ─── 런타임 모니터링 ───────────────────────────────────────

const HEALTH = {
  totalEvents: 0,
  recordedEvents: 0,
  skippedEvents: 0,
  droppedEvents: 0,
  errors: [],
  lastEventAt: null,
  startedAt: new Date().toISOString(),
};

/**
 * 헬스 상태 저장 (주기적으로 호출)
 */
function saveHealthStatus() {
  try {
    const dir = path.dirname(CONFIG.healthFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const health = {
      ...HEALTH,
      updatedAt: new Date().toISOString(),
      dropRate:
        HEALTH.totalEvents > 0
          ? ((HEALTH.droppedEvents / HEALTH.totalEvents) * 100).toFixed(1) + "%"
          : "0%",
      observationsFileExists: fs.existsSync(CONFIG.observationsFile),
      observationsFileSizeKB: fs.existsSync(CONFIG.observationsFile)
        ? Math.round(fs.statSync(CONFIG.observationsFile).size / 1024)
        : 0,
      lastErrors: HEALTH.errors.slice(-5),
    };
    delete health.errors;
    fs.writeFileSync(CONFIG.healthFile, JSON.stringify(health, null, 2));
  } catch {
    // 헬스 저장 실패 — 무시
  }
}

/**
 * 관찰 기록 저장
 */
function saveObservation(observation) {
  try {
    // 디렉토리 확인
    const dir = path.dirname(CONFIG.observationsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 파일 크기 확인 → 아카이브
    if (fs.existsSync(CONFIG.observationsFile)) {
      const stats = fs.statSync(CONFIG.observationsFile);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB >= CONFIG.maxFileSizeMB) {
        if (!fs.existsSync(CONFIG.archiveDir)) {
          fs.mkdirSync(CONFIG.archiveDir, { recursive: true });
        }
        const archiveName = `observations-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
        fs.renameSync(
          CONFIG.observationsFile,
          path.join(CONFIG.archiveDir, archiveName),
        );
      }
    }

    // JSONL로 append
    fs.appendFileSync(
      CONFIG.observationsFile,
      JSON.stringify(observation) + "\n",
    );

    // 모니터링: 성공 카운트
    HEALTH.recordedEvents++;
    HEALTH.lastEventAt = new Date().toISOString();
  } catch (err) {
    // 모니터링: 실패 카운트 + 에러 기록
    HEALTH.droppedEvents++;
    HEALTH.errors.push({
      at: new Date().toISOString(),
      msg: err.message || "unknown",
    });
    if (HEALTH.errors.length > 20) HEALTH.errors = HEALTH.errors.slice(-10);
  }
}

// ─── CLI Entry Point ───────────────────────────────────────

if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", () => {
    try {
      const event = JSON.parse(input);
      const toolName = event.tool_name || "unknown";

      // 모니터링: 총 이벤트 카운트
      HEALTH.totalEvents++;

      // 노이즈 도구 스킵
      if (CONFIG.skipTools.includes(toolName)) {
        HEALTH.skippedEvents++;
        saveHealthStatus();
        process.exit(0);
        return;
      }

      const toolInput = event.tool_input || {};
      const toolResult = event.tool_result || "";

      // 입력/출력 텍스트 추출
      const inputText = truncate(toolInput, CONFIG.maxInputLength);
      const outputText = truncate(toolResult, CONFIG.maxOutputLength);

      // 도메인 감지 (텍스트 + 파일 경로 + Bash 명령어)
      const combinedText = inputText + " " + outputText;
      const allDomains = new Set(detectDomains(combinedText));

      // 파일 경로 기반 도메인 감지 (Edit/Write)
      if (toolInput.file_path) {
        for (const d of detectDomainsFromPath(toolInput.file_path)) {
          allDomains.add(d);
        }
      }

      // Bash 명령어 기반 도메인 감지
      if (toolName === "Bash" && toolInput.command) {
        for (const d of detectDomainsFromCommand(toolInput.command)) {
          allDomains.add(d);
        }
      }

      const domains = Array.from(allDomains);

      // 관찰 기록 구성
      const observation = {
        timestamp: new Date().toISOString(),
        event: "tool_complete",
        tool: toolName,
        domains: domains.length > 0 ? domains : ["general"],
      };

      // Edit/Write는 파일 경로 기록
      if (["Edit", "Write"].includes(toolName) && toolInput.file_path) {
        observation.file = toolInput.file_path;
      }

      // Bash는 명령어 기록
      if (toolName === "Bash" && toolInput.command) {
        observation.command = truncate(toolInput.command, 500);
      }

      // 에러 감지
      const resultStr =
        typeof toolResult === "string"
          ? toolResult
          : JSON.stringify(toolResult);
      if (/error|exception|fail|FAIL/i.test(resultStr)) {
        observation.has_error = true;
        observation.error_snippet = truncate(
          resultStr.match(/(?:error|exception|fail)[^\n]{0,200}/i)?.[0] || "",
          200,
        );
      }

      saveObservation(observation);
      saveHealthStatus();
    } catch (err) {
      // 파싱 실패 — 모니터링 기록
      HEALTH.droppedEvents++;
      HEALTH.errors.push({
        at: new Date().toISOString(),
        msg: "parse: " + (err.message || "unknown"),
      });
      saveHealthStatus();
    }

    // 항상 허용
    process.exit(0);
  });

  // 타임아웃
  setTimeout(() => {
    process.exit(0);
  }, 3000);
}

module.exports = {
  detectDomains,
  detectDomainsFromPath,
  detectDomainsFromCommand,
  DOMAIN_PATTERNS,
  FILE_PATH_DOMAINS,
  CONFIG,
  HEALTH,
  saveHealthStatus,
};
