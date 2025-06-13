import { DbCrisisEvent } from './database';

export interface CrisisEvent extends DbCrisisEvent {
  user?: {
    id: string;
    first_name: string;
    psychological_profile?: any;
  };
}

export interface CrisisDetectionResult {
  riskLevel: number; // 0-10 scale
  requiresIntervention: boolean;
  detectedKeywords: string[];
  contextualFactors: string[];
  confidence: number;
  immediateActions: string[];
  escalationRequired: boolean;
  assessmentDetails: RiskAssessment;
}

export interface RiskAssessment {
  suicide_risk: number;
  self_harm_risk: number;
  substance_abuse_risk: number;
  abuse_situation_risk: number;
  medical_emergency_risk: number;
  emotional_crisis_risk: number;
  assessment_reasoning: string[];
}

export interface CrisisResponse {
  immediateSupport: boolean;
  message: string;
  resources: CrisisResource[];
  followUpRequired: boolean;
  humanEscalation: boolean;
  safetyPlan?: SafetyPlan;
  response_metadata: {
    response_time_ms: number;
    escalation_triggered: boolean;
    resources_count: number;
  };
}

export interface CrisisResource {
  type: 'hotline' | 'text_line' | 'emergency' | 'professional' | 'online';
  name: string;
  contact: string;
  description: string;
  availability: string;
  urgency_level: 'immediate' | 'urgent' | 'supportive';
}

export interface SafetyPlan {
  immediate_coping_strategies: string[];
  support_contacts: string[];
  professional_contacts: string[];
  warning_signs: string[];
  environment_safety: string[];
  follow_up_timeline: string;
}

export interface CrisisKeywords {
  high_risk: string[];
  medium_risk: string[];
  contextual_modifiers: string[];
  false_positives: string[];
}

export interface EscalationProtocol {
  trigger_conditions: string[];
  notification_targets: string[];
  response_timeline: string;
  documentation_required: string[];
  follow_up_procedures: string[];
} 