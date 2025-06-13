import { NextRequest, NextResponse } from 'next/server';
import { DatabaseUtils } from '@/lib/database';

const db = new DatabaseUtils();

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