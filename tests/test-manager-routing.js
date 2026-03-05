/**
 * Manager Routing Test Suite
 *
 * Tests Manager Agent routing, worker delegation, and orchestration patterns
 *
 * @version 1.0.0-KiiPS
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import coordination modules
const taskAllocator = require('../.claude/coordination/task-allocator.js');
const fileLockManager = require('../.claude/coordination/file-lock-manager.js');
const managerCoordinator = require('../.claude/coordination/manager-coordinator.js');

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Test helper: Log test result
 */
function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.details.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } else {
    testResults.failed++;
    testResults.details.push({ name, status: 'FAIL', error: error?.message || error });
    console.error(`✗ ${name}`);
    if (error) console.error(`  Error: ${error.message || error}`);
  }
}

/**
 * Test 1: Multi-Service Build → build-manager
 *
 * Scenario: User requests building multiple KiiPS services
 * Expected: task-allocator routes to build-manager, manager coordinates parallel builds
 */
function test1_MultiServiceBuild() {
  console.log('\n[Test 1] Multi-Service Build → build-manager');

  try {
    // Simulate multi-service build request
    const request = {
      taskType: 'multi_service_build',
      parameters: {
        services: ['KiiPS-FD', 'KiiPS-IL', 'KiiPS-PG'],
        skipTests: true
      },
      initiatedBy: 'user'
    };

    const result = taskAllocator.decomposeTask(request);

    // Assertions
    assert.strictEqual(result.success, true, 'Task decomposition should succeed');
    assert.strictEqual(result.execution.manager, 'build-manager', 'Should route to build-manager');
    assert.strictEqual(result.execution.delegationDepth, 'primary->manager->worker', 'Should use manager delegation');
    assert.ok(result.execution.subtasks.length > 0, 'Should have subtasks');

    logTest('Multi-service build routes to build-manager', true);
  } catch (error) {
    logTest('Multi-service build routes to build-manager', false, error);
  }
}

/**
 * Test 2: Feature Development → feature-manager
 *
 * Scenario: User requests new feature development
 * Expected: Routes to feature-manager, coordinates architect → developer → QA
 */
function test2_FeatureDevelopment() {
  console.log('\n[Test 2] Feature Development → feature-manager');

  try {
    const request = {
      taskType: 'feature_development',
      parameters: {
        featureName: 'user-authentication',
        targetModule: 'KiiPS-Login'
      },
      initiatedBy: 'user'
    };

    const result = taskAllocator.decomposeTask(request);

    // Assertions
    assert.strictEqual(result.success, true, 'Task decomposition should succeed');
    assert.strictEqual(result.execution.manager, 'feature-manager', 'Should route to feature-manager');

    // Check sequential handoff pattern
    const subtasks = result.execution.subtasks;
    const hasArchitectReview = subtasks.some(t => t.agent === 'kiips-architect');
    const hasDevelopment = subtasks.some(t => t.agent === 'kiips-developer');

    assert.ok(hasArchitectReview, 'Should include architect review');
    assert.ok(hasDevelopment, 'Should include developer implementation');

    logTest('Feature development routes to feature-manager', true);
  } catch (error) {
    logTest('Feature development routes to feature-manager', false, error);
  }
}

/**
 * Test 3: UI Component Creation → ui-manager
 *
 * Scenario: User requests creating UI component with RealGrid
 * Expected: Routes to ui-manager, activates UI skills
 */
function test3_UIComponentCreation() {
  console.log('\n[Test 3] UI Component Creation → ui-manager');

  try {
    const request = {
      taskType: 'ui_component_creation',
      parameters: {
        componentType: 'grid',
        gridLibrary: 'RealGrid',
        targetPage: 'fund-list.jsp'
      },
      initiatedBy: 'user'
    };

    const result = taskAllocator.decomposeTask(request);

    // Assertions
    assert.strictEqual(result.success, true, 'Task decomposition should succeed');
    assert.strictEqual(result.execution.manager, 'ui-manager', 'Should route to ui-manager');

    logTest('UI component creation routes to ui-manager', true);
  } catch (error) {
    logTest('UI component creation routes to ui-manager', false, error);
  }
}

