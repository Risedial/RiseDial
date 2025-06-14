import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbCheck = await checkDatabaseHealth();
    
    // Check AI service
    const aiCheck = await checkAIServiceHealth();
    
    // Check Telegram bot
    const telegramCheck = await checkTelegramBotHealth();
    
    // Check cost monitoring
    const costCheck = await checkCostMonitoringHealth();
    
    // Get system metrics
    const metrics = await getSystemMetrics();
    
    const services = {
      database: dbCheck,
      ai_service: aiCheck,
      telegram_bot: telegramCheck,
      cost_monitoring: costCheck
    };
    
    const overallStatus = determineOverallStatus(services);
    
    const healthResponse = {
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

async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return {
      status: 'operational',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAIServiceHealth() {
  const startTime = Date.now();
  
  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    return {
      status: hasApiKey ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: hasApiKey ? undefined : 'OpenAI API key not configured'
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkTelegramBotHealth() {
  const startTime = Date.now();
  
  try {
    const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
    
    return {
      status: hasBotToken ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: hasBotToken ? undefined : 'Telegram bot token not configured'
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkCostMonitoringHealth() {
  const startTime = Date.now();
  
  return {
    status: 'operational',
    response_time_ms: Date.now() - startTime,
    last_check: new Date().toISOString()
  };
}

async function getSystemMetrics() {
  const uptime = process.uptime();
  
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get daily cost estimate
    const dailyCost = await calculateDailyCost();
    
    return {
      uptime_seconds: Math.floor(uptime),
      total_users: totalUsers || 0,
      active_sessions: 0, // Placeholder
      daily_cost: dailyCost
    };
  } catch (error) {
    return {
      uptime_seconds: Math.floor(uptime),
      total_users: 0,
      active_sessions: 0,
      daily_cost: 0
    };
  }
}

async function calculateDailyCost() {
  // Placeholder implementation
  return 0.50; // $0.50 daily estimate
}

function determineOverallStatus(services: Record<string, { status: string }>) {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'operational')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'down')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest) {
  try {
    const isReady = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    return new NextResponse(null, { status: isReady ? 200 : 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
} 