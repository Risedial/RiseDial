import { getDatabaseUtils } from './database';
import { getSafeSupabaseAdminClient } from './supabase-client';
import { 
  Database, 
  DbUser, 
  DbPsychProfile, 
  DbConversation, 
  DbProgressMetric,
  DbCrisisEvent 
} from '@/types/database';

// Extend DbUser to include computed fields for the application layer
interface UserProfile extends DbUser {
  onboarding_completed: boolean;
  psychological_profile: PsychologicalProfile;
  progress_metrics: ProgressMetrics;
  preferences: UserPreferences;
}

interface PsychologicalProfile {
  emotional_state: string;
  stress_level: number; // 1-10
  anxiety_level: number; // 1-10
  depression_indicators: number; // 1-10
  resilience_score: number; // 1-10
  openness_level: number; // 1-10
  support_system_strength: number; // 1-10
  coping_mechanisms: string[];
  therapeutic_goals: string[];
  crisis_risk_level: number; // 1-10
  personality_traits: string[];
  communication_style: string;
  preferred_therapeutic_approaches: string[];
  trauma_indicators: boolean;
  substance_use_concerns: boolean;
}

interface ProgressMetrics {
  total_sessions: number;
  total_messages: number;
  average_session_length: number;
  engagement_score: number; // 1-10
  therapeutic_progress: number; // 1-10
  goal_completion_rate: number; // 0-100%
  mood_improvement: number; // -10 to +10
  crisis_incidents: number;
  last_crisis_date?: string;
  breakthrough_moments: number;
  insights_gained: number;
  skills_learned: string[];
  relationship_quality: number; // 1-10 (with AI companion)
}

interface UserPreferences {
  communication_frequency: 'low' | 'medium' | 'high';
  session_length_preference: 'short' | 'medium' | 'long';
  therapeutic_style: 'directive' | 'non-directive' | 'mixed';
  privacy_level: 'open' | 'moderate' | 'private';
  crisis_contact_preferences: {
    emergency_contact?: string;
    preferred_crisis_resources: string[];
    location_sharing: boolean;
  };
  notification_preferences: {
    daily_check_ins: boolean;
    progress_updates: boolean;
    crisis_follow_ups: boolean;
  };
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface SessionData {
  duration_minutes: number;
  message_count: number;
  therapeutic_value: number;
  emotional_tone: string;
  crisis_detected: boolean;
  insights_gained: string[];
  goals_worked_on: string[];
}

export class UserManager {
  private db = getDatabaseUtils();

  async createOrUpdateUser(telegramUser: TelegramUser): Promise<UserProfile> {
    try {
      // Check if user exists
      let user = await this.db.getUserByTelegramId(telegramUser.id);
      
      if (!user) {
        // Create new user
        const userData: Database['public']['Tables']['users']['Insert'] = {
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username || null,
          subscription_tier: 'basic', // Fixed: changed from 'free' to 'basic'
          daily_message_count: 0,
          last_message_date: new Date().toISOString().split('T')[0],
          total_messages: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        user = await this.db.createUser(userData);
      } else {
        // Update last active
        await this.db.updateUserActivity(user.id);
      }

      return {
        ...user,
        onboarding_completed: user.user_psychological_profiles?.[0] ? true : false,
        psychological_profile: this.createDefaultPsychologicalProfile(),
        progress_metrics: this.createDefaultProgressMetrics(),
        preferences: this.createDefaultPreferences()
      };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<UserProfile | null> {
    try {
      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) {
        throw new Error('Unable to get Supabase client');
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_psychological_profiles(*)
        `)
        .eq('telegram_id', telegramId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      // Get progress metrics
      const progressMetrics = await this.calculateProgressMetrics(data.id);

      return {
        ...data,
        onboarding_completed: data.user_psychological_profiles?.[0] ? true : false,
        psychological_profile: data.user_psychological_profiles?.[0] 
          ? this.mapDbProfileToUserProfile(data.user_psychological_profiles[0])
          : this.createDefaultPsychologicalProfile(),
        progress_metrics: progressMetrics,
        preferences: this.createDefaultPreferences()
      };
    } catch (error) {
      console.error('Error getting user by Telegram ID:', error);
      return null;
    }
  }

  async updatePsychologicalProfile(
    userId: string, 
    updates: Partial<PsychologicalProfile>
  ): Promise<UserProfile> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) {
        throw new Error('Unable to get Supabase client');
      }

      const updatedProfileData = {
        ...this.mapUserProfileToDbProfile(user.psychological_profile),
        ...this.mapUserProfileToDbProfile(updates),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_psychological_profiles')
        .upsert({
          user_id: userId,
          ...updatedProfileData
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Updated psychological profile for user ${userId}`);
      
      return {
        ...user,
        psychological_profile: {
          ...user.psychological_profile,
          ...updates
        }
      };

    } catch (error) {
      console.error('Error updating psychological profile:', error);
      throw error;
    }
  }

  async updateProgressMetrics(
    userId: string, 
    updates: Partial<ProgressMetrics>
  ): Promise<UserProfile> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Save individual progress metrics to database
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'number') {
          await this.saveProgressMetric(userId, key, value);
        }
      }

