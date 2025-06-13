#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface DeploymentValidation {
  environment: string;
  timestamp: string;
  validations: ValidationResult[];
  passed: boolean;
  errors: string[];
  warnings: string[];
}

class PreDeployValidator {
  private results: ValidationResult[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  async runValidation(): Promise<DeploymentValidation> {
    console.log('🚀 Starting pre-deployment validation...\n');

    // Core validations
    await this.validateEnvironment();
    await this.validateTypeScript();
    await this.validateDependencies();
    await this.validateBuildProcess();
    await this.validateAPIEndpoints();
    await this.validateConfiguration();
    await this.validateSecurity();

    const passed = this.results.every(r => r.passed) && this.errors.length === 0;
    
    const validation: DeploymentValidation = {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      validations: this.results,
      passed,
      errors: this.errors,
      warnings: this.warnings
    };

    this.printResults(validation);
    
    if (!passed) {
      process.exit(1);
    }

    return validation;
  }

  private addResult(name: string, passed: boolean, message: string, details?: any): void {
    this.results.push({ name, passed, message, details });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}: ${message}`);
    
    if (details && !passed) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('📋 Validating environment configuration...');
    
    try {
      const requiredEnvVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        this.addResult(
          'Environment Variables',
          false,
          `Missing required environment variables: ${missingVars.join(', ')}`
        );
        this.errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
      } else {
        this.addResult('Environment Variables', true, 'All required environment variables are present');
      }

      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.addResult('Node.js Version', true, `Node.js ${nodeVersion} is compatible`);
      } else {
        this.addResult('Node.js Version', false, `Node.js ${nodeVersion} is not supported. Requires >= 18.0.0`);
        this.errors.push(`Unsupported Node.js version: ${nodeVersion}`);
      }

    } catch (error) {
      this.addResult('Environment Validation', false, `Environment validation failed: ${error}`);
      this.errors.push(`Environment validation error: ${error}`);
    }
  }

  private async validateTypeScript(): Promise<void> {
    console.log('📝 Validating TypeScript configuration...');
    
    try {
      // Check TypeScript configuration
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      if (!existsSync(tsconfigPath)) {
        this.addResult('TypeScript Config', false, 'tsconfig.json not found');
        this.errors.push('Missing tsconfig.json');
        return;
      }

      // Validate TypeScript compilation
      try {
        execSync('npx tsc --noEmit --skipLibCheck', { 
          stdio: 'pipe',
          timeout: 60000 
        });
        this.addResult('TypeScript Compilation', true, 'TypeScript compilation successful');
      } catch (error) {
        this.addResult('TypeScript Compilation', false, 'TypeScript compilation failed');
        this.errors.push(`TypeScript compilation error: ${error}`);
      }

      // Check for TypeScript dependencies
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const hasTypesReact = packageJson.dependencies?.['@types/react'] || packageJson.devDependencies?.['@types/react'];
      const hasTypesNode = packageJson.dependencies?.['@types/node'] || packageJson.devDependencies?.['@types/node'];
      
      if (hasTypesReact && hasTypesNode) {
        this.addResult('TypeScript Dependencies', true, 'All TypeScript dependencies are present');
      } else {
        const missing = [];
        if (!hasTypesReact) missing.push('@types/react');
        if (!hasTypesNode) missing.push('@types/node');
        
        this.addResult('TypeScript Dependencies', false, `Missing TypeScript dependencies: ${missing.join(', ')}`);
        this.errors.push(`Missing TypeScript dependencies: ${missing.join(', ')}`);
      }

    } catch (error) {
      this.addResult('TypeScript Validation', false, `TypeScript validation failed: ${error}`);
      this.errors.push(`TypeScript validation error: ${error}`);
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('📦 Validating dependencies...');
    
    try {
      // Check for package-lock.json
      if (existsSync('package-lock.json')) {
        this.addResult('Package Lock', true, 'package-lock.json exists');
      } else {
        this.addResult('Package Lock', false, 'package-lock.json not found');
        this.warnings.push('Missing package-lock.json - this may cause dependency version issues');
      }

      // Check for npm audit issues
      try {
        const auditResult = execSync('npm audit --audit-level=moderate --json', { 
          stdio: 'pipe',
          timeout: 30000 
        });
        const audit = JSON.parse(auditResult.toString());
        
        if (audit.metadata.vulnerabilities.total === 0) {
          this.addResult('Security Audit', true, 'No security vulnerabilities found');
        } else {
          const { high, critical } = audit.metadata.vulnerabilities;
          if (high > 0 || critical > 0) {
            this.addResult('Security Audit', false, `Found ${high} high and ${critical} critical vulnerabilities`);
            this.errors.push(`Security vulnerabilities found: ${high} high, ${critical} critical`);
          } else {
            this.addResult('Security Audit', true, 'Only low/moderate vulnerabilities found');
            this.warnings.push('Some low/moderate security vulnerabilities exist');
          }
        }
      } catch (error) {
        this.addResult('Security Audit', false, 'npm audit failed');
        this.warnings.push('Could not run security audit');
      }

    } catch (error) {
      this.addResult('Dependencies Validation', false, `Dependencies validation failed: ${error}`);
      this.errors.push(`Dependencies validation error: ${error}`);
    }
  }

  private async validateBuildProcess(): Promise<void> {
    console.log('🔨 Validating build process...');
    
    try {
      // Test build process
      console.log('   Running build test...');
      execSync('npm run build', { 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
      
      this.addResult('Build Process', true, 'Build completed successfully');

      // Check build output
      const buildOutputPath = join(process.cwd(), '.next');
      if (existsSync(buildOutputPath)) {
        this.addResult('Build Output', true, 'Build output directory exists');
      } else {
        this.addResult('Build Output', false, 'Build output directory not found');
        this.errors.push('Build output directory missing');
      }

    } catch (error) {
      this.addResult('Build Process', false, 'Build process failed');
      this.errors.push(`Build process error: ${error}`);
    }
  }

  private async validateAPIEndpoints(): Promise<void> {
    console.log('🌐 Validating API endpoints...');
    
    try {
      const requiredEndpoints = [
        'src/app/api/health/route.ts',
        'src/app/api/metrics/route.ts'
      ];

      for (const endpoint of requiredEndpoints) {
        if (existsSync(endpoint)) {
          this.addResult(`API Endpoint: ${endpoint}`, true, 'Endpoint file exists');
        } else {
          this.addResult(`API Endpoint: ${endpoint}`, false, 'Endpoint file missing');
          this.errors.push(`Missing API endpoint: ${endpoint}`);
        }
      }

    } catch (error) {
      this.addResult('API Endpoints Validation', false, `API endpoints validation failed: ${error}`);
      this.errors.push(`API endpoints validation error: ${error}`);
    }
  }

  private async validateConfiguration(): Promise<void> {
    console.log('⚙️ Validating configuration files...');
    
    try {
      const configFiles = [
        'next.config.js',
        'vercel.json',
        'tsconfig.json'
      ];

      for (const configFile of configFiles) {
        if (existsSync(configFile)) {
          this.addResult(`Config: ${configFile}`, true, 'Configuration file exists');
          
          // Basic syntax validation for JSON files
          if (configFile.endsWith('.json')) {
            try {
              JSON.parse(readFileSync(configFile, 'utf8'));
              this.addResult(`Config Syntax: ${configFile}`, true, 'Valid JSON syntax');
            } catch (error) {
              this.addResult(`Config Syntax: ${configFile}`, false, 'Invalid JSON syntax');
              this.errors.push(`Invalid JSON syntax in ${configFile}`);
            }
          }
        } else {
          this.addResult(`Config: ${configFile}`, false, 'Configuration file missing');
          this.errors.push(`Missing configuration file: ${configFile}`);
        }
      }

    } catch (error) {
      this.addResult('Configuration Validation', false, `Configuration validation failed: ${error}`);
      this.errors.push(`Configuration validation error: ${error}`);
    }
  }

  private async validateSecurity(): Promise<void> {
    console.log('🔒 Validating security configuration...');
    
    try {
      // Check for sensitive files
      const sensitiveFiles = [
        '.env.local',
        '.env.production',
        'private.key',
        'secrets.json'
      ];

      let sensitivFilesInRepo = false;
      for (const file of sensitiveFiles) {
        if (existsSync(file)) {
          this.warnings.push(`Sensitive file found in repository: ${file}`);
          sensitivFilesInRepo = true;
        }
      }

      if (!sensitivFilesInRepo) {
        this.addResult('Sensitive Files', true, 'No sensitive files found in repository');
      } else {
        this.addResult('Sensitive Files', false, 'Sensitive files found in repository');
      }

      // Check .gitignore
      if (existsSync('.gitignore')) {
        const gitignore = readFileSync('.gitignore', 'utf8');
        const hasEnvIgnore = gitignore.includes('.env') || gitignore.includes('*.env*');
        const hasNodeModulesIgnore = gitignore.includes('node_modules');
        
        if (hasEnvIgnore && hasNodeModulesIgnore) {
          this.addResult('Git Ignore', true, 'Essential files are properly ignored');
        } else {
          this.addResult('Git Ignore', false, 'Git ignore is missing essential entries');
          this.warnings.push('Consider adding .env* and node_modules to .gitignore');
        }
      } else {
        this.addResult('Git Ignore', false, '.gitignore file not found');
        this.warnings.push('Missing .gitignore file');
      }

    } catch (error) {
      this.addResult('Security Validation', false, `Security validation failed: ${error}`);
      this.errors.push(`Security validation error: ${error}`);
    }
  }

  private printResults(validation: DeploymentValidation): void {
    console.log('\n📊 Pre-deployment Validation Summary');
    console.log('=====================================');
    console.log(`Environment: ${validation.environment}`);
    console.log(`Timestamp: ${validation.timestamp}`);
    console.log(`Overall Status: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    const passedCount = validation.validations.filter(v => v.passed).length;
    const totalCount = validation.validations.length;
    console.log(`Validations: ${passedCount}/${totalCount} passed`);
    
    if (validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      validation.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n=====================================');
    
    if (validation.passed) {
      console.log('🎉 Ready for deployment!');
    } else {
      console.log('🚨 Please fix the errors above before deploying.');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PreDeployValidator();
  validator.runValidation().catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

export { PreDeployValidator };
export type { ValidationResult, DeploymentValidation }; 