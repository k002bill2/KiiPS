#!/usr/bin/env node
/**
 * Quality Gate Checker Hook for KiiPS
 * PostToolUse:Task 이벤트에서 서브에이전트 작업 완료 후 품질 게이트를 자동 검증합니다.
 *
 * 검증 항목:
 *   1. MyBatis SQL Injection 검사 (.xml mapper - ${} 패턴)
 *   2. Dark Theme 규칙 검사 (.scss - .dark, .theme-dark 셀렉터 금지)
 *   3. 보안 검사 (.java - 하드코딩된 API 키/비밀번호)
 *   4. Spring 트랜잭션 검사 (Service 클래스 @Transactional)
 *
 * @version 1.0.0-KiiPS
 * @layer Layer 6 (Task Prosecution)
 *
 * @hook-config
 * {"event": "PostToolUse", "matcher": "Task", "command": "node .claude/hooks/qualityGateChecker.js 2>/dev/null || true"}
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 경로 상수
const WORKSPACE_ROOT = path.join(__dirname, "../../");
const PARALLEL_STATE_PATH = path.join(
  __dirname,
  "../ace-framework/parallel-state.json",
);
const QUALITY_GATE_DIR = path.join(WORKSPACE_ROOT, ".temp/quality-gates");

// 점수 가중치
const VIOLATION_WEIGHTS = {
  mybatis_sql_injection: 30, // SQL Injection: 치명적
  dark_theme_selector: 15, // Dark Theme 규칙 위반: 중간
  hardcoded_secret: 30, // 보안 키 하드코딩: 치명적
  missing_transactional: 10, // @Transactional 누락: 경고
};

// ─── stdin 읽기 ────────────────────────────────────────────────────────────────

let inputData = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  try {
    const event = JSON.parse(inputData || "{}");

    // Task 도구 PostToolUse 이벤트가 아니면 무시
    if (event.tool_name !== "Task") {
      process.exit(0);
    }

    runQualityGates(event);
  } catch (error) {
    // JSON 파싱 실패 등 예외 - fail-open
    process.exit(0);
  }
});

// ─── 타임아웃 (5초) ────────────────────────────────────────────────────────────

setTimeout(() => {
  process.exit(0);
}, 5000);

// ─── 메인 로직 ────────────────────────────────────────────────────────────────

/**
 * 전체 품질 게이트 실행 진입점
 */
function runQualityGates(event) {
  try {
    // 1. 마지막 완료된 에이전트의 targetModules 확인
    const targetModules = resolveTargetModules(event);

    // 2. 수정된 파일 목록 획득 (git diff)
    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
      // 변경 파일 없음 - 결과 기록 후 종료
      saveResult({
        timestamp: new Date().toISOString(),
        agentType: event.tool_input?.subagent_type || "unknown",
        targetModules,
        checkedFiles: 0,
        violations: [],
        score: 100,
        passed: true,
        message: "No changed files detected.",
      });
      process.exit(0);
    }

    // 3. 각 검증 항목 실행
    const violations = [];

    violations.push(...checkMybatisSqlInjection(changedFiles));
    violations.push(...checkDarkThemeSelectors(changedFiles));
    violations.push(...checkHardcodedSecrets(changedFiles));
    violations.push(...checkTransactionalAnnotation(changedFiles));

    // 4. 점수 계산
    const score = calculateScore(violations);
    const passed = score >= 70;

    // 5. 결과 저장
    const result = {
      timestamp: new Date().toISOString(),
      agentType: event.tool_input?.subagent_type || "unknown",
      targetModules,
      checkedFiles: changedFiles.length,
      violations,
      score,
      passed,
    };

    saveResult(result);

    // 6. 위반 사항 stderr 출력 (exit code 0 유지)
    if (violations.length > 0) {
      printViolationReport(result);
    }

    process.exit(0);
  } catch (error) {
    // 예외 발생해도 작업 차단하지 않음 (fail-open)
    try {
      process.stderr.write(
        "[QualityGateChecker] Unexpected error: " + error.message + "\n",
      );
    } catch (_) {
      /* ignore */
    }
    process.exit(0);
  }
}

