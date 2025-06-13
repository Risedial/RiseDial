import { costMonitor } from './cost-monitor';
import { costAnalytics } from './cost-analytics';
import { aiOrchestrator } from './ai-orchestrator';
import { crisisDetector } from './crisis-detection';

/**
 * Example integration of cost monitoring with the AI system
 * This shows how to use the cost monitoring system in practice
 */

export class IntegratedAIService {
  async processUserMessage(userId: string, message: string): Promise<{
    response: string;
    costInfo: any;
    limitStatus: any;
  }> {
    // 1. Check user limits BEFORE processing message
    const limitCheck = await costMonitor.checkUserLimits(userId);
    
    if (!limitCheck.allowMessage) {
      return {
        response: this.generateLimitMessage(limitCheck),
        costInfo: null,
        limitStatus: limitCheck
      };
    }

    // 2. Process message with AI orchestrator
    const startTime = Date.now();
    const aiResponse = await aiOrchestrator.processMessage(userId, message);
    const processingTime = Date.now() - startTime;

    // 3. Calculate costs (example token counting)
    const estimatedTokens = Math.ceil((message.length + aiResponse.response.length) / 4);
    const estimatedCost = this.calculateAPICost(estimatedTokens, 'gpt-4');

    // 4. Track API usage
    await costMonitor.trackAPIUsage(userId, {
      tokens_used: estimatedTokens,
      cost_usd: estimatedCost,
      model_used: 'gpt-4',
      conversation_id: aiResponse.conversationId,
      therapeutic_value: aiResponse.therapeuticValue,
      crisis_risk_level: aiResponse.crisisRisk
    });

    // 5. Get updated cost usage
    const costUsage = await costMonitor.getUserCostUsage(userId);

    return {
      response: this.formatResponse(aiResponse.response, limitCheck),
      costInfo: costUsage,
      limitStatus: limitCheck
    };
  }

  private generateLimitMessage(limitCheck: any): string {
    if (limitCheck.reason === 'daily_limit_exceeded') {
      return "You've reached your daily message limit. Your limit will reset tomorrow, or you can upgrade for more messages!";
    } else if (limitCheck.reason === 'monthly_limit_exceeded') {
      return "You've reached your monthly usage limit. Consider upgrading your plan for unlimited access!";
    }
    return "Service temporarily limited. Please try again later.";
  }

  private formatResponse(response: string, limitCheck: any): string {
    let formattedResponse = response;

    // Add upgrade prompt if needed
    if (limitCheck.upgradePrompt) {
      formattedResponse += "\n\n💡 *Tip: You're using your plan efficiently! Consider upgrading for unlimited access and premium features.*";
    }

    // Add cost alert if present
    if (limitCheck.costAlert) {
      const alert = limitCheck.costAlert;
      if (alert.level === 'warning') {
        formattedResponse += `\n\n⚠️ ${alert.message}`;
      } else if (alert.level === 'critical') {
        formattedResponse += `\n\n🚨 ${alert.message} - ${alert.suggested_action}`;
      }
    }

    return formattedResponse;
  }

  private calculateAPICost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4': 0.00003, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.000002 // $0.002 per 1K tokens
    };
    
    return (tokens / 1000) * (pricing[model] || pricing['gpt-4']);
  }

  // Admin methods for cost monitoring
  async generateAdminReport(): Promise<any> {
    const analytics = await costAnalytics.generateMonthlyAnalytics();
    const forecast = await costAnalytics.generateCostForecast(3);
    const distribution = await costAnalytics.getUserCostDistribution();
    const modelMetrics = await costAnalytics.getModelEfficiencyMetrics();

    return {
      monthly_analytics: analytics,
      cost_forecast: forecast,
      user_distribution: distribution,
      model_efficiency: modelMetrics,
      generated_at: new Date().toISOString()
    };
  }

  async checkSystemHealth(): Promise<any> {
    const analytics = await costAnalytics.generateMonthlyAnalytics();
    
    const health = {
      status: 'healthy',
      alerts: [],
      metrics: {
        profit_margin: analytics.profit_margin,
        cost_per_user: analytics.cost_per_user,
        total_users: analytics.total_users
      }
    };

    // Check for concerning metrics
    if (analytics.profit_margin < 70) {
      health.status = 'warning';
      health.alerts.push('Profit margin below target (70%)');
    }

    if (analytics.cost_per_user > 15) {
      health.status = 'critical';
      health.alerts.push('Cost per user exceeds $15 CAD target');
    }

    // Check optimization opportunities
    const highImpactOpportunities = analytics.optimization_opportunities
      .filter(opp => opp.impact === 'high' && opp.implementation_effort !== 'high');

    if (highImpactOpportunities.length > 0) {
      health.alerts.push(`${highImpactOpportunities.length} high-impact optimization opportunities available`);
    }

    return health;
  }
}

// Usage example in a Telegram bot handler
export async function handleTelegramMessage(userId: string, message: string) {
  const service = new IntegratedAIService();
  
  try {
    const result = await service.processUserMessage(userId, message);
    
    // Log cost information for monitoring
    console.log(`User ${userId} - Cost: $${result.costInfo?.cost_today?.toFixed(4)} today, ${result.costInfo?.usage_percentage?.toFixed(1)}% monthly`);
    
    return result.response;
  } catch (error) {
    console.error('Error processing message:', error);
    return "I'm having trouble right now. Please try again in a moment.";
  }
}

// Scheduled task for daily cost monitoring
export async function dailyCostMonitoringTask() {
  const service = new IntegratedAIService();
  const health = await service.checkSystemHealth();
  
  if (health.status !== 'healthy') {
    console.warn('System health alert:', health);
    // In production, this would trigger alerts to monitoring systems
  }

  // Generate and log optimization recommendations
  const report = await service.generateAdminReport();
  const opportunities = report.monthly_analytics.optimization_opportunities
    .filter(opp => opp.potential_savings > 100) // Focus on opportunities saving >$100
    .sort((a, b) => b.potential_savings - a.potential_savings);

  if (opportunities.length > 0) {
    console.log('Top cost optimization opportunities:', opportunities.slice(0, 3));
  }
} 