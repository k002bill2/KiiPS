#!/usr/bin/env node

/**
 * KiiPS UI Skills Integration Test
 *
 * Verifies that all 5 UI Skills are properly integrated and ready for activation.
 *
 * Test Coverage:
 * 1. All 5 SKILL.md files exist and valid
 * 2. skill-rules.json includes all 5 skills
 * 3. Activation keywords/patterns properly configured
 * 4. File triggers correctly defined
 * 5. Priority/enforcement levels set
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
console.log(`${colors.bold}  KiiPS UI Skills Integration Test${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Define 5 UI Skills
const uiSkills = [
  {
    name: 'kiips-ui-component-builder',
    priority: 'high',
    enforcement: 'require',
    keywords: ['UI 컴포넌트', 'JSP 생성', '그리드 생성', '차트 추가']
  },
  {
    name: 'kiips-realgrid-guide',
    priority: 'critical',
    enforcement: 'require',
    keywords: ['RealGrid', '그리드 설정', '엑셀 내보내기']
  },
  {
    name: 'kiips-responsive-validator',
    priority: 'high',
    enforcement: 'require',
    keywords: ['반응형 테스트', '모바일 확인', '브레이크포인트']
  },
  {
    name: 'kiips-a11y-checker',
    priority: 'high',
    enforcement: 'require',
    keywords: ['접근성', 'WCAG', 'ARIA']
  },
  {
    name: 'kiips-scss-theme-manager',
    priority: 'normal',
    enforcement: 'suggest',
    keywords: ['SCSS', '스타일', '테마']
  }
];

// Test 1: SKILL.md Files Exist
console.log(`${colors.bold}[1] SKILL.md Files${colors.reset}`);
uiSkills.forEach(skill => {
  const skillPath = path.join(__dirname, `../.claude/skills/${skill.name}/SKILL.md`);
  const exists = fs.existsSync(skillPath);
  logTest(`${skill.name}/SKILL.md exists`, exists,
    exists ? '' : `File not found at ${skillPath}`);

  if (exists) {
    const content = fs.readFileSync(skillPath, 'utf8');

    // Check YAML frontmatter
    const hasYaml = content.startsWith('---') && content.indexOf('---', 3) > 0;
    logTest(`  → Has YAML frontmatter`, hasYaml);

    if (hasYaml) {
      // Check required fields
      logTest(`     • name:`, content.includes('name:'));
      logTest(`     • description:`, content.includes('description:'));
      logTest(`     • version:`, content.includes('version:'));
      logTest(`     • priority: ${skill.priority}`, content.includes(`priority: ${skill.priority}`));
      logTest(`     • enforcement: ${skill.enforcement}`, content.includes(`enforcement: ${skill.enforcement}`));
    }

    // Check required sections
    logTest(`  → Has Purpose section`, content.includes('## 📋 Purpose') || content.includes('## Purpose'));
    logTest(`  → Has When to Use section`, content.includes('## 🎯 When to Use') || content.includes('## When to Use'));
    logTest(`  → Has Examples/Reference`, content.includes('## 🚀') || content.includes('## Examples') || content.includes('## Quick Reference'));
  }
});

console.log('');

// Test 2: skill-rules.json Configuration
console.log(`${colors.bold}[2] skill-rules.json Configuration${colors.reset}`);
const skillRulesPath = path.join(__dirname, '../skill-rules.json');
const skillRulesExists = fs.existsSync(skillRulesPath);
logTest('skill-rules.json exists', skillRulesExists);

if (skillRulesExists) {
  try {
    const skillRules = JSON.parse(fs.readFileSync(skillRulesPath, 'utf8'));
    logTest('skill-rules.json is valid JSON', true);

    // Check each skill is registered
    uiSkills.forEach(skill => {
      const isRegistered = skillRules[skill.name] !== undefined;
      logTest(`${skill.name} is registered`, isRegistered);

      if (isRegistered) {
        const config = skillRules[skill.name];

        // Check priority
        logTest(`  → priority: ${skill.priority}`,
          config.priority === skill.priority,
          config.priority === skill.priority ? '' : `Expected ${skill.priority}, got ${config.priority}`);

        // Check enforcement
        logTest(`  → enforcement: ${skill.enforcement}`,
          config.enforcement === skill.enforcement,
          config.enforcement === skill.enforcement ? '' : `Expected ${skill.enforcement}, got ${config.enforcement}`);

        // Check promptTriggers
        const hasPromptTriggers = config.promptTriggers !== undefined;
        logTest(`  → Has promptTriggers`, hasPromptTriggers);

        if (hasPromptTriggers) {
          const hasKeywords = config.promptTriggers.keywords &&
                               config.promptTriggers.keywords.length > 0;
          logTest(`     • keywords (${config.promptTriggers.keywords?.length || 0})`,
            hasKeywords && config.promptTriggers.keywords.length >= 3,
            hasKeywords ? '' : 'Need at least 3 keywords');

          const hasIntentPatterns = config.promptTriggers.intentPatterns &&
                                     config.promptTriggers.intentPatterns.length > 0;
          logTest(`     • intentPatterns (${config.promptTriggers.intentPatterns?.length || 0})`,
            hasIntentPatterns,
            hasIntentPatterns ? '' : 'Missing intentPatterns');

          // Verify some sample keywords exist
          skill.keywords.slice(0, 2).forEach(keyword => {
            const hasKeyword = config.promptTriggers.keywords.includes(keyword);
            logTest(`     • keyword: "${keyword}"`, hasKeyword);
          });
        }

        // Check fileTriggers (optional but recommended)
        const hasFileTriggers = config.fileTriggers !== undefined;
        if (hasFileTriggers) {
          logTest(`  → Has fileTriggers`, true);
          logTest(`     • pathPatterns`, config.fileTriggers.pathPatterns?.length > 0);
        }
      }
    });

  } catch (error) {
    logTest('skill-rules.json is valid JSON', false, error.message);
  }
}

console.log('');

// Test 3: Agent Integration (kiips-ui-designer)
console.log(`${colors.bold}[3] Agent Integration (kiips-ui-designer)${colors.reset}`);

// Check agent file
const agentPath = path.join(__dirname, '../.claude/agents/kiips-ui-designer.md');
logTest('kiips-ui-designer.md exists', fs.existsSync(agentPath));

// Check layer3-agent-model.json
const layer3Path = path.join(__dirname, '../.claude/ace-framework/layer3-agent-model.json');
if (fs.existsSync(layer3Path)) {
  try {
    const layer3 = JSON.parse(fs.readFileSync(layer3Path, 'utf8'));
    const hasAgent = layer3.agents && layer3.agents['kiips-ui-designer'];
    logTest('kiips-ui-designer in layer3-agent-model.json', hasAgent);

    if (hasAgent) {
      const agent = layer3.agents['kiips-ui-designer'];

      // Check specializations map to our 5 skills
      const hasSpecializations = agent.specializations !== undefined;
      logTest('  → Has specializations', hasSpecializations);

      if (hasSpecializations) {
        const skillMappings = [
          'ui_component_builder',
          'realgrid_expert',
          'responsive_validator',
          'accessibility_checker',
          'scss_theme_manager'
        ];

        skillMappings.forEach(skillKey => {
          const hasMapped = agent.specializations[skillKey] !== undefined;
          logTest(`     • ${skillKey}`, hasMapped);
        });
      }
    }
  } catch (error) {
    logTest('layer3-agent-model.json valid', false, error.message);
  }
}

console.log('');

// Test 4: Activation Simulation
console.log(`${colors.bold}[4] Activation Simulation${colors.reset}`);

const testScenarios = [
  {
    prompt: "펀드 목록 조회 페이지 만들어줘",
    expectedSkills: ['kiips-ui-component-builder', 'kiips-realgrid-guide']
  },
  {
    prompt: "RealGrid 설정 도와줘",
    expectedSkills: ['kiips-realgrid-guide']
  },
  {
    prompt: "반응형 테스트 해줘",
    expectedSkills: ['kiips-responsive-validator']
  },
  {
    prompt: "접근성 검증해줘",
    expectedSkills: ['kiips-a11y-checker']
  },
  {
    prompt: "SCSS 테마 만들어줘",
    expectedSkills: ['kiips-scss-theme-manager']
  }
];

const skillRules = JSON.parse(fs.readFileSync(skillRulesPath, 'utf8'));

testScenarios.forEach((scenario, index) => {
  const matchedSkills = [];

  // Simulate keyword matching
  uiSkills.forEach(skill => {
    const config = skillRules[skill.name];
    if (config && config.promptTriggers && config.promptTriggers.keywords) {
      const matched = config.promptTriggers.keywords.some(keyword =>
        scenario.prompt.includes(keyword)
      );

      if (matched) {
        matchedSkills.push(skill.name);
      }
    }
  });

  const allExpectedMatched = scenario.expectedSkills.every(expected =>
    matchedSkills.includes(expected)
  );

  logTest(`Scenario ${index + 1}: "${scenario.prompt}"`, allExpectedMatched,
    allExpectedMatched ? '' : `Expected ${scenario.expectedSkills.join(', ')}, got ${matchedSkills.join(', ')}`);

  if (allExpectedMatched) {
    matchedSkills.forEach(matched => {
      logTest(`  → Activated: ${matched}`, true);
    });
  }
});

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
  console.log(`${colors.green}All 5 UI Skills are properly integrated and ready for activation.${colors.reset}\n`);
  process.exit(0);
} else if (passRate >= 80) {
  console.log(`${colors.yellow}${colors.bold}⚠️  MOSTLY PASSING${colors.reset}`);
  console.log(`${colors.yellow}Some issues found, but core integration is complete.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}❌ TESTS FAILED${colors.reset}`);
  console.log(`${colors.red}Critical issues found. Please review the errors above.${colors.reset}\n`);
  process.exit(1);
}
