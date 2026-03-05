/**
 * KiiPS Deploy Skills Evaluation Suite
 *
 * Evaluates: kiips-service-deployer
 *
 * Tests deployment skill activation, service lifecycle management,
 * and deployment verification patterns.
 */

module.exports = {
  name: 'Deploy Skills Evaluation',
  description: 'Evaluates service deployment skill',
  parallel: true,

  tasks: [
    // ============================================
    // kiips-service-deployer Tests
    // ============================================

    {
      id: 'deployer-activation-korean',
      description: 'Korean: 배포 keyword should activate service-deployer',
      input: { prompt: 'KiiPS-FD 서비스 배포해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'deployer-activation-english',
      description: 'English: deploy keyword should activate service-deployer',
      input: { prompt: 'Deploy KiiPS-IL service to staging' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'deployer-activation-start',
      description: 'Start keyword should activate service-deployer',
      input: { prompt: 'Start the KiiPS-PG service' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'deployer-activation-stop',
      description: 'Stop keyword should activate service-deployer',
      input: { prompt: '서비스 중지해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'deployer-activation-restart',
      description: 'Restart keyword should activate service-deployer',
      input: { prompt: 'Restart KiiPS-Common service' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-service-deployer']
        }
      ]
    },

    {
      id: 'deployer-manager-detection',
      description: 'Deploy prompt should detect deployment-manager',
      input: { prompt: 'KiiPS-FD 배포 진행해줘' },
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
    // Combined Build + Deploy (should activate both)
    // ============================================

    {
      id: 'build-and-deploy-activation',
      description: 'Build and deploy should activate both skills',
      input: { prompt: 'KiiPS-FD 빌드하고 배포해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder', 'kiips-service-deployer']
        }
      ]
    },

    // ============================================
    // Negative Tests
    // ============================================

    {
      id: 'deployer-negative-build-only',
      description: 'Build-only prompt should NOT activate deployer',
      input: { prompt: 'Maven 빌드만 해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    }
  ]
};
