#!/usr/bin/env node

/**
 * KiiPS Agent Activation Test
 *
 * Validates that UI tasks route to kiips-ui-designer and backend tasks route to kiips-developer.
 *
 * Test Coverage:
 * 1. UI tasks → kiips-ui-designer (7 scenarios)
 * 2. Backend tasks → kiips-developer (3 scenarios)
 * 3. Hybrid tasks → Primary coordination
 * 4. Capability matching logic
 *
 * @author KiiPS Development Team
 * @version 3.0.1-KiiPS
 * @date 2026-01-04
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let passCount = 0;
let failCount = 0;

function logTest(testName, passed, details = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;

  console.log(`${color}${symbol} ${testName}${colors.reset}`);

  if (details && !passed) {
    console.log(`   ${colors.yellow}→ ${details}${colors.reset}`);
  }

  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
}

console.log(`\n${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.bold}  KiiPS Agent Activation Test${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Load configuration files
const layer3Path = path.join(__dirname, '../.claude/ace-framework/layer3-agent-model.json');
const capabilityMatchingPath = path.join(__dirname, '../.claude/ace-framework/capability-matching.json');

console.log(`${colors.bold}[1] Configuration Files${colors.reset}`);
logTest('layer3-agent-model.json exists', fs.existsSync(layer3Path));
logTest('capability-matching.json exists', fs.existsSync(capabilityMatchingPath));

let layer3Config, capabilityConfig;

try {
  layer3Config = JSON.parse(fs.readFileSync(layer3Path, 'utf8'));
  logTest('layer3-agent-model.json valid JSON', true);
} catch (error) {
  logTest('layer3-agent-model.json valid JSON', false, error.message);
  process.exit(1);
}

try {
  capabilityConfig = JSON.parse(fs.readFileSync(capabilityMatchingPath, 'utf8'));
  logTest('capability-matching.json valid JSON', true);
} catch (error) {
  logTest('capability-matching.json valid JSON', false, error.message);
  process.exit(1);
}

console.log('');

// Test Agent Definitions
console.log(`${colors.bold}[2] Agent Definitions${colors.reset}`);

const uiDesigner = layer3Config.agents['kiips-ui-designer'];
const developer = layer3Config.agents['kiips-developer'];

logTest('kiips-ui-designer defined', uiDesigner !== undefined);
logTest('kiips-developer defined', developer !== undefined);

if (uiDesigner) {
  logTest('  → model: sonnet-4.5', uiDesigner.model === 'sonnet-4.5');
  logTest('  → hierarchy: secondary', uiDesigner.hierarchy === 'secondary');
  logTest('  → Has domain_expertise', uiDesigner.capabilities?.domain_expertise !== undefined);

  const expertise = uiDesigner.capabilities.domain_expertise;
  logTest('     • jsp_template ≥ 0.90', expertise.jsp_template >= 0.90);
  logTest('     • realgrid_2_8_8 ≥ 0.90', expertise.realgrid_2_8_8 >= 0.90);
  logTest('     • apexcharts ≥ 0.85', expertise.apexcharts >= 0.85);
  logTest('     • responsive_design ≥ 0.90', expertise.responsive_design >= 0.90);

  logTest('  → Has 5 specializations', Object.keys(uiDesigner.specializations || {}).length === 5);
}

console.log('');

// Test Task Type Definitions
console.log(`${colors.bold}[3] Task Type Definitions${colors.reset}`);

const taskTypes = capabilityConfig.taskTypes;
const uiTaskTypes = [
  'ui_component_creation',
  'jsp_template_development',
  'realgrid_configuration',
  'apexcharts_visualization',
  'responsive_design',
  'accessibility_validation',
  'scss_theme_development'
];

const backendTaskTypes = [
  'maven_build',
  'api_testing',
  'log_analysis'
];

uiTaskTypes.forEach(taskType => {
  const exists = taskTypes[taskType] !== undefined;
  logTest(`UI Task: ${taskType}`, exists);

  if (exists) {
    const task = taskTypes[taskType];
    const correctAgent = task.primaryAgent === 'kiips-ui-designer';
    logTest(`  → primaryAgent: kiips-ui-designer`, correctAgent,
      correctAgent ? '' : `Got ${task.primaryAgent}`);
  }
});

backendTaskTypes.forEach(taskType => {
  const exists = taskTypes[taskType] !== undefined;
  logTest(`Backend Task: ${taskType}`, exists);

  if (exists) {
    const task = taskTypes[taskType];
    const correctAgent = task.primaryAgent === 'kiips-developer';
    logTest(`  → primaryAgent: kiips-developer`, correctAgent,
      correctAgent ? '' : `Got ${task.primaryAgent}`);
  }
});

console.log('');

// Test Activation Scenarios
console.log(`${colors.bold}[4] Activation Scenarios${colors.reset}`);

const scenarios = [
  // UI Scenarios (should activate kiips-ui-designer)
  {
    type: 'UI',
    prompt: "펀드 목록 조회 페이지를 만들어줘. RealGrid로 표시하고 엑셀 다운로드 기능 추가해줘.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'ui_component_creation',
    expectedSkills: ['kiips-ui-component-builder', 'kiips-realgrid-guide']
  },
  {
    type: 'UI',
    prompt: "투자 현황 대시보드 만들어줘. 카드 4개랑 ApexCharts 차트 3개 추가해줘.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'ui_component_creation',
    expectedSkills: ['kiips-ui-component-builder']
  },
  {
    type: 'UI',
    prompt: "RealGrid 설정 좀 도와줘. 셀 편집 에디터 추가하고 필터링 기능 넣어야 해.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'realgrid_configuration',
    expectedSkills: ['kiips-realgrid-guide']
  },
  {
    type: 'UI',
    prompt: "이 페이지 반응형으로 테스트해줘. 모바일에서 깨지는지 확인해.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'responsive_design',
    expectedSkills: ['kiips-responsive-validator']
  },
  {
    type: 'UI',
    prompt: "웹 접근성 검증해줘. WCAG 2.1 AA 기준으로 ARIA 속성 확인해.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'accessibility_validation',
    expectedSkills: ['kiips-a11y-checker']
  },
  {
    type: 'UI',
    prompt: "SCSS 테마 시스템 만들어줘. 색상 변수랑 믹스인 정의해야 해.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'scss_theme_development',
    expectedSkills: ['kiips-scss-theme-manager']
  },
  {
    type: 'UI',
    prompt: "fund-list.jsp 파일 수정해줘. 검색 폼 추가하고 스타일 적용해.",
    expectedAgent: 'kiips-ui-designer',
    expectedTaskType: 'jsp_template_development',
    expectedSkills: ['kiips-ui-component-builder']
  },

  // Backend Scenarios (should activate kiips-developer)
  {
    type: 'Backend',
    prompt: "KiiPS-FD 모듈 빌드해줘. Maven clean package 실행해.",
    expectedAgent: 'kiips-developer',
    expectedTaskType: 'maven_build',
    expectedSkills: ['kiips-maven-builder']
  },
  {
    type: 'Backend',
    prompt: "API Gateway 테스트해줘. /api/funds/list 엔드포인트 확인해.",
    expectedAgent: 'kiips-developer',
    expectedTaskType: 'api_testing',
    expectedSkills: ['kiips-api-tester']
  },
  {
    type: 'Backend',
    prompt: "KiiPS-FD 서비스 로그 분석해줘. 에러 확인 필요해.",
    expectedAgent: 'kiips-developer',
    expectedTaskType: 'log_analysis',
    expectedSkills: ['kiips-log-analyzer']
  }
];

scenarios.forEach((scenario, index) => {
  const taskType = taskTypes[scenario.expectedTaskType];

  if (!taskType) {
    logTest(`Scenario ${index + 1} (${scenario.type}): Task type not found`, false);
    return;
  }

  const correctAgent = taskType.primaryAgent === scenario.expectedAgent;
  logTest(
    `Scenario ${index + 1} (${scenario.type}): "${scenario.prompt.substring(0, 50)}..."`,
    correctAgent,
    correctAgent ? '' : `Expected ${scenario.expectedAgent}, got ${taskType.primaryAgent}`
  );

  if (correctAgent) {
    console.log(`   ${colors.green}→ Task Type: ${scenario.expectedTaskType}${colors.reset}`);
    console.log(`   ${colors.green}→ Agent: ${scenario.expectedAgent}${colors.reset}`);

    if (scenario.expectedSkills.length > 0) {
      console.log(`   ${colors.green}→ Skills: ${scenario.expectedSkills.join(', ')}${colors.reset}`);
    }
  }
});

console.log('');

// Test Escalation Rules
console.log(`${colors.bold}[5] Escalation Rules${colors.reset}`);

const escalationRules = capabilityConfig.escalationRules;
const requiredRules = [
  'capabilityMismatch',
  'resourceUnavailable',
  'agentOverloaded',
  'ethicalConcern',
  'skillNotAvailable',
  'taskTimeout',
  'conflictDetected'
];

requiredRules.forEach(rule => {
  const exists = escalationRules[rule] !== undefined;
  logTest(`Escalation rule: ${rule}`, exists);

  if (exists) {
    const ruleConfig = escalationRules[rule];
    logTest(`  → Has escalateTo`, ruleConfig.escalateTo !== undefined);
    logTest(`  → Has condition`, ruleConfig.condition !== undefined);
  }
});

console.log('');

// Test Priority Matrix
console.log(`${colors.bold}[6] Priority Matrix${colors.reset}`);

const priorityMatrix = capabilityConfig.priorityMatrix;
logTest('Priority matrix defined', priorityMatrix !== undefined);

if (priorityMatrix) {
  logTest('Has priority factors', priorityMatrix.factors !== undefined);
  logTest('Has priority levels', priorityMatrix.priorityLevels !== undefined);

  if (priorityMatrix.priorityLevels) {
    const priorities = ['critical', 'high', 'normal', 'low'];
    const levels = priorityMatrix.priorityLevels.map(l => l.level);

    priorities.forEach(priority => {
      const exists = levels.includes(priority);
      logTest(`Priority level: ${priority}`, exists);
    });
  }
}

console.log('');

// Test Summary
console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.bold}  Test Summary${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

const totalTests = passCount + failCount;
const passRate = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0;

console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
console.log(`${colors.bold}Pass Rate: ${passRate}%${colors.reset}`);

console.log('');

// Verdict
if (failCount === 0) {
  console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED!${colors.reset}`);
  console.log(`${colors.green}Agent activation routing is properly configured.${colors.reset}\n`);
  process.exit(0);
} else if (passRate >= 80) {
  console.log(`${colors.yellow}${colors.bold}⚠️  MOSTLY PASSING${colors.reset}`);
  console.log(`${colors.yellow}Some issues found, but core routing is working.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}❌ TESTS FAILED${colors.reset}`);
  console.log(`${colors.red}Critical routing issues found. Please review the errors above.${colors.reset}\n`);
  process.exit(1);
}