// ─── 보조 함수들 ───────────────────────────────────────────────────────────────

/**
 * parallel-state.json에서 마지막 완료된 에이전트의 targetModules 반환
 */
function resolveTargetModules(event) {
  try {
    if (fs.existsSync(PARALLEL_STATE_PATH)) {
      const state = JSON.parse(fs.readFileSync(PARALLEL_STATE_PATH, "utf8"));

      // 이벤트에서 subagent_type으로 에이전트 탐색
      const agentType = event.tool_input?.subagent_type;
      if (agentType && Array.isArray(state.activeAgents)) {
        const agent = state.activeAgents.find((a) => a.agentType === agentType);
        if (
          agent &&
          Array.isArray(agent.targetModules) &&
          agent.targetModules.length > 0
        ) {
          return agent.targetModules;
        }
      }

      // fallback: 가장 마지막으로 업데이트된 에이전트
      if (Array.isArray(state.activeAgents) && state.activeAgents.length > 0) {
        const last = state.activeAgents[state.activeAgents.length - 1];
        return last.targetModules || [];
      }
    }
  } catch (_) {
    /* fail-open */
  }
  return [];
}

/**
 * 수정된 파일 목록 획득 (git → svn → stdin fallback)
 */
function getChangedFiles() {
  // 1. git diff 시도
  try {
    const output = execSync("git diff --name-only HEAD 2>/dev/null", {
      cwd: WORKSPACE_ROOT,
      timeout: 3000,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (output) {
      return output
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => path.join(WORKSPACE_ROOT, f));
    }
  } catch (_) {}

  // 2. svn status 시도 (KiiPS는 SVN 프로젝트)
  try {
    const output = execSync("svn status 2>/dev/null", {
      cwd: WORKSPACE_ROOT,
      timeout: 5000,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (output) {
      return output
        .split("\n")
        .filter((line) => /^[AM]/.test(line)) // Added or Modified
        .map((line) => line.replace(/^[AM?!\s]+/, "").trim())
        .filter(Boolean)
        .map((f) => path.join(WORKSPACE_ROOT, f));
    }
  } catch (_) {}

  // 3. 빈 배열 반환
  return [];
}

// ─── 검증 1: MyBatis SQL Injection ────────────────────────────────────────────

/**
 * .xml mapper 파일에서 ${} 패턴 검사 (#{} 가 아닌 것)
 * MyBatis에서 ${} 는 literal substitution 이므로 SQL Injection 위험
 */
function checkMybatisSqlInjection(files) {
  const violations = [];
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));

  for (const filePath of xmlFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // ${...} 패턴 탐지 (XML 주석 제외)
        if (line.trim().startsWith("<!--")) return;

        // ${} 패턴이지만 #{} 가 아닌 경우
        const dollarMatches = line.match(/\$\{[^}]+\}/g);
        if (dollarMatches) {
          violations.push({
            type: "mybatis_sql_injection",
            severity: "CRITICAL",
            file: toRelativePath(filePath),
            line: idx + 1,
            pattern: dollarMatches[0],
            message: `MyBatis SQL Injection 위험: \${} 사용 감지. #{} 로 교체하세요.`,
            rule: "quality-gates#mybatis-sql-injection",
          });
        }
      });
    } catch (_) {
      /* 파일 읽기 실패 무시 */
    }
  }

  return violations;
}

// ─── 검증 2: Dark Theme 규칙 ──────────────────────────────────────────────────

/**
 * .scss 파일에서 .dark, .theme-dark 셀렉터 검사 (금지)
 * KiiPS 다크테마는 [data-theme=dark] 셀렉터만 허용
 */
