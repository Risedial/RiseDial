# Vercel Deployment Setup Guide for Risedial

## Prerequisites
- GitHub account with repository access
- Vercel account (free tier sufficient for development)
- Local development environment configured
- Environment variables ready (from Supabase and Telegram setup)

## Step 1: Initial Vercel Project Setup

1. **Connect GitHub Repository**
   ```bash
   # Go to https://vercel.com/dashboard
   # Click "New Project"
   # Import from GitHub
   # Select your Risedial repository
   # Configure project settings:
   
   Project Name: risedial-[environment] (dev/staging/prod)
   Framework Preset: Next.js
   Root Directory: ./ (unless using monorepo)
   Node.js Version: 18.x
   ```

2. **Project Configuration**
   ```json
   // vercel.json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci",
     "functions": {
       "app/api/telegram-webhook.js": {
         "maxDuration": 30
       },
       "app/api/ai-chat.js": {
         "maxDuration": 60
       }
     },
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "*"
           },
           {
             "key": "Access-Control-Allow-Methods",
             "value": "GET, POST, PUT, DELETE, OPTIONS"
           },
           {
             "key": "Access-Control-Allow-Headers",
             "value": "Content-Type, Authorization"
           }
         ]
       }
     ],
     "rewrites": [
       {
         "source": "/health",
         "destination": "/api/health"
       }
     ]
   }
   ```

## Step 2: Environment Variables Configuration

1. **Development Environment Variables**
   ```bash
   # In Vercel Dashboard > Project > Settings > Environment Variables
   # Add these for Development environment:
   
   SUPABASE_URL=https://[project-id].supabase.co
   SUPABASE_ANON_KEY=eyJ[anon-key]
   SUPABASE_SERVICE_ROLE_KEY=eyJ[service-role-key]
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   OPENAI_API_KEY=sk-[your-openai-key]
   WEBHOOK_SECRET_TOKEN=[generated-secret]
   NODE_ENV=development
   VERCEL_ENV=development
   
   # Crisis detection settings
   CRISIS_WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/crisis
   ADMIN_EMAIL=support@risedial.com
   
   # Cost management
   DAILY_COST_LIMIT_USD=0.50
   MONTHLY_COST_LIMIT_USD=15.00
   
   # Feature flags
   ENABLE_CRISIS_DETECTION=true
   ENABLE_PROGRESS_TRACKING=true
   ENABLE_COST_MONITORING=true
   ```

2. **Production Environment Variables**
   ```bash
   # Separate configuration for Production environment:
   # Use production Supabase project
   # Use production Telegram bot
   # Set appropriate cost limits
   # Enable production monitoring
   
   NODE_ENV=production
   VERCEL_ENV=production
   LOG_LEVEL=error
   SENTRY_DSN=[your-sentry-dsn]
   ```

3. **Environment Variable Validation**
   ```typescript
   // lib/config.ts
   const requiredEnvVars = [
     'SUPABASE_URL',
     'SUPABASE_SERVICE_ROLE_KEY',
     'TELEGRAM_BOT_TOKEN',
     'OPENAI_API_KEY'
   ];
   
   export function validateEnvironment() {
     const missing = requiredEnvVars.filter(
       envVar => !process.env[envVar]
     );
   
     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
     }
   
     console.log('✅ All required environment variables are present');
   }
   
   export const config = {
     supabase: {
       url: process.env.SUPABASE_URL!,
       serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
       anonKey: process.env.SUPABASE_ANON_KEY!
     },
     telegram: {
       botToken: process.env.TELEGRAM_BOT_TOKEN!,
       webhookSecret: process.env.WEBHOOK_SECRET_TOKEN!
     },
     openai: {
       apiKey: process.env.OPENAI_API_KEY!
     },
     costs: {
       dailyLimitUsd: parseFloat(process.env.DAILY_COST_LIMIT_USD || '0.50'),
       monthlyLimitUsd: parseFloat(process.env.MONTHLY_COST_LIMIT_USD || '15.00')
     },
     features: {
       enableCrisisDetection: process.env.ENABLE_CRISIS_DETECTION === 'true',
       enableProgressTracking: process.env.ENABLE_PROGRESS_TRACKING === 'true',
       enableCostMonitoring: process.env.ENABLE_COST_MONITORING === 'true'
     }
   };
   ```

