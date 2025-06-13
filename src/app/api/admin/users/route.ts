import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUtils } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const subscription = searchParams.get('subscription');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query for users
    let query = db.supabase
      .from('users')
      .select(`
        *,
        user_psychological_profiles (
          emotional_state,
          stress_level,
          crisis_risk_level
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subscription && subscription !== 'all') {
      query = query.eq('subscription_tier', subscription);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    // Add activity status to each user
    const enhancedUsers = await Promise.all(
      users.map(async (user: any) => {
        const lastMessage = new Date(user.last_active);
        const now = new Date();
        const hoursSinceLastMessage = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);

        let activityStatus = 'active';
        if (hoursSinceLastMessage > 168) { // 7 days
          activityStatus = 'inactive';
        } else if (hoursSinceLastMessage > 24) {
          activityStatus = 'dormant';
        }

        return {
          ...user,
          activity_status: activityStatus,
          hours_since_last_active: Math.floor(hoursSinceLastMessage)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enhancedUsers,
      total: users.length,
      filters: {
        status,
        subscription,
        limit
      }
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    
    const { data, error } = await db.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { error } = await db.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 