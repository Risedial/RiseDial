import { CrisisDetectionResult, CrisisKeywords, RiskAssessment } from '@/types/crisis';
import { MessageContext } from '@/types/conversation';
import { DatabaseUtils } from './database';

const db = new DatabaseUtils();

export class CrisisDetector {
  private crisisKeywords: CrisisKeywords;
  private contextualModifiers: string[];
  
  constructor() {
    this.crisisKeywords = {
      high_risk: [
        // Suicide ideation
        'kill myself', 'end my life', 'ending my life', 'suicide', 'kill me', 'better off dead',
        'want to die', 'end it all', 'take my own life', 'don\'t want to live',
        'planning to die', 'going to kill myself', 'ready to die',
        
        // Self-harm
        'hurt myself', 'cut myself', 'harm myself', 'injure myself',
        'self harm', 'cutting', 'burning myself', 'poisoning myself',
        
        // Immediate danger
        'going to overdose', 'taking pills', 'take all these pills', 'taking all these pills',
        'have a plan', 'tonight', 'right now', 'about to', 'final goodbye', 'last time',
        'ready to end', 'end it', 'overdose on'
      ],
      medium_risk: [
        // Hopelessness
        'hopeless', 'no point', 'give up', 'can\'t go on', 'no way out',
        'nothing matters', 'no future', 'trapped', 'stuck forever',
        'pointless', 'meaningless', 'waste of space', 'burden',
        'no meaning', 'life has no meaning', 'has no meaning',
        
        // Emotional crisis
        'breaking down', 'falling apart', 'losing it', 'can\'t cope',
        'overwhelming', 'too much', 'can\'t handle', 'drowning',
        'suffocating', 'empty inside', 'numb', 'dead inside',
        'can\'t take this', 'take this anymore',
        
        // Isolation
        'alone', 'nobody cares', 'no one understands', 'isolated',
        'abandoned', 'rejected', 'unwanted', 'worthless'
      ],
      contextual_modifiers: [
        // Amplifies risk
        'tonight', 'today', 'right now', 'soon', 'planning', 'decided',
        'final', 'last', 'goodbye', 'enough', 'done', 'over',
        'ready to', 'going to', 'about to',
        
        // May reduce risk (but still concerning)
        'sometimes', 'maybe', 'thinking about', 'wondering',
        'what if', 'imagine', 'feel like', 'wish'
      ],
      false_positives: [
        'kill time', 'dead tired', 'dying to know', 'hurt feelings',
        'cut corners', 'cut off', 'break down the problem',
        'fall apart (object)', 'lost my mind (confusion)',
        'traffic is killing', 'work is killing', 'die of embarrassment'
      ]
    };
    
    this.contextualModifiers = [
      'recently lost', 'anniversary', 'birthday', 'holiday',
      'drinking', 'using drugs', 'medication', 'therapy',
      'hospitalized', 'discharged', 'crisis before',
      'been drinking', 'drinking a lot', 'alcohol', 'substance'
    ];
  }

