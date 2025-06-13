import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AIOrchestrator } from '@/lib/ai-orchestrator';
import { testUtils } from '../setup';

// Mock OpenAI to avoid API calls during testing
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async (params) => {
            // Simulate realistic response time
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const mockContent = JSON.stringify({
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
            });

            return {
              choices: [{
                message: {
                  content: mockContent
                }
              }],
              usage: {
                prompt_tokens: 100,
                completion_tokens: 150,
                total_tokens: 250
              }
            };
          })
        }
      }
    }))
  };
});

const aiOrchestrator = new AIOrchestrator();

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
        },
        timestamp: new Date().toISOString()
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
        },
        timestamp: new Date().toISOString()
      };

      const response = await aiOrchestrator.generateResponse('I want to end my life', context);

      expect(response.crisis_risk_level).toBeGreaterThanOrEqual(8);
      expect(response.therapeutic_techniques).toContain('crisis_intervention');
    });

    test('should track token usage and costs', async () => {
      const context = {
        userId: testUser.id,
        messageHistory: [],
        timestamp: new Date().toISOString()
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
        messageHistory: [],
        timestamp: new Date().toISOString()
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
        messageHistory: [],
        timestamp: new Date().toISOString()
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
        messageHistory: [],
        timestamp: new Date().toISOString()
      };

      const response = await aiOrchestrator.generateResponse('Test message', context);

      // Cost should be reasonable (less than $0.05 per message)
      expect(response.response_metadata.cost_usd).toBeLessThan(0.05);
    });
  });
}); 