import { Bot, Context } from 'grammy';

// Simple telegram user interface for backwards compatibility
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_bot?: boolean;
}

// Create bot instance
export function createTelegramBot(token: string): Bot {
  return new Bot(token);
}

// Basic telegram bot class for backwards compatibility
export class TelegramBot {
  private bot: Bot;

  constructor(token?: string) {
    this.bot = new Bot(token || process.env.TELEGRAM_BOT_TOKEN || '');
  }

  async setupWebhook(url: string): Promise<boolean> {
    try {
      await this.bot.api.setWebhook(url, {
        max_connections: 100,
        allowed_updates: ['message', 'callback_query']
      });
      return true;
    } catch (error) {
      console.error('Failed to set webhook:', error);
      return false;
    }
  }

  async getWebhookInfo() {
    try {
      return await this.bot.api.getWebhookInfo();
    } catch (error) {
      console.error('Failed to get webhook info:', error);
      return null;
    }
  }

  async processUpdate(update: any) {
    // Basic update processing
    if (update.message) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text || '';
      
      // Simple echo for now
      await this.sendMessage(chatId, `Received: ${messageText}`);
    }
  }

  async sendMessage(chatId: number, message: string) {
    try {
      await this.bot.api.sendMessage(chatId, message);
      return { success: true };
    } catch (error) {
      console.error('Failed to send telegram message:', error);
      return { success: false, error };
    }
  }

  getBot() {
    return this.bot;
  }
}

// Export the user type for backwards compatibility
export { TelegramUser as TelegramUser };

export default TelegramBot; 