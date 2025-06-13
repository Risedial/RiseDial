// Test setup file for Jest
// This file is run before each test file

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Setup test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.ENABLE_CRISIS_DETECTION = 'true';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';

// Global test configuration
global.console = {
  ...console,
  // Uncomment to ignore console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// NOW we can safely import DatabaseUtils
import { DatabaseUtils } from '@/lib/database';

// Test database setup
const TEST_DATABASE_PREFIX = 'test_';

// Mock the database for tests
jest.mock('@/lib/database', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          data: null,
          error: null
        }),
        single: jest.fn().mockReturnValue({
          data: null,
          error: null
        }),
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
          gte: jest.fn().mockReturnValue({
            data: [],
            error: null,
            order: jest.fn().mockReturnValue({
              data: [],
              error: null
            })
          }),
          order: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: { id: 'test-id' },
            error: null
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        like: jest.fn().mockReturnValue({
          data: null,
          error: null
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'test-id' },
              error: null
            })
          })
        })
      })
    }),
    rpc: jest.fn().mockResolvedValue({ data: 0, error: null })
  };

  const mockDatabaseUtils = {
    supabase: mockSupabase,
    testConnection: jest.fn().mockResolvedValue(true),
    createUser: jest.fn().mockImplementation((userData) => 
      Promise.resolve({ ...userData, created_at: new Date().toISOString() })
    ),
    saveConversation: jest.fn().mockImplementation((conversationData) => 
      Promise.resolve({ ...conversationData, id: 'test-conversation-id', created_at: new Date().toISOString() })
    ),
    createCrisisEvent: jest.fn().mockImplementation((crisisData) => 
      Promise.resolve({ ...crisisData, id: 'test-crisis-id', created_at: new Date().toISOString() })
    ),
    updatePsychologicalProfile: jest.fn().mockImplementation((userId, profileData) => 
      Promise.resolve({ user_id: userId, ...profileData, updated_at: new Date().toISOString() })
    ),
    trackApiUsage: jest.fn().mockResolvedValue(undefined),
    getDailyCost: jest.fn().mockResolvedValue(0),
    getRecentConversations: jest.fn().mockResolvedValue([]),
    cleanExpiredSessions: jest.fn().mockResolvedValue(0),
    updateUserActivity: jest.fn().mockResolvedValue(undefined),
    getUserSession: jest.fn().mockResolvedValue(null),
    updateUserSession: jest.fn().mockImplementation((userId, sessionData) => 
      Promise.resolve({ user_id: userId, ...sessionData, last_activity: new Date().toISOString() })
    ),
    saveProgressMetric: jest.fn().mockImplementation((metricData) => 
      Promise.resolve({ ...metricData, id: 'test-metric-id', created_at: new Date().toISOString() })
    )
  };

  return {
    DatabaseUtils: jest.fn().mockImplementation(() => mockDatabaseUtils),
    supabase: mockSupabase
  };
});

const db = new DatabaseUtils();

beforeAll(async () => {
  // Initialize test database connection
  await setupTestDatabase();
  
  console.log('Test environment initialized');
});

afterAll(async () => {
  // Cleanup test data
  await cleanupTestDatabase();
  
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupTestData();
});

async function setupTestDatabase() {
  try {
    // Verify database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Test database connection failed');
    }
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    process.exit(1);
  }
}

async function cleanupTestDatabase() {
  // In a real implementation, this would clean up test-specific data
  console.log('Test database cleanup completed');
}

async function cleanupTestData() {
  // Clean up any test data created during tests
  try {
    // Since we're using mocks, these calls won't actually hit the database
    // Just log that cleanup is happening
    console.log('Cleaning up test data (mocked)');
  } catch (error) {
    console.error('Test data cleanup failed:', error);
  }
}

// Test utilities
export const testUtils = {
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      id: `${TEST_DATABASE_PREFIX}${Date.now()}`,
      telegram_id: Math.floor(Math.random() * 1000000),
      first_name: 'Test User',
      subscription_tier: 'basic' as const,
      ...userData
    };
    
    return await db.createUser(defaultUser);
  },
  
  createTestConversation: async (userId: string, messageData = {}) => {
    const defaultMessage = {
      user_id: userId,
      message_text: 'Test message',
      message_type: 'user' as const,
      crisis_risk_level: 0,
      therapeutic_value: 5,
      tokens_used: 100,
      cost_usd: 0.001,
      conversation_turn: 1,
      ...messageData
    };
    
    return await db.saveConversation(defaultMessage);
  },
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}; 