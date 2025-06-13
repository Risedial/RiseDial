# Comprehensive Testing Framework for Risedial

## Testing Strategy Overview

### Testing Pyramid
```
┌─────────────────────────────────────┐
│         E2E Tests (5%)              │
│    User acceptance testing          │
├─────────────────────────────────────┤
│     Integration Tests (25%)         │
│   API endpoints, DB operations      │
├─────────────────────────────────────┤
│      Unit Tests (70%)               │
│  Individual functions/components    │
└─────────────────────────────────────┘
```

### Critical Testing Requirements
- **Crisis Detection**: 99%+ accuracy on test scenarios
- **Therapeutic Effectiveness**: Measurable response quality
- **Load Testing**: 1000+ concurrent users
- **Security Testing**: Input validation, rate limiting
- **Cost Validation**: Stay within budget limits

## 1. Unit Testing Framework

### Setup & Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Test Setup File
```typescript
// tests/setup.ts
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load test environment variables
config({ path: '.env.test' });

// Mock external services for testing
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
    answerCallbackQuery: jest.fn(),
    sendChatAction: jest.fn()
  }));
});

// Global test utilities
global.testUtils = {
  createTestUser: async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const userData = {
      telegram_id: Math.floor(Math.random() * 1000000),
      first_name: 'Test User',
      subscription_tier: 'basic'
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  cleanupTestData: async (userId: string) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabase.from('users').delete().eq('id', userId);
  }
};
```

### Core Unit Tests

#### AI Orchestrator Tests
```typescript
// tests/unit/ai-orchestrator.test.ts
import { AIOrchestrator } from '@/lib/ai-orchestrator';
import { mockOpenAI } from '../mocks/openai';

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator;
  
  beforeEach(() => {
    orchestrator = new AIOrchestrator();
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate therapeutic response with proper context', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              companion_response: "I understand you're feeling stressed...",
              emotional_tone: "supportive",
              therapeutic_techniques: ["active_listening", "validation"],
              crisis_risk_level: 0,
              key_insights: ["User expressing work stress"]
            })
          }
        }]
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await orchestrator.generateResponse(
        'I feel so overwhelmed with work',
        { userId: 'test-user-id', messageHistory: [] }
      );
      
      expect(result.companion_response).toContain('understand');
      expect(result.emotional_tone).toBe('supportive');
      expect(result.crisis_risk_level).toBe(0);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API Rate Limit')
      );
      
      await expect(
        orchestrator.generateResponse('Hello', { userId: 'test', messageHistory: [] })
      ).rejects.toThrow('AI service temporarily unavailable');
    });
  });
});
```

#### Crisis Detection Tests
```typescript
// tests/unit/crisis-detection.test.ts
import { CrisisDetector } from '@/lib/crisis-detection';

describe('CrisisDetector', () => {
  let detector: CrisisDetector;
  
  beforeEach(() => {
    detector = new CrisisDetector();
  });

  describe('analyzeCrisisRisk', () => {
    it('should detect high-risk suicide keywords', () => {
      const testCases = [
        'I want to kill myself',
        'I should just end my life',
        'better off dead',
        'going to hurt myself'
      ];
      
      testCases.forEach(message => {
        const result = detector.analyzeCrisisRisk(message);
        expect(result.riskLevel).toBeGreaterThanOrEqual(8);
        expect(result.requiresIntervention).toBe(true);
        expect(result.detectedKeywords.length).toBeGreaterThan(0);
      });
    });

    it('should detect medium-risk concern keywords', () => {
      const testCases = [
        'I feel hopeless',
        'nothing matters anymore',
        'I cant go on like this',
        'I give up'
      ];
      
      testCases.forEach(message => {
        const result = detector.analyzeCrisisRisk(message);
        expect(result.riskLevel).toBeGreaterThanOrEqual(4);
        expect(result.riskLevel).toBeLessThan(8);
        expect(result.requiresIntervention).toBe(false);
      });
    });

    it('should not flag normal conversation', () => {
      const testCases = [
        'I had a good day today',
        'Feeling a bit tired but okay',
        'Looking forward to the weekend'
      ];
      
      testCases.forEach(message => {
        const result = detector.analyzeCrisisRisk(message);
        expect(result.riskLevel).toBeLessThan(4);
        expect(result.requiresIntervention).toBe(false);
      });
    });

    it('should handle context-aware detection', () => {
      const context = {
        recentMessages: [
          'Ive been feeling really down lately',
          'Nothing seems to help',
          'I just want it all to stop'
        ],
        userProfile: {
          stress_level: 8,
          crisis_risk_level: 3
        }
      };
      
      const result = detector.analyzeCrisisRisk(
        'Maybe I should just disappear',
        context
      );
      
      expect(result.riskLevel).toBeGreaterThan(6);
      expect(result.contextualFactors).toContain('escalating_pattern');
    });
  });
});
```

