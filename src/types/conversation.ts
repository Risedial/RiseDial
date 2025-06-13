import { DbConversation } from './database';

export interface Conversation extends DbConversation {
  user?: {
    id: string;
    first_name: string;
    psychological_profile?: any;
  };
}

export interface MessageContext {
  userId: string;
  sessionId?: string;
  messageHistory: ConversationSummary[];
  userProfile?: PsychologicalSnapshot | any;
  sessionData?: any;
  timestamp: string;
  currentState?: EmotionalState;
  user?: {
    id: string;
    first_name?: string;
  };
}

export interface ConversationSummary {
  message: string;
  type: 'user' | 'assistant';
  timestamp: string;
  emotional_tone?: string;
  key_insights?: string[];
  therapeutic_value?: number;
}

export interface PsychologicalSnapshot {
  stress_level: number;
  openness_level: number;
  energy_level: number;
  emotional_state: string;
  readiness_for_change: number;
  resistance_patterns: Record<string, any>;
  preferred_approaches: string[];
}

export interface EmotionalState {
  primary_emotion: string;
  intensity: number;
  secondary_emotions: string[];
  emotional_regulation: number;
  stress_indicators: string[];
}

export interface AIResponse {
  companion_response: string;
  emotional_tone: string;
  confidence_level: number;
  therapeutic_techniques: string[];
  crisis_risk_level: number;
  therapeutic_value: number;
  key_insights: string[];
  agent_analysis: AgentAnalysis;
  response_metadata: ResponseMetadata;
}

export interface AgentAnalysis {
  companion: {
    empathy_score: number;
    validation_provided: boolean;
    rapport_building: string[];
  };
  therapist: {
    techniques_used: string[];
    intervention_type: string;
    effectiveness_prediction: number;
  };
  paradigm: {
    limiting_beliefs_identified: string[];
    reframe_opportunities: string[];
    identity_shifts_suggested: string[];
  };
  memory: {
    patterns_recognized: string[];
    progress_indicators: string[];
    context_connections: string[];
  };
}

export interface ResponseMetadata {
  tokens_used: number;
  cost_usd: number;
  response_time_ms: number;
  model_used: string;
  processing_stages: ProcessingStage[];
}

export interface ProcessingStage {
  stage: 'input_analysis' | 'agent_processing' | 'response_synthesis' | 'safety_check';
  duration_ms: number;
  tokens_used: number;
  status: 'success' | 'warning' | 'error';
} 