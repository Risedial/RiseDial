# Prompt 4: Implement Crisis Detection & Safety System

## Context
You are building Risedial's critical safety system that must detect crisis situations with 99%+ accuracy and provide immediate, appropriate responses. This system protects users in mental health emergencies while maintaining therapeutic support.

## Required Reading
First, read these files to understand crisis detection requirements:
- `docs/testing/comprehensive-testing-framework.md` - Crisis test scenarios and accuracy requirements
- `docs/setup/supabase-setup.md` - Crisis events table structure
- `Context/project_blueprint.md` - Legal constraints and safety requirements
- `src/types/crisis.ts` - Crisis detection types (if created)

## Task
Create a comprehensive crisis detection system that identifies risk levels, triggers appropriate responses, escalates to humans when needed, and logs all events for safety tracking.

## Exact Expected Outputs

### 1. Main Crisis Detector - src/lib/crisis-detection.ts
Create the core crisis detection system:

```typescript
import { CrisisDetectionResult, CrisisKeywords, RiskAssessment } from '@/types/crisis';
import { MessageContext } from '@/types/conversation';
import { db } from './database';

export class CrisisDetector {
  private crisisKeywords: CrisisKeywords;
  private contextualModifiers: string[];
  
  constructor() {
    this.crisisKeywords = {
      high_risk: [
        // Suicide ideation
        'kill myself', 'end my life', 'suicide', 'kill me', 'better off dead',
        'want to die', 'end it all', 'take my own life', 'don\'t want to live',
        'planning to die', 'going to kill myself', 'ready to die',
        
        // Self-harm
        'hurt myself', 'cut myself', 'harm myself', 'injure myself',
        'self harm', 'cutting', 'burning myself', 'poisoning myself',
        
        // Immediate danger
        'going to overdose', 'taking pills', 'have a plan', 'tonight',
        'right now', 'about to', 'final goodbye', 'last time'
      ],
      medium_risk: [
        // Hopelessness
        'hopeless', 'no point', 'give up', 'can\'t go on', 'no way out',
        'nothing matters', 'no future', 'trapped', 'stuck forever',
        'pointless', 'meaningless', 'waste of space', 'burden',
        
        // Emotional crisis
        'breaking down', 'falling apart', 'losing it', 'can\'t cope',
        'overwhelming', 'too much', 'can\'t handle', 'drowning',
        'suffocating', 'empty inside', 'numb', 'dead inside',
        
        // Isolation
        'alone', 'nobody cares', 'no one understands', 'isolated',
        'abandoned', 'rejected', 'unwanted', 'worthless'
      ],
      contextual_modifiers: [
        // Amplifies risk
        'tonight', 'today', 'right now', 'soon', 'planning', 'decided',
        'final', 'last', 'goodbye', 'enough', 'done', 'over',
        
        // May reduce risk (but still concerning)
        'sometimes', 'maybe', 'thinking about', 'wondering',
        'what if', 'imagine', 'feel like', 'wish'
      ],
      false_positives: [
        'kill time', 'dead tired', 'dying to know', 'hurt feelings',
        'cut corners', 'cut off', 'break down the problem',
        'fall apart (object)', 'lost my mind (confusion)'
      ]
    };
    
    this.contextualModifiers = [
      'recently lost', 'anniversary', 'birthday', 'holiday',
      'drinking', 'using drugs', 'medication', 'therapy',
      'hospitalized', 'discharged', 'crisis before'
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

    // Step 1: Check for high-risk keywords
    const highRiskMatches = this.crisisKeywords.high_risk.filter(keyword => 
      message.includes(keyword.toLowerCase())
    );
    
    if (highRiskMatches.length > 0) {
      riskLevel += highRiskMatches.length * 3; // Each high-risk word adds 3 points
      detectedKeywords.push(...highRiskMatches);
      confidence += 0.3;
    }

    // Step 2: Check for medium-risk keywords
    const mediumRiskMatches = this.crisisKeywords.medium_risk.filter(keyword => 
      message.includes(keyword.toLowerCase())
    );
    
    if (mediumRiskMatches.length > 0) {
      riskLevel += mediumRiskMatches.length * 1.5; // Each medium-risk word adds 1.5 points
      detectedKeywords.push(...mediumRiskMatches);
      confidence += 0.15;
    }

    // Step 3: Apply contextual modifiers
    const modifierMatches = this.crisisKeywords.contextual_modifiers.filter(modifier => 
      message.includes(modifier.toLowerCase())
    );
    
    if (modifierMatches.length > 0) {
      const immediacyModifiers = ['tonight', 'today', 'right now', 'soon', 'planning', 'decided'];
      const hasImmediacy = modifierMatches.some(modifier => 
        immediacyModifiers.includes(modifier)
      );
      
      if (hasImmediacy) {
        riskLevel *= 1.5; // Increase risk by 50% for immediacy
        contextualFactors.push('immediacy_indicated');
        confidence += 0.2;
      }
    }

    // Step 4: Check for false positives
    const falsePositiveMatches = this.crisisKeywords.false_positives.filter(fp => 
      message.includes(fp.toLowerCase())
    );
    
    if (falsePositiveMatches.length > 0) {
      riskLevel *= 0.3; // Reduce risk significantly for false positives
      contextualFactors.push('possible_false_positive');
      confidence -= 0.2;
    }

    // Step 5: Consider conversation context
    if (context) {
      const contextAnalysis = this.analyzeConversationContext(context, message);
      riskLevel += contextAnalysis.risk_adjustment;
      contextualFactors.push(...contextAnalysis.factors);
      confidence += contextAnalysis.confidence_adjustment;
    }

    // Step 6: Normalize risk level (0-10 scale)
    riskLevel = Math.min(Math.max(riskLevel, 0), 10);
    confidence = Math.min(Math.max(confidence, 0), 1);

    // Step 7: Generate detailed risk assessment
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

  private analyzeConversationContext(context: MessageContext, currentMessage: string): any {
    let riskAdjustment = 0;
    const factors: string[] = [];
    let confidenceAdjustment = 0;

    // Check recent message history for escalating patterns
    const recentMessages = context.messageHistory.slice(-5);
    
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
      
      // Low support system
      if (profile.support_system_strength <= 3) {
        riskAdjustment += 0.5;
        factors.push('weak_support_system');
      }
      
      // Previous crisis events
      if (profile.crisis_risk_level >= 5) {
        riskAdjustment += 1;
        factors.push('previous_crisis_history');
        confidenceAdjustment += 0.15;
      }
    }

    // Look for substance use mentions
    const substanceKeywords = ['drinking', 'drunk', 'high', 'pills', 'drugs', 'alcohol'];
    if (substanceKeywords.some(keyword => currentMessage.includes(keyword))) {
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
    if (messages.length < 3) return false;
    
    const emotionalIntensity = messages.map(msg => {
      const intensityKeywords = ['overwhelming', 'intense', 'extreme', 'unbearable', 'too much'];
      return intensityKeywords.filter(keyword => 
        msg.message?.toLowerCase().includes(keyword)
      ).length;
    });
    
    // Check if emotional intensity is increasing over recent messages
    for (let i = 1; i < emotionalIntensity.length; i++) {
      if (emotionalIntensity[i] <= emotionalIntensity[i-1]) {
        return false;
      }
    }
    
    return emotionalIntensity[emotionalIntensity.length - 1] > 0;
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
}

export const crisisDetector = new CrisisDetector();
```

