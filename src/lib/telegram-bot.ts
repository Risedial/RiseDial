import TelegramBotAPI from 'node-telegram-bot-api';
import { config } from './config';
import { userManager } from './user-manager';
import { sessionManager } from './session-manager';
import { aiOrchestrator } from './ai-orchestrator';
import { costMonitor } from './cost-monitor';
import { safetyProtocols } from './safety-protocols';
import { db } from './database';

export class TelegramBot {
  private bot: TelegramBotAPI;

  constructor() {
    this.bot = new TelegramBotAPI(config.telegram.botToken, { polling: false });
  }

  async processUpdate(update: any) {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('Error processing update:', error);
    }
  }

  private async handleMessage(message: any) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const userMessage = message.text;

    try {
      // Handle commands
      if (userMessage?.startsWith('/')) {
        await this.handleCommand(chatId, userId, userMessage, message.from);
        return;
      }

      // Regular message processing
      await this.processUserMessage(chatId, userId, userMessage, message.from);
      
    } catch (error) {
      console.error('Error handling message:', error);
      await this.sendErrorMessage(chatId);
    }
  }

  private async handleCommand(chatId: number, userId: number, command: string, from: any) {
    const cmd = command.split(' ')[0].toLowerCase();

    switch (cmd) {
      case '/start':
        await this.handleStartCommand(chatId, userId, from);
        break;
      case '/help':
        await this.sendHelpMessage(chatId);
        break;
      case '/status':
        await this.sendStatusMessage(chatId, userId);
        break;
      case '/upgrade':
        await this.handleUpgradeCommand(chatId, userId);
        break;
      case '/progress':
        await this.sendProgressReport(chatId, userId);
        break;
      default:
        await this.sendMessage(chatId, "I don't recognize that command. Type /help for available commands.");
    }
  }

  private async handleStartCommand(chatId: number, userId: number, from: any) {
    // Create or update user
    const user = await userManager.createOrUpdateUser({
      id: userId,
      telegram_id: userId,
      username: from.username,
      first_name: from.first_name
    });

    const welcomeMessage = `Hello ${user.first_name || 'there'}! 👋

I'm Risedial, your AI therapeutic companion. I'm here to support your personal growth and well-being through meaningful conversations.

🌟 *What I can help with:*
• Process emotions and thoughts
• Explore personal challenges
• Develop coping strategies  
• Track your progress over time
• Provide crisis support when needed

💭 *How to get started:*
Just start sharing what's on your mind. I'll listen without judgment and offer thoughtful responses to help you gain insights and move forward.

🛡️ *Your safety matters:*
If you're ever in crisis, I can connect you with immediate professional support. Your conversations are private and secure.

Ready to begin? What would you like to talk about today?`;

    await this.sendMessage(chatId, welcomeMessage);
  }

  private async sendHelpMessage(chatId: number) {
    const helpMessage = `🤖 *Risedial Commands*

*Basic Commands:*
/start - Begin or restart our conversation
/help - Show this help message
/status - Check your usage and subscription
/progress - View your therapeutic progress
/upgrade - Upgrade your subscription

*How to Use:*
• Simply send me a message about anything on your mind
• I'll respond with therapeutic support and insights
• Our conversations build on each other over time
• I track your progress and growth patterns

*Crisis Support:*
If you're having thoughts of self-harm or suicide, I'll immediately provide crisis resources and connect you with professional help.

*Subscription Tiers:*
• Basic: 15 messages/day
• Premium: 50 messages/day + advanced features
• Unlimited: Unlimited messages + priority support

Questions? Just ask me anything!`;

    await this.sendMessage(chatId, helpMessage);
  }

  private async sendStatusMessage(chatId: number, userId: number) {
    try {
      const usage = await costMonitor.getUserCostUsage(userId.toString());
      const user = await userManager.getUserByTelegramId(userId);
      
      const statusMessage = `📊 *Your Risedial Status*

*Subscription:* ${user?.subscription_tier || 'Basic'} tier
*Usage Today:* ${15 - usage.daily_remaining}/15 messages
*Monthly Usage:* ${usage.usage_percentage.toFixed(1)}% of limit
*Cost This Month:* $${usage.monthly_cost.toFixed(2)}

*Progress Tracking:* ${user?.psychological_profile ? '✅ Active' : '⏳ Building profile'}
*Crisis Detection:* ✅ Active
*Support Level:* ${user?.psychological_profile?.support_system_strength || 5}/10

${usage.usage_percentage > 85 ? '⚠️ Approaching monthly limit - consider upgrading!' : ''}`;

      await this.sendMessage(chatId, statusMessage);
      
      if (usage.usage_percentage > 85) {
        await this.sendUpgradePrompt(chatId, userId);
      }
      
    } catch (error) {
      await this.sendMessage(chatId, "Sorry, I couldn't retrieve your status right now. Please try again later.");
    }
  }

  private async processUserMessage(chatId: number, userId: number, userMessage: string, from: any) {
    // Check safety protocols first
    const context = await sessionManager.buildMessageContext(userId.toString());
    const safetyCheck = await safetyProtocols.validateMessageSafety(userMessage, context);
    
    // Check user limits
    const limitCheck = await costMonitor.checkUserLimits(userId.toString());
    
    if (!limitCheck.allowMessage) {
      await this.handleLimitExceeded(chatId, userId, limitCheck);
      return;
    }

    // Show typing indicator
    await this.bot.sendChatAction(chatId, 'typing');

    try {
      // Generate AI response
      const aiResponse = await aiOrchestrator.generateResponse(userMessage, context);
      
      // Handle crisis situations
      if (!safetyCheck.isSafe || aiResponse.crisis_risk_level >= 8) {
        await this.handleCrisisResponse(chatId, aiResponse);
        return;
      }

      // Send normal therapeutic response
      await this.sendTherapeuticResponse(chatId, aiResponse);
      
      // Save conversation
      await this.saveConversation(userId, userMessage, aiResponse);
      
      // Update session
      await sessionManager.incrementMessageCount(context.sessionId!);
      
      // Show upgrade prompt if needed
      if (limitCheck.upgradePrompt) {
        await this.sendUpgradePrompt(chatId, userId);
      }

    } catch (error) {
      console.error('Error processing user message:', error);
      await this.sendErrorMessage(chatId);
    }
  }

  private async handleCrisisResponse(chatId: number, aiResponse: any) {
    const crisisMessage = `🚨 *I'm concerned about your safety*

${aiResponse.companion_response}

*Immediate Help Available:*
🆘 Emergency: 911
📞 Crisis Lifeline: 988
💬 Text Support: Text HOME to 741741

These resources are available 24/7 and staffed by trained professionals who understand what you're going through.

Please reach out to one of these resources right now. You don't have to face this alone.`;

    await this.sendMessage(chatId, crisisMessage);
    
    // Create inline keyboard for immediate actions
    const keyboard = {
      inline_keyboard: [
        [{ text: "🆘 Call 911", url: "tel:911" }],
        [{ text: "📞 Crisis Lifeline", url: "tel:988" }],
        [{ text: "💬 Crisis Text Line", url: "sms:741741&body=HOME" }],
        [{ text: "🌐 Online Resources", url: "https://suicidepreventionlifeline.org" }]
      ]
    };

    await this.bot.sendMessage(chatId, "Click any option below for immediate help:", {
      reply_markup: keyboard
    });
  }

  private async sendTherapeuticResponse(chatId: number, aiResponse: any) {
    let message = aiResponse.companion_response;
    
    // Add technique indicators if relevant
    if (aiResponse.therapeutic_techniques?.length > 0) {
      const techniques = aiResponse.therapeutic_techniques.slice(0, 2).join(', ');
      message += `\n\n💡 *Approach: ${techniques}*`;
    }
    
    // Add progress indicators
    if (aiResponse.key_insights?.length > 0) {
      const insight = aiResponse.key_insights[0];
      message += `\n\n🔍 *Insight: ${insight}*`;
    }

    await this.sendMessage(chatId, message);
  }

  private async handleLimitExceeded(chatId: number, userId: number, limitCheck: any) {
    if (limitCheck.reason === 'monthly_limit_exceeded') {
      const message = `📊 You've reached your monthly message limit for the ${limitCheck.costAlert?.current_usage}% tier.

To continue our conversations, you can:
• Upgrade to Premium (50 messages/day)
• Upgrade to Unlimited (unlimited messages)
• Wait until next month for limit reset

Your progress and conversation history are always saved.`;

      await this.sendMessage(chatId, message);
      await this.sendUpgradePrompt(chatId, userId);
    }
  }

  private async sendUpgradePrompt(chatId: number, userId: number) {
    const upgradeMessage = await this.generateUpgradeMessage(userId);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: "⭐ Upgrade to Premium", callback_data: "upgrade_premium" },
          { text: "🚀 Upgrade to Unlimited", callback_data: "upgrade_unlimited" }
        ],
        [{ text: "📊 View Current Usage", callback_data: "view_usage" }]
      ]
    };

    await this.bot.sendMessage(chatId, upgradeMessage, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  private async generateUpgradeMessage(userId: number): Promise<string> {
    const usage = await costMonitor.getUserCostUsage(userId.toString());
    
    return `✨ *Upgrade Your Risedial Experience*

*Current Usage:* ${usage.usage_percentage.toFixed(1)}% of monthly limit

*Premium Benefits:*
• 50 messages per day (vs 15)
• Advanced progress tracking
• Detailed therapeutic insights
• Priority crisis support

*Unlimited Benefits:*
• Unlimited daily messages
• All premium features
• Priority support response
• Advanced AI models

Ready to unlock your full potential?`;
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    await this.bot.answerCallbackQuery(callbackQuery.id);

    switch (data) {
      case 'upgrade_premium':
        await this.processUpgrade(chatId, userId, 'premium');
        break;
      case 'upgrade_unlimited':
        await this.processUpgrade(chatId, userId, 'unlimited');
        break;
      case 'view_usage':
        await this.sendStatusMessage(chatId, userId);
        break;
    }
  }

  private async processUpgrade(chatId: number, userId: number, tier: 'premium' | 'unlimited') {
    // In a real implementation, this would integrate with payment processing
    // For now, we'll simulate the upgrade
    
    const upgradeMessage = `🎉 *Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Initiated*

In a production environment, you would be redirected to a secure payment portal.

For this demonstration, your upgrade has been simulated successfully!

*New Benefits Active:*
${tier === 'premium' ? 
  '• 50 messages per day\n• Advanced progress tracking\n• Detailed insights' :
  '• Unlimited messages\n• All premium features\n• Priority support'
}

Continue our conversation anytime!`;

    await this.sendMessage(chatId, upgradeMessage);
  }

  private async saveConversation(userId: number, userMessage: string, aiResponse: any) {
    // Save user message
    await db.saveConversation({
      user_id: userId.toString(),
      message_text: userMessage,
      message_type: 'user',
      crisis_risk_level: aiResponse.crisis_risk_level,
      therapeutic_value: 0,
      tokens_used: 0,
      cost_usd: 0,
      conversation_turn: 1
    });

    // Save assistant response
    await db.saveConversation({
      user_id: userId.toString(),
      message_text: aiResponse.companion_response,
      message_type: 'assistant',
      emotional_tone: aiResponse.emotional_tone,
      confidence_level: aiResponse.confidence_level,
      crisis_risk_level: aiResponse.crisis_risk_level,
      therapeutic_value: aiResponse.therapeutic_value,
      key_insights: aiResponse.key_insights,
      agent_analysis: aiResponse.agent_analysis,
      therapeutic_techniques_used: aiResponse.therapeutic_techniques,
      tokens_used: aiResponse.response_metadata.tokens_used,
      cost_usd: aiResponse.response_metadata.cost_usd,
      conversation_turn: 2,
      response_time_ms: aiResponse.response_metadata.response_time_ms
    });
  }

  private async sendProgressReport(chatId: number, userId: number) {
    try {
      const progress = await userManager.generateProgressReport(userId.toString());
      
      const reportMessage = `📈 *Your Therapeutic Progress*

*Overall Trend:* ${this.formatTrend(progress.trends.progress.trend)}

*Growth Areas:*
${progress.areas_for_growth.slice(0, 3).map((area: string) => 
  `• ${area}`
).join('\n') || '• Building baseline measurements'}

*Recent Insights:* ${progress.insights.length} key insights identified
*Achievements:* ${progress.achievements.length} milestones reached
*Next Goals:* ${progress.next_milestones.length} objectives planned

Keep up the great work! 🌟`;

      await this.sendMessage(chatId, reportMessage);
    } catch (error) {
      await this.sendMessage(chatId, "I'm still building your progress profile. Keep chatting with me to see your growth over time!");
    }
  }

  private formatTrend(trend: string): string {
    const icons: {[key: string]: string} = {
      improving: '📈 Improving',
      stable: '➡️ Stable',
      declining: '📉 Needs attention'
    };
    return icons[trend] || '➡️ Building data';
  }

  private async sendMessage(chatId: number, text: string, options?: any) {
    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        ...options
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to plain text if markdown fails
      await this.bot.sendMessage(chatId, text.replace(/\*/g, ''));
    }
  }

  private async sendErrorMessage(chatId: number) {
    const errorMessage = `I'm having a brief technical difficulty. Please try again in a moment.

If you're in crisis and need immediate help:
🆘 Emergency: 911
📞 Crisis Lifeline: 988

I'll be back to support you shortly! 💙`;

    await this.sendMessage(chatId, errorMessage);
  }

  async setupWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const result = await this.bot.setWebHook(webhookUrl, {
        secret_token: config.telegram.webhookSecret,
        allowed_updates: ['message', 'callback_query']
      });
      
      console.log('Webhook setup result:', result);
      return result;
    } catch (error) {
      console.error('Webhook setup failed:', error);
      return false;
    }
  }

  async getWebhookInfo() {
    return await this.bot.getWebHookInfo();
  }

  private async handleUpgradeCommand(chatId: number, userId: number) {
    await this.sendUpgradePrompt(chatId, userId);
  }
}

export const telegramBot = new TelegramBot(); 