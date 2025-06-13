import { userManager } from '../src/lib/user-manager';

// Mock the database for testing
jest.mock('../src/lib/database', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Import the mocked supabase after mocking
const { supabase } = require('../src/lib/database');

describe('UserManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateUser', () => {
    test('should create new user when user does not exist', async () => {
      // Mock getUserByTelegramId to return null (user doesn't exist)
      const mockUserSelect = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      };

      // Mock user creation
      const mockUserInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              telegram_id: 12345,
              first_name: 'Test User',
              username: 'testuser',
              subscription_tier: 'basic',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          })
        })
      };

      // Mock profile creation
      const mockProfileInsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: 'user-123',
              emotional_state: 'neutral',
              stress_level: 5
            },
            error: null
          })
        })
      };

      // Mock the from calls in sequence
      supabase.from
        .mockReturnValueOnce({ select: () => mockUserSelect })
        .mockReturnValueOnce({ insert: () => mockUserInsert })
        .mockReturnValueOnce({ insert: () => mockProfileInsert });

      const telegramUser = {
        id: 12345,
        first_name: 'Test User',
        username: 'testuser'
      };

      const result = await userManager.createOrUpdateUser(telegramUser);

      expect(result).toBeDefined();
      expect(result.telegram_id).toBe(12345);
      expect(result.first_name).toBe('Test User');
      expect(result.onboarding_completed).toBe(false);
      expect(result.psychological_profile).toBeDefined();
      expect(result.progress_metrics).toBeDefined();
      expect(result.preferences).toBeDefined();
    });

    test('should update existing user last active time', async () => {
      const existingUser = {
        id: 'user-123',
        telegram_id: 12345,
        first_name: 'Test User',
        subscription_tier: 'basic' as const,
        onboarding_completed: true,
        psychological_profile: {
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
        },
        progress_metrics: {
          total_sessions: 5,
          total_messages: 25,
          average_session_length: 15,
          engagement_score: 7,
          therapeutic_progress: 6,
          goal_completion_rate: 40,
          mood_improvement: 2,
          crisis_incidents: 0,
          breakthrough_moments: 1,
          insights_gained: 8,
          skills_learned: ['mindfulness'],
          relationship_quality: 7
        },
        preferences: {
          communication_frequency: 'medium' as const,
          session_length_preference: 'medium' as const,
          therapeutic_style: 'mixed' as const,
          privacy_level: 'moderate' as const,
          crisis_contact_preferences: {
            preferred_crisis_resources: ['988'],
            location_sharing: false
          },
          notification_preferences: {
            daily_check_ins: true,
            progress_updates: true,
            crisis_follow_ups: true
          }
        },
        created_at: '2024-01-01T00:00:00Z',
        last_active: '2024-01-01T00:00:00Z'
      };

      // Mock getUserByTelegramId to return existing user
      jest.spyOn(userManager, 'getUserByTelegramId').mockResolvedValue(existingUser);

      // Mock updateLastActive method
      jest.spyOn(userManager as any, 'updateLastActive').mockResolvedValue(existingUser);

      const telegramUser = {
        id: 12345,
        first_name: 'Test User',
        username: 'testuser'
      };

      const result = await userManager.createOrUpdateUser(telegramUser);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
    });
  });

  describe('updatePsychologicalProfile', () => {
    test('should update psychological profile successfully', async () => {
      const userId = 'user-123';
      const updates = {
        stress_level: 7,
        anxiety_level: 6,
        emotional_state: 'anxious'
      };

      const mockUser = {
        id: userId,
        psychological_profile: {
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
        }
      };

      // Mock getUserById
      jest.spyOn(userManager as any, 'getUserById').mockResolvedValue(mockUser);

      // Mock database update
      const mockUpsert = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: userId, ...updates },
            error: null
          })
        })
      };

      supabase.from.mockReturnValue({ upsert: () => mockUpsert });

      const result = await userManager.updatePsychologicalProfile(userId, updates);

      expect(result).toBeDefined();
      expect(result.psychological_profile.stress_level).toBe(7);
      expect(result.psychological_profile.anxiety_level).toBe(6);
      expect(result.psychological_profile.emotional_state).toBe('anxious');
    });
  });

  describe('trackSession', () => {
    test('should track session and update progress metrics', async () => {
      const userId = 'user-123';
      const sessionData = {
        duration_minutes: 20,
        message_count: 8,
        therapeutic_value: 8,
        emotional_tone: 'positive',
        crisis_detected: false,
        insights_gained: ['mindfulness technique', 'breathing exercise'],
        goals_worked_on: ['stress management']
      };

      const mockUser = {
        id: userId,
        progress_metrics: {
          total_sessions: 5,
          total_messages: 25,
          average_session_length: 15,
          engagement_score: 7,
          therapeutic_progress: 6,
          goal_completion_rate: 40,
          mood_improvement: 2,
          crisis_incidents: 0,
          breakthrough_moments: 1,
          insights_gained: 8,
          skills_learned: ['mindfulness'],
          relationship_quality: 7
        }
      };

      // Mock database operations
      jest.spyOn(userManager as any, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(userManager, 'updateProgressMetrics').mockResolvedValue(mockUser as any);

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await userManager.trackSession(userId, sessionData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          message_type: 'assistant',
          emotional_tone: 'positive',
          therapeutic_value: 8,
          key_insights: sessionData.insights_gained
        })
      );
    });
  });

  describe('generateProgressReport', () => {
    test('should generate comprehensive progress report', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        progress_metrics: {
          total_sessions: 15,
          total_messages: 75,
          average_session_length: 18,
          engagement_score: 8,
          therapeutic_progress: 7,
          goal_completion_rate: 60,
          mood_improvement: 3,
          crisis_incidents: 0,
          breakthrough_moments: 2,
          insights_gained: 25,
          skills_learned: ['mindfulness', 'breathing', 'journaling'],
          relationship_quality: 8
        },
        psychological_profile: {
          emotional_state: 'positive',
          stress_level: 4,
          anxiety_level: 3,
          depression_indicators: 2,
          resilience_score: 7,
          openness_level: 8,
          support_system_strength: 6,
          coping_mechanisms: ['mindfulness', 'exercise'],
          therapeutic_goals: ['reduce anxiety', 'improve relationships'],
          crisis_risk_level: 1,
          personality_traits: ['open', 'motivated'],
          communication_style: 'expressive',
          preferred_therapeutic_approaches: ['CBT', 'mindfulness'],
          trauma_indicators: false,
          substance_use_concerns: false
        }
      };

      const mockSessions = [
        {
          emotional_tone: 'positive',
          therapeutic_value: 8,
          key_insights: ['insight1', 'insight2'],
          agent_analysis: { goals_worked_on: ['goal1'] }
        },
        {
          emotional_tone: 'neutral',
          therapeutic_value: 6,
          key_insights: ['insight3'],
          agent_analysis: { goals_worked_on: ['goal2'] }
        }
      ];

      jest.spyOn(userManager as any, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(userManager as any, 'getRecentSessions').mockResolvedValue(mockSessions);

      const report = await userManager.generateProgressReport(userId);

      expect(report).toBeDefined();
      expect(report.user_id).toBe(userId);
      expect(report.current_metrics).toEqual(mockUser.progress_metrics);
      expect(report.psychological_profile).toEqual(mockUser.psychological_profile);
      expect(report.trends).toBeDefined();
      expect(report.insights).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.achievements).toBeInstanceOf(Array);
      expect(report.areas_for_growth).toBeInstanceOf(Array);
      expect(report.next_milestones).toBeInstanceOf(Array);
    });
  });

  describe('progress calculation methods', () => {
    test('should calculate mood trend correctly', () => {
      const sessions = [
        { emotional_tone: 'sad' },
        { emotional_tone: 'neutral' },
        { emotional_tone: 'positive' },
        { emotional_tone: 'hopeful' }
      ];

      const moodTrend = (userManager as any).calculateMoodTrend(sessions);

      expect(moodTrend).toBeDefined();
      expect(moodTrend.trend).toBe('improving');
      expect(moodTrend.change).toBeGreaterThan(0);
    });

    test('should generate insights based on user progress', () => {
      const mockUser = {
        progress_metrics: {
          therapeutic_progress: 8,
          engagement_score: 9,
          crisis_incidents: 0,
          total_sessions: 25
        }
      };

      const mockSessions = Array(25).fill({
        emotional_tone: 'positive',
        therapeutic_value: 8
      });

      const insights = (userManager as any).generateProgressInsights(mockUser, mockSessions);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some((insight: string) => 
        insight.includes('consistently engaging')
      )).toBe(true);
    });

    test('should identify achievements correctly', () => {
      const mockUser = {
        progress_metrics: {
          total_sessions: 15,
          insights_gained: 30,
          crisis_incidents: 0
        }
      };

      const mockSessions = Array(15).fill({});

      const achievements = (userManager as any).identifyAchievements(mockUser, mockSessions);

      expect(achievements).toBeInstanceOf(Array);
      expect(achievements.some((achievement: string) => 
        achievement.includes('10+ therapy sessions')
      )).toBe(true);
      expect(achievements.some((achievement: string) => 
        achievement.includes('25+ therapeutic insights')
      )).toBe(true);
    });
  });
}); 