      return {
        ...user,
        progress_metrics: {
          ...user.progress_metrics,
          ...updates
        }
      };

    } catch (error) {
      console.error('Error updating progress metrics:', error);
      throw error;
    }
  }

  async trackSession(userId: string, sessionData: SessionData): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Track engagement changes
      const engagementDelta = this.calculateEngagementDelta(sessionData);
      const progressDelta = this.calculateProgressDelta(sessionData);

      // Update progress metrics
      await this.updateProgressMetrics(userId, {
        total_sessions: user.progress_metrics.total_sessions + 1,
        total_messages: user.progress_metrics.total_messages + sessionData.message_count,
        average_session_length: (
          (user.progress_metrics.average_session_length * user.progress_metrics.total_sessions + sessionData.duration_minutes) /
          (user.progress_metrics.total_sessions + 1)
        ),
        engagement_score: Math.max(1, Math.min(10, user.progress_metrics.engagement_score + engagementDelta)),
        therapeutic_progress: Math.max(1, Math.min(10, user.progress_metrics.therapeutic_progress + progressDelta)),
        insights_gained: user.progress_metrics.insights_gained + sessionData.insights_gained.length
      });

      // Handle crisis detection
      if (sessionData.crisis_detected) {
        const supabase = getSafeSupabaseAdminClient();
        if (supabase) {
          await supabase
            .from('crisis_events')
            .insert({
              user_id: userId,
              severity_level: 5, // Default severity
              crisis_type: 'detected_in_session',
              context_summary: `Crisis detected during session. Emotional tone: ${sessionData.emotional_tone}`,
              response_given: 'Automated crisis response triggered',
              resources_provided: [],
              human_notified: false,
              follow_up_required: true,
              resolved: false,
              created_at: new Date().toISOString()
            });
        }

        // Update crisis incidents count
        await this.updateProgressMetrics(userId, {
          crisis_incidents: user.progress_metrics.crisis_incidents + 1,
          last_crisis_date: new Date().toISOString()
        });
      }

      // Update psychological profile based on session
      const profileUpdates: Partial<PsychologicalProfile> = {};
      
      if (sessionData.emotional_tone) {
        profileUpdates.emotional_state = sessionData.emotional_tone;
      }
      
      if (sessionData.therapeutic_value >= 7) {
        profileUpdates.openness_level = Math.min(10, user.psychological_profile.openness_level + 0.1);
      }

      if (Object.keys(profileUpdates).length > 0) {
        await this.updatePsychologicalProfile(userId, profileUpdates);
      }

    } catch (error) {
      console.error('Error tracking session:', error);
      throw error;
    }
  }

  async generateProgressReport(userId: string): Promise<{
    user: UserProfile;
    summary: string;
    trends: {
      mood: any;
      engagement: any;
      progress: any;
    };
    insights: string[];
    recommendations: string[];
    achievements: string[];
    growth_areas: string[];
    next_milestones: string[];
  }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Get recent sessions for trend analysis
      const recentSessions = await this.getRecentSessions(userId, 30);

      const report = {
        user,
        summary: `Progress report for ${user.first_name}: ${user.progress_metrics.total_sessions} sessions completed with ${user.progress_metrics.insights_gained} insights gained.`,
        trends: {
          mood: this.calculateMoodTrend(recentSessions),
          engagement: this.calculateEngagementTrend(recentSessions),
          progress: this.calculateProgressTrend(recentSessions)
        },
        insights: this.generateProgressInsights(user, recentSessions),
        recommendations: this.generateRecommendations(user, recentSessions),
        achievements: this.identifyAchievements(user, recentSessions),
        growth_areas: this.identifyGrowthAreas(user, recentSessions),
        next_milestones: this.suggestNextMilestones(user)
      };

      return report;

    } catch (error) {
      console.error('Error generating progress report:', error);
      throw error;
    }
  }

  private createDefaultPsychologicalProfile(): PsychologicalProfile {
    return {
      emotional_state: 'neutral',
      stress_level: 5,
      anxiety_level: 5,
      depression_indicators: 5,
      resilience_score: 5,
      openness_level: 5,
      support_system_strength: 5,
      coping_mechanisms: [],
      therapeutic_goals: [],
      crisis_risk_level: 1,
      personality_traits: [],
      communication_style: 'balanced',
      preferred_therapeutic_approaches: [],
      trauma_indicators: false,
      substance_use_concerns: false
    };
  }

  private createDefaultProgressMetrics(): ProgressMetrics {
    return {
      total_sessions: 0,
      total_messages: 0,
      average_session_length: 0,
      engagement_score: 5,
      therapeutic_progress: 5,
      goal_completion_rate: 0,
      mood_improvement: 0,
      crisis_incidents: 0,
      breakthrough_moments: 0,
      insights_gained: 0,
      skills_learned: [],
      relationship_quality: 5
    };
  }

  private createDefaultPreferences(): UserPreferences {
    return {
      communication_frequency: 'medium',
      session_length_preference: 'medium',
      therapeutic_style: 'mixed',
      privacy_level: 'moderate',
      crisis_contact_preferences: {
        preferred_crisis_resources: [],
        location_sharing: false
      },
      notification_preferences: {
        daily_check_ins: true,
        progress_updates: true,
        crisis_follow_ups: true
      }
    };
  }

  private async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) {
        throw new Error('Unable to get Supabase client');
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_psychological_profiles(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const progressMetrics = await this.calculateProgressMetrics(data.id);

      return {
        ...data,
        onboarding_completed: data.user_psychological_profiles?.[0] ? true : false,
        psychological_profile: data.user_psychological_profiles?.[0] 
          ? this.mapDbProfileToUserProfile(data.user_psychological_profiles[0])
          : this.createDefaultPsychologicalProfile(),
        progress_metrics: progressMetrics,
        preferences: this.createDefaultPreferences()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  private calculateEngagementDelta(sessionData: SessionData): number {
    let delta = 0;
    
    // High therapeutic value increases engagement
    if (sessionData.therapeutic_value >= 8) delta += 0.5;
    else if (sessionData.therapeutic_value >= 6) delta += 0.2;
    else if (sessionData.therapeutic_value <= 3) delta -= 0.3;
    
    // Long sessions indicate engagement
    if (sessionData.duration_minutes >= 30) delta += 0.3;
    else if (sessionData.duration_minutes <= 5) delta -= 0.2;
    
    // High message count indicates engagement
    if (sessionData.message_count >= 20) delta += 0.2;
    
    return delta;
  }

  private calculateProgressDelta(sessionData: SessionData): number {
    let delta = 0;
    
    // Insights gained indicate progress
    delta += sessionData.insights_gained.length * 0.1;
    
    // Goals worked on indicate progress
    delta += sessionData.goals_worked_on.length * 0.15;
    
    // High therapeutic value indicates progress
    if (sessionData.therapeutic_value >= 8) delta += 0.3;
    else if (sessionData.therapeutic_value >= 6) delta += 0.1;
    
    return delta;
  }

  private async getRecentSessions(userId: string, days: number): Promise<DbConversation[]> {
    try {
      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) return [];

      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  private calculateMoodTrend(sessions: DbConversation[]): {
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
    recent_average: number;
  } {
    if (sessions.length < 3) {
      return { direction: 'stable', confidence: 0, recent_average: 5 };
    }

    const moodScores = sessions.map((s: DbConversation) => this.emotionalToneToScore(s.emotional_tone || 'neutral'));
    const recentAvg = moodScores.slice(0, Math.floor(sessions.length / 2)).reduce((a: number, b: number) => a + b, 0) / Math.floor(sessions.length / 2);
    const olderAvg = moodScores.slice(Math.floor(sessions.length / 2)).reduce((a: number, b: number) => a + b, 0) / (sessions.length - Math.floor(sessions.length / 2));
    
    const difference = recentAvg - olderAvg;
    const confidence = Math.min(1, sessions.length / 20);
    
    return {
      direction: Math.abs(difference) < 0.5 ? 'stable' : difference > 0 ? 'improving' : 'declining',
      confidence,
      recent_average: recentAvg
    };
  }

  private calculateEngagementTrend(sessions: DbConversation[]): {
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
    recent_average: number;
  } {
    if (sessions.length < 3) {
      return { direction: 'stable', confidence: 0, recent_average: 5 };
    }

    const engagementScores = sessions.map((s: DbConversation) => s.therapeutic_value || 5);
    const recentAvg = engagementScores.slice(0, Math.floor(sessions.length / 2)).reduce((a: number, b: number) => a + b, 0) / Math.floor(sessions.length / 2);
    const olderAvg = engagementScores.slice(Math.floor(sessions.length / 2)).reduce((a: number, b: number) => a + b, 0) / (sessions.length - Math.floor(sessions.length / 2));
    
    const difference = recentAvg - olderAvg;
    const confidence = Math.min(1, sessions.length / 20);
    
    return {
      direction: Math.abs(difference) < 0.5 ? 'stable' : difference > 0 ? 'improving' : 'declining',
      confidence,
      recent_average: recentAvg
    };
  }

  private calculateProgressTrend(sessions: DbConversation[]): {
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
    insights_per_session: number;
  } {
    if (sessions.length < 3) {
      return { direction: 'stable', confidence: 0, insights_per_session: 0 };
    }

    const insightsPerSession = sessions.map((s: DbConversation) => (s.key_insights?.length || 0));
    const avgInsights = insightsPerSession.reduce((a: number, b: number) => a + b, 0) / sessions.length;
    
    const recentInsights = insightsPerSession.slice(0, Math.floor(sessions.length / 2));
    const olderInsights = insightsPerSession.slice(Math.floor(sessions.length / 2));
    
    const recentAvg = recentInsights.reduce((a: number, b: number) => a + b, 0) / recentInsights.length;
    const olderAvg = olderInsights.reduce((a: number, b: number) => a + b, 0) / olderInsights.length;
    
    const difference = recentAvg - olderAvg;
    const confidence = Math.min(1, sessions.length / 15);
    
    return {
      direction: Math.abs(difference) < 0.3 ? 'stable' : difference > 0 ? 'improving' : 'declining',
      confidence,
      insights_per_session: avgInsights
    };
  }

  private emotionalToneToScore(tone: string): number {
    const toneMap: Record<string, number> = {
      'very_positive': 9,
      'positive': 7,
      'slightly_positive': 6,
      'neutral': 5,
      'slightly_negative': 4,
      'negative': 3,
      'very_negative': 1,
      'anxious': 2,
      'depressed': 2,
      'excited': 8,
      'calm': 7,
      'frustrated': 3,
      'hopeful': 8
    };
    
    return toneMap[tone.toLowerCase()] || 5;
  }

  private generateProgressInsights(user: UserProfile, sessions: DbConversation[]): string[] {
    const insights: string[] = [];
    
    // Session frequency insights
    if (sessions.length >= 20) {
      insights.push("You've maintained consistent engagement with regular sessions.");
    }
    
    // Engagement insights
    if (user.progress_metrics.engagement_score >= 8) {
      insights.push("Your high engagement suggests you're building a strong therapeutic relationship.");
    }
    
    // Crisis insights
    if (user.progress_metrics.crisis_incidents === 0) {
      insights.push("You've maintained emotional stability without crisis incidents.");
    }
    
    return insights;
  }

  private generateRecommendations(user: UserProfile, sessions: DbConversation[]): string[] {
    const recommendations: string[] = [];
    
    // Based on engagement
    if (user.progress_metrics.engagement_score < 6) {
      recommendations.push("Try exploring different therapeutic approaches to find what resonates with you.");
    }
    
    // Based on session frequency
    if (sessions.length < 10) {
      recommendations.push("Consider more regular check-ins to build momentum in your therapeutic journey.");
    }
    
    // Based on crisis risk
    if (user.psychological_profile.crisis_risk_level >= 6) {
      recommendations.push("Continue building your support system and practicing crisis management techniques.");
    }
    
    return recommendations;
  }

  private identifyAchievements(user: UserProfile, sessions: DbConversation[]): string[] {
    const achievements: string[] = [];
    
    if (user.progress_metrics.total_sessions >= 10) {
      achievements.push("Completed 10+ therapy sessions");
    }
    
    if (user.progress_metrics.insights_gained >= 25) {
      achievements.push("Gained 25+ therapeutic insights");
    }
    
    if (user.progress_metrics.crisis_incidents === 0 && user.progress_metrics.total_sessions >= 30) {
      achievements.push("Maintained emotional stability for extended period");
    }
    
    return achievements;
  }

  private identifyGrowthAreas(user: UserProfile, sessions: DbConversation[]): string[] {
    const growthAreas: string[] = [];
    
    if (user.psychological_profile.resilience_score < 6) {
      growthAreas.push("Building emotional resilience");
    }
    
    if (user.psychological_profile.support_system_strength < 6) {
      growthAreas.push("Strengthening support network");
    }
    
    if (user.progress_metrics.goal_completion_rate < 50) {
      growthAreas.push("Improving goal achievement consistency");
    }
    
    return growthAreas;
  }

  private suggestNextMilestones(user: UserProfile): string[] {
    const milestones: string[] = [];
    
    if (user.progress_metrics.total_sessions < 20) {
      milestones.push("Complete 20 therapy sessions");
    }
    
    if (user.progress_metrics.therapeutic_progress < 8) {
      milestones.push("Achieve significant therapeutic breakthrough");
    }
    
    if (user.psychological_profile.crisis_risk_level > 3) {
      milestones.push("Develop advanced crisis management skills");
    }
    
    return milestones;
  }

  private async calculateProgressMetrics(userId: string): Promise<ProgressMetrics> {
    try {
      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) {
        return this.createDefaultProgressMetrics();
      }

      // Get basic conversation stats
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId);

      if (convError) throw convError;

      const totalMessages = conversations?.length || 0;
      const sessions = conversations?.filter((c: DbConversation) => c.session_id) || [];
      const uniqueSessions = new Set(sessions.map((s: DbConversation) => s.session_id)).size;

      // Calculate average session length (approximate)
      const avgSessionLength = sessions.length > 0 ? 
        sessions.reduce((sum: number, s: DbConversation) => sum + (s.response_time_ms || 0), 0) / sessions.length / 60000 : 0;

      // Calculate engagement score from therapeutic values
      const therapeuticValues = conversations?.map((c: DbConversation) => c.therapeutic_value).filter((v: number) => v > 0) || [];
      const avgTherapeuticValue = therapeuticValues.length > 0 ?
        therapeuticValues.reduce((sum: number, v: number) => sum + v, 0) / therapeuticValues.length : 5;

      // Count insights
      const totalInsights = conversations?.reduce((sum: number, c: DbConversation) => sum + (c.key_insights?.length || 0), 0) || 0;

      // Count crisis incidents
      const { data: crisisEvents, error: crisisError } = await supabase
        .from('crisis_events')
        .select('*')
        .eq('user_id', userId);

      if (crisisError) throw crisisError;

      const crisisIncidents = crisisEvents?.length || 0;
      const lastCrisisDate = crisisEvents?.[0]?.created_at;

      return {
        total_sessions: uniqueSessions,
        total_messages: totalMessages,
        average_session_length: avgSessionLength,
        engagement_score: Math.min(10, Math.max(1, avgTherapeuticValue)),
        therapeutic_progress: Math.min(10, Math.max(1, avgTherapeuticValue)),
        goal_completion_rate: 0, // Would need goal tracking implementation
        mood_improvement: 0, // Would need mood tracking over time
        crisis_incidents: crisisIncidents,
        last_crisis_date: lastCrisisDate,
        breakthrough_moments: 0, // Would need breakthrough detection
        insights_gained: totalInsights,
        skills_learned: [], // Would need skill extraction from conversations
        relationship_quality: Math.min(10, Math.max(1, avgTherapeuticValue))
      };
    } catch (error) {
      console.error('Error calculating progress metrics:', error);
      return this.createDefaultProgressMetrics();
    }
  }

  private async saveProgressMetric(userId: string, metricName: string, value: number): Promise<void> {
    try {
      const supabase = getSafeSupabaseAdminClient();
      if (!supabase) return;

      await supabase
        .from('progress_metrics')
        .insert({
          user_id: userId,
          metric_type: 'user_progress',
          metric_name: metricName,
          metric_value: value,
          metric_category: 'therapeutic',
          confidence_score: 0.8,
          data_source: { source: 'user_manager' },
          measured_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving progress metric:', error);
    }
  }

  private mapDbProfileToUserProfile(dbProfile: DbPsychProfile): PsychologicalProfile {
    return {
      emotional_state: dbProfile.emotional_state || 'neutral',
      stress_level: dbProfile.stress_level || 5,
      anxiety_level: 5, // Not in DB schema, using default
      depression_indicators: 5, // Not in DB schema, using default  
      resilience_score: 5, // Not in DB schema, using default
      openness_level: dbProfile.openness_level || 5,
      support_system_strength: dbProfile.support_system_strength || 5,
      coping_mechanisms: [], // Would extract from behavioral_changes
      therapeutic_goals: [], // Would extract from goal_progression
      crisis_risk_level: dbProfile.crisis_risk_level || 1,
      personality_traits: [], // Would extract from identity_evolution
      communication_style: dbProfile.communication_style?.style || 'balanced',
      preferred_therapeutic_approaches: dbProfile.preferred_approaches || [],
      trauma_indicators: false, // Would need assessment
      substance_use_concerns: false // Would need assessment
    };
  }

  private mapUserProfileToDbProfile(userProfile: Partial<PsychologicalProfile>): Partial<Database['public']['Tables']['user_psychological_profiles']['Update']> {
    return {
      emotional_state: userProfile.emotional_state,
      stress_level: userProfile.stress_level,
      openness_level: userProfile.openness_level,
      support_system_strength: userProfile.support_system_strength,
      crisis_risk_level: userProfile.crisis_risk_level,
      communication_style: userProfile.communication_style ? 
        { style: userProfile.communication_style } : undefined,
      preferred_approaches: userProfile.preferred_therapeutic_approaches
    };
  }
}

export const userManager = new UserManager(); 