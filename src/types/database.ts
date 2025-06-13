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