function checkDarkThemeSelectors(files) {
  const violations = [];
  const scssFiles = files.filter((f) => f.endsWith(".scss"));

  // 금지된 셀렉터 패턴
  const FORBIDDEN_SELECTORS = [
    { pattern: /\.dark\b[\s{,]/, label: ".dark" },
    { pattern: /\.theme-dark\b[\s{,]/, label: ".theme-dark" },
  ];

  for (const filePath of scssFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // SCSS 주석 라인 제외
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

        for (const { pattern, label } of FORBIDDEN_SELECTORS) {
          if (pattern.test(line)) {
            violations.push({
              type: "dark_theme_selector",
              severity: "HIGH",
              file: toRelativePath(filePath),
              line: idx + 1,
              pattern: label,
              message: `다크테마 셀렉터 규칙 위반: "${label}" 사용 금지. [data-theme=dark] 만 사용하세요.`,
              rule: "quality-gates#dark-theme-rules",
            });
          }
        }
      });
    } catch (_) {
      /* 파일 읽기 실패 무시 */
    }
  }

  return violations;
}

// ─── 검증 3: 하드코딩된 보안 키/비밀번호 ─────────────────────────────────────

/**
 * .java 파일에서 하드코딩된 API 키, 비밀번호 패턴 검사
 */
function checkHardcodedSecrets(files) {
  const violations = [];
  const javaFiles = files.filter((f) => f.endsWith(".java"));

  // 하드코딩 보안 패턴 (값이 변수명 또는 placeholder가 아닌 경우)
  const SECRET_PATTERNS = [
    {
      pattern: /(?:password|passwd|pwd)\s*=\s*["'][^"']{3,}["']/i,
      label: "hardcoded password",
    },
    {
      pattern: /(?:api[_-]?key|apikey)\s*=\s*["'][A-Za-z0-9\-_]{8,}["']/i,
      label: "hardcoded API key",
    },
    {
      pattern: /(?:secret|secret[_-]?key)\s*=\s*["'][^"']{6,}["']/i,
      label: "hardcoded secret",
    },
    {
      pattern:
        /(?:access[_-]?token|auth[_-]?token)\s*=\s*["'][A-Za-z0-9\-_.]{10,}["']/i,
      label: "hardcoded token",
    },
    {
      // Bearer 토큰 직접 입력
      pattern: /Bearer\s+[A-Za-z0-9\-_]{20,}/,
      label: "hardcoded Bearer token",
    },
  ];

  // 무시할 패턴 (테스트 파일, 플레이스홀더)
  const IGNORE_PATTERNS = [
    /\/\/.*/, // 주석
    /test|mock|dummy|example|placeholder|changeme|your[_-]?key/i,
  ];

  for (const filePath of javaFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // 주석 라인 제외
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

        // 무시 패턴에 해당하는 경우 스킵
        const shouldIgnore = IGNORE_PATTERNS.some((p) => p.test(line));
        if (shouldIgnore) return;

        for (const { pattern, label } of SECRET_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              type: "hardcoded_secret",
              severity: "CRITICAL",
              file: toRelativePath(filePath),
              line: idx + 1,
              pattern: label,
              message: `보안 위반 - ${label} 하드코딩 감지. app-local.properties 또는 환경변수를 사용하세요.`,
              rule: "quality-gates#security",
            });
          }
        }
      });
    } catch (_) {
      /* 파일 읽기 실패 무시 */
    }
  }

  return violations;
}

// ─── 검증 4: Spring @Transactional ────────────────────────────────────────────

/**
 * 새로 추가된 Service 클래스에 @Transactional 이 있는지 검사
 * 클래스 레벨 또는 public 메서드 레벨에 @Transactional 이 존재해야 함
 */
