export const meta = {
  name: "harness-legacy-scan",
  description:
    "Read-only audit of the AI coding harness: find stale rules, duplicate instructions, global-context tax, over-broad skills, redundant hooks/MCP, and product-default overlap. Classifies each finding KEEP/SHRINK/MOVE/SPLIT/CONVERT/DELETE. Writes a report only — modifies nothing.",
  phases: [
    {
      title: "Inventory",
      detail: "Catalog + classify all harness files (read-only Explore agent)",
    },
    {
      title: "Analysis",
      detail:
        "Global-context-tax, per-skill quality (x27), cross-skill overlap, product overlap, safety/permission",
    },
    {
      title: "Plan",
      detail: "Refactor Planner dedups + classifies every finding",
    },
    {
      title: "Adversarial",
      detail: "Challenge each DELETE/SHRINK/MOVE/CONVERT + auto-flagged item",
    },
  ],
};

// ---- shared prompt fragments ----
const READONLY = [
  "⛔ READ-ONLY 감사다. 너는 파일을 수정/삭제/생성할 권한이 없다 (Edit/Write 도구 자체가 없음).",
  "settings.json / hooks / MCP 설정 / allowed-tools 권한을 절대 바꾸지 마라.",
  "무언가 고치고 싶은 충동이 들면, 고치지 말고 finding 으로만 기록하라.",
  "산출물은 오직 구조화된 분석 데이터다. 어떤 파일도 건드리지 마라.",
].join(" ");

const PRINCIPLES = [
  "감사 원칙:",
  '(1) 좋은 하네스는 "반복되는 실제 실수"를 막아야 한다.',
  "(2) 과거의 습관을 보존하려고 존재해서는 안 된다.",
  "(3) 더 많이 붙이는 게 아니라 필요한 순간에만 나타나야 한다.",
  '(4) 이번 목표는 규칙을 추가하는 게 아니라 낡은 규칙을 찾아 "줄일 후보"를 분류하는 것이다.',
  "확신 없으면 DELETE 보다 SHRINK/MOVE/SPLIT 을 선호하라. 안전망 제거는 보수적으로.",
].join(" ");

const FINDING_FORMAT = [
  "각 finding 은 반드시 다음 필드를 채운다:",
  "path(경로), current_purpose(현재 목적), problem(발견한 문제), evidence(근거 — 줄 수/문구/중복지점 등 구체적으로),",
  "action(KEEP/SHRINK/MOVE/SPLIT/CONVERT/DELETE), move_target(MOVE/SPLIT 시 추천 위치, 아니면 빈 문자열),",
  "risk(low/medium/high — 그 조치를 했을 때의 위험), confidence(low/medium/high — 네 판단 신뢰도),",
  "harness_diet_auto(boolean — /harness-diet 라는 후속 자동화 도구가 사람 승인 없이 처리해도 안전한가).",
  "권한/hook/MCP/보안 관련 항목은 harness_diet_auto=false 로 두어라 (자동 처리 금지).",
].join(" ");

// ---- seed data (hardcoded; background dynamic workflows do not inject `args`) ----
const SKILLS = [
  { name: "checklist-generator", lines: 49 },
  { name: "code-simplifier", lines: 52 },
  { name: "kiips-backend", lines: 104 },
  { name: "kiips-build", lines: 108 },
  { name: "kiips-button-guide", lines: 426 },
  { name: "kiips-checklist-list-popup", lines: 407 },
  { name: "kiips-db-inspector", lines: 222 },
  { name: "kiips-feature-planner", lines: 322 },
  { name: "kiips-frontend-guidelines", lines: 310 },
  { name: "kiips-learning", lines: 65 },
  { name: "kiips-linked-approval-template", lines: 208 },
  { name: "kiips-logs", lines: 68 },
  { name: "kiips-mybatis-guide", lines: 373 },
  { name: "kiips-operator-onboarding", lines: 296 },
  { name: "kiips-orchestration", lines: 66 },
  { name: "kiips-page-harness", lines: 310 },
  { name: "kiips-page-pattern-guide", lines: 501 },
  { name: "kiips-quality", lines: 67 },
  { name: "kiips-realgrid-guide", lines: 467 },
  { name: "kiips-regist-modal-guide", lines: 253 },
  { name: "kiips-scss", lines: 531 },
  { name: "kiips-search-filter-guide", lines: 275 },
  { name: "kiips-security-guide", lines: 280 },
  { name: "kiips-stitch-bridge", lines: 136 },
  { name: "kiips-test-runner", lines: 284 },
  { name: "kiips-ui-component-builder", lines: 472 },
  { name: "legacy-compliance-checker", lines: 127 },
];
const NATIVE_FEATURES = [
  "Native Skills system (Skill tool + plugin skills, on-demand probabilistic loading)",
  "Native Hooks (PreToolUse/PostToolUse/SessionStart/Stop/PreCompact/Notification/UserPromptSubmit)",
  "Plan mode (EnterPlanMode/ExitPlanMode)",
  "TodoWrite native task tracking",
  "Subagents: Task/Agent tool + Workflow orchestration",
  "Command sandbox (allow/deny filesystem + network)",
  "Permission system (allow/deny/ask rules, deny takes precedence)",
  "MCP integration (native server config + enable/disable)",
  "File-based Memory system",
  "Output styles",
  "Native /compact + context-window management + auto-summary",
  "Built-in /code-review and /security-review",
  "LSP integration",
  "WebFetch / WebSearch",
  "superpowers plugin skills (brainstorming, TDD, debugging, verification-before-completion, etc.)",
];

