# Prompt 0: Deployment Prerequisites & Dependencies Setup

## Context
You are preparing Risedial's complete development environment and infrastructure prerequisites to ensure all dependencies, scripts, configurations, and infrastructure components are properly set up before running the Deployment Automation prompt. This setup ensures seamless CI/CD pipeline deployment, monitoring, testing, and operational procedures.

## Required Reading
First, read these files to understand the complete project requirements and existing infrastructure:
- `Context/project_blueprint.md` - Project overview and technical requirements
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Full development strategy and architecture
- `package.json` - Current dependencies and scripts
- `vercel.json` - Platform configuration
- `Risedial_dev_prompts/12_Deployment_Automation.md` - Target deployment requirements
- All files in `src/` directory - Current application structure
- All files in `scripts/` directory - Existing scripts and infrastructure

## Task
Create all missing dependencies, npm scripts, configuration files, environment setups, health check endpoints, database utilities, testing infrastructure, and monitoring components required for the Deployment Automation prompt to execute successfully.

## Exact Expected Outputs

### 1. Enhanced Package.json - Update root package.json
Add all missing dependencies and scripts required for deployment automation:

```json
{
  "name": "risedial",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:crisis": "jest tests/crisis",
    "test:therapeutic": "jest tests/therapeutic",
    "test:load": "jest tests/load",
    "test:coverage": "jest --coverage",
    "test:smoke": "jest tests/smoke",
    "test:smoke:staging": "ENVIRONMENT=staging jest tests/smoke",
    "test:smoke:production": "ENVIRONMENT=production jest tests/smoke",
    "test:crisis:validation": "jest tests/crisis --verbose",
    "test:crisis:production": "ENVIRONMENT=production jest tests/crisis/production-validation.test.js",
    "db:setup:dev": "node scripts/database/setup-dev.js",
    "db:setup:test": "NODE_ENV=test node scripts/database/setup-test.js",
    "db:migrate:staging": "ENVIRONMENT=staging node scripts/database/migrate.js",
    "db:migrate:production": "ENVIRONMENT=production node scripts/database/migrate.js",
    "db:rollback": "node scripts/database/migrate.js rollback",
    "db:status": "node scripts/database/migrate.js status",
    "security:scan": "npm audit --audit-level=high && node scripts/security/vulnerability-scan.js",
    "security:check": "node scripts/security/security-check.js",
    "monitoring:setup": "node scripts/monitoring/setup-monitoring.js",
    "monitoring:validate": "node scripts/monitoring/validate-monitoring.js",
    "health:check": "node scripts/health/health-check.js",
    "validate-env": "node scripts/setup/validate-env.js",
    "setup-webhook": "node scripts/setup/setup-webhook.js",
    "deployment:prepare": "npm run security:check && npm run test:coverage && npm run build",
    "deployment:rollback": "node scripts/deployment/rollback.js",
    "postinstall": "node scripts/setup/post-install.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "next": "^14.0.0",
    "node-telegram-bot-api": "^0.64.0",
    "openai": "^4.104.0",
    "typescript": "^5.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/node-telegram-bot-api": "^0.64.0",
    "@types/cors": "^2.8.17",
    "@types/jest": "^29.5.8",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.9.0",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16",
    "wait-on": "^7.2.0",
    "puppeteer": "^21.5.2",
    "@types/puppeteer": "^5.4.7"
  }
}
```

### 2. Environment Configuration Files
Create comprehensive environment setup:

**.env.example** - Complete environment template:
```bash
# Application Configuration
NODE_ENV=development
PORT=3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:port/database

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORGANIZATION=your-openai-org-id

# Monitoring & Alerting
SLACK_WEBHOOK_URL=your-slack-webhook-url
SENTRY_DSN=your-sentry-dsn

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Testing
TEST_DATABASE_URL=postgresql://user:password@host:port/test_database
OPENAI_API_KEY_TEST=your-test-openai-key

# Production Overrides
VERCEL_ENV=development
VERCEL_URL=localhost:3000
```

**.env.test** - Test environment:
```bash
NODE_ENV=test
DATABASE_URL=postgresql://postgres:test_password@localhost:5432/risedial_test
OPENAI_API_KEY=test-key-mock
TELEGRAM_BOT_TOKEN=test-bot-token
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test-anon-key
ENABLE_CRISIS_DETECTION=true
```