function checkTransactionalAnnotation(files) {
  const violations = [];

  // *Service.java 파일만 검사
  const serviceFiles = files.filter(
    (f) => f.endsWith("Service.java") || f.endsWith("ServiceImpl.java"),
  );

  for (const filePath of serviceFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");

      // 인터페이스는 제외 (interface 키워드 존재 여부 확인)
      if (/\binterface\b/.test(content)) continue;

      // 추상 클래스 제외
      if (/\babstract\s+class\b/.test(content)) continue;

      // @Transactional 존재 여부 확인 (클래스 레벨 또는 메서드 레벨)
      const hasTransactional = /@Transactional/.test(content);

      // public 메서드가 있는 클래스인지 확인 (단순 DTO 클래스 제외)
      const hasPublicMethods = /public\s+\w+[\w<>[\],\s]+\s+\w+\s*\(/.test(
        content,
      );

      if (!hasTransactional && hasPublicMethods) {
        // 클래스명 추출
        const classMatch = content.match(/(?:public\s+)?class\s+(\w+)/);
        const className = classMatch
          ? classMatch[1]
          : path.basename(filePath, ".java");

        violations.push({
          type: "missing_transactional",
          severity: "WARNING",
          file: toRelativePath(filePath),
          line: 1,
          pattern: "@Transactional missing",
          message: `Service 클래스 "${className}"에 @Transactional 이 없습니다. 데이터 정합성을 위해 @Transactional(rollbackFor = Exception.class) 을 추가하세요.`,
          rule: "quality-gates#spring-mybatis",
        });
      }
    } catch (_) {
      /* 파일 읽기 실패 무시 */
    }
  }

  return violations;
}

// ─── 점수 계산 ─────────────────────────────────────────────────────────────────

/**
 * 위반 사항 기반 품질 점수 계산 (100점 만점)
 * 위반 하나당 VIOLATION_WEIGHTS 만큼 감점 (최저 0점)
 */
function calculateScore(violations) {
  let deduction = 0;

  for (const v of violations) {
    deduction += VIOLATION_WEIGHTS[v.type] || 10;
  }

  return Math.max(0, 100 - deduction);
}

// ─── 결과 저장 ─────────────────────────────────────────────────────────────────

/**
 * 검증 결과를 .temp/quality-gates/ 에 JSON 파일로 저장
 */
function saveResult(result) {
  try {
    if (!fs.existsSync(QUALITY_GATE_DIR)) {
      fs.mkdirSync(QUALITY_GATE_DIR, { recursive: true });
    }

    // 최신 결과는 latest.json 으로 항상 덮어씀
    const latestPath = path.join(QUALITY_GATE_DIR, "latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(result, null, 2), "utf8");

    // 이력 보관: timestamp 기반 파일명
    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const historyPath = path.join(QUALITY_GATE_DIR, `result_${ts}.json`);
    fs.writeFileSync(historyPath, JSON.stringify(result, null, 2), "utf8");
  } catch (error) {
    process.stderr.write(
      "[QualityGateChecker] Failed to save result: " + error.message + "\n",
    );
  }
}

// ─── 보고서 출력 ──────────────────────────────────────────────────────────────

/**
 * 위반 사항을 stderr 에 출력 (exit code 0 유지 - 차단하지 않음)
 */
function printViolationReport(result) {
  const lines = [];

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("[QualityGateChecker] QUALITY GATE REPORT");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`  Agent     : ${result.agentType}`);
  lines.push(`  Checked   : ${result.checkedFiles} files`);
  lines.push(`  Violations: ${result.violations.length}`);
  lines.push(
    `  Score     : ${result.score}/100 ${result.passed ? "[PASSED]" : "[FAILED]"}`,
  );
  lines.push("");

  if (result.violations.length > 0) {
    lines.push("  Violations:");
    for (const v of result.violations) {
      const severityLabel =
        v.severity === "CRITICAL"
          ? "[CRITICAL]"
          : v.severity === "HIGH"
            ? "[HIGH]    "
            : "[WARNING] ";
      lines.push(`  ${severityLabel} ${v.file}:${v.line}`);
      lines.push(`            ${v.message}`);
    }
    lines.push("");
  }

  if (!result.passed) {
    lines.push("  NOTE: Score < 70. 위반 항목을 수정 후 재검토하세요.");
    lines.push("        결과 파일: .temp/quality-gates/latest.json");
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  process.stderr.write(lines.join("\n") + "\n");
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

/**
 * 절대 경로를 WORKSPACE_ROOT 기준 상대 경로로 변환
 */
function toRelativePath(absolutePath) {
  return absolutePath.startsWith(WORKSPACE_ROOT)
    ? absolutePath.slice(WORKSPACE_ROOT.length)
    : absolutePath;
}