// ====================================================================
// PHASE 1 — INVENTORY (read-only Explore)
// ====================================================================
phase("Inventory");

const INVENTORY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string" },
          item_count: { type: "integer" },
          notes: { type: "string" },
        },
        required: ["category", "item_count", "notes"],
      },
    },
    anomalies: { type: "array", items: { type: "string" } },
    in_scope_paths: { type: "array", items: { type: "string" } },
  },
  required: ["categories", "anomalies", "in_scope_paths"],
};

const inventoryPrompt = [
  READONLY,
  PRINCIPLES,
  "너는 Inventory Agent 다. KiiPS 프로젝트(cwd)의 AI 코딩 하네스 전체를 목록화·분류한다.",
  "감사 범위: CLAUDE.md, AGENTS.md, .claude/rules/**, .claude/skills/**, .claude/workflows/**, .claude/settings.json, .claude/settings.local.json, .cursor/**, MCP 설정(.mcp.json + .claude/mcp.json), hooks(.claude/hooks/** + settings.json 의 hooks 블록).",
  "커맨드(.claude/commands/**)와 에이전트(.claude/agents/**)도 인접 하네스로 가볍게 포함하라.",
  "각 항목을 분류하라: user-authored(사용자 작성 하네스) / plugin(설치된 플러그인) / product-default(제품 기본) / orphaned(고아 — 어디서도 참조 안 됨) / duplicate(.min.js 중복본 등).",
  "특히 다음 anomaly 를 찾아 보고하라: (a) .claude/hooks/ 의 31개 파일 중 settings.json 에 실제 wiring 안 된 고아 훅, (b) *.min.js 중복본, (c) *.log 파일, (d) .mcp.json(빈 객체) vs .claude/mcp.json(filesystem+obsidian) 의 MCP 정의 분산, (e) .cursor 에 rules 가 아니라 skills 만 있는 점, (f) skills-registry/skill-rules/skills.md 의 drift(문서27 vs 실측 불일치).",
  "settings.json 의 hooks 블록을 읽어 어떤 훅 스크립트가 실제로 wiring 되어 있는지 확인한 뒤, .claude/hooks/ 디렉토리의 파일과 대조해 고아를 식별하라.",
  "args 에 내가 정찰한 시드 데이터(skills, ruleFiles, commands, agentDefs, notes)가 들어있다. 이를 출발점으로 삼되, 직접 ls/grep 으로 검증하라.",
  "in_scope_paths 에는 후속 분석이 다룰 실제 경로 목록을 담아라.",
].join("\n");

const inventory = await agent(inventoryPrompt, {
  agentType: "Explore",
  schema: INVENTORY_SCHEMA,
  phase: "Inventory",
  label: "inventory",
});

log("Inventory 완료 — 분석 단계로 fan-out");

// ====================================================================
// PHASE 2 — ANALYSIS (fan-out, barrier before planner)
// ====================================================================
phase("Analysis");

