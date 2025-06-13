export class RiskAssessmentUtil {
  
  static calculateCompositeRisk(factors: {
    keywordRisk: number;
    contextualRisk: number;
    historicalRisk: number;
    immediacyRisk: number;
  }): number {
    // Weighted risk calculation
    const weights = {
      keyword: 0.4,      // 40% - Direct crisis language
      contextual: 0.25,  // 25% - Conversation context
      historical: 0.2,   // 20% - User history
      immediacy: 0.15    // 15% - Time-based urgency
    };
    
    return Math.min(
      (factors.keywordRisk * weights.keyword) +
      (factors.contextualRisk * weights.contextual) +
      (factors.historicalRisk * weights.historical) +
      (factors.immediacyRisk * weights.immediacy),
      10
    );
  }

  static assessConfidenceLevel(detectedKeywords: string[], contextualFactors: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more specific keywords
    const highSpecificityKeywords = ['suicide', 'kill myself', 'end my life'];
    const specificMatches = detectedKeywords.filter(keyword => 
      highSpecificityKeywords.includes(keyword)
    );
    confidence += specificMatches.length * 0.15;
    
    // Increase confidence with contextual support
    if (contextualFactors.includes('escalating_pattern')) {
      confidence += 0.2;
    }
    if (contextualFactors.includes('previous_crisis_history')) {
      confidence += 0.15;
    }
    
    // Decrease confidence for possible false positives
    if (contextualFactors.includes('possible_false_positive')) {
      confidence -= 0.3;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  static generateRiskExplanation(riskLevel: number, factors: string[]): string {
    if (riskLevel >= 8) {
      return `High crisis risk detected (${riskLevel}/10). Immediate intervention required. Key factors: ${factors.join(', ')}.`;
    }
    if (riskLevel >= 6) {
      return `Moderate crisis risk detected (${riskLevel}/10). Enhanced support recommended. Factors: ${factors.join(', ')}.`;
    }
    if (riskLevel >= 4) {
      return `Elevated concern level (${riskLevel}/10). Emotional support and monitoring recommended. Factors: ${factors.join(', ')}.`;
    }
    return `Low risk level (${riskLevel}/10). Standard therapeutic support appropriate.`;
  }
} 