/**
 * Safe environment variable handling for Next.js deployment
 * Prevents build-time errors by providing runtime validation
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Safely get environment variable with optional fallback
 */
function getEnvVar(key: string, fallback?: string): string {
  // During build time, return fallback or empty string
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development' && !process.env[key]) {
    return fallback || '';
  }
  
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  
  return value || fallback || '';
}

/**
 * Validate required environment variables at runtime
 */
export function validateEnvironment(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get environment configuration with runtime validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Skip validation during build time
  const isBuildTime = process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL;
  
  if (!isBuildTime) {
    validateEnvironment();
  }
  
  return {
    supabaseUrl: getEnvVar('SUPABASE_URL', isBuildTime ? 'https://placeholder.supabase.co' : undefined),
    supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY', isBuildTime ? 'placeholder-key' : undefined),
    supabaseServiceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  };
}

/**
 * Check if environment is properly configured
 */
export function isEnvironmentReady(): boolean {
  try {
    validateEnvironment();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment variable safely with logging
 */
export function safeGetEnv(key: string, required: boolean = false): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    console.error(`Missing required environment variable: ${key}`);
    return undefined;
  }
  
  return value;
} 