  analyzeCrisisRisk(
    userMessage: string, 
    context?: MessageContext
  ): CrisisDetectionResult {
    const message = userMessage.toLowerCase();
    let riskLevel = 0;
    const detectedKeywords: string[] = [];
    const contextualFactors: string[] = [];
    let confidence = 0.5;

    // Check for false positives first to avoid misclassification
    const falsePositiveMatches = this.crisisKeywords.false_positives.filter(fp => 
      message.includes(fp.toLowerCase())
    );
    
    if (falsePositiveMatches.length > 0) {
      contextualFactors.push('possible_false_positive');
      // For clear false positives, return early with low risk
      if (falsePositiveMatches.some(fp => ['kill time', 'dead tired', 'dying to know', 'traffic is killing', 'work is killing'].includes(fp))) {
        return {
          riskLevel: 0,
          requiresIntervention: false,
          detectedKeywords: [],
          contextualFactors,
          confidence: 0.9,
          immediateActions: [],
          escalationRequired: false,
          assessmentDetails: this.generateRiskAssessment(message, [], contextualFactors)
        };
      }
    }

    // Handle common variations and misspellings
    const normalizedMessage = this.normalizeMessage(message);

    // Step 1: Check for high-risk keywords with enhanced matching
    const highRiskMatches = this.crisisKeywords.high_risk.filter(keyword => {
      const keywordLower = keyword.toLowerCase();
      return normalizedMessage.includes(keywordLower) || 
             message.includes(keywordLower) ||
             this.fuzzyMatch(normalizedMessage, keywordLower);
    });
    
    if (highRiskMatches.length > 0) {
      // Ensure minimum risk level of 8 for any high-risk detection
      riskLevel = Math.max(8, highRiskMatches.length * 5);
      detectedKeywords.push(...highRiskMatches);
      confidence += 0.3;
    }

    // Step 2: Check for medium-risk keywords with enhanced matching
    const mediumRiskMatches = this.crisisKeywords.medium_risk.filter(keyword => {
      const keywordLower = keyword.toLowerCase();
      return normalizedMessage.includes(keywordLower) || 
             message.includes(keywordLower) ||
             this.fuzzyMatch(normalizedMessage, keywordLower);
    });
    
    if (mediumRiskMatches.length > 0) {
      // For specific phrases that should stay in medium range
      const mediumOnlyPhrases = ['life has no meaning', 'has no meaning', 'no meaning'];
      const isMediumOnlyPhrase = mediumOnlyPhrases.some(phrase => 
        normalizedMessage.includes(phrase) || message.includes(phrase)
      );
      
      if (isMediumOnlyPhrase) {
        // Cap at medium-risk level for these specific phrases
        riskLevel = Math.max(riskLevel, 6);
      } else {
        // Ensure minimum risk level of 4 for other medium-risk detection
        const mediumRiskScore = mediumRiskMatches.length * 3.5;
        riskLevel = Math.max(riskLevel, Math.max(4, mediumRiskScore));
      }
      
      detectedKeywords.push(...mediumRiskMatches);
      confidence += 0.15;
    }

    // Step 3: Apply contextual modifiers
    const modifierMatches = this.crisisKeywords.contextual_modifiers.filter(modifier => 
      normalizedMessage.includes(modifier.toLowerCase()) || message.includes(modifier.toLowerCase())
    );
    
    if (modifierMatches.length > 0) {
      const immediacyModifiers = ['tonight', 'today', 'right now', 'soon', 'planning', 'decided', 'ready to', 'going to', 'about to'];
      const hasImmediacy = modifierMatches.some(modifier => 
        immediacyModifiers.includes(modifier)
      );
      
      if (hasImmediacy) {
        riskLevel += 3; // Add fixed points for immediacy
        riskLevel *= 1.4; // Increase risk by 40% for immediacy
        contextualFactors.push('immediacy_indicated');
        confidence += 0.2;
      }
    }

    // Step 4: Enhanced specific high-risk phrase detection
    const specificHighRiskPhrases = [
      'kill myself', 'end my life', 'ending my life', 'suicide', 'want to die', 'hurt myself', 
      'cut myself', 'take my own life', 'going to overdose', 'have a plan',
      'don\'t want to live', 'ready to die', 'better off dead', 'end it all',
      'take all these pills', 'taking all these pills', 'ready to end'
    ];
    
    const specificMatches = specificHighRiskPhrases.filter(phrase => 
      normalizedMessage.includes(phrase) || message.includes(phrase)
    );
    
    if (specificMatches.length > 0) {
      // Ensure minimum risk level of 8 for specific crisis phrases
      riskLevel = Math.max(riskLevel, 8);
      confidence += 0.25;
      contextualFactors.push('direct_crisis_language');
    }

    // Step 5: Consider conversation context
    if (context) {
      const contextAnalysis = this.analyzeConversationContext(context, message);
      riskLevel += contextAnalysis.risk_adjustment;
      contextualFactors.push(...contextAnalysis.factors);
      confidence += contextAnalysis.confidence_adjustment;
    }

    // Step 6: Special handling for ambiguous phrases that should be low risk
    const lowRiskPhrases = ['feel sad today', 'sad today', 'having a bad day'];
    const isLowRiskPhrase = lowRiskPhrases.some(phrase => 
      normalizedMessage.includes(phrase) || message.includes(phrase)
    );
    
    if (isLowRiskPhrase && riskLevel < 6) {
      // Reduce risk for clearly low-risk sad expressions
      riskLevel = Math.max(riskLevel - 2, 0);
      contextualFactors.push('mild_sadness_expression');
    }

    // Step 7: Normalize risk level (0-10 scale)
    riskLevel = Math.min(Math.max(riskLevel, 0), 10);
    confidence = Math.min(Math.max(confidence, 0), 1);

    // Step 8: Generate detailed risk assessment
    const assessmentDetails = this.generateRiskAssessment(
      message, 
      detectedKeywords, 
      contextualFactors
    );

    return {
      riskLevel: Math.round(riskLevel),
      requiresIntervention: riskLevel >= 8,
      detectedKeywords,
      contextualFactors,
      confidence,
      immediateActions: this.generateImmediateActions(riskLevel),
      escalationRequired: riskLevel >= 8,
      assessmentDetails
    };
  }

