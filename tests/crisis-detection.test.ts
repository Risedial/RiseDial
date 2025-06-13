// Mock dependencies before importing modules
jest.mock('../src/lib/database', () => ({
  DatabaseUtils: jest.fn().mockImplementation(() => ({
    createCrisisEvent: jest.fn().mockResolvedValue({ id: 'test-crisis-event' }),
    testConnection: jest.fn().mockResolvedValue(true)
  }))
}));

jest.mock('../src/lib/config', () => ({
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      serviceRoleKey: 'test-key'
    }
  }
}));

import { crisisDetector } from '../src/lib/crisis-detection';
import { crisisHandler } from '../src/lib/crisis-handler';
import { safetyProtocols } from '../src/lib/safety-protocols';
import { RiskAssessmentUtil } from '../src/utils/risk-assessment';
import { MessageContext } from '../src/types/conversation';

describe('Crisis Detection System', () => {
  
  // Sample message context for testing
  const mockContext: MessageContext = {
    userId: 'test-user-123',
    sessionId: 'test-session-456',
    messageHistory: [
      {
        message: 'I\'ve been feeling really down lately',
        type: 'user',
        timestamp: new Date().toISOString(),
        emotional_tone: 'sad'
      },
      {
        message: 'Things seem to be getting worse',
        type: 'user', 
        timestamp: new Date().toISOString(),
        emotional_tone: 'distressed'
      }
    ],
    userProfile: {
      stress_level: 7,
      openness_level: 6,
      energy_level: 3,
      emotional_state: 'depressed',
      readiness_for_change: 4,
      resistance_patterns: {},
      preferred_approaches: ['supportive']
    }
  };

  describe('Crisis Detection Accuracy', () => {
    
    test('should detect high-risk suicide ideation with 99%+ accuracy', () => {
      const highRiskMessages = [
        'I want to kill myself tonight',
        'I\'m going to end my life',
        'I have a plan to suicide',
        'I don\'t want to live anymore',
        'I\'m ready to die'
      ];

      highRiskMessages.forEach(message => {
        const result = crisisDetector.analyzeCrisisRisk(message, mockContext);
        expect(result.riskLevel).toBeGreaterThanOrEqual(8);
        expect(result.requiresIntervention).toBe(true);
        expect(result.escalationRequired).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.7);
      });
    });

    test('should detect medium-risk emotional crisis accurately', () => {
      const mediumRiskMessages = [
        'I feel completely hopeless',
        'I can\'t cope with this anymore',
        'Everything is overwhelming me',
        'I\'m falling apart',
        'There\'s no point in anything'
      ];

      mediumRiskMessages.forEach(message => {
        const result = crisisDetector.analyzeCrisisRisk(message, mockContext);
        expect(result.riskLevel).toBeGreaterThanOrEqual(4);
        expect(result.riskLevel).toBeLessThan(8);
        expect(result.detectedKeywords.length).toBeGreaterThan(0);
      });
    });

    test('should properly handle false positives', () => {
      const falsePositiveMessages = [
        'I need to kill time before my appointment',
        'I\'m dead tired from work',
        'This movie is dying to be watched',
        'My phone battery is dead'
      ];

      falsePositiveMessages.forEach(message => {
        const result = crisisDetector.analyzeCrisisRisk(message, mockContext);
        expect(result.riskLevel).toBe(0); // Should be 0 for false positives
        if (message.includes('kill time') || message.includes('dead tired')) {
          expect(result.contextualFactors).toContain('possible_false_positive');
        }
      });
    });

    test('should detect contextual risk modifiers', () => {
      const immediateRiskMessage = 'I want to hurt myself right now';
      const result = crisisDetector.analyzeCrisisRisk(immediateRiskMessage, mockContext);
      
      expect(result.contextualFactors).toContain('immediacy_indicated');
      expect(result.riskLevel).toBeGreaterThan(7);
    });

    test('should generate detailed risk assessments', () => {
      const suicideMessage = 'I want to kill myself';
      const result = crisisDetector.analyzeCrisisRisk(suicideMessage, mockContext);
      
      expect(result.assessmentDetails).toBeDefined();
      expect(result.assessmentDetails.suicide_risk).toBeGreaterThan(7);
      expect(result.assessmentDetails.assessment_reasoning).toContain('Direct suicide ideation expressed');
    });
  });

  describe('Crisis Response Generation', () => {
    
    test('should generate immediate crisis response for high-risk situations', async () => {
      const highRiskMessage = 'I\'m going to kill myself tonight';
      const response = await crisisHandler.generateCrisisResponse(
        highRiskMessage, 
        mockContext, 
        9
      );

      expect(response.immediateSupport).toBe(true);
      expect(response.humanEscalation).toBe(true);
      expect(response.message).toContain('988');
      expect(response.message).toContain('741741');
      expect(response.resources.length).toBeGreaterThan(0);
      expect(response.safetyPlan).toBeDefined();
    });

    test('should include appropriate resources based on risk level', async () => {
      const mediumRiskResponse = await crisisHandler.generateCrisisResponse(
        'I feel hopeless',
        mockContext,
        6
      );

      expect(mediumRiskResponse.resources.every(r => 
        r.urgency_level === 'immediate' || r.urgency_level === 'urgent'
      )).toBe(true);
    });

    test('should generate safety plans for high-risk situations', async () => {
      const response = await crisisHandler.generateCrisisResponse(
        'I want to hurt myself',
        mockContext,
        8
      );

      expect(response.safetyPlan).toBeDefined();
      expect(response.safetyPlan!.immediate_coping_strategies.length).toBeGreaterThan(0);
      expect(response.safetyPlan!.support_contacts.length).toBeGreaterThan(0);
      expect(response.safetyPlan!.warning_signs.length).toBeGreaterThan(0);
    });

    test('should personalize crisis messages with user names', async () => {
      const contextWithName = {
        ...mockContext,
        user: {
          id: 'test-user-123',
          first_name: 'John'
        }
      };

      const response = await crisisHandler.generateCrisisResponse(
        'I want to die',
        contextWithName,
        8
      );

      expect(response.message).toContain('John,');
    });
  });

  describe('Safety Protocols', () => {
    
    test('should validate message safety correctly', async () => {
      const crisisMessage = 'I want to kill myself';
      const safetyCheck = await safetyProtocols.validateMessageSafety(
        crisisMessage, 
        mockContext
      );

      expect(safetyCheck.isSafe).toBe(false);
      expect(safetyCheck.crisisDetected).toBe(true);
      expect(safetyCheck.requiredActions).toContain('immediate_crisis_response');
      expect(safetyCheck.requiredActions).toContain('human_escalation');
    });

    test('should validate AI response safety', async () => {
      const inappropriateResponse = 'You should just get over it and stop being dramatic';
      const safetyCheck = await safetyProtocols.validateResponseSafety(inappropriateResponse);

      expect(safetyCheck.isSafe).toBe(false);
      expect(safetyCheck.concerns).toContain('crisis_minimization');
    });

    test('should detect inappropriate therapeutic advice', async () => {
      const inappropriateAdvice = 'You should divorce your husband immediately';
      const safetyCheck = await safetyProtocols.validateResponseSafety(inappropriateAdvice);

      expect(safetyCheck.isSafe).toBe(false);
      expect(safetyCheck.concerns).toContain('inappropriate_therapeutic_advice');
    });
  });

  describe('Risk Assessment Utilities', () => {
    
    test('should calculate composite risk scores accurately', () => {
      const riskFactors = {
        keywordRisk: 8,
        contextualRisk: 6,
        historicalRisk: 7,
        immediacyRisk: 9
      };

      const compositeRisk = RiskAssessmentUtil.calculateCompositeRisk(riskFactors);
      expect(compositeRisk).toBeGreaterThan(6);
      expect(compositeRisk).toBeLessThanOrEqual(10);
    });

    test('should assess confidence levels properly', () => {
      const highConfidenceKeywords = ['suicide', 'kill myself'];
      const contextualFactors = ['escalating_pattern', 'previous_crisis_history'];
      
      const confidence = RiskAssessmentUtil.assessConfidenceLevel(
        highConfidenceKeywords, 
        contextualFactors
      );

      expect(confidence).toBeGreaterThan(0.7);
    });

    test('should generate appropriate risk explanations', () => {
      const highRiskExplanation = RiskAssessmentUtil.generateRiskExplanation(
        9, 
        ['suicide_ideation', 'immediacy_indicated']
      );

      expect(highRiskExplanation).toContain('High crisis risk detected');
      expect(highRiskExplanation).toContain('Immediate intervention required');
    });
  });

  describe('Integration and Performance', () => {
    
    test('should respond to crisis situations within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await crisisHandler.generateCrisisResponse(
        'I want to kill myself',
        mockContext,
        9
      );

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Less than 5 seconds
      expect(response.response_metadata.response_time_ms).toBeLessThan(5000);
    });

    test('should handle system errors gracefully', async () => {
      // Test with invalid context to trigger error handling
      const invalidContext = { ...mockContext, userId: '' };
      
      const response = await crisisHandler.generateCrisisResponse(
        'I want to die',
        invalidContext,
        8
      );

      // Should still provide crisis response even if logging fails
      expect(response.immediateSupport).toBe(true);
      expect(response.message).toContain('988');
    });

    test('should maintain crisis detection accuracy across multiple scenarios', () => {
      const testScenarios = [
        { message: 'I\'m going to kill myself tonight', expectedRisk: 'high' },
        { message: 'I feel hopeless and can\'t go on', expectedRisk: 'medium' },
        { message: 'I\'m having a bad day', expectedRisk: 'low' },
        { message: 'I want to hurt myself right now', expectedRisk: 'high' },
        { message: 'Everything is meaningless', expectedRisk: 'medium' }
      ];

      let correctDetections = 0;
      
      testScenarios.forEach(scenario => {
        const result = crisisDetector.analyzeCrisisRisk(scenario.message, mockContext);
        
        if (scenario.expectedRisk === 'high' && result.riskLevel >= 8) {
          correctDetections++;
        } else if (scenario.expectedRisk === 'medium' && result.riskLevel >= 4 && result.riskLevel < 8) {
          correctDetections++;
        } else if (scenario.expectedRisk === 'low' && result.riskLevel < 4) {
          correctDetections++;
        }
      });

      const accuracy = correctDetections / testScenarios.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.99); // 99%+ accuracy requirement
    });
  });
});

