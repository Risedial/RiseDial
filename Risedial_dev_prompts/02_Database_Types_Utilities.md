# Prompt 2: Create Database Types and Utilities

## Context
You are building Risedial, an AI therapeutic companion. This prompt creates comprehensive TypeScript types for the Supabase database schema and database utility functions. The system tracks users, conversations, psychological profiles, crisis events, and progress metrics.

## Required Reading
First, read these files to understand the database schema and requirements:
- `docs/setup/supabase-setup.md` - Complete database schema with all tables, functions, and triggers
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Overall architecture and type requirements
- `Context/project_blueprint.md` - Business logic and data requirements

## Task
Create comprehensive TypeScript types matching the Supabase schema and database utility functions for all operations.

## Exact Expected Outputs

### 1. Database Types - src/types/database.ts
Create complete types for all database tables:

```typescript
// Database table interfaces matching Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          username: string | null;
          first_name: string | null;
          subscription_tier: 'basic' | 'premium' | 'unlimited';
          daily_message_count: number;
          last_message_date: string;
          total_messages: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          username?: string | null;
          first_name?: string | null;
          subscription_tier?: 'basic' | 'premium' | 'unlimited';
          daily_message_count?: number;
          last_message_date?: string;
          total_messages?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_id?: number;
          username?: string | null;
          first_name?: string | null;
          subscription_tier?: 'basic' | 'premium' | 'unlimited';
          daily_message_count?: number;
          last_message_date?: string;
          total_messages?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_psychological_profiles: {
        Row: {
          id: string;
          user_id: string;
          core_beliefs: Record<string, any>;
          limiting_beliefs: any[];
          empowering_beliefs: any[];
          resistance_patterns: Record<string, any>;
          communication_style: Record<string, any>;
          emotional_state: string;
          stress_level: number;
          openness_level: number;
          readiness_for_change: number;
          energy_level: number;
          identity_evolution: any[];
          behavioral_changes: any[];
          goal_progression: Record<string, any>;
          breakthrough_moments: any[];
          values_clarity: Record<string, any>;
          technique_effectiveness: Record<string, any>;
          successful_interventions: any[];
          resistance_triggers: any[];
          preferred_approaches: any[];
          crisis_risk_level: number;
          support_system_strength: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          core_beliefs?: Record<string, any>;
          limiting_beliefs?: any[];
          empowering_beliefs?: any[];
          resistance_patterns?: Record<string, any>;
          communication_style?: Record<string, any>;
          emotional_state?: string;
          stress_level?: number;
          openness_level?: number;
          readiness_for_change?: number;
          energy_level?: number;
          identity_evolution?: any[];
          behavioral_changes?: any[];
          goal_progression?: Record<string, any>;
          breakthrough_moments?: any[];
          values_clarity?: Record<string, any>;
          technique_effectiveness?: Record<string, any>;
          successful_interventions?: any[];
          resistance_triggers?: any[];
          preferred_approaches?: any[];
          crisis_risk_level?: number;
          support_system_strength?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          core_beliefs?: Record<string, any>;
          limiting_beliefs?: any[];
          empowering_beliefs?: any[];
          resistance_patterns?: Record<string, any>;
          communication_style?: Record<string, any>;
          emotional_state?: string;
          stress_level?: number;
          openness_level?: number;
          readiness_for_change?: number;
          energy_level?: number;
          identity_evolution?: any[];
          behavioral_changes?: any[];
          goal_progression?: Record<string, any>;
          breakthrough_moments?: any[];
          values_clarity?: Record<string, any>;
          technique_effectiveness?: Record<string, any>;
          successful_interventions?: any[];
          resistance_triggers?: any[];
          preferred_approaches?: any[];
          crisis_risk_level?: number;
          support_system_strength?: number;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          message_text: string;
          message_type: 'user' | 'assistant';
          emotional_tone: string | null;
          confidence_level: number | null;
          crisis_risk_level: number;
          therapeutic_value: number;
          conversation_summary: string | null;
          key_insights: any[];
          agent_analysis: Record<string, any>;
          therapeutic_techniques_used: any[];
          tokens_used: number;
          cost_usd: number;
          embedding: number[] | null;
          session_id: string | null;
          conversation_turn: number;
          response_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message_text: string;
          message_type: 'user' | 'assistant';
          emotional_tone?: string | null;
          confidence_level?: number | null;
          crisis_risk_level?: number;
          therapeutic_value?: number;
          conversation_summary?: string | null;
          key_insights?: any[];
          agent_analysis?: Record<string, any>;
          therapeutic_techniques_used?: any[];
          tokens_used?: number;
          cost_usd?: number;
          embedding?: number[] | null;
          session_id?: string | null;
          conversation_turn?: number;
          response_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message_text?: string;
          message_type?: 'user' | 'assistant';
          emotional_tone?: string | null;
          confidence_level?: number | null;
          crisis_risk_level?: number;
          therapeutic_value?: number;
          conversation_summary?: string | null;
          key_insights?: any[];
          agent_analysis?: Record<string, any>;
          therapeutic_techniques_used?: any[];
          tokens_used?: number;
          cost_usd?: number;
          embedding?: number[] | null;
          session_id?: string | null;
          conversation_turn?: number;
          response_time_ms?: number | null;
          created_at?: string;
        };
      };
      progress_metrics: {
        Row: {
          id: string;
          user_id: string;
          metric_type: string;
          metric_name: string;
          metric_value: number | null;
          metric_category: string | null;
          baseline_value: number | null;
          trend_direction: 'improving' | 'declining' | 'stable' | 'unknown' | null;
          confidence_score: number;
          measurement_method: string | null;
          data_source: Record<string, any>;
          measured_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric_type: string;
          metric_name: string;
          metric_value?: number | null;
          metric_category?: string | null;
          baseline_value?: number | null;
          trend_direction?: 'improving' | 'declining' | 'stable' | 'unknown' | null;
          confidence_score?: number;
          measurement_method?: string | null;
          data_source?: Record<string, any>;
          measured_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metric_type?: string;
          metric_name?: string;
          metric_value?: number | null;
          metric_category?: string | null;
          baseline_value?: number | null;
          trend_direction?: 'improving' | 'declining' | 'stable' | 'unknown' | null;
          confidence_score?: number;
          measurement_method?: string | null;
          data_source?: Record<string, any>;
          measured_at?: string;
        };
      };
      crisis_events: {
        Row: {
          id: string;
          user_id: string;
          severity_level: number;
          crisis_type: string | null;
          trigger_keywords: string[] | null;
          context_summary: string | null;
          response_given: string | null;
          resources_provided: any[];
          human_notified: boolean;
          follow_up_required: boolean;
          resolved: boolean;
          resolution_notes: string | null;
          resolved_at: string | null;
          escalated_to: string | null;
          escalation_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          severity_level: number;
          crisis_type?: string | null;
          trigger_keywords?: string[] | null;
          context_summary?: string | null;
          response_given?: string | null;
          resources_provided?: any[];
          human_notified?: boolean;
          follow_up_required?: boolean;
          resolved?: boolean;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          escalated_to?: string | null;
          escalation_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          severity_level?: number;
          crisis_type?: string | null;
          trigger_keywords?: string[] | null;
          context_summary?: string | null;
          response_given?: string | null;
          resources_provided?: any[];
          human_notified?: boolean;
          follow_up_required?: boolean;
          resolved?: boolean;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          escalated_to?: string | null;
          escalation_time?: string | null;
          created_at?: string;
        };
      };
      active_sessions: {
        Row: {
          id: string;
          user_id: string;
          compressed_context: Record<string, any> | null;
          context_version: number;
          messages_since_compression: number;
          last_activity: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          compressed_context?: Record<string, any> | null;
          context_version?: number;
          messages_since_compression?: number;
          last_activity?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          compressed_context?: Record<string, any> | null;
          context_version?: number;
          messages_since_compression?: number;
          last_activity?: string;
          expires_at?: string;
        };
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string | null;
          api_provider: string;
          model_used: string;
          tokens_input: number;
          tokens_output: number;
          tokens_total: number;
          cost_usd: number;
          request_type: string | null;
          response_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          api_provider: string;
          model_used: string;
          tokens_input?: number;
          tokens_output?: number;
          tokens_total?: number;
          cost_usd?: number;
          request_type?: string | null;
          response_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          api_provider?: string;
          model_used?: string;
          tokens_input?: number;
          tokens_output?: number;
          tokens_total?: number;
          cost_usd?: number;
          request_type?: string | null;
          response_time_ms?: number | null;
          created_at?: string;
        };
      };
      system_config: {
        Row: {
          id: string;
          key: string;
          value: Record<string, any>;
          description: string | null;
          environment: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Record<string, any>;
          description?: string | null;
          environment?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Record<string, any>;
          description?: string | null;
          environment?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_feedback: {
        Row: {
          id: string;
          user_id: string;
          rating: number | null;
          feedback_text: string | null;
          feedback_type: string | null;
          conversation_id: string | null;
          specific_feature: string | null;
          sentiment: string | null;
          priority: string;
          admin_response: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rating?: number | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          conversation_id?: string | null;
          specific_feature?: string | null;
          sentiment?: string | null;
          priority?: string;
          admin_response?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rating?: number | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          conversation_id?: string | null;
          specific_feature?: string | null;
          sentiment?: string | null;
          priority?: string;
          admin_response?: string | null;
          status?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_daily_cost: {
        Args: {
          user_uuid: string;
          target_date?: string;
        };
        Returns: number;
      };
      clean_expired_sessions: {
        Args: {};
        Returns: number;
      };
    };
  };
}

// Helper types
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbUserInsert = Database['public']['Tables']['users']['Insert'];
export type DbUserUpdate = Database['public']['Tables']['users']['Update'];

export type DbPsychProfile = Database['public']['Tables']['user_psychological_profiles']['Row'];
export type DbPsychProfileInsert = Database['public']['Tables']['user_psychological_profiles']['Insert'];
export type DbPsychProfileUpdate = Database['public']['Tables']['user_psychological_profiles']['Update'];

export type DbConversation = Database['public']['Tables']['conversations']['Row'];
export type DbConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type DbConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type DbCrisisEvent = Database['public']['Tables']['crisis_events']['Row'];
export type DbCrisisEventInsert = Database['public']['Tables']['crisis_events']['Insert'];
export type DbCrisisEventUpdate = Database['public']['Tables']['crisis_events']['Update'];

export type DbProgressMetric = Database['public']['Tables']['progress_metrics']['Row'];
export type DbProgressMetricInsert = Database['public']['Tables']['progress_metrics']['Insert'];
export type DbProgressMetricUpdate = Database['public']['Tables']['progress_metrics']['Update'];

export type DbApiUsage = Database['public']['Tables']['api_usage']['Row'];
export type DbApiUsageInsert = Database['public']['Tables']['api_usage']['Insert'];
export type DbApiUsageUpdate = Database['public']['Tables']['api_usage']['Update'];

export type DbActiveSession = Database['public']['Tables']['active_sessions']['Row'];
export type DbActiveSessionInsert = Database['public']['Tables']['active_sessions']['Insert'];
export type DbActiveSessionUpdate = Database['public']['Tables']['active_sessions']['Update'];

export type DbSystemConfig = Database['public']['Tables']['system_config']['Row'];
export type DbSystemConfigInsert = Database['public']['Tables']['system_config']['Insert'];
export type DbSystemConfigUpdate = Database['public']['Tables']['system_config']['Update'];

export type DbUserFeedback = Database['public']['Tables']['user_feedback']['Row'];
export type DbUserFeedbackInsert = Database['public']['Tables']['user_feedback']['Insert'];
export type DbUserFeedbackUpdate = Database['public']['Tables']['user_feedback']['Update'];
```

