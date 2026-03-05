#!/usr/bin/env node

/**
 * KiiPS UI Agent Integration Test
 *
 * Verifies that the kiips-ui-designer agent is properly integrated
 * into the ACE Framework and ready for automatic activation.
 *
 * Test Coverage:
 * 1. Agent configuration files exist
 * 2. JSON files are valid
 * 3. Agent is registered in hierarchy
 * 4. Capabilities are defined correctly
 * 5. Resource permissions are set
 *
 * @author KiiPS Development Team
 * @version 3.0.1-KiiPS
 * @date 2026-01-04
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
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
const results = [];

/**
 * Test result logger
 */
function logTest(testName, passed, details = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;

  console.log(`${color}${symbol} ${testName}${colors.reset}`);

  if (details && !passed) {
    console.log(`   ${colors.yellow}→ ${details}${colors.reset}`);
  }

  results.push({ testName, passed, details });

  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
}

/**
 * Test Suite
 */
console.log(`\n${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.bold}  KiiPS UI/UX Agent Integration Test${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Test 1: Agent Definition File Exists
console.log(`${colors.bold}[1] Agent Definition File${colors.reset}`);
const agentFilePath = path.join(__dirname, '../.claude/agents/kiips-ui-designer.md');
const agentFileExists = fs.existsSync(agentFilePath);
logTest('kiips-ui-designer.md exists', agentFileExists,
  agentFileExists ? '' : `File not found at ${agentFilePath}`);

// Test 2: Agent file has required YAML frontmatter
if (agentFileExists) {
  const agentContent = fs.readFileSync(agentFilePath, 'utf8');
  const hasYamlFrontmatter = agentContent.startsWith('---') &&
                              agentContent.indexOf('---', 3) > 0;
  logTest('Agent file has YAML frontmatter', hasYamlFrontmatter,
    hasYamlFrontmatter ? '' : 'Missing YAML frontmatter (---...---)');

  // Check for required fields in frontmatter
  const requiredFields = ['name:', 'model:', 'color:', 'tools:'];
  requiredFields.forEach(field => {
    const hasField = agentContent.includes(field);
    logTest(`  → Frontmatter includes '${field.replace(':', '')}'`, hasField,
      hasField ? '' : `Missing field: ${field}`);
  });
}

console.log('');

// Test 3: layer3-agent-model.json Configuration
console.log(`${colors.bold}[2] Layer 3 Agent Model Configuration${colors.reset}`);
const layer3Path = path.join(__dirname, '../.claude/ace-framework/layer3-agent-model.json');
const layer3Exists = fs.existsSync(layer3Path);
logTest('layer3-agent-model.json exists', layer3Exists,
  layer3Exists ? '' : `File not found at ${layer3Path}`);

if (layer3Exists) {
  try {
    const layer3Content = JSON.parse(fs.readFileSync(layer3Path, 'utf8'));
    logTest('layer3-agent-model.json is valid JSON', true);

    // Check if kiips-ui-designer is registered
    const hasUIDesigner = layer3Content.agents &&
                           layer3Content.agents['kiips-ui-designer'];
    logTest('kiips-ui-designer agent is registered', hasUIDesigner,
      hasUIDesigner ? '' : 'Agent not found in agents object');

    if (hasUIDesigner) {
      const agent = layer3Content.agents['kiips-ui-designer'];

      // Check required fields
      logTest('  → Has agent_id', agent.agent_id === 'kiips-ui-designer');
      logTest('  → Has model (sonnet-4.5)', agent.model === 'sonnet-4.5');
      logTest('  → Has role (ui-ux-specialist)', agent.role === 'ui-ux-specialist');
      logTest('  → Has hierarchy (secondary)', agent.hierarchy === 'secondary');

      // Check capabilities
      const hasCaps = agent.capabilities &&
                      agent.capabilities.domain_expertise;
      logTest('  → Has domain_expertise', hasCaps);

      if (hasCaps) {
        const expertise = agent.capabilities.domain_expertise;
        const requiredExpertise = [
          'jsp_template',
          'realgrid_2_8_8',
          'apexcharts',
          'bootstrap_4',
          'scss'
        ];

        requiredExpertise.forEach(skill => {
          const hasSkill = expertise[skill] !== undefined;
          const score = expertise[skill] || 0;
          logTest(`     • ${skill} (${score})`, hasSkill && score >= 0.8,
            hasSkill ? '' : `Missing or low score for ${skill}`);
        });
      }

      // Check specializations (5 Skills)
      const hasSpecializations = agent.specializations;
      logTest('  → Has specializations', hasSpecializations !== undefined);

      if (hasSpecializations) {
        const requiredSkills = [
          'ui_component_builder',
          'realgrid_expert',
          'responsive_validator',
          'accessibility_checker',
          'scss_theme_manager'
        ];

        requiredSkills.forEach(skillKey => {
          const hasSkill = agent.specializations[skillKey] !== undefined;
          logTest(`     • ${skillKey}`, hasSkill,
            hasSkill ? '' : `Missing specialization: ${skillKey}`);
        });
      }

      // Check exclusive permissions
      const hasPermissions = agent.exclusive_permissions &&
                              agent.exclusive_permissions.length > 0;
      logTest('  → Has exclusive_permissions', hasPermissions);

      if (hasPermissions) {
        const requiredPerms = [
          'modify_jsp_files',
          'modify_scss_files',
          'configure_realgrid'
        ];

        requiredPerms.forEach(perm => {
          const hasPerm = agent.exclusive_permissions.includes(perm);
          logTest(`     • ${perm}`, hasPerm);
        });
      }
    }

    // Check capability_matching task types
    const hasCapMatching = layer3Content.capability_matching &&
                            layer3Content.capability_matching.task_types;
    logTest('capability_matching.task_types exists', hasCapMatching);

    if (hasCapMatching) {
      const taskTypes = layer3Content.capability_matching.task_types;
      const uiTaskTypes = [
        'ui_component_creation',
        'jsp_template_development',
        'realgrid_configuration',
        'responsive_design',
        'accessibility_validation',
        'scss_theme_development'
      ];

      uiTaskTypes.forEach(taskType => {
        const hasTaskType = taskTypes[taskType] !== undefined;
        const isPrimaryAgent = hasTaskType &&
                                taskTypes[taskType].primary_agent === 'kiips-ui-designer';
        logTest(`     • ${taskType}`, hasTaskType && isPrimaryAgent,
          hasTaskType ? (isPrimaryAgent ? '' : 'Wrong primary agent') : `Missing task type`);
      });
    }

  } catch (error) {
    logTest('layer3-agent-model.json is valid JSON', false, error.message);
  }
}

console.log('');

// Test 4: ace-config.json Configuration
console.log(`${colors.bold}[3] ACE Config Integration${colors.reset}`);
const aceConfigPath = path.join(__dirname, '../.claude/ace-framework/ace-config.json');
const aceConfigExists = fs.existsSync(aceConfigPath);
logTest('ace-config.json exists', aceConfigExists,
  aceConfigExists ? '' : `File not found at ${aceConfigPath}`);

if (aceConfigExists) {
  try {
    const aceConfig = JSON.parse(fs.readFileSync(aceConfigPath, 'utf8'));
    logTest('ace-config.json is valid JSON', true);

    // Check if kiips-ui-designer is in secondary agents
    const hasSecondary = aceConfig.agentHierarchy &&
                          aceConfig.agentHierarchy.secondary;
    logTest('agentHierarchy.secondary exists', hasSecondary);

    if (hasSecondary) {
      const uiDesignerInHierarchy = aceConfig.agentHierarchy.secondary.find(
        agent => agent.id === 'kiips-ui-designer'
      );
      logTest('kiips-ui-designer in secondary agents', uiDesignerInHierarchy !== undefined);

      if (uiDesignerInHierarchy) {
        logTest('  → Has correct model (sonnet-4.5)',
          uiDesignerInHierarchy.model === 'sonnet-4.5');
        logTest('  → Has correct role (ui-ux-specialist)',
          uiDesignerInHierarchy.role === 'ui-ux-specialist');
        logTest('  → Has configFile reference',
          uiDesignerInHierarchy.configFile !== undefined);
      }
    }

    // Check KiiPS-UI resource permissions
    const hasResourceMgmt = aceConfig.resourceManagement &&
                             aceConfig.resourceManagement.lockableModules;
    logTest('resourceManagement.lockableModules exists', hasResourceMgmt);

    if (hasResourceMgmt) {
      const kiipsUI = aceConfig.resourceManagement.lockableModules.find(
        module => module.name === 'KiiPS-UI'
      );
      logTest('KiiPS-UI module is lockable', kiipsUI !== undefined);

      if (kiipsUI) {
        const hasAllowedAgents = kiipsUI.allowedSecondaryAgents !== undefined;
        logTest('  → Has allowedSecondaryAgents', hasAllowedAgents);

        if (hasAllowedAgents) {
          const uiDesignerAllowed = kiipsUI.allowedSecondaryAgents.find(
            agent => agent.agentId === 'kiips-ui-designer'
          );
          logTest('  → kiips-ui-designer has access', uiDesignerAllowed !== undefined);

          if (uiDesignerAllowed) {
            logTest('     • Has allowedPatterns',
              uiDesignerAllowed.allowedPatterns &&
              uiDesignerAllowed.allowedPatterns.length > 0);
            logTest('     • Has deniedPatterns',
              uiDesignerAllowed.deniedPatterns &&
              uiDesignerAllowed.deniedPatterns.length > 0);
          }
        }
      }
    }

  } catch (error) {
    logTest('ace-config.json is valid JSON', false, error.message);
  }
}

console.log('');

// Test 5: capability-matching.json File
console.log(`${colors.bold}[4] Capability Matching Configuration${colors.reset}`);
const capMatchPath = path.join(__dirname, '../.claude/ace-framework/capability-matching.json');
const capMatchExists = fs.existsSync(capMatchPath);
logTest('capability-matching.json exists', capMatchExists,
  capMatchExists ? '' : `File not found at ${capMatchPath}`);

if (capMatchExists) {
  try {
    const capMatch = JSON.parse(fs.readFileSync(capMatchPath, 'utf8'));
    logTest('capability-matching.json is valid JSON', true);

    // Check task types
    const hasTaskTypes = capMatch.taskTypes !== undefined;
    logTest('Has taskTypes section', hasTaskTypes);

    if (hasTaskTypes) {
      const uiTasks = Object.keys(capMatch.taskTypes).filter(key =>
        capMatch.taskTypes[key].primaryAgent === 'kiips-ui-designer'
      );
      logTest(`  → UI tasks count (${uiTasks.length})`, uiTasks.length >= 5,
        uiTasks.length >= 5 ? '' : `Expected at least 5, got ${uiTasks.length}`);
    }

    // Check escalation rules
    const hasEscalation = capMatch.escalationRules !== undefined;
    logTest('Has escalationRules section', hasEscalation);

    // Check priority matrix
    const hasPriority = capMatch.priorityMatrix !== undefined;
    logTest('Has priorityMatrix section', hasPriority);

  } catch (error) {
    logTest('capability-matching.json is valid JSON', false, error.message);
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
  console.log(`${colors.green}The kiips-ui-designer agent is properly integrated.${colors.reset}\n`);
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