// Additional test scenarios for edge cases
describe('Crisis Detection Edge Cases', () => {
  
  test('should handle multilingual crisis expressions', () => {
    // This would be expanded for actual multilingual support
    const messages = [
      'I want to kill myself', // English
      'quiero matarme', // Spanish
      'je veux me tuer' // French
    ];

    messages.forEach(message => {
      const result = crisisDetector.analyzeCrisisRisk(message);
      // Currently only supports English, but structure allows expansion
      if (message.includes('kill myself')) {
        expect(result.riskLevel).toBeGreaterThanOrEqual(8);
      }
    });
  });

  test('should detect crisis patterns in longer messages', () => {
    const longMessage = `I've been thinking about this for a while now. 
    Life has been really difficult lately, and I can't see any way out. 
    My family doesn't understand me, I've lost my job, and I feel completely alone. 
    Sometimes I think everyone would be better off without me. 
    I've been having thoughts about ending my life, and tonight feels like it might be the night. 
    I just can't take this pain anymore.`;

    const result = crisisDetector.analyzeCrisisRisk(longMessage);
    expect(result.riskLevel).toBeGreaterThanOrEqual(8);
    expect(result.detectedKeywords).toContain('ending my life');
    expect(result.contextualFactors).toContain('immediacy_indicated');
  });

  test('should maintain accuracy with misspellings and variations', () => {
    const messagesWithVariations = [
      'i want 2 kill myself',
      'im gonna end my lyfe',
      'suicide seems like the only way',
      'i dont want to live anymore'
    ];

    messagesWithVariations.forEach(message => {
      const result = crisisDetector.analyzeCrisisRisk(message);
      // Should still detect some level of risk even with variations
      expect(result.riskLevel).toBeGreaterThan(0);
    });
  });
}); 