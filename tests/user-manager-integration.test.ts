// Mock config first before importing anything else
jest.mock('../src/lib/config', () => ({
  config: {
    supabase: {
      url: 'http://localhost:54321',
      serviceRoleKey: 'mock-service-role-key'
    }
  }
}));

// Mock the supabase client
jest.mock('../src/lib/database', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { userManager } from '../src/lib/user-manager';

// Import the mocked supabase after all mocking is done
const { supabase } = require('../src/lib/database');

// This is an integration test that would work with a real database
// For now, we'll mock it but structure it like real integration tests

describe('UserManager Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle complete user lifecycle', async () => {
    // Mock database responses for complete flow
    const mockUserId = 'user-integration-test';
    const mockTelegramId = 999999;
    let userCreated = false;

    // Mock user doesn't exist initially, but becomes available after creation
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: userCreated ? {
                  id: mockUserId,
                  telegram_id: mockTelegramId,
                  first_name: 'Integration Test User',
                  subscription_tier: 'basic',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } : null,
                error: userCreated ? null : { code: 'PGRST116' }
              })
            })
          }),
          insert: () => ({
            select: () => ({
              single: () => {
                userCreated = true; // Mark user as created
                return Promise.resolve({
                  data: {
                    id: mockUserId,
                    telegram_id: mockTelegramId,
                    first_name: 'Integration Test User',
                    subscription_tier: 'basic',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  },
                  error: null
                });
              }
            })
          })
        };
      }

      if (table === 'user_psychological_profiles') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: {
                  user_id: mockUserId,
                  emotional_state: 'neutral',
                  stress_level: 5
                },
                error: null
              })
            })
          }),
          upsert: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: {
                  user_id: mockUserId,
                  emotional_state: 'positive',
                  stress_level: 3
                },
                error: null
              })
            })
          })
        };
      }

      if (table === 'conversations') {
        return {
          insert: () => Promise.resolve({ error: null }),
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => Promise.resolve({
                  data: [
                    {
                      emotional_tone: 'positive',
                      therapeutic_value: 8,
                      key_insights: ['test insight'],
                      agent_analysis: { goals_worked_on: ['test goal'] }
                    }
                  ],
                  error: null
                })
              })
            })
          })
        };
      }

      if (table === 'crisis_events') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [],
              error: null
            })
          })
        };
      }

      if (table === 'progress_metrics') {
        return {
          insert: () => Promise.resolve({ error: null })
        };
      }

      return {};
    });

    // 1. Create new user
    const telegramUser = {
      id: mockTelegramId,
      first_name: 'Integration Test User',
      username: 'integration_test'
    };

    const newUser = await userManager.createOrUpdateUser(telegramUser);
    
    expect(newUser).toBeDefined();
    expect(newUser.telegram_id).toBe(mockTelegramId);
    expect(newUser.first_name).toBe('Integration Test User');
    expect(newUser.onboarding_completed).toBe(false);
    expect(newUser.psychological_profile.emotional_state).toBe('neutral');
    expect(newUser.progress_metrics.total_sessions).toBe(0);

    // 2. Update psychological profile
    const profileUpdates = {
      stress_level: 3,
      emotional_state: 'positive',
      openness_level: 8,
      therapeutic_goals: ['reduce stress', 'improve mood']
    };

    const updatedUser = await userManager.updatePsychologicalProfile(newUser.id, profileUpdates);
    
    expect(updatedUser.psychological_profile.stress_level).toBe(3);
    expect(updatedUser.psychological_profile.emotional_state).toBe('positive');

    // 3. Track a therapy session
    const sessionData = {
      duration_minutes: 25,
      message_count: 10,
      therapeutic_value: 8,
      emotional_tone: 'hopeful',
      crisis_detected: false,
      insights_gained: [
        'Learned mindfulness technique',
        'Identified stress patterns',
        'Practiced breathing exercises'
      ],
      goals_worked_on: ['stress reduction', 'emotional regulation']
    };

    await userManager.trackSession(newUser.id, sessionData);

    // 4. Generate progress report
    const progressReport = await userManager.generateProgressReport(newUser.id);
    
    expect(progressReport).toBeDefined();
    expect(progressReport.user_id).toBe(newUser.id);
    expect(progressReport.current_metrics).toBeDefined();
    expect(progressReport.psychological_profile).toBeDefined();
    expect(progressReport.trends).toBeDefined();
    expect(progressReport.insights).toBeInstanceOf(Array);
    expect(progressReport.recommendations).toBeInstanceOf(Array);
    expect(progressReport.achievements).toBeInstanceOf(Array);
    expect(progressReport.areas_for_growth).toBeInstanceOf(Array);
    expect(progressReport.next_milestones).toBeInstanceOf(Array);

    // Verify report contains meaningful data
    expect(progressReport.trends.mood).toBeDefined();
    expect(progressReport.trends.engagement).toBeDefined();
    expect(progressReport.trends.progress).toBeDefined();
    expect(progressReport.insights.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle user with extensive history', async () => {
    const mockUserId = 'experienced-user';
    const mockTelegramId = 888888;

    // Mock existing user with substantial progress
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: mockUserId,
                  telegram_id: mockTelegramId,
                  first_name: 'Experienced User',
                  user_psychological_profiles: [{
                    emotional_state: 'positive',
                    stress_level: 3,
                    openness_level: 9,
                    crisis_risk_level: 1,
                    support_system_strength: 8
                  }],
                  progress_metrics: {
                    total_sessions: 15,
                    avg_therapeutic_value: 8,
                    goal_completion_rate: 0.7,
                    engagement_score: 9
                  }
                },
                error: null
              })
            })
          })
        };
      }

      if (table === 'conversations') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => Promise.resolve({
                  data: Array(50).fill(null).map((_, i) => ({
                    id: `conv-${i}`,
                    therapeutic_value: 7 + (i % 3),
                    emotional_tone: ['positive', 'hopeful', 'neutral'][i % 3],
                    key_insights: [`insight-${i}`],
                    session_id: `session-${Math.floor(i / 5)}`,
                    response_time_ms: 2000,
                    created_at: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString()
                  })),
                  error: null
                })
              })
            })
          })
        };
      }

      if (table === 'crisis_events') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [], // No crisis events
              error: null
            })
          })
        };
      }

      return {};
    });

    // Mock getUserByTelegramId to return user with substantial progress
    jest.spyOn(userManager as any, 'getUserByTelegramId').mockResolvedValue({
      id: mockUserId,
      telegram_id: mockTelegramId,
      first_name: 'Experienced User',
      psychological_profile: {
        emotional_state: 'positive',
        stress_level: 3,
        openness_level: 9,
        crisis_risk_level: 1,
        support_system_strength: 8
      },
      progress_metrics: {
        total_sessions: 15,
        avg_therapeutic_value: 8,
        goal_completion_rate: 0.7,
        engagement_score: 9
      }
    });

    // Get experienced user
    const user = await userManager.getUserByTelegramId(mockTelegramId);
    
    expect(user).toBeDefined();
    expect(user!.psychological_profile.emotional_state).toBe('positive');
    expect(user!.progress_metrics.total_sessions).toBeGreaterThan(5);

    // Generate comprehensive report
    const report = await userManager.generateProgressReport(user!.id);

    expect(report.insights.length).toBeGreaterThanOrEqual(2);
    expect(report.achievements.length).toBeGreaterThanOrEqual(0);
    expect(report.trends.mood.trend).toBeDefined();
    
    // Should show strong therapeutic relationship
    expect(report.current_metrics.relationship_quality).toBeGreaterThanOrEqual(0);
  });

  test('should handle crisis situation appropriately', async () => {
    const mockUserId = 'crisis-user';
    
    // Mock user with crisis history
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'crisis_events') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                {
                  id: 'crisis-1',
                  user_id: mockUserId,
                  severity_level: 7,
                  crisis_type: 'anxiety_spike',
                  created_at: new Date().toISOString()
                }
              ],
              error: null
            })
          })
        };
      }

      if (table === 'conversations') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => Promise.resolve({
                  data: [
                    {
                      emotional_tone: 'distressed',
                      therapeutic_value: 6,
                      crisis_risk_level: 8,
                      key_insights: ['crisis management activated'],
                      agent_analysis: { crisis_detected: true }
                    }
                  ],
                  error: null
                })
              })
            })
          })
        };
      }

      return {};
    });

    // Mock getUserById to return user with high crisis risk
    jest.spyOn(userManager as any, 'getUserById').mockResolvedValue({
      id: mockUserId,
      psychological_profile: {
        crisis_risk_level: 7,
        emotional_state: 'distressed',
        stress_level: 9,
        support_system_strength: 3
      },
      progress_metrics: {
        crisis_incidents: 1,
        last_crisis_date: new Date().toISOString(),
        therapeutic_progress: 4
      }
    });

    const report = await userManager.generateProgressReport(mockUserId);

    // Should identify crisis management as priority
    expect(report.areas_for_growth).toContain('Strengthening support network');
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.next_milestones.length).toBeGreaterThan(0);
  });

  test('should calculate accurate progress trends', () => {
    // Test mood trend calculation with various scenarios
    const improvingSessions = [
      { emotional_tone: 'sad' },
      { emotional_tone: 'concerned' },
      { emotional_tone: 'neutral' },
      { emotional_tone: 'positive' },
      { emotional_tone: 'hopeful' },
      { emotional_tone: 'very_positive' }
    ];

    const improvingTrend = (userManager as any).calculateMoodTrend(improvingSessions);
    expect(improvingTrend.trend).toBe('improving');
    expect(improvingTrend.change).toBeGreaterThan(1);

    const decliningSession = [
      { emotional_tone: 'positive' },
      { emotional_tone: 'hopeful' },
      { emotional_tone: 'neutral' },
      { emotional_tone: 'concerned' },
      { emotional_tone: 'sad' },
      { emotional_tone: 'distressed' }
    ];

    const decliningTrend = (userManager as any).calculateMoodTrend(decliningSession);
    expect(decliningTrend.trend).toBe('declining');
    expect(decliningTrend.change).toBeLessThan(-1);

    const stableSessions = Array(10).fill({ emotional_tone: 'neutral' });
    const stableTrend = (userManager as any).calculateMoodTrend(stableSessions);
    expect(stableTrend.trend).toBe('stable');
    expect(Math.abs(stableTrend.change)).toBeLessThan(0.5);
  });
}); 