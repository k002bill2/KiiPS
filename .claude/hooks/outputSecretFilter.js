/**
 * Output Secret Filter — PostToolUse Hook
 * 도구 실행 결과(tool output)에서 시크릿을 감지하여 마스킹합니다.
 *
 * Claude Forge의 output-secret-filter.sh를 KiiPS 환경에 맞게
 * JavaScript로 재구현. DB 크레덴셜, JWT, API 키 등을 마스킹합니다.
 *
 * @version 1.0.0-KiiPS
 *
 * Hook trigger: PostToolUse (Bash)
 * Exit codes: 0 = 항상 허용 (stdout으로 마스킹된 출력 전달)
 *
 * 동작 방식:
 *   - stdin으로 도구 실행 결과 JSON 수신
 *   - tool_result에서 시크릿 패턴 감지
 *   - 감지 시 마스킹된 결과를 stdout으로 출력
 *   - 마스킹 발생 시 로그 기록 (값 자체는 기록하지 않음)
 */

// ─── 시크릿 패턴 정의 ───────────────────────────────────────

const SECRET_PATTERNS = [
  // === DB 크레덴셜 (KiiPS 특화) ===
  {
    pattern: /jdbc:[a-zA-Z]+:\/\/[^\s"']+/gi,
    type: "JDBC URL",
    severity: "CRITICAL",
  },
  {
    pattern:
      /(?:spring\.datasource\.password|db\.password|jdbc\.password)\s*[=:]\s*[^\s\n]+/gi,
    type: "DB Password Config",
    severity: "CRITICAL",
  },
  {
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']?[^\s"'\n]{8,}["']?/gi,
    type: "Password Value",
    severity: "HIGH",
  },

  // === API 키 패턴 ===
  {
    pattern: /\bsk-[a-zA-Z0-9_-]{20,}\b/g,
    type: "OpenAI API Key",
    severity: "CRITICAL",
  },
  {
    pattern: /\bsk-proj-[a-zA-Z0-9_-]{20,}\b/g,
    type: "OpenAI Project Key",
    severity: "CRITICAL",
  },
  {
    pattern: /\bAKIA[A-Z0-9]{16,}\b/g,
    type: "AWS Access Key",
    severity: "CRITICAL",
  },
  {
    pattern: /\bghp_[a-zA-Z0-9]{36,}\b/g,
    type: "GitHub PAT",
    severity: "CRITICAL",
  },
  {
    pattern: /\bghs_[a-zA-Z0-9]{36,}\b/g,
    type: "GitHub App Token",
    severity: "CRITICAL",
  },
  {
    pattern: /\bglpat-[a-zA-Z0-9_-]{20,}\b/g,
    type: "GitLab PAT",
    severity: "CRITICAL",
  },
  {
    pattern: /\bnpm_[a-zA-Z0-9]{36,}\b/g,
    type: "NPM Token",
    severity: "CRITICAL",
  },

  // === Bearer/Auth 토큰 ===
  {
    pattern: /\bBearer\s+[a-zA-Z0-9_.\-]{20,}\b/gi,
    type: "Bearer Token",
    severity: "HIGH",
  },
  {
    pattern: /\btoken\s*[=:]\s*["']?[a-zA-Z0-9_.\-]{20,}["']?/gi,
    type: "Token Parameter",
    severity: "HIGH",
  },
  {
    pattern: /\bauth\s*[=:]\s*["']?[a-zA-Z0-9_.\-]{20,}["']?/gi,
    type: "Auth Parameter",
    severity: "HIGH",
  },
  {
    pattern: /\bapi[_-]?key\s*[=:]\s*["']?[a-zA-Z0-9_.\-]{20,}["']?/gi,
    type: "API Key Parameter",
    severity: "HIGH",
  },

  // === JWT 토큰 ===
  {
    pattern:
      /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    type: "JWT Token",
    severity: "CRITICAL",
  },

  // === 환경변수 값 ===
  {
    pattern: /\bAWS_SECRET_ACCESS_KEY\s*[=:]\s*[^\s\n]{20,}/gi,
    type: "AWS Secret Key",
    severity: "CRITICAL",
  },
  {
    pattern: /\bOPENAI_API_KEY\s*[=:]\s*[^\s\n]{20,}/gi,
    type: "OpenAI Key Value",
    severity: "CRITICAL",
  },
  {
    pattern: /\bANTHROPIC_API_KEY\s*[=:]\s*[^\s\n]{20,}/gi,
    type: "Anthropic Key Value",
    severity: "CRITICAL",
  },
  {
    pattern: /\bGITHUB_TOKEN\s*[=:]\s*[^\s\n]{20,}/gi,
    type: "GitHub Token Value",
    severity: "CRITICAL",
  },
  {
    pattern: /\bDATABASE_URL\s*[=:]\s*[^\s\n]{20,}/gi,
    type: "Database URL Value",
    severity: "CRITICAL",
  },

  // === Private Key ===
  {
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    type: "Private Key",
    severity: "CRITICAL",
  },

  // === KiiPS 특화: Spring Boot 설정 ===
  {
    pattern:
      /(?:spring\.security|spring\.mail|spring\.redis)\.password\s*[=:]\s*[^\s\n]+/gi,
    type: "Spring Config Secret",
    severity: "HIGH",
  },
  {
    pattern: /(?:encrypt|decrypt)\.key\s*[=:]\s*[^\s\n]+/gi,
    type: "Encryption Key",
    severity: "CRITICAL",
  },

  // === 잠재적 Base64 인코딩 시크릿 ===
  {
    pattern:
      /(?:key|secret|token|password|credential|auth)\s*[=:]\s*["']?[a-zA-Z0-9+/]{40,}={0,2}["']?/gi,
    type: "Potential Base64 Secret",
    severity: "MEDIUM",
  },

  // === URL-Encoded 시크릿 ===
  {
    pattern:
      /(?:password|secret|token|api_key|apikey)%3[Dd](?:%[0-9A-Fa-f]{2}|[a-zA-Z0-9._~!$&'()*+,;=:@/-]){8,}/gi,
    type: "URL-Encoded Secret",
    severity: "HIGH",
  },
];

// ─── 마스킹 함수 ───────────────────────────────────────

/**
 * 매칭된 문자열을 마스킹
 * @param {string} original - 원본 문자열
 * @returns {string} 마스킹된 문자열
 */
function maskSecret(original) {
  if (original.length > 16) {
    return (
      original.substring(0, 8) +
      "***MASKED***" +
      original.substring(original.length - 4)
    );
  }
  return original.substring(0, 4) + "***MASKED***";
}

/**
 * Base64 디코딩 후 시크릿 탐지
 * @param {string} text - 검사할 텍스트
 * @returns {boolean} 시크릿 발견 여부
 */
function checkBase64Encoded(text) {
  const b64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
  let match;
  while ((match = b64Pattern.exec(text)) !== null) {
    try {
      const decoded = Buffer.from(match[0], "base64").toString("utf-8");
      if (decoded.length >= 10) {
        for (const { pattern } of SECRET_PATTERNS) {
          // Reset regex state
          pattern.lastIndex = 0;
          if (pattern.test(decoded)) {
            return true;
          }
        }
      }
    } catch {
      // Base64 디코딩 실패 — 무시
    }
  }
  return false;
}

/**
 * URL-Encoded 시크릿 탐지
 * %3D(=), %26(&) 등으로 인코딩된 시크릿을 감지
 * @param {string} text - 검사할 텍스트
 * @returns {{ found: boolean, matches: Array<{index: number, length: number, value: string}> }}
 */
function checkUrlEncoded(text) {
  const matches = [];
  // URL-encoded key=value 패턴 탐지
  const urlPattern =
    /(?:password|secret|token|api_key|apikey|pwd|passwd)(?:%3[Dd]|=)(?:%[0-9A-Fa-f]{2}|[a-zA-Z0-9._~!$&'()*+,;:@/-]){8,}/gi;
  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    try {
      const decoded = decodeURIComponent(match[0]);
      // 디코딩된 값에서 시크릿 패턴 확인
      for (const { pattern } of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(decoded)) {
          matches.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
          });
          break;
        }
      }
    } catch {
      // URL 디코딩 실패 — 원본이 의심스러우면 그냥 추가
      if (match[0].length > 30) {
        matches.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
        });
      }
    }
  }
  return { found: matches.length > 0, matches };
}

// ─── 메인 필터 로직 ───────────────────────────────────────

/**
 * 도구 출력에서 시크릿을 감지하고 마스킹
 * @param {string} toolResult - 도구 실행 결과 텍스트
 * @returns {{ maskedOutput: string, maskedCount: number, maskedTypes: string[] }}
 */
function filterSecrets(toolResult) {
  let maskedOutput = toolResult;
  let maskedCount = 0;
  const maskedTypes = new Set();

  // 1단계: 직접 패턴 매칭
  for (const { pattern, type } of SECRET_PATTERNS) {
    // Reset regex state for global patterns
    pattern.lastIndex = 0;

    const matches = [];
    let m;
    while ((m = pattern.exec(maskedOutput)) !== null) {
      matches.push({ index: m.index, length: m[0].length, value: m[0] });
    }

    // 뒤에서부터 치환 (인덱스 유지)
    for (let i = matches.length - 1; i >= 0; i--) {
      const { index, length, value } = matches[i];
      maskedOutput =
        maskedOutput.substring(0, index) +
        maskSecret(value) +
        maskedOutput.substring(index + length);
      maskedCount++;
      maskedTypes.add(type);
    }
  }

  // 2단계: URL-Encoded 우회 탐지
  const urlEncodedResult = checkUrlEncoded(maskedOutput);
  if (urlEncodedResult.found) {
    for (const match of urlEncodedResult.matches) {
      maskedOutput =
        maskedOutput.substring(0, match.index) +
        maskSecret(match.value) +
        maskedOutput.substring(match.index + match.length);
      maskedCount++;
      maskedTypes.add("URL-Encoded Secret");
    }
  }

  // 3단계: Base64 인코딩 우회 탐지
  // 먼저 모든 매칭을 수집한 후 뒤에서부터 치환 (인덱스 안정성 보장)
  if (checkBase64Encoded(toolResult)) {
    const b64Pattern = /[A-Za-z0-9+/]{40,}={0,2}/g;
    const b64Matches = [];
    let b64Match;
    while ((b64Match = b64Pattern.exec(maskedOutput)) !== null) {
      try {
        const decoded = Buffer.from(b64Match[0], "base64").toString("utf-8");
        for (const { pattern, type } of SECRET_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(decoded)) {
            b64Matches.push({
              index: b64Match.index,
              length: b64Match[0].length,
              value: b64Match[0],
              type: "Base64-Encoded " + type,
            });
            break;
          }
        }
      } catch {
        // 무시
      }
    }
    // 뒤에서부터 치환 (인덱스 유지)
    for (let i = b64Matches.length - 1; i >= 0; i--) {
      const { index, length, value, type } = b64Matches[i];
      maskedOutput =
        maskedOutput.substring(0, index) +
        maskSecret(value) +
        maskedOutput.substring(index + length);
      maskedCount++;
      maskedTypes.add(type);
    }
  }

  return {
    maskedOutput,
    maskedCount,
    maskedTypes: Array.from(maskedTypes),
  };
}

/**
 * 보안 로그 기록 (마스킹 발생 시)
 * @param {string} toolName - 도구 이름
 * @param {number} count - 마스킹 수
 * @param {string[]} types - 마스킹 유형
 */
function logMasking(toolName, count, types) {
  const fs = require("fs");
  const path = require("path");
  const logPath = path.join(
    process.cwd(),
    ".claude",
    "hooks",
    "security-masking.log",
  );

  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | SECRET_MASKED | tool=${toolName} | count=${count} | types=${types.join(",")}\n`;

  try {
    fs.appendFileSync(logPath, logEntry);
  } catch {
    // 로그 기록 실패 — 무시 (필터링은 계속)
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
      const toolResult = event.tool_result || "";
      const toolName = event.tool_name || "unknown";

      // 문자열로 변환
      const resultText =
        typeof toolResult === "string"
          ? toolResult
          : JSON.stringify(toolResult, null, 2);

      if (!resultText || resultText.length < 10) {
        process.exit(0);
        return;
      }

      const { maskedOutput, maskedCount, maskedTypes } =
        filterSecrets(resultText);

      if (maskedCount > 0) {
        // 마스킹된 출력을 stdout으로 전달 (Claude가 이 값을 봄)
        process.stdout.write(maskedOutput);

        // stderr로 경고 메시지 출력
        process.stderr.write(
          `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `SECRET MASKED | ${maskedCount}건 | ${maskedTypes.join(", ")}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
        );

        // 보안 로그 기록
        logMasking(toolName, maskedCount, maskedTypes);
      }
      // 시크릿 미감지 시: stdout에 아무것도 쓰지 않음 = 원본 출력 유지
      // (PostToolUse hook은 stdout이 비어있으면 원본 tool_result를 그대로 사용)

      // 항상 허용 (exit 0)
      process.exit(0);
    } catch (e) {
      // JSON 파싱 실패 — 무시하고 허용
      process.exit(0);
    }
  });

  // stdin이 비어있는 경우 타임아웃
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

// Export for testing
module.exports = {
  filterSecrets,
  maskSecret,
  checkBase64Encoded,
  checkUrlEncoded,
  SECRET_PATTERNS,
};
