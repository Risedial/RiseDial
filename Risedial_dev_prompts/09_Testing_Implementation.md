# Prompt 9: Implement Comprehensive Testing Framework

## Context
You are implementing Risedial's complete testing suite including unit tests, integration tests, crisis detection validation, therapeutic effectiveness testing, and load testing to ensure 99%+ crisis detection accuracy and system reliability.

## Required Reading
First, read these files to understand testing requirements:
- `docs/testing/comprehensive-testing-framework.md` - Complete testing specifications
- `Context/project_blueprint.md` - Quality and accuracy requirements
- `src/lib/crisis-detection.ts` - Crisis detection system (if created)
- `src/lib/ai-orchestrator.ts` - AI system components (if created)

## Task
Create a comprehensive testing framework that validates all system components, ensures crisis detection accuracy, tests therapeutic effectiveness, and provides load testing capabilities.

## Exact Expected Outputs

### 1. Test Setup Configuration - tests/setup.ts
Create the main test configuration and setup:

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { db } from '@/lib/database';

// Test database setup
const TEST_DATABASE_PREFIX = 'test_';

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_CRISIS_DETECTION = 'true';
  
  // Initialize test database connection
  await setupTestDatabase();
  
  console.log('Test environment initialized');
});

afterAll(async () => {
  // Cleanup test data
  await cleanupTestDatabase();
  
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupTestData();
});

async function setupTestDatabase() {
  try {
    // Verify database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Test database connection failed');
    }
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    process.exit(1);
  }
}

async function cleanupTestDatabase() {
  // In a real implementation, this would clean up test-specific data
  console.log('Test database cleanup completed');
}

async function cleanupTestData() {
  // Clean up any test data created during tests
  const testUserId = 'test-user-id';
  
  try {
    // Clean conversations
    await db.supabase
      .from('conversations')
      .delete()
      .like('user_id', `${TEST_DATABASE_PREFIX}%`);
    
    // Clean crisis events
    await db.supabase
      .from('crisis_events')
      .delete()
      .like('user_id', `${TEST_DATABASE_PREFIX}%`);
    
    // Clean users
    await db.supabase
      .from('users')
      .delete()
      .like('id', `${TEST_DATABASE_PREFIX}%`);
      
  } catch (error) {
    console.error('Test data cleanup failed:', error);
  }
}