#### Cost Monitoring Tests
```typescript
// tests/unit/cost-monitor.test.ts
import { CostMonitor } from '@/lib/cost-monitor';

describe('CostMonitor', () => {
  let monitor: CostMonitor;
  
  beforeEach(() => {
    monitor = new CostMonitor();
  });

  describe('calculateTokenCost', () => {
    it('should calculate GPT-4 costs correctly', () => {
      const cost = monitor.calculateTokenCost({
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500
      });
      
      // GPT-4: $0.03 input, $0.06 output per 1K tokens
      const expectedCost = (1000 * 0.03 / 1000) + (500 * 0.06 / 1000);
      expect(cost).toBeCloseTo(expectedCost, 4);
    });
  });

  describe('checkUserCostLimits', () => {
    it('should enforce daily cost limits', async () => {
      const userId = 'test-user';
      
      // Mock user already spent $0.45 today
      jest.spyOn(monitor, 'getDailyCost').mockResolvedValue(0.45);
      
      const result = await monitor.checkUserCostLimits(userId, 0.10);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('daily limit');
    });

    it('should allow within limits', async () => {
      const userId = 'test-user';
      
      jest.spyOn(monitor, 'getDailyCost').mockResolvedValue(0.25);
      
      const result = await monitor.checkUserCostLimits(userId, 0.10);
      
      expect(result.allowed).toBe(true);
      expect(result.remainingDaily).toBeCloseTo(0.15, 2);
    });
  });
});
```

## 2. Integration Testing

### API Endpoint Tests
```typescript
// tests/integration/telegram-webhook.test.ts
import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/telegram-webhook';

describe('/api/telegram-webhook', () => {
  it('should process valid telegram message', async () => {
    const mockUpdate = {
      message: {
        message_id: 123,
        from: {
          id: 12345,
          first_name: 'Test User',
          is_bot: false
        },
        chat: {
          id: 12345,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Hello, I need help with stress'
      }
    };

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': process.env.WEBHOOK_SECRET_TOKEN
      },
      body: mockUpdate
    });

    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ ok: true });
  });

  it('should reject unauthorized requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'invalid-token'
      },
      body: {}
    });

    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
});
```

### Database Integration Tests
```typescript
// tests/integration/database.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Database Operations', () => {
  let supabase: any;
  let testUser: any;
  
  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    testUser = await global.testUtils.createTestUser();
  });
  
  afterAll(async () => {
    await global.testUtils.cleanupTestData(testUser.id);
  });

  describe('Conversation Storage', () => {
    it('should store conversation with psychological analysis', async () => {
      const conversationData = {
        user_id: testUser.id,
        message_text: 'I feel anxious about my presentation',
        message_type: 'user',
        emotional_tone: 'anxious',
        crisis_risk_level: 2,
        key_insights: ['performance_anxiety', 'work_stress']
      };
      
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();
      
      expect(error).toBeNull();
      expect(data.id).toBeDefined();
      expect(data.emotional_tone).toBe('anxious');
    });
  });

  describe('Psychological Profile Updates', () => {
    it('should update user psychological metrics', async () => {
      const profileUpdate = {
        stress_level: 7,
        emotional_state: 'anxious',
        core_beliefs: { 'self_worth': 'conditional_on_performance' }
      };
      
      const { error } = await supabase
        .from('user_psychological_profiles')
        .upsert({
          user_id: testUser.id,
          ...profileUpdate
        });
      
      expect(error).toBeNull();
      
      // Verify update
      const { data } = await supabase
        .from('user_psychological_profiles')
        .select('*')
        .eq('user_id', testUser.id)
        .single();
      
      expect(data.stress_level).toBe(7);
      expect(data.emotional_state).toBe('anxious');
    });
  });
});
```

