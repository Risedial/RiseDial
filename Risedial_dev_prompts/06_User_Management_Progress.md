# Prompt 6: Implement User Management & Progress Tracking

## Context
You are building Risedial's user management system that handles user registration, session management, psychological profile tracking, and progress measurement. This system tracks therapeutic outcomes and provides personalized insights for growth.

## Required Reading
First, read these files to understand user management requirements:
- `Context/project_blueprint.md` - User journey and progress tracking specifications
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - User management architecture
- `src/types/user.ts` - User and progress types (if created)
- `src/types/database.ts` - User database schema (if created)

## Task
Create a comprehensive user management system that handles registration, session management, psychological profiling, progress tracking, and personalized therapeutic insights to support user growth and therapeutic outcomes.

## Exact Expected Outputs

### 1. User Manager - src/lib/user-manager.ts
Create comprehensive user management and profile system:

```typescript
import { db } from './database';

interface UserProfile {
  id: string;
  telegram_id: number;
  first_name: string;
  username?: string;
  subscription_tier: 'basic' | 'premium' | 'unlimited';
  onboarding_completed: boolean;
  psychological_profile: PsychologicalProfile;
  progress_metrics: ProgressMetrics;
  preferences: UserPreferences;
  created_at: string;
  last_active: string;
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

class UserManager {
  async createOrUpdateUser(telegramUser: any): Promise<UserProfile> {
    try {
      // Check if user exists
      const existingUser = await this.getUserByTelegramId(telegramUser.id);
      
      if (existingUser) {
        // Update last active
        return await this.updateLastActive(existingUser.id);
      }

      // Create new user
      const newUser: Partial<UserProfile> = {
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        username: telegramUser.username,
        subscription_tier: 'basic',
        onboarding_completed: false,
        psychological_profile: this.createDefaultPsychologicalProfile(),
        progress_metrics: this.createDefaultProgressMetrics(),
        preferences: this.createDefaultPreferences(),
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      const { data, error } = await db.supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;

      console.log(`Created new user: ${telegramUser.first_name} (${telegramUser.id})`);
      return data as UserProfile;

    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<UserProfile | null> {
    try {
      const { data, error } = await db.supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data as UserProfile;
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

      const updatedProfile = {
        ...user.psychological_profile,
        ...updates
      };

      const { data, error } = await db.supabase
        .from('users')
        .update({ psychological_profile: updatedProfile })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Updated psychological profile for user ${userId}`);
      return data as UserProfile;

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

      const updatedMetrics = {
        ...user.progress_metrics,
        ...updates
      };

      const { data, error } = await db.supabase
        .from('users')
        .update({ progress_metrics: updatedMetrics })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data as UserProfile;

    } catch (error) {
      console.error('Error updating progress metrics:', error);
      throw error;
    }
  }

  async trackSession(userId: string, sessionData: {
    duration_minutes: number;
    message_count: number;
    therapeutic_value: number;
    emotional_tone: string;
    crisis_detected: boolean;
    insights_gained: string[];
    goals_worked_on: string[];
  }): Promise<void> {
    try {
      // Save session record
      const { error: sessionError } = await db.supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          duration_minutes: sessionData.duration_minutes,
          message_count: sessionData.message_count,
          therapeutic_value: sessionData.therapeutic_value,
          emotional_tone: sessionData.emotional_tone,
          crisis_detected: sessionData.crisis_detected,
          insights_gained: sessionData.insights_gained,
          goals_worked_on: sessionData.goals_worked_on,
          created_at: new Date().toISOString()
        });

      if (sessionError) throw sessionError;

      // Update user progress metrics
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const currentMetrics = user.progress_metrics;
      const newTotalSessions = currentMetrics.total_sessions + 1;
      const newTotalMessages = currentMetrics.total_messages + sessionData.message_count;

      // Calculate new averages
      const newAvgSessionLength = (
        (currentMetrics.average_session_length * currentMetrics.total_sessions) + 
        sessionData.duration_minutes
      ) / newTotalSessions;

      // Update engagement score based on session quality
      const engagementDelta = this.calculateEngagementDelta(sessionData);
      const newEngagementScore = Math.max(1, Math.min(10, 
        currentMetrics.engagement_score + engagementDelta
      ));

      // Update therapeutic progress
      const progressDelta = this.calculateProgressDelta(sessionData);
      const newTherapeuticProgress = Math.max(1, Math.min(10,
        currentMetrics.therapeutic_progress + progressDelta
      ));

      const updatedMetrics: Partial<ProgressMetrics> = {
        total_sessions: newTotalSessions,
        total_messages: newTotalMessages,
        average_session_length: newAvgSessionLength,
        engagement_score: newEngagementScore,
        therapeutic_progress: newTherapeuticProgress,
        insights_gained: currentMetrics.insights_gained + sessionData.insights_gained.length,
        skills_learned: [
          ...currentMetrics.skills_learned,
          ...sessionData.insights_gained.filter(insight => 
            insight.toLowerCase().includes('skill') || 
            insight.toLowerCase().includes('technique')
          )
        ]
      };

      if (sessionData.crisis_detected) {
        updatedMetrics.crisis_incidents = currentMetrics.crisis_incidents + 1;
        updatedMetrics.last_crisis_date = new Date().toISOString();
      }

      await this.updateProgressMetrics(userId, updatedMetrics);

    } catch (error) {
      console.error('Error tracking session:', error);
      throw error;
    }
  }

  async generateProgressReport(userId: string): Promise<any> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Get recent sessions for trend analysis
      const recentSessions = await this.getRecentSessions(userId, 30); // Last 30 days
      
      // Calculate trends
      const moodTrend = this.calculateMoodTrend(recentSessions);
      const engagementTrend = this.calculateEngagementTrend(recentSessions);
      const progressTrend = this.calculateProgressTrend(recentSessions);

      // Generate insights
      const insights = this.generateProgressInsights(user, recentSessions);

      // Create recommendations
      const recommendations = this.generateRecommendations(user, recentSessions);

      return {
        user_id: userId,
        report_date: new Date().toISOString(),
        time_period: '30_days',
        current_metrics: user.progress_metrics,
        psychological_profile: user.psychological_profile,
        trends: {
          mood: moodTrend,
          engagement: engagementTrend,
          progress: progressTrend
        },
        insights,
        recommendations,
        achievements: this.identifyAchievements(user, recentSessions),
        areas_for_growth: this.identifyGrowthAreas(user, recentSessions),
        next_milestones: this.suggestNextMilestones(user)
      };

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
      therapeutic_progress: 1,
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
        preferred_crisis_resources: ['988', 'crisis_text_line'],
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
      const { data, error } = await db.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  private async updateLastActive(userId: string): Promise<UserProfile> {
    const { data, error } = await db.supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  }

  private calculateEngagementDelta(sessionData: any): number {
    let delta = 0;
    
    // Positive factors
    if (sessionData.therapeutic_value >= 7) delta += 0.1;
    if (sessionData.duration_minutes >= 10) delta += 0.1;
    if (sessionData.insights_gained.length > 0) delta += 0.1;
    
    // Negative factors
    if (sessionData.therapeutic_value < 4) delta -= 0.1;
    if (sessionData.duration_minutes < 3) delta -= 0.1;
    
    return delta;
  }

  private calculateProgressDelta(sessionData: any): number {
    let delta = 0;
    
    // Progress indicators
    if (sessionData.insights_gained.length >= 2) delta += 0.1;
    if (sessionData.goals_worked_on.length > 0) delta += 0.05;
    if (sessionData.therapeutic_value >= 8) delta += 0.1;
    
    // Crisis impact
    if (sessionData.crisis_detected) delta -= 0.05;
    
    return delta;
  }

  private async getRecentSessions(userId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await db.supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private calculateMoodTrend(sessions: any[]): any {
    if (sessions.length === 0) return { trend: 'stable', change: 0 };

    const moodScores = sessions.map(s => this.emotionalToneToScore(s.emotional_tone));
    const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
    const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    
    return {
      trend: change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable',
      change: change,
      current_level: secondAvg
    };
  }

  private calculateEngagementTrend(sessions: any[]): any {
    if (sessions.length === 0) return { trend: 'stable', change: 0 };

    const engagementScores = sessions.map(s => s.therapeutic_value || 5);
    const recentAvg = engagementScores.slice(-7).reduce((sum, score) => sum + score, 0) / Math.min(7, engagementScores.length);
    const previousAvg = engagementScores.slice(0, -7).reduce((sum, score) => sum + score, 0) / Math.max(1, engagementScores.length - 7);

    const change = recentAvg - previousAvg;

    return {
      trend: change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable',
      change: change,
      current_level: recentAvg
    };
  }

  private calculateProgressTrend(sessions: any[]): any {
    const recentInsights = sessions.slice(-7).reduce((sum, s) => sum + (s.insights_gained?.length || 0), 0);
    const previousInsights = sessions.slice(0, -7).reduce((sum, s) => sum + (s.insights_gained?.length || 0), 0);

    const recentGoals = sessions.slice(-7).reduce((sum, s) => sum + (s.goals_worked_on?.length || 0), 0);
    const previousGoals = sessions.slice(0, -7).reduce((sum, s) => sum + (s.goals_worked_on?.length || 0), 0);

    const insightTrend = recentInsights > previousInsights ? 'increasing' : 
                        recentInsights < previousInsights ? 'decreasing' : 'stable';
    
    const goalTrend = recentGoals > previousGoals ? 'increasing' : 
                     recentGoals < previousGoals ? 'decreasing' : 'stable';

    return {
      insights: { trend: insightTrend, recent_count: recentInsights },
      goals: { trend: goalTrend, recent_count: recentGoals },
      overall: insightTrend === 'increasing' && goalTrend === 'increasing' ? 'accelerating' :
               insightTrend === 'decreasing' || goalTrend === 'decreasing' ? 'slowing' : 'steady'
    };
  }

  private emotionalToneToScore(tone: string): number {
    const toneScores = {
      'very_positive': 9,
      'positive': 7,
      'hopeful': 6,
      'neutral': 5,
      'concerned': 4,
      'sad': 3,
      'anxious': 2,
      'distressed': 1
    };
    return toneScores[tone] || 5;
  }

  private generateProgressInsights(user: UserProfile, sessions: any[]): string[] {
    const insights = [];
    
    // Session frequency insights
    if (sessions.length >= 20) {
      insights.push("You've been consistently engaging with therapy, which shows strong commitment to your growth.");
    }
    
    // Progress insights
    if (user.progress_metrics.therapeutic_progress >= 7) {
      insights.push("You've made significant therapeutic progress and developed valuable coping skills.");
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

  private generateRecommendations(user: UserProfile, sessions: any[]): string[] {
    const recommendations = [];
    
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

  private identifyAchievements(user: UserProfile, sessions: any[]): string[] {
    const achievements = [];
    
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

  private identifyGrowthAreas(user: UserProfile, sessions: any[]): string[] {
    const growthAreas = [];
    
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
    const milestones = [];
    
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
}

export const userManager = new UserManager();
```

## Validation Requirements
After creating all files:
1. Test user registration and profile creation flow
2. Verify psychological profile updates track accurately
3. Test progress metrics calculation and trends
4. Validate session tracking captures therapeutic value
5. Ensure progress reports provide meaningful insights
6. Test user preference management and privacy controls

## Success Criteria
- [ ] User management handles registration and profile updates seamlessly
- [ ] Psychological profiling provides accurate assessment of user state
- [ ] Progress tracking demonstrates measurable therapeutic outcomes
- [ ] Session management captures comprehensive interaction data
- [ ] Progress reports offer actionable insights for continued growth
- [ ] User preferences ensure personalized therapeutic experience 