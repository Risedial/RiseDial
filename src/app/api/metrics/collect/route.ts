import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSafeSupabaseClient, canCreateSupabaseClient } from '@/lib/supabase-client';
import { isEnvironmentReady } from '@/lib/env';
import { 
  MetricsData,
  MetricsHistoryEntry,
  incrementRequestCount,
  incrementErrorCount,
  getMetricsCounts,
  addMetricsEntry,
  getRecentMetrics,
  generateAlerts
} from '@/lib/metrics-utils';

// Simple in-memory metrics store (in production, use a proper database)
const metricsHistory: MetricsHistoryEntry[] = [];
const MAX_HISTORY_SIZE = 100;

// Request tracking
let requestCount = 0;
let errorCount = 0;
let warningCount = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestLogger = logger.setRequestId(crypto.randomUUID());
  
  try {
    requestLogger.info('Starting metrics collection');
    
    // Collect comprehensive metrics
    const metrics = await collectMetrics(startTime);
    
    // Store metrics in history
    const historyEntry: MetricsHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: metrics.timestamp,
      data: metrics,
      alerts: generateAlerts(metrics)
    };
    
    addMetricsEntry(historyEntry);
    
    // Keep only recent history
    if (metricsHistory.length > MAX_HISTORY_SIZE) {
      metricsHistory.shift();
    }
    
    // Log alerts if any
    if (historyEntry.alerts.length > 0) {
      requestLogger.warn('Metrics collection generated alerts', {
        alerts: historyEntry.alerts,
        metricsId: historyEntry.id
      });
    }
    
    requestLogger.info('Metrics collection completed', {
      metricsId: historyEntry.id,
      duration: Date.now() - startTime,
      alertCount: historyEntry.alerts.length
    });
    
    return NextResponse.json({
      success: true,
      metricsId: historyEntry.id,
      timestamp: metrics.timestamp,
      alerts: historyEntry.alerts,
      summary: {
        overall: metrics.health.overall,
        responseTime: metrics.performance.responseTime,
        memoryUsage: `${Math.round(metrics.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.round(metrics.performance.uptime / 60)}min`
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-ID': historyEntry.id,
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    incrementErrorCount();
    requestLogger.error('Metrics collection failed', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Metrics collection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestLogger = logger.setRequestId(crypto.randomUUID());
  
  try {
    requestLogger.info('Retrieving metrics history');
    
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const includeData = url.searchParams.get('include_data') === 'true';
    
    const recentMetrics = getRecentMetrics(limit, includeData);
    
    requestLogger.info('Metrics history retrieved', {
      entryCount: recentMetrics.length,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json({
      success: true,
      metrics: recentMetrics,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    incrementErrorCount();
    requestLogger.error('Failed to retrieve metrics history', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metrics history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

async function collectMetrics(startTime: number): Promise<MetricsData> {
  const counts = getMetricsCounts();
  
  const metrics: MetricsData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    performance: {
      responseTime: 0,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    health: {
      overall: 'healthy',
      environment: false,
      database: false,
      supabase: false
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    application: {
      activeConnections: 0, // Would need to track this in a real app
      totalRequests: incrementRequestCount(),
      errors: counts.errors,
      warnings: counts.warnings
    }
  };

  // Add Vercel-specific metadata if available
  if (process.env.VERCEL) {
    metrics.vercel = {
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown'
    };
  }

  // Check environment
  metrics.health.environment = isEnvironmentReady();
  
  // Check Supabase
  metrics.health.supabase = canCreateSupabaseClient();
  
  // Check database connectivity
  if (metrics.health.supabase) {
    try {
      const client = getSafeSupabaseClient();
      if (client) {
        const { error } = await client.from('users').select('count').limit(1);
        metrics.health.database = !error;
      }
    } catch (error) {
      metrics.health.database = false;
    }
  }

  // Determine overall health
  const criticalChecks = [
    metrics.health.environment,
    metrics.health.supabase
  ];
  
  const allCriticalPass = criticalChecks.every(check => check === true);
  const allChecksPass = allCriticalPass && metrics.health.database;
  
  if (allChecksPass) {
    metrics.health.overall = 'healthy';
  } else if (allCriticalPass) {
    metrics.health.overall = 'degraded';
  } else {
    metrics.health.overall = 'unhealthy';
  }

  // Calculate final response time
  metrics.performance.responseTime = Date.now() - startTime;

  return metrics;
} 