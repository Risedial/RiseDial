import { NextRequest, NextResponse } from 'next/server';
import { costAnalytics } from '@/lib/cost-analytics';
import { DatabaseUtils } from '@/lib/database';

const db = new DatabaseUtils();

export async function GET(request: NextRequest) {
  try {
    const systemStatus = await generateSystemStatus();
    
    return NextResponse.json({
      success: true,
      data: systemStatus,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate system status' 
    }, { status: 500 });
  }
}

async function generateSystemStatus() {
  // Get current analytics
  const analytics = await costAnalytics.generateMonthlyAnalytics();
  
  // Get recent activity
  const recentActivity = await getRecentActivity();
  
  // Get system performance metrics
  const performance = await getPerformanceMetrics();
  
  // Get feature status
  const features = getFeatureStatus();

  return {
    overview: {
      total_users: analytics.total_users,
      profit_margin: analytics.profit_margin,
      monthly_cost: analytics.total_monthly_cost,
      system_health: performance.overall_health
    },
    recent_activity: recentActivity,
    performance: performance,
    features: features,
    cost_optimization: {
      opportunities: analytics.optimization_opportunities,
      cost_trends: analytics.cost_trends.slice(-3),
      user_segments: analytics.user_segments
    }
  };
}

async function getRecentActivity() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Recent conversations
  const { data: conversations } = await db.supabase
    .from('conversations')
    .select('count')
    .gte('created_at', oneHourAgo.toISOString());

  // Recent users
  const { data: newUsers } = await db.supabase
    .from('users')
    .select('count')
    .gte('created_at', oneHourAgo.toISOString());

  // Recent crisis events
  const { data: crisisEvents } = await db.supabase
    .from('crisis_events')
    .select('count')
    .gte('created_at', oneHourAgo.toISOString());

  return {
    conversations_last_hour: conversations?.[0]?.count || 0,
    new_users_last_hour: newUsers?.[0]?.count || 0,
    crisis_events_last_hour: crisisEvents?.[0]?.count || 0
  };
}

async function getPerformanceMetrics() {
  // Get average response times
  const { data: responseTimes } = await db.supabase
    .from('conversations')
    .select('response_time_ms')
    .not('response_time_ms', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  const avgResponseTime = responseTimes?.length > 0 ? 
    responseTimes.reduce((sum, r) => sum + r.response_time_ms, 0) / responseTimes.length : 0;

  // System uptime
  const uptime = process.uptime();

  // Memory usage
  const memoryUsage = process.memoryUsage();

  return {
    overall_health: 'healthy',
    avg_response_time_ms: Math.round(avgResponseTime),
    uptime_hours: Math.round(uptime / 3600),
    memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    cpu_usage_percent: 0 // Would need additional monitoring in production
  };
}

function getFeatureStatus() {
  return {
    crisis_detection: {
      enabled: process.env.ENABLE_CRISIS_DETECTION === 'true',
      status: 'operational'
    },
    progress_tracking: {
      enabled: process.env.ENABLE_PROGRESS_TRACKING === 'true',
      status: 'operational'
    },
    cost_monitoring: {
      enabled: process.env.ENABLE_COST_MONITORING === 'true',
      status: 'operational'
    },
    telegram_integration: {
      enabled: !!process.env.TELEGRAM_BOT_TOKEN,
      status: 'operational'
    }
  };
} 