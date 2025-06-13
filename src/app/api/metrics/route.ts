import { NextRequest, NextResponse } from 'next/server';
import { getSafeSupabaseClient, canCreateSupabaseClient } from '@/lib/supabase-client';
import { isEnvironmentReady } from '@/lib/env';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    performance: {
      responseTime: 0,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    health: {
      status: 'unknown',
      environment: false,
      database: false,
      supabase: false
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    counts: {
      activeConnections: 0,
      totalRequests: 0,
      errors: 0
    }
  };

  try {
    // Environment check
    metrics.health.environment = isEnvironmentReady();
    
    // Supabase check
    metrics.health.supabase = canCreateSupabaseClient();
    
    // Database connectivity check
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

    // Overall health status
    const allChecksPass = metrics.health.environment && 
                         metrics.health.supabase && 
                         metrics.health.database;
    
    metrics.health.status = allChecksPass ? 'healthy' : 'degraded';
    
    // Calculate response time
    metrics.performance.responseTime = Date.now() - startTime;

    return NextResponse.json(metrics, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${metrics.performance.responseTime}ms`
      }
    });

  } catch (error) {
    metrics.health.status = 'unhealthy';
    metrics.performance.responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...metrics,
      error: `Metrics collection failed: ${error}`
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${metrics.performance.responseTime}ms`
      }
    });
  }
} 