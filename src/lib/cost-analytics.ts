import { getDatabaseUtils } from './database';

interface MonthlyAnalytics {
  total_users: number;
  total_monthly_cost: number;
  cost_per_user: number;
  profit_margin: number;
  user_segments: UserSegment[];
  cost_trends: CostTrend[];
  optimization_opportunities: OptimizationOpportunity[];
  forecasts?: any[]; // Optional forecasts property
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

export class CostAnalytics {
  private db = getDatabaseUtils();

  async generateMonthlyAnalytics(): Promise<MonthlyAnalytics> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all active users and their usage
    const { data: users, error: usersError } = await this.db.supabase
      .from('users')
      .select(`
        id,
        subscription_tier,
        api_usage!inner(cost_usd, tokens_total, created_at)
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
      const userCost = user.api_usage.reduce((sum: number, usage: any) => sum + (usage.cost_usd * 1.35), 0); // Convert to CAD
      return total + userCost;
    }, 0);
  }

  private calculateTotalRevenue(users: any[]): number {
    const TIER_REVENUE: Record<string, number> = {
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
    const segments: Record<string, { users: any[]; revenue: number }> = {
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

    // Get daily aggregated data
    const { data, error } = await this.db.supabase
      .from('api_usage')
      .select(`
        created_at,
        cost_usd,
        user_id
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting cost trends:', error);
      return [];
    }

    // Group by date and aggregate
    const dailyData = new Map<string, { totalCost: number; userIds: Set<string> }>();

    data.forEach((record: { created_at: string; cost_usd: number; user_id: string }) => {
      const date = record.created_at.split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { totalCost: 0, userIds: new Set() });
      }
      const dayData = dailyData.get(date)!;
      dayData.totalCost += record.cost_usd * 1.35; // Convert to CAD
      dayData.userIds.add(record.user_id);
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        total_cost: data.totalCost,
        user_count: data.userIds.size,
        cost_per_user: data.userIds.size > 0 ? data.totalCost / data.userIds.size : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
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

    // Context compression optimization
    if (this.shouldOptimizeContextCompression(users)) {
      opportunities.push({
        category: 'Context Compression',
        potential_savings: this.estimateContextCompressionSavings(users),
        description: 'Implement more aggressive context compression for long conversations',
        implementation_effort: 'medium',
        impact: 'medium'
      });
    }

    // Cost-based conversation routing
    opportunities.push({
      category: 'Intelligent Routing',
      potential_savings: this.estimateIntelligentRoutingSavings(users),
      description: 'Route simple queries to cheaper models, complex ones to premium models',
      implementation_effort: 'high',
      impact: 'high'
    });

    return opportunities;
  }

  private calculateAverageTokenCost(users: any[]): number {
    let totalCost = 0;
    let totalTokens = 0;

    users.forEach(user => {
      user.api_usage.forEach((usage: any) => {
        totalCost += usage.cost_usd;
        totalTokens += usage.tokens_total;
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
      const userCost = user.api_usage.reduce((sum: number, usage: any) => sum + (usage.cost_usd * 1.35), 0);
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

  private shouldOptimizeContextCompression(users: any[]): boolean {
    // Check if users have long conversations that could benefit from compression
    const avgTokensPerUser = users.reduce((sum, user) => {
      const userTokens = user.api_usage.reduce((userSum: number, usage: any) => userSum + usage.tokens_total, 0);
      return sum + userTokens;
    }, 0) / users.length;

    return avgTokensPerUser > 5000; // If average user uses more than 5k tokens
  }

  private estimateContextCompressionSavings(users: any[]): number {
    const totalCost = this.calculateTotalCost(users);
    return totalCost * 0.10; // Estimate 10% savings from better context compression
  }

  private estimateIntelligentRoutingSavings(users: any[]): number {
    const totalCost = this.calculateTotalCost(users);
    return totalCost * 0.30; // Estimate 30% savings from intelligent routing
  }

  // Additional analytics methods for comprehensive insights
  async getUserCostDistribution(): Promise<any> {
    const { data, error } = await this.db.supabase
      .from('api_usage')
      .select(`
        user_id,
        cost_usd,
        users!inner(subscription_tier)
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const distribution = {
      low_cost: { count: 0, total_cost: 0, tiers: { basic: 0, premium: 0, unlimited: 0 } },
      medium_cost: { count: 0, total_cost: 0, tiers: { basic: 0, premium: 0, unlimited: 0 } },
      high_cost: { count: 0, total_cost: 0, tiers: { basic: 0, premium: 0, unlimited: 0 } }
    };

    // Group by user and calculate individual costs
    const userCosts = new Map<string, { cost: number; tier: string }>();
    data.forEach((record: { user_id: string; cost_usd: number; users?: { subscription_tier?: string } }) => {
      const userId = record.user_id;
      const cost = record.cost_usd * 1.35; // Convert to CAD
      const tier = record.users?.subscription_tier || 'basic';

      if (!userCosts.has(userId)) {
        userCosts.set(userId, { cost: 0, tier });
      }
      userCosts.get(userId)!.cost += cost;
    });

    // Categorize users
    userCosts.forEach(({ cost, tier }) => {
      if (cost < 5) {
        distribution.low_cost.count++;
        distribution.low_cost.total_cost += cost;
        (distribution.low_cost.tiers as any)[tier]++;
      } else if (cost < 15) {
        distribution.medium_cost.count++;
        distribution.medium_cost.total_cost += cost;
        (distribution.medium_cost.tiers as any)[tier]++;
      } else {
        distribution.high_cost.count++;
        distribution.high_cost.total_cost += cost;
        (distribution.high_cost.tiers as any)[tier]++;
      }
    });

    return distribution;
  }

  async getModelEfficiencyMetrics(): Promise<any> {
    const { data, error } = await this.db.supabase
      .from('api_usage')
      .select('model_used, cost_usd, tokens_total')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const modelMetrics = new Map<string, { totalCost: number; totalTokens: number; requests: number }>();

    data.forEach((record: { model_used?: string; cost_usd: number; tokens_total: number }) => {
      const model = record.model_used || 'unknown';
      if (!modelMetrics.has(model)) {
        modelMetrics.set(model, { totalCost: 0, totalTokens: 0, requests: 0 });
      }
      const metrics = modelMetrics.get(model)!;
      metrics.totalCost += record.cost_usd;
      metrics.totalTokens += record.tokens_total;
      metrics.requests++;
    });

    return Array.from(modelMetrics.entries()).map(([model, metrics]) => ({
      model,
      cost_per_token: metrics.totalTokens > 0 ? metrics.totalCost / metrics.totalTokens : 0,
      cost_per_request: metrics.requests > 0 ? metrics.totalCost / metrics.requests : 0,
      total_cost: metrics.totalCost,
      total_tokens: metrics.totalTokens,
      total_requests: metrics.requests
    }));
  }
}

export const costAnalytics = new CostAnalytics(); 