## 3. Crisis Detection Validation

### Crisis Scenario Testing
```typescript
// tests/crisis/crisis-scenarios.test.ts
import { CrisisDetector } from '@/lib/crisis-detection';
import { CrisisHandler } from '@/lib/crisis-handler';

describe('Crisis Detection Scenarios', () => {
  let detector: CrisisDetector;
  let handler: CrisisHandler;
  
  beforeEach(() => {
    detector = new CrisisDetector();
    handler = new CrisisHandler();
  });

  const crisisScenarios = [
    {
      category: 'Suicide Ideation',
      messages: [
        'I want to kill myself',
        'I should just end it all',
        'Better off dead',
        'Going to hurt myself tonight',
        'Planning to overdose'
      ],
      expectedRiskLevel: 8,
      requiresImmediate: true
    },
    {
      category: 'Self Harm',
      messages: [
        'I cut myself last night',
        'Going to hurt myself',
        'I deserve to be punished',
        'Pain makes me feel better'
      ],
      expectedRiskLevel: 7,
      requiresImmediate: true
    },
    {
      category: 'Severe Depression',
      messages: [
        'Nothing matters anymore',
        'I feel completely hopeless',
        'I cant see any way out',
        'Life has no meaning'
      ],
      expectedRiskLevel: 5,
      requiresImmediate: false
    }
  ];

  crisisScenarios.forEach(scenario => {
    describe(scenario.category, () => {
      scenario.messages.forEach(message => {
        it(`should detect "${message}" with risk level >= ${scenario.expectedRiskLevel}`, () => {
          const result = detector.analyzeCrisisRisk(message);
          
          expect(result.riskLevel).toBeGreaterThanOrEqual(scenario.expectedRiskLevel);
          expect(result.requiresIntervention).toBe(scenario.requiresImmediate);
        });
      });
    });
  });

  describe('Crisis Response Validation', () => {
    it('should provide immediate support resources for high-risk', async () => {
      const crisisEvent = {
        riskLevel: 9,
        detectedKeywords: ['kill myself'],
        message: 'I want to kill myself tonight'
      };
      
      const response = await handler.generateCrisisResponse(crisisEvent);
      
      expect(response.immediateSupport).toBe(true);
      expect(response.resources).toContain('988');
      expect(response.message).toContain('crisis');
      expect(response.followUpRequired).toBe(true);
    });

    it('should escalate to human moderator for severe cases', async () => {
      const escalationSpy = jest.spyOn(handler, 'escalateToHuman');
      
      await handler.handleCrisisEvent({
        riskLevel: 9,
        userId: 'test-user',
        message: 'Planning to end my life tomorrow'
      });
      
      expect(escalationSpy).toHaveBeenCalled();
    });
  });
});
```

## 4. Therapeutic Effectiveness Testing

