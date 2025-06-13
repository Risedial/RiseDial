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