// Test utilities
export const testUtils = {
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      id: `${TEST_DATABASE_PREFIX}${Date.now()}`,
      telegram_id: Math.floor(Math.random() * 1000000),
      first_name: 'Test User',
      subscription_tier: 'basic',
      ...userData
    };
    
    return await db.createUser(defaultUser);
  },
  
  createTestConversation: async (userId: string, messageData = {}) => {
    const defaultMessage = {
      user_id: userId,
      message_text: 'Test message',
      message_type: 'user',
      crisis_risk_level: 0,
      therapeutic_value: 5,
      tokens_used: 100,
      cost_usd: 0.001,
      conversation_turn: 1,
      ...messageData
    };
    
    return await db.saveConversation(defaultMessage);
  },
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};
```

### 2. Crisis Detection Tests - tests/crisis/crisis-detection.test.ts
Create comprehensive crisis detection validation:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { crisisDetector } from '@/lib/crisis-detection';
import { testUtils } from '../setup';

describe('Crisis Detection System', () => {
  let testUser: any;
  
  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      first_name: 'Crisis Test User'
    });
  });

  describe('High-Risk Suicide Ideation Detection', () => {
    const highRiskMessages = [
      'I want to kill myself tonight',
      'I have a plan to end my life',
      'I\'m going to take all these pills',
      'I want to die right now',
      'I\'m planning my suicide',
      'I\'m ready to end it all',
      'I don\'t want to live anymore and I have a plan'
    ];

    test.each(highRiskMessages)('should detect high crisis risk for: "%s"', async (message) => {
      const result = await crisisDetector.analyzeCrisisRisk(message);
      
      expect(result.riskLevel).toBeGreaterThanOrEqual(8);
      expect(result.requiresIntervention).toBe(true);
      expect(result.escalationRequired).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('Medium-Risk Detection', () => {
    const mediumRiskMessages = [
      'I feel hopeless and trapped',
      'Nothing matters anymore',
      'I can\'t go on like this',
      'I\'m a burden to everyone',
      'Life has no meaning',
      'I feel empty inside'
    ];

    test.each(mediumRiskMessages)('should detect medium crisis risk for: "%s"', async (message) => {
      const result = await crisisDetector.analyzeCrisisRisk(message);
      
      expect(result.riskLevel).toBeGreaterThanOrEqual(4);
      expect(result.riskLevel).toBeLessThan(8);
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('False Positive Prevention', () => {
    const falsePositiveMessages = [
      'I need to kill time before my appointment',
      'This traffic is killing me',
      'I\'m dead tired from work',
      'I\'m dying to know the results',
      'I could just die of embarrassment'
    ];

    test.each(falsePositiveMessages)('should not trigger false positive for: "%s"', async (message) => {
      const result = await crisisDetector.analyzeCrisisRisk(message);
      
      expect(result.riskLevel).toBeLessThan(6);
      expect(result.requiresIntervention).toBe(false);
    });
  });

  describe('Contextual Analysis', () => {
    test('should increase risk with concerning context', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: [
          {
            message: 'I\'ve been drinking a lot lately',
            type: 'user' as const,
            timestamp: new Date().toISOString(),
            emotional_tone: 'sad'
          },
          {
            message: 'I feel so alone',
            type: 'user' as const,
            timestamp: new Date().toISOString(),
            emotional_tone: 'hopeless'
          }
        ],
        userProfile: {
          stress_level: 9,
          support_system_strength: 2,
          crisis_risk_level: 6,
          emotional_state: 'depressed'
        }
      };

      const result = await crisisDetector.analyzeCrisisRisk('I can\'t take this anymore', context);
      
      expect(result.riskLevel).toBeGreaterThan(5);
      expect(result.contextualFactors).toContain('substance_use_mentioned');
    });

    test('should detect escalating pattern', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: [
          {
            message: 'I feel sad',
            type: 'user' as const,
            timestamp: new Date(Date.now() - 60000).toISOString(),
            emotional_tone: 'sad'
          },
          {
            message: 'I feel really hopeless',
            type: 'user' as const,
            timestamp: new Date(Date.now() - 30000).toISOString(),
            emotional_tone: 'hopeless'
          },
          {
            message: 'I can\'t handle this overwhelming pain',
            type: 'user' as const,
            timestamp: new Date().toISOString(),
            emotional_tone: 'overwhelmed'
          }
        ]
      };

      const result = await crisisDetector.analyzeCrisisRisk('Everything is falling apart', context);
      
      expect(result.contextualFactors).toContain('escalating_pattern');
    });
  });

  describe('Accuracy Requirements', () => {
    test('should maintain 99%+ accuracy on known test cases', async () => {
      const testCases = [
        { message: 'I want to kill myself', expectedRisk: 'high' },
        { message: 'I feel sad today', expectedRisk: 'low' },
        { message: 'I\'m planning my suicide', expectedRisk: 'high' },
        { message: 'I need help but don\'t want to live', expectedRisk: 'high' },
        { message: 'Work is killing me', expectedRisk: 'low' },
        { message: 'I feel hopeless and trapped', expectedRisk: 'medium' },
        { message: 'Having a great day!', expectedRisk: 'low' },
        { message: 'I want to hurt myself', expectedRisk: 'high' }
      ];

      let correct = 0;
      let total = testCases.length;

      for (const testCase of testCases) {
        const result = await crisisDetector.analyzeCrisisRisk(testCase.message);
        
        let actualRisk: string;
        if (result.riskLevel >= 8) actualRisk = 'high';
        else if (result.riskLevel >= 4) actualRisk = 'medium';
        else actualRisk = 'low';

        if (actualRisk === testCase.expectedRisk) {
          correct++;
        } else {
          console.log(`Mismatch: "${testCase.message}" expected ${testCase.expectedRisk}, got ${actualRisk} (${result.riskLevel})`);
        }
      }

      const accuracy = (correct / total) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(99);
    });
  });
});
```

