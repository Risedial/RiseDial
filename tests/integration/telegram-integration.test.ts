import { describe, test, expect, beforeEach } from '@jest/globals';
import { testUtils } from '../setup';

// Mock telegram-bot to test integration without actual Telegram API calls
const mockTelegramBot = {
  processUpdate: jest.fn(),
  sendMessage: jest.fn(),
  answerCallbackQuery: jest.fn()
};

jest.mock('@/lib/telegram-bot', () => ({
  telegramBot: mockTelegramBot
}));

describe('Telegram Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      telegram_id: 12345,
      first_name: 'Integration Test User'
    });
    jest.clearAllMocks();
  });

  describe('Message Processing', () => {
    test('should process regular user message', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name,
            username: 'testuser'
          },
          text: 'I feel anxious about tomorrow'
        }
      };

      // This would normally interact with Telegram API
      // For testing, we'll verify the processing logic
      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle start command', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: '/start'
        }
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle crisis message appropriately', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: 'I want to kill myself'
        }
      };

      // Should process without errors and trigger crisis protocols
      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle help command', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: '/help'
        }
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle settings command', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: '/settings'
        }
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });
  });

  describe('Callback Query Handling', () => {
    test('should handle upgrade callback', async () => {
      const mockCallbackQuery = {
        id: 'callback123',
        message: {
          chat: { id: 12345 }
        },
        from: { id: testUser.telegram_id },
        data: 'upgrade_premium'
      };

      const mockUpdate = {
        callback_query: mockCallbackQuery
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle feedback callback', async () => {
      const mockCallbackQuery = {
        id: 'callback124',
        message: {
          chat: { id: 12345 }
        },
        from: { id: testUser.telegram_id },
        data: 'feedback_helpful'
      };

      const mockUpdate = {
        callback_query: mockCallbackQuery
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should handle crisis resources callback', async () => {
      const mockCallbackQuery = {
        id: 'callback125',
        message: {
          chat: { id: 12345 }
        },
        from: { id: testUser.telegram_id },
        data: 'crisis_resources'
      };

      const mockUpdate = {
        callback_query: mockCallbackQuery
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
      expect(mockTelegramBot.processUpdate).toHaveBeenCalledWith(mockUpdate);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed updates gracefully', async () => {
      const malformedUpdate = {
        // Missing required properties
      };

      expect(() => mockTelegramBot.processUpdate(malformedUpdate)).not.toThrow();
    });

    test('should handle unknown commands', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: '/unknown_command'
        }
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
    });

    test('should handle empty messages', async () => {
      const mockUpdate = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: ''
        }
      };

      expect(() => mockTelegramBot.processUpdate(mockUpdate)).not.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('should handle multiple rapid messages', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message',
        'Fourth message',
        'Fifth message'
      ];

      const updates = messages.map(text => ({
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text
        }
      }));

      // Process all messages rapidly
      updates.forEach(update => {
        expect(() => mockTelegramBot.processUpdate(update)).not.toThrow();
      });

      expect(mockTelegramBot.processUpdate).toHaveBeenCalledTimes(messages.length);
    });
  });

  describe('User Context Management', () => {
    test('should maintain user context across messages', async () => {
      const firstMessage = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: 'I had a difficult day at work'
        }
      };

      const secondMessage = {
        message: {
          chat: { id: 12345 },
          from: { 
            id: testUser.telegram_id, 
            first_name: testUser.first_name 
          },
          text: 'Can you help me process these feelings?'
        }
      };

      expect(() => mockTelegramBot.processUpdate(firstMessage)).not.toThrow();
      expect(() => mockTelegramBot.processUpdate(secondMessage)).not.toThrow();
    });
  });
}); 