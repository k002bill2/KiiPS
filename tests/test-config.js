const fs = require('fs');

async function run() {
  const tests = [
    validateClaudeCodeJson,
    validateSkillRulesJson,
    validateHookMatchers,
    validateFileReferences
  ];

  let passed = true;
  const details = [];

  for (const test of tests) {
    const result = await test();
    if (!result.passed) passed = false;
    details.push(result);
  }

  return { passed, details };
}

function validateClaudeCodeJson() {
  try {
    const config = JSON.parse(fs.readFileSync('../.claudecode.json', 'utf8'));

    // Check hooks structure
    const hookTypes = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop'];
    const missingHooks = hookTypes.filter(type => !config.hooks[type]);

    if (missingHooks.length > 0) {
      return {
        passed: false,
        message: `Missing hooks: ${missingHooks.join(', ')}`,
        status: 'INCOMPLETE'
      };
    }

    // Check ACE Framework enabled
    if (!config.aceFramework || !config.aceFramework.enabled) {
      return {
        passed: false,
        message: 'ACE Framework not enabled',
        status: 'INCOMPLETE'
      };
    }

    // Check skill activation
    if (!config.skillActivation || !config.skillActivation.rulesFile) {
      return {
        passed: false,
        message: 'Skill activation not configured',
        status: 'INCOMPLETE'
      };
    }

    // Check Manager Agents (Layer 4.5)
    if (!config.aceFramework.layers || !config.aceFramework.layers.layer45_domain_orchestration) {
      return {
        passed: false,
        message: 'Layer 4.5 (Domain Orchestration) not configured',
        status: 'INCOMPLETE'
      };
    }

    const agentHierarchy = config.aceFramework.agentHierarchy || {};
    const managers = agentHierarchy.managers || [];

    if (managers.length === 0) {
      return {
        passed: false,
        message: 'No Manager Agents configured in agentHierarchy',
        status: 'INCOMPLETE'
      };
    }

    // Check required 4 managers
    const requiredManagers = ['build-manager', 'deployment-manager', 'feature-manager', 'ui-manager'];
    const configuredManagers = managers.map(m => m.id);
    const missingManagers = requiredManagers.filter(m => !configuredManagers.includes(m));

    if (missingManagers.length > 0) {
      return {
        passed: false,
        message: `Missing Manager Agents: ${missingManagers.join(', ')}`,
        status: 'INCOMPLETE'
      };
    }

    // Check featureFlags
    const featureFlags = config.aceFramework.featureFlags || {};

    if (featureFlags.enableManagerAgents === undefined) {
      return {
        passed: false,
        message: 'featureFlags.enableManagerAgents not configured',
        status: 'INCOMPLETE'
      };
    }

    if (!featureFlags.managerRoutingMode) {
      return {
        passed: false,
        message: 'featureFlags.managerRoutingMode not configured',
        status: 'INCOMPLETE'
      };
    }

    const validRoutingModes = ['domain-first', 'fallback-only'];
    if (!validRoutingModes.includes(featureFlags.managerRoutingMode)) {
      return {
        passed: false,
        message: `Invalid managerRoutingMode: ${featureFlags.managerRoutingMode}`,
        status: 'INVALID'
      };
    }

    return {
      passed: true,
      message: '.claudecode.json - All required sections present (including Layer 4.5)',
      status: 'OK'
    };
  } catch (error) {
    return {
      passed: false,
      message: `.claudecode.json parse error: ${error.message}`,
      status: 'ERROR'
    };
  }
}

