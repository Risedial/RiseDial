import { describe, test, expect, beforeEach } from '@jest/globals';
import { CrisisDetector } from '@/lib/crisis-detection';
import { testUtils } from '../setup';

const crisisDetector = new CrisisDetector();

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
      const result = crisisDetector.analyzeCrisisRisk(message);
      
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
      const result = crisisDetector.analyzeCrisisRisk(message);
      
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
      const result = crisisDetector.analyzeCrisisRisk(message);
      
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

      const result = crisisDetector.analyzeCrisisRisk('I can\'t take this anymore', context);
      
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

      const result = crisisDetector.analyzeCrisisRisk('Everything is falling apart', context);
      
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
        const result = crisisDetector.analyzeCrisisRisk(testCase.message);
        
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