const FINDING_ITEM = {
  type: "object",
  additionalProperties: false,
  properties: {
    path: { type: "string" },
    current_purpose: { type: "string" },
    problem: { type: "string" },
    evidence: { type: "string" },
    action: {
      type: "string",
      enum: ["KEEP", "SHRINK", "MOVE", "SPLIT", "CONVERT", "DELETE"],
    },
    move_target: { type: "string" },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    harness_diet_auto: { type: "boolean" },
  },
  required: [
    "path",
    "current_purpose",
    "problem",
    "evidence",
    "action",
    "move_target",
    "risk",
    "confidence",
    "harness_diet_auto",
  ],
};
const FINDINGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    agent: { type: "string" },
    findings: { type: "array", items: FINDING_ITEM },
  },
  required: ["agent", "findings"],
};

const invJson = JSON.stringify(inventory);

// --- 2a. Global Context Tax ---
const globalTaxPrompt = [
  READONLY,
  PRINCIPLES,
  FINDING_FORMAT,
  'agent 필드는 "global-context-tax".',
  '너는 Global Context Tax Agent 다. 매 세션 자동으로 컨텍스트에 붙는 전역 지침의 "비용 대비 가치"를 분석한다.',
  "대상: CLAUDE.md + .claude/rules/ 의 9개 파일(anti-rationalization, dark-theme, editing, error-handling, power-stack, ralph-loop-detection, svn-workflow, validation, verification) + Explanatory output-style + SessionStart 훅이 매 세션 주입하는 내용(드리프트 경고, 이전 세션 요약, superpowers 스킬 전문).",
  "각 파일을 Read 로 직접 읽어라. 다음을 판정하라:",
  "- 항상 로드되지만 특정 작업에서만 관련된 규칙인가? → 그렇다면 on-demand Skill 로 MOVE 후보 (move_target 명시).",
  "- 여러 rules 파일에 같은 지시가 중복되는가? (예: anti-rationalization 과 verification 과 editing 사이의 중복) → SHRINK/병합.",
  "- 과도하게 장황한가? 같은 규칙을 표/문단/예시로 3번 반복하는가?",
  '- "반복되는 실제 실수 방지"가 아니라 "과거 습관 보존"인가?',
  "power-stack.md 를 특별히 검토하라: 모든 작업에 4-Phase 파이프라인(Gstack→GSD→Superpowers→QA)을 강제하는데, 이것이 매 세션 전역으로 always-on 인 게 적절한가, 아니면 무거운 작업에서만 호출되는 Skill 이어야 하는가?",
  "근거에는 반드시 줄 수와 구체적 중복 지점을 적어라.",
].join("\n");

// --- 2b. Cross-skill overlap (the gap per-skill agents cannot see) ---
const crossSkillPrompt = [
  READONLY,
  PRINCIPLES,
  FINDING_FORMAT,
  'agent 필드는 "cross-skill-overlap".',
  "너는 Cross-Skill Overlap Agent 다. 개별 스킬 품질이 아니라 *스킬들 사이의 커버리지 중복*만 본다.",
  "먼저 모든 스킬 description 을 한 번에 수집하라: bash 로 .claude/skills/*/SKILL.md 의 frontmatter description 을 전부 grep/awk 하라.",
  "commands(.claude/commands/**)와 rules 도 함께 고려하라 — skill↔command↔rule 경계를 넘는 중복도 찾는다.",
  "특히 다음 중복 후보를 검증하라(정찰에서 의심된 것):",
  '- kiips-page-harness / kiips-page-pattern-guide / kiips-ui-component-builder — description 에 "NOT for:" 상호배제 문구가 박혀 있음(과거에 겹쳐서 아팠다는 신호).',
  "- checklist-generator(skill) / kiips-checklist-list-popup(skill) / checklist-generator(agent).",
  "- kiips-button-guide(426L) 내용 ↔ kiips-frontend-guidelines / kiips-ui-component-builder.",
  "- code-simplifier(skill) ↔ simplify-code(command) ↔ ecc:simplify(플러그인).",
  "- kiips-learning(skill) ↔ learn/evolve/instinct-* (commands).",
  "- verify(command) ↔ verify-agent ↔ kiips-quality / verification.md(rule).",
  '겹치는 쌍/그룹마다 finding 을 만들고, 어느 쪽을 정본(canonical)으로 두고 어느 쪽을 SHRINK/MERGE/DELETE/CONVERT 할지 추천하라. "NOT for:" 문구의 존재 자체를 evidence 로 인용하라.',
  "path 는 중복 그룹의 대표 경로로, evidence 에 관련된 모든 경로를 나열하라.",
].join("\n");