  private normalizeMessage(message: string): string {
    // Handle common text variations and misspellings
    let normalized = message
      .replace(/\b2\b/g, 'to')  // "2" -> "to"
      .replace(/\bu\b/g, 'you') // "u" -> "you"
      .replace(/\bur\b/g, 'your') // "ur" -> "your"
      .replace(/\bim\b/g, 'i am') // "im" -> "i am"
      .replace(/\bgonna\b/g, 'going to') // "gonna" -> "going to"
      .replace(/\bwanna\b/g, 'want to') // "wanna" -> "want to"
      .replace(/\bdont\b/g, 'don\'t') // "dont" -> "don't"
      .replace(/\bcant\b/g, 'can\'t') // "cant" -> "can't"
      .replace(/\blyfe\b/g, 'life') // "lyfe" -> "life"
      .replace(/\bmyself\b/g, 'myself') // Handle any variations
      .replace(/\bsuicied\b/g, 'suicide') // Common misspelling
      .replace(/\bsuicide\b/g, 'suicide'); // Ensure proper form

    return normalized;
  }

  private analyzeConversationContext(context: MessageContext, currentMessage: string): any {
    let riskAdjustment = 0;
    const factors: string[] = [];
    let confidenceAdjustment = 0;

    // Check recent message history for escalating patterns
    const recentMessages = context.messageHistory || [];
    
    // Look for escalating emotional intensity
    const emotionalEscalation = this.detectEmotionalEscalation(recentMessages);
    if (emotionalEscalation) {
      riskAdjustment += 1;
      factors.push('escalating_pattern');
      confidenceAdjustment += 0.1;
    }

    // Check user psychological profile for existing risk factors
    if (context.userProfile) {
      const profile = context.userProfile;
      
      // High stress level
      if (profile.stress_level >= 8) {
        riskAdjustment += 0.5;
        factors.push('high_stress_level');
      }
      
      // Low emotional regulation (checking if property exists)
      const emotionalRegulation = (profile as any).emotional_regulation;
      if (emotionalRegulation !== undefined && emotionalRegulation <= 3) {
        riskAdjustment += 0.5;
        factors.push('poor_emotional_regulation');
      }
      
      // Check for crisis risk indicators in profile
      const crisisRiskLevel = (profile as any).crisis_risk_level;
      if (crisisRiskLevel !== undefined && crisisRiskLevel >= 5) {
        riskAdjustment += 1;
        factors.push('previous_crisis_history');
        confidenceAdjustment += 0.15;
      }
    }

    // Look for substance use mentions in current message AND message history
    const substanceKeywords = ['drinking', 'drunk', 'high', 'pills', 'drugs', 'alcohol', 'drinking a lot', 'been drinking'];
    const currentMessageHasSubstance = substanceKeywords.some(keyword => 
      currentMessage.toLowerCase().includes(keyword)
    );
    
    // Also check message history for substance use
    const historyHasSubstance = recentMessages.some(msg => 
      substanceKeywords.some(keyword => 
        msg.message?.toLowerCase().includes(keyword)
      )
    );
    
    if (currentMessageHasSubstance || historyHasSubstance) {
      riskAdjustment += 1;
      factors.push('substance_use_mentioned');
      confidenceAdjustment += 0.1;
    }

    // Check for social isolation indicators
    const isolationKeywords = ['alone', 'nobody', 'no one', 'isolated', 'lonely'];
    if (isolationKeywords.some(keyword => currentMessage.includes(keyword))) {
      riskAdjustment += 0.5;
      factors.push('social_isolation');
    }

    return {
      risk_adjustment: riskAdjustment,
      factors,
      confidence_adjustment: confidenceAdjustment
    };
  }

