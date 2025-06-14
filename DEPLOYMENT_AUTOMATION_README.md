# Risedial Deployment Automation

This document outlines the comprehensive deployment automation system for Risedial, including CI/CD pipelines, environment management, database operations, monitoring setup, and production workflows.

## 🚀 Overview

The deployment automation system provides:
- **Automated CI/CD pipeline** with GitHub Actions
- **Environment-specific configurations** for development, staging, and production
- **Database migration management** with rollback capabilities
- **Comprehensive monitoring** with health checks and alerting
- **Emergency rollback procedures** for production incidents
- **Security scanning** and vulnerability detection

## 📁 File Structure

```
.github/workflows/
├── deploy.yml                          # Main CI/CD pipeline

scripts/
├── deployment/
│   ├── setup-environments.sh           # Environment setup script
│   └── rollback.js                     # Emergency rollback manager
├── database/
│   └── migrate.js                      # Database migration system
└── monitoring/
    ├── setup-monitoring.js             # Monitoring configuration
    └── enhanced-monitoring.js          # Post-deployment monitoring

migrations/
├── 20241201000000_create_migrations_table_up.sql
└── 20241201000000_create_migrations_table_down.sql
```

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

The pipeline includes the following jobs:

1. **Test Suite** - Runs comprehensive tests including:
   - TypeScript type checking
   - ESLint code quality checks
   - Unit, integration, and crisis detection tests
   - Test coverage reporting

2. **Security Scan** - Performs security analysis:
   - Dependency vulnerability scanning
   - Hardcoded secrets detection
   - Security audit reporting

3. **Build** - Creates production-ready artifacts:
   - Next.js application build
   - Build artifact validation

4. **Deploy Staging** - Deploys to staging environment:
   - Vercel deployment
   - Smoke test execution
   - Team notifications

5. **Deploy Production** - Deploys to production:
   - Pre-deployment health checks
   - Vercel production deployment
   - Telegram webhook configuration
   - Crisis detection validation
   - Enhanced monitoring setup

6. **Emergency Rollback** - Automatic rollback on failure:
   - Previous deployment restoration
   - Emergency notifications

### Environment Variables Required

**All Environments:**
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `SLACK_WEBHOOK` - Slack notifications webhook

**Production Additional:**
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_WEBHOOK_SECRET` - Webhook security secret
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - NextAuth.js URL

## 🗄️ Database Migration System

### Commands

```bash
# Run pending migrations
npm run db:migrate

# Production migrations
npm run db:migrate:production

# Rollback migrations
npm run db:rollback

# Check migration status
npm run db:status

# Create new migration
npm run db:create "migration name"

# Validate migration files
npm run db:validate
```

### Migration Files

Migrations are stored in the `migrations/` directory with the following naming convention:
- Up migrations: `TIMESTAMP_description_up.sql`
- Down migrations: `TIMESTAMP_description_down.sql`

### Features

- **Transactional migrations** - All migrations wrapped in transactions
- **Rollback support** - Automatic rollback capability
- **Migration tracking** - Database-tracked migration history
- **Validation** - SQL syntax and structure validation

## 🌍 Environment Management

### Setup Script (`scripts/deployment/setup-environments.sh`)

Automatically configures environments based on deployment context:

```bash
# Run environment setup
npm run env:setup
```

### Environment Detection

- **Production**: `VERCEL_ENV=production`
- **Staging**: `VERCEL_ENV=preview` or `GITHUB_REF=refs/heads/staging`
- **Test**: `NODE_ENV=test`
- **Development**: Default fallback

### Configuration Steps

1. Environment variable validation
2. Database setup and migrations
3. Telegram webhook configuration
4. Monitoring system setup
5. Security policy application
6. Performance optimizations
7. Health check validation
8. Deployment verification

## 📊 Monitoring System

### Health Checks

The monitoring system performs comprehensive health checks:

```bash
# Setup monitoring
npm run monitoring:setup

# Start enhanced monitoring
npm run monitoring:enhanced --duration=24h
```

### Monitored Services

- **API Health** - Application response and availability
- **Database Connectivity** - Database connection and query performance
- **AI Service** - OpenAI API integration status
- **Crisis Detection** - Mental health response system status

### Alert Thresholds

**Production:**
- Critical response time: 5 seconds
- Warning response time: 3 seconds
- Error rate threshold: 1%
- Uptime threshold: 99.9%

**Staging:**
- Critical response time: 10 seconds
- Warning response time: 5 seconds
- Error rate threshold: 5%
- Uptime threshold: 95%

### Notifications

- **Slack Integration** - Real-time alerts to designated channels
- **Enhanced Monitoring** - Post-deployment intensive monitoring
- **Emergency Alerts** - Critical incident notifications

## 🚨 Emergency Procedures

### Automatic Rollback

The system automatically triggers rollback on:
- Deployment failures
- Health check failures
- Critical service unavailability

### Manual Rollback

```bash
# Emergency production rollback
npm run deploy:rollback --env=production
```

### Rollback Process

1. Identify previous stable deployment
2. Promote previous deployment to production
3. Verify rollback success
4. Notify stakeholders
5. Generate incident report

## 🔒 Security Features

### Automated Security Scanning

- **Dependency Auditing** - Regular vulnerability scanning
- **Secret Detection** - Hardcoded credential detection
- **Security Headers** - Production security policy enforcement

### Security Policies

- **Production Security** - Enhanced security headers and CSP
- **Environment Isolation** - Separate security contexts per environment
- **Access Control** - Role-based deployment permissions

## 📝 Usage Instructions

### Initial Setup

1. **Configure Environment Variables**
   ```bash
   # Required for all environments
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   OPENAI_API_KEY=your_openai_key
   ```

2. **Setup Database**
   ```bash
   npm run db:migrate
   ```

3. **Configure Monitoring**
   ```bash
   npm run monitoring:setup
   ```

### Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   npm run test
   ```

2. **Pre-deployment Checks**
   ```bash
   npm run pre-deploy:local
   ```

3. **Push to Staging**
   ```bash
   git push origin staging
   ```

4. **Production Deployment**
   ```bash
   git push origin main
   ```

### Monitoring and Maintenance

1. **Check System Health**
   ```bash
   curl https://api.risedial.com/api/health
   ```

2. **Monitor Database Status**
   ```bash
   npm run db:status
   ```

3. **View Deployment Logs**
   - Check GitHub Actions workflow logs
   - Monitor Slack deployment channels

## 🛠️ Troubleshooting

### Common Issues

**Deployment Failures:**
- Check environment variables are set
- Verify database connectivity
- Review GitHub Actions logs

**Migration Failures:**
- Validate SQL syntax
- Check database permissions
- Review migration dependencies

**Monitoring Alerts:**
- Investigate health check endpoints
- Check service dependencies
- Review error logs

### Support Contacts

- **Development Team**: `#engineering` Slack channel
- **DevOps**: `#deployments` Slack channel
- **Emergency**: `#alerts` Slack channel + `@oncall`

## 📈 Performance Metrics

The system tracks and reports on:
- Deployment success rate
- Average deployment time
- System uptime and availability
- Response time metrics
- Error rates and incident frequency

## 🔄 Continuous Improvement

Regular reviews and updates include:
- Performance optimization
- Security policy updates
- Monitoring threshold adjustments
- Process refinement based on incident learnings

---

For detailed technical documentation and API references, see the individual script files and their inline documentation. 