// --- 2c. Product Overlap (grounded in observable native features) ---
const productOverlapPrompt = [
  READONLY,
  PRINCIPLES,
  FINDING_FORMAT,
  'agent 필드는 "product-overlap".',
  "너는 Product Overlap Agent 다. 예전엔 필요했지만 지금은 Claude Code / Codex / Cursor 의 *현재 네이티브 기능*과 중복되는 커스텀 하네스를 찾는다.",
  '추측하지 말고, 아래 "관측된 현재 네이티브 기능 목록"을 1차 증거로 고정하라:',
  JSON.stringify(NATIVE_FEATURES, null, 1),
  "다음 중복 가설을 구체적으로 검증하라(해당 파일을 Read 로 확인):",
  "- settings.json 의 permissionRules(deny rm/rm -rf/DROP) ↔ 네이티브 sandbox + permission deny 시스템.",
  "- power-stack.md 의 강제 4-Phase ↔ 네이티브 plan mode + skills + TodoWrite.",
  "- 커스텀 체크리스트(checklist-generator, .claude/checklists/) ↔ 네이티브 TodoWrite.",
  "- ralph-loop-detection.md + buildChecker.js 의 반복 편집 감지 ↔ (네이티브 대응 여부 평가).",
  "- verification.md(rule) ↔ superpowers:verification-before-completion(플러그인 스킬).",
  "- 커스텀 학습 시스템(observe.js, kiips-learning, instinct-*) ↔ 네이티브 Memory 시스템.",
  "- gemini-bridge / geminiAutoTrigger / geminiReviewGate ↔ 네이티브 subagent/Task + /code-review (외부 Gemini 의존이 아직 정당한가? 정찰 메모에 Gemini sunset 2026-06-18 언급 있음).",
  '중복이 확인되면 CONVERT(네이티브로 대체)/DELETE/SHRINK 를 추천하되, 네이티브가 "정말로" 같은 보장을 주는지 신중히 판단하고 confidence 를 정직하게 매겨라.',
].join("\n");

// --- 2d. Safety & Permission ---
const safetyPrompt = [
  READONLY,
  PRINCIPLES,
  FINDING_FORMAT,
  'agent 필드는 "safety-permission".',
  "너는 Safety and Permission Agent 다. hooks / allowed-tools / MCP 설정이 너무 넓은 권한을 주는지 분석한다.",
  "⚠️ 사용자는 이 단계에서 권한/hook/MCP 를 절대 바꾸지 말라고 했다. 너는 오직 *보고*만 한다. 모든 권한/hook/MCP finding 은 harness_diet_auto=false, 그리고 위험한 축소는 risk=high 로 표시하라.",
  "대상을 Read 로 직접 읽어라:",
  "- .claude/settings.json: hooks 블록(7개 이벤트), permissionRules(deny).",
  "- .claude/settings.local.json: permissions.allow(38개 항목), enabledMcpjsonServers, sandbox.",
  '- .claude/mcp.json: filesystem(루트 "." — 광범위!) + obsidian. .mcp.json(root, 빈 객체).',
  "다음을 평가하라:",
  "- 과도하게 넓은 Bash allow 패턴: Bash(node:*), Bash(bash:*), Bash(claude:*), Bash(python3:*) 등은 사실상 임의 코드 실행. 좁힐 여지가 있나?",
  '- filesystem MCP 서버가 프로젝트 루트 "." 전체에 read/write 접근 — 필요 범위인가?',
  "- 31개 훅 중 와이어된 것들이 PreToolUse 8개 등 — 너무 많은 PreToolUse 게이트가 마찰을 주는가? 어떤 게 진짜 사고를 막고 어떤 게 과잉인가?",
  "- ethicalValidator / postToolOrchestrator 등이 광범위한 matcher 로 모든 도구 호출을 가로채는가?",
  "권한 축소는 본질적으로 사람 승인이 필요하다 — 그렇게 표시하라.",
].join("\n");

