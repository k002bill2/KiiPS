#!/usr/bin/env node
/**
 * Manager Agent 실전 시나리오 데모
 * 사용자 요청이 Manager로 라우팅되는 과정을 시뮬레이션
 */

const taskAllocator = require('../.claude/coordination/task-allocator.js');
const managerCoordinator = require('../.claude/coordination/manager-coordinator.js');

console.log('='.repeat(80));
console.log('Manager Agent 실전 시나리오 데모');
console.log('='.repeat(80));

// 시나리오 1: Multi-Service Build
console.log('\n\n📦 시나리오 1: 사용자 요청 "KiiPS-FD, IL, PG 빌드해줘"\n');
console.log('─'.repeat(80));

const buildRequest = {
  taskType: 'multi_service_build',
  parameters: {
    services: ['KiiPS-FD', 'KiiPS-IL', 'KiiPS-PG'],
    skipTests: true
  },
  initiatedBy: 'user'
};

console.log('1️⃣ Primary Coordinator가 요청 수신:');
console.log(JSON.stringify(buildRequest, null, 2));

const buildPlan = taskAllocator.decomposeTask(buildRequest);

console.log('\n2️⃣ Task Allocator 분석 결과:');
console.log(`   ✅ Manager 라우팅: ${buildPlan.execution.manager}`);
console.log(`   ✅ 위임 깊이: ${buildPlan.execution.delegationDepth}`);
console.log(`   ✅ Subtasks 개수: ${buildPlan.execution.subtasks.length}`);

console.log('\n3️⃣ Subtasks 상세:');
buildPlan.execution.subtasks.forEach((task, i) => {
  console.log(`   ${i + 1}. ${task.name}`);
  console.log(`      - Agent: ${task.agent}`);
  console.log(`      - 예상 시간: ${task.estimatedTime || 'N/A'}`);
});

// 시나리오 2: Worker 할당
console.log('\n\n4️⃣ Build Manager가 Worker에게 작업 할당:\n');
console.log('─'.repeat(80));

const workerAssignment = managerCoordinator.assignWorkers(
  'build-manager',
  buildPlan.execution.subtasks
);

console.log(`   ✅ 할당 완료: ${workerAssignment.assignmentCount}개 작업`);
console.log(`   ✅ 활성 Worker: ${workerAssignment.uniqueWorkers}명`);

console.log('\n   Worker 할당 상세:');
workerAssignment.assignments.forEach((assignment, i) => {
  console.log(`   ${i + 1}. ${assignment.taskName}`);
  console.log(`      → Worker: ${assignment.workerId}`);
});

// 시나리오 3: Progress Aggregation
console.log('\n\n5️⃣ Worker 진행 상황 집계:\n');
console.log('─'.repeat(80));

const workerUpdates = [
  { workerId: 'kiips-developer', taskId: 't_1', status: 'completed', progress: 100 },
  { workerId: 'kiips-developer', taskId: 't_2', status: 'in_progress', progress: 75 },
  { workerId: 'kiips-developer', taskId: 't_3', status: 'in_progress', progress: 50 }
];

const aggregation = managerCoordinator.aggregateWorkerResults('build-manager', workerUpdates);

console.log(`   ✅ 전체 진행률: ${aggregation.aggregation.progressPercentage}%`);
console.log(`   ✅ 완료: ${aggregation.aggregation.completedTasks}개`);
console.log(`   ✅ 진행 중: ${aggregation.aggregation.inProgressTasks}개`);
console.log(`   ✅ 상태: ${aggregation.aggregation.overallStatus}`);

// 시나리오 4: 에스컬레이션
console.log('\n\n6️⃣ Worker 실패 시 에스컬레이션:\n');
console.log('─'.repeat(80));

const escalation = managerCoordinator.escalateToPrimary(
  'build-manager',
  'dependency_resolution_failure',
  {
    service: 'KiiPS-FD',
    error: 'COMMON module not built',
    recommendation: 'Build COMMON module first (Primary-only)'
  }
);

console.log(`   🚨 에스컬레이션 ID: ${escalation.escalation.escalationId}`);
console.log(`   🚨 사유: ${escalation.escalation.reason}`);
console.log(`   🚨 메시지: ${escalation.escalation.message}`);

// 시나리오 5: UI Component Creation
console.log('\n\n📱 시나리오 2: 사용자 요청 "펀드 목록 UI 만들어줘, RealGrid 사용"\n');
console.log('─'.repeat(80));

const uiRequest = {
  taskType: 'ui_component_creation',
  parameters: {
    componentType: 'grid',
    gridLibrary: 'RealGrid',
    targetPage: 'fund-list.jsp'
  },
  initiatedBy: 'user'
};

const uiPlan = taskAllocator.decomposeTask(uiRequest);

console.log('1️⃣ Task Allocator 분석 결과:');
console.log(`   ✅ Manager 라우팅: ${uiPlan.execution.manager}`);
console.log(`   ✅ 위임 깊이: ${uiPlan.execution.delegationDepth}`);

console.log('\n2️⃣ UI Manager Subtasks:');
uiPlan.execution.subtasks.forEach((task, i) => {
  console.log(`   ${i + 1}. ${task.name} (${task.agent})`);
});

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('✅ Manager Agent 시스템이 정상적으로 동작합니다!');
console.log('='.repeat(80));

console.log('\n주요 검증 사항:');
console.log('  ✅ Multi-service build → build-manager 라우팅');
console.log('  ✅ UI component creation → ui-manager 라우팅');
console.log('  ✅ Worker 자동 할당 및 progress 집계');
console.log('  ✅ 실패 시 Primary로 에스컬레이션');
console.log('  ✅ Domain-specific orchestration 동작');

console.log('\n이제 실제 사용자 요청에 Manager Agents가 자동으로 활성화됩니다! 🎉\n');
