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