### 2. User Types - src/types/user.ts
Create business logic types for users:

```typescript
import { DbUser, DbPsychProfile } from './database';

export interface User extends DbUser {
  psychological_profile?: PsychologicalProfile;
  subscription_status?: 'active' | 'expired' | 'trial';
  usage_stats?: {
    daily_remaining: number;
    monthly_cost: number;
    last_active: string;
  };
}

export interface PsychologicalProfile extends DbPsychProfile {
  // Add computed properties
  overall_well_being_score?: number;
  growth_trajectory?: 'improving' | 'stable' | 'declining';
  intervention_priority?: 'low' | 'medium' | 'high' | 'crisis';
}

export interface UserSession {
  user_id: string;
  session_id: string;
  compressed_context?: any;
  message_count: number;
  start_time: string;
  last_activity: string;
}

export interface UserProgress {
  user_id: string;
  identity_evolution: IdentityMetric[];
  behavioral_changes: BehaviorMetric[];
  emotional_patterns: EmotionalMetric[];
  goal_advancement: GoalMetric[];
  overall_trend: 'improving' | 'declining' | 'stable';
}

export interface IdentityMetric {
  aspect: string;
  baseline_score: number;
  current_score: number;
  change_percentage: number;
  confidence: number;
  measured_at: string;
}

export interface BehaviorMetric {
  behavior: string;
  frequency_change: number;
  quality_improvement: number;
  consistency_score: number;
  measured_at: string;
}

export interface EmotionalMetric {
  emotion: string;
  intensity_change: number;
  regulation_improvement: number;
  expression_healthiness: number;
  measured_at: string;
}

export interface GoalMetric {
  goal_area: string;
  progress_percentage: number;
  clarity_score: number;
  action_consistency: number;
  measured_at: string;
}

export interface SubscriptionTier {
  name: 'basic' | 'premium' | 'unlimited';
  daily_message_limit: number;
  monthly_cost_usd: number;
  features: string[];
  upgrade_prompts: boolean;
}
```

