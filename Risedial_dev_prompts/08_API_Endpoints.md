# Prompt 8: Implement API Endpoints & Health Monitoring

## Context
You are building Risedial's API endpoints for health monitoring, administrative functions, analytics access, and integration testing. These endpoints support system monitoring, data access, and operational management.

## Required Reading
First, read these files to understand API requirements:
- `Context/project_blueprint.md` - API specifications and security requirements
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - API architecture and endpoints
- `src/lib/cost-analytics.ts` - Analytics functions (if created)
- `src/lib/user-manager.ts` - User management functions (if created)

## Task
Create comprehensive API endpoints for health checks, analytics, admin functions, and system monitoring with proper security, validation, and documentation.

## Exact Expected Outputs

### 1. Health Check Endpoint - src/api/health/route.ts
Create system health monitoring endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { costAnalytics } from '@/lib/cost-analytics';

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  const { data: sessions } = await db.supabase
    .from('active_sessions')
    .select('count')
    .gt('expires_at', new Date().toISOString());
  
  // Get total users
  const { data: users } = await db.supabase
    .from('users')
    .select('count');
  
  // Get today's total cost
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyCosts } = await db.supabase
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
```

### 2. Analytics API - src/api/analytics/route.ts
Create analytics data access endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { costAnalytics } from '@/lib/cost-analytics';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const includeForecasts = searchParams.get('forecasts') === 'true';

    let analyticsData;

    switch (period) {
      case 'monthly':
        analyticsData = await costAnalytics.generateMonthlyAnalytics();
        break;
      default:
        return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
    }

    // Add forecasts if requested
    if (includeForecasts) {
      const forecasts = await costAnalytics.generateCostForecast(3);
      analyticsData.forecasts = forecasts;
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to generate analytics'
    }, { status: 500 });
  }
}

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  
  // In production, validate JWT token or API key
  // For demo, check against environment variable
  if (token !== process.env.ANALYTICS_API_KEY) {
    return { success: false, error: 'Invalid API key' };
  }
  
  return { success: true };
}
```

### 3. User Admin API - src/api/admin/users/route.ts
Create user administration endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/lib/user-manager';
import { costMonitor } from '@/lib/cost-monitor';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const tier = searchParams.get('tier');
    const sortBy = searchParams.get('sort') || 'created_at';

    // Build query
    let query = db.supabase
      .from('users')
      .select(`
        *,
        user_psychological_profiles(stress_level, crisis_risk_level, support_system_strength)
      `)
      .order(sortBy, { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (tier) {
      query = query.eq('subscription_tier', tier);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Enrich with usage data
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const usage = await costMonitor.getUserCostUsage(user.id);
        return {
          ...user,
          usage_stats: usage
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total: enrichedUsers.length
      }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, data } = body;

    switch (action) {
      case 'update_subscription':
        return await handleSubscriptionUpdate(userId, data.tier);
      case 'reset_usage':
        return await handleUsageReset(userId);
      case 'update_profile':
        return await handleProfileUpdate(userId, data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false };
  }
  
  const token = authHeader.substring(7);
  
  // Check admin API key
  if (token !== process.env.ADMIN_API_KEY) {
    return { success: false };
  }
  
  return { success: true };
}

async function handleSubscriptionUpdate(userId: string, tier: string) {
  try {
    const { data, error } = await db.supabase
      .from('users')
      .update({ 
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${tier}`,
      data
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update subscription' 
    }, { status: 500 });
  }
}

async function handleUsageReset(userId: string) {
  try {
    const { error } = await db.supabase
      .from('users')
      .update({ 
        daily_message_count: 0,
        last_message_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Usage reset successfully'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to reset usage' 
    }, { status: 500 });
  }
}

async function handleProfileUpdate(userId: string, profileData: any) {
  try {
    const updatedProfile = await userManager.updateUserProfile(userId, profileData);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
}
```

### 4. Crisis Events API - src/api/admin/crisis/route.ts
Create crisis monitoring endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const severity = searchParams.get('severity');
    const hours = parseInt(searchParams.get('hours') || '24');

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // Build query for crisis events
    let query = db.supabase
      .from('crisis_events')
      .select(`
        *,
        users!inner(telegram_id, first_name, subscription_tier)
      `)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      switch (status) {
        case 'unresolved':
          query = query.eq('resolved', false);
          break;
        case 'resolved':
          query = query.eq('resolved', true);
          break;
        case 'escalated':
          query = query.not('escalated_to', 'is', null);
          break;
      }
    }

    if (severity) {
      const severityNum = parseInt(severity);
      query = query.gte('severity_level', severityNum);
    }

    const { data: crisisEvents, error } = await query;

    if (error) throw error;

    // Generate summary statistics
    const summary = generateCrisisSummary(crisisEvents);

    return NextResponse.json({
      success: true,
      data: crisisEvents,
      summary,
      filters: {
        status,
        severity,
        hours
      }
    });

  } catch (error) {
    console.error('Crisis API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, action, data } = body;

    switch (action) {
      case 'resolve':
        return await resolveCrisisEvent(eventId, data.notes);
      case 'escalate':
        return await escalateCrisisEvent(eventId, data.escalateTo);
      case 'update_notes':
        return await updateCrisisNotes(eventId, data.notes);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Crisis PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function generateCrisisSummary(events: any[]) {
  return {
    total_events: events.length,
    unresolved_count: events.filter(e => !e.resolved).length,
    high_severity_count: events.filter(e => e.severity_level >= 8).length,
    escalated_count: events.filter(e => e.escalated_to).length,
    avg_severity: events.length > 0 ? 
      events.reduce((sum, e) => sum + e.severity_level, 0) / events.length : 0,
    crisis_types: events.reduce((types, event) => {
      types[event.crisis_type || 'unknown'] = (types[event.crisis_type || 'unknown'] || 0) + 1;
      return types;
    }, {})
  };
}

async function resolveCrisisEvent(eventId: string, notes: string) {
  const { data, error } = await db.supabase
    .from('crisis_events')
    .update({
      resolved: true,
      resolution_notes: notes,
      resolved_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: 'Crisis event resolved',
    data
  });
}

async function escalateCrisisEvent(eventId: string, escalateTo: string) {
  const { data, error } = await db.supabase
    .from('crisis_events')
    .update({
      escalated_to: escalateTo,
      escalation_time: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: 'Crisis event escalated',
    data
  });
}

async function updateCrisisNotes(eventId: string, notes: string) {
  const { data, error } = await db.supabase
    .from('crisis_events')
    .update({
      resolution_notes: notes
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    message: 'Crisis notes updated',
    data
  });
}

async function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false };
  }
  
  const token = authHeader.substring(7);
  return { success: token === process.env.ADMIN_API_KEY };
}
```

### 5. System Status API - src/api/status/route.ts
Create comprehensive system status endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { costAnalytics } from '@/lib/cost-analytics';

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
```

## Validation Requirements
After creating all files:
1. Test health check endpoint returns accurate system status
2. Verify analytics API provides proper data with authentication
3. Test admin endpoints with proper security measures
4. Validate crisis monitoring functionality
5. Ensure proper error handling and status codes
6. Test API documentation and response formats

## Success Criteria
- [ ] Health monitoring provides accurate system status
- [ ] Analytics API delivers actionable business insights
- [ ] Admin APIs enable effective system management
- [ ] Crisis monitoring supports rapid response
- [ ] All endpoints implement proper security measures
- [ ] API responses are consistent and well-documented 