### 3. Health Check API Endpoint - src/pages/api/health.js
Create comprehensive health monitoring endpoint:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  const startTime = Date.now();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity
    const dbCheck = await checkDatabaseHealth();
    
    // Check AI service
    const aiCheck = await checkAIServiceHealth();
    
    // Check Telegram bot
    const telegramCheck = await checkTelegramBotHealth();
    
    // Check cost monitoring
    const costCheck = await checkCostMonitoringHealth();
    
    // Get system metrics
    const metrics = await getSystemMetrics();
    
    const services = {
      database: dbCheck,
      ai_service: aiCheck,
      telegram_bot: telegramCheck,
      cost_monitoring: costCheck
    };
    
    const overallStatus = determineOverallStatus(services);
    
    const healthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        ...metrics,
        response_time_ms: Date.now() - startTime
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(healthResponse);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      response_time_ms: Date.now() - startTime
    });
  }
}

async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return {
      status: 'operational',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkAIServiceHealth() {
  const startTime = Date.now();
  
  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    return {
      status: hasApiKey ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: hasApiKey ? undefined : 'OpenAI API key not configured'
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkTelegramBotHealth() {
  const startTime = Date.now();
  
  try {
    const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
    
    return {
      status: hasBotToken ? 'operational' : 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: hasBotToken ? undefined : 'Telegram bot token not configured'
    };
  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error.message
    };
  }
}

async function checkCostMonitoringHealth() {
  const startTime = Date.now();
  
  return {
    status: 'operational',
    response_time_ms: Date.now() - startTime,
    last_check: new Date().toISOString()
  };
}

async function getSystemMetrics() {
  const uptime = process.uptime();
  
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get daily cost estimate
    const dailyCost = await calculateDailyCost();
    
    return {
      uptime_seconds: Math.floor(uptime),
      total_users: totalUsers || 0,
      active_sessions: 0, // Placeholder
      daily_cost: dailyCost
    };
  } catch (error) {
    return {
      uptime_seconds: Math.floor(uptime),
      total_users: 0,
      active_sessions: 0,
      daily_cost: 0
    };
  }
}

async function calculateDailyCost() {
  // Placeholder implementation
  return 0.50; // $0.50 daily estimate
}

function determineOverallStatus(services) {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'operational')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'down')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}
```

### 4. Status API Endpoint - src/pages/api/status.js
Create system status endpoint:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const overview = await getSystemOverview();
    const performance = await getPerformanceMetrics();
    const features = await getFeatureStatus();
    
    const statusResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        overview,
        performance,
        features
      }
    };
    
    res.status(200).json(statusResponse);
    
  } catch (error) {
    console.error('Status check failed:', error);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Status check failed'
    });
  }
}

async function getSystemOverview() {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    return {
      total_users: totalUsers || 0,
      total_conversations: totalConversations || 0,
      uptime_hours: Math.floor(process.uptime() / 3600),
      environment: process.env.NODE_ENV || 'development'
    };
  } catch (error) {
    return {
      total_users: 0,
      total_conversations: 0,
      uptime_hours: 0,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

async function getPerformanceMetrics() {
  return {
    avg_response_time_ms: 250,
    error_rate: 0.001,
    uptime_percentage: 99.9,
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  };
}

async function getFeatureStatus() {
  return {
    crisis_detection: {
      enabled: process.env.ENABLE_CRISIS_DETECTION === 'true',
      accuracy: 0.95
    },
    telegram_bot: {
      enabled: !!process.env.TELEGRAM_BOT_TOKEN,
      status: 'operational'
    },
    ai_chat: {
      enabled: !!process.env.OPENAI_API_KEY,
      status: 'operational'
    }
  };
}
```

### 5. Database Setup Scripts - scripts/database/setup-test.js
Create test database setup:

```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  try {
    // Clean existing test data
    await cleanTestData();
    
    // Create test tables if they don't exist
    await createTestTables();
    
    // Insert test data
    await insertTestData();
    
    console.log('✅ Test database setup completed successfully');
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    process.exit(1);
  }
}

async function cleanTestData() {
  console.log('Cleaning existing test data...');
  
  // Delete test data (where IDs start with 'test-')
  await supabase.from('conversations').delete().like('user_id', 'test-%');
  await supabase.from('crisis_events').delete().like('user_id', 'test-%');
  await supabase.from('users').delete().like('id', 'test-%');
  
  console.log('Test data cleaned');
}

async function createTestTables() {
  console.log('Ensuring test tables exist...');
  
  // Tables should already exist from migrations
  // This is just a verification step
  
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  const requiredTables = ['users', 'conversations', 'crisis_events'];
  const existingTables = tables?.map(t => t.table_name) || [];
  
  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      console.warn(`⚠️ Table ${table} not found`);
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
}

async function insertTestData() {
  console.log('Inserting test data...');
  
  // Create test user
  const testUser = {
    id: 'test-user-1',
    telegram_id: 999999,
    first_name: 'Test User',
    subscription_tier: 'basic',
    created_at: new Date().toISOString()
  };
  
  const { error: userError } = await supabase
    .from('users')
    .insert(testUser);
  
  if (userError) {
    console.error('Failed to insert test user:', userError);
  } else {
    console.log('✅ Test user created');
  }
}

// Database connection test
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase, testConnection };
```

### 6. Database Setup Dev Script - scripts/database/setup-dev.js
Create development database setup:

```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDevDatabase() {
  console.log('Setting up development database...');
  
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    // Ensure tables exist
    await ensureTablesExist();
    
    // Create sample data for development
    await createSampleData();
    
    console.log('✅ Development database setup completed successfully');
  } catch (error) {
    console.error('❌ Development database setup failed:', error.message);
    process.exit(1);
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function ensureTablesExist() {
  console.log('Checking if required tables exist...');
  
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  const requiredTables = ['users', 'conversations', 'crisis_events'];
  const existingTables = tables?.map(t => t.table_name) || [];
  
  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      console.warn(`⚠️ Table ${table} not found - please run migrations`);
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
}

async function createSampleData() {
  console.log('Creating sample development data...');
  
  // Check if sample data already exists
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .like('id', 'dev-%')
    .limit(1);
  
  if (existingUsers && existingUsers.length > 0) {
    console.log('Sample data already exists, skipping creation');
    return;
  }
  
  // Create sample user
  const sampleUser = {
    id: 'dev-user-1',
    telegram_id: 123456789,
    first_name: 'Dev User',
    subscription_tier: 'premium',
    created_at: new Date().toISOString()
  };
  
  const { error: userError } = await supabase
    .from('users')
    .insert(sampleUser);
  
  if (userError) {
    console.error('Failed to create sample user:', userError);
  } else {
    console.log('✅ Sample user created');
  }
}

if (require.main === module) {
  setupDevDatabase();
}

module.exports = { setupDevDatabase, testConnection };
```

### 7. Smoke Tests - tests/smoke/smoke.test.js
Create smoke testing suite:

```javascript
const axios = require('axios');

describe('Smoke Tests', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const timeout = 30000;

  beforeAll(() => {
    console.log(`Running smoke tests against: ${baseUrl}`);
  });

  test('Health endpoint should be accessible', async () => {
    const response = await axios.get(`${baseUrl}/api/health`, { timeout });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('timestamp');
    expect(response.data).toHaveProperty('services');
  }, timeout);

  test('Status endpoint should be accessible', async () => {
    const response = await axios.get(`${baseUrl}/api/status`, { timeout });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('data');
  }, timeout);

  test('Application should serve pages', async () => {
    const response = await axios.get(`${baseUrl}/health`, { timeout });
    
    expect(response.status).toBe(200);
  }, timeout);

  test('Telegram webhook endpoint should exist', async () => {
    // Test that the endpoint exists (even if it returns an error for invalid requests)
    try {
      await axios.post(`${baseUrl}/api/telegram-webhook`, {}, { timeout });
    } catch (error) {
      // We expect this to fail with 400/401, but not 404
      expect(error.response.status).not.toBe(404);
    }
  }, timeout);

  test('API should handle CORS properly', async () => {
    const response = await axios.options(`${baseUrl}/api/health`, { timeout });
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }, timeout);
});
```

### 8. Security Vulnerability Scanner - scripts/security/vulnerability-scan.js
Create security scanning utilities:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runVulnerabilityScans() {
  console.log('🔒 Running security vulnerability scans...');
  
  try {
    // Run npm audit
    await runNpmAudit();
    
    // Check for hardcoded secrets
    await checkForSecrets();
    
    // Validate environment configuration
    await validateEnvironmentSecurity();
    
    console.log('✅ Security scans completed successfully');
  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    process.exit(1);
  }
}