### 3. Conversation Types - src/types/conversation.ts
Create conversation and AI response types:

```typescript
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
  userProfile?: PsychologicalSnapshot;
  currentState?: EmotionalState;
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
```

### 4. Crisis Types - src/types/crisis.ts
Create crisis detection and response types:

```typescript
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
```

### 5. Configuration Types - src/lib/config.ts
Create configuration management:

```typescript
export interface Config {
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey: string;
  };
  telegram: {
    botToken: string;
    webhookSecret: string;
  };
  openai: {
    apiKey: string;
    defaultModel: string;
    backupModel: string;
    embeddingModel: string;
  };
  costs: {
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
    alertThresholds: number[];
  };
  features: {
    enableCrisisDetection: boolean;
    enableProgressTracking: boolean;
    enableCostMonitoring: boolean;
    enableAdvancedAnalytics: boolean;
  };
  subscriptions: {
    basic: SubscriptionConfig;
    premium: SubscriptionConfig;
    unlimited: SubscriptionConfig;
  };
}

export interface SubscriptionConfig {
  dailyMessageLimit: number;
  monthlyCostLimit: number;
  features: string[];
  upgradeThreshold: number;
}

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY'
] as const;

export function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config: Config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookSecret: process.env.WEBHOOK_SECRET_TOKEN!
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'gpt-4',
    backupModel: 'gpt-3.5-turbo',
    embeddingModel: 'text-embedding-ada-002'
  },
  costs: {
    dailyLimitUsd: parseFloat(process.env.DAILY_COST_LIMIT_USD || '0.50'),
    monthlyLimitUsd: parseFloat(process.env.MONTHLY_COST_LIMIT_USD || '15.00'),
    alertThresholds: [0.7, 0.85, 0.95] // 70%, 85%, 95% of limits
  },
  features: {
    enableCrisisDetection: process.env.ENABLE_CRISIS_DETECTION === 'true',
    enableProgressTracking: process.env.ENABLE_PROGRESS_TRACKING === 'true',
    enableCostMonitoring: process.env.ENABLE_COST_MONITORING === 'true',
    enableAdvancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true'
  },
  subscriptions: {
    basic: {
      dailyMessageLimit: 15,
      monthlyCostLimit: 15.00,
      features: ['basic_chat', 'crisis_detection'],
      upgradeThreshold: 12 // messages before upgrade prompt
    },
    premium: {
      dailyMessageLimit: 50,
      monthlyCostLimit: 35.00,
      features: ['basic_chat', 'crisis_detection', 'progress_tracking', 'insights'],
      upgradeThreshold: 45
    },
    unlimited: {
      dailyMessageLimit: 1000,
      monthlyCostLimit: 75.00,
      features: ['all'],
      upgradeThreshold: 999
    }
  }
};
```

