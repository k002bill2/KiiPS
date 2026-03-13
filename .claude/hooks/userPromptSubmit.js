/**
 * UserPromptSubmit Hook (Lightweight v5.0)
 *
 * Complexity Gate:
 *   TRIVIAL  -> 주입 없음 (원본 그대로 반환)
 *   STANDARD -> Skill 활성화 + KiiPS 모듈 감지만
 *   COMPLEX  -> 전체 파이프라인 (ACE + Manager + Effort)
 *
 * @version 5.0.0-KiiPS
 */

const fs = require("fs");
const path = require("path");

// ─── 모듈 레벨 캐시 (TTL 30초) ─────────────────────────────
let _skillRulesCache = null;
let _skillRulesCacheTs = 0;
const SKILL_CACHE_TTL = 30_000;

function getSkillRules(projectRoot) {
  const now = Date.now();
  if (_skillRulesCache && now - _skillRulesCacheTs < SKILL_CACHE_TTL) {
    return _skillRulesCache;
  }
  try {
    const rulesPath = path.join(projectRoot, "skill-rules.json");
    if (!fs.existsSync(rulesPath)) return null;
    _skillRulesCache = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    _skillRulesCacheTs = now;
    return _skillRulesCache;
  } catch (_) {
    return null;
  }
}

// ─── Complexity Gate ─────────────────────────────────────────

/**
 * 프롬프트 복잡도를 3단계로 분류
 * @returns {'TRIVIAL'|'STANDARD'|'COMPLEX'}
 */
function classifyPromptComplexity(prompt) {
  const trimmed = prompt.trim();

  // TRIVIAL: 10단어 이하 단순 입력
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount <= 10) {
    // 슬래시 명령
    if (/^\/\w+/.test(trimmed)) return "TRIVIAL";
    // yes/no 응답
    if (/^(yes|no|y|n|네|아니|ㅇ|ㄴ|ok|확인|맞아|응|ㅇㅇ)$/i.test(trimmed))
      return "TRIVIAL";
    // 단순 질문 (복잡 키워드 없는 짧은 것)
    if (
      wordCount <= 3 &&
      !/KiiPS|빌드|배포|deploy|build|기능|feature|아키텍처|architecture|설계|리팩토링|refactor|테스트|test|분석|analyze/i.test(
        trimmed,
      )
    )
      return "TRIVIAL";
    // 단순 인사/감사
    if (/^(안녕|hello|hi|thanks|감사|고마워|ㄱㅅ)/i.test(trimmed))
      return "TRIVIAL";
  }

  // COMPLEX: 다중 모듈, 배포, 아키텍처, 병렬 작업
  const complexIndicators = [
    /전체.*빌드|all.*build|모든.*서비스/i,
    /배포.*실행|deploy.*and.*run/i,
    /아키텍처|architecture|설계.*검토/i,
    /병렬|parallel|팀.*에이전트|team.*agent/i,
    /KiiPS-[A-Z]+.*KiiPS-[A-Z]+/, // 2개 이상 모듈 동시 언급
    /(전체|모든|all|multi|multiple|여러).*(모듈|서비스|module|service)/i,
    /리팩토링.*전체|refactor.*all/i,
  ];
  if (complexIndicators.some((p) => p.test(prompt))) return "COMPLEX";

  // 나머지는 STANDARD
  return "STANDARD";
}

// ─── Hook Entry Point ────────────────────────────────────────

