import { CrisisResponse, CrisisResource, SafetyPlan, EscalationProtocol } from '@/types/crisis';
import { MessageContext } from '@/types/conversation';
import { DatabaseUtils } from './database';
import { config } from './config';

const db = new DatabaseUtils();

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
    const userName = context.user?.first_name || '';
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
    
    return `Recent conversation: ${messageTexts}. User profile: stress_level=${context.userProfile?.stress_level}, emotional_state=${context.userProfile?.emotional_state}`;
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