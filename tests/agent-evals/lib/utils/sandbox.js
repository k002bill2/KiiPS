/**
 * KiiPS Evaluation Sandbox
 *
 * Provides isolated execution environment for agent evaluations.
 * Supports hybrid mode: Mock by default, real execution when configured.
 *
 * Based on Anthropic's guidance:
 * - Each trial should run in a clean environment
 * - No shared state between trials
 * - Remove side effects (caches, resource exhaustion)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { EventEmitter } = require('events');

class Sandbox extends EventEmitter {
  constructor(options = {}) {
    super();
    this.mode = options.mode || 'mock'; // 'mock' | 'real' | 'hybrid'
    this.mockByDefault = options.mockByDefault !== false;
    this.timeout = options.timeout || 30000;
    this.workDir = null;
    this.transcript = [];
    this.state = {};
    this.cleanupTasks = [];

    // Skills that can run in real mode
    this.realExecutionSkills = options.realExecutionSkills || [];
  }

  /**
   * Execute a task in the sandbox
   * @param {Object} input - Task input
   * @returns {Object} Execution result
   */
  async execute(input) {
    this.reset();

    try {
      // Determine execution mode for this input
      const execMode = this.determineExecutionMode(input);

      this.emit('executionStart', { mode: execMode, input });

      let result;
      if (execMode === 'real') {
        result = await this.realExecute(input);
      } else {
        result = await this.mockExecute(input);
      }

      this.emit('executionEnd', { success: true });

      // Copy output to state for state grader compatibility
      this.state.output = result.output;

      return {
        success: true,
        output: result.output,
        transcript: this.transcript,
        turns: result.turns || 1,
        toolCalls: result.toolCalls || 0,
        state: this.state
      };

    } catch (error) {
      this.emit('executionEnd', { success: false, error });
      throw error;
    }
  }

  /**
   * Determine if this input should use real or mock execution
   */
  determineExecutionMode(input) {
    if (this.mode === 'real') return 'real';
    if (this.mode === 'mock') return 'mock';

    // Hybrid mode: check if skill is in realExecutionSkills
    const skill = input.skill || input.prompt?.match(/kiips-[\w-]+/)?.[0];
    if (skill && this.realExecutionSkills.includes(skill)) {
      return 'real';
    }

    return this.mockByDefault ? 'mock' : 'real';
  }

  /**
   * Mock execution - simulate without side effects
   */
  async mockExecute(input) {
    this.log('mock_start', { input });

    // Simulate skill activation
    if (input.prompt) {
      const activatedSkills = this.detectSkills(input.prompt);
      for (const skill of activatedSkills) {
        this.log('skill_activation', { skill });
      }
    }

    // Generate mock output based on input type
    const mockOutput = this.generateMockOutput(input);

    // Simulate tool calls
    const toolCalls = this.generateMockToolCalls(input);
    for (const call of toolCalls) {
      this.log('tool_call', call);
    }

    this.log('mock_end', { output: mockOutput });

    return {
      output: mockOutput,
      turns: 1,
      toolCalls: toolCalls.length
    };
  }

  /**
   * Real execution - actually run commands/skills
   */
  async realExecute(input) {
    this.log('real_start', { input });

    // Create isolated work directory
    this.workDir = this.createWorkDir();
    this.state.workDir = this.workDir;

    try {
      let result;

      if (input.command) {
        // Execute shell command
        result = await this.executeCommand(input.command);
      } else if (input.skill) {
        // Execute skill
        result = await this.executeSkill(input.skill, input.args);
      } else if (input.prompt) {
        // Simulate agent processing of prompt
        result = await this.processPrompt(input.prompt);
      } else {
        throw new Error('Unknown input type');
      }

      this.log('real_end', { output: result.output });

      return result;

    } catch (error) {
      this.log('real_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute a shell command
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.log('tool_call', { tool: 'Bash', args: { command } });

      try {
        const output = execSync(command, {
          cwd: this.workDir || process.cwd(),
          timeout: this.timeout,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        resolve({
          output: {
            stdout: output,
            stderr: '',
            exitCode: 0
          },
          turns: 1,
          toolCalls: 1
        });

      } catch (error) {
        if (error.status !== undefined) {
          // Command failed but executed
          resolve({
            output: {
              stdout: error.stdout || '',
              stderr: error.stderr || '',
              exitCode: error.status
            },
            turns: 1,
            toolCalls: 1
          });
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Execute a skill (placeholder for skill integration)
   */
  async executeSkill(skillName, args) {
    this.log('skill_activation', { skill: skillName });
    this.log('tool_call', { tool: 'Skill', args: { skill: skillName, args } });

    // Placeholder: In real implementation, this would invoke the actual skill
    // For now, return mock output indicating skill was called
    return {
      output: {
        skill: skillName,
        executed: true,
        args: args,
        result: 'Skill execution simulated'
      },
      turns: 1,
      toolCalls: 1
    };
  }

  /**
   * Process a prompt (simulate agent behavior)
   */
  async processPrompt(prompt) {
    // Detect which skills should be activated
    const activatedSkills = this.detectSkills(prompt);

    for (const skill of activatedSkills) {
      this.log('skill_activation', { skill });
    }

    // Simulate agent processing
    const managerAgent = this.detectManagerAgent(prompt);
    if (managerAgent) {
      this.log('agent_activation', { agent: managerAgent });
    }

    return {
      output: {
        prompt: prompt,
        activatedSkills: activatedSkills,
        managerAgent: managerAgent,
        processed: true
      },
      turns: 1,
      toolCalls: activatedSkills.length
    };
  }

  /**
   * Detect skills that should be activated based on prompt
   * Patterns MUST match skill-rules.json for accurate simulation
   * Updated: 2026-01-14 - Synced with skill-rules.json intentPatterns
   */
  detectSkills(prompt) {
    const activated = [];

    // Priority-based skill detection (order matters for specificity)
    const skillDetectors = [
      // ============================================
      // Build Skills
      // ============================================
      {
        skill: 'kiips-maven-builder',
        // From skill-rules.json: keywords + intentPatterns
        patterns: [
          /(?:빌드|build)/i,
          /(?:maven|mvn)/i,
          /(?:compile|package)/i,
          /KiiPS-HUB/i,
          /(?:build|compile|package).*?(?:service|module|project)/i,
          /KiiPS-(?:FD|IL|PG|COMMON|UTILS).*?(?:build|빌드)/i
        ]
      },
      {
        skill: 'kiips-test-runner',
        // Keywords: 테스트, test, junit, 검증, validation
        patterns: [
          /(?:테스트|test).*?(?:실행|run|execute)/i,
          /(?:junit|karma|jest)/i,
          /(?:단위|unit)\s*테스트/i,
          /(?:run|실행).*?test/i,
          /(?:coverage|커버리지)/i,
          /빌드.*,\s*테스트/i,                                  // "빌드, 테스트" in comma-separated list
          /테스트.*,\s*배포/i,                                  // "테스트, 배포" in comma-separated list
          /KiiPS-[A-Z]+.*테스트/i                               // "KiiPS-FD 테스트" module context
        ]
      },

      // ============================================
      // Deploy Skills
      // ============================================
      {
        skill: 'kiips-service-deployer',
        patterns: [
          /(?:배포|deploy)/i,
          /(?:start|stop|restart).*?service/i,
          /서비스\s*(?:시작|중지|재시작)/i,
          /(?:health|status)\s*(?:check|확인)/i
        ]
      },

      // ============================================
      // Analysis Skills (more specific patterns)
      // ============================================
      {
        skill: 'kiips-api-tester',
        // Keywords: API, 테스트, test, gateway, endpoint, JWT
        patterns: [
          /(?:api|API).*?(?:테스트|test)/i,
          /(?:테스트|test).*?(?:api|API)/i,
          /엔드포인트.*?(?:검증|테스트)/i,
          /(?:endpoint|gateway).*?(?:test|verify|check)/i,
          /(?:routing|라우팅).*?(?:test|테스트)/i,
          /API\s*Gateway/i,
          /(?:verify|check).*?(?:routing|authentication)/i
        ]
      },
      {
        skill: 'kiips-log-analyzer',
        // Keywords: 로그, log, error, 분석, analyze, grep
        patterns: [
          /(?:로그|log).*?(?:분석|analyze|확인|검색)/i,
          /(?:분석|analyze).*?(?:로그|log)/i,
          /에러.*?(?:분석|확인|찾|원인)/i,
          /(?:error|exception).*?(?:analyze|find|check)/i,
          /(?:troubleshoot|debug).*?issue/i,
          /(?:check|analyze|find).*?(?:log|error)/i,
          /디버그.*?(?:로그|log)/i,
          /로그\s*확인/i                                         // "로그 확인해줘"
        ]
      },

      // ============================================
      // Planning Skills
      // ============================================
      {
        skill: 'kiips-feature-planner',
        patterns: [
          /(?:새로운|new).*?(?:기능|feature)/i,
          /(?:기능|feature).*?(?:계획|plan|개발)/i,
          /(?:개발|develop).*?(?:계획|plan)/i,
          /(?:구현|implement).*?(?:기능|feature)/i,
          /feature.*?(?:추가|add|create)/i,
          /플랜\s*(?:작성|세워|만들)/i,                         // "플랜 작성해줘"
          /(?:plan|플랜).*?(?:create|작성|세우)/i
        ]
      },
      {
        skill: 'kiips-detail-page-planner',
        patterns: [
          /(?:상세|detail).*?(?:페이지|page|화면)/i,
          /(?:생성|create|만들|개발).*?(?:상세|detail)/i,
          /[A-Z]{2}0[0-9]0[0-9].*?(?:상세|detail)/i
        ]
      },

      // ============================================
      // UI Skills
      // ============================================
      {
        skill: 'kiips-ui-component-builder',
        patterns: [
          /(?:create|생성|만들).*?(?:UI|component|컴포넌트|page|페이지|screen|화면)/i,
          /(?:add|추가).*?(?:form|폼|modal|모달)/i,
          /(?:build|develop).*?(?:JSP|화면|페이지)/i,
          /(?:new|새).*?(?:page|화면|component|컴포넌트)/i,
          /화면.*?(?:컴포넌트|만들|생성|개발|추가|설계|구현)/i,
          /새\s*페이지/i,                                        // "새 페이지 만들어줘"
          /(?:페이지|page).*?(?:만들|생성|create)/i,             // "페이지 만들어줘"
          /화면에.*?(?:추가|테이블)/i,                           // "화면에 RealGrid 테이블 추가"
          /(?:설계|구현).*?(?:화면|페이지)/i                     // "화면 설계하고 구현해줘"
        ]
      },
      {
        skill: 'kiips-realgrid-guide',
        // Note: Changed from kiips-realgrid-builder to match skill-rules.json
        patterns: [
          /(?:RealGrid|리얼그리드)/i,
          /(?:create|생성|만들).*?(?:그리드|grid|table|테이블)/i,
          /(?:그리드|grid).*?(?:생성|만들|추가|설정)/i,
          /(?:멀티|multi).*?(?:level|레벨).*?(?:header|헤더)/i,
          /(?:Excel|엑셀).*?(?:export|import|다운로드|업로드)/i,
          /테이블\s*(?:컴포넌트|component)/i,                   // "테이블 컴포넌트 만들어줘"
          /(?:data\s*)?grid/i                                   // "data grid"
        ]
      },

      // ============================================
      // Other Skills
      // ============================================
      {
        skill: 'checklist-generator',
        patterns: [
          /(?:create|generate|make|생성|작성).*?(?:checklist|체크리스트|TODO)/i,
          /(?:code review|deployment|testing).*?(?:checklist|체크리스트)/i,
          /(?:verify|check|validate).*?(?:list|items)/i
        ]
      }
    ];

    // Check each detector
    for (const detector of skillDetectors) {
      for (const pattern of detector.patterns) {
        if (pattern.test(prompt)) {
          if (!activated.includes(detector.skill)) {
            activated.push(detector.skill);
          }
          break; // Found match, move to next skill
        }
      }
    }

    return activated;
  }

  /**
   * Detect manager agent based on prompt
   * Priority order matters - more specific patterns first
   */
  detectManagerAgent(prompt) {
    // Check patterns in priority order
    const managerPatterns = [
      // UI Manager - UI/화면 관련 키워드
      { manager: 'ui-manager', pattern: /(?:ui|화면|페이지|컴포넌트|realgrid|그리드|차트)/i },
      // Build Manager - 빌드/컴파일 관련
      { manager: 'build-manager', pattern: /(?:빌드|build|maven|compile|package|패키지)/i },
      // Deployment Manager - 배포/서비스 관리
      { manager: 'deployment-manager', pattern: /(?:배포|deploy|서비스|start|stop|restart|로그|log)/i },
      // Feature Manager - 기능/계획 관련
      { manager: 'feature-manager', pattern: /(?:기능|feature|계획|plan|개발)/i }
    ];

    for (const { manager, pattern } of managerPatterns) {
      if (pattern.test(prompt)) {
        return manager;
      }
    }

    return null;
  }

  /**
   * Generate mock output based on input
   */
  generateMockOutput(input) {
    if (input.command) {
      return {
        stdout: 'Mock command output',
        stderr: '',
        exitCode: 0
      };
    }

    if (input.skill) {
      return {
        skill: input.skill,
        executed: true,
        result: 'Mock skill result'
      };
    }

    if (input.prompt) {
      return {
        prompt: input.prompt,
        activatedSkills: this.detectSkills(input.prompt),
        managerAgent: this.detectManagerAgent(input.prompt),
        processed: true
      };
    }

    return { mock: true };
  }

  /**
   * Generate mock tool calls based on input
   */
  generateMockToolCalls(input) {
    const calls = [];

    if (input.command) {
      calls.push({ tool: 'Bash', args: { command: input.command } });
    }

    if (input.prompt) {
      const skills = this.detectSkills(input.prompt);
      for (const skill of skills) {
        calls.push({ tool: 'Skill', args: { skill } });
      }
    }

    return calls;
  }

  /**
   * Log an event to transcript
   */
  log(type, data) {
    const entry = {
      timestamp: Date.now(),
      type: type,
      ...data
    };
    this.transcript.push(entry);
    this.emit('log', entry);
  }

  /**
   * Create isolated work directory
   */
  createWorkDir() {
    const tmpDir = path.join(process.cwd(), 'tests/agent-evals/results/.sandbox');
    const workDir = path.join(tmpDir, `sandbox-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    this.cleanupTasks.push(() => {
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    });

    return workDir;
  }

  /**
   * Reset sandbox state
   */
  reset() {
    this.transcript = [];
    this.state = {};
    this.workDir = null;
  }

  /**
   * Cleanup sandbox resources
   */
  async cleanup() {
    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch (error) {
        console.error('Cleanup error:', error.message);
      }
    }
    this.cleanupTasks = [];
    this.reset();
  }
}

module.exports = Sandbox;
