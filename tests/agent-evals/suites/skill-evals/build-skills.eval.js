/**
 * KiiPS Build Skills Evaluation Suite
 *
 * Evaluates: kiips-maven-builder, kiips-test-runner
 *
 * Tests skill activation patterns, command generation,
 * and build output validation.
 */

module.exports = {
  name: 'Build Skills Evaluation',
  description: 'Evaluates Maven builder and test runner skills',
  parallel: true,

  tasks: [
    // ============================================
    // kiips-maven-builder Tests
    // ============================================

    {
      id: 'maven-builder-activation-korean',
      description: 'Korean prompt: 빌드 keyword should activate maven-builder',
      input: { prompt: 'KiiPS-FD 빌드해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'maven-builder-activation-english',
      description: 'English prompt: build keyword should activate maven-builder',
      input: { prompt: 'Build the KiiPS-IL service' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'maven-builder-activation-compile',
      description: 'Compile keyword should activate maven-builder',
      input: { prompt: 'Compile KiiPS-PG module with dependencies' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'maven-builder-activation-package',
      description: 'Package keyword should activate maven-builder',
      input: { prompt: 'Package the KiiPS-COMMON project' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'maven-builder-multi-module',
      description: 'Multi-module build should detect maven-builder',
      input: { prompt: '전체 프로젝트 maven 빌드 실행' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    },

    {
      id: 'maven-builder-manager-detection',
      description: 'Build prompt should detect build-manager',
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

    // ============================================
    // kiips-test-runner Tests
    // ============================================

    {
      id: 'test-runner-activation-korean',
      description: 'Korean: 테스트 keyword should activate test-runner',
      input: { prompt: 'KiiPS-FD 유닛 테스트 실행해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-test-runner']
        }
      ]
    },

    {
      id: 'test-runner-activation-junit',
      description: 'JUnit keyword should activate test-runner',
      input: { prompt: 'Run JUnit tests for KiiPS-IL' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-test-runner']
        }
      ]
    },

    {
      id: 'test-runner-activation-karma',
      description: 'Karma keyword should activate test-runner',
      input: { prompt: 'Execute Karma tests for UI components' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-test-runner']
        }
      ]
    },

    // ============================================
    // Negative Tests (should NOT activate)
    // ============================================

    {
      id: 'maven-builder-negative-deploy',
      description: 'Deploy-only prompt should NOT activate maven-builder',
      input: { prompt: '서비스 배포해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'maven-builder-negative-ui',
      description: 'UI-only prompt should NOT activate maven-builder',
      input: { prompt: '화면 컴포넌트 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder']
        }
      ]
    }
  ]
};
