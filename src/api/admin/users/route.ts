import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/lib/user-manager';
import { DatabaseUtils } from '@/lib/database';

const db = new DatabaseUtils();

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
        const usage = await db.getApiUsageStats(user.id);
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
    const updatedProfile = await userManager.updatePsychologicalProfile(userId, profileData);

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