// --- 2e. Per-skill quality (x27, sonnet, no cross-skill judgment) ---
function perSkillPrompt(s) {
  return [
    READONLY,
    PRINCIPLES,
    FINDING_FORMAT,
    'agent 필드는 "skill:' + s.name + '".',
    "너는 Skill Quality Agent 다. 오직 .claude/skills/" +
      s.name +
      "/SKILL.md 한 개만 평가한다.",
    "이 스킬의 SKILL.md(약 " +
      s.lines +
      "줄)와 디렉토리 내 보조 파일을 Read 로 읽어라.",
    "평가 항목(이 4가지만 — 다른 스킬과의 중복은 별도 에이전트가 보므로 판단하지 마라):",
    "1) 지금도 필요한가? 참조하는 패턴/파일/기술이 stale 하지 않은가?",
    '2) description(특히 "Use when:" 트리거)이 너무 넓은가? 너무 일반적인 단어(예: Java, 구현, UI, 코드 작성)로 거의 모든 세션에 잘못 트리거되는가?',
    "3) SKILL.md 가 너무 긴가? 경험칙: 본문 300줄 초과면 핵심만 SKILL.md 에 남기고 상세를 reference.md / examples.md 로 SPLIT 후보. " +
      s.lines +
      "줄을 이 기준으로 판정하라.",
    "4) 명시호출 전용(disable-model-invocation) 표시가 적절한가?",
    "문제가 없으면 action=KEEP 인 finding 하나를 반환하라(섹션 집계용). 문제가 있으면 해당 finding 들을 반환하라.",
    'SPLIT 추천 시 move_target 에 "reference.md" 또는 "examples.md" 처럼 분리 대상을 명시하라.',
  ].join("\n");
}

const analysisThunks = [
  () =>
    agent(globalTaxPrompt, {
      agentType: "Plan",
      schema: FINDINGS_SCHEMA,
      phase: "Analysis",
      label: "global-context-tax",
    }),
  () =>
    agent(crossSkillPrompt, {
      agentType: "Plan",
      schema: FINDINGS_SCHEMA,
      phase: "Analysis",
      label: "cross-skill-overlap",
    }),
  () =>
    agent(productOverlapPrompt, {
      agentType: "Plan",
      schema: FINDINGS_SCHEMA,
      phase: "Analysis",
      label: "product-overlap",
    }),
  () =>
    agent(safetyPrompt, {
      agentType: "Plan",
      schema: FINDINGS_SCHEMA,
      phase: "Analysis",
      label: "safety-permission",
    }),
];
for (const s of SKILLS) {
  analysisThunks.push(() =>
    agent(perSkillPrompt(s), {
      agentType: "Plan",
      model: "sonnet",
      schema: FINDINGS_SCHEMA,
      phase: "Analysis",
      label: "skill:" + s.name,
    }),
  );
}

const analysisResults = (await parallel(analysisThunks)).filter(Boolean);
const allFindings = [];
for (const r of analysisResults) {
  if (r && Array.isArray(r.findings)) {
    for (const f of r.findings) allFindings.push({ ...f, source: r.agent });
  }
}
log("Analysis 완료 — findings " + allFindings.length + "건, Planner 로 dedup");

// ====================================================================
// PHASE 3 — REFACTOR PLANNER (barrier: needs ALL findings)
// ====================================================================
phase("Plan");

const PLAN_ITEM = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    path: { type: "string" },
    current_purpose: { type: "string" },
    problem: { type: "string" },
    evidence: { type: "string" },
    action: {
      type: "string",
      enum: ["KEEP", "SHRINK", "MOVE", "SPLIT", "CONVERT", "DELETE"],
    },
    move_target: { type: "string" },
    risk: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    harness_diet_auto: { type: "boolean" },
    plan_note: { type: "string" },
  },
  required: [
    "id",
    "path",
    "current_purpose",
    "problem",
    "evidence",
    "action",
    "move_target",
    "risk",
    "confidence",
    "harness_diet_auto",
    "plan_note",
  ],
};
const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_summary: { type: "string" },
    items: { type: "array", items: PLAN_ITEM },
    counts: {
      type: "object",
      additionalProperties: false,
      properties: {
        KEEP: { type: "integer" },
        SHRINK: { type: "integer" },
        MOVE: { type: "integer" },
        SPLIT: { type: "integer" },
        CONVERT: { type: "integer" },
        DELETE: { type: "integer" },
      },
      required: ["KEEP", "SHRINK", "MOVE", "SPLIT", "CONVERT", "DELETE"],
    },
  },
  required: ["overall_summary", "items", "counts"],
};