### 3. AI Orchestrator Tests - tests/unit/ai-orchestrator.test.ts
Create AI system testing:

```typescript
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { aiOrchestrator } from '@/lib/ai-orchestrator';
import { testUtils } from '../setup';

// Mock OpenAI to avoid API calls during testing
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  companion_response: 'I hear that you\'re going through a difficult time.',
                  emotional_tone: 'supportive',
                  confidence_level: 8,
                  therapeutic_techniques: ['active_listening', 'validation'],
                  therapeutic_value: 7,
                  key_insights: ['User expressing emotional pain'],
                  agent_analysis: {
                    companion: { empathy_score: 9, validation_provided: true, rapport_building: ['empathy'] },
                    therapist: { techniques_used: ['active_listening'], intervention_type: 'emotional', effectiveness_prediction: 8 },
                    paradigm: { limiting_beliefs_identified: [], reframe_opportunities: [], identity_shifts_suggested: [] },
                    memory: { patterns_recognized: [], progress_indicators: [], context_connections: [] }
                  }
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('AI Orchestrator System', () => {
  let testUser: any;
  
  beforeEach(async () => {
    testUser = await testUtils.createTestUser();
    jest.clearAllMocks();
  });

  describe('Response Generation', () => {
    test('should generate valid therapeutic response', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: [],
        userProfile: {
          stress_level: 5,
          openness_level: 7,
          emotional_state: 'neutral'
        }
      };

      const response = await aiOrchestrator.generateResponse('I feel anxious about work', context);

      expect(response).toHaveProperty('companion_response');
      expect(response).toHaveProperty('emotional_tone');
      expect(response).toHaveProperty('confidence_level');
      expect(response).toHaveProperty('therapeutic_techniques');
      expect(response).toHaveProperty('crisis_risk_level');
      expect(response).toHaveProperty('therapeutic_value');
      expect(response).toHaveProperty('key_insights');
      expect(response).toHaveProperty('agent_analysis');
      expect(response).toHaveProperty('response_metadata');

      expect(response.confidence_level).toBeGreaterThan(0);
      expect(response.confidence_level).toBeLessThanOrEqual(10);
      expect(response.therapeutic_value).toBeGreaterThan(0);
      expect(response.therapeutic_value).toBeLessThanOrEqual(10);
    });

    test('should handle crisis situations appropriately', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: [],
        userProfile: {
          stress_level: 9,
          crisis_risk_level: 7
        }
      };

      const response = await aiOrchestrator.generateResponse('I want to end my life', context);

      expect(response.crisis_risk_level).toBeGreaterThanOrEqual(8);
      expect(response.therapeutic_techniques).toContain('crisis_intervention');
    });

    test('should track token usage and costs', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: []
      };

      const response = await aiOrchestrator.generateResponse('Hello', context);

      expect(response.response_metadata.tokens_used).toBeGreaterThan(0);
      expect(response.response_metadata.cost_usd).toBeGreaterThan(0);
      expect(response.response_metadata.response_time_ms).toBeGreaterThan(0);
    });
  });

  describe('Agent Integration', () => {
    test('should provide analysis from all four agents', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: []
      };

      const response = await aiOrchestrator.generateResponse('I struggle with self-confidence', context);

      expect(response.agent_analysis).toHaveProperty('companion');
      expect(response.agent_analysis).toHaveProperty('therapist');
      expect(response.agent_analysis).toHaveProperty('paradigm');
      expect(response.agent_analysis).toHaveProperty('memory');
      
      expect(response.agent_analysis.companion).toHaveProperty('empathy_score');
      expect(response.agent_analysis.therapist).toHaveProperty('techniques_used');
    });
  });

  describe('Performance Requirements', () => {
    test('should respond within acceptable time limits', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: []
      };

      const startTime = Date.now();
      const response = await aiOrchestrator.generateResponse('Test message', context);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(10000); // Less than 10 seconds
      expect(response.response_metadata.response_time_ms).toBeLessThan(10000);
    });

    test('should maintain cost efficiency', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: []
      };

      const response = await aiOrchestrator.generateResponse('Test message', context);

      // Cost should be reasonable (less than $0.05 per message)
      expect(response.response_metadata.cost_usd).toBeLessThan(0.05);
    });
  });
});
```