/**
 * Test 4: Service Deployment → deployment-manager
 *
 * Scenario: User requests deploying a service
 * Expected: Routes to deployment-manager, orchestrates 6-stage pipeline
 */
function test4_ServiceDeployment() {
  console.log('\n[Test 4] Service Deployment → deployment-manager');

  try {
    const request = {
      taskType: 'service_deploy',
      parameters: {
        serviceName: 'KiiPS-FD',
        environment: 'staging'
      },
      initiatedBy: 'user'
    };

    const result = taskAllocator.decomposeTask(request);

    // Assertions
    assert.strictEqual(result.success, true, 'Task decomposition should succeed');
    assert.strictEqual(result.execution.manager, 'deployment-manager', 'Should route to deployment-manager');

    // Check 6-stage deployment pipeline
    const subtasks = result.execution.subtasks;
    const hasPreCheck = subtasks.some(t => t.name.includes('Pre-deployment'));
    const hasHealthCheck = subtasks.some(t => t.name.includes('Health Check'));
    const hasLogVerification = subtasks.some(t => t.name.includes('Log'));

    assert.ok(hasPreCheck, 'Should include pre-deployment check');
    assert.ok(hasHealthCheck, 'Should include health check');
    assert.ok(hasLogVerification, 'Should include log verification');

    logTest('Service deployment routes to deployment-manager', true);
  } catch (error) {
    logTest('Service deployment routes to deployment-manager', false, error);
  }
}

/**
 * Test 5: Fallback to Secondary when Manager Unavailable
 *
 * Scenario: Manager routing disabled via featureFlags
 * Expected: Falls back to direct secondary agent routing
 */
function test5_FallbackToSecondary() {
  console.log('\n[Test 5] Fallback to Secondary when Manager unavailable');

  try {
    // Temporarily disable Manager routing
    const originalFlag = taskAllocator.CONFIG.enableManagerAgents;
    taskAllocator.CONFIG.enableManagerAgents = false;

    const request = {
      taskType: 'service_build',
      parameters: {
        serviceName: 'KiiPS-FD',
        skipTests: true
      },
      initiatedBy: 'user'
    };

    const result = taskAllocator.decomposeTask(request);

    // Assertions
    assert.strictEqual(result.success, true, 'Task should still succeed');
    assert.strictEqual(result.execution.manager, null, 'Should not route to manager');
    assert.strictEqual(result.execution.delegationDepth, 'primary->worker', 'Should use direct delegation');

    // Restore flag
    taskAllocator.CONFIG.enableManagerAgents = originalFlag;

    logTest('Fallback to secondary agent when manager unavailable', true);
  } catch (error) {
    logTest('Fallback to secondary agent when manager unavailable', false, error);
  }
}

/**
 * Test 6: Escalation to Primary on Manager Failure
 *
 * Scenario: Manager encounters critical error
 * Expected: Escalates to Primary Coordinator with context
 */
function test6_EscalationToPrimary() {
  console.log('\n[Test 6] Escalation to Primary on Manager failure');

  try {
    // Simulate manager failure
    const escalationResult = managerCoordinator.escalateToPrimary(
      'deployment-manager',
      'health_check_failure',
      {
        serviceName: 'KiiPS-FD',
        error: 'Service unresponsive after 3 attempts',
        attemptCount: 3
      }
    );

    // Assertions
    assert.strictEqual(escalationResult.success, true, 'Escalation should succeed');
    assert.ok(escalationResult.escalation.escalationId, 'Should have escalation ID');
    assert.strictEqual(escalationResult.escalation.managerId, 'deployment-manager', 'Should track manager ID');
    assert.strictEqual(escalationResult.escalation.reason, 'health_check_failure', 'Should include reason');
    assert.ok(escalationResult.escalation.context, 'Should include context');

    logTest('Escalation to Primary on manager failure', true);
  } catch (error) {
    logTest('Escalation to Primary on manager failure', false, error);
  }
}

/**
 * Test 7: Domain Lock Prevention
 *
 * Scenario: Two managers try to acquire same domain lock
 * Expected: Second manager is blocked, first manager holds lock
 */
