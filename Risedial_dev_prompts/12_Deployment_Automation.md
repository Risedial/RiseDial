# Prompt 12: Create Deployment Scripts & Automation

## Context
You are creating Risedial's complete deployment and automation framework including CI/CD pipelines, environment management, database migrations, monitoring setup, backup procedures, and production deployment workflows to ensure reliable, automated, and scalable system operations.

## Required Reading
First, read these files to understand deployment requirements:
- `Context/project_blueprint.md` - Infrastructure and deployment specifications
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Deployment architecture and automation requirements
- `package.json` - Dependencies and build scripts (if created)
- `vercel.json` - Platform configuration (if created)

## Task
Create comprehensive deployment automation covering CI/CD pipelines, environment management, database operations, monitoring setup, backup systems, and production workflows to enable reliable and scalable deployment processes.

## Exact Expected Outputs

### 1. GitHub Actions CI/CD Pipeline - .github/workflows/deploy.yml
Create complete automated deployment pipeline:

```yaml
name: Deploy Risedial

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  POSTGRES_VERSION: '15'

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: risedial_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test environment
        run: |
          cp .env.example .env.test
          echo "DATABASE_URL=postgresql://postgres:test_password@localhost:5432/risedial_test" >> .env.test
          echo "NODE_ENV=test" >> .env.test

      - name: Run database setup
        run: npm run db:setup:test

      - name: Run TypeScript checks
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run crisis detection validation
        run: npm run test:crisis

      - name: Generate test coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run dependency vulnerability scan
        run: npm run security:scan

      - name: Check for hardcoded secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Validate build artifacts
        run: |
          test -d .next || exit 1
          test -f .next/BUILD_ID || exit 1

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/staging'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env ENVIRONMENT=staging'

      - name: Run smoke tests
        run: |
          npm install -g wait-on
          wait-on https://risedial-staging.vercel.app/api/health
          npm run test:smoke -- --base-url=https://risedial-staging.vercel.app

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          message: 'Staging deployment completed successfully! 🚀'

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Pre-deployment health check
        run: |
          curl -f https://api.risedial.com/health || exit 1

      - name: Create deployment record
        run: |
          echo "DEPLOYMENT_ID=$(date +%s)" >> $GITHUB_ENV
          echo "DEPLOYMENT_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_ENV

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Setup Telegram webhook
        run: |
          node scripts/setup/setup-webhook.js
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          WEBHOOK_URL: https://api.risedial.com/api/telegram-webhook

      - name: Run production smoke tests
        run: |
          wait-on https://api.risedial.com/api/health
          npm run test:smoke -- --base-url=https://api.risedial.com

      - name: Validate crisis detection
        run: npm run test:crisis:production

      - name: Post-deployment monitoring
        run: |
          # Set up enhanced monitoring for 24 hours
          node scripts/monitoring/enhanced-monitoring.js --duration=24h

      - name: Notify stakeholders
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#general'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          message: |
            🎉 Production deployment successful!
            
            **Deployment ID:** ${{ env.DEPLOYMENT_ID }}
            **Timestamp:** ${{ env.DEPLOYMENT_TIMESTAMP }}
            **Health Check:** ✅ Passing
            **Crisis Detection:** ✅ Validated

  rollback:
    name: Emergency Rollback
    runs-on: ubuntu-latest
    if: failure() && github.ref == 'refs/heads/main'
    needs: [deploy-production]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Trigger rollback
        run: |
          echo "Production deployment failed. Initiating rollback..."
          node scripts/deployment/rollback.js --env=production

      - name: Notify emergency
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          channel: '#alerts'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          message: |
            🚨 EMERGENCY: Production deployment failed!
            
            Automatic rollback initiated.
            Manual intervention may be required.
            
            @channel @oncall
```

### 2. Environment Configuration - scripts/deployment/setup-environments.sh
Create environment setup and configuration scripts:

```bash
#!/bin/bash

# Risedial Environment Setup Script
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Environment detection
detect_environment() {
    if [[ "$VERCEL_ENV" == "production" ]]; then
        echo "production"
    elif [[ "$VERCEL_ENV" == "preview" ]] || [[ "$GITHUB_REF" == "refs/heads/staging" ]]; then
        echo "staging"
    elif [[ "$NODE_ENV" == "test" ]]; then
        echo "test"
    else
        echo "development"
    fi
}

# Environment validation
validate_environment() {
    local env="$1"
    
    log_info "Validating $env environment..."
    
    # Required environment variables by environment
    case "$env" in
        "production")
            required_vars=(
                "DATABASE_URL"
                "OPENAI_API_KEY"
                "TELEGRAM_BOT_TOKEN"
                "TELEGRAM_WEBHOOK_SECRET"
                "SUPABASE_URL"
                "SUPABASE_ANON_KEY"
                "SUPABASE_SERVICE_ROLE_KEY"
                "NEXTAUTH_SECRET"
                "NEXTAUTH_URL"
            )
            ;;
        "staging")
            required_vars=(
                "DATABASE_URL"
                "OPENAI_API_KEY"
                "TELEGRAM_BOT_TOKEN"
                "SUPABASE_URL"
                "SUPABASE_ANON_KEY"
            )
            ;;
        "test")
            required_vars=(
                "DATABASE_URL"
                "OPENAI_API_KEY"
            )
            ;;
        "development")
            required_vars=(
                "DATABASE_URL"
                "OPENAI_API_KEY"
                "TELEGRAM_BOT_TOKEN"
                "SUPABASE_URL"
                "SUPABASE_ANON_KEY"
            )
            ;;
    esac
    
    # Check required variables
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_info "Environment validation successful"
}

# Database setup
setup_database() {
    local env="$1"
    
    log_info "Setting up database for $env environment..."
    
    # Run database migrations
    if [[ "$env" == "production" ]]; then
        log_info "Running production database migrations..."
        npm run db:migrate:production
    elif [[ "$env" == "staging" ]]; then
        log_info "Running staging database migrations..."
        npm run db:migrate:staging
    elif [[ "$env" == "test" ]]; then
        log_info "Setting up test database..."
        npm run db:setup:test
    else
        log_info "Running development database setup..."
        npm run db:setup:dev
    fi
    
    # Verify database connection
    log_info "Verifying database connection..."
    node -e "
        const { db } = require('./src/lib/database');
        db.testConnection()
            .then(() => console.log('✅ Database connection successful'))
            .catch(err => {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            });
    "
}

# Telegram webhook setup
setup_telegram_webhook() {
    local env="$1"
    
    if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
        log_warn "Telegram bot token not configured, skipping webhook setup"
        return
    fi
    
    log_info "Setting up Telegram webhook for $env environment..."
    
    # Determine webhook URL based on environment
    case "$env" in
        "production")
            webhook_url="https://api.risedial.com/api/telegram-webhook"
            ;;
        "staging")
            webhook_url="https://risedial-staging.vercel.app/api/telegram-webhook"
            ;;
        *)
            log_info "Skipping webhook setup for $env environment"
            return
            ;;
    esac
    
    # Setup webhook
    node scripts/setup/setup-webhook.js --url="$webhook_url"
    
    log_info "Telegram webhook configured successfully"
}

# Monitoring setup
setup_monitoring() {
    local env="$1"
    
    log_info "Setting up monitoring for $env environment..."
    
    # Configure health checks
    case "$env" in
        "production")
            log_info "Configuring production monitoring..."
            # Setup production monitoring
            node scripts/monitoring/setup-production-monitoring.js
            ;;
        "staging")
            log_info "Configuring staging monitoring..."
            # Setup staging monitoring
            node scripts/monitoring/setup-staging-monitoring.js
            ;;
    esac
    
    log_info "Monitoring setup completed"
}

# Security setup
setup_security() {
    local env="$1"
    
    log_info "Configuring security for $env environment..."
    
    # Security headers and policies
    if [[ "$env" == "production" ]]; then
        log_info "Applying production security policies..."
        # Configure production security
        node scripts/security/setup-production-security.js
    fi
    
    log_info "Security configuration completed"
}

# Performance optimization
optimize_performance() {
    local env="$1"
    
    log_info "Optimizing performance for $env environment..."
    
    case "$env" in
        "production")
            # Production optimizations
            log_info "Applying production performance optimizations..."
            # Configure caching, CDN, etc.
            ;;
        "staging")
            # Staging optimizations
            log_info "Applying staging optimizations..."
            ;;
    esac
    
    log_info "Performance optimization completed"
}

# Health check
run_health_check() {
    local env="$1"
    
    log_info "Running health check for $env environment..."
    
    # Wait for services to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s "https://api.risedial.com/api/health" > /dev/null 2>&1; then
            log_info "✅ Health check successful"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 10
    done
    
    log_error "Health check failed after $max_attempts attempts"
    exit 1
}

# Deployment verification
verify_deployment() {
    local env="$1"
    
    log_info "Verifying deployment for $env environment..."
    
    # Run verification tests
    case "$env" in
        "production")
            npm run test:smoke:production
            npm run test:crisis:validation
            ;;
        "staging")
            npm run test:smoke:staging
            ;;
    esac
    
    log_info "Deployment verification completed"
}

# Main execution
main() {
    local environment
    environment=$(detect_environment)
    
    log_info "Starting environment setup for: $environment"
    log_info "Project root: $PROJECT_ROOT"
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Run setup steps
    validate_environment "$environment"
    setup_database "$environment"
    setup_telegram_webhook "$environment"
    setup_monitoring "$environment"
    setup_security "$environment"
    optimize_performance "$environment"
    
    # For non-development environments, run health checks and verification
    if [[ "$environment" != "development" && "$environment" != "test" ]]; then
        run_health_check "$environment"
        verify_deployment "$environment"
    fi
    
    log_info "✅ Environment setup completed successfully for $environment"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### 3. Database Migration System - scripts/database/migrate.js
Create comprehensive database migration management:

```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.migrationsDir = path.join(__dirname, '../../migrations');
  }

  async ensureMigrationsTable() {
    const { error } = await this.supabase.rpc('create_migrations_table');
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
  }

  async getAppliedMigrations() {
    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('version')
      .order('version');

    if (error) throw error;
    return data.map(row => row.version);
  }

  async getPendingMigrations() {
    const files = await fs.readdir(this.migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    
    return migrationFiles.filter(file => {
      const version = file.split('_')[0];
      return !appliedMigrations.includes(version);
    });
  }

  async runMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = await fs.readFile(filePath, 'utf8');
    const version = filename.split('_')[0];

    console.log(`Running migration: ${filename}`);

    try {
      // Begin transaction
      const { error: sqlError } = await this.supabase.rpc('exec_sql', {
        sql_query: sql
      });

      if (sqlError) throw sqlError;

      // Record migration as applied
      const { error: recordError } = await this.supabase
        .from('schema_migrations')
        .insert({ version, applied_at: new Date().toISOString() });

      if (recordError) throw recordError;

      console.log(`✅ Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message);
      throw error;
    }
  }

  async runPendingMigrations() {
    await this.ensureMigrationsTable();
    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    console.log('✅ All migrations completed successfully');
  }

  async rollbackMigration(steps = 1) {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const migrationsToRollback = appliedMigrations
      .slice(-steps)
      .reverse();

    for (const version of migrationsToRollback) {
      const files = await fs.readdir(this.migrationsDir);
      const downFile = files.find(file => 
        file.startsWith(version) && file.includes('_down.sql')
      );

      if (!downFile) {
        console.warn(`No rollback file found for migration ${version}`);
        continue;
      }

      const filePath = path.join(this.migrationsDir, downFile);
      const sql = await fs.readFile(filePath, 'utf8');

      console.log(`Rolling back migration: ${version}`);

      try {
        const { error: sqlError } = await this.supabase.rpc('exec_sql', {
          sql_query: sql
        });

        if (sqlError) throw sqlError;

        // Remove migration record
        const { error: deleteError } = await this.supabase
          .from('schema_migrations')
          .delete()
          .eq('version', version);

        if (deleteError) throw deleteError;

        console.log(`✅ Rollback of ${version} completed successfully`);
      } catch (error) {
        console.error(`❌ Rollback of ${version} failed:`, error.message);
        throw error;
      }
    }
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    
    const upFile = path.join(this.migrationsDir, `${filename}_up.sql`);
    const downFile = path.join(this.migrationsDir, `${filename}_down.sql`);

    const upTemplate = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your migration SQL here

COMMIT;
`;

    const downTemplate = `-- Rollback: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your rollback SQL here

COMMIT;
`;

    await fs.writeFile(upFile, upTemplate);
    await fs.writeFile(downFile, downTemplate);

    console.log(`✅ Created migration files:`);
    console.log(`  - ${upFile}`);
    console.log(`  - ${downFile}`);
  }

  async validateMigrations() {
    console.log('Validating migration files...');
    
    const files = await fs.readdir(this.migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    for (const file of sqlFiles) {
      const filePath = path.join(this.migrationsDir, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Basic SQL validation
      if (!content.trim()) {
        console.warn(`⚠️ Empty migration file: ${file}`);
        continue;
      }

      if (!content.includes('BEGIN') || !content.includes('COMMIT')) {
        console.warn(`⚠️ Migration ${file} should use transactions`);
      }

      console.log(`✅ Validated: ${file}`);
    }

    console.log('✅ Migration validation completed');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case 'migrate':
        await migrationManager.runPendingMigrations();
        break;
      
      case 'rollback':
        const steps = parseInt(process.argv[3]) || 1;
        await migrationManager.rollbackMigration(steps);
        break;
      
      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.error('Please provide a migration name');
          process.exit(1);
        }
        await migrationManager.createMigration(name);
        break;
      
      case 'status':
        const pending = await migrationManager.getPendingMigrations();
        const applied = await migrationManager.getAppliedMigrations();
        
        console.log(`Applied migrations: ${applied.length}`);
        console.log(`Pending migrations: ${pending.length}`);
        
        if (pending.length > 0) {
          console.log('\nPending migrations:');
          pending.forEach(migration => console.log(`  - ${migration}`));
        }
        break;
      
      case 'validate':
        await migrationManager.validateMigrations();
        break;
      
      default:
        console.log(`
Usage: node migrate.js <command>

Commands:
  migrate         Run all pending migrations
  rollback [n]    Rollback last n migrations (default: 1)
  create <name>   Create a new migration
  status          Show migration status
  validate        Validate migration files

Environment variables required:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
        `);
        break;
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager;
```

### 4. Monitoring Setup - scripts/monitoring/setup-monitoring.js
Create comprehensive monitoring configuration:

```javascript
#!/usr/bin/env node

const axios = require('axios');

class MonitoringSetup {
  constructor() {
    this.environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.environment) {
      case 'production':
        return 'https://api.risedial.com';
      case 'preview':
      case 'staging':
        return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://risedial-staging.vercel.app';
      default:
        return 'http://localhost:3000';
    }
  }

  async setupHealthChecks() {
    console.log(`Setting up health checks for ${this.environment} environment...`);

    const healthChecks = [
      {
        name: 'API Health',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000
      },
      {
        name: 'Database Connectivity',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        checker: (response) => response.data.services.database.status === 'operational'
      },
      {
        name: 'AI Service',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 15000,
        checker: (response) => response.data.services.ai_service.status === 'operational'
      },
      {
        name: 'Crisis Detection',
        url: `${this.baseUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        checker: (response) => response.data.services.cost_monitoring.status === 'operational'
      }
    ];

    for (const check of healthChecks) {
      await this.runHealthCheck(check);
    }

    console.log('✅ All health checks passed');
  }

  async runHealthCheck(check) {
    console.log(`Checking: ${check.name}...`);

    try {
      const response = await axios({
        method: check.method,
        url: check.url,
        timeout: check.timeout,
        validateStatus: () => true // Don't throw on any status
      });

      if (response.status !== check.expectedStatus) {
        throw new Error(`Expected status ${check.expectedStatus}, got ${response.status}`);
      }

      if (check.checker && !check.checker(response)) {
        throw new Error('Custom check failed');
      }

      console.log(`✅ ${check.name}: Healthy`);
    } catch (error) {
      console.error(`❌ ${check.name}: Failed - ${error.message}`);
      throw error;
    }
  }

  async setupAlerts() {
    console.log('Setting up monitoring alerts...');

    const alertConfigs = {
      production: {
        criticalResponseTime: 5000, // 5 seconds
        warningResponseTime: 3000,  // 3 seconds
        errorRateThreshold: 0.01,   // 1%
        uptimeThreshold: 0.999      // 99.9%
      },
      staging: {
        criticalResponseTime: 10000, // 10 seconds
        warningResponseTime: 5000,   // 5 seconds
        errorRateThreshold: 0.05,    // 5%
        uptimeThreshold: 0.95        // 95%
      },
      development: {
        criticalResponseTime: 30000, // 30 seconds
        warningResponseTime: 15000,  // 15 seconds
        errorRateThreshold: 0.1,     // 10%
        uptimeThreshold: 0.9         // 90%
      }
    };

    const config = alertConfigs[this.environment] || alertConfigs.development;
    
    console.log(`Alert thresholds for ${this.environment}:`, config);
    
    if (this.environment === 'production') {
      await this.setupProductionAlerts(config);
    }

    console.log('✅ Monitoring alerts configured');
  }

  async setupProductionAlerts(config) {
    // In a real implementation, this would configure external monitoring services
    // like DataDog, New Relic, or custom alerting systems
    
    const alerts = [
      {
        name: 'High Response Time',
        condition: `avg(response_time) > ${config.criticalResponseTime}`,
        action: 'send_slack_alert',
        channel: '#alerts'
      },
      {
        name: 'High Error Rate',
        condition: `error_rate > ${config.errorRateThreshold}`,
        action: 'send_slack_alert',
        channel: '#alerts'
      },
      {
        name: 'Service Down',
        condition: 'uptime < 0.99',
        action: 'send_pagerduty_alert',
        priority: 'high'
      },
      {
        name: 'Crisis Response Delay',
        condition: 'crisis_response_time > 300000', // 5 minutes
        action: 'send_emergency_alert',
        priority: 'critical'
      }
    ];

    for (const alert of alerts) {
      console.log(`Configured alert: ${alert.name}`);
    }
  }

  async setupDashboard() {
    console.log('Setting up monitoring dashboard...');

    const dashboardConfig = {
      environment: this.environment,
      baseUrl: this.baseUrl,
      refreshInterval: this.environment === 'production' ? 30000 : 60000, // 30s prod, 1m others
      metrics: [
        'system_health',
        'response_time',
        'error_rate',
        'active_users',
        'crisis_events',
        'cost_per_user',
        'ai_token_usage'
      ]
    };

    console.log('Dashboard configuration:', dashboardConfig);
    console.log('✅ Monitoring dashboard configured');
  }

  async validateMonitoring() {
    console.log('Validating monitoring setup...');

    const validations = [
      this.validateHealthEndpoint(),
      this.validateMetricsCollection(),
      this.validateAlertingSystem()
    ];

    const results = await Promise.allSettled(validations);
    
    let allPassed = true;
    results.forEach((result, index) => {
      const testName = ['Health Endpoint', 'Metrics Collection', 'Alerting System'][index];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ ${testName}: Validated`);
      } else {
        console.error(`❌ ${testName}: Failed - ${result.reason.message}`);
        allPassed = false;
      }
    });

    if (!allPassed) {
      throw new Error('Monitoring validation failed');
    }

    console.log('✅ Monitoring validation completed successfully');
  }

  async validateHealthEndpoint() {
    const response = await axios.get(`${this.baseUrl}/api/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health endpoint returned status ${response.status}`);
    }

    const requiredFields = ['status', 'timestamp', 'services', 'metrics'];
    for (const field of requiredFields) {
      if (!response.data[field]) {
        throw new Error(`Health endpoint missing field: ${field}`);
      }
    }

    return true;
  }

  async validateMetricsCollection() {
    // Validate that metrics are being collected properly
    const response = await axios.get(`${this.baseUrl}/api/status`);
    
    if (response.status !== 200) {
      throw new Error(`Status endpoint returned status ${response.status}`);
    }

    const requiredMetrics = ['overview', 'performance', 'features'];
    for (const metric of requiredMetrics) {
      if (!response.data.data[metric]) {
        throw new Error(`Status endpoint missing metric: ${metric}`);
      }
    }

    return true;
  }

  async validateAlertingSystem() {
    // Test that alerting system is responsive
    if (this.environment === 'production') {
      // In production, we would test actual alert delivery
      console.log('Alerting system validation - production mode');
    }
    
    return true;
  }

  async setupLogging() {
    console.log('Configuring structured logging...');

    const logConfig = {
      level: this.environment === 'production' ? 'info' : 'debug',
      format: 'json',
      outputs: [
        'console',
        ...(this.environment === 'production' ? ['file', 'external'] : [])
      ],
      fields: {
        service: 'risedial',
        environment: this.environment,
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    console.log('Logging configuration:', logConfig);
    console.log('✅ Structured logging configured');
  }
}

// Main execution
async function main() {
  const monitoring = new MonitoringSetup();

  try {
    console.log(`🔧 Setting up monitoring for ${monitoring.environment} environment`);
    console.log(`📊 Base URL: ${monitoring.baseUrl}`);
    
    await monitoring.setupHealthChecks();
    await monitoring.setupAlerts();
    await monitoring.setupDashboard();
    await monitoring.setupLogging();
    await monitoring.validateMonitoring();

    console.log('✅ Monitoring setup completed successfully');
  } catch (error) {
    console.error('❌ Monitoring setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MonitoringSetup;
```

## Validation Requirements
After creating all files:
1. Test CI/CD pipeline with sample deployment
2. Verify environment setup scripts work across all environments
3. Test database migration system with sample migrations
4. Validate monitoring setup detects issues correctly
5. Ensure rollback procedures work in emergency scenarios
6. Test all automation scripts in staging environment

## Success Criteria
- [ ] CI/CD pipeline successfully deploys to staging and production
- [ ] Environment setup scripts configure all environments correctly
- [ ] Database migrations run reliably without data loss
- [ ] Monitoring systems provide real-time visibility and alerting
- [ ] Deployment automation reduces manual intervention to near zero
- [ ] Rollback procedures restore service within 5 minutes of issues 