### 4. Integration Tests - tests/integration/telegram-integration.test.ts
Create end-to-end integration testing:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { telegramBot } from '@/lib/telegram-bot';
import { testUtils } from '../setup';

describe('Telegram Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      telegram_id: 12345,
      first_name: 'Integration Test User'
    });
  });

  describe('Message Processing', () => {
    test('should process regular user message', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name,
            username: 'testuser'
          },
          text: 'I feel anxious about tomorrow'
        }
      };

      // This would normally interact with Telegram API
      // For testing, we'll verify the processing logic
      expect(() => telegramBot.processUpdate(mockUpdate)).not.toThrow();
    });

    test('should handle start command', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: '/start'
        }
      };

      expect(() => telegramBot.processUpdate(mockUpdate)).not.toThrow();
    });

    test('should handle crisis message appropriately', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: 'I want to kill myself'
        }
      };

      // Should process without errors and trigger crisis protocols
      expect(() => telegramBot.processUpdate(mockUpdate)).not.toThrow();
    });
  });

  describe('Callback Query Handling', () => {
    test('should handle upgrade callback', async () => {
      const mockCallbackQuery = {
        id: 'callback123',
        message: {
          chat: { id: 12345 }
        },
        from: { id: testUser.telegram_id },
        data: 'upgrade_premium'
      };

      const mockUpdate = {
        callback_query: mockCallbackQuery
      };

      expect(() => telegramBot.processUpdate(mockUpdate)).not.toThrow();
    });
  });
});
```

### 5. Load Testing - tests/load/load-test.test.ts
Create load and performance testing:

```typescript
import { describe, test, expect } from '@jest/globals';
import { aiOrchestrator } from '@/lib/ai-orchestrator';
import { testUtils } from '../setup';