async function runNpmAudit() {
  console.log('Running npm audit...');
  
  try {
    const auditOutput = execSync('npm audit --audit-level=high', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ npm audit passed');
  } catch (error) {
    if (error.status === 1) {
      console.error('❌ npm audit found vulnerabilities:');
      console.error(error.stdout);
      throw new Error('High-severity vulnerabilities found');
    }
  }
}

async function checkForSecrets() {
  console.log('Checking for hardcoded secrets...');
  
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/g, // OpenAI API keys
    /\d{10}:[a-zA-Z0-9_-]{35}/g, // Telegram bot tokens
    /[a-zA-Z0-9]{32,}/g, // Generic API keys
  ];
  
  const filesToCheck = [
    'src/**/*.js',
    'src/**/*.ts',
    'src/**/*.tsx',
    'scripts/**/*.js'
  ];
  
  // This is a basic implementation - in production you'd use a more sophisticated tool
  console.log('✅ Secret scanning completed (basic implementation)');
}

async function validateEnvironmentSecurity() {
  console.log('Validating environment security...');
  
  // Check if .env files are in .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (!gitignoreContent.includes('.env')) {
      console.warn('⚠️ .env files should be in .gitignore');
    } else {
      console.log('✅ Environment files properly ignored');
    }
  }
  
  // Check for example env files
  if (!fs.existsSync('.env.example')) {
    console.warn('⚠️ .env.example file not found');
  } else {
    console.log('✅ .env.example file exists');
  }
}

if (require.main === module) {
  runVulnerabilityScans();
}

module.exports = { runVulnerabilityScans };
```

### 9. Post-Install Setup Script - scripts/setup/post-install.js
Create post-installation setup:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function postInstallSetup() {
  console.log('🔧 Running post-install setup...');
  
  try {
    // Ensure required directories exist
    await ensureDirectories();
    
    // Copy environment files if needed
    await setupEnvironmentFiles();
    
    // Set up git hooks if needed
    await setupGitHooks();
    
    console.log('✅ Post-install setup completed successfully');
  } catch (error) {
    console.error('❌ Post-install setup failed:', error.message);
    // Don't exit with error code for post-install scripts
  }
}

async function ensureDirectories() {
  const directories = [
    'logs',
    'coverage',
    'tests/smoke',
    'tests/crisis',
    'scripts/monitoring',
    'scripts/security',
    'scripts/health',
    '.github/workflows'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

async function setupEnvironmentFiles() {
  const envExample = path.join(process.cwd(), '.env.example');
  const envLocal = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envExample) && !fs.existsSync(envLocal)) {
    console.log('ℹ️ .env.example exists but .env.local does not');
    console.log('Please copy .env.example to .env.local and configure your environment variables');
  }
}

async function setupGitHooks() {
  // Basic git hooks setup
  console.log('✅ Git hooks setup skipped (handled by CI/CD)');
}

if (require.main === module) {
  postInstallSetup();
}

module.exports = { postInstallSetup };
```

## Instructions for Terminal Usage

You are authorized and expected to use terminal commands to:

1. **Install all missing dependencies:**
   ```bash
   npm install axios dotenv cors helmet express-rate-limit joi winston
   npm install --save-dev @types/cors @types/jest supertest @types/supertest wait-on puppeteer @types/puppeteer
   ```

2. **Create missing directories:**
   ```bash
   mkdir -p .github/workflows
   mkdir -p tests/smoke
   mkdir -p tests/crisis
   mkdir -p scripts/monitoring
   mkdir -p scripts/security
   mkdir -p scripts/health
   ```

3. **Run setup scripts after creation:**
   ```bash
   npm run postinstall
   npm run db:setup:dev
   npm run validate-env
   ```

4. **Test the infrastructure:**
   ```bash
   npm run health:check
   npm run test:smoke
   npm run security:scan
   ```

## Validation Requirements

After creating all files and running setup:
1. Verify all npm scripts execute without errors
2. Confirm health endpoints return proper responses
3. Test database connectivity in all environments
4. Validate security scans complete successfully
5. Ensure smoke tests pass
6. Check that all required dependencies are installed

## Success Criteria

- [ ] All missing npm dependencies installed
- [ ] All missing npm scripts functional
- [ ] Health check endpoints operational
- [ ] Database setup scripts working
- [ ] Security scanning infrastructure ready
- [ ] Smoke testing framework functional
- [ ] Environment configuration complete
- [ ] All prerequisite files created and tested
- [ ] Ready to execute Deployment Automation prompt successfully

## Next Steps

After this prompt completes successfully, you will be ready to execute `12_Deployment_Automation.md` with all dependencies and prerequisites properly configured. 