import { NextRequest, NextResponse } from 'next/server';
import { costAnalytics } from '@/lib/cost-analytics';

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