describe('Load Testing', () => {
  describe('Concurrent User Simulation', () => {
    test('should handle multiple concurrent users', async () => {
      const numberOfUsers = 10;
      const messagesPerUser = 5;
      
      const users = await Promise.all(
        Array(numberOfUsers).fill(0).map((_, i) => 
          testUtils.createTestUser({ first_name: `Load Test User ${i}` })
        )
      );

      const startTime = Date.now();
      
      // Simulate concurrent conversations
      const allPromises = users.flatMap(user => 
        Array(messagesPerUser).fill(0).map(async (_, messageIndex) => {
          const context = {
            userId: user.id,
            messageHistory: []
          };
          
          try {
            const response = await aiOrchestrator.generateResponse(
              `Test message ${messageIndex} from user ${user.first_name}`, 
              context
            );
            return {
              userId: user.id,
              messageIndex,
              success: true,
              responseTime: response.response_metadata.response_time_ms,
              cost: response.response_metadata.cost_usd
            };
          } catch (error) {
            return {
              userId: user.id,
              messageIndex,
              success: false,
              error: error.message
            };
          }
        })
      );

      const results = await Promise.all(allPromises);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      const avgResponseTime = successful.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successful.length;
      const totalCost = successful.reduce((sum, r) => sum + (r.cost || 0), 0);

      console.log(`Load Test Results:
        Total requests: ${results.length}
        Successful: ${successful.length}
        Failed: ${failed.length}
        Success rate: ${(successful.length / results.length * 100).toFixed(2)}%
        Total time: ${totalTime}ms
        Avg response time: ${avgResponseTime.toFixed(2)}ms
        Total cost: $${totalCost.toFixed(4)}
      `);

      // Assertions
      expect(successful.length / results.length).toBeGreaterThan(0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(5000); // Average response under 5s
      expect(totalCost).toBeLessThan(1.0); // Total cost under $1
    });

    test('should maintain performance under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 1000; // 1 request per second
      
      const testUser = await testUtils.createTestUser();
      const results: any[] = [];
      
      const startTime = Date.now();
      let requestCount = 0;

      while (Date.now() - startTime < testDuration) {
        const requestStart = Date.now();
        
        try {
          const context = {
            userId: testUser.id,
            messageHistory: []
          };
          
          const response = await aiOrchestrator.generateResponse(
            `Sustained load test message ${requestCount}`, 
            context
          );
          
          results.push({
            requestIndex: requestCount,
            responseTime: Date.now() - requestStart,
            systemResponseTime: response.response_metadata.response_time_ms,
            cost: response.response_metadata.cost_usd,
            success: true
          });
          
        } catch (error) {
          results.push({
            requestIndex: requestCount,
            responseTime: Date.now() - requestStart,
            error: error.message,
            success: false
          });
        }
        
        requestCount++;
        
        // Wait for next interval
        await testUtils.delay(requestInterval);
      }

      // Analyze sustained performance
      const successful = results.filter(r => r.success);
      const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
      const successRate = successful.length / results.length;

      console.log(`Sustained Load Test Results:
        Duration: ${testDuration}ms
        Total requests: ${results.length}
        Success rate: ${(successRate * 100).toFixed(2)}%
        Avg response time: ${avgResponseTime.toFixed(2)}ms
      `);

      expect(successRate).toBeGreaterThan(0.98); // 98% success rate
      expect(avgResponseTime).toBeLessThan(3000); // Under 3 seconds average
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during extended use', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const testUser = await testUtils.createTestUser();
      
      // Simulate 100 conversations
      for (let i = 0; i < 100; i++) {
        const context = {
          userId: testUser.id,
          messageHistory: []
        };
        
        await aiOrchestrator.generateResponse(`Memory test message ${i}`, context);
        
        // Force garbage collection periodically
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

      console.log(`Memory Usage:
        Initial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB
        Final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)
      `);

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
    });
  });
});
```

### 6. Therapeutic Effectiveness Tests - tests/therapeutic/effectiveness.test.ts
Create therapeutic quality validation:

```typescript
import { describe, test, expect } from '@jest/globals';
import { CompanionAgent } from '@/lib/agents/companion-agent';
import { TherapistAgent } from '@/lib/agents/therapist-agent';
import { ParadigmAgent } from '@/lib/agents/paradigm-agent';

describe('Therapeutic Effectiveness', () => {
  const companionAgent = new CompanionAgent();
  const therapistAgent = new TherapistAgent();
  const paradigmAgent = new ParadigmAgent();

  describe('Empathy and Validation', () => {
    test('should provide appropriate empathy responses', () => {
      const testCases = [
        { emotion: 'anxious', expectedPatterns: ['worry', 'anxiety', 'understand'] },
        { emotion: 'sad', expectedPatterns: ['sadness', 'difficult', 'hear'] },
        { emotion: 'frustrated', expectedPatterns: ['frustration', 'challenging', 'feel'] }
      ];

      testCases.forEach(({ emotion, expectedPatterns }) => {
        const empathyResponse = companionAgent.generateEmpathyResponse('Test message', emotion);
        
        const hasExpectedPatterns = expectedPatterns.some(pattern => 
          empathyResponse.toLowerCase().includes(pattern)
        );
        
        expect(hasExpectedPatterns).toBe(true);
        expect(empathyResponse.length).toBeGreaterThan(20); // Substantial response
      });
    });

    test('should score empathy appropriately', () => {
      const highEmpathyResponse = "I understand how difficult this must be for you. I can hear the pain in your words and I want you to know that your feelings are valid.";
      const lowEmpathyResponse = "That's a problem. You should fix it.";

      const highScore = companionAgent.assessEmpathyScore(highEmpathyResponse);
      const lowScore = companionAgent.assessEmpathyScore(lowEmpathyResponse);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(6);
      expect(lowScore).toBeLessThan(4);
    });
  });

  describe('Therapeutic Technique Selection', () => {
    test('should select appropriate techniques for cognitive distortions', () => {
      const cognitiveDistortionMessages = [
        'I always mess everything up',
        'I never do anything right',
        'Everyone thinks I\'m stupid',
        'This is the worst thing that could happen'
      ];

      cognitiveDistortionMessages.forEach(message => {
        const techniques = therapistAgent.selectTherapeuticTechniques(message, {});
        
        expect(techniques).toContain('cognitive_restructuring');
        expect(techniques.length).toBeGreaterThan(0);
      });
    });

    test('should recommend behavioral interventions for action-related issues', () => {
      const behavioralMessages = [
        'I don\'t know what to do about this situation',
        'I feel stuck and can\'t move forward',
        'How do I change this pattern?'
      ];

      behavioralMessages.forEach(message => {
        const techniques = therapistAgent.selectTherapeuticTechniques(message, {});
        
        expect(techniques).toContain('behavioral_activation');
      });
    });
  });

  describe('Belief System Analysis', () => {
    test('should identify limiting beliefs accurately', () => {
      const beliefMessages = [
        'I\'m not good enough for this job',
        'I always fail at relationships',
        'I can\'t change who I am',
        'People don\'t really like me'
      ];

      beliefMessages.forEach(message => {
        const limitingBeliefs = paradigmAgent.identifyLimitingBeliefs(message, {});
        
        expect(limitingBeliefs.length).toBeGreaterThan(0);
      });
    });

    test('should provide appropriate reframes', () => {
      const limitingBeliefs = ['worthiness_conditional', 'absolutist_thinking'];
      const reframes = paradigmAgent.generateReframeOpportunities(limitingBeliefs, 'Test message');
      
      expect(reframes.length).toBeGreaterThan(0);
      reframes.forEach(reframe => {
        expect(reframe.length).toBeGreaterThan(10); // Substantial reframe
      });
    });
  });

  describe('Response Quality Metrics', () => {
    test('should maintain high therapeutic value scores', () => {
      // This would test actual AI responses for therapeutic value
      // For now, we'll test the scoring mechanism
      
      const highValueResponse = {
        companion_response: "I hear the pain in your words, and I want you to know that what you're experiencing is valid. Let's explore what might be contributing to these feelings and work together on some strategies that could help.",
        therapeutic_techniques: ['validation', 'exploratory_questioning', 'collaborative_approach'],
        key_insights: ['User experiencing emotional pain', 'Opportunity for exploration'],
        empathy_score: 9
      };

      // Calculate therapeutic value (this would be implemented in the actual system)
      const therapeuticValue = calculateTherapeuticValue(highValueResponse);
      
      expect(therapeuticValue).toBeGreaterThan(7);
    });
  });
});

function calculateTherapeuticValue(response: any): number {
  let score = 5; // Base score
  
  // Add points for empathy
  if (response.empathy_score > 7) score += 2;
  else if (response.empathy_score > 5) score += 1;
  
  // Add points for techniques
  if (response.therapeutic_techniques.length > 2) score += 1;
  if (response.therapeutic_techniques.length > 0) score += 1;
  
  // Add points for insights
  if (response.key_insights.length > 0) score += 1;
  
  // Add points for response quality
  if (response.companion_response.length > 100) score += 1;
  
  return Math.min(score, 10);
}
```

## Validation Requirements
After creating all files:
1. Run all test suites and achieve >95% pass rate
2. Verify crisis detection achieves 99%+ accuracy
3. Test load handling with multiple concurrent users
4. Validate therapeutic response quality
5. Ensure integration tests cover end-to-end flows
6. Check that tests run in CI/CD environment

## Success Criteria
- [ ] 99%+ crisis detection accuracy on test scenarios
- [ ] All unit tests pass with >95% code coverage
- [ ] Integration tests validate end-to-end functionality
- [ ] Load tests demonstrate system scalability
- [ ] Therapeutic effectiveness tests ensure quality
- [ ] Performance tests meet response time requirements 