### Response Quality Assessment
```typescript
// tests/therapeutic/response-quality.test.ts
import { TherapeuticAnalyzer } from '@/lib/therapeutic-analyzer';

describe('Therapeutic Response Quality', () => {
  let analyzer: TherapeuticAnalyzer;
  
  beforeEach(() => {
    analyzer = new TherapeuticAnalyzer();
  });

  const therapeuticScenarios = [
    {
      userInput: 'I always fail at everything I try',
      expectedTechniques: ['cognitive_restructuring', 'evidence_examination'],
      expectedTone: 'supportive',
      expectedQuestions: true
    },
    {
      userInput: 'My boss hates me and wants to fire me',
      expectedTechniques: ['reality_testing', 'perspective_taking'],
      expectedTone: 'curious',
      expectedQuestions: true
    },
    {
      userInput: 'I feel stuck in my relationship',
      expectedTechniques: ['values_clarification', 'exploratory_questioning'],
      expectedTone: 'non-judgmental',
      expectedQuestions: true
    }
  ];

  therapeuticScenarios.forEach(scenario => {
    it(`should provide quality response for: "${scenario.userInput}"`, async () => {
      const response = await analyzer.analyzeResponse(
        scenario.userInput,
        { userId: 'test', messageHistory: [] }
      );
      
      expect(response.therapeutic_techniques).toEqual(
        expect.arrayContaining(scenario.expectedTechniques)
      );
      expect(response.emotional_tone).toBe(scenario.expectedTone);
      
      if (scenario.expectedQuestions) {
        expect(response.companion_response).toMatch(/\?/);
      }
      
      expect(response.therapeutic_value).toBeGreaterThan(6);
    });
  });

  describe('Empathy and Validation', () => {
    it('should demonstrate empathy in responses', async () => {
      const response = await analyzer.analyzeResponse(
        'I feel so alone and misunderstood',
        { userId: 'test', messageHistory: [] }
      );
      
      expect(response.companion_response).toMatch(
        /(understand|hear|feel|sounds like|can imagine)/i
      );
      expect(response.empathy_score).toBeGreaterThan(7);
    });
  });
});
```

## 5. Load Testing

### Concurrent User Testing
```typescript
// tests/load/concurrent-users.test.ts
import { performance } from 'perf_hooks';

describe('Load Testing', () => {
  const CONCURRENT_USERS = 100;
  const MESSAGES_PER_USER = 5;
  
  async function simulateUser(userId: number): Promise<any> {
    const messages = [
      'Hello, I need help with stress',
      'I feel overwhelmed with work',
      'How can I manage my anxiety?',
      'I want to improve my confidence',
      'Thank you for the advice'
    ];
    
    const userMetrics = {
      userId,
      messagesSent: 0,
      responsesReceived: 0,
      averageResponseTime: 0,
      errors: 0
    };
    
    for (const message of messages) {
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/telegram-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              from: { id: userId },
              chat: { id: userId },
              text: message
            }
          })
        });
        
        if (response.ok) {
          userMetrics.messagesSent++;
          userMetrics.responsesReceived++;
        } else {
          userMetrics.errors++;
        }
        
        const responseTime = performance.now() - startTime;
        userMetrics.averageResponseTime = 
          (userMetrics.averageResponseTime + responseTime) / 2;
          
      } catch (error) {
        userMetrics.errors++;
      }
    }
    
    return userMetrics;
  }
  
  it('should handle 100 concurrent users', async () => {
    const startTime = performance.now();
    
    const userPromises = Array.from(
      { length: CONCURRENT_USERS }, 
      (_, i) => simulateUser(i + 1)
    );
    
    const results = await Promise.all(userPromises);
    const totalTime = performance.now() - startTime;
    
    // Analyze results
    const totalMessages = results.reduce((sum, r) => sum + r.messagesSent, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const averageResponseTime = results.reduce(
      (sum, r) => sum + r.averageResponseTime, 0
    ) / results.length;
    
    console.log('Load Test Results:', {
      totalUsers: CONCURRENT_USERS,
      totalMessages,
      totalErrors,
      errorRate: (totalErrors / totalMessages) * 100,
      averageResponseTime,
      totalTestTime: totalTime
    });
    
    // Assertions
    expect(totalErrors / totalMessages).toBeLessThan(0.05); // <5% error rate
    expect(averageResponseTime).toBeLessThan(5000); // <5s response time
  }, 300000); // 5 minute timeout
});
```

