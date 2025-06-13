/**
 * Runtime Supabase client initialization
 * Prevents build-time errors by creating clients only when needed
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvironmentConfig, isEnvironmentReady } from './env';

let supabaseClient: SupabaseClient | null = null;
let supabaseServiceClient: SupabaseClient | null = null;

/**
 * Get or create the main Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!isEnvironmentReady()) {
      throw new Error('Environment not properly configured for Supabase client');
    }
    
    const config = getEnvironmentConfig();
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  
  return supabaseClient;
}

/**
 * Get or create the service role Supabase client
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!supabaseServiceClient) {
    if (!isEnvironmentReady()) {
      throw new Error('Environment not properly configured for Supabase service client');
    }
    
    const config = getEnvironmentConfig();
    if (!config.supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service client');
    }
    
    supabaseServiceClient = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }
  
  return supabaseServiceClient;
}

/**
 * Check if Supabase client can be created
 */
export function canCreateSupabaseClient(): boolean {
  try {
    return isEnvironmentReady();
  } catch {
    return false;
  }
}

/**
 * Reset clients (useful for testing)
 */
export function resetSupabaseClients(): void {
  supabaseClient = null;
  supabaseServiceClient = null;
}

/**
 * Safe client getter with error handling
 */
export function getSafeSupabaseClient(): SupabaseClient | null {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Safe service client getter with error handling
 */
export function getSafeSupabaseServiceClient(): SupabaseClient | null {
  try {
    return getSupabaseServiceClient();
  } catch (error) {
    console.error('Failed to create Supabase service client:', error);
    return null;
  }
} 