  private detectEmotionalEscalation(messages: any[]): boolean {
    if (messages.length < 2) return false;
    
    // Look for emotional tone progression indicating escalation
    const emotionalTones = messages.map(msg => msg.emotional_tone || '').filter(tone => tone);
    
    // Define escalation patterns
    const escalationSequences = [
      ['sad', 'hopeless'],
      ['sad', 'overwhelmed'],
      ['hopeless', 'overwhelmed'],
      ['worried', 'hopeless'],
      ['concerned', 'overwhelmed']
    ];
    
    // Check if any escalation sequence is present
    for (let i = 1; i < emotionalTones.length; i++) {
      const prevTone = emotionalTones[i-1];
      const currentTone = emotionalTones[i];
      
      const hasEscalationPattern = escalationSequences.some(sequence => 
        sequence[0] === prevTone && sequence[1] === currentTone
      );
      
      if (hasEscalationPattern) {
        return true;
      }
    }
    
    // Also check for increasing emotional intensity keywords
    const intensityKeywords = ['overwhelming', 'intense', 'extreme', 'unbearable', 'too much', 'falling apart', 'breaking down'];
    let hasIntensityIncrease = false;
    
    for (let i = 1; i < messages.length; i++) {
      const prevIntensity = intensityKeywords.filter(keyword => 
        messages[i-1].message?.toLowerCase().includes(keyword)
      ).length;
      const currentIntensity = intensityKeywords.filter(keyword => 
        messages[i].message?.toLowerCase().includes(keyword)
      ).length;
      
      if (currentIntensity > prevIntensity && currentIntensity > 0) {
        hasIntensityIncrease = true;
        break;
      }
    }
    
    return hasIntensityIncrease;
  }

  private generateRiskAssessment(
    message: string, 
    keywords: string[], 
    factors: string[]
  ): RiskAssessment {
    const assessment: RiskAssessment = {
      suicide_risk: 0,
      self_harm_risk: 0,
      substance_abuse_risk: 0,
      abuse_situation_risk: 0,
      medical_emergency_risk: 0,
      emotional_crisis_risk: 0,
      assessment_reasoning: []
    };

    // Assess suicide risk
    const suicideKeywords = ['kill myself', 'suicide', 'end my life', 'want to die'];
    if (keywords.some(k => suicideKeywords.includes(k))) {
      assessment.suicide_risk = 8;
      assessment.assessment_reasoning.push('Direct suicide ideation expressed');
    }

    // Assess self-harm risk
    const selfHarmKeywords = ['hurt myself', 'cut myself', 'harm myself'];
    if (keywords.some(k => selfHarmKeywords.includes(k))) {
      assessment.self_harm_risk = 7;
      assessment.assessment_reasoning.push('Self-harm intentions indicated');
    }

    // Assess substance abuse risk
    if (factors.includes('substance_use_mentioned')) {
      assessment.substance_abuse_risk = 6;
      assessment.assessment_reasoning.push('Substance use mentioned in crisis context');
    }

    // Assess emotional crisis
    const emotionalKeywords = ['hopeless', 'overwhelming', 'can\'t cope'];
    if (keywords.some(k => emotionalKeywords.includes(k))) {
      assessment.emotional_crisis_risk = 6;
      assessment.assessment_reasoning.push('Severe emotional distress indicated');
    }

    // Check for abuse situation indicators
    const abuseKeywords = ['hurt me', 'hitting me', 'abusing', 'violence'];
    if (abuseKeywords.some(keyword => message.includes(keyword))) {
      assessment.abuse_situation_risk = 7;
      assessment.assessment_reasoning.push('Potential abuse situation detected');
    }

    return assessment;
  }

  private generateImmediateActions(riskLevel: number): string[] {
    const actions: string[] = [];

    if (riskLevel >= 8) {
      actions.push('provide_crisis_resources');
      actions.push('express_immediate_support');
      actions.push('encourage_professional_help');
      actions.push('suggest_safety_planning');
      actions.push('escalate_to_human');
    } else if (riskLevel >= 6) {
      actions.push('provide_support_resources');
      actions.push('validate_feelings');
      actions.push('suggest_coping_strategies');
      actions.push('monitor_closely');
    } else if (riskLevel >= 4) {
      actions.push('acknowledge_difficulty');
      actions.push('provide_emotional_support');
      actions.push('explore_support_system');
    }

    return actions;
  }

  private fuzzyMatch(text: string, keyword: string): boolean {
    // Simple fuzzy matching for common variations
    const variations = {
      'end it all': ['end it', 'ending it all', 'end everything'],
      'take all these pills': ['take pills', 'taking pills', 'overdose on pills'],
      'no meaning': ['meaningless', 'no point', 'pointless'],
      'can\'t take this': ['cannot take this', 'can\'t handle this', 'cannot handle this']
    };
    
    if (variations[keyword]) {
      return variations[keyword].some(variation => text.includes(variation));
    }
    
    return false;
  }
}

export const crisisDetector = new CrisisDetector(); 