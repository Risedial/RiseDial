export interface Config {
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey: string;
  };
  telegram: {
    botToken: string;
    webhookSecret: string;
  };
  openai: {
    apiKey: string;
    defaultModel: string;
    backupModel: string;
    embeddingModel: string;
  };
  costs: {
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
    alertThresholds: number[];
  };
  features: {
    enableCrisisDetection: boolean;
    enableProgressTracking: boolean;
    enableCostMonitoring: boolean;
    enableAdvancedAnalytics: boolean;
  };
  subscriptions: {
    basic: SubscriptionConfig;
    premium: SubscriptionConfig;
    unlimited: SubscriptionConfig;
  };
}

export interface SubscriptionConfig {
  dailyMessageLimit: number;
  monthlyCostLimit: number;
  features: string[];
  upgradeThreshold: number;
}

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY'
] as const;

export function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config: Config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookSecret: process.env.WEBHOOK_SECRET_TOKEN!
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'gpt-4',
    backupModel: 'gpt-3.5-turbo',
    embeddingModel: 'text-embedding-ada-002'
  },
  costs: {
    dailyLimitUsd: parseFloat(process.env.DAILY_COST_LIMIT_USD || '0.50'),
    monthlyLimitUsd: parseFloat(process.env.MONTHLY_COST_LIMIT_USD || '15.00'),
    alertThresholds: [0.7, 0.85, 0.95] // 70%, 85%, 95% of limits
  },
  features: {
    enableCrisisDetection: process.env.ENABLE_CRISIS_DETECTION === 'true',
    enableProgressTracking: process.env.ENABLE_PROGRESS_TRACKING === 'true',
    enableCostMonitoring: process.env.ENABLE_COST_MONITORING === 'true',
    enableAdvancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true'
  },
  subscriptions: {
    basic: {
      dailyMessageLimit: 15,
      monthlyCostLimit: 15.00,
      features: ['basic_chat', 'crisis_detection'],
      upgradeThreshold: 12 // messages before upgrade prompt
    },
    premium: {
      dailyMessageLimit: 50,
      monthlyCostLimit: 35.00,
      features: ['basic_chat', 'crisis_detection', 'progress_tracking', 'insights'],
      upgradeThreshold: 45
    },
    unlimited: {
      dailyMessageLimit: 1000,
      monthlyCostLimit: 75.00,
      features: ['all'],
      upgradeThreshold: 999
    }
  }
}; 