# Prompt 5: Implement Cost Monitoring & User Limits System

## Context
You are building Risedial's cost monitoring system that tracks API usage, enforces subscription limits, and maintains the target of <$15 CAD monthly cost per user while achieving 95%+ profit margins. This system prevents cost overruns and manages user subscription tiers.

## Required Reading
First, read these files to understand cost management requirements:
- `Context/project_blueprint.md` - Business model and cost targets
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Cost monitoring specifications
- `src/types/database.ts` - API usage and user types (if created)
- `src/lib/config.ts` - Cost configuration settings (if created)

## Task
Create a comprehensive cost monitoring system that tracks usage, enforces limits, provides analytics, generates cost forecasts, and ensures profitable operations across all subscription tiers.

## Exact Expected Outputs

### 1. Cost Monitor - src/lib/cost-monitor.ts
Create the main cost monitoring and enforcement system:

```typescript
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
  private readonly TIER_LIMITS = {
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
          tokens_used: metadata.tokens_used,
          cost_usd: metadata.cost_usd,
          cost_cad: cost_cad,
          model_used: metadata.model_used,
          conversation_id: metadata.conversation_id,
          therapeutic_value: metadata.therapeutic_value,
          crisis_risk_level: metadata.crisis_risk_level,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

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
      .select('cost_cad')
      .eq('user_id', userId)
      .gte('created_at', today)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) throw error;

    const total_cost = data?.reduce((sum, record) => sum + record.cost_cad, 0) || 0;
    const messages_count = data?.length || 0;

    return { total_cost, messages_count };
  }

  private async getMonthlyUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await db.supabase
      .from('api_usage')
      .select('cost_cad, tokens_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const total_cost = data?.reduce((sum, record) => sum + record.cost_cad, 0) || 0;
    const total_tokens = data?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;
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
```

### 2. Cost Analytics - src/lib/cost-analytics.ts
Create comprehensive cost analytics and reporting:

