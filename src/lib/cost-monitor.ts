import { db } from './database';

interface CostUsage {
  daily_remaining: number;
  monthly_cost: number;
  usage_percentage: number;
  tier_limit: number;
  messages_today: number;
  cost_today: number;
  forecast_monthly: number;
}

interface CostAlert {
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  current_usage: number;
  threshold: number;
  suggested_action: string;
}

interface LimitCheck {
  allowMessage: boolean;
  reason?: string;
  costAlert?: CostAlert;
  upgradePrompt: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
}

class CostMonitor {
  private readonly TIER_LIMITS: Record<string, {
    daily_messages: number;
    monthly_cost_target: number;
    monthly_cost_limit: number;
    revenue: number;
  }> = {
    basic: {
      daily_messages: 15,
      monthly_cost_target: 8.00, // CAD
      monthly_cost_limit: 10.00, // CAD
      revenue: 9.99 // CAD
    },
    premium: {
      daily_messages: 50,
      monthly_cost_target: 12.00, // CAD
      monthly_cost_limit: 15.00, // CAD
      revenue: 19.99 // CAD
    },
    unlimited: {
      daily_messages: 999,
      monthly_cost_target: 15.00, // CAD
      monthly_cost_limit: 18.00, // CAD
      revenue: 39.99 // CAD
    }
  };

  async checkUserLimits(userId: string): Promise<LimitCheck> {
    try {
      // Get user subscription tier
      const user = await this.getUserInfo(userId);
      const tier = user.subscription_tier || 'basic';
      const limits = this.TIER_LIMITS[tier];

      // Check daily message limit
      const dailyUsage = await this.getDailyUsage(userId);
      const dailyRemaining = Math.max(0, limits.daily_messages - dailyUsage.messages_count);

      // Check monthly cost limit
      const monthlyUsage = await this.getMonthlyUsage(userId);
      const monthlyRemaining = Math.max(0, limits.monthly_cost_limit - monthlyUsage.total_cost);

      // Determine if message is allowed
      const allowMessage = dailyRemaining > 0 && monthlyRemaining > 0.01; // $0.01 minimum

      // Generate cost alert if approaching limits
      const costAlert = await this.generateCostAlert(userId, tier, monthlyUsage);

      // Determine if upgrade prompt should be shown
      const upgradePrompt = this.shouldShowUpgradePrompt(tier, dailyUsage, monthlyUsage);

      return {
        allowMessage,
        reason: !allowMessage ? this.getDenialReason(dailyRemaining, monthlyRemaining) : undefined,
        costAlert,
        upgradePrompt,
        dailyRemaining,
        monthlyRemaining
      };

    } catch (error) {
      console.error('Error checking user limits:', error);
      // Fail open for critical service
      return {
        allowMessage: true,
        upgradePrompt: false,
        dailyRemaining: 999,
        monthlyRemaining: 999
      };
    }
  }

