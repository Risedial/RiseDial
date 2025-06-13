#!/usr/bin/env ts-node

/**
 * Pre-deployment validation script
 * Checks environment variables and configuration before deployment
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

class DeploymentValidator {
  private result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  };

  private addError(message: string): void {
    this.result.errors.push(message);
    this.result.passed = false;
  }

  private addWarning(message: string): void {
    this.result.warnings.push(message);
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(): void {
    console.log('🔍 Validating environment variables...');
    
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const optionalEnvVars = [
      'NEXT_PUBLIC_API_BASE_URL',
      'NODE_ENV'
    ];

    // Check required variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.addError(`Missing required environment variable: ${envVar}`);
      } else {
        console.log(`✅ ${envVar} is set`);
      }
    }

    // Check optional variables
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        this.addWarning(`Optional environment variable not set: ${envVar}`);
      } else {
        console.log(`✅ ${envVar} is set`);
      }
    }

    // Validate URL formats
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
      this.addError('SUPABASE_URL must start with https://');
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      this.addWarning(`NODE_ENV has unexpected value: ${process.env.NODE_ENV}`);
    }
  }

  /**
   * Validate file structure
   */
  private validateFileStructure(): void {
    console.log('📁 Validating file structure...');
    
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'vercel.json',
      'src/lib/env.ts',
      'src/lib/supabase-client.ts',
      'src/lib/config.ts',
      'src/lib/database.ts'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        this.addError(`Missing required file: ${file}`);
      } else {
        console.log(`✅ ${file} exists`);
      }
    }
  }

  /**
   * Validate package.json configuration
   */
  private validatePackageJson(): void {
    console.log('📦 Validating package.json...');
    
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      // Check required scripts
      const requiredScripts = ['build', 'start', 'dev'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          this.addError(`Missing required script in package.json: ${script}`);
        } else {
          console.log(`✅ Script '${script}' is defined`);
        }
      }

      // Check dependencies
      const requiredDeps = ['next', 'react', '@supabase/supabase-js'];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          this.addError(`Missing required dependency: ${dep}`);
        } else {
          console.log(`✅ Dependency '${dep}' is installed`);
        }
      }

      // Check Node.js version
      if (packageJson.engines && packageJson.engines.node) {
        console.log(`✅ Node.js version specified: ${packageJson.engines.node}`);
      } else {
        this.addWarning('Node.js version not specified in package.json engines');
      }

    } catch (error) {
      this.addError('Failed to parse package.json');
    }
  }

  /**
   * Validate Next.js configuration
   */
  private validateNextConfig(): void {
    console.log('⚙️  Validating Next.js configuration...');
    
    try {
      // Check if next.config.js exists and is valid
      require(join(process.cwd(), 'next.config.js'));
      console.log('✅ next.config.js is valid');
    } catch (error) {
      this.addError('Invalid next.config.js configuration');
    }
  }

  /**
   * Validate Vercel configuration
   */
  private validateVercelConfig(): void {
    console.log('🚀 Validating Vercel configuration...');
    
    try {
      const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
      
      // Check framework
      if (vercelConfig.framework !== 'nextjs') {
        this.addWarning('Vercel framework should be set to "nextjs"');
      } else {
        console.log('✅ Vercel framework is set to nextjs');
      }

      // Check build command
      if (vercelConfig.buildCommand) {
        console.log(`✅ Build command: ${vercelConfig.buildCommand}`);
      }

      // Check functions configuration
      if (vercelConfig.functions) {
        console.log('✅ Functions configuration found');
      }

    } catch (error) {
      this.addError('Failed to parse vercel.json');
    }
  }

  /**
   * Test database connection (if possible)
   */
  private async testDatabaseConnection(): Promise<void> {
    console.log('🗄️  Testing database connection...');
    
    try {
      // Only test if all required env vars are present
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Simple test query
        const { error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
          this.addWarning(`Database connection test failed: ${error.message}`);
        } else {
          console.log('✅ Database connection successful');
        }
      } else {
        this.addWarning('Skipping database connection test due to missing environment variables');
      }
    } catch (error) {
      this.addWarning(`Database connection test failed: ${error}`);
    }
  }

  /**
   * Run all validations
   */
  public async validate(): Promise<ValidationResult> {
    console.log('🚀 Starting deployment validation...\n');

    this.validateEnvironmentVariables();
    this.validateFileStructure();
    this.validatePackageJson();
    this.validateNextConfig();
    this.validateVercelConfig();
    await this.testDatabaseConnection();

    return this.result;
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new DeploymentValidator();
  const result = await validator.validate();

  console.log('\n📊 Validation Summary:');
  console.log('=' .repeat(50));

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  if (result.passed) {
    console.log('\n✅ All validations passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed. Please fix the errors above before deploying.');
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

export { DeploymentValidator }; 