async function onUserPromptSubmit(prompt, context) {
  try {
    const complexity = classifyPromptComplexity(prompt);

    // TRIVIAL: 주입 없이 원본 반환
    if (complexity === "TRIVIAL") {
      return prompt;
    }

    const projectRoot = context.workspaceRoot || process.cwd();
    const messages = [];

    // --- STANDARD 이상: Skill 활성화 + 모듈 감지 ---

    // Skill 활성화
    const skillActivation = activateSkills(prompt, projectRoot);
    if (skillActivation) messages.push(skillActivation);

    // Block Rules 검사
    const rules = getSkillRules(projectRoot);
    if (rules) {
      const violations = checkBlockRules(prompt, rules);
      if (violations.length > 0) {
        const blockMsg = violations
          .map(
            (v) =>
              `[BLOCKED] ${v.skill}:${v.ruleId}\n  ${v.severity === "critical" ? "🔴" : "⚠️"} ${v.message}`,
          )
          .join("\n");
        messages.push(blockMsg);
      }
    }

    // KiiPS 모듈 감지
    const moduleContext = detectKiipsModules(prompt);
    if (moduleContext) messages.push(moduleContext);

    // Gemini 리뷰 주입 (최신 1개, 최적화된 로딩)
    const geminiReview = loadLatestGeminiReview();
    if (geminiReview) messages.unshift(geminiReview);

    // --- COMPLEX만: Manager + Effort ---
    if (complexity === "COMPLEX") {
      const agentCapabilities = checkAgentCapabilities(prompt);
      if (agentCapabilities) messages.push(agentCapabilities);

      const taskDecomposition = suggestTaskDecomposition(prompt);
      if (taskDecomposition) messages.push(taskDecomposition);

      const managerRouting = detectManagerAgent(prompt);
      if (managerRouting) messages.push(managerRouting);

      const effortScaling = assessEffortScaling(prompt);
      if (effortScaling) messages.push(effortScaling);
    }

    if (messages.length > 0) {
      return messages.join("\n\n") + "\n\n" + prompt;
    }
    return prompt;
  } catch (error) {
    console.error("[UserPromptSubmit] Error:", error.message);
    return prompt;
  }
}

// ─── Agent 능력 확인 ─────────────────────────────────────────

function checkAgentCapabilities(prompt) {
  try {
    const lowerPrompt = prompt.toLowerCase();
    const taskMap = {
      build: ["빌드", "build", "maven"],
      deploy: ["배포", "deploy", "start"],
      api_test: ["테스트", "test", "api"],
      architecture_review: ["아키텍처", "설계", "architecture"],
      log_analysis: ["로그", "log", "디버그"],
    };
    const detected = Object.entries(taskMap)
      .filter(([, kws]) => kws.some((kw) => lowerPrompt.includes(kw)))
      .map(([type]) => type);
    if (detected.length === 0) return null;
    return `[L3 Match] ${detected.join(", ")}`;
  } catch (_) {
    return null;
  }
}

// ─── 작업 분해 제안 (Layer 4) ───────────────────────────────

function suggestTaskDecomposition(prompt) {
  const complexPatterns = [
    {
      pattern: /전체.*빌드|all.*build|모든.*서비스/i,
      type: "multi_service_build",
    },
    { pattern: /배포.*실행|deploy.*and.*run/i, type: "build_and_deploy" },
    {
      pattern: /새.*기능|new.*feature|feature.*개발/i,
      type: "feature_development",
    },
    { pattern: /리팩토링|refactor|코드.*개선/i, type: "code_refactoring" },
  ];
  const match = complexPatterns.find(({ pattern }) => pattern.test(prompt));
  if (!match) return null;
  return `[L4 Task] Complex: ${match.type}`;
}

// ─── Manager Agent 감지 ──────────────────────────────────────

