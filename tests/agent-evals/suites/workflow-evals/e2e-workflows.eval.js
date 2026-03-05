/**
 * KiiPS End-to-End Workflow Evaluation Suite
 *
 * Evaluates complete development workflows that span multiple skills and agents.
 *
 * These tests verify that:
 * 1. Correct skills are activated in sequence
 * 2. Appropriate manager agents are detected
 * 3. Complete workflows can be executed
 */

module.exports = {
  name: 'E2E Workflow Evaluation',
  description: 'Evaluates complete development workflows',
  parallel: false, // Sequential execution for workflow dependencies

  tasks: [
    // ============================================
    // Build & Deploy Workflow
    // ============================================

    {
      id: 'workflow-build-deploy',
      description: 'Complete build and deploy workflow',
      input: { prompt: 'KiiPS-FD 서비스 빌드하고 배포해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder', 'kiips-service-deployer']
        }
      ]
    },

    {
      id: 'workflow-build-test-deploy',
      description: 'Build, test, and deploy workflow',
      input: { prompt: 'KiiPS-IL 빌드하고 테스트 실행 후 배포' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder', 'kiips-test-runner', 'kiips-service-deployer']
        }
      ]
    },

    // ============================================
    // Feature Development Workflow
    // ============================================

    {
      id: 'workflow-feature-planning',
      description: 'Feature planning workflow',
      input: { prompt: '신규 펀드 관리 기능 개발 계획 세워줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'feature-manager'
          }
        }
      ]
    },

    {
      id: 'workflow-feature-with-api',
      description: 'Feature with API development',
      input: { prompt: '새 기능 개발하고 API 테스트해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner', 'kiips-api-tester']
        }
      ]
    },

    // ============================================
    // UI Development Workflow
    // ============================================

    {
      id: 'workflow-ui-page-creation',
      description: 'Complete UI page creation workflow',
      input: { prompt: 'RealGrid로 펀드 목록 조회 페이지 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide', 'kiips-ui-component-builder']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'ui-manager'
          }
        }
      ]
    },

    {
      id: 'workflow-ui-with-detail',
      description: 'UI with detail page workflow',
      input: { prompt: '펀드 상세 페이지 화면 설계하고 구현해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-detail-page-planner', 'kiips-ui-component-builder']
        }
      ]
    },

    {
      id: 'workflow-ui-grid-table',
      description: 'Grid table UI workflow',
      input: { prompt: '테이블 그리드 컴포넌트 추가해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'ui-manager'
          }
        }
      ]
    },

    // ============================================
    // Analysis & Debugging Workflow
    // ============================================

    {
      id: 'workflow-error-investigation',
      description: 'Error investigation workflow',
      input: { prompt: '서비스 에러 로그 분석하고 API 테스트해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer', 'kiips-api-tester']
        }
      ]
    },

    {
      id: 'workflow-log-debug',
      description: 'Log debugging workflow',
      input: { prompt: '배포 후 로그 확인하고 에러 분석' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'deployment-manager'
          }
        }
      ]
    },

    // ============================================
    // Full Stack Workflow
    // ============================================

    {
      id: 'workflow-fullstack-feature',
      description: 'Full stack feature development',
      input: { prompt: '새 기능 계획하고 화면까지 개발해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner', 'kiips-ui-component-builder']
        }
      ]
    },

    {
      id: 'workflow-complete-release',
      description: 'Complete release workflow',
      input: { prompt: 'KiiPS-FD 빌드, 테스트, 배포하고 로그 확인해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: [
            'kiips-maven-builder',
            'kiips-test-runner',
            'kiips-service-deployer',
            'kiips-log-analyzer'
          ]
        }
      ]
    }
  ]
};