### 2. Crisis Response Handler - src/lib/crisis-handler.ts
Create the crisis response and escalation system:

```typescript
import { CrisisResponse, CrisisResource, SafetyPlan, EscalationProtocol } from '@/types/crisis';
import { MessageContext } from '@/types/conversation';
import { db } from './database';
import { config } from './config';

export class CrisisHandler {
  private crisisResources: CrisisResource[];
  private escalationProtocol: EscalationProtocol;

  constructor() {
    this.crisisResources = [
      {
        type: 'hotline',
        name: 'National Suicide Prevention Lifeline',
        contact: '988',
        description: '24/7 crisis support and suicide prevention',
        availability: '24/7',
        urgency_level: 'immediate'
      },
      {
        type: 'text_line',
        name: 'Crisis Text Line',
        contact: 'Text HOME to 741741',
        description: 'Free 24/7 crisis support via text',
        availability: '24/7',
        urgency_level: 'immediate'
      },
      {
        type: 'emergency',
        name: 'Emergency Services',
        contact: '911',
        description: 'Immediate emergency response',
        availability: '24/7',
        urgency_level: 'immediate'
      },
      {
        type: 'online',
        name: 'National Suicide Prevention Website',
        contact: 'https://suicidepreventionlifeline.org',
        description: 'Online resources and chat support',
        availability: '24/7',
        urgency_level: 'supportive'
      },
      {
        type: 'professional',
        name: 'Psychology Today Therapist Finder',
        contact: 'https://psychologytoday.com/therapists',
        description: 'Find mental health professionals in your area',
        availability: 'Business hours',
        urgency_level: 'supportive'
      }
    ];

    this.escalationProtocol = {
      trigger_conditions: [
        'risk_level >= 8',
        'suicide_ideation_with_plan',
        'immediate_self_harm_threat',
        'substance_abuse_in_crisis'
      ],
      notification_targets: [
        'human_moderator',
        'crisis_specialist',
        'system_administrator'
      ],
      response_timeline: 'immediate (< 5 minutes)',
      documentation_required: [
        'crisis_event_log',
        'user_conversation_context',
        'recommended_actions',
        'escalation_reason'
      ],
      follow_up_procedures: [
        'check_user_response_within_1_hour',
        'provide_additional_resources',
        'monitor_for_24_hours',
        'document_resolution'
      ]
    };
  }

  async generateCrisisResponse(
    userMessage: string, 
    context: MessageContext,
    riskLevel: number = 8
  ): Promise<CrisisResponse> {
    const startTime = Date.now();
    
    try {
      // Generate appropriate crisis message
      const crisisMessage = this.generateCrisisMessage(riskLevel, context);
      
      // Select appropriate resources
      const selectedResources = this.selectResources(riskLevel);
      
      // Create safety plan if needed
      const safetyPlan = riskLevel >= 8 ? this.generateSafetyPlan() : undefined;
      
      // Log crisis event
      await this.logCrisisEvent(userMessage, context, riskLevel);
      
      // Escalate if necessary
      const escalationTriggered = await this.checkEscalation(riskLevel, context);
      
      return {
        immediateSupport: true,
        message: crisisMessage,
        resources: selectedResources,
        followUpRequired: true,
        humanEscalation: escalationTriggered,
        safetyPlan,
        response_metadata: {
          response_time_ms: Date.now() - startTime,
          escalation_triggered: escalationTriggered,
          resources_count: selectedResources.length
        }
      };
      
    } catch (error) {
      console.error('Crisis response generation failed:', error);
      
      // Fallback response for system errors
      return this.generateFailsafeCrisisResponse();
    }
  }

  private generateCrisisMessage(riskLevel: number, context: MessageContext): string {
    const userName = context.userProfile?.first_name || '';
    const personalizedGreeting = userName ? `${userName}, ` : '';

    if (riskLevel >= 9) {
      return `${personalizedGreeting}I'm deeply concerned about what you're sharing with me. Your life has value and meaning, even when it doesn't feel that way right now. 

