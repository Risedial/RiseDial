import { NextRequest, NextResponse } from 'next/server';
import { canCreateSupabaseClient, getSafeSupabaseClient } from '@/lib/supabase-client';
import { isEnvironmentReady } from '@/lib/env';

export async function GET(request: NextRequest) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    checks: {
      environment: false,
      database: false,
      supabase: false
    },
    errors: [] as string[],
    warnings: [] as string[]
  };

  try {
    // Check environment configuration
    healthCheck.checks.environment = isEnvironmentReady();
    if (!healthCheck.checks.environment) {
      healthCheck.errors.push('Environment variables not properly configured');
    }

    // Check Supabase client creation
    healthCheck.checks.supabase = canCreateSupabaseClient();
    if (!healthCheck.checks.supabase) {
      healthCheck.errors.push('Cannot create Supabase client');
    }

    // Test database connection if possible
    if (healthCheck.checks.supabase) {
      try {
        const client = getSafeSupabaseClient();
        if (client) {
          // Simple test query
          const { error } = await client.from('users').select('count').limit(1);
          healthCheck.checks.database = !error;
          
          if (error) {
            healthCheck.warnings.push(`Database connection issue: ${error.message}`);
          }
        }
      } catch (error) {
        healthCheck.warnings.push(`Database test failed: ${error}`);
      }
    } else {
      healthCheck.warnings.push('Skipping database test due to client configuration issues');
    }

    // Determine overall status
    const hasErrors = healthCheck.errors.length > 0;
    const hasCriticalIssues = !healthCheck.checks.environment || !healthCheck.checks.supabase;
    
    if (hasErrors || hasCriticalIssues) {
      healthCheck.status = 'unhealthy';
      return NextResponse.json(healthCheck, { status: 503 });
    } else if (healthCheck.warnings.length > 0) {
      healthCheck.status = 'degraded';
      return NextResponse.json(healthCheck, { status: 200 });
    }

    return NextResponse.json(healthCheck, { status: 200 });

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.errors.push(`Health check failed: ${error}`);
    return NextResponse.json(healthCheck, { status: 503 });
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(request: NextRequest) {
  try {
    const isReady = isEnvironmentReady() && canCreateSupabaseClient();
    return new NextResponse(null, { status: isReady ? 200 : 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
} 