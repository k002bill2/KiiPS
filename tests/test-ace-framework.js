const fs = require('fs');

async function run() {
  const requiredFiles = [
    '../.claude/ace-framework/ace-config.json',
    '../.claude/ace-framework/layer3-agent-model.json',
    '../.claude/coordination/feedback-loop.js',
    '../.claude/coordination/checkpoint-manager.js',
    '../.claude/coordination/manager-coordinator.js', // Manager support
    '../.claude/hooks/userPromptSubmit.js',
    '../.claude/hooks/stopEvent.js'
  ];

  // Manager agent files (Layer 4.5)
  const managerAgentFiles = [
    '../.claude/agents/managers/build-manager.md',
    '../.claude/agents/managers/deployment-manager.md',
    '../.claude/agents/managers/feature-manager.md',
    '../.claude/agents/managers/ui-manager.md'
  ];

  let passed = true;
  const details = [];

  console.log(`\nChecking ${requiredFiles.length} ACE Framework files...\n`);

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      passed = false;
      details.push({
        file,
        status: 'MISSING',
        message: 'File not found',
        passed: false
      });
      console.log(`  ❌ ${file}: MISSING`);
    } else {
      // For JSON files, validate structure
      if (file.endsWith('.json')) {
        try {
          JSON.parse(fs.readFileSync(file, 'utf8'));
          details.push({
            file,
            status: 'OK',
            message: 'Valid JSON',
            passed: true
          });
          console.log(`  ✅ ${file}: OK (valid JSON)`);
        } catch (error) {
          passed = false;
          details.push({
            file,
            status: 'INVALID',
            message: `Invalid JSON: ${error.message}`,
            passed: false
          });
          console.log(`  ❌ ${file}: INVALID JSON - ${error.message}`);
        }
      } else {
        // For JS files, just check they exist
        details.push({
          file,
          status: 'OK',
          message: 'File exists',
          passed: true
        });
        console.log(`  ✅ ${file}: OK`);
      }
    }
  }

  // Validate Manager Agent files (Layer 4.5)
  console.log(`\nChecking ${managerAgentFiles.length} Manager Agent files (Layer 4.5)...\n`);

  for (const file of managerAgentFiles) {
    if (!fs.existsSync(file)) {
      passed = false;
      details.push({
        file,
        status: 'MISSING',
        message: 'Manager Agent file not found',
        passed: false
      });
      console.log(`  ❌ ${file}: MISSING`);
    } else {
      // Check file has content
      const content = fs.readFileSync(file, 'utf8');
      if (content.length === 0) {
        passed = false;
        details.push({
          file,
          status: 'EMPTY',
          message: 'Manager Agent file is empty',
          passed: false
        });
        console.log(`  ❌ ${file}: EMPTY`);
      } else {
        // Basic validation: should have role, model, responsibilities
        const hasRole = /role/i.test(content);
        const hasModel = /model/i.test(content);
        const hasResponsibilities = /responsibilities/i.test(content);

        if (hasRole && hasModel && hasResponsibilities) {
          details.push({
            file,
            status: 'OK',
            message: 'Valid Manager Agent definition',
            passed: true
          });
          console.log(`  ✅ ${file}: OK (valid Manager Agent)`);
        } else {
          passed = false;
          details.push({
            file,
            status: 'INCOMPLETE',
            message: 'Missing required sections (role, model, responsibilities)',
            passed: false
          });
          console.log(`  ❌ ${file}: INCOMPLETE - Missing required sections`);
        }
      }
    }
  }

  // Validate .claudecode.json ACE configuration
  console.log(`\nChecking ACE Framework configuration in .claudecode.json...\n`);

  try {
    const config = JSON.parse(fs.readFileSync('../.claudecode.json', 'utf8'));

    if (!config.aceFramework || !config.aceFramework.enabled) {
      passed = false;
      details.push({
        file: '.claudecode.json',
        status: 'INCOMPLETE',
        message: 'ACE Framework not enabled',
        passed: false
      });
      console.log(`  ❌ ACE Framework: Not enabled in .claudecode.json`);
    } else {
      details.push({
        file: '.claudecode.json',
        status: 'OK',
        message: 'ACE Framework enabled',
        passed: true
      });
      console.log(`  ✅ ACE Framework: Enabled`);

      // Check layer references
      const layers = config.aceFramework.layers || {};
      const requiredLayers = ['layer1', 'layer3', 'layer4'];

      for (const layer of requiredLayers) {
        if (!layers[layer]) {
          passed = false;
          details.push({
            file: `.claudecode.json (${layer})`,
            status: 'MISSING',
            message: `Layer ${layer} not configured`,
            passed: false
          });
          console.log(`  ❌ ${layer}: Not configured`);
        } else {
          console.log(`  ✅ ${layer}: ${layers[layer]}`);
        }
      }

      // Check Layer 4.5 (Domain Orchestration)
      if (!layers.layer45_domain_orchestration) {
        passed = false;
        details.push({
          file: '.claudecode.json (layer45_domain_orchestration)',
          status: 'MISSING',
          message: 'Layer 4.5 (Domain Orchestration) not configured',
          passed: false
        });
        console.log(`  ❌ layer45_domain_orchestration: Not configured`);
      } else {
        console.log(`  ✅ layer45_domain_orchestration: ${layers.layer45_domain_orchestration}`);
      }

      // Check Manager Agents in agentHierarchy
      const agentHierarchy = config.aceFramework.agentHierarchy || {};
      const managers = agentHierarchy.managers || [];

      if (managers.length === 0) {
        passed = false;
        details.push({
          file: '.claudecode.json (agentHierarchy.managers)',
          status: 'MISSING',
          message: 'No Manager Agents configured',
          passed: false
        });
        console.log(`  ❌ Manager Agents: Not configured`);
      } else {
        console.log(`  ✅ Manager Agents: ${managers.length} configured`);

        // Check for required 4 managers
        const requiredManagers = ['build-manager', 'deployment-manager', 'feature-manager', 'ui-manager'];
        const configuredManagers = managers.map(m => m.id);

        for (const requiredManager of requiredManagers) {
          if (!configuredManagers.includes(requiredManager)) {
            passed = false;
            details.push({
              file: `.claudecode.json (${requiredManager})`,
              status: 'MISSING',
              message: `Manager ${requiredManager} not in agentHierarchy`,
              passed: false
            });
            console.log(`  ❌ ${requiredManager}: Not configured`);
          } else {
            console.log(`  ✅ ${requiredManager}: Configured`);
          }
        }
      }

      // Check featureFlags
      const featureFlags = config.aceFramework.featureFlags || {};

      if (featureFlags.enableManagerAgents === undefined) {
        passed = false;
        details.push({
          file: '.claudecode.json (featureFlags.enableManagerAgents)',
          status: 'MISSING',
          message: 'enableManagerAgents flag not configured',
          passed: false
        });
        console.log(`  ❌ featureFlags.enableManagerAgents: Not configured`);
      } else {
        console.log(`  ✅ featureFlags.enableManagerAgents: ${featureFlags.enableManagerAgents}`);
      }

      if (!featureFlags.managerRoutingMode) {
        passed = false;
        details.push({
          file: '.claudecode.json (featureFlags.managerRoutingMode)',
          status: 'MISSING',
          message: 'managerRoutingMode flag not configured',
          passed: false
        });
        console.log(`  ❌ featureFlags.managerRoutingMode: Not configured`);
      } else {
        console.log(`  ✅ featureFlags.managerRoutingMode: ${featureFlags.managerRoutingMode}`);
      }
    }
  } catch (error) {
    passed = false;
    details.push({
      file: '.claudecode.json',
      status: 'ERROR',
      message: `Cannot parse: ${error.message}`,
      passed: false
    });
    console.log(`  ❌ Error checking ACE config: ${error.message}`);
  }

  return { passed, details };
}

module.exports = { run };