function detectManagerAgent(prompt) {
  try {
    const lowerPrompt = prompt.toLowerCase();
    const rules = [
      {
        manager: "build-manager",
        keywords: ["빌드", "build", "maven", "compile", "package", "mvn"],
      },
      {
        manager: "deployment-manager",
        keywords: [
          "배포",
          "deploy",
          "start",
          "stop",
          "restart",
          "시작",
          "중지",
          "재시작",
        ],
      },
      {
        manager: "feature-manager",
        keywords: ["기능", "feature", "개발", "구현", "implement"],
      },
      {
        manager: "ui-manager",
        keywords: [
          "UI",
          "화면",
          "페이지",
          "그리드",
          "차트",
          "JSP",
          "RealGrid",
          "ApexCharts",
          "반응형",
          "접근성",
        ],
      },
    ];
    const matched = rules.find((r) =>
      r.keywords.some((kw) => lowerPrompt.includes(kw.toLowerCase())),
    );
    if (!matched) return null;

    let complexity = "simple";
    if (/(전체|모든|all|multi|multiple|여러)/.test(lowerPrompt))
      complexity = "multi_service";
    else if (/(배포.*테스트|build.*deploy|빌드.*배포)/.test(lowerPrompt))
      complexity = "complex";

    return `[L4.5 Manager] ${matched.manager} (${complexity})`;
  } catch (_) {
    return null;
  }
}

// ─── KiiPS 모듈 감지 ────────────────────────────────────────

function detectKiipsModules(prompt) {
  const modulePattern = /KiiPS-([A-Z]{2,10})/gi;
  const matches = prompt.match(modulePattern) || [];
  const uniqueModules = [...new Set(matches.map((m) => m.toUpperCase()))];
  if (uniqueModules.length === 0) return null;

  const protectedModules = [
    "KIIPS-HUB",
    "KIIPS-COMMON",
    "KIIPS-UTILS",
    "KIIPS-APIGATEWAY",
    "KIIPS-LOGIN",
  ];
  const targetProtected = uniqueModules.filter((m) =>
    protectedModules.includes(m),
  );

  let msg = `[Modules] ${uniqueModules.join(", ")}`;
  if (targetProtected.length > 0) {
    msg += ` | Protected: ${targetProtected.join(", ")}`;
  }
  return msg;
}

// ─── Skill 활성화 (캐시 사용) ────────────────────────────────

function activateSkills(prompt, projectRoot) {
  const rules = getSkillRules(projectRoot);
  if (!rules) return null;

  const activatedSkills = [];
  for (const [skillName, rule] of Object.entries(rules)) {
    if (shouldActivateSkill(prompt, rule)) {
      activatedSkills.push({
        name: skillName,
        priority: rule.priority,
      });
    }
  }

  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  activatedSkills.sort(
    (a, b) =>
      (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3),
  );

  if (activatedSkills.length === 0) return null;

  const critical = activatedSkills
    .filter((s) => s.priority === "critical")
    .map((s) => "!" + s.name);
  const others = activatedSkills
    .filter((s) => s.priority !== "critical")
    .map((s) => s.name);
  return `[Skills] ${[...critical, ...others].join(", ")}`;
}

// ─── Block Rules 검사 (enforcement: "block" 스킬의 blockRules) ──

function checkBlockRules(prompt, rules) {
  const violations = [];
  for (const [skillName, rule] of Object.entries(rules)) {
    if (rule.enforcement !== "block" || !rule.blockRules) continue;
    for (const blockRule of rule.blockRules) {
      try {
        if (new RegExp(blockRule.pattern, "i").test(prompt)) {
          violations.push({
            skill: skillName,
            ruleId: blockRule.id,
            message: blockRule.message,
            severity: blockRule.severity,
          });
        }
      } catch (_) {
        continue;
      }
    }
  }
  return violations;
}

function shouldActivateSkill(prompt, rule) {
  const lowerPrompt = prompt.toLowerCase();
  if (rule.promptTriggers?.keywords) {
    if (
      rule.promptTriggers.keywords.some((kw) =>
        lowerPrompt.includes(kw.toLowerCase()),
      )
    )
      return true;
  }
  if (rule.promptTriggers?.intentPatterns) {
    if (
      rule.promptTriggers.intentPatterns.some((pattern) => {
        try {
          return new RegExp(pattern, "i").test(prompt);
        } catch (_) {
          return false;
        }
      })
    )
      return true;
  }
  return false;
}

