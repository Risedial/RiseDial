import { NextRequest, NextResponse } from 'next/server';
import { canCreateSupabaseClient, getSafeSupabaseClient } from '@/lib/supabase-client';
import { isEnvironmentReady } from '@/lib/env';

export async function GET() {
  try {
    // Validate critical dependencies are accessible
    const dependencies = {
      axios: await import('axios').then(() => true).catch(() => false),
      supabase: await import('@supabase/supabase-js').then(() => true).catch(() => false),
      next: true // If we're running, Next.js is working
    };

    const allDepsHealthy = Object.values(dependencies).every(Boolean);

    if (!allDepsHealthy) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          dependencies,
          error: 'Some critical dependencies are missing'
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dependencies,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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