### Cost Validation Under Load
```typescript
// tests/load/cost-validation.test.ts
describe('Cost Validation Under Load', () => {
  it('should stay within budget under normal load', async () => {
    const SIMULATED_DAILY_USERS = 1000;
    const MESSAGES_PER_USER = 15; // Basic tier limit
    
    const estimatedCost = SIMULATED_DAILY_USERS * MESSAGES_PER_USER * 0.0012; // Estimated per message cost
    
    expect(estimatedCost).toBeLessThan(50); // Daily budget limit in USD
    
    console.log(`Estimated daily cost for ${SIMULATED_DAILY_USERS} users: $${estimatedCost.toFixed(2)}`);
  });
});
```

## 6. User Acceptance Testing (UAT)

### UAT Test Scenarios
```typescript
// tests/uat/user-scenarios.test.ts
describe('User Acceptance Testing', () => {
  const uatScenarios = [
    {
      name: 'New User Onboarding',
      steps: [
        'User sends /start command',
        'Bot responds with welcome message',
        'User asks first question about personal growth',
        'Bot provides helpful, therapeutic response',
        'User feels understood and supported'
      ],
      expectedOutcome: 'User wants to continue using the service'
    },
    {
      name: 'Daily Check-in Flow',
      steps: [
        'Returning user sends daily update',
        'Bot remembers previous conversations',
        'Bot asks relevant follow-up questions',
        'Bot provides contextual support',
        'User feels heard and validated'
      ],
      expectedOutcome: 'User develops habit of daily check-ins'
    },
    {
      name: 'Crisis Support Response',
      steps: [
        'User expresses suicidal thoughts',
        'Bot immediately detects crisis',
        'Bot provides crisis resources',
        'Bot offers immediate support',
        'User feels less alone and more hopeful'
      ],
      expectedOutcome: 'User gets help and feels supported'
    }
  ];

  uatScenarios.forEach(scenario => {
    describe(scenario.name, () => {
      it(`should achieve: ${scenario.expectedOutcome}`, async () => {
        // UAT scenarios would be executed manually with real users
        // This serves as documentation for manual testing procedures
        expect(scenario.steps.length).toBeGreaterThan(0);
      });
    });
  });
});
```

## 7. Test Execution Scripts

### Continuous Testing Script
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🚀 Running Risedial Test Suite"

# Unit tests
echo "📝 Running unit tests..."
npm run test:unit

# Integration tests
echo "🔗 Running integration tests..."
npm run test:integration

# Crisis detection validation
echo "🚨 Running crisis detection tests..."
npm run test:crisis

# Therapeutic effectiveness tests
echo "🧠 Running therapeutic tests..."
npm run test:therapeutic

# Generate coverage report
echo "📊 Generating coverage report..."
npm run test:coverage

echo "✅ Test suite completed"
```

### Test Data Management
```typescript
// scripts/test-data-setup.ts
export async function setupTestData() {
  // Create test users with various psychological profiles
  // Set up test conversation scenarios
  // Initialize crisis detection test cases
  // Prepare therapeutic effectiveness test data
}

export async function cleanupTestData() {
  // Remove all test users and associated data
  // Clean up test conversations
  // Reset database to clean state
}
```

## 8. Testing Checklist

### Pre-Production Testing Checklist
```
Crisis Detection:
[ ] High-risk keyword detection (99%+ accuracy)
[ ] Context-aware risk assessment
[ ] Immediate resource provision
[ ] Human escalation triggers
[ ] Crisis event logging

Therapeutic Quality:
[ ] Empathy and validation demonstrated
[ ] Appropriate therapeutic techniques used
[ ] Non-judgmental tone maintained
[ ] Progress tracking accuracy
[ ] Personalized responses

Performance:
[ ] <5 second response times
[ ] Handle 1000+ concurrent users
[ ] Graceful error handling
[ ] Rate limiting functional
[ ] Cost monitoring active

Security:
[ ] Input validation comprehensive
[ ] SQL injection prevention
[ ] XSS protection enabled
[ ] Rate limiting prevents abuse
[ ] Error messages don't leak data

Integration:
[ ] Telegram webhook reliable
[ ] Database operations consistent
[ ] OpenAI API failover works
[ ] Monitoring alerts functional
[ ] Backup systems tested
```

This comprehensive testing framework ensures every aspect of Risedial is thoroughly validated before production deployment. 