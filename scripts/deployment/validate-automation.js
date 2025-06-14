#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class DeploymentAutomationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validations = [];
  }

  async validate() {
    console.log('🔍 Validating Risedial Deployment Automation System...\n');

    await this.validateFileStructure();
    await this.validatePackageScripts();
    await this.validateGitHubWorkflow();
    await this.validateMigrationSystem();
    await this.validateEnvironmentConfig();
    
    this.printResults();
    
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  async validateFileStructure() {
    console.log('📁 Validating file structure...');

    const requiredFiles = [
      '.github/workflows/deploy.yml',
      'scripts/deployment/setup-environments.sh',
      'scripts/deployment/rollback.js',
      'scripts/database/migrate.js',
      'scripts/monitoring/setup-monitoring.js',
      'scripts/monitoring/enhanced-monitoring.js',
      'migrations/20241201000000_create_migrations_table_up.sql',
      'migrations/20241201000000_create_migrations_table_down.sql',
      'DEPLOYMENT_AUTOMATION_README.md',
      'environment.example'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        this.validations.push(`✅ ${file} exists`);
      } catch (error) {
        this.errors.push(`❌ Missing required file: ${file}`);
      }
    }
  }

  async validatePackageScripts() {
    console.log('📦 Validating package.json scripts...');

    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      const requiredScripts = [
        'db:migrate',
        'db:migrate:production',
        'db:migrate:staging',
        'db:rollback',
        'db:status',
        'db:create',
        'db:validate',
        'db:setup:test',
        'db:setup:dev',
        'env:setup',
        'monitoring:setup',
        'monitoring:enhanced',
        'deploy:rollback',
        'test:smoke',
        'test:smoke:staging',
        'test:smoke:production',
        'test:crisis:production',
        'test:crisis:validation',
        'security:scan'
      ];

      for (const script of requiredScripts) {
        if (scripts[script]) {
          this.validations.push(`✅ Script '${script}' defined`);
        } else {
          this.errors.push(`❌ Missing required script: ${script}`);
        }
      }

      // Check for axios dependency
      const dependencies = packageJson.dependencies || {};
      if (dependencies.axios) {
        this.validations.push('✅ axios dependency installed');
      } else {
        this.errors.push('❌ Missing axios dependency required for monitoring');
      }

    } catch (error) {
      this.errors.push('❌ Could not read or parse package.json');
    }
  }

  async validateGitHubWorkflow() {
    console.log('🔄 Validating GitHub Actions workflow...');

    try {
      const workflowContent = await fs.readFile('.github/workflows/deploy.yml', 'utf8');

      const requiredJobs = ['test', 'security-scan', 'build', 'deploy-staging', 'deploy-production', 'rollback'];
      for (const job of requiredJobs) {
        if (workflowContent.includes(`${job}:`)) {
          this.validations.push(`✅ Job '${job}' defined in workflow`);
        } else {
          this.errors.push(`❌ Missing job in workflow: ${job}`);
        }
      }

      const requiredSteps = [
        'Checkout code',
        'Setup Node.js',
        'Install dependencies',
        'Run TypeScript checks',
        'Run linting',
        'Build application',
        'Deploy to Vercel',
        'Run smoke tests'
      ];

      for (const step of requiredSteps) {
        if (workflowContent.includes(step)) {
          this.validations.push(`✅ Step '${step}' found in workflow`);
        } else {
          this.warnings.push(`⚠️ Step '${step}' not found in workflow`);
        }
      }

    } catch (error) {
      this.errors.push('❌ Could not read GitHub Actions workflow file');
    }
  }

  async validateMigrationSystem() {
    console.log('🗄️ Validating migration system...');

    try {
      const migrateScript = await fs.readFile('scripts/database/migrate.js', 'utf8');

      const requiredClasses = ['MigrationManager'];
      for (const className of requiredClasses) {
        if (migrateScript.includes(`class ${className}`)) {
          this.validations.push(`✅ Class '${className}' found in migration script`);
        } else {
          this.errors.push(`❌ Missing class in migration script: ${className}`);
        }
      }

      const requiredMethods = [
        'runPendingMigrations',
        'rollbackMigration',
        'createMigration',
        'validateMigrations'
      ];

      for (const method of requiredMethods) {
        if (migrateScript.includes(method)) {
          this.validations.push(`✅ Method '${method}' found in migration system`);
        } else {
          this.errors.push(`❌ Missing method in migration system: ${method}`);
        }
      }

      // Check migration files
      const migrationFiles = await fs.readdir('migrations');
      const upMigrations = migrationFiles.filter(f => f.endsWith('_up.sql'));
      const downMigrations = migrationFiles.filter(f => f.endsWith('_down.sql'));

      if (upMigrations.length > 0) {
        this.validations.push(`✅ Found ${upMigrations.length} up migration(s)`);
      } else {
        this.warnings.push('⚠️ No up migrations found');
      }

      if (downMigrations.length > 0) {
        this.validations.push(`✅ Found ${downMigrations.length} down migration(s)`);
      } else {
        this.warnings.push('⚠️ No down migrations found');
      }

    } catch (error) {
      this.errors.push('❌ Could not validate migration system');
    }
  }

  async validateEnvironmentConfig() {
    console.log('🌍 Validating environment configuration...');

    try {
      const envExample = await fs.readFile('environment.example', 'utf8');

      const requiredVars = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'TELEGRAM_BOT_TOKEN',
        'VERCEL_TOKEN',
        'VERCEL_ORG_ID',
        'VERCEL_PROJECT_ID',
        'SLACK_WEBHOOK'
      ];

      for (const varName of requiredVars) {
        if (envExample.includes(varName)) {
          this.validations.push(`✅ Environment variable '${varName}' documented`);
        } else {
          this.errors.push(`❌ Missing environment variable in example: ${varName}`);
        }
      }

    } catch (error) {
      this.errors.push('❌ Could not read environment example file');
    }

    // Check setup script
    try {
      const setupScript = await fs.readFile('scripts/deployment/setup-environments.sh', 'utf8');

      const requiredFunctions = [
        'detect_environment',
        'validate_environment',
        'setup_database',
        'setup_telegram_webhook',
        'setup_monitoring'
      ];

      for (const func of requiredFunctions) {
        if (setupScript.includes(func)) {
          this.validations.push(`✅ Function '${func}' found in setup script`);
        } else {
          this.errors.push(`❌ Missing function in setup script: ${func}`);
        }
      }

    } catch (error) {
      this.errors.push('❌ Could not validate environment setup script');
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (this.validations.length > 0) {
      console.log('\n✅ PASSED VALIDATIONS:');
      this.validations.forEach(validation => console.log(`  ${validation}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 SUMMARY: ${this.validations.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`);
    console.log('='.repeat(60));

    if (this.errors.length === 0) {
      console.log('\n🎉 Deployment automation system validation PASSED!');
      console.log('Your system is ready for automated deployments.');
    } else {
      console.log('\n🚨 Deployment automation system validation FAILED!');
      console.log('Please fix the errors above before proceeding with deployments.');
    }
  }
}

// Main execution
async function main() {
  const validator = new DeploymentAutomationValidator();
  await validator.validate();
}

if (require.main === module) {
  main();
}

module.exports = DeploymentAutomationValidator; 