  async trackAPIUsage(userId: string, metadata: {
    tokens_used: number;
    cost_usd: number;
    model_used: string;
    conversation_id?: string;
    therapeutic_value?: number;
    crisis_risk_level?: number;
  }): Promise<void> {
    try {
      // Convert USD to CAD (approximate rate: 1.35)
      const cost_cad = metadata.cost_usd * 1.35;

      // Save API usage record
      const { error } = await db.supabase
        .from('api_usage')
        .insert({
          user_id: userId,
          tokens_input: Math.floor(metadata.tokens_used * 0.6), // Estimate input tokens
          tokens_output: Math.floor(metadata.tokens_used * 0.4), // Estimate output tokens
          tokens_total: metadata.tokens_used,
          cost_usd: metadata.cost_usd,
          model_used: metadata.model_used,
          api_provider: 'openai',
          request_type: 'chat_completion',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update conversation record with cost data
      if (metadata.conversation_id) {
        await db.supabase
          .from('conversations')
          .update({
            tokens_used: metadata.tokens_used,
            cost_usd: metadata.cost_usd,
            therapeutic_value: metadata.therapeutic_value || 0,
            crisis_risk_level: metadata.crisis_risk_level || 0
          })
          .eq('id', metadata.conversation_id);
      }

      // Update user daily counters
      await this.updateDailyCounters(userId, cost_cad);

      // Check for cost alerts
      await this.checkCostAlerts(userId);

    } catch (error) {
      console.error('Error tracking API usage:', error);
      // Log but don't fail the request
    }
  }

  async getUserCostUsage(userId: string): Promise<CostUsage> {
    const user = await this.getUserInfo(userId);
    const tier = user.subscription_tier || 'basic';
    const limits = this.TIER_LIMITS[tier];

    const dailyUsage = await this.getDailyUsage(userId);
    const monthlyUsage = await this.getMonthlyUsage(userId);

    const daily_remaining = Math.max(0, limits.daily_messages - dailyUsage.messages_count);
    const usage_percentage = (monthlyUsage.total_cost / limits.monthly_cost_limit) * 100;
    const forecast_monthly = this.calculateMonthlyForecast(monthlyUsage);

    return {
      daily_remaining,
      monthly_cost: monthlyUsage.total_cost,
      usage_percentage,
      tier_limit: limits.monthly_cost_limit,
      messages_today: dailyUsage.messages_count,
      cost_today: dailyUsage.total_cost,
      forecast_monthly
    };
  }

  private async getUserInfo(userId: string) {
    const { data, error } = await db.supabase
      .from('users')
      .select('subscription_tier, daily_message_count, last_message_date')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getDailyUsage(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await db.supabase
      .from('api_usage')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('created_at', today)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) throw error;

    const total_cost = (data?.reduce((sum, record) => sum + record.cost_usd, 0) || 0) * 1.35; // Convert to CAD
    const messages_count = data?.length || 0;

    return { total_cost, messages_count };
  }

  private async getMonthlyUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await db.supabase
      .from('api_usage')
      .select('cost_usd, tokens_total')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const total_cost = (data?.reduce((sum, record) => sum + record.cost_usd, 0) || 0) * 1.35; // Convert to CAD
    const total_tokens = data?.reduce((sum, record) => sum + record.tokens_total, 0) || 0;
    const total_messages = data?.length || 0;

    return { total_cost, total_tokens, total_messages };
  }

  private async updateDailyCounters(userId: string, costCad: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current user data
    const user = await this.getUserInfo(userId);
    const lastMessageDate = user.last_message_date?.split('T')[0];
    
    let newDailyCount = 1;
    
    // If last message was today, increment counter
    if (lastMessageDate === today) {
      newDailyCount = (user.daily_message_count || 0) + 1;
    }

    // Update user counters
    const { error } = await db.supabase
      .from('users')
      .update({
        daily_message_count: newDailyCount,
        last_message_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  private async generateCostAlert(userId: string, tier: string, monthlyUsage: any): Promise<CostAlert | undefined> {
    const limits = this.TIER_LIMITS[tier];
    const usagePercentage = (monthlyUsage.total_cost / limits.monthly_cost_limit) * 100;

    if (usagePercentage >= 95) {
      return {
        level: 'emergency',
        message: 'Monthly cost limit exceeded! Service may be limited.',
        current_usage: usagePercentage,
        threshold: 95,
        suggested_action: 'Upgrade subscription or wait for monthly reset'
      };
    } else if (usagePercentage >= 80) {
      return {
        level: 'critical',
        message: 'Approaching monthly cost limit',
        current_usage: usagePercentage,
        threshold: 80,
        suggested_action: 'Consider upgrading to avoid service interruption'
      };
    } else if (usagePercentage >= 60) {
      return {
        level: 'warning',
        message: 'Moderate usage detected',
        current_usage: usagePercentage,
        threshold: 60,
        suggested_action: 'Monitor usage or consider upgrading for better value'
      };
    }

    return undefined;
  }

  private shouldShowUpgradePrompt(tier: string, dailyUsage: any, monthlyUsage: any): boolean {
    const limits = this.TIER_LIMITS[tier];
    const usagePercentage = (monthlyUsage.total_cost / limits.monthly_cost_limit) * 100;

    // Show upgrade prompt if approaching limits or frequently hitting daily limits
    return usagePercentage > 70 || dailyUsage.messages_count >= limits.daily_messages * 0.8;
  }

  private getDenialReason(dailyRemaining: number, monthlyRemaining: number): string {
    if (dailyRemaining <= 0) {
      return 'daily_limit_exceeded';
    } else if (monthlyRemaining <= 0) {
      return 'monthly_limit_exceeded';
    }
    return 'unknown_limit_exceeded';
  }

  private calculateMonthlyForecast(monthlyUsage: any): number {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    
    if (dayOfMonth <= 1) return monthlyUsage.total_cost;
    
    const dailyAverage = monthlyUsage.total_cost / dayOfMonth;
    return dailyAverage * daysInMonth;
  }

  private async checkCostAlerts(userId: string): Promise<void> {
    const usage = await this.getUserCostUsage(userId);
    
    // Log cost alerts for monitoring
    if (usage.usage_percentage > 80) {
      console.warn(`High cost usage for user ${userId}: ${usage.usage_percentage.toFixed(1)}%`);
    }

    // In production, this would trigger alerts to monitoring systems
  }
}

export const costMonitor = new CostMonitor(); 