import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern for Supabase client
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function canCreateSupabaseClient(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  
  return !!(url && key && url.startsWith('https://') && key.length > 10);
}

export function getSafeSupabaseClient(): SupabaseClient | null {
  try {
    if (!canCreateSupabaseClient()) {
      console.warn('Cannot create Supabase client: missing or invalid credentials');
      return null;
    }

    if (!supabaseClient) {
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_ANON_KEY!;
      
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    }

    return supabaseClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export function getSafeSupabaseAdminClient(): SupabaseClient | null {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Cannot create Supabase admin client: missing service role key');
      return null;
    }

    if (!supabaseAdminClient) {      
      supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }

    return supabaseAdminClient;
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSafeSupabaseClient();
    if (!client) {
      return { success: false, error: 'Cannot create Supabase client' };
    }

    // Simple test query - try to select from a common table
    const { error } = await client.from('users').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function testSupabaseAdminConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSafeSupabaseAdminClient();
    if (!client) {
      return { success: false, error: 'Cannot create Supabase admin client' };
    }

    // Test admin connection with a simple query
    const { error } = await client.from('users').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Health check function for monitoring
export async function checkSupabaseHealth(): Promise<{
  client: boolean;
  admin: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  
  const clientTest = await testSupabaseConnection();
  const adminTest = await testSupabaseAdminConnection();
  
  if (!clientTest.success && clientTest.error) {
    errors.push(`Client: ${clientTest.error}`);
  }
  
  if (!adminTest.success && adminTest.error) {
    errors.push(`Admin: ${adminTest.error}`);
  }
  
  return {
    client: clientTest.success,
    admin: adminTest.success,
    errors
  };
}

// Export default client getter for convenience
export const getSupabase = getSafeSupabaseClient;

// Backwards compatibility exports
export const getSupabaseServiceClient = getSafeSupabaseAdminClient;
export const getSafeSupabaseServiceClient = getSafeSupabaseAdminClient;

// Reset connections (useful for testing)
export function resetSupabaseConnections(): void {
  supabaseClient = null;
  supabaseAdminClient = null;
} 