### 6. Database Client - src/lib/database.ts
Create Supabase client and utilities:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { config } from './config';

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database utilities
export class DatabaseUtils {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = supabase;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByTelegramId(telegramId: number) {
    const { data, error } = await this.client
      .from('users')
      .select(`
        *,
        user_psychological_profiles(*)
      `)
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async saveConversation(conversationData: Database['public']['Tables']['conversations']['Insert']) {
    const { data, error } = await this.client
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createCrisisEvent(crisisData: Database['public']['Tables']['crisis_events']['Insert']) {
    const { data, error } = await this.client
      .from('crisis_events')
      .insert(crisisData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePsychologicalProfile(
    userId: string, 
    profileData: Database['public']['Tables']['user_psychological_profiles']['Update']
  ) {
    const { data, error } = await this.client
      .from('user_psychological_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async trackApiUsage(usageData: Database['public']['Tables']['api_usage']['Insert']) {
    const { error } = await this.client
      .from('api_usage')
      .insert(usageData);

    if (error) throw error;
  }

  async getDailyCost(userId: string, date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await this.client
      .rpc('get_daily_cost', {
        user_uuid: userId,
        target_date: date
      });

    if (error) throw error;
    return data || 0;
  }

  async getRecentConversations(userId: string, limit = 10) {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async cleanExpiredSessions() {
    const { data, error } = await this.client
      .rpc('clean_expired_sessions');

    if (error) throw error;
    return data || 0;
  }
}

export const db = new DatabaseUtils();
```

## Validation Requirements
After creating all files:
1. Ensure TypeScript compilation passes with no errors
2. Verify all database types match the Supabase schema exactly
3. Test database connection with `db.testConnection()`
4. Confirm all imports resolve correctly
5. Validate environment variable configuration works

## Success Criteria
- [ ] All database tables have complete TypeScript types
- [ ] Database client connects successfully
- [ ] Business logic types support all required operations
- [ ] Configuration management handles all environment variables
- [ ] Database utilities provide all CRUD operations needed
- [ ] Type safety enforced throughout database operations 