const plannerPrompt = [
  READONLY,
  PRINCIPLES,
  "너는 Refactor Planner 다. 아래 모든 분석 finding 을 받아 dedup·정규화·분류한다.",
  "입력 finding(JSON):",
  JSON.stringify(allFindings),
  "인벤토리(JSON):",
  invJson,
  "할 일:",
  "1) 같은 대상을 가리키는 중복 finding 을 하나로 병합(여러 에이전트가 같은 파일을 지적했으면 합쳐라).",
  '2) 각 항목에 안정적 id("P1","P2"...)를 부여하라.',
  "3) 각 항목의 최종 action 을 KEEP/SHRINK/MOVE/SPLIT/CONVERT/DELETE 중 하나로 확정하라. 확신 없으면 DELETE 대신 보수적 조치.",
  "4) plan_note 에 한 줄 실행 메모를 적어라(무엇을 어디로/어떻게 줄일지).",
  "5) 권한/hook/MCP/보안 항목은 절대 harness_diet_auto=true 로 두지 마라(사람 승인 필요).",
  "6) move_target 을 정확히 채워라(MOVE 는 목적지 Skill/파일, SPLIT 은 reference.md/examples.md).",
  "overall_summary 에는 하네스의 전반적 상태 진단(3~5문장)과 가장 큰 절감 기회를 적어라.",
  "counts 에 action 별 개수를 집계하라.",
  'KEEP 항목도 모두 포함하라(최종 리포트의 "유지 항목" 섹션에 필요).',
].join("\n");

const plan = await agent(plannerPrompt, {
  agentType: "Plan",
  schema: PLAN_SCHEMA,
  phase: "Plan",
  label: "refactor-planner",
});
log(
  "Planner 완료 — 총 " + plan.items.length + "항목. Adversarial 검토 대상 선별",
);

// ====================================================================
// PHASE 4 — ADVERSARIAL REVIEW (challenge reductions + auto-flagged)
// ====================================================================
phase("Adversarial");

const ADV_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    item_id: { type: "string" },
    path: { type: "string" },
    original_action: { type: "string" },
    challenge: { type: "string" },
    verdict: { type: "string", enum: ["uphold", "downgrade", "reject"] },
    safer_action: {
      type: "string",
      enum: ["KEEP", "SHRINK", "MOVE", "SPLIT", "CONVERT", "DELETE", "none"],
    },
    reason: { type: "string" },
    human_approval_required: { type: "boolean" },
  },
  required: [
    "item_id",
    "path",
    "original_action",
    "challenge",
    "verdict",
    "safer_action",
    "reason",
    "human_approval_required",
  ],
};

const risky = plan.items.filter(
  (it) =>
    ["DELETE", "SHRINK", "MOVE", "CONVERT"].includes(it.action) ||
    it.harness_diet_auto === true,
);

function advPrompt(it) {
  return [
    READONLY,
    PRINCIPLES,
    "너는 Adversarial Reviewer 다. 아래 항목을 *줄이거나 자동 처리하면 오히려 위험해질 이유*를 적극적으로 반박하라.",
    "대상 항목(JSON):",
    JSON.stringify(it),
    "특히 harness_diet_auto=true 인 항목을 가장 강하게 의심하라 — 누군가 나중에 이 리스트를 무비판적으로 /harness-diet 에 돌린다.",
    "반박 관점:",
    '- 이 규칙/스킬/훅이 사실은 "반복되는 실제 실수"를 막고 있어서 제거하면 그 사고가 재발하는가?',
    '- "중복"으로 보이는 게 실제로는 의도된 defense-in-depth(다층 방어)인가?',
    '- 제품 네이티브 기능이 "정말로" 같은 보장을 주는가, 아니면 미묘하게 약한가?(예: 네이티브 plan mode 는 power-stack 의 TDD 강제와 다르다)',
    "- 전역→Skill MOVE 시, 확률적 on-demand 로딩이라 정작 필요한 순간 트리거 안 될 위험은?",
    "verdict: uphold(원래 조치 유지 타당) / downgrade(더 보수적 조치로) / reject(건드리지 말 것).",
    'downgrade/reject 면 safer_action 에 대안을 적어라(없으면 "none"=KEEP 유지).',
    "human_approval_required: 이 변경이 사람의 명시적 승인 없이 진행되면 안 되면 true.",
  ].join("\n");
}

let adversarial = [];
if (risky.length > 0) {
  adversarial = (
    await parallel(
      risky.map(
        (it) => () =>
          agent(advPrompt(it), {
            agentType: "Plan",
            schema: ADV_SCHEMA,
            phase: "Adversarial",
            label: "challenge:" + it.id,
          }),
      ),
    )
  ).filter(Boolean);
}
log(
  "Adversarial 완료 — " +
    adversarial.length +
    "/" +
    risky.length +
    " 항목 반박 검토",
);

return { inventory, findings_count: allFindings.length, plan, adversarial };
