/**
 * KiiPS Manager Agents Evaluation Suite
 *
 * Evaluates: build-manager, deployment-manager, feature-manager, ui-manager
 *
 * Tests manager detection, task decomposition, and worker assignment.
 */

module.exports = {
  name: 'Manager Agents Evaluation',
  description: 'Evaluates manager agent detection and coordination',
  parallel: true,

  tasks: [
    // ============================================
    // build-manager Tests
    // ============================================

    {
      id: 'build-manager-single-service',
      description: 'Single service build should detect build-manager',
      input: { prompt: 'KiiPS-FD 서비스 빌드해줘' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'build-manager'
          }
        }
      ]
    },

    {
      id: 'build-manager-multi-module',
      description: 'Multi-module build should detect build-manager',
      input: { prompt: 'KiiPS-FD, KiiPS-IL, KiiPS-PG 모두 빌드해줘' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'build-manager'
          }
        },
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'build-manager-maven-compile',
      description: 'Maven compile should detect build-manager',
      input: { prompt: 'Maven clean compile 실행' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'build-manager'
          }
        }
      ]
    },

    // ============================================
    // deployment-manager Tests
    // ============================================

    {
      id: 'deployment-manager-deploy',
      description: 'Service deploy should detect deployment-manager',
      input: { prompt: 'KiiPS-FD 서비스 배포해줘' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'deployment-manager'
          }
        }
      ]
    },

    {
      id: 'deployment-manager-restart',
      description: 'Service restart should detect deployment-manager',
      input: { prompt: 'KiiPS-IL 서비스 재시작' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'deployment-manager'
          }
        }
      ]
    },

    {
      id: 'deployment-manager-logs',
      description: 'Log analysis should detect deployment-manager',
      input: { prompt: '배포된 서비스 로그 확인' },
      graders: [
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
    // feature-manager Tests
    // ============================================

    {
      id: 'feature-manager-planning',
      description: 'Feature planning should detect feature-manager',
      input: { prompt: '신규 펀드 조회 기능 개발 계획 세워줘' },
      graders: [
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
      id: 'feature-manager-development',
      description: 'Feature development should detect feature-manager',
      input: { prompt: '새 기능 개발 시작' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'feature-manager'
          }
        }
      ]
    },

    // ============================================
    // ui-manager Tests
    // ============================================

    {
      id: 'ui-manager-component',
      description: 'UI component should detect ui-manager',
      input: { prompt: '펀드 목록 화면 컴포넌트 만들어줘' },
      graders: [
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
      id: 'ui-manager-realgrid',
      description: 'RealGrid work should detect ui-manager',
      input: { prompt: 'RealGrid 테이블 추가해줘' },
      graders: [
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
      id: 'ui-manager-page',
      description: 'Page creation should detect ui-manager',
      input: { prompt: '새 페이지 만들어줘' },
      graders: [
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
    // Priority Tests (Manager Selection)
    // ============================================

    {
      id: 'manager-priority-ui-over-feature',
      description: 'UI-specific work should prioritize ui-manager over feature-manager',
      input: { prompt: '화면 개발 시작' },
      graders: [
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
      id: 'manager-priority-build-over-deploy',
      description: 'Build work should prioritize build-manager',
      input: { prompt: '서비스 빌드 후 패키징' },
      graders: [
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'build-manager'
          }
        }
      ]
    }
  ]
};