function test7_DomainLockPrevention() {
  console.log('\n[Test 7] Domain Lock Prevention');

  try {
    // First manager acquires deployment domain lock
    const lock1 = fileLockManager.acquireManagerLock('deployment-manager', 'deployment');

    assert.strictEqual(lock1.success, true, 'First lock should succeed');
    assert.strictEqual(lock1.type, 'ACQUIRED', 'Should acquire new lock');

    // Different manager tries to acquire same domain lock (should fail - unauthorized)
    const lock2 = fileLockManager.acquireManagerLock('build-manager', 'deployment');

    assert.strictEqual(lock2.success, false, 'Second lock should fail');
    assert.strictEqual(lock2.error, 'UNAUTHORIZED_MANAGER', 'Should be blocked - unauthorized for this domain');

    // Release the lock
    const release = fileLockManager.releaseManagerLock('deployment-manager', 'deployment');
    assert.strictEqual(release.success, true, 'Lock release should succeed');

    // Now test actual domain lock conflict (same manager tries to acquire twice)
    const lock3 = fileLockManager.acquireManagerLock('deployment-manager', 'deployment');
    assert.strictEqual(lock3.success, true, 'Should reacquire after release');

    // Simulate another instance of same manager trying to lock
    // (In reality, this would be prevented at a higher level, but testing the lock mechanism)
    const existingLock = fileLockManager.acquireManagerLock('deployment-manager', 'deployment');

    // Should succeed because same manager can renew/extend lock
    assert.strictEqual(existingLock.success, true, 'Same manager can renew lock');

    // Clean up
    fileLockManager.releaseManagerLock('deployment-manager', 'deployment');

    logTest('Domain lock prevents concurrent managers', true);
  } catch (error) {
    // Clean up
    try {
      fileLockManager.releaseManagerLock('deployment-manager', 'deployment');
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    logTest('Domain lock prevents concurrent managers', false, error);
  }
}

/**
 * Test 8: Manager Progress Aggregation
 *
 * Scenario: Manager coordinates multiple workers, tracks aggregate progress
 * Expected: Manager progress reflects combined worker progress
 */
function test8_ManagerProgressAggregation() {
  console.log('\n[Test 8] Manager Progress Aggregation');

  try {
    // Simulate worker updates
    const workerUpdates = [
      { workerId: 'kiips-developer', taskId: 't_1', status: 'completed', progress: 100 },
      { workerId: 'kiips-developer', taskId: 't_2', status: 'in_progress', progress: 50 },
      { workerId: 'checklist-generator', taskId: 't_3', status: 'pending', progress: 0 }
    ];

    // Aggregate worker results
    const aggregation = managerCoordinator.aggregateWorkerResults(
      'build-manager',
      workerUpdates
    );

    // Assertions
    assert.strictEqual(aggregation.success, true, 'Aggregation should succeed');
    assert.strictEqual(aggregation.aggregation.totalTasks, 3, 'Should count all tasks');
    assert.strictEqual(aggregation.aggregation.completedTasks, 1, 'Should count completed tasks');
    assert.strictEqual(aggregation.aggregation.inProgressTasks, 1, 'Should count in-progress tasks');
    assert.strictEqual(aggregation.aggregation.pendingTasks, 1, 'Should count pending tasks');

    // Progress should be ~33% (1/3 completed)
    assert.ok(aggregation.aggregation.progressPercentage >= 30 &&
              aggregation.aggregation.progressPercentage <= 35,
              'Progress should be approximately 33%');

    logTest('Manager progress aggregation from multiple workers', true);
  } catch (error) {
    logTest('Manager progress aggregation from multiple workers', false, error);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('='.repeat(60));
  console.log('Manager Routing Test Suite');
  console.log('='.repeat(60));

  test1_MultiServiceBuild();
  test2_FeatureDevelopment();
  test3_UIComponentCreation();
  test4_ServiceDeployment();
  test5_FallbackToSecondary();
  test6_EscalationToPrimary();
  test7_DomainLockPrevention();
  test8_ManagerProgressAggregation();

  console.log('\n' + '='.repeat(60));
  console.log('Test Results');
  console.log('='.repeat(60));
  console.log(`Total: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✓`);
  console.log(`Failed: ${testResults.failed} ✗`);
  console.log(`Pass Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  console.log('='.repeat(60));

  // Exit with error code if any tests failed
  if (testResults.failed > 0) {
    console.error('\n❌ Some tests failed. See details above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};
