import { MessageContext } from '@/types/conversation';
import { crisisDetector } from './crisis-detection';
import { crisisHandler } from './crisis-handler';

export class SafetyProtocols {
  
  async validateMessageSafety(userMessage: string, context: MessageContext): Promise<{
    isSafe: boolean;
    crisisDetected: boolean;
    riskLevel: number;
    requiredActions: string[];
  }> {
    // Run crisis detection
    const crisisAnalysis = crisisDetector.analyzeCrisisRisk(userMessage, context);
    
    // Determine if message is safe to process normally
    const isSafe = crisisAnalysis.riskLevel < 8;
    const crisisDetected = crisisAnalysis.riskLevel >= 6;
    
    const requiredActions: string[] = [];
    
    if (crisisAnalysis.riskLevel >= 8) {
      requiredActions.push('immediate_crisis_response');
      requiredActions.push('human_escalation');
      requiredActions.push('safety_planning');
    } else if (crisisAnalysis.riskLevel >= 6) {
      requiredActions.push('enhanced_support');
      requiredActions.push('resource_provision');
      requiredActions.push('close_monitoring');
    } else if (crisisAnalysis.riskLevel >= 4) {
      requiredActions.push('emotional_support');
      requiredActions.push('check_in_required');
    }
    
    return {
      isSafe,
      crisisDetected,
      riskLevel: crisisAnalysis.riskLevel,
      requiredActions
    };
  }

  async validateResponseSafety(aiResponse: string): Promise<{
    isSafe: boolean;
    concerns: string[];
    recommendations: string[];
  }> {
    const concerns: string[] = [];
    const recommendations: string[] = [];
    
    // Check for inappropriate therapeutic advice
    if (this.containsInappropriateAdvice(aiResponse)) {
      concerns.push('inappropriate_therapeutic_advice');
      recommendations.push('review_therapeutic_boundaries');
    }
    
    // Check for crisis minimization
    if (this.minimizesCrisis(aiResponse)) {
      concerns.push('crisis_minimization');
      recommendations.push('enhance_crisis_acknowledgment');
    }
    
    // Check for harmful suggestions
    if (this.containsHarmfulSuggestions(aiResponse)) {
      concerns.push('potentially_harmful_suggestions');
      recommendations.push('remove_harmful_content');
    }
    
    return {
      isSafe: concerns.length === 0,
      concerns,
      recommendations
    };
  }

  async enforceUserLimits(userId: string, messageCount: number): Promise<{
    allowMessage: boolean;
    reason?: string;
    upgradePrompt?: boolean;
  }> {
    // This would check subscription limits, daily usage, etc.
    // Implementation depends on user management system
    
    return {
      allowMessage: true // Placeholder
    };
  }

  private containsInappropriateAdvice(response: string): boolean {
    const inappropriatePatterns = [
      /you should (leave|divorce|quit)/i,
      /the best thing to do is/i,
      /you must (do|stop|start)/i,
      /I recommend you (take|stop) medication/i,
      /you should see a (specific doctor|specific therapist)/i
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(response));
  }

  private minimizesCrisis(response: string): boolean {
    const minimizationPatterns = [
      /it's not that bad/i,
      /you're overreacting/i,
      /just think positive/i,
      /others have it worse/i,
      /snap out of it/i,
      /just get over it/i
    ];
    
    return minimizationPatterns.some(pattern => pattern.test(response));
  }

  private containsHarmfulSuggestions(response: string): boolean {
    const harmfulPatterns = [
      /isolation is good/i,
      /alcohol might help/i,
      /medication isn't necessary/i,
      /therapy doesn't work/i,
      /you don't need professional help/i
    ];
    
    return harmfulPatterns.some(pattern => pattern.test(response));
  }
}

export const safetyProtocols = new SafetyProtocols(); 