```typescript
import { db } from './database';

interface MonthlyAnalytics {
  total_users: number;
  total_monthly_cost: number;
  cost_per_user: number;
  profit_margin: number;
  user_segments: UserSegment[];
  cost_trends: CostTrend[];
  optimization_opportunities: OptimizationOpportunity[];
}

interface UserSegment {
  tier: string;
  user_count: number;
  average_cost: number;
  average_revenue: number;
  profit_margin: number;
  churn_risk: number;
}

interface CostTrend {
  date: string;
  total_cost: number;
  user_count: number;
  cost_per_user: number;
}

interface OptimizationOpportunity {
  category: string;
  potential_savings: number;
  description: string;
  implementation_effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

class CostAnalytics {
  async generateMonthlyAnalytics(): Promise<MonthlyAnalytics> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all active users and their usage
    const { data: users, error: usersError } = await db.supabase
      .from('users')
      .select(`
        id,
        subscription_tier,
        api_usage!inner(cost_cad, tokens_used, created_at)
      `)
      .gte('api_usage.created_at', startOfMonth.toISOString());

    if (usersError) throw usersError;

    // Calculate metrics
    const total_users = users.length;
    const total_monthly_cost = this.calculateTotalCost(users);
    const cost_per_user = total_users > 0 ? total_monthly_cost / total_users : 0;
    
    // Calculate profit margin
    const total_revenue = this.calculateTotalRevenue(users);
    const profit_margin = total_revenue > 0 ? ((total_revenue - total_monthly_cost) / total_revenue) * 100 : 0;

    // Generate user segments analysis
    const user_segments = this.analyzeUserSegments(users);

    // Get cost trends (last 30 days)
    const cost_trends = await this.generateCostTrends();

    // Identify optimization opportunities
    const optimization_opportunities = this.identifyOptimizationOpportunities(users, cost_trends);

    return {
      total_users,
      total_monthly_cost,
      cost_per_user,
      profit_margin,
      user_segments,
      cost_trends,
      optimization_opportunities
    };
  }

  async generateCostForecast(months: number = 3): Promise<any[]> {
    const trends = await this.generateCostTrends();
    const recentTrends = trends.slice(-14); // Last 14 days

    if (recentTrends.length === 0) {
      return [];
    }

    // Calculate growth rates
    const costGrowthRate = this.calculateGrowthRate(recentTrends.map(t => t.total_cost));
    const userGrowthRate = this.calculateGrowthRate(recentTrends.map(t => t.user_count));

    const forecasts = [];
    let lastCost = recentTrends[recentTrends.length - 1].total_cost;
    let lastUserCount = recentTrends[recentTrends.length - 1].user_count;

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Apply growth rates with some variance
      lastCost *= (1 + costGrowthRate);
      lastUserCount *= (1 + userGrowthRate);

      forecasts.push({
        month: forecastDate.toISOString().slice(0, 7),
        forecast_cost: lastCost,
        forecast_users: Math.round(lastUserCount),
        forecast_cost_per_user: lastUserCount > 0 ? lastCost / lastUserCount : 0,
        confidence: Math.max(0.5, 0.9 - (i * 0.15)) // Decreasing confidence over time
      });
    }

    return forecasts;
  }

  private calculateTotalCost(users: any[]): number {
    return users.reduce((total, user) => {
      const userCost = user.api_usage.reduce((sum: number, usage: any) => sum + usage.cost_cad, 0);
      return total + userCost;
    }, 0);
  }

  private calculateTotalRevenue(users: any[]): number {
    const TIER_REVENUE = {
      basic: 9.99,
      premium: 19.99,
      unlimited: 39.99
    };

    return users.reduce((total, user) => {
      const tier = user.subscription_tier || 'basic';
      return total + (TIER_REVENUE[tier] || TIER_REVENUE.basic);
    }, 0);
  }

  private analyzeUserSegments(users: any[]): UserSegment[] {
    const segments = {
      basic: { users: [], revenue: 9.99 },
      premium: { users: [], revenue: 19.99 },
      unlimited: { users: [], revenue: 39.99 }
    };

    // Group users by tier
    users.forEach(user => {
      const tier = user.subscription_tier || 'basic';
      if (segments[tier]) {
        segments[tier].users.push(user);
      }
    });

    // Calculate metrics for each segment
    return Object.entries(segments).map(([tier, segment]) => {
      const user_count = segment.users.length;
      const total_cost = this.calculateTotalCost(segment.users);
      const average_cost = user_count > 0 ? total_cost / user_count : 0;
      const total_revenue = user_count * segment.revenue;
      const profit_margin = total_revenue > 0 ? ((total_revenue - total_cost) / total_revenue) * 100 : 0;

      return {
        tier,
        user_count,
        average_cost,
        average_revenue: segment.revenue,
        profit_margin,
        churn_risk: this.calculateChurnRisk(tier, average_cost, segment.revenue)
      };
    });
  }

  private calculateChurnRisk(tier: string, cost: number, revenue: number): number {
    // Higher churn risk if costs are high relative to revenue
    const costRatio = cost / revenue;
    
    if (costRatio > 0.8) return 0.8; // High risk
    if (costRatio > 0.6) return 0.6; // Medium risk
    if (costRatio > 0.4) return 0.4; // Low-medium risk
    return 0.2; // Low risk
  }

  private async generateCostTrends(): Promise<CostTrend[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await db.supabase
      .rpc('get_daily_cost_trends', {
        start_date: thirtyDaysAgo.toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error getting cost trends:', error);
      return [];
    }

    return data.map((row: any) => ({
      date: row.date,
      total_cost: parseFloat(row.total_cost),
      user_count: parseInt(row.user_count),
      cost_per_user: parseFloat(row.cost_per_user)
    }));
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];
    
    if (first === 0) return 0;
    
    return (last - first) / first / values.length; // Daily growth rate
  }

  private identifyOptimizationOpportunities(users: any[], trends: CostTrend[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze token efficiency
    const avgTokenCost = this.calculateAverageTokenCost(users);
    if (avgTokenCost > 0.002) { // $0.002 per token threshold
      opportunities.push({
        category: 'Token Optimization',
        potential_savings: this.estimateTokenOptimizationSavings(users),
        description: 'Optimize prompt engineering and context management to reduce token usage',
        implementation_effort: 'medium',
        impact: 'high'
      });
    }

    // Analyze model usage efficiency
    const modelUsage = this.analyzeModelUsage(users);
    if (modelUsage.gpt4_percentage > 60) {
      opportunities.push({
        category: 'Model Selection',
        potential_savings: this.estimateModelOptimizationSavings(users),
        description: 'Use GPT-3.5-turbo for routine conversations, reserve GPT-4 for complex cases',
        implementation_effort: 'low',
        impact: 'high'
      });
    }

    // Analyze user tier optimization
    const tierAnalysis = this.analyzeUserTierOptimization(users);
    if (tierAnalysis.upgrade_potential > 0) {
      opportunities.push({
        category: 'User Tier Optimization',
        potential_savings: tierAnalysis.revenue_potential,
        description: 'Encourage high-usage basic users to upgrade to premium tiers',
        implementation_effort: 'low',
        impact: 'medium'
      });
    }

    return opportunities;
  }

  private calculateAverageTokenCost(users: any[]): number {
    let totalCost = 0;
    let totalTokens = 0;

    users.forEach(user => {
      user.api_usage.forEach((usage: any) => {
        totalCost += usage.cost_cad;
        totalTokens += usage.tokens_used;
      });
    });

    return totalTokens > 0 ? totalCost / totalTokens : 0;
  }

  private estimateTokenOptimizationSavings(users: any[]): number {
    const totalCost = this.calculateTotalCost(users);
    return totalCost * 0.15; // Estimate 15% savings from token optimization
  }

  private analyzeModelUsage(users: any[]): any {
    let gpt4Count = 0;
    let totalCount = 0;

    users.forEach(user => {
      user.api_usage.forEach((usage: any) => {
        totalCount++;
        if (usage.model_used?.includes('gpt-4')) {
          gpt4Count++;
        }
      });
    });

    return {
      gpt4_percentage: totalCount > 0 ? (gpt4Count / totalCount) * 100 : 0,
      total_requests: totalCount
    };
  }

  private estimateModelOptimizationSavings(users: any[]): number {
    const totalCost = this.calculateTotalCost(users);
    return totalCost * 0.25; // Estimate 25% savings from better model selection
  }

  private analyzeUserTierOptimization(users: any[]): any {
    let upgradeCandidate = 0;
    let potentialRevenue = 0;

    users.forEach(user => {
      const tier = user.subscription_tier || 'basic';
      const userCost = user.api_usage.reduce((sum: number, usage: any) => sum + usage.cost_cad, 0);
      const usageCount = user.api_usage.length;

      // Identify upgrade candidates
      if (tier === 'basic' && (usageCount > 12 || userCost > 6)) {
        upgradeCandidate++;
        potentialRevenue += 10; // Premium tier difference
      } else if (tier === 'premium' && (usageCount > 40 || userCost > 15)) {
        upgradeCandidate++;
        potentialRevenue += 20; // Unlimited tier difference
      }
    });

    return {
      upgrade_potential: upgradeCandidate,
      revenue_potential: potentialRevenue
    };
  }
}

export const costAnalytics = new CostAnalytics();
```

## Validation Requirements
After creating all files:
1. Test cost monitoring enforces limits correctly for all subscription tiers
2. Verify API usage tracking captures accurate token and cost data
3. Test analytics generation provides actionable business insights
4. Validate cost forecasting produces reasonable projections
5. Ensure optimization recommendations are practical and implementable
6. Test integration with user management and billing systems

## Success Criteria
- [ ] Cost monitoring maintains <$15 CAD monthly cost per user across all tiers
- [ ] System enforces subscription limits without degrading user experience
- [ ] Analytics provide actionable insights for cost optimization
- [ ] Forecasting helps with capacity planning and budget management
- [ ] Optimization opportunities identified lead to measurable cost reductions
- [ ] Real-time cost tracking prevents unexpected overages 