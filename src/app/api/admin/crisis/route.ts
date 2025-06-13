import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUtils } from '@/lib/database';
import { canCreateSupabaseClient } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // Check if environment is ready
    if (!canCreateSupabaseClient()) {
      return NextResponse.json(
        { error: 'Database configuration not available' },
        { status: 503 }
      );
    }

    // Initialize database utils at runtime
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('id');

    if (assistantId) {
      const assistant = await db.getCrisisAssistant(assistantId);
      return NextResponse.json(assistant);
    } else {
      const assistants = await db.listCrisisAssistants();
      return NextResponse.json(assistants);
    }
  } catch (error) {
    console.error('Crisis API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crisis assistants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if environment is ready
    if (!canCreateSupabaseClient()) {
      return NextResponse.json(
        { error: 'Database configuration not available' },
        { status: 503 }
      );
    }

    // Initialize database utils at runtime
    const db = getDatabaseUtils();
    
    const assistantData = await request.json();
    const result = await db.createCrisisAssistant(assistantData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Crisis API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create crisis assistant' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if environment is ready
    if (!canCreateSupabaseClient()) {
      return NextResponse.json(
        { error: 'Database configuration not available' },
        { status: 503 }
      );
    }

    // Initialize database utils at runtime
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('id');
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const result = await db.updateCrisisAssistant(assistantId, updates);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Crisis API PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update crisis assistant' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if environment is ready
    if (!canCreateSupabaseClient()) {
      return NextResponse.json(
        { error: 'Database configuration not available' },
        { status: 503 }
      );
    }

    // Initialize database utils at runtime
    const db = getDatabaseUtils();
    
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('id');
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }

    await db.deleteCrisisAssistant(assistantId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Crisis API DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete crisis assistant' },
      { status: 500 }
    );
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