## Step 3: Build Configuration

1. **Package.json Scripts**
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint",
       "type-check": "tsc --noEmit",
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "validate-env": "node -r ts-node/register scripts/validate-env.ts",
       "setup-webhook": "node -r ts-node/register scripts/setup-webhook.ts",
       "db-migrate": "node -r ts-node/register scripts/db-migrate.ts"
     }
   }
   ```

2. **TypeScript Configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "es5",
       "lib": ["dom", "dom.iterable", "es6"],
       "allowJs": true,
       "skipLibCheck": true,
       "strict": true,
       "forceConsistentCasingInFileNames": true,
       "noEmit": true,
       "esModuleInterop": true,
       "module": "esnext",
       "moduleResolution": "node",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "jsx": "preserve",
       "incremental": true,
       "plugins": [
         {
           "name": "next"
         }
       ],
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@/lib/*": ["./src/lib/*"],
         "@/types/*": ["./src/types/*"],
         "@/utils/*": ["./src/utils/*"]
       }
     },
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
     "exclude": ["node_modules"]
   }
   ```

3. **Next.js Configuration**
   ```javascript
   // next.config.js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     experimental: {
       serverComponentsExternalPackages: ['@supabase/supabase-js']
     },
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.resolve.fallback = {
           ...config.resolve.fallback,
           fs: false,
           net: false,
           tls: false,
         };
       }
       return config;
     },
     env: {
       CUSTOM_KEY: process.env.CUSTOM_KEY,
     },
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Origin', value: '*' },
             { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
             { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
           ],
         },
       ];
     },
   };
   
   module.exports = nextConfig;
   ```

## Step 4: Health Check & Monitoring

1. **Health Check Endpoint**
   ```typescript
   // api/health.ts
   import { NextApiRequest, NextApiResponse } from 'next';
   import { createClient } from '@supabase/supabase-js';
   import { validateEnvironment } from '@/lib/config';
   
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     try {
       // Validate environment
       validateEnvironment();
       
       // Check database connection
       const supabase = createClient(
         process.env.SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
       );
       
       const { error: dbError } = await supabase
         .from('users')
         .select('count')
         .limit(1);
       
       if (dbError) {
         throw new Error(`Database connection failed: ${dbError.message}`);
       }
       
       // Check Telegram bot
       const telegramCheck = await fetch(
         `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
       );
       
       if (!telegramCheck.ok) {
         throw new Error('Telegram bot connection failed');
       }
       
       // Check OpenAI API
       const openaiCheck = await fetch('https://api.openai.com/v1/models', {
         headers: {
           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
         },
       });
       
       if (!openaiCheck.ok) {
         throw new Error('OpenAI API connection failed');
       }
       
       const healthData = {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         environment: process.env.VERCEL_ENV || 'development',
         version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
         checks: {
           database: 'ok',
           telegram: 'ok',
           openai: 'ok'
         }
       };
       
       res.status(200).json(healthData);
     } catch (error) {
       console.error('Health check failed:', error);
       
       res.status(503).json({
         status: 'unhealthy',
         timestamp: new Date().toISOString(),
         error: error instanceof Error ? error.message : 'Unknown error'
       });
     }
   }
   ```

2. **System Metrics Endpoint**
   ```typescript
   // api/metrics.ts
   import { NextApiRequest, NextApiResponse } from 'next';
   import { createClient } from '@supabase/supabase-js';
   
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     try {
       const supabase = createClient(
         process.env.SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
       );
   
       // Get basic metrics
       const [
         { count: userCount },
         { count: messageCount },
         { count: crisisEventCount },
         { data: costData }
       ] = await Promise.all([
         supabase.from('users').select('*', { count: 'exact', head: true }),
         supabase.from('conversations').select('*', { count: 'exact', head: true }),
         supabase.from('crisis_events').select('*', { count: 'exact', head: true }),
         supabase.from('api_usage')
           .select('cost_usd')
           .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
       ]);
   
       const dailyCost = costData?.reduce((sum, row) => sum + Number(row.cost_usd), 0) || 0;
   
       const metrics = {
         users: {
           total: userCount || 0,
           active_24h: 0 // TODO: Implement active user tracking
         },
         conversations: {
           total: messageCount || 0,
           daily_cost_usd: dailyCost
         },
         safety: {
           crisis_events_24h: crisisEventCount || 0
         },
         system: {
           timestamp: new Date().toISOString(),
           environment: process.env.VERCEL_ENV
         }
       };
   
       res.status(200).json(metrics);
     } catch (error) {
       console.error('Metrics collection failed:', error);
       res.status(500).json({ error: 'Failed to collect metrics' });
     }
   }
   ```

## Step 5: Deployment Automation

1. **GitHub Actions Workflow**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Vercel
   
   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
         
         - run: npm ci
         - run: npm run type-check
         - run: npm run lint
         - run: npm run test
   
     deploy-staging:
       if: github.ref == 'refs/heads/develop'
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             scope: ${{ secrets.VERCEL_ORG_ID }}
   
     deploy-production:
       if: github.ref == 'refs/heads/main'
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
             scope: ${{ secrets.VERCEL_ORG_ID }}
   ```