🚨 **Please reach out for immediate help:**
• Call 988 (Suicide & Crisis Lifeline) - they have trained counselors available 24/7
• Text HOME to 741741 for Crisis Text Line
• If you're in immediate danger, please call 911

You don't have to face this alone. There are people who want to help you through this crisis. Please stay safe and reach out to one of these resources right now.

I'm here with you, but professional crisis support can provide the immediate help you need. You matter, and your life is worth saving.`;
    }
    
    if (riskLevel >= 7) {
      return `${personalizedGreeting}I can hear how much pain you're in right now, and I'm really concerned about your safety. These feelings are overwhelming, but they can change with the right support.

💙 **Important resources for you:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Both are free, confidential, and available 24/7

Please consider reaching out to one of these resources. They have trained counselors who understand exactly what you're going through and can provide immediate support.

You're not alone in this, even when it feels that way. Crisis situations can improve with proper help and support.`;
    }
    
    if (riskLevel >= 5) {
      return `${personalizedGreeting}I can see you're going through something really difficult right now. When we're in this much emotional pain, it's important to have extra support.

🤗 **Support options:**
• Crisis Text Line: Text HOME to 741741
• National Suicide Prevention Lifeline: 988
• Both offer free, confidential support 24/7

Consider reaching out if you need someone to talk to beyond our conversation. Sometimes having a trained crisis counselor can provide additional perspective and coping strategies.

I'm here to support you, and so are these resources. You don't have to handle this alone.`;
    }

    return `${personalizedGreeting}I can hear that you're struggling right now. Thank you for sharing what's going on with me. When things feel overwhelming, it's okay to ask for help.

If you ever need additional support beyond our conversations, resources like Crisis Text Line (text HOME to 741741) are always available.

Let's talk about what you're experiencing and see how I can best support you right now.`;
  }

  private selectResources(riskLevel: number): CrisisResource[] {
    if (riskLevel >= 8) {
      return this.crisisResources.filter(resource => 
        resource.urgency_level === 'immediate'
      );
    }
    
    if (riskLevel >= 6) {
      return this.crisisResources.filter(resource => 
        resource.urgency_level === 'immediate' || resource.urgency_level === 'urgent'
      );
    }
    
    return this.crisisResources.filter(resource => 
      resource.urgency_level === 'supportive'
    );
  }

  private generateSafetyPlan(): SafetyPlan {
    return {
      immediate_coping_strategies: [
        'Take slow, deep breaths for 2-3 minutes',
        'Call or text a crisis helpline (988 or text HOME to 741741)',
        'Go to a safe space with other people',
        'Remove any means of self-harm from your immediate area',
        'Use grounding techniques (5-4-3-2-1: 5 things you see, 4 you hear, etc.)'
      ],
      support_contacts: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency Services: 911',
        'Trusted friend or family member',
        'Mental health professional'
      ],
      professional_contacts: [
        'Local emergency room',
        'Mental health crisis center',
        'Your therapist or counselor',
        'Your doctor',
        'Mobile crisis team'
      ],
      warning_signs: [
        'Thoughts of suicide or self-harm',
        'Feeling completely hopeless',
        'Substance use to cope',
        'Extreme mood changes',
        'Isolation from others',
        'Giving away possessions'
      ],
      environment_safety: [
        'Remove or secure potentially harmful items',
        'Stay with trusted people when possible',
        'Avoid alcohol and drugs',
        'Keep emergency numbers easily accessible',
        'Have a plan for getting to safety if needed'
      ],
      follow_up_timeline: 'Within 24 hours, contact a mental health professional or crisis center for ongoing support'
    };
  }

  private async logCrisisEvent(
    userMessage: string, 
    context: MessageContext, 
    riskLevel: number
  ): Promise<void> {
    try {
      await db.createCrisisEvent({
        user_id: context.userId,
        severity_level: riskLevel,
        crisis_type: this.determineCrisisType(userMessage),
        trigger_keywords: this.extractTriggerKeywords(userMessage),
        context_summary: this.generateContextSummary(context),
        response_given: 'Crisis resources and support provided',
        resources_provided: this.selectResources(riskLevel).map(r => r.name),
        human_notified: riskLevel >= 8,
        follow_up_required: true,
        resolved: false
      });
    } catch (error) {
      console.error('Failed to log crisis event:', error);
      // Don't throw - crisis response must continue even if logging fails
    }
  }

  private async checkEscalation(riskLevel: number, context: MessageContext): Promise<boolean> {
    if (riskLevel >= 8) {
      try {
        await this.escalateToHuman(context, riskLevel);
        return true;
      } catch (error) {
        console.error('Human escalation failed:', error);
        // Continue with automated response even if escalation fails
      }
    }
    return false;
  }

  async escalateToHuman(context: MessageContext, riskLevel: number): Promise<void> {
    // In a real implementation, this would notify human moderators
    // For now, we'll log the escalation need
    
    const escalationData = {
      user_id: context.userId,
      crisis_level: riskLevel,
      escalation_time: new Date().toISOString(),
      escalation_reason: 'High crisis risk detected',
      immediate_action_required: true,
      context_summary: this.generateContextSummary(context)
    };

    console.log('CRISIS ESCALATION REQUIRED:', escalationData);
    
    // TODO: Implement actual notification system
    // - Send alerts to crisis team
    // - Create urgent support ticket
    // - Notify system administrators
    // - Log in crisis escalation tracking system
  }

  private determineCrisisType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('suicide') || lowerMessage.includes('kill myself')) {
      return 'suicide';
    }
    if (lowerMessage.includes('hurt myself') || lowerMessage.includes('cut myself')) {
      return 'self_harm';
    }
    if (lowerMessage.includes('abuse') || lowerMessage.includes('violence')) {
      return 'abuse';
    }
    if (lowerMessage.includes('overdose') || lowerMessage.includes('pills')) {
      return 'substance';
    }
    
    return 'emotional_crisis';
  }

  private extractTriggerKeywords(message: string): string[] {
    const crisisKeywords = [
      'kill myself', 'suicide', 'end my life', 'hurt myself', 'cut myself',
      'overdose', 'hopeless', 'no point', 'can\'t go on', 'want to die'
    ];
    
    return crisisKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private generateContextSummary(context: MessageContext): string {
    const recentMessages = context.messageHistory.slice(-3);
    const messageTexts = recentMessages.map(m => m.message).join(' | ');
    
    return `Recent conversation: ${messageTexts}. User profile: stress_level=${context.userProfile?.stress_level}, support_system=${context.userProfile?.support_system_strength}`;
  }

  private generateFailsafeCrisisResponse(): CrisisResponse {
    return {
      immediateSupport: true,
      message: `I'm concerned about your safety. Please reach out for immediate help:

🚨 **Crisis Support:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911

You don't have to face this alone. Professional crisis counselors are available 24/7 to help.`,
      resources: this.crisisResources.filter(r => r.urgency_level === 'immediate'),
      followUpRequired: true,
      humanEscalation: true,
      response_metadata: {
        response_time_ms: 100,
        escalation_triggered: true,
        resources_count: 3
      }
    };
  }
}

export const crisisHandler = new CrisisHandler();
```

### 3. Safety Protocols - src/lib/safety-protocols.ts
Create comprehensive safety validation and monitoring:

```typescript
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
```

### 4. Risk Assessment Utility - src/utils/risk-assessment.ts
Create risk scoring and analysis utilities:

```typescript
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
```

## Validation Requirements
After creating all files:
1. Test crisis detection with high-risk sample messages
2. Verify 99%+ accuracy on known crisis scenarios
3. Test escalation procedures and logging
4. Validate resource provision and safety planning
5. Ensure proper integration with AI orchestrator
6. Test false positive handling

## Success Criteria
- [ ] Crisis detection achieves 99%+ accuracy on test scenarios
- [ ] High-risk situations trigger immediate appropriate responses
- [ ] Crisis events are properly logged and tracked
- [ ] Human escalation procedures function correctly
- [ ] Safety protocols prevent harmful AI responses  
- [ ] Resource provision is comprehensive and accessible
- [ ] System maintains therapeutic support while ensuring safety 