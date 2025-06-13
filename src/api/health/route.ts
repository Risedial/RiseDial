import { NextRequest, NextResponse } from 'next/server';
import { DatabaseUtils, supabase } from '@/lib/database';
import { costAnalytics } from '@/lib/cost-analytics';

const db = new DatabaseUtils();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceStatus;
    ai_service: ServiceStatus;
    telegram_bot: ServiceStatus;
    cost_monitoring: ServiceStatus;
  };
  metrics: {
    uptime_seconds: number;
    total_users: number;
    active_sessions: number;
    daily_cost: number;
    response_time_ms: number;
  };
  version: string;
}

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  response_time_ms: number;
  last_check: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbCheck = await checkDatabaseHealth();
    
    // Check AI service (mock check)
    const aiCheck = await checkAIServiceHealth();
    
    // Check Telegram bot status
    const telegramCheck = await checkTelegramBotHealth();
    
    // Check cost monitoring
    const costCheck = await checkCostMonitoringHealth();
    
    // Get system metrics
    const metrics = await getSystemMetrics();
    
    // Determine overall system status
    const services = {
      database: dbCheck,
      ai_service: aiCheck,
      telegram_bot: telegramCheck,
      cost_monitoring: costCheck
    };
    
    const overallStatus = determineOverallStatus(services);
    
    const healthResponse: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        ...metrics,
        response_time_ms: Date.now() - startTime
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;
    
    return NextResponse.json(healthResponse, { status: statusCode });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      response_time_ms: Date.now() - startTime
    }, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const isConnected = await db.testConnection();
    
    return {
      status: isConnected ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkAIServiceHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // In a real implementation, this would test OpenAI API connectivity
    // For now, we'll simulate a successful check
    
    return {
      status: 'operational',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkTelegramBotHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Check if Telegram bot token is configured
    const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
    
    return {
      status: hasBotToken ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: hasBotToken ? undefined : 'Bot token not configured'
    };
  } catch (error: any) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkCostMonitoringHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Test cost analytics functionality
    const analytics = await costAnalytics.generateMonthlyAnalytics();
    
    return {
      status: analytics ? 'operational' : 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function getSystemMetrics() {
  const uptime = process.uptime();
  
  // Get active sessions count
  const { data: sessions } = await supabase
    .from('active_sessions')
    .select('count')
    .gt('expires_at', new Date().toISOString());
  
  // Get total users
  const { data: users } = await supabase
    .from('users')
    .select('count');
  
  // Get today's total cost
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyCosts } = await supabase
    .from('api_usage')
    .select('cost_usd')
    .gte('created_at', today);
  
  const dailyCost = dailyCosts?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;
  
  return {
    uptime_seconds: Math.floor(uptime),
    total_users: users?.[0]?.count || 0,
    active_sessions: sessions?.[0]?.count || 0,
    daily_cost: dailyCost
  };
}

function determineOverallStatus(services: Record<string, ServiceStatus>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'operational')) {
    return 'healthy';
  }
  
  if (statuses.some(status => status === 'down')) {
    return 'unhealthy';
  }
  
  return 'degraded';
} 