2. **Pre-deployment Validation Script**
   ```typescript
   // scripts/pre-deploy-validation.ts
   import { validateEnvironment } from '../lib/config';
   
   async function preDeploy() {
     console.log('🔍 Running pre-deployment validation...');
     
     try {
       // Validate environment variables
       validateEnvironment();
       console.log('✅ Environment variables validated');
       
       // Test database connection
       const { createClient } = await import('@supabase/supabase-js');
       const supabase = createClient(
         process.env.SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
       );
       
       const { error } = await supabase.from('users').select('count').limit(1);
       if (error) throw new Error(`Database test failed: ${error.message}`);
       console.log('✅ Database connection verified');
       
       // Test Telegram bot
       const telegramResponse = await fetch(
         `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
       );
       if (!telegramResponse.ok) throw new Error('Telegram bot validation failed');
       console.log('✅ Telegram bot verified');
       
       // Test OpenAI API
       const openaiResponse = await fetch('https://api.openai.com/v1/models', {
         headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
       });
       if (!openaiResponse.ok) throw new Error('OpenAI API validation failed');
       console.log('✅ OpenAI API verified');
       
       console.log('🎉 Pre-deployment validation successful!');
       
     } catch (error) {
       console.error('❌ Pre-deployment validation failed:', error);
       process.exit(1);
     }
   }
   
   preDeploy();
   ```

## Step 6: Monitoring & Logging

1. **Structured Logging Setup**
   ```typescript
   // lib/logger.ts
   interface LogEntry {
     timestamp: string;
     level: 'info' | 'warn' | 'error' | 'debug';
     message: string;
     context?: Record<string, any>;
     userId?: string;
     requestId?: string;
   }
   
   class Logger {
     private logLevel: string;
   
     constructor() {
       this.logLevel = process.env.LOG_LEVEL || 'info';
     }
   
     private shouldLog(level: string): boolean {
       const levels = { debug: 0, info: 1, warn: 2, error: 3 };
       return levels[level] >= levels[this.logLevel];
     }
   
     private log(entry: LogEntry) {
       if (!this.shouldLog(entry.level)) return;
       
       console.log(JSON.stringify({
         ...entry,
         timestamp: new Date().toISOString(),
         environment: process.env.VERCEL_ENV || 'development'
       }));
     }
   
     info(message: string, context?: Record<string, any>) {
       this.log({ level: 'info', message, context });
     }
   
     warn(message: string, context?: Record<string, any>) {
       this.log({ level: 'warn', message, context });
     }
   
     error(message: string, context?: Record<string, any>) {
       this.log({ level: 'error', message, context });
     }
   
     debug(message: string, context?: Record<string, any>) {
       this.log({ level: 'debug', message, context });
     }
   }
   
   export const logger = new Logger();
   ```

2. **Error Tracking Setup**
   ```typescript
   // lib/error-tracking.ts
   import * as Sentry from '@sentry/nextjs';
   
   export function initErrorTracking() {
     if (process.env.SENTRY_DSN) {
       Sentry.init({
         dsn: process.env.SENTRY_DSN,
         environment: process.env.VERCEL_ENV || 'development',
         tracesSampleRate: 0.1,
         beforeSend(event, hint) {
           // Filter out sensitive data
           if (event.request?.data) {
             delete event.request.data;
           }
           return event;
         }
       });
     }
   }
   
   export function captureError(error: Error, context?: Record<string, any>) {
     console.error(error);
     
     if (process.env.SENTRY_DSN) {
       Sentry.withScope((scope) => {
         if (context) {
           Object.keys(context).forEach(key => {
             scope.setContext(key, context[key]);
           });
         }
         Sentry.captureException(error);
       });
     }
   }
   ```

## Step 7: Performance Optimization

1. **Function Configuration**
   ```typescript
   // api/ai-chat.ts - Example optimized function
   export const config = {
     runtime: 'nodejs18.x',
     maxDuration: 60, // 60 seconds for AI processing
     memory: 1024 // MB
   };
   
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const startTime = Date.now();
     
     try {
       // Your function logic here
       
     } catch (error) {
       logger.error('AI chat function failed', {
         duration: Date.now() - startTime,
         error: error.message
       });
       throw error;
     } finally {
       logger.info('AI chat function completed', {
         duration: Date.now() - startTime
       });
     }
   }
   ```

2. **Caching Strategy**
   ```typescript
   // lib/cache.ts
   interface CacheItem<T> {
     data: T;
     timestamp: number;
     ttl: number;
   }
   
   class MemoryCache {
     private cache = new Map<string, CacheItem<any>>();
   
     set<T>(key: string, data: T, ttlSeconds = 300): void {
       this.cache.set(key, {
         data,
         timestamp: Date.now(),
         ttl: ttlSeconds * 1000
       });
     }
   
     get<T>(key: string): T | null {
       const item = this.cache.get(key);
       if (!item) return null;
   
       if (Date.now() - item.timestamp > item.ttl) {
         this.cache.delete(key);
         return null;
       }
   
       return item.data;
     }
   
     clear(): void {
       this.cache.clear();
     }
   }
   
   export const memoryCache = new MemoryCache();
   ```

## Step 8: Post-Deployment Setup

1. **Webhook Configuration Script**
   ```bash
   # Run after deployment
   npm run setup-webhook
   ```

2. **Database Migration Script**
   ```bash
   # If schema changes
   npm run db-migrate
   ```

3. **Health Check Verification**
   ```bash
   # Verify deployment
   curl https://your-app.vercel.app/health
   curl https://your-app.vercel.app/api/metrics
   ```

## Troubleshooting

**Common Deployment Issues:**
- **Build failures**: Check TypeScript errors, missing dependencies
- **Environment variables**: Verify all required vars are set in Vercel
- **Function timeouts**: Adjust maxDuration in vercel.json
- **Memory issues**: Increase memory allocation for heavy functions
- **Database connections**: Check Supabase RLS policies and connection strings

**Performance Issues:**
- **Cold starts**: Use function warming for critical endpoints
- **Memory usage**: Profile functions and optimize heavy operations
- **API limits**: Implement caching and rate limiting
- **Database queries**: Add proper indexes and optimize queries

## Security Checklist
- [ ] All API keys secured in environment variables
- [ ] No sensitive data in client-side code
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive information
- [ ] Health check doesn't expose sensitive system information 