// ─── Gemini Review 로딩 (최적화: 파일명 정렬 + 최신 5개만) ──

function loadLatestGeminiReview() {
  try {
    const reviewsDir = path.join(__dirname, "../gemini-bridge/reviews");
    if (!fs.existsSync(reviewsDir)) return null;

    // 파일명에 타임스탬프가 포함 → 파일명 역순 정렬로 최신 순 확보
    const allFiles = fs
      .readdirSync(reviewsDir)
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a));

    // 최신 5개만 읽고, 첫 completed 발견 시 중단
    const maxScan = Math.min(allFiles.length, 5);
    for (let i = 0; i < maxScan; i++) {
      try {
        const fullPath = path.join(reviewsDir, allFiles[i]);
        const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        if (data.status !== "completed") continue;

        // 'shown' 마킹
        data.status = "shown";
        data.shownAt = new Date().toISOString();
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf8");

        // 메시지 포맷
        const attention = data.needsAttention ? "ATTENTION" : "OK";
        let msg = `[GEMINI] ${attention} - ${data.summary || data.verdict || "(no summary)"}`;

        const criticals = (data.issues || []).filter(
          (i) => i.severity === "critical",
        );
        if (criticals.length > 0) {
          msg += "\n  CRITICAL: " + criticals.map((i) => i.text).join(" | ");
        }
        return msg;
      } catch (_) {
        continue;
      }
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ─── Effort Scaling (COMPLEX 전용) ──────────────────────────

function assessEffortScaling(prompt) {
  try {
    const lowerPrompt = prompt.toLowerCase();
    let score = 0;

    if (
      [
        /여러|multiple|전체|모든|all|다수/i,
        /Controller.*Service|Service.*Mapper/i,
        /KiiPS-[A-Z]+.*KiiPS-[A-Z]+/,
        /파일.*파일|file.*file/i,
      ].some((p) => p.test(prompt))
    )
      score += 2;
    else if (
      ![/이\s*파일|this\s*file|단일|single/i].some((p) => p.test(prompt))
    )
      score += 1;

    const layers = [
      "controller",
      "service",
      "mapper",
      "dao",
      "jsp",
      "scss",
      "javascript",
      "jquery",
      "sql",
      "query",
      "repository",
    ].filter((l) => lowerPrompt.includes(l));
    score += layers.length >= 3 ? 2 : layers.length >= 1 ? 1 : 0;

    if (
      [
        /테스트|검증|확인|test|verify|validation|qa|quality/i,
        /junit|mock|postman|api\s*test/i,
      ].some((p) => p.test(prompt))
    )
      score += 2;
    if (
      [
        /조사|분석|탐색|찾아|파악|explore|investigate|analyze|research/i,
        /왜|why|원인|cause|root\s*cause/i,
      ].some((p) => p.test(prompt))
    )
      score += 2;

    if (score <= 2) return null;
    const level = score <= 4 ? "SIMPLE" : score <= 6 ? "MODERATE" : "COMPLEX";
    const agents =
      score <= 4 ? "1 agent" : score <= 6 ? "2-3 agents" : "5+ agents";
    return `[Effort] ${level} (${score}/8) -> ${agents}`;
  } catch (_) {
    return null;
  }
}

// ─── CLI Entry Point ─────────────────────────────────────────
if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", async () => {
    try {
      const event = JSON.parse(input);
      const prompt = event.prompt || event.user_prompt || "";
      const context = { workspaceRoot: event.workspace_root || process.cwd() };
      const result = await onUserPromptSubmit(prompt, context);
      if (result && result !== prompt) {
        process.stdout.write(result);
      }
      process.exit(0);
    } catch (e) {
      process.stderr.write(`[UserPromptSubmit] Parse error: ${e.message}\n`);
      process.exit(0);
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

module.exports = { onUserPromptSubmit, classifyPromptComplexity };
