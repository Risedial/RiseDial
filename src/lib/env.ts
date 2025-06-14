/**
 * Safe environment variable handling for Next.js deployment
 * Prevents build-time errors by providing runtime validation
 */

export interface EnvironmentConfig {
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  NEXT_TELEMETRY_DISABLED?: string;
  VERCEL_URL?: string;
}

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'TELEGRAM_BOT_TOKEN'
] as const;

/**
 * Safely get environment variable with optional fallback
 */
function getEnvVar(key: string, fallback?: string): string {
  // During build time or test time, return fallback or empty string
  if (typeof window === 'undefined' && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && !process.env[key]) {
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
  // Skip validation during test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
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
  // Skip validation during build time or test time
  const isBuildTime = process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL;
  const isTestTime = process.env.NODE_ENV === 'test';
  
  if (!isBuildTime && !isTestTime) {
    validateEnvironment();
  }
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    SUPABASE_URL: getEnvVar('SUPABASE_URL', (isBuildTime || isTestTime) ? 'https://placeholder.supabase.co' : undefined),
    SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY', (isBuildTime || isTestTime) ? 'placeholder-key' : undefined),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || ((isBuildTime || isTestTime) ? 'sk-placeholder' : ''),
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || ((isBuildTime || isTestTime) ? '123456:placeholder' : ''),
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
    VERCEL_URL: process.env.VERCEL_URL
  };
}

/**
 * Check if environment is properly configured
 */
export function isEnvironmentReady(): boolean {
  try {
    // Check all required environment variables
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value || value.trim().length === 0) {
        console.warn(`Environment variable ${envVar} is missing or empty`);
        return false;
      }
    }

    // Validate format of specific variables
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      console.warn('SUPABASE_URL must start with https://');
      return false;
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && !openaiKey.startsWith('sk-')) {
      console.warn('OPENAI_API_KEY must start with sk-');
      return false;
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramToken && !/^\d+:[A-Za-z0-9_-]+$/.test(telegramToken)) {
      console.warn('TELEGRAM_BOT_TOKEN format is invalid');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking environment variables:', error);
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

export function validateEnvironmentVariable(name: string, value: string | undefined): boolean {
  if (!value) return false;

  switch (name) {
    case 'SUPABASE_URL':
      return value.startsWith('https://') && value.includes('.supabase.co');
    case 'OPENAI_API_KEY':
      return value.startsWith('sk-') && value.length > 40;
    case 'TELEGRAM_BOT_TOKEN':
      return /^\d+:[A-Za-z0-9_-]+$/.test(value);
    case 'TELEGRAM_WEBHOOK_SECRET':
      return value.length >= 32;
    default:
      return value.length > 0;
  }
}

export function getMissingEnvironmentVars(): string[] {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  return missing;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (isDevelopment()) {
    return 'http://localhost:3000';
  }
  
  return 'https://your-app.vercel.app';
} 