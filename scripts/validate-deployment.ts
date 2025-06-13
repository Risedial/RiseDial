#!/usr/bin/env ts-node

/**
 * Pre-deployment validation script
 * Checks environment variables and configuration before deployment
 */

const { createClient } = require('@supabase/supabase-js');

interface ValidationResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

class DeploymentValidator {
  private results: ValidationResult[] = [];

  private addResult(passed: boolean, message: string, severity: 'error' | 'warning' | 'info' = 'error') {
    this.results.push({ passed, message, severity });
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(): void {
    console.log('🔍 Validating environment variables...');
    
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'TELEGRAM_BOT_TOKEN'
    ];

    const optionalEnvVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'TELEGRAM_WEBHOOK_SECRET',
      'NODE_ENV'
    ];

    // Check required environment variables
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.addResult(false, `Missing required environment variable: ${envVar}`, 'error');
      } else if (value.length < 10) {
        this.addResult(false, `Environment variable ${envVar} appears to be too short`, 'warning');
      } else {
        this.addResult(true, `Environment variable ${envVar} is present`, 'info');
      }
    }

    // Check optional environment variables
    for (const envVar of optionalEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.addResult(true, `Optional environment variable ${envVar} is not set`, 'warning');
      } else {
        this.addResult(true, `Optional environment variable ${envVar} is present`, 'info');
      }
    }

    // Validate URL formats
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
      this.addResult(false, 'SUPABASE_URL must start with https://', 'error');
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      this.addResult(false, `NODE_ENV has unexpected value: ${process.env.NODE_ENV}`, 'warning');
    }
  }

  /**
   * Test database connection (if possible)
   */
  private async validateSupabaseConnection(): Promise<void> {
    console.log('🗄️  Testing database connection...');
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        this.addResult(false, 'Cannot test Supabase connection: missing credentials', 'error');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection with a simple query
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        this.addResult(false, `Supabase connection failed: ${error.message}`, 'error');
      } else {
        this.addResult(true, 'Supabase connection successful', 'info');
      }
    } catch (error) {
      this.addResult(false, `Supabase validation error: ${error}`, 'error');
    }
  }

  /**
   * Validate Node.js version
   */
  private validateNodeVersion(): void {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.addResult(false, `Node.js version ${nodeVersion} is not supported. Minimum required: 18.x`, 'error');
    } else {
      this.addResult(true, `Node.js version ${nodeVersion} is supported`, 'info');
    }
  }

  /**
   * Validate package.json configuration
   */
  private validatePackageJson(): void {
    console.log('📦 Validating package.json...');
    
    try {
      const packageJson = require('../package.json');
      
      // Check for required scripts
      const requiredScripts = ['build', 'start', 'dev'];
      for (const script of requiredScripts) {
        if (packageJson.scripts[script]) {
          this.addResult(true, `Required script '${script}' is present`, 'info');
        } else {
          this.addResult(false, `Missing required script: ${script}`, 'error');
        }
      }

      // Check for required dependencies
      const requiredDeps = ['next', 'react', 'react-dom'];
      for (const dep of requiredDeps) {
        if (packageJson.dependencies[dep]) {
          this.addResult(true, `Required dependency '${dep}' is present`, 'info');
        } else {
          this.addResult(false, `Missing required dependency: ${dep}`, 'error');
        }
      }

      // Check Node.js version
      if (packageJson.engines && packageJson.engines.node) {
        this.addResult(true, `Node.js version specified: ${packageJson.engines.node}`, 'info');
      } else {
        this.addResult(false, 'Node.js version not specified in package.json engines', 'warning');
      }

    } catch (error) {
      this.addResult(false, `Failed to validate package.json: ${error}`, 'error');
    }
  }

  /**
   * Run all validations
   */
  public async validate(): Promise<boolean> {
    console.log('🚀 Starting deployment validation...\n');

    this.validateEnvironmentVariables();
    this.validateNodeVersion();
    this.validatePackageJson();
    await this.validateSupabaseConnection();

    // Report results
    let hasErrors = false;
    let hasWarnings = false;

    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const severityIcon = result.severity === 'error' ? '🚨' : 
                          result.severity === 'warning' ? '⚠️' : 'ℹ️';
      
      console.log(`${icon} ${severityIcon} ${result.message}`);
      
      if (!result.passed && result.severity === 'error') {
        hasErrors = true;
      }
      if (result.severity === 'warning') {
        hasWarnings = true;
      }
    }

    console.log('\n📊 Validation Summary:');
    console.log('=' .repeat(50));
    
    if (hasErrors) {
      console.log('\n❌ Errors:');
      for (const result of this.results) {
        if (!result.passed && result.severity === 'error') {
          console.log(`  • ${result.message}`);
        }
      }
      console.log('\n❌ Deployment validation FAILED. Please fix the errors above.');
      return false;
    } else if (hasWarnings) {
      console.log('\n⚠️  Warnings:');
      for (const result of this.results) {
        if (result.severity === 'warning') {
          console.log(`  • ${result.message}`);
        }
      }
      console.log('\n⚠️  Deployment validation PASSED with warnings.');
      return true;
    } else {
      console.log('\n✅ All validations passed! Ready for deployment.');
      return true;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new DeploymentValidator();
  const result = await validator.validate();

  if (result) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
} 