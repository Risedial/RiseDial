# Telegram Bot Setup Guide for Risedial

## Prerequisites
- Telegram account
- Access to BotFather on Telegram
- Vercel deployment ready to receive webhooks

## Step 1: Create Telegram Bot

1. **Start Chat with BotFather**
   ```
   1. Open Telegram
   2. Search for "@BotFather"
   3. Start a conversation: /start
   ```

2. **Create New Bot**
   ```
   Send: /newbot
   
   BotFather will ask:
   - Bot name: "Risedial - Personal Growth Companion"
   - Bot username: risedial_bot (or risedial_dev_bot for development)
   
   ✅ You'll receive a token like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

3. **Save Bot Token Securely**
   ```bash
   # Add to your .env.local file
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   
   # Add to Vercel environment variables
   # Vercel Dashboard > Project > Settings > Environment Variables
   ```

## Step 2: Configure Bot Settings

1. **Set Bot Description**
   ```
   Send to BotFather: /setdescription
   Select your bot
   
   Description:
   "Your AI companion for personal growth and development. I remember everything we discuss and provide thoughtful, supportive guidance whenever you need it. Available 24/7 for meaningful conversations about life, goals, challenges, and growth."
   ```

2. **Set About Text**
   ```
   Send: /setabouttext
   Select your bot
   
   About:
   "Personal Growth AI Companion - Supportive conversations for life transformation"
   ```

3. **Set Commands Menu**
   ```
   Send: /setcommands
   Select your bot
   
   Commands:
   start - Begin your personal growth journey
   help - Learn how to use Risedial
   profile - View your progress summary
   reset - Start a fresh conversation
   feedback - Share your experience
   support - Get help and resources
   ```

4. **Configure Bot Settings**
   ```
   # Enable inline mode (optional)
   Send: /setinline
   Select your bot
   Enable: Yes
   
   # Set bot picture (optional)
   Send: /setuserpic
   Select your bot
   Upload a profile picture
   
   # Privacy settings
   Send: /setprivacy
   Select your bot
   Set to: Disabled (bot can read all messages in groups)
   ```

## Step 3: Webhook Configuration

1. **Create Webhook Endpoint**
   ```typescript
   // api/telegram-webhook.ts
   import { NextApiRequest, NextApiResponse } from 'next';
   import crypto from 'crypto';
   
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     // Verify webhook is from Telegram
     const token = process.env.TELEGRAM_BOT_TOKEN!;
     const secretPath = crypto.createHash('sha256').update(token).digest('hex');
     
     if (req.headers['x-telegram-bot-api-secret-token'] !== secretPath) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
   
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }
   
     try {
       const update = req.body;
       console.log('Telegram update received:', JSON.stringify(update, null, 2));
       
       if (update.message) {
         await processMessage(update.message);
       }
       
       res.status(200).json({ ok: true });
     } catch (error) {
       console.error('Webhook error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   }
   
   async function processMessage(message: any) {
     // Process the message (implement your logic here)
     console.log('Processing message:', message);
   }
   ```

2. **Set Webhook URL**
   ```bash
   # Method 1: Using curl
   curl -X POST \
     "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-app.vercel.app/api/telegram-webhook",
       "secret_token": "<YOUR_SECRET_TOKEN>",
       "allowed_updates": ["message", "callback_query"],
       "drop_pending_updates": true
     }'
   
   # Method 2: Using Node.js script
   ```

3. **Webhook Setup Script**
   ```typescript
   // scripts/setup-webhook.ts
   import fetch from 'node-fetch';
   import crypto from 'crypto';
   
   async function setupWebhook() {
     const botToken = process.env.TELEGRAM_BOT_TOKEN!;
     const webhookUrl = process.env.WEBHOOK_URL!; // https://your-app.vercel.app/api/telegram-webhook
     const secretToken = crypto.createHash('sha256').update(botToken).digest('hex');
   
     const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         url: webhookUrl,
         secret_token: secretToken,
         allowed_updates: ['message', 'callback_query'],
         drop_pending_updates: true
       })
     });
   
     const result = await response.json();
     console.log('Webhook setup result:', result);
   
     if (result.ok) {
       console.log('✅ Webhook configured successfully');
     } else {
       console.error('❌ Webhook setup failed:', result.description);
     }
   }
   
   setupWebhook();
   ```

## Step 4: Telegram API Integration

1. **Install Dependencies**
   ```bash
   npm install node-telegram-bot-api @types/node-telegram-bot-api
   ```

2. **Create Telegram Client**
   ```typescript
   // lib/telegram-client.ts
   import TelegramBot from 'node-telegram-bot-api';
   
   class TelegramClient {
     private bot: TelegramBot;
   
     constructor() {
       this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
         polling: false // Use webhooks instead of polling
       });
     }
   
     async sendMessage(chatId: number, text: string, options: any = {}) {
       try {
         const defaultOptions = {
           parse_mode: 'Markdown',
           disable_web_page_preview: true,
           ...options
         };
   
         return await this.bot.sendMessage(chatId, text, defaultOptions);
       } catch (error) {
         console.error('Error sending message:', error);
         throw error;
       }
     }
   
     async sendTyping(chatId: number) {
       try {
         await this.bot.sendChatAction(chatId, 'typing');
       } catch (error) {
         console.error('Error sending typing indicator:', error);
       }
     }
   
     async deleteMessage(chatId: number, messageId: number) {
       try {
         await this.bot.deleteMessage(chatId, messageId);
       } catch (error) {
         console.error('Error deleting message:', error);
       }
     }
   
     async sendInlineKeyboard(chatId: number, text: string, keyboard: any[][]) {
       const options = {
         reply_markup: {
           inline_keyboard: keyboard
         }
       };
       
       return await this.sendMessage(chatId, text, options);
     }
   
     // Handle callback queries (inline button presses)
     async answerCallbackQuery(callbackQueryId: string, text?: string) {
       try {
         await this.bot.answerCallbackQuery(callbackQueryId, { text });
       } catch (error) {
         console.error('Error answering callback query:', error);
       }
     }
   }
   
   export const telegramClient = new TelegramClient();
   ```

3. **Message Processing Utils**
   ```typescript
   // lib/telegram-utils.ts
   
   export interface TelegramMessage {
     message_id: number;
     from: {
       id: number;
       is_bot: boolean;
       first_name: string;
       last_name?: string;
       username?: string;
       language_code?: string;
     };
     chat: {
       id: number;
       first_name: string;
       last_name?: string;
       username?: string;
       type: string;
     };
     date: number;
     text?: string;
   }
   
   export function extractUserInfo(message: TelegramMessage) {
     return {
       telegramId: message.from.id,
       firstName: message.from.first_name,
       lastName: message.from.last_name,
       username: message.from.username,
       languageCode: message.from.language_code,
       chatId: message.chat.id
     };
   }
   
   export function isCommand(text: string): boolean {
     return text.startsWith('/');
   }
   
   export function parseCommand(text: string): { command: string; args: string[] } {
     const parts = text.split(' ');
     const command = parts[0].substring(1); // Remove '/' prefix
     const args = parts.slice(1);
     
     return { command, args };
   }
   
   export function sanitizeText(text: string): string {
     // Remove potentially harmful characters
     return text
       .replace(/[<>&"']/g, '')
       .trim()
       .substring(0, 4000); // Telegram message limit
   }
   
   export function formatErrorMessage(error: string): string {
     return `❌ Oops! Something went wrong: ${error}\n\nPlease try again or contact support if the issue persists.`;
   }
   
   export function formatSuccessMessage(message: string): string {
     return `✅ ${message}`;
   }
   ```

## Step 5: Command Handlers

1. **Basic Command Router**
   ```typescript
   // lib/command-handlers.ts
   import { telegramClient } from './telegram-client';
   import { TelegramMessage, parseCommand } from './telegram-utils';
   
   export class CommandHandler {
     private commands: Map<string, (message: TelegramMessage, args: string[]) => Promise<void>>;
   
     constructor() {
       this.commands = new Map([
         ['start', this.handleStart.bind(this)],
         ['help', this.handleHelp.bind(this)],
         ['profile', this.handleProfile.bind(this)],
         ['reset', this.handleReset.bind(this)],
         ['feedback', this.handleFeedback.bind(this)],
         ['support', this.handleSupport.bind(this)]
       ]);
     }
   
     async handleCommand(message: TelegramMessage) {
       const { command, args } = parseCommand(message.text!);
       const handler = this.commands.get(command);
   
       if (handler) {
         await handler(message, args);
       } else {
         await this.handleUnknownCommand(message);
       }
     }
   
     private async handleStart(message: TelegramMessage) {
       const welcomeText = `
   🌟 *Welcome to Risedial!* 🌟
   
   I'm your personal AI companion, here to support your growth journey. I'll remember everything we discuss and provide thoughtful guidance whenever you need it.
   
   🤗 *What makes me different:*
   • I remember all our conversations
   • I adapt to your unique communication style
   • I'm available 24/7 for meaningful discussions
   • I focus on your personal growth and well-being
   
   💬 *Just start chatting!* Tell me about your day, your goals, or anything on your mind. I'm here to listen and help.
   
   Type /help to see what I can do, or simply start a conversation!
       `;
   
       await telegramClient.sendMessage(message.chat.id, welcomeText);
     }
   
     private async handleHelp(message: TelegramMessage) {
       const helpText = `
   🆘 *How to use Risedial*
   
   💬 *Regular Conversation:*
   Just chat with me naturally! Tell me about:
   • Your daily experiences and feelings
   • Goals you're working toward
   • Challenges you're facing
   • Questions about personal growth
   
   🎯 *Commands:*
   /start - Welcome message and introduction
   /help - Show this help message
   /profile - View your progress summary
   /reset - Start a fresh conversation
   /feedback - Share your experience with us
   /support - Get help and emergency resources
   
   ⚡ *Tips for best results:*
   • Be open and honest in our conversations
   • Share specific details about your situations
   • Let me know what kind of support you need
   • Regular check-ins help me understand you better
   
   🔒 *Privacy:* Your conversations are private and secure. I'm here to support, not judge.
       `;
   
       await telegramClient.sendMessage(message.chat.id, helpText);
     }
   
     private async handleProfile(message: TelegramMessage) {
       // TODO: Implement profile summary
       const profileText = `
   📊 *Your Risedial Profile*
   
   🎯 Coming soon! I'm working on creating a beautiful summary of your growth journey.
   
   For now, know that I remember every conversation we've had and I'm tracking your progress behind the scenes.
   
   Keep chatting with me regularly and I'll have more insights to share with you soon!
       `;
   
       await telegramClient.sendMessage(message.chat.id, profileText);
     }
   
     private async handleReset(message: TelegramMessage) {
       const keyboard = [
         [
           { text: '✅ Yes, start fresh', callback_data: 'reset_confirm' },
           { text: '❌ Cancel', callback_data: 'reset_cancel' }
         ]
       ];
   
       const resetText = `
   🔄 *Reset Conversation*
   
   Are you sure you want to start a fresh conversation? This will:
   
   ⚠️ Clear our current conversation context
   ✅ Keep your progress and insights safe
   🔄 Give us a clean slate to chat
   
   Your historical data and growth tracking will be preserved.
       `;
   
       await telegramClient.sendInlineKeyboard(message.chat.id, resetText, keyboard);
     }
   
     private async handleFeedback(message: TelegramMessage) {
       const feedbackText = `
   💝 *Share Your Feedback*
   
   I'd love to hear about your experience! Please tell me:
   
   📝 *Simply reply with your thoughts about:*
   • How helpful our conversations have been
   • What you'd like me to improve
   • Features you'd love to see
   • Your overall experience rating (1-10)
   
   Your feedback helps me become a better companion for everyone! 🌟
       `;
   
       await telegramClient.sendMessage(message.chat.id, feedbackText);
     }
   
     private async handleSupport(message: TelegramMessage) {
       const supportText = `
   🆘 *Support & Resources*
   
   🔗 *Emergency Resources:*
   • Crisis Text Line: Text HOME to 741741
   • National Suicide Prevention Lifeline: 988
   • Emergency Services: 911
   
   💬 *For Risedial Support:*
   • Email: support@risedial.com
   • Describe your issue in detail
   • Include your Telegram username
   
   📚 *Remember:*
   I'm an AI companion for personal growth, not a replacement for professional medical or mental health care. For serious concerns, please contact appropriate professionals.
   
   💙 You matter, and help is always available.
       `;
   
       await telegramClient.sendMessage(message.chat.id, supportText);
     }
   
     private async handleUnknownCommand(message: TelegramMessage) {
       const unknownText = `
   🤔 I don't recognize that command.
   
   Type /help to see available commands, or just chat with me naturally!
       `;
   
       await telegramClient.sendMessage(message.chat.id, unknownText);
     }
   }
   
   export const commandHandler = new CommandHandler();
   ```

## Step 6: Testing & Validation

1. **Test Bot Manually**
   ```bash
   # Steps to test:
   1. Deploy your webhook endpoint to Vercel
   2. Set up the webhook using the script above
   3. Send messages to your bot on Telegram
   4. Check Vercel logs for webhook calls
   5. Verify responses from your bot
   ```

2. **Webhook Verification Script**
   ```typescript
   // scripts/test-webhook.ts
   import fetch from 'node-fetch';
   
   async function testWebhook() {
     const botToken = process.env.TELEGRAM_BOT_TOKEN!;
     
     // Get webhook info
     const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
     const webhookInfo = await response.json();
     
     console.log('Webhook Info:', JSON.stringify(webhookInfo, null, 2));
     
     if (webhookInfo.result.url) {
       console.log('✅ Webhook is configured');
       console.log('URL:', webhookInfo.result.url);
       console.log('Pending updates:', webhookInfo.result.pending_update_count);
     } else {
       console.log('❌ Webhook not configured');
     }
   }
   
   testWebhook();
   ```

3. **Message Testing Checklist**
   ```typescript
   // Test cases to validate:
   const testCases = [
     { input: '/start', expected: 'Welcome message with instructions' },
     { input: '/help', expected: 'Help text with commands and tips' },
     { input: 'Hello', expected: 'Conversational response' },
     { input: 'I want to hurt myself', expected: 'Crisis detection triggered' },
     { input: '/unknown', expected: 'Unknown command message' },
     { input: 'Very long message...', expected: 'Proper handling of long text' }
   ];
   ```

## Step 7: Production Considerations

1. **Rate Limiting**
   ```typescript
   // lib/rate-limiter.ts
   const userMessageCounts = new Map<number, { count: number; resetTime: number }>();
   
   export function checkRateLimit(userId: number, maxMessages = 30, windowMs = 60000): boolean {
     const now = Date.now();
     const userLimits = userMessageCounts.get(userId);
     
     if (!userLimits || now > userLimits.resetTime) {
       userMessageCounts.set(userId, { count: 1, resetTime: now + windowMs });
       return true;
     }
     
     if (userLimits.count >= maxMessages) {
       return false;
     }
     
     userLimits.count++;
     return true;
   }
   ```

2. **Error Handling**
   ```typescript
   // lib/error-handler.ts
   export async function handleTelegramError(error: any, chatId: number) {
     console.error('Telegram error:', error);
     
     if (error.code === 'ETELEGRAM') {
       if (error.response?.body?.error_code === 403) {
         console.log(`User ${chatId} blocked the bot`);
         return;
       }
       
       if (error.response?.body?.error_code === 429) {
         console.log('Rate limited by Telegram API');
         return;
       }
     }
     
     // Send generic error message
     try {
       await telegramClient.sendMessage(
         chatId,
         'Sorry, I encountered a technical issue. Please try again in a moment.'
       );
     } catch (retryError) {
       console.error('Failed to send error message:', retryError);
     }
   }
   ```

3. **Monitoring Setup**
   ```typescript
   // lib/telegram-monitoring.ts
   export function logTelegramMetrics(event: string, data: any) {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       event,
       data,
       source: 'telegram-bot'
     }));
   }
   
   // Usage in webhook handler:
   logTelegramMetrics('message_received', {
     userId: message.from.id,
     messageLength: message.text?.length,
     command: isCommand(message.text || '') ? parseCommand(message.text!).command : null
   });
   ```

## Environment Variables Checklist

```bash
# Required environment variables:
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
WEBHOOK_URL=https://your-app.vercel.app/api/telegram-webhook
WEBHOOK_SECRET_TOKEN=your-secret-token

# Add to both .env.local and Vercel environment variables
```

## Troubleshooting

**Common Issues:**
- **Webhook not receiving messages**: Check webhook URL, verify HTTPS, check Vercel logs
- **403 Forbidden**: User blocked the bot or bot lacks permissions
- **429 Too Many Requests**: Implement rate limiting, space out API calls
- **Message too long**: Telegram has 4096 character limit per message
- **Invalid parse mode**: Check Markdown syntax in messages

**Debug Commands:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Delete webhook (for testing)
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Get bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

## Security Checklist
- [ ] Bot token secured in environment variables
- [ ] Webhook secret token implemented
- [ ] Rate limiting enabled
- [ ] Input validation on all messages
- [ ] Error handling doesn't leak sensitive information
- [ ] Webhook endpoint validates requests from Telegram
- [ ] Bot permissions properly configured 