function validateSkillRulesJson() {
  try {
    const rules = JSON.parse(fs.readFileSync('../skill-rules.json', 'utf8'));

    // Check required fields for each rule
    for (const [name, rule] of Object.entries(rules)) {
      if (!rule.type) {
        return {
          passed: false,
          message: `Skill ${name} missing 'type' field`,
          status: 'INCOMPLETE'
        };
      }
      if (!rule.enforcement) {
        return {
          passed: false,
          message: `Skill ${name} missing 'enforcement' field`,
          status: 'INCOMPLETE'
        };
      }
      if (!rule.priority) {
        return {
          passed: false,
          message: `Skill ${name} missing 'priority' field`,
          status: 'INCOMPLETE'
        };
      }

      // Validate enum values
      const validEnforcements = ['require', 'suggest', 'block'];
      const validPriorities = ['critical', 'high', 'normal', 'low'];

      if (!validEnforcements.includes(rule.enforcement)) {
        return {
          passed: false,
          message: `Skill ${name} has invalid enforcement: ${rule.enforcement}`,
          status: 'INVALID'
        };
      }

      if (!validPriorities.includes(rule.priority)) {
        return {
          passed: false,
          message: `Skill ${name} has invalid priority: ${rule.priority}`,
          status: 'INVALID'
        };
      }

      // Check Manager-related fields (NEW for Layer 4.5)
      // Skills with domain type should have managerAgent and orchestrationSkill
      if (rule.type === 'domain') {
        if (!rule.managerAgent) {
          return {
            passed: false,
            message: `Skill ${name} (type: domain) missing 'managerAgent' field`,
            status: 'INCOMPLETE'
          };
        }

        const validManagers = ['build-manager', 'deployment-manager', 'feature-manager', 'ui-manager'];
        if (!validManagers.includes(rule.managerAgent)) {
          return {
            passed: false,
            message: `Skill ${name} has invalid managerAgent: ${rule.managerAgent}`,
            status: 'INVALID'
          };
        }

        if (!rule.orchestrationSkill) {
          return {
            passed: false,
            message: `Skill ${name} (type: domain) missing 'orchestrationSkill' field`,
            status: 'INCOMPLETE'
          };
        }

        if (!rule.autoActivationLevel) {
          return {
            passed: false,
            message: `Skill ${name} (type: domain) missing 'autoActivationLevel' field`,
            status: 'INCOMPLETE'
          };
        }

        const validActivationLevels = ['manager', 'worker'];
        if (!validActivationLevels.includes(rule.autoActivationLevel)) {
          return {
            passed: false,
            message: `Skill ${name} has invalid autoActivationLevel: ${rule.autoActivationLevel}`,
            status: 'INVALID'
          };
        }

        if (!rule.delegationRules) {
          return {
            passed: false,
            message: `Skill ${name} (type: domain) missing 'delegationRules' field`,
            status: 'INCOMPLETE'
          };
        }

        if (!rule.delegationRules.managerHandles || !rule.delegationRules.workerHandles) {
          return {
            passed: false,
            message: `Skill ${name} delegationRules incomplete (needs managerHandles and workerHandles)`,
            status: 'INCOMPLETE'
          };
        }
      }
    }

    return {
      passed: true,
      message: `skill-rules.json - ${Object.keys(rules).length} rules validated (including Manager fields)`,
      status: 'OK'
    };
  } catch (error) {
    return {
      passed: false,
      message: `skill-rules.json parse error: ${error.message}`,
      status: 'ERROR'
    };
  }
}

function validateHookMatchers() {
  try {
    const config = JSON.parse(fs.readFileSync('../.claudecode.json', 'utf8'));
    const hookTypes = ['PreToolUse', 'PostToolUse'];

    for (const hookType of hookTypes) {
      const hooks = config.hooks[hookType] || [];

      for (let i = 0; i < hooks.length; i++) {
        const hook = hooks[i];
        if (!hook.matcher) continue;

        try {
          new RegExp(hook.matcher);
        } catch (error) {
          return {
            passed: false,
            message: `${hookType}[${i}] invalid matcher regex: "${hook.matcher}" - ${error.message}`,
            status: 'INVALID'
          };
        }
      }
    }

    return {
      passed: true,
      message: 'All hook matchers are valid regex patterns',
      status: 'OK'
    };
  } catch (error) {
    return {
      passed: false,
      message: `Hook matcher validation error: ${error.message}`,
      status: 'ERROR'
    };
  }
}

function validateFileReferences() {
  const requiredFiles = [
    '../.claude/ace-framework/ace-config.json',
    '../.claude/ace-framework/layer3-agent-model.json',
    '../skill-rules.json',
    '../.claude/hooks/userPromptSubmit.js',
    '../.claude/hooks/stopEvent.js',
    // Manager-related files (Layer 4.5)
    '../.claude/coordination/manager-coordinator.js',
    '../.claude/agents/managers/build-manager.md',
    '../.claude/agents/managers/deployment-manager.md',
    '../.claude/agents/managers/feature-manager.md',
    '../.claude/agents/managers/ui-manager.md',
    // Orchestration skills
    '../.claude/skills/build-orchestration/SKILL.md',
    '../.claude/skills/deployment-pipeline-orchestration/SKILL.md',
    '../.claude/skills/feature-lifecycle-orchestration/SKILL.md',
    '../.claude/skills/ui-workflow-orchestration/SKILL.md'
  ];

  const missing = requiredFiles.filter(file => !fs.existsSync(file));

  if (missing.length > 0) {
    return {
      passed: false,
      message: `Missing required files: ${missing.join(', ')}`,
      status: 'MISSING'
    };
  }

  return {
    passed: true,
    message: `All ${requiredFiles.length} referenced files exist (including Layer 4.5)`,